from rest_framework import serializers
from .models import Comment, CommentLike, CommentReply, SavedPost
from .serializers import UserSerializer

class CommentReplySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    is_editable = serializers.SerializerMethodField()
    
    class Meta:
        model = CommentReply
        fields = ['id', 'user', 'comment', 'text', 'created_at', 'edited_at', 'is_deleted', 'is_editable']
        read_only_fields = ['user', 'created_at', 'edited_at', 'is_deleted']
    
    def get_is_editable(self, obj):
        return obj.is_editable

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()
    replies = CommentReplySerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_editable = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'reel', 'text', 'created_at', 'edited_at', 'is_deleted', 'likes_count', 'replies_count', 'replies', 'is_liked', 'is_editable']
        read_only_fields = ['user', 'created_at', 'edited_at', 'is_deleted']
    
    def get_is_editable(self, obj):
        return obj.is_editable
    
    def get_likes_count(self, obj):
        return obj.likes_count
    
    def get_replies_count(self, obj):
        return obj.replies_count
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return CommentLike.objects.filter(user=request.user, comment=obj).exists()
        return False

class CommentLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentLike
        fields = ['id', 'user', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']

class SavedPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedPost
        fields = ['id', 'user', 'reel', 'created_at']
        read_only_fields = ['user', 'created_at']
