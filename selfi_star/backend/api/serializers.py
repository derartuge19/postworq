from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Reel, Comment, CommentLike, CommentReply, SavedPost, Vote, Quest, UserQuest, Subscription, NotificationPreference, Competition, Winner, Follow, Report, Notification

class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    profile_photo = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'followers_count', 'following_count', 'profile_photo', 'bio', 'is_following']
    
    def get_followers_count(self, obj):
        # Use prefetched count if available
        if hasattr(obj, '_prefetched_followers_count'):
            return obj._prefetched_followers_count
        return obj.followers.count()
    
    def get_following_count(self, obj):
        if hasattr(obj, '_prefetched_following_count'):
            return obj._prefetched_following_count
        return obj.following.count()
    
    def get_profile_photo(self, obj):
        try:
            profile = obj.profile
            if profile and profile.profile_photo:
                return profile.profile_photo.url
        except UserProfile.DoesNotExist:
            pass
        return None
    
    def get_bio(self, obj):
        try:
            return obj.profile.bio
        except UserProfile.DoesNotExist:
            return ''
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'username', 'profile_photo', 'bio', 'xp', 'level', 'streak', 'last_checkin']

class ReelSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    comment_count = serializers.SerializerMethodField()
    hashtags_list = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    media = serializers.SerializerMethodField()
    
    class Meta:
        model = Reel
        fields = ['id', 'user', 'image', 'media', 'caption', 'hashtags', 'hashtags_list', 'votes', 'comment_count', 'created_at', 'is_liked', 'is_saved']
    
    def _build_url(self, field, request):
        """Build absolute URL for a file field, handling both local and Cloudinary storage."""
        try:
            if not field:
                return None
            # FieldFile.name is the raw value stored in the DB column
            name = field.name if hasattr(field, 'name') else str(field)
            if not name:
                return None
            # Value stored via raw SQL is already a full URL — return it as-is
            if name.startswith('http://') or name.startswith('https://'):
                return name
            # Value is a relative path — ask the storage backend for its URL
            url = field.url
            if not url:
                return None
            if url.startswith('http://') or url.startswith('https://'):
                return url
            # Relative URL — make absolute using request or settings fallback
            if request:
                return request.build_absolute_uri(url)
            from django.conf import settings
            base = getattr(settings, 'BACKEND_URL', 'https://postworq.onrender.com')
            return f"{base}{url}"
        except Exception:
            return None

    def get_image(self, obj):
        return self._build_url(obj.image, self.context.get('request'))

    def get_media(self, obj):
        return self._build_url(obj.media, self.context.get('request'))
    
    def get_comment_count(self, obj):
        # Use DB annotation if available (set by ReelViewSet.get_queryset)
        if hasattr(obj, 'comment_count_db'):
            return obj.comment_count_db
        return obj.comments.count()
    
    def get_hashtags_list(self, obj):
        return obj.get_hashtags_list()
    
    def get_is_liked(self, obj):
        # Use DB annotation if available (set by ReelViewSet.get_queryset)
        if hasattr(obj, 'is_liked_db'):
            return obj.is_liked_db
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import Vote
            return Vote.objects.filter(user=request.user, reel=obj).exists()
        return False
    
    def get_is_saved(self, obj):
        # Use DB annotation if available (set by ReelViewSet.get_queryset)
        if hasattr(obj, 'is_saved_db'):
            return obj.is_saved_db
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import SavedPost
            return SavedPost.objects.filter(user=request.user, reel=obj).exists()
        return False

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'reel', 'text', 'created_at']

class CommentLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentLike
        fields = ['id', 'user', 'comment', 'created_at']

class CommentReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentReply
        fields = ['id', 'user', 'comment', 'text', 'created_at']

class SavedPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedPost
        fields = ['id', 'user', 'reel', 'created_at']

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'user', 'reel', 'created_at']

class QuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quest
        fields = ['id', 'title', 'description', 'xp_reward', 'is_active']

class UserQuestSerializer(serializers.ModelSerializer):
    quest = QuestSerializer(read_only=True)
    
    class Meta:
        model = UserQuest
        fields = ['id', 'quest', 'completed', 'completed_at']

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'started_at', 'expires_at']

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['id', 'email_notifications', 'push_notifications', 'sms_notifications', 'phone']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        # Signals will handle profile creation
        return user

class CompetitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competition
        fields = ['id', 'title', 'description', 'start_date', 'end_date', 'prize', 'is_active', 'created_at']

class WinnerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    competition = CompetitionSerializer(read_only=True)
    reel = ReelSerializer(read_only=True)
    
    class Meta:
        model = Winner
        fields = ['id', 'competition', 'user', 'reel', 'votes_received', 'prize_claimed', 'announced_at']

class FollowSerializer(serializers.ModelSerializer):
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']

class ReportSerializer(serializers.ModelSerializer):
    reported_by = UserSerializer(read_only=True)
    reported_user = UserSerializer(read_only=True)
    reported_reel = ReelSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)
    # Write-only FK fields so frontend can submit IDs
    reported_user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='reported_user', write_only=True, required=False, allow_null=True
    )
    reported_reel_id = serializers.PrimaryKeyRelatedField(
        queryset=Reel.objects.all(), source='reported_reel', write_only=True, required=False, allow_null=True
    )
    reported_comment_id = serializers.PrimaryKeyRelatedField(
        queryset=Comment.objects.all(), source='reported_comment', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Report
        fields = [
            'id', 'reported_by',
            'reported_user', 'reported_user_id',
            'reported_reel', 'reported_reel_id',
            'reported_comment_id',
            'target_type', 'report_type', 'description',
            'status', 'priority',
            'resolution_notes', 'reviewed_by',
            'created_at', 'updated_at', 'resolved_at',
        ]


class NotificationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    reel = ReelSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'sender', 'notification_type', 'reel', 'comment', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
