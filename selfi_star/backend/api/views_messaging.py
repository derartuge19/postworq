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
from rest_framework.decorators import api_view, permission_classes
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


# ─── Messages within a conversation ───────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversation_messages(request, conversation_id):
    conv = get_object_or_404(Conversation, id=conversation_id)
    if not conv.participants.filter(id=request.user.id).exists():
        return Response({'error': 'Not a participant'}, status=403)

    if request.method == 'GET':
        # Limit to last 100 to keep response small; client can paginate later.
        qs = conv.messages.select_related('sender', 'sender__profile').order_by('created_at')[:500]
        data = MessageSerializer(qs, many=True, context={'request': request}).data
        return Response(data)

    # POST: send a new message
    text = (request.data.get('text') or '').strip()
    if not text:
        return Response({'error': 'text is required'}, status=400)
    if len(text) > 4000:
        return Response({'error': 'text too long (max 4000 chars)'}, status=400)

    msg = Message.objects.create(conversation=conv, sender=request.user, text=text)
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
