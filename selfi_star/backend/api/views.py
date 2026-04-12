import traceback
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db.models import F, Count, Exists, OuterRef, Subquery, Prefetch
from django.utils import timezone
from datetime import timedelta

from .models import UserProfile, Reel, Comment, Vote, Quest, UserQuest, Subscription, NotificationPreference, Competition, Winner, Follow, CommentLike, CommentReply, SavedPost, Notification, Report, ModerationAction
from .models_campaign import CampaignNotification
from .serializers import (
    UserSerializer, UserProfileSerializer, ReelSerializer, CommentSerializer, VoteSerializer,
    QuestSerializer, UserQuestSerializer, SubscriptionSerializer,
    NotificationPreferenceSerializer, RegisterSerializer, CompetitionSerializer, WinnerSerializer, FollowSerializer,
    ReportSerializer
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
    
    print(f"[LOGIN] Attempt - username: {username}, has_password: {bool(password)}")
    
    if not username or not password:
        print(f"[LOGIN] Missing credentials - username: {bool(username)}, password: {bool(password)}")
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Try to find user by username or email
    user = None
    try:
        # First try username
        user = User.objects.get(username=username)
        print(f"[LOGIN] Found user by username: {user.username} (id={user.id})")
    except User.DoesNotExist:
        # Then try email
        try:
            user = User.objects.get(email=username)
            print(f"[LOGIN] Found user by email: {user.username} (id={user.id})")
        except User.DoesNotExist:
            print(f"[LOGIN] User not found: {username}")
            pass
    
    if user:
        print(f"[LOGIN] User found: {user.username}, checking password...")
        print(f"[LOGIN] User has usable password: {user.has_usable_password()}")
        print(f"[LOGIN] Password hash prefix: {user.password[:20] if user.password else 'NONE'}...")
        
        if user.check_password(password):
            token, _ = Token.objects.get_or_create(user=user)
            print(f"[LOGIN] Success - user: {user.username}, token: {token.key[:8]}...")
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            })
        else:
            print(f"[LOGIN] Password check FAILED for user: {user.username}")
            # Try setting the password if it's not usable (migration issue)
            if not user.has_usable_password():
                print(f"[LOGIN] User has no usable password, this might be a migration issue")
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    else:
        print(f"[LOGIN] User not found for: {username}")
        # List available usernames for debugging
        all_users = list(User.objects.values_list('username', flat=True)[:5])
        print(f"[LOGIN] Available usernames (first 5): {all_users}")
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password for a user by email - temporary fix for password hash issues"""
    email = request.data.get('email')
    new_password = request.data.get('new_password')
    
    if not email or not new_password:
        return Response({'error': 'Email and new_password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        print(f"[RESET] Password reset for user: {user.username}")
        return Response({'message': 'Password reset successful. You can now login.'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    import traceback as _tb
    try:
        caption  = request.data.get('caption', '')
        hashtags = request.data.get('hashtags', '')
        file     = request.FILES.get('file')

        if not file:
            return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)

        print(f"[CREATE_POST] user={request.user.username} file={file.name} size={file.size} type={file.content_type}")

        is_video = (
            file.content_type.startswith('video/')
            or file.name.lower().endswith(('.mp4', '.webm', '.mov', '.avi', '.mkv'))
        )

        # ── Step 1: upload file to Cloudinary ──────────────────────────────
        cloudinary_url = None
        try:
            import cloudinary.uploader as _cu
            import cloudinary as _cl
            cfg = _cl.config()
            if cfg.cloud_name and cfg.api_key and cfg.api_secret:
                resource_type = 'video' if is_video else 'image'
                result = _cu.upload(file, resource_type=resource_type, folder='reels')
                cloudinary_url = result.get('secure_url')
                print(f"[CREATE_POST] Cloudinary OK: {cloudinary_url}")
            else:
                print("[CREATE_POST] Cloudinary credentials missing, using local storage")
        except Exception as cloud_err:
            print(f"[CREATE_POST] Cloudinary upload failed: {cloud_err} — using local storage")

        # ── Step 2: create Reel row ────────────────────────────────────────
        # Always create without file fields first so the storage backend
        # never intercepts an already-uploaded URL and tries to re-upload it.
        reel = Reel.objects.create(
            user=request.user,
            caption=caption,
            hashtags=hashtags,
        )

        # ── Step 3: attach media URL / file via raw UPDATE ─────────────────
        if cloudinary_url:
            # Write the full https:// URL string directly into the DB column
            # using UPDATE so Django's FileField/ImageField storage backend
            # never touches the value (avoids re-upload or path mangling).
            from django.db import connection
            if is_video:
                with connection.cursor() as cur:
                    cur.execute("UPDATE api_reel SET media=%s WHERE id=%s", [cloudinary_url, reel.pk])
            else:
                with connection.cursor() as cur:
                    cur.execute("UPDATE api_reel SET image=%s WHERE id=%s", [cloudinary_url, reel.pk])
        else:
            # Fallback: let Django's storage backend handle the local file
            # Re-fetch the reel and save with the file attached
            if is_video:
                Reel.objects.filter(pk=reel.pk).update(media=file.name)  # name-only placeholder
                reel2 = Reel.objects.get(pk=reel.pk)
                reel2.media = file
                reel2.save(update_fields=['media'])
            else:
                reel2 = Reel.objects.get(pk=reel.pk)
                reel2.image = file
                reel2.save(update_fields=['image'])

        # Re-fetch with all annotations the serializer needs
        reel = Reel.objects.select_related('user', 'user__profile').annotate(
            comment_count_db=Count('comments', distinct=True)
        ).get(pk=reel.pk)

        # ── Step 4: award XP ──────────────────────────────────────────────
        UserProfile.objects.filter(user=request.user).update(xp=F('xp') + 25)

        serializer = ReelSerializer(reel, context={'request': request})
        print(f"[CREATE_POST] success reel.id={reel.pk}")
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        tb = _tb.format_exc()
        print(f"[CREATE_POST] ERROR {type(e).__name__}: {tb}")
        return Response(
            {'error': str(e), 'type': type(e).__name__, 'traceback': tb},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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
    
    def get_object(self):
        """For detail lookups (retrieve/update/delete) always use the full queryset
        so a reel the user marked 'not interested' still resolves instead of 404."""
        from django.shortcuts import get_object_or_404
        pk = self.kwargs.get('pk')
        queryset = Reel.objects.select_related('user', 'user__profile').annotate(
            comment_count_db=Count('comments', distinct=True),
        )
        if self.request.user.is_authenticated:
            try:
                queryset = queryset.annotate(
                    is_liked_db=Exists(Vote.objects.filter(user=self.request.user, reel=OuterRef('pk'))),
                    is_saved_db=Exists(SavedPost.objects.filter(user=self.request.user, reel=OuterRef('pk'))),
                )
            except Exception:
                pass
        obj = get_object_or_404(queryset, pk=pk)
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        try:
            queryset = Reel.objects.select_related(
                'user', 'user__profile'
            ).annotate(
                comment_count_db=Count('comments', distinct=True),
            ).order_by('-created_at')
            
            # Exclude reels marked as not interested from list view only
            if self.request.user.is_authenticated:
                from .models import NotInterested
                not_interested_ids = NotInterested.objects.filter(
                    user=self.request.user
                ).values_list('reel_id', flat=True)
                queryset = queryset.exclude(id__in=not_interested_ids)
            
            # Annotate is_liked / is_saved for the current user to avoid N+1
            if self.request.user.is_authenticated:
                try:
                    queryset = queryset.annotate(
                        is_liked_db=Exists(
                            Vote.objects.filter(user=self.request.user, reel=OuterRef('pk'))
                        ),
                        is_saved_db=Exists(
                            SavedPost.objects.filter(user=self.request.user, reel=OuterRef('pk'))
                        ),
                    )
                except Exception as e:
                    print(f'[REELS] Auth annotation failed: {e} - falling back to unannotated queryset')
            
            # Filter by user
            user_id = self.request.query_params.get('user', None)
            if user_id:
                queryset = queryset.filter(user_id=user_id)
            
            # Filter saved posts (requires authentication)
            saved = self.request.query_params.get('saved', None)
            if saved == 'true' and self.request.user.is_authenticated:
                try:
                    saved_post_ids = SavedPost.objects.filter(user=self.request.user).values_list('reel_id', flat=True)
                    queryset = queryset.filter(id__in=saved_post_ids)
                except Exception as e:
                    print(f'[REELS] Saved filter failed: {e}')
            
            return queryset
        except Exception as e:
            print(f'[REELS] get_queryset failed: {e} - returning empty queryset')
            return Reel.objects.none()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def list(self, request, *args, **kwargs):
        """Override list to return empty results instead of 500 on errors"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            print(f'[REELS LIST] Error: {e}')
            traceback.print_exc()
            return Response({'count': 0, 'next': None, 'previous': None, 'results': []}, status=status.HTTP_200_OK)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'vote', 'comments']:
            self.permission_classes = [IsAuthenticated]  # Require auth for modifying operations
        return super().get_permissions()
    
    def create(self, request, *args, **kwargs):
        """Override create to handle file uploads directly using Cloudinary SDK"""
        print(f"[REEL CREATE] Starting - User: {request.user}, Auth: {request.user.is_authenticated}")
        print(f"[REEL CREATE] Files received: {list(request.FILES.keys())}")
        
        try:
            media_file = request.FILES.get('media') or request.FILES.get('file')
            image_file = request.FILES.get('image')
            caption = request.data.get('caption', '')
            hashtags = request.data.get('hashtags', '')
            
            reel = Reel(
                user=request.user,
                caption=caption,
                hashtags=hashtags,
            )
            
            upload_file = media_file or image_file
            if upload_file:
                content_type = getattr(upload_file, 'content_type', '')
                filename = upload_file.name.lower()
                is_video = (
                    content_type.startswith('video/') or
                    filename.endswith(('.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'))
                )
                print(f"[REEL CREATE] File: {upload_file.name}, type: {content_type}, video: {is_video}")
                
                try:
                    import cloudinary.uploader
                    import cloudinary
                    cfg = cloudinary.config()
                    if cfg.cloud_name and cfg.api_key and cfg.api_secret:
                        resource_type = 'video' if is_video else 'image'
                        result = cloudinary.uploader.upload(
                            upload_file,
                            resource_type=resource_type,
                            folder='reels'
                        )
                        secure_url = result.get('secure_url', '')
                        print(f"[REEL CREATE] Cloudinary upload OK: {secure_url}")
                        # Store URL directly in field name
                        if is_video:
                            reel.media.name = secure_url
                        else:
                            reel.image.name = secure_url
                    else:
                        raise Exception("Cloudinary not configured")
                except Exception as cloud_err:
                    print(f"[REEL CREATE] Cloudinary failed ({cloud_err}), saving locally via FileField")
                    # Fallback: save via Django FileField (works locally)
                    reel.media = upload_file
            
            reel.save()
            print(f"[REEL CREATE] Reel {reel.id} saved. image={reel.image.name if reel.image else None}, media={reel.media.name if reel.media else None}")
            
            serializer = self.get_serializer(reel)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"[REEL CREATE] ERROR: {type(e).__name__}: {e}")
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        from .models import Notification
        reel = self.get_object()
        vote, created = Vote.objects.get_or_create(user=request.user, reel=reel)
        
        if created:
            reel.votes += 1
            reel.save()
            
            # Create notification for reel owner (don't notify self)
            if reel.user != request.user:
                Notification.objects.create(
                    recipient=reel.user,
                    sender=request.user,
                    notification_type='like',
                    reel=reel,
                    message=f"{request.user.username} liked your post"
                )
            
            return Response({'voted': True, 'votes': reel.votes})
        else:
            vote.delete()
            reel.votes -= 1
            reel.save()
            
            # Delete notification when unliked
            if reel.user != request.user:
                Notification.objects.filter(
                    recipient=reel.user,
                    sender=request.user,
                    notification_type='like',
                    reel=reel
                ).delete()
            
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
            comments = Comment.objects.filter(reel=reel).select_related('user', 'user__profile')
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
            
            # Create notification for reel owner (don't notify self)
            from .models import Notification
            if reel.user != request.user:
                Notification.objects.create(
                    recipient=reel.user,
                    sender=request.user,
                    notification_type='comment',
                    reel=reel,
                    comment=comment,
                    message=f"{request.user.username} commented: {text[:50]}{'...' if len(text) > 50 else ''}"
                )
            
            serializer = CommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a reel - only owner can delete"""
        try:
            print(f"[REEL DELETE] Request from user: {request.user}, authenticated: {request.user.is_authenticated}")
            print(f"[REEL DELETE] PK: {kwargs.get('pk')}")
            
            reel = self.get_object()
            print(f"[REEL DELETE] Reel found: ID={reel.id}, owner={reel.user.username}")
            
            # Check ownership
            if reel.user != request.user:
                print(f"[REEL DELETE] Permission denied: reel.user={reel.user.id}, request.user={request.user.id}")
                return Response(
                    {'error': 'You can only delete your own posts'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            print(f"[REEL DELETE] Deleting reel {reel.id}...")
            
            # Explicitly delete related PostScore if exists (to avoid cascade issues)
            try:
                from .models_campaign_extended import PostScore
                if hasattr(reel, 'campaign_score'):
                    print(f"[REEL DELETE] Deleting related PostScore...")
                    reel.campaign_score.delete()
            except Exception as score_err:
                print(f"[REEL DELETE] PostScore deletion warning: {score_err}")
            
            # Now delete the reel (cascade will handle comments, votes, etc.)
            reel.delete()
            print(f"[REEL DELETE] Successfully deleted reel {reel.id}")
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            print(f"[REEL DELETE] Error: {type(e).__name__}: {e}")
            traceback.print_exc()
            return Response(
                {'error': str(e), 'type': type(e).__name__},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def partial_update(self, request, *args, **kwargs):
        """Update a reel (caption, hashtags, and/or media) - only owner can update"""
        try:
            print(f"[REEL UPDATE] Request from user: {request.user}, authenticated: {request.user.is_authenticated}")
            print(f"[REEL UPDATE] PK: {kwargs.get('pk')}")
            print(f"[REEL UPDATE] Data: {request.data}")
            print(f"[REEL UPDATE] Files: {list(request.FILES.keys())}")
            
            reel = self.get_object()
            print(f"[REEL UPDATE] Reel found: ID={reel.id}, owner={reel.user.username}")
            
            # Check ownership
            if reel.user != request.user:
                return Response(
                    {'error': 'You can only edit your own posts'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Update text fields
            if 'caption' in request.data:
                reel.caption = request.data['caption']
            if 'hashtags' in request.data:
                reel.hashtags = request.data['hashtags']
            
            # Handle media file replacement
            new_file = request.FILES.get('file') or request.FILES.get('media') or request.FILES.get('image')
            if new_file:
                print(f"[REEL UPDATE] New media file: {new_file.name}, type: {new_file.content_type}")
                
                content_type = getattr(new_file, 'content_type', '')
                filename = new_file.name.lower()
                is_video = (
                    content_type.startswith('video/') or
                    filename.endswith(('.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'))
                )
                
                try:
                    import cloudinary.uploader
                    import cloudinary
                    cfg = cloudinary.config()
                    if cfg.cloud_name and cfg.api_key and cfg.api_secret:
                        resource_type = 'video' if is_video else 'image'
                        result = cloudinary.uploader.upload(
                            new_file,
                            resource_type=resource_type,
                            folder='reels'
                        )
                        secure_url = result.get('secure_url', '')
                        print(f"[REEL UPDATE] Cloudinary upload OK: {secure_url}")
                        
                        # Clear old media and set new one
                        if is_video:
                            reel.image = None
                            reel.media.name = secure_url
                        else:
                            reel.media = None
                            reel.image.name = secure_url
                    else:
                        raise Exception("Cloudinary not configured")
                except Exception as cloud_err:
                    print(f"[REEL UPDATE] Cloudinary failed ({cloud_err}), saving locally")
                    # Fallback: save via Django FileField
                    if is_video:
                        reel.image = None
                        reel.media = new_file
                    else:
                        reel.media = None
                        reel.image = new_file
            
            reel.save()
            print(f"[REEL UPDATE] Reel {reel.id} updated successfully")
            
            serializer = self.get_serializer(reel)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"[REEL UPDATE] Error: {type(e).__name__}: {e}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
        
        # Handle query params for getting followers/following of any user
        following_id = self.request.query_params.get('following')
        follower_id = self.request.query_params.get('follower')
        
        if following_id:
            # Get users who follow the user with following_id (i.e., following_id is being followed)
            return Follow.objects.filter(following_id=following_id)
        elif follower_id:
            # Get users who the follower_id follows (i.e., follower_id is the follower)
            return Follow.objects.filter(follower_id=follower_id)
        else:
            # Default: return who the current user is following
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
                
                # Delete follow notification when unfollowed
                from .models import Notification
                Notification.objects.filter(
                    recipient=following_user,
                    sender=request.user,
                    notification_type='follow'
                ).delete()
                
                return Response({'following': False, 'message': 'Unfollowed'})
            
            # Create notification for followed user
            from .models import Notification
            Notification.objects.create(
                recipient=following_user,
                sender=request.user,
                notification_type='follow',
                message=f"{request.user.username} started following you"
            )
            
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
    
    # Extract unique hashtags - only scan reels that match, not ALL reels
    hashtags = set()
    for post in Reel.objects.filter(hashtags__icontains=query).only('hashtags')[:100]:
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
    try:
        # Get general notifications (likes, comments, follows) - with select_related to avoid N+1
        notifications = Notification.objects.filter(
            recipient=request.user
        ).select_related(
            'sender', 'sender__profile', 'reel', 'comment'
        ).order_by('-created_at')[:50]
        
        # Get campaign notifications
        campaign_notifications = CampaignNotification.objects.filter(
            user=request.user
        ).select_related('campaign').order_by('-created_at')[:50]
        
        result = []
        
        # Add general notifications
        for notif in notifications:
            sender_data = None
            if notif.sender:
                profile_photo = None
                try:
                    pf = notif.sender.profile.profile_photo
                    if pf and pf.name:
                        profile_photo = pf.name if pf.name.startswith('http') else pf.url
                except Exception:
                    pass
                sender_data = {
                    'id': notif.sender.id,
                    'username': notif.sender.username,
                    'first_name': notif.sender.first_name,
                    'last_name': notif.sender.last_name,
                    'profile_photo': profile_photo,
                }

            reel_data = None
            if notif.reel:
                try:
                    def _safe_url(field):
                        if not field or not field.name:
                            return None
                        name = field.name
                        if name.startswith('http://') or name.startswith('https://'):
                            return name
                        try:
                            u = field.url
                            return u if u else None
                        except Exception:
                            return None
                    reel_data = {
                        'id': notif.reel.id,
                        'media': _safe_url(notif.reel.media),
                        'image': _safe_url(notif.reel.image),
                    }
                except Exception:
                    reel_data = {'id': notif.reel.id, 'media': None, 'image': None}

            result.append({
                'id': notif.id,
                'type': 'general',
                'sender': sender_data,
                'notification_type': notif.notification_type,
                'message': notif.message,
                'read': notif.is_read,
                'timestamp': notif.created_at.isoformat() if notif.created_at else None,
                'reel_id': notif.reel.id if notif.reel else None,
                'reel': reel_data,
                'comment_id': notif.comment.id if notif.comment else None,
                'comment': notif.comment.text if notif.comment else None,
            })
        
        # Add campaign notifications
        for notif in campaign_notifications:
            result.append({
                'id': notif.id,
                'type': 'campaign',
                'message': notif.message,
                'notification_type': notif.notification_type,
                'read': notif.is_read,
                'timestamp': notif.created_at.isoformat() if notif.created_at else None,
                'campaign_id': notif.campaign.id if notif.campaign else None,
            })
        
        # Sort all notifications by timestamp
        result.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        
        return Response(result)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching notifications: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=500)

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_notification_count(request):
    """Return count of unread notifications for the bell badge"""
    try:
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})
    except Exception as e:
        return Response({'unread_count': 0})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_single_notification_read(request, notification_id):
    """Mark a single notification as read"""
    try:
        Notification.objects.filter(
            id=notification_id,
            recipient=request.user
        ).update(is_read=True)
        return Response({'message': 'Marked as read'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_report(request):
    """Create a new report for inappropriate content"""
    try:
        data = request.data.copy()

        # Map legacy field names sent by frontend (reported_reel -> reported_reel_id)
        if 'reported_reel' in data and 'reported_reel_id' not in data:
            data['reported_reel_id'] = data.pop('reported_reel')
        if 'reported_user' in data and 'reported_user_id' not in data:
            data['reported_user_id'] = data.pop('reported_user')
        if 'reported_comment' in data and 'reported_comment_id' not in data:
            data['reported_comment_id'] = data.pop('reported_comment')

        # Auto-set target_type
        if 'reported_reel_id' in data and data['reported_reel_id']:
            data['target_type'] = 'reel'
        elif 'reported_comment_id' in data and data['reported_comment_id']:
            data['target_type'] = 'comment'
        elif 'reported_user_id' in data and data['reported_user_id']:
            data['target_type'] = 'user'

        # Auto-set priority based on report type
        high_priority_types = ['self_harm', 'violence', 'hate_speech']
        report_type = data.get('report_type', '')
        if report_type in high_priority_types:
            data['priority'] = 'critical'
        elif report_type in ['harassment', 'scam']:
            data['priority'] = 'high'
        else:
            data['priority'] = 'medium'

        serializer = ReportSerializer(data=data)
        if serializer.is_valid():
            report = serializer.save(reported_by=request.user)

            # Auto-flag if target has 5+ pending reports
            if report.reported_reel:
                count = Report.objects.filter(reported_reel=report.reported_reel, status='pending').count()
                if count >= 5:
                    report.priority = 'critical'
                    report.save(update_fields=['priority'])

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print(f'[REPORT] Validation errors: {serializer.errors}')
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f'[REPORT] Error creating report: {e}')
        import traceback as tb
        tb.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_moderate_report(request, report_id):
    """Take a moderation action on a report (warn, remove content, ban user, etc.)"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        report = Report.objects.select_related('reported_user', 'reported_reel').get(id=report_id)
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

    action_taken = request.data.get('action_taken')
    reason_details = request.data.get('reason_details', '')

    if not action_taken:
        return Response({'error': 'action_taken is required'}, status=status.HTTP_400_BAD_REQUEST)

    ModerationAction.objects.create(
        report=report,
        moderator=request.user,
        action_taken=action_taken,
        reason_details=reason_details,
    )

    # Execute the action
    if action_taken == 'content_removed' and report.reported_reel:
        report.reported_reel.delete()
    elif action_taken in ('temp_ban', 'permanent_ban', 'shadowban') and report.reported_user:
        profile = getattr(report.reported_user, 'profile', None)
        if profile:
            profile.is_shadowbanned = action_taken == 'shadowban'
            profile.save(update_fields=['is_shadowbanned'] if hasattr(profile, 'is_shadowbanned') else [])
        if action_taken == 'permanent_ban':
            report.reported_user.is_active = False
            report.reported_user.save(update_fields=['is_active'])

    # Mark report resolved
    report.status = 'resolved'
    report.reviewed_by = request.user
    report.resolution_notes = reason_details
    report.resolved_at = timezone.now()
    report.save(update_fields=['status', 'reviewed_by', 'resolution_notes', 'resolved_at'])

    return Response({'success': True, 'action': action_taken})


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

@api_view(['GET'])
@permission_classes([AllowAny])
def get_trending_reels(request):
    """Get trending reels with engagement-based algorithm and category filtering"""
    try:
        from django.db.models import Q, F, Count
        from datetime import datetime, timedelta
        
        print(f"[TRENDING] Getting trending reels with params: {dict(request.GET)}")
        
        # Get query parameters
        category = request.GET.get('category', 'all')  # all, dance, comedy, beauty, sports, etc.
        time_range = request.GET.get('time_range', '7d')  # 24h, 7d, 30d, all
        limit = int(request.GET.get('limit', 20))
        
        # Calculate time threshold
        now = timezone.now()
        if time_range == '24h':
            time_threshold = now - timedelta(hours=24)
        elif time_range == '7d':
            time_threshold = now - timedelta(days=7)
        elif time_range == '30d':
            time_threshold = now - timedelta(days=30)
        else:
            time_threshold = now - timedelta(days=365)  # all time
        
        print(f"[TRENDING] Time threshold: {time_threshold}")
        
        # Base queryset
        queryset = Reel.objects.filter(created_at__gte=time_threshold)
        print(f"[TRENDING] Base queryset count: {queryset.count()}")
        
        # Category filtering (based on hashtags)
        if category != 'all':
            category_hashtags = {
                'dance': ['dance', 'dancing', 'dancer', 'choreography'],
                'comedy': ['funny', 'comedy', 'humor', 'laugh', 'meme'],
                'beauty': ['beauty', 'makeup', 'skincare', 'fashion', 'style'],
                'sports': ['sports', 'fitness', 'workout', 'gym', 'athlete'],
                'food': ['food', 'cooking', 'recipe', 'foodie', 'chef'],
                'travel': ['travel', 'adventure', 'explore', 'wanderlust'],
                'music': ['music', 'singing', 'song', 'cover', 'musician'],
                'art': ['art', 'artist', 'drawing', 'painting', 'creative'],
            }
            
            if category in category_hashtags:
                hashtag_filter = Q()
                for tag in category_hashtags[category]:
                    hashtag_filter |= Q(hashtags__icontains=f'#{tag}')
                queryset = queryset.filter(hashtag_filter)
                print(f"[TRENDING] After category filter count: {queryset.count()}")
        
        # Simplified trending algorithm - just order by votes and creation time
        # This avoids complex database expressions that might cause 500 errors
        queryset = queryset.annotate(
            comment_count=Count('comments')
        ).select_related('user', 'user__profile').order_by('-votes', '-created_at')[:limit]
        
        print(f"[TRENDING] Final queryset count: {len(queryset)}")
        
        # Serialize
        serializer = ReelSerializer(queryset, many=True, context={'request': request})
        print(f"[TRENDING] Successfully serialized {len(serializer.data)} reels")
        
        return Response(serializer.data)
        
    except Exception as e:
        print(f"[TRENDING] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return empty result as fallback
        return Response([], status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_not_interested(request):
    """Mark a reel as not interested to hide from user's feed"""
    reel_id = request.data.get('reel_id')
    if not reel_id:
        return Response({'error': 'reel_id required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        reel = Reel.objects.get(id=reel_id)
    except Reel.DoesNotExist:
        return Response({'error': 'Reel not found'}, status=status.HTTP_404_NOT_FOUND)
    
    from .models import NotInterested
    NotInterested.objects.get_or_create(user=request.user, reel=reel)
    
    return Response({'message': 'Marked as not interested', 'reel_id': reel_id})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def undo_not_interested(request):
    """Undo marking a reel as not interested"""
    reel_id = request.data.get('reel_id')
    if not reel_id:
        return Response({'error': 'reel_id required'}, status=status.HTTP_400_BAD_REQUEST)
    
    from .models import NotInterested
    NotInterested.objects.filter(user=request.user, reel_id=reel_id).delete()
    
    return Response({'message': 'Removed from not interested', 'reel_id': reel_id})
