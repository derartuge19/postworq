from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import Reel, Follow, SavedPost
from .serializers import ReelSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reels_following(request):
    """Get reels from users that the current user follows"""
    user = request.user
    
    # Return empty list for anonymous users
    if not user or not user.is_authenticated:
        return Response([])
    
    # Get users that current user follows
    following_users = Follow.objects.filter(follower=user).values_list('following', flat=True)
    
    # Get reels from those users
    reels = Reel.objects.filter(user__in=following_users).order_by('-created_at')
    
    # Exclude reels marked as not interested by current user
    from .models import NotInterested
    not_interested_ids = NotInterested.objects.filter(
        user=user
    ).values_list('reel_id', flat=True)
    reels = reels.exclude(id__in=not_interested_ids)
    
    # Serialize with user context
    serializer = ReelSerializer(reels, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reels_saved(request):
    """Get saved/bookmarked reels for the current user"""
    user = request.user
    
    # Get saved reel IDs
    saved_reel_ids = SavedPost.objects.filter(user=user).values_list('reel', flat=True)
    
    # Get the actual reels
    reels = Reel.objects.filter(id__in=saved_reel_ids).order_by('-created_at')
    
    # Serialize with user context
    serializer = ReelSerializer(reels, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
def reels_trending(request):
    """Get trending/popular reels based on votes and comments"""
    # Get reels with most engagement (votes + comments) in the last 7 days
    from django.utils import timezone
    from datetime import timedelta
    
    week_ago = timezone.now() - timedelta(days=7)
    
    reels = Reel.objects.filter(
        created_at__gte=week_ago
    ).annotate(
        engagement=Count('reel_votes') + Count('comments')
    ).order_by('-engagement', '-created_at')
    
    # Exclude reels marked as not interested by current user (if authenticated)
    if request.user.is_authenticated:
        from .models import NotInterested
        not_interested_ids = NotInterested.objects.filter(
            user=request.user
        ).values_list('reel_id', flat=True)
        reels = reels.exclude(id__in=not_interested_ids)
    
    reels = reels[:50]
    
    # Serialize with user context if authenticated
    context = {'request': request} if request.user.is_authenticated else {}
    serializer = ReelSerializer(reels, many=True, context=context)
    return Response(serializer.data)
