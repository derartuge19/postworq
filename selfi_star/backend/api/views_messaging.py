"""Direct messaging views.

Endpoints:
- GET    /messages/conversations/                 list my conversations
- POST   /messages/conversations/                 create or fetch a 1-on-1 conversation (body: {user_id})
- GET    /messages/conversations/<id>/messages/   list messages (newest last)
- POST   /messages/conversations/<id>/messages/   send a message (body: {text})
- PATCH  /messages/<id>/                          edit own message within 15 min (body: {text})
- DELETE /messages/<id>/                          soft-delete own message
- POST   /messages/conversations/<id>/read/       mark conversation as read up to now
- GET    /messages/unread-count/                  total unread DM count (for badge)
- GET    /messages/users/search/?q=...            search users to start a new chat
"""
from django.contrib.auth.models import User
from django.db.models import Q, Max
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models_messaging import Conversation, Message, MessageRead
from .serializers_messaging import (
    BriefUserSerializer,
    ConversationSerializer,
    MessageSerializer,
)


# ─── Conversation list / create ───────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def list_or_create_conversations(request):
    if request.method == 'GET':
        qs = (
            request.user.conversations
            .prefetch_related('participants', 'participants__profile', 'messages')
            .order_by('-last_message_at')
        )
        data = ConversationSerializer(qs, many=True, context={'request': request}).data
        return Response(data)

    # POST: create or return an existing 1-on-1 conversation
    other_id = request.data.get('user_id')
    if not other_id:
        return Response({'error': 'user_id is required'}, status=400)
    try:
        other_id = int(other_id)
    except (TypeError, ValueError):
        return Response({'error': 'user_id must be an integer'}, status=400)
    if other_id == request.user.id:
        return Response({'error': "You can't message yourself"}, status=400)

    other = User.objects.filter(id=other_id).first()
    if not other:
        return Response({'error': 'User not found'}, status=404)

    # Find an existing 1-on-1 conversation between these two users
    existing = (
        Conversation.objects
        .filter(participants=request.user)
        .filter(participants=other)
        .distinct()
    )
    # Pick the first one where participant count is exactly 2
    for conv in existing:
        if conv.participants.count() == 2:
            data = ConversationSerializer(conv, context={'request': request}).data
            return Response(data, status=200)

    # Otherwise create a new one
    conv = Conversation.objects.create()
    conv.participants.add(request.user, other)
    data = ConversationSerializer(conv, context={'request': request}).data
    return Response(data, status=201)


def _infer_media_type(upload, explicit=None):
    """Figure out a media_type value from content-type / filename."""
    if explicit in (Message.MEDIA_IMAGE, Message.MEDIA_VIDEO,
                    Message.MEDIA_AUDIO, Message.MEDIA_FILE):
        return explicit
    ct = (getattr(upload, 'content_type', '') or '').lower()
    if ct.startswith('image/'):
        return Message.MEDIA_IMAGE
    if ct.startswith('video/'):
        return Message.MEDIA_VIDEO
    if ct.startswith('audio/'):
        return Message.MEDIA_AUDIO
    return Message.MEDIA_FILE


# Max upload size: 25 MB per message media — keeps mobile uploads reasonable.
MAX_MEDIA_BYTES = 25 * 1024 * 1024


# ─── Messages within a conversation ───────────────────────────────────────────
@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([IsAuthenticated])
def conversation_messages(request, conversation_id):
    conv = get_object_or_404(Conversation, id=conversation_id)
    if not conv.participants.filter(id=request.user.id).exists():
        return Response({'error': 'Not a participant'}, status=403)

    if request.method == 'GET':
        # Limit to last 500 to keep response small; client can paginate later.
        qs = conv.messages.select_related('sender', 'sender__profile').order_by('created_at')[:500]
        data = MessageSerializer(qs, many=True, context={'request': request}).data
        return Response(data)

    # POST: send a new message (text and/or media)
    text = (request.data.get('text') or '').strip()
    upload = request.FILES.get('media')

    if not text and not upload:
        return Response({'error': 'text or media is required'}, status=400)
    if text and len(text) > 4000:
        return Response({'error': 'text too long (max 4000 chars)'}, status=400)

    media_type = Message.MEDIA_TEXT
    media_name = ''
    media_size = None
    media_duration = None

    if upload:
        if upload.size and upload.size > MAX_MEDIA_BYTES:
            return Response(
                {'error': f'File too large (max {MAX_MEDIA_BYTES // (1024 * 1024)} MB)'},
                status=400,
            )
        explicit_type = (request.data.get('media_type') or '').strip() or None
        media_type = _infer_media_type(upload, explicit_type)
        media_name = upload.name[:255] if upload.name else ''
        media_size = upload.size or None
        # Optional client-provided duration (for voice/video)
        dur_raw = request.data.get('media_duration')
        if dur_raw not in (None, ''):
            try:
                media_duration = float(dur_raw)
            except (TypeError, ValueError):
                media_duration = None

    msg = Message.objects.create(
        conversation=conv,
        sender=request.user,
        text=text,
        media=upload if upload else None,
        media_type=media_type,
        media_name=media_name,
        media_size=media_size,
        media_duration=media_duration,
    )
    conv.last_message_at = timezone.now()
    conv.save(update_fields=['last_message_at'])

    # Sender has obviously read up to now
    MessageRead.objects.update_or_create(
        user=request.user, conversation=conv,
        defaults={'last_read_at': timezone.now()},
    )

    data = MessageSerializer(msg, context={'request': request}).data
    return Response(data, status=201)


# ─── Edit / delete own message ────────────────────────────────────────────────
@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def edit_or_delete_message(request, message_id):
    msg = get_object_or_404(Message, id=message_id)
    if msg.sender_id != request.user.id:
        return Response({'error': 'Not your message'}, status=403)

    if request.method == 'DELETE':
        msg.is_deleted = True
        msg.text = ''
        msg.save(update_fields=['is_deleted', 'text'])
        return Response({'ok': True})

    # PATCH: edit text (only within 15-minute window)
    if not msg.is_editable:
        return Response({'error': 'Edit window has expired (15 minutes)'}, status=400)
    text = (request.data.get('text') or '').strip()
    if not text:
        return Response({'error': 'text is required'}, status=400)
    if len(text) > 4000:
        return Response({'error': 'text too long'}, status=400)
    msg.text = text
    msg.edited_at = timezone.now()
    msg.save(update_fields=['text', 'edited_at'])
    data = MessageSerializer(msg, context={'request': request}).data
    return Response(data)


# ─── Mark conversation as read ────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_conversation_read(request, conversation_id):
    conv = get_object_or_404(Conversation, id=conversation_id)
    if not conv.participants.filter(id=request.user.id).exists():
        return Response({'error': 'Not a participant'}, status=403)
    MessageRead.objects.update_or_create(
        user=request.user, conversation=conv,
        defaults={'last_read_at': timezone.now()},
    )
    return Response({'ok': True})


# ─── Unread DM badge count ────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_dm_count(request):
    """Total unread messages across all my conversations (for bottom-nav badge)."""
    total = 0
    for conv in request.user.conversations.all():
        read = conv.reads.filter(user=request.user).first()
        qs = conv.messages.exclude(sender=request.user)
        if read:
            qs = qs.filter(created_at__gt=read.last_read_at)
        total += qs.count()
    return Response({'unread_count': total})


# ─── User search (for "New Message") ──────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users_for_dm(request):
    q = (request.GET.get('q') or '').strip()
    if not q:
        return Response([])
    users = (
        User.objects
        .filter(Q(username__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q))
        .exclude(id=request.user.id)
        .select_related('profile')
        [:20]
    )
    return Response(BriefUserSerializer(users, many=True).data)
