from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Count, Q
from django.conf import settings
from datetime import timedelta
from .models_campaign import Campaign, CampaignEntry, CampaignVote, CampaignWinner, CampaignNotification
from .models import Reel, Follow

def get_image_url(image_field, request=None):
    """Get image URL without using build_absolute_uri"""
    if not image_field:
        return None
    try:
        # Return relative URL which works with any domain
        return image_field.url
    except:
        return None

# Admin Campaign Management
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_campaigns_list(request):
    """Get all campaigns for admin"""
    campaigns = Campaign.objects.all().order_by('-created_at')
    
    # Filters
    status_filter = request.GET.get('status')
    if status_filter:
        campaigns = campaigns.filter(status=status_filter)
    
    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    start = (page - 1) * page_size
    end = start + page_size
    
    total = campaigns.count()
    campaigns_page = campaigns[start:end]
    
    data = []
    for c in campaigns_page:
        image_url = get_image_url(c.image)
        
        data.append({
            'id': c.id,
            'title': c.title,
            'description': c.description,
            'image': image_url,
            'prize_title': c.prize_title,
            'prize_value': str(c.prize_value),
            'status': c.status,
            'start_date': c.start_date,
            'entry_deadline': c.entry_deadline,
            'voting_start': c.voting_start,
            'voting_end': c.voting_end,
            'total_entries': c.total_entries,
            'total_votes': c.total_votes,
            'winner_count': c.winner_count,
            'winners_announced': c.winners_announced,
            'created_at': c.created_at,
        })
    
    return Response({
        'campaigns': data,
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size
    })

@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def admin_campaign_create(request):
    """Create new campaign"""
    try:
        print("=== Campaign Creation Debug ===")
        print("request.data keys:", request.data.keys())
        print("request.FILES keys:", request.FILES.keys())
        print("Has image in FILES:", 'image' in request.FILES)
        
        campaign = Campaign.objects.create(
            title=request.data.get('title'),
            description=request.data.get('description'),
            prize_title=request.data.get('prize_title'),
            prize_description=request.data.get('prize_description'),
            prize_value=request.data.get('prize_value', 0),
            status=request.data.get('status', 'draft'),
            min_followers=request.data.get('min_followers', 0),
            min_level=request.data.get('min_level', 1),
            min_votes_per_reel=request.data.get('min_votes_per_reel', 0),
            required_hashtags=request.data.get('required_hashtags', ''),
            start_date=request.data.get('start_date'),
            entry_deadline=request.data.get('entry_deadline'),
            voting_start=request.data.get('voting_start'),
            voting_end=request.data.get('voting_end'),
            winner_count=request.data.get('winner_count', 1),
            created_by=request.user
        )
        
        # Handle image upload
        if 'image' in request.FILES:
            print("Image file found:", request.FILES['image'].name)
            campaign.image = request.FILES['image']
            campaign.save()
            print("Image saved to:", campaign.image.path)
        else:
            print("No image file in request.FILES")
        
        # Notify eligible users if campaign is active
        if campaign.status == 'active':
            notify_eligible_users(campaign)
        
        return Response({
            'id': campaign.id,
            'message': 'Campaign created successfully',
            'image_url': campaign.image.url if campaign.image else None
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        print("Error creating campaign:", str(e))
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_campaign_update(request, campaign_id):
    """Update campaign"""
    print(f"=== PATCH Campaign {campaign_id} ===")
    print(f"User: {request.user}, Is Admin: {request.user.is_staff}")
    print(f"Request data: {request.data}")
    try:
        campaign = Campaign.objects.get(id=campaign_id)
        print(f"Found campaign: {campaign.title}")
        
        for field in ['title', 'description', 'prize_title', 'prize_description', 'prize_value', 
                      'status', 'min_followers', 'min_level', 'min_votes_per_reel', 
                      'required_hashtags', 'start_date', 'entry_deadline', 'voting_start', 
                      'voting_end', 'winner_count']:
            if field in request.data:
                setattr(campaign, field, request.data[field])
        
        # Handle image upload
        if 'image' in request.FILES:
            campaign.image = request.FILES['image']
        
        campaign.save()
        print(f"Campaign {campaign_id} updated successfully")
        
        # If status changed to voting, notify participants
        if request.data.get('status') == 'voting':
            notify_voting_started(campaign)
        
        return Response({'message': 'Campaign updated successfully'})
    except Campaign.DoesNotExist:
        print(f"Campaign {campaign_id} not found in database")
        return Response({'error': 'Campaign not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error updating campaign {campaign_id}: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_campaign_delete(request, campaign_id):
    """Delete campaign"""
    print(f"=== DELETE Campaign {campaign_id} ===")
    print(f"User: {request.user}, Is Admin: {request.user.is_staff}")
    try:
        campaign = Campaign.objects.get(id=campaign_id)
        print(f"Found campaign: {campaign.title}")
        campaign.delete()
        print(f"Campaign {campaign_id} deleted successfully")
        return Response({'message': 'Campaign deleted successfully'})
    except Campaign.DoesNotExist:
        print(f"Campaign {campaign_id} not found in database")
        return Response({'error': 'Campaign not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error deleting campaign {campaign_id}: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_campaign_entries(request, campaign_id):
    """Get all entries for a campaign"""
    try:
        campaign = Campaign.objects.get(id=campaign_id)
        entries = CampaignEntry.objects.filter(campaign=campaign).select_related('user', 'reel')
        
        data = [{
            'id': entry.id,
            'user': {
                'id': entry.user.id,
                'username': entry.user.username,
            },
            'reel': {
                'id': entry.reel.id,
                'caption': entry.reel.caption,
                'image': entry.reel.image.url if entry.reel.image else None,
            },
            'vote_count': entry.vote_count,
            'rank': entry.rank,
            'is_winner': entry.is_winner,
            'approved': entry.approved,
            'disqualified': entry.disqualified,
            'submitted_at': entry.submitted_at,
        } for entry in entries]
        
        return Response(data)
    except Campaign.DoesNotExist:
        return Response({'error': 'Campaign not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_announce_winners(request, campaign_id):
    """Announce winners for a campaign"""
    try:
        campaign = Campaign.objects.get(id=campaign_id)
        
        # Get top entries by vote count
        top_entries = CampaignEntry.objects.filter(
            campaign=campaign,
            approved=True,
            disqualified=False
        ).order_by('-vote_count')[:campaign.winner_count]
        
        # Create winners
        for rank, entry in enumerate(top_entries, 1):
            winner, created = CampaignWinner.objects.get_or_create(
                campaign=campaign,
                rank=rank,
                defaults={
                    'entry': entry,
                    'user': entry.user
                }
            )
            entry.is_winner = True
            entry.rank = rank
            entry.save()
            
            # Notify winner
            CampaignNotification.objects.create(
                campaign=campaign,
                user=entry.user,
                notification_type='winner_announced',
                message=f'Congratulations! You won {rank} place in {campaign.title}!'
            )
        
        campaign.winners_announced = True
        campaign.status = 'completed'
        campaign.save()
        
        return Response({'message': f'{len(top_entries)} winners announced successfully'})
    except Campaign.DoesNotExist:
        return Response({'error': 'Campaign not found'}, status=status.HTTP_404_NOT_FOUND)

# User Campaign APIs
@api_view(['GET'])
def user_campaigns_list(request):
    """Get active campaigns for users (public endpoint)"""
    now = timezone.now()
    
    # Get status filter from query params
    status_filter = request.GET.get('status', 'active')
    
    if status_filter == 'active':
        # Show all active campaigns, including upcoming ones (users can see and prepare)
        campaigns = Campaign.objects.filter(status='active').order_by('-created_at')
    elif status_filter == 'voting':
        campaigns = Campaign.objects.filter(status='voting').order_by('-created_at')
    elif status_filter == 'upcoming':
        # Show draft campaigns with future start dates
        campaigns = Campaign.objects.filter(status='draft', start_date__gt=now).order_by('start_date')
    elif status_filter == 'completed':
        campaigns = Campaign.objects.filter(status='completed').order_by('-voting_end')
    else:
        # Default: show all active and voting campaigns
        campaigns = Campaign.objects.filter(
            Q(status='active') | Q(status='voting')
        ).order_by('-created_at')
    
    # Check if user is authenticated
    is_authenticated = request.user and request.user.is_authenticated
    user = request.user if is_authenticated else None
    user_profile = user.profile if (user and hasattr(user, 'profile')) else None
    follower_count = Follow.objects.filter(following=user).count() if user else 0
    
    data = []
    for c in campaigns:
        # Check if user is eligible (only if authenticated)
        is_eligible = True
        has_entered = False
        
        if is_authenticated:
            if c.min_followers > 0 and follower_count < c.min_followers:
                is_eligible = False
            if user_profile and c.min_level > user_profile.level:
                is_eligible = False
            has_entered = CampaignEntry.objects.filter(campaign=c, user=user).exists()
        
        image_url = get_image_url(c.image)
        
        data.append({
            'id': c.id,
            'title': c.title,
            'description': c.description,
            'image': image_url,
            'prize_title': c.prize_title,
            'prize_value': str(c.prize_value),
            'status': c.status,
            'start_date': c.start_date,
            'entry_deadline': c.entry_deadline,
            'voting_start': c.voting_start,
            'voting_end': c.voting_end,
            'total_entries': c.total_entries,
            'total_votes': c.total_votes,
            'is_eligible': is_eligible,
            'has_entered': has_entered,
            'is_active': c.is_active(),
            'is_voting_open': c.is_voting_open(),
        })
    
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_campaign_enter(request, campaign_id):
    """Enter a campaign with a reel"""
    try:
        campaign = Campaign.objects.get(id=campaign_id)
        user = request.user
        reel_id = request.data.get('reel_id')
        
        # Check if campaign is active
        if not campaign.is_active():
            return Response({'error': 'Campaign is not accepting entries'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already entered
        if CampaignEntry.objects.filter(campaign=campaign, user=user).exists():
            return Response({'error': 'You have already entered this campaign'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get reel
        reel = Reel.objects.get(id=reel_id, user=user)
        
        # Check eligibility
        user_profile = user.profile if hasattr(user, 'profile') else None
        follower_count = Follow.objects.filter(following=user).count()
        
        if campaign.min_followers > 0 and follower_count < campaign.min_followers:
            return Response({'error': f'You need at least {campaign.min_followers} followers'}, status=status.HTTP_400_BAD_REQUEST)
        
        if user_profile and campaign.min_level > user_profile.level:
            return Response({'error': f'You need to be level {campaign.min_level}'}, status=status.HTTP_400_BAD_REQUEST)
        
        if campaign.min_votes_per_reel > 0 and reel.votes < campaign.min_votes_per_reel:
            return Response({'error': f'Reel needs at least {campaign.min_votes_per_reel} votes'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create entry
        entry = CampaignEntry.objects.create(
            campaign=campaign,
            user=user,
            reel=reel
        )
        
        # Update campaign stats
        campaign.total_entries += 1
        campaign.save()
        
        # Notify user
        CampaignNotification.objects.create(
            campaign=campaign,
            user=user,
            notification_type='entry_approved',
            message=f'Your entry to {campaign.title} has been approved!'
        )
        
        return Response({
            'message': 'Successfully entered campaign',
            'entry_id': entry.id
        }, status=status.HTTP_201_CREATED)
        
    except Campaign.DoesNotExist:
        return Response({'error': 'Campaign not found'}, status=status.HTTP_404_NOT_FOUND)
    except Reel.DoesNotExist:
        return Response({'error': 'Reel not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_campaign_vote(request, entry_id):
    """Vote for a campaign entry"""
    try:
        entry = CampaignEntry.objects.get(id=entry_id)
        user = request.user
        
        # Check if voting is open
        if not entry.campaign.is_voting_open():
            return Response({'error': 'Voting is not open for this campaign'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already voted
        if CampaignVote.objects.filter(entry=entry, user=user).exists():
            return Response({'error': 'You have already voted for this entry'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create vote
        CampaignVote.objects.create(entry=entry, user=user)
        
        # Update entry vote count
        entry.vote_count += 1
        entry.save()
        
        # Update campaign total votes
        entry.campaign.total_votes += 1
        entry.campaign.save()
        
        # Update rankings for all entries in this campaign
        update_campaign_rankings(entry.campaign)
        
        return Response({'message': 'Vote recorded successfully'})
        
    except CampaignEntry.DoesNotExist:
        return Response({'error': 'Entry not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_campaign_detail(request, campaign_id):
    """Get campaign details with entries"""
    try:
        campaign = Campaign.objects.get(id=campaign_id)
        entries = CampaignEntry.objects.filter(
            campaign=campaign,
            approved=True,
            disqualified=False
        ).select_related('user', 'reel').order_by('-vote_count')
        
        user = request.user
        
        entries_data = [{
            'id': entry.id,
            'user': {
                'id': entry.user.id,
                'username': entry.user.username,
            },
            'reel': {
                'id': entry.reel.id,
                'caption': entry.reel.caption,
                'image': entry.reel.image.url if entry.reel.image else None,
                'media': entry.reel.media.url if entry.reel.media else None,
            },
            'vote_count': entry.vote_count,
            'rank': entry.rank,
            'is_winner': entry.is_winner,
            'user_voted': CampaignVote.objects.filter(entry=entry, user=user).exists(),
        } for entry in entries]
        
        image_url = get_image_url(campaign.image)
        
        return Response({
            'id': campaign.id,
            'title': campaign.title,
            'description': campaign.description,
            'image': image_url,
            'prize_title': campaign.prize_title,
            'prize_description': campaign.prize_description,
            'prize_value': str(campaign.prize_value),
            'status': campaign.status,
            'start_date': campaign.start_date,
            'entry_deadline': campaign.entry_deadline,
            'voting_start': campaign.voting_start,
            'voting_end': campaign.voting_end,
            'total_entries': campaign.total_entries,
            'total_votes': campaign.total_votes,
            'winners_announced': campaign.winners_announced,
            'entries': entries_data,
        })
        
    except Campaign.DoesNotExist:
        return Response({'error': 'Campaign not found'}, status=status.HTTP_404_NOT_FOUND)

# Helper functions
def update_campaign_rankings(campaign):
    """Update rankings for all entries in a campaign based on vote count"""
    entries = CampaignEntry.objects.filter(
        campaign=campaign,
        approved=True,
        disqualified=False
    ).order_by('-vote_count', '-created_at')
    
    rank = 1
    for entry in entries:
        entry.rank = rank
        entry.save(update_fields=['rank'])
        rank += 1

def notify_eligible_users(campaign):
    """Notify users who are eligible for the campaign"""
    # This would integrate with your notification system
    pass

def notify_voting_started(campaign):
    """Notify participants that voting has started"""
    entries = CampaignEntry.objects.filter(campaign=campaign)
    for entry in entries:
        CampaignNotification.objects.create(
            campaign=campaign,
            user=entry.user,
            notification_type='voting_started',
            message=f'Voting has started for {campaign.title}! Good luck!'
        )
