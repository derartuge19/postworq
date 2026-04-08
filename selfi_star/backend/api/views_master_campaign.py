from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models_master_campaign import MasterCampaign, MasterCampaignParticipant
from .serializers_master_campaign import MasterCampaignSerializer, MasterCampaignParticipantSerializer
from .models_campaign import Campaign

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def master_campaign_list(request):
    """List all master campaigns or create a new one"""
    if request.method == 'GET':
        campaigns = MasterCampaign.objects.all().order_by('-created_at')
        serializer = MasterCampaignSerializer(campaigns, many=True)
        return Response({'master_campaigns': serializer.data})
    
    elif request.method == 'POST':
        serializer = MasterCampaignSerializer(data=request.data)
        if serializer.is_valid():
            # Set created_by to current user
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def master_campaign_detail(request, pk):
    """Get, update or delete a specific master campaign"""
    try:
        campaign = MasterCampaign.objects.get(pk=pk)
    except MasterCampaign.DoesNotExist:
        return Response({'error': 'Master campaign not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = MasterCampaignSerializer(campaign)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = MasterCampaignSerializer(campaign, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        campaign.delete()
        return Response({'message': 'Master campaign deleted successfully'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def master_campaign_participants(request, pk):
    """Get participants of a specific master campaign"""
    try:
        campaign = MasterCampaign.objects.get(pk=pk)
        participants = campaign.participants.all().order_by('-total_score')
        serializer = MasterCampaignParticipantSerializer(participants, many=True)
        return Response({'participants': serializer.data})
    except MasterCampaign.DoesNotExist:
        return Response({'error': 'Master campaign not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_master_campaign(request, pk):
    """Join a master campaign"""
    try:
        campaign = MasterCampaign.objects.get(pk=pk)
        
        # Check if campaign is active or upcoming
        if not (campaign.is_active() or campaign.is_upcoming()):
            return Response({'error': 'Cannot join this campaign'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already joined
        if campaign.participants.filter(user=request.user).exists():
            return Response({'error': 'Already joined this campaign'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check entry requirements
        if campaign.min_followers > 0:
            # This would need to be implemented based on your follower counting logic
            pass
        
        if campaign.min_level > request.user.profile.level:
            return Response({'error': f'Minimum level {campaign.min_level} required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create participant
        participant = MasterCampaignParticipant.objects.create(
            master_campaign=campaign,
            user=request.user
        )
        
        # Update campaign stats
        campaign.total_participants += 1
        campaign.save()
        
        serializer = MasterCampaignParticipantSerializer(participant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except MasterCampaign.DoesNotExist:
        return Response({'error': 'Master campaign not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def master_campaign_stats(request, pk):
    """Get detailed statistics for a master campaign"""
    try:
        campaign = MasterCampaign.objects.get(pk=pk)
        
        # Get sub-campaigns stats
        sub_campaigns = campaign.sub_campaigns.all()
        campaign_stats = {
            'daily': sub_campaigns.filter(campaign_type='daily').count(),
            'weekly': sub_campaigns.filter(campaign_type='weekly').count(),
            'monthly': sub_campaigns.filter(campaign_type='monthly').count(),
            'grand': sub_campaigns.filter(campaign_type='grand').count(),
        }
        
        # Get participant stats
        participants = campaign.participants.all()
        participant_stats = {
            'total': participants.count(),
            'active': participants.filter(is_active=True).count(),
            'top_performers': participants.order_by('-total_score')[:10].values(
                'user__username', 'total_score', 'total_posts'
            )
        }
        
        # Get recent activity
        recent_campaigns = sub_campaigns.order_by('-created_at')[:5]
        recent_serializer = MasterCampaignSerializer(recent_campaigns, many=True)
        
        return Response({
            'campaign': MasterCampaignSerializer(campaign).data,
            'campaign_stats': campaign_stats,
            'participant_stats': participant_stats,
            'recent_campaigns': recent_serializer.data
        })
        
    except MasterCampaign.DoesNotExist:
        return Response({'error': 'Master campaign not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def generate_sub_campaigns(request, pk):
    """Generate sub-campaigns for a master campaign"""
    try:
        campaign = MasterCampaign.objects.get(pk=pk)
        
        if not campaign.start_date or not campaign.end_date:
            return Response({'error': 'Master campaign must have start and end dates'}, status=status.HTTP_400_BAD_REQUEST)
        
        generated_campaigns = []
        
        # Generate daily campaigns
        if campaign.auto_generate_daily and request.data.get('generate_daily', True):
            current_date = campaign.start_date.date()
            end_date = campaign.end_date.date()
            
            while current_date <= end_date:
                # Check if daily campaign already exists
                if not campaign.sub_campaigns.filter(
                    campaign_type='daily',
                    start_date__date=current_date
                ).exists():
                    
                    daily_campaign = Campaign.objects.create(
                        title=f"{campaign.title} - Daily {current_date.strftime('%b %d')}",
                        description=f"Daily campaign for {current_date.strftime('%B %d, %Y')}",
                        campaign_type='daily',
                        master_campaign=campaign,
                        start_date=timezone.make_aware(timezone.datetime.combine(current_date, timezone.datetime.min.time()).replace(hour=0, minute=0)),
                        end_date=timezone.make_aware(timezone.datetime.combine(current_date, timezone.datetime.min.time()).replace(hour=23, minute=59)),
                        entry_deadline=timezone.make_aware(timezone.datetime.combine(current_date, timezone.datetime.min.time()).replace(hour=20, minute=0)),
                        status='active' if current_date <= timezone.now().date() else 'upcoming',
                        prize_title="Daily Winner",
                        prize_description="Daily campaign winner",
                        min_followers=campaign.min_followers,
                        min_level=campaign.min_level,
                        required_hashtags=campaign.required_hashtags,
                        created_by=request.user
                    )
                    generated_campaigns.append(daily_campaign)
                
                current_date += timedelta(days=1)
        
        # Generate weekly campaigns
        if campaign.auto_generate_weekly and request.data.get('generate_weekly', True):
            # Implementation for weekly campaigns
            pass
        
        # Generate monthly campaigns
        if campaign.auto_generate_monthly and request.data.get('generate_monthly', True):
            # Implementation for monthly campaigns
            pass
        
        # Generate grand campaign
        if campaign.auto_generate_grand and request.data.get('generate_grand', True):
            if not campaign.sub_campaigns.filter(campaign_type='grand').exists():
                grand_campaign = Campaign.objects.create(
                    title=f"{campaign.title} - Grand Finale",
                    description=f"Grand campaign finale for {campaign.title}",
                    campaign_type='grand',
                    master_campaign=campaign,
                    start_date=campaign.end_date - timedelta(days=7),
                    end_date=campaign.end_date,
                    entry_deadline=campaign.end_date - timedelta(days=3),
                    voting_start=campaign.end_date - timedelta(days=3),
                    voting_end=campaign.end_date,
                    status='upcoming',
                    prize_title="Grand Champion",
                    prize_description="Ultimate winner of the season",
                    min_followers=campaign.min_followers,
                    min_level=campaign.min_level,
                    required_hashtags=campaign.required_hashtags,
                    created_by=request.user
                )
                generated_campaigns.append(grand_campaign)
        
        # Update campaign stats
        campaign.total_daily_campaigns = campaign.sub_campaigns.filter(campaign_type='daily').count()
        campaign.total_weekly_campaigns = campaign.sub_campaigns.filter(campaign_type='weekly').count()
        campaign.total_monthly_campaigns = campaign.sub_campaigns.filter(campaign_type='monthly').count()
        campaign.total_grand_campaigns = campaign.sub_campaigns.filter(campaign_type='grand').count()
        campaign.save()
        
        return Response({
            'message': f'Generated {len(generated_campaigns)} sub-campaigns',
            'campaigns': [c.title for c in generated_campaigns]
        })
        
    except MasterCampaign.DoesNotExist:
        return Response({'error': 'Master campaign not found'}, status=status.HTTP_404_NOT_FOUND)
