"""Serializers for Direct Messaging."""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models_messaging import Conversation, Message


def _profile_photo_url(user):
    try:
        pf = user.profile.profile_photo
        if pf and pf.name:
            return pf.name if pf.name.startswith('http') else pf.url
    except Exception:
        pass
    return None


class BriefUserSerializer(serializers.ModelSerializer):
    profile_photo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_photo']

    def get_profile_photo(self, obj):
        return _profile_photo_url(obj)


class MessageSerializer(serializers.ModelSerializer):
    sender = BriefUserSerializer(read_only=True)
    is_own = serializers.SerializerMethodField()
    is_editable = serializers.BooleanField(read_only=True)
    media_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'text',
            'media_url', 'media_type', 'media_name', 'media_size', 'media_duration',
            'created_at', 'edited_at', 'is_deleted',
            'is_own', 'is_editable',
        ]
        read_only_fields = [
            'id', 'sender', 'created_at', 'edited_at', 'is_deleted',
            'is_own', 'is_editable', 'conversation',
            'media_url', 'media_type', 'media_name', 'media_size', 'media_duration',
        ]

    def get_is_own(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.is_authenticated and obj.sender_id == request.user.id)

    def get_media_url(self, obj):
        if not obj.media:
            return None
        # media.name may be a full Cloudinary https URL (we store it that way
        # when uploading manually) or a relative path from FileSystemStorage.
        name = getattr(obj.media, 'name', '') or ''
        if name.startswith('http://') or name.startswith('https://'):
            return name
        try:
            url = obj.media.url
        except Exception:
            return None
        request = self.context.get('request')
        if request and not url.startswith('http'):
            return request.build_absolute_uri(url)
        return url

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Soft-deleted messages show a placeholder, not the original content
        if instance.is_deleted:
            data['text'] = ''
            data['media_url'] = None
        return data


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'other_user', 'last_message', 'unread_count', 'last_message_at', 'created_at']

    def get_other_user(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return None
        other = obj.other_participant(request.user)
        if not other:
            return None
        return BriefUserSerializer(other).data

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if not last:
            return None
        return {
            'id': last.id,
            'text': '' if last.is_deleted else last.text,
            'is_deleted': last.is_deleted,
            'sender_id': last.sender_id,
            'media_type': last.media_type,
            'created_at': last.created_at.isoformat(),
        }

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return 0
        read = obj.reads.filter(user=request.user).first()
        qs = obj.messages.exclude(sender=request.user)
        if read:
            qs = qs.filter(created_at__gt=read.last_read_at)
        return qs.count()
