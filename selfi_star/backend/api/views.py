import traceback
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db.models import F
from django.utils import timezone
from datetime import timedelta

from .models import UserProfile, Reel, Comment, Vote, Quest, UserQuest, Subscription, NotificationPreference, Competition, Winner, Follow, CommentLike, CommentReply, SavedPost
from .models_campaign import CampaignNotification
from .serializers import (
    UserSerializer, UserProfileSerializer, ReelSerializer, CommentSerializer, VoteSerializer,
    QuestSerializer, UserQuestSerializer, SubscriptionSerializer,
    NotificationPreferenceSerializer, RegisterSerializer, CompetitionSerializer, WinnerSerializer, FollowSerializer
)
from .serializers_extended import CommentSerializer as ExtendedCommentSerializer, CommentLikeSerializer, CommentReplySerializer, SavedPostSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Try to find user by username or email
    user = None
    try:
        # First try username
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        # Then try email
        try:
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            pass
    
    if user and user.check_password(password):
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    try:
        from django.conf import settings
        print("=== CREATE POST DEBUG ===")
        print(f"Authenticated user: {request.user}")
        print(f"User ID: {request.user.id}")
        print(f"Username: {request.user.username}")
        print(f"Is authenticated: {request.user.is_authenticated}")
        print(f"Auth header: {request.META.get('HTTP_AUTHORIZATION', 'None')}")
        
        # Check Cloudinary config
        cloudinary_storage = getattr(settings, 'CLOUDINARY_STORAGE', None)
        default_storage = getattr(settings, 'DEFAULT_FILE_STORAGE', None)
        print(f"DEFAULT_FILE_STORAGE: {default_storage}")
        print(f"CLOUDINARY_STORAGE configured: {bool(cloudinary_storage)}")
        if cloudinary_storage:
            print(f"CLOUDINARY_STORAGE keys: {list(cloudinary_storage.keys())}")
            print(f"Cloud name present: {bool(cloudinary_storage.get('CLOUD_NAME'))}")
            print(f"API key present: {bool(cloudinary_storage.get('API_KEY'))}")
            print(f"API secret present: {bool(cloudinary_storage.get('API_SECRET'))}")
        
        caption = request.data.get('caption', '')
        hashtags = request.data.get('hashtags', '')
        file = request.FILES.get('file')
        
        if not file:
            return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Received file: {file.name}")
        print(f"File type: {file.content_type}")
        print(f"File size: {file.size}")
        
        # Determine if it's a video or image
        is_video = file.content_type.startswith('video/') or file.name.lower().endswith(('.mp4', '.webm', '.mov', '.avi'))
        is_image = file.content_type.startswith('image/') or file.name.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))
        
        print(f"Detected as - Video: {is_video}, Image: {is_image}")
        
        # Create the reel with appropriate field
        if is_video:
            # For videos, upload directly to Cloudinary with resource_type='video'
            print("📹 Uploading video to Cloudinary...")
            try:
                import cloudinary
                import cloudinary.uploader
                # Verify cloudinary config
                print(f"Cloudinary config - cloud_name: {cloudinary.config().cloud_name}")
                print(f"Cloudinary config - api_key: {cloudinary.config().api_key}")
                print(f"Cloudinary config - api_secret present: {bool(cloudinary.config().api_secret)}")
                
                upload_result = cloudinary.uploader.upload(
                    file,
                    resource_type='video',
                    folder='reels'
                )
                print(f"✅ Video uploaded: {upload_result.get('secure_url')}")
                print(f"Public ID: {upload_result.get('public_id')}")
                
                # Create reel with public_id stored in media field (not full URL)
                from django.core.files.base import ContentFile
                reel = Reel(
                    user=request.user,
                    caption=caption,
                    hashtags=hashtags
                )
                # Store just the public_id path (e.g., 'reels/abc123')
                reel.media.name = upload_result.get('public_id')
                reel.save()
            except Exception as video_error:
                print(f"❌ Video upload failed: {type(video_error).__name__}: {str(video_error)}")
                raise
        else:
            # Images work fine with the storage backend
            reel = Reel.objects.create(
                user=request.user,
                image=file,
                caption=caption,
                hashtags=hashtags
            )
        
        # Award XP for posting (use update() to avoid triggering ImageField re-upload)
        UserProfile.objects.filter(user=request.user).update(xp=F('xp') + 25)
        
        print(f"Created reel ID: {reel.id}")
        print(f"Reel user: {reel.user.username}")
        print(f"Reel media: {reel.media.name if reel.media else None}")
        print(f"Reel image: {reel.image.name if reel.image else None}")
        
        serializer = ReelSerializer(reel, context={'request': request})
        response_data = serializer.data
        print(f"Serialized response: {response_data}")
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"CREATE POST ERROR [{type(e).__name__}]: {traceback.format_exc()}")
        return Response({'error': str(e), 'type': type(e).__name__}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        profile = request.user.profile
        user = request.user
        
        # Update user fields
        if 'username' in request.data:
            user.username = request.data['username']
        if 'email' in request.data:
            user.email = request.data['email']
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        user.save()
        
        # Update profile fields
        if 'bio' in request.data:
            profile.bio = request.data['bio']
        if 'profile_photo' in request.FILES:
            profile.profile_photo = request.FILES['profile_photo']
        profile.save()
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'bio': profile.bio,
            'profile_photo': profile.profile_photo.url if profile.profile_photo else None
        })
    
    @action(detail=False, methods=['post'])
    def update_privacy(self, request):
        profile = request.user.profile
        
        # Update privacy settings
        if 'privateAccount' in request.data:
            profile.is_private = request.data['privateAccount']
        if 'showActivity' in request.data:
            profile.show_activity = request.data['showActivity']
        if 'allowMessages' in request.data:
            profile.allow_messages = request.data['allowMessages']
        
        profile.save()
        
        return Response({
            'privateAccount': profile.is_private,
            'showActivity': profile.show_activity,
            'allowMessages': profile.allow_messages,
            'message': 'Privacy settings updated successfully'
        })
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = request.user.profile
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add_xp(self, request):
        profile = request.user.profile
        xp = request.data.get('xp', 0)
        profile.xp += xp
        profile.level = (profile.xp // 1000) + 1
        profile.save()
        return Response(UserProfileSerializer(profile).data)
    
    @action(detail=False, methods=['post'])
    def daily_checkin(self, request):
        profile = request.user.profile
        now = timezone.now()
        
        if profile.last_checkin:
            if (now - profile.last_checkin).days == 1:
                profile.streak += 1
            elif (now - profile.last_checkin).days > 1:
                profile.streak = 1
        else:
            profile.streak = 1
        
        profile.last_checkin = now
        profile.xp += 50
        profile.save()
        
        return Response({
            'streak': profile.streak,
            'xp': profile.xp,
            'level': profile.level
        })

class ReelViewSet(viewsets.ModelViewSet):
    queryset = Reel.objects.all()
    serializer_class = ReelSerializer
    permission_classes = [AllowAny]  # Allow anyone to view reels
    
    def get_queryset(self):
        queryset = Reel.objects.all().order_by('-created_at')
        
        # Filter by user
        user_id = self.request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter saved posts (requires authentication)
        saved = self.request.query_params.get('saved', None)
        if saved == 'true' and self.request.user.is_authenticated:
            from .models import SavedPost
            saved_post_ids = SavedPost.objects.filter(user=self.request.user).values_list('reel_id', flat=True)
            queryset = queryset.filter(id__in=saved_post_ids)
        
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'vote', 'comments']:
            self.permission_classes = [IsAuthenticated]  # Require auth for modifying operations
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        reel = self.get_object()
        vote, created = Vote.objects.get_or_create(user=request.user, reel=reel)
        
        if created:
            reel.votes += 1
            reel.save()
            return Response({'voted': True, 'votes': reel.votes})
        else:
            vote.delete()
            reel.votes -= 1
            reel.save()
            return Response({'voted': False, 'votes': reel.votes})
    
    @action(detail=True, methods=['post'])
    def save(self, request, pk=None):
        reel = self.get_object()
        saved_post, created = SavedPost.objects.get_or_create(user=request.user, reel=reel)
        
        if created:
            return Response({'saved': True, 'message': 'Post saved'})
        else:
            saved_post.delete()
            return Response({'saved': False, 'message': 'Post unsaved'})
    
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        reel = self.get_object()
        
        if request.method == 'GET':
            comments = Comment.objects.filter(reel=reel)
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
            text = request.data.get('text', '').strip()
            if not text:
                return Response({'error': 'Comment text is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            comment = Comment.objects.create(
                user=request.user,
                reel=reel,
                text=text
            )
            
            serializer = CommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class QuestViewSet(viewsets.ModelViewSet):
    queryset = Quest.objects.filter(is_active=True)
    serializer_class = QuestSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        quest = self.get_object()
        user_quest, _ = UserQuest.objects.get_or_create(user=request.user, quest=quest)
        
        if not user_quest.completed:
            user_quest.completed = True
            user_quest.completed_at = timezone.now()
            user_quest.save()
            
            profile = request.user.profile
            profile.xp += quest.xp_reward
            profile.save()
        
        return Response(UserQuestSerializer(user_quest).data)

class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def upgrade(self, request):
        plan = request.data.get('plan')
        subscription = request.user.subscription
        subscription.plan = plan
        subscription.expires_at = timezone.now() + timedelta(days=30)
        subscription.save()
        return Response(SubscriptionSerializer(subscription).data)

class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get', 'put'])
    def me(self, request):
        prefs = request.user.notification_prefs
        if request.method == 'PUT':
            serializer = self.get_serializer(prefs, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(prefs)
        return Response(serializer.data)

class CompetitionViewSet(viewsets.ModelViewSet):
    queryset = Competition.objects.filter(is_active=True)
    serializer_class = CompetitionSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
    
    @action(detail=True, methods=['post'])
    def determine_winner(self, request, pk=None):
        competition = self.get_object()
        
        if competition.is_active:
            return Response({'error': 'Competition is still active'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get top voted reel during competition period
        top_reel = Reel.objects.filter(
            created_at__gte=competition.start_date,
            created_at__lte=competition.end_date
        ).order_by('-votes').first()
        
        if not top_reel:
            return Response({'error': 'No submissions found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create winner
        winner, created = Winner.objects.get_or_create(
            competition=competition,
            user=top_reel.user,
            defaults={
                'reel': top_reel,
                'votes_received': top_reel.votes
            }
        )
        
        serializer = WinnerSerializer(winner)
        return Response(serializer.data)

class WinnerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Winner.objects.all()
    serializer_class = WinnerSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        winners = Winner.objects.all()[:10]
        serializer = self.get_serializer(winners, many=True)
        return Response(serializer.data)

class FollowViewSet(viewsets.ModelViewSet):
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_permissions(self):
        if self.action == 'suggestions':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Follow.objects.none()
        return Follow.objects.filter(follower=self.request.user)
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        try:
            following_id = request.data.get('following_id')
            if not following_id:
                return Response({'error': 'following_id required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                following_user = User.objects.get(id=following_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
            if following_user == request.user:
                return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
            
            follow, created = Follow.objects.get_or_create(
                follower=request.user,
                following=following_user
            )
            
            if not created:
                follow.delete()
                return Response({'following': False, 'message': 'Unfollowed'})
            
            return Response({'following': True, 'message': 'Followed'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        if request.user.is_authenticated:
            following_ids = Follow.objects.filter(follower=request.user).values_list('following_id', flat=True)
            suggestions = User.objects.exclude(id__in=following_ids).exclude(id=request.user.id)[:10]
        else:
            suggestions = User.objects.all()[:10]
        serializer = UserSerializer(suggestions, many=True, context={'request': request})
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    query = request.GET.get('q', '')
    if not query:
        return Response({'users': [], 'posts': [], 'hashtags': []})
    
    # Search users
    users = User.objects.filter(
        username__icontains=query
    )[:10]
    
    # Search posts by caption or hashtags
    posts = Reel.objects.filter(
        caption__icontains=query
    ) | Reel.objects.filter(
        hashtags__icontains=query
    )
    posts = posts.distinct()[:20]
    
    # Extract unique hashtags
    hashtags = set()
    for post in Reel.objects.exclude(hashtags=''):
        for tag in post.get_hashtags_list():
            if query.lower() in tag.lower():
                hashtags.add(tag)
    
    return Response({
        'users': UserSerializer(users, many=True, context={'request': request}).data,
        'posts': ReelSerializer(posts, many=True).data,
        'hashtags': list(hashtags)[:10]
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    """Get all notifications for the authenticated user"""
    # Get general notifications (likes, comments, follows)
    notifications = Notification.objects.filter(recipient=request.user).order_by('-created_at')
    
    # Get campaign notifications
    campaign_notifications = CampaignNotification.objects.filter(user=request.user).order_by('-created_at')
    
    result = []
    
    # Add general notifications
    for notif in notifications:
        result.append({
            'id': notif.id,
            'type': 'general',
            'sender': {
                'id': notif.sender.id,
                'username': notif.sender.username,
                'first_name': notif.sender.first_name,
                'last_name': notif.sender.last_name
            },
            'notification_type': notif.notification_type,
            'message': notif.message,
            'read': notif.is_read,
            'timestamp': notif.created_at,
            'reel_id': notif.reel.id if notif.reel else None,
            'comment_id': notif.comment.id if notif.comment else None,
        })
    
    # Add campaign notifications
    for notif in campaign_notifications:
        result.append({
            'id': notif.id,
            'type': 'campaign',
            'message': notif.message,
            'notification_type': notif.notification_type,
            'read': notif.is_read,
            'timestamp': notif.created_at,
            'campaign_id': notif.campaign.id if notif.campaign else None,
        })
    
    # Sort all notifications by timestamp
    result.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    """Mark notifications as read"""
    notification_ids = request.data.get('notification_ids', [])
    if notification_ids:
        # Mark specific notifications as read
        Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user
        ).update(is_read=True)
    else:
        # Mark all notifications as read
        Notification.objects.filter(recipient=request.user).update(is_read=True)
    
    return Response({'message': 'Notifications marked as read'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_report(request):
    """Create a new report for inappropriate content"""
    serializer = ReportSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(reported_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_reports_list(request):
    """Get all reports for admin dashboard"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    status_filter = request.query_params.get('status', None)
    report_type = request.query_params.get('type', None)
    
    reports = Report.objects.all().order_by('-created_at')
    
    if status_filter:
        reports = reports.filter(status=status_filter)
    if report_type:
        reports = reports.filter(report_type=report_type)
    
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def admin_report_detail(request, report_id):
    """Get or update a specific report"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        report = Report.objects.get(id=report_id)
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = ReportSerializer(report)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ReportSerializer(report, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(reviewed_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_reports_stats(request):
    """Get report statistics for admin dashboard"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    from django.db.models import Count
    
    total_reports = Report.objects.count()
    pending_reports = Report.objects.filter(status='pending').count()
    reviewing_reports = Report.objects.filter(status='reviewing').count()
    resolved_reports = Report.objects.filter(status='resolved').count()
    dismissed_reports = Report.objects.filter(status='dismissed').count()
    
    reports_by_type = Report.objects.values('report_type').annotate(count=Count('id'))
    
    return Response({
        'total_reports': total_reports,
        'pending_reports': pending_reports,
        'reviewing_reports': reviewing_reports,
        'resolved_reports': resolved_reports,
        'dismissed_reports': dismissed_reports,
        'reports_by_type': list(reports_by_type),
    })
