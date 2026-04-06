from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .views import (
    register, login, reset_password, create_post, search, UserProfileViewSet, ReelViewSet, QuestViewSet,
    SubscriptionViewSet, NotificationPreferenceViewSet, CompetitionViewSet, WinnerViewSet, FollowViewSet,
    get_user_notifications, mark_notifications_read, create_report, admin_reports_list, admin_report_detail, admin_reports_stats
)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Diagnostic health check endpoint"""
    from django.contrib.auth.models import User
    from django.conf import settings
    from .models import Reel
    from .models_campaign import Campaign
    
    db_engine = settings.DATABASES['default']['ENGINE']
    db_name = settings.DATABASES['default'].get('NAME', 'unknown')
    db_host = settings.DATABASES['default'].get('HOST', 'localhost')
    
    user_count = User.objects.count()
    reel_count = Reel.objects.count()
    campaign_count = Campaign.objects.count()
    
    # Get first 3 usernames for debugging
    usernames = list(User.objects.values_list('username', flat=True)[:3])
    
    return Response({
        'status': 'ok',
        'database': {
            'engine': db_engine,
            'name': db_name,
            'host': db_host[:30] + '...' if len(str(db_host)) > 30 else db_host,
        },
        'counts': {
            'users': user_count,
            'reels': reel_count,
            'campaigns': campaign_count,
        },
        'sample_usernames': usernames,
        'message': 'API is running'
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def cleanup_broken_reels(request):
    """Delete all reels that don't have valid Cloudinary URLs, and clear broken campaign images"""
    from .models import Reel
    from .models_campaign import Campaign
    from django.db.models import Q
    
    try:
        deleted_count = 0
        kept = []

        for reel in Reel.objects.all():
            image_name = reel.image.name if reel.image else ''
            media_name = reel.media.name if reel.media else ''

            # A reel is valid only if at least one field has a Cloudinary https URL
            image_ok = image_name.startswith('https://')
            media_ok = media_name.startswith('https://')

            if not image_ok and not media_ok:
                reel.delete()
                deleted_count += 1
            else:
                kept.append(reel.id)

        # Also clear broken campaign images (not https URLs)
        campaign_fixed = 0
        for campaign in Campaign.objects.all():
            img_name = campaign.image.name if campaign.image else ''
            if img_name and not img_name.startswith('https://'):
                campaign.image = None
                campaign.save()
                campaign_fixed += 1

        return Response({
            'deleted_reels': deleted_count,
            'kept_reels': len(kept),
            'fixed_campaigns': campaign_fixed,
            'remaining_reels': Reel.objects.count()
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)
from .views_extended import CommentViewSet, SavedPostViewSet, ProfilePhotoViewSet
from .views_admin import (
    admin_dashboard_stats, admin_users_list, admin_user_detail, admin_user_update, 
    admin_user_delete, admin_reels_list, admin_reel_delete, admin_reel_boost, 
    admin_subscription_upgrade, admin_comments_list, admin_comment_delete, 
    admin_analytics_export
)
from .views_settings import (
    get_platform_settings, update_platform_settings, get_api_keys, create_api_key,
    delete_api_key, toggle_api_key, get_system_logs, get_platform_performance,
    get_admin_notifications, mark_notification_read, send_platform_notification,
    bulk_user_action, get_database_stats
)
from .views_campaign import (
    admin_campaigns_list, admin_campaign_create, admin_campaign_update, admin_campaign_delete,
    admin_campaign_entries, admin_announce_winners, user_campaigns_list, user_campaign_enter,
    user_campaign_vote, user_campaign_detail
)
from .views_campaign_admin import (
    admin_campaign_themes, admin_campaign_theme_detail, admin_activate_theme,
    admin_campaign_posts_pending, admin_moderate_post, admin_update_post_scores,
    admin_generate_leaderboard, get_leaderboard as get_campaign_leaderboard, admin_select_winners, get_campaign_winners,
    admin_campaign_analytics
)
from .views_campaign_user import (
    get_active_campaigns, get_campaign_detail_extended, create_campaign_post,
    get_campaign_feed, get_user_campaign_profile, update_engagement_scores,
    update_consistency_scores, get_campaign_notifications
)
from .views_scoring_config import (
    admin_scoring_config, get_scoring_config, reset_scoring_config
)
from .views_reels import reels_following, reels_saved, reels_trending
from .views_contest import (
    get_user_subscription, upgrade_subscription, get_coin_packages, get_coin_balance,
    purchase_coins, gift_creator, boost_post, purchase_extra_entry, get_post_score,
    judge_post, get_leaderboard, admin_contest_dashboard, toggle_flash_challenge,
    admin_judging_portal, verify_phone, verify_age, anti_cheat_flags, review_flag,
    get_grand_finale, vote_grand_finale, check_upload_eligibility
)

router = DefaultRouter()
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'reels', ReelViewSet, basename='reel')
router.register(r'quests', QuestViewSet, basename='quest')
router.register(r'subscription', SubscriptionViewSet, basename='subscription')
router.register(r'notifications', NotificationPreferenceViewSet, basename='notification')
router.register(r'competitions', CompetitionViewSet, basename='competition')
router.register(r'winners', WinnerViewSet, basename='winner')
router.register(r'follows', FollowViewSet, basename='follow')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'saved', SavedPostViewSet, basename='saved')
router.register(r'profile-photo', ProfilePhotoViewSet, basename='profile-photo')

from .setup_admin_view import setup_admin

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('cleanup-reels/', cleanup_broken_reels, name='cleanup-reels'),
    path('auth/register/', register, name='auth-register'),
    path('auth/login/', login, name='auth-login'),
    path('auth/reset-password/', reset_password, name='auth-reset-password'),
    path('setup-admin/', setup_admin, name='setup-admin'),
    path('posts/create/', create_post, name='create-post'),
    path('notifications/', get_user_notifications, name='user-notifications'),
    path('notifications/read/', mark_notifications_read, name='mark-notifications-read'),
    path('search/', search, name='search'),
    # Report endpoints
    path('reports/create/', create_report, name='create-report'),
    path('admin/reports/', admin_reports_list, name='admin-reports-list'),
    path('admin/reports/<int:report_id>/', admin_report_detail, name='admin-report-detail'),
    path('admin/reports/stats/', admin_reports_stats, name='admin-reports-stats'),
    # Admin endpoints
    path('admin/dashboard/', admin_dashboard_stats, name='admin-dashboard'),
    path('admin/users/', admin_users_list, name='admin-users-list'),
    path('admin/users/<int:user_id>/', admin_user_detail, name='admin-user-detail'),
    path('admin/users/<int:user_id>/update/', admin_user_update, name='admin-user-update'),
    path('admin/users/<int:user_id>/delete/', admin_user_delete, name='admin-user-delete'),
    path('admin/reels/', admin_reels_list, name='admin-reels-list'),
    path('admin/reels/<int:reel_id>/delete/', admin_reel_delete, name='admin-reel-delete'),
    path('admin/reels/<int:reel_id>/boost/', admin_reel_boost, name='admin-reel-boost'),
    path('admin/subscriptions/<int:user_id>/upgrade/', admin_subscription_upgrade, name='admin-subscription-upgrade'),
    path('admin/comments/', admin_comments_list, name='admin-comments-list'),
    path('admin/comments/<int:comment_id>/delete/', admin_comment_delete, name='admin-comment-delete'),
    path('admin/analytics/export/', admin_analytics_export, name='admin-analytics-export'),
    # Settings & Configuration
    path('admin/settings/', get_platform_settings, name='admin-settings'),
    path('admin/settings/update/', update_platform_settings, name='admin-settings-update'),
    # API Keys
    path('admin/api-keys/', get_api_keys, name='admin-api-keys'),
    path('admin/api-keys/create/', create_api_key, name='admin-api-key-create'),
    path('admin/api-keys/<int:key_id>/delete/', delete_api_key, name='admin-api-key-delete'),
    path('admin/api-keys/<int:key_id>/toggle/', toggle_api_key, name='admin-api-key-toggle'),
    # System Monitoring
    path('admin/logs/', get_system_logs, name='admin-logs'),
    path('admin/performance/', get_platform_performance, name='admin-performance'),
    path('admin/database/', get_database_stats, name='admin-database'),
    # Notifications
    path('admin/notifications/', get_admin_notifications, name='admin-notifications'),
    path('admin/notifications/<int:notification_id>/read/', mark_notification_read, name='admin-notification-read'),
    path('admin/notifications/send/', send_platform_notification, name='admin-send-notification'),
    # Bulk Actions
    path('admin/users/bulk/', bulk_user_action, name='admin-bulk-action'),
    # Campaign Management (Admin)
    path('admin/campaigns/', admin_campaigns_list, name='admin-campaigns-list'),
    path('admin/campaigns/create/', admin_campaign_create, name='admin-campaign-create'),
    path('admin/campaigns/<int:campaign_id>/update/', admin_campaign_update, name='admin-campaign-update'),
    path('admin/campaigns/<int:campaign_id>/delete/', admin_campaign_delete, name='admin-campaign-delete'),
    path('admin/campaigns/<int:campaign_id>/entries/', admin_campaign_entries, name='admin-campaign-entries'),
    path('admin/campaigns/<int:campaign_id>/announce-winners/', admin_announce_winners, name='admin-announce-winners'),
    # Campaign Extended Admin
    path('admin/campaigns/<int:campaign_id>/themes/', admin_campaign_themes, name='admin-campaign-themes'),
    path('admin/campaigns/themes/<int:theme_id>/', admin_campaign_theme_detail, name='admin-campaign-theme-detail'),
    path('admin/campaigns/themes/<int:theme_id>/activate/', admin_activate_theme, name='admin-activate-theme'),
    path('admin/campaigns/<int:campaign_id>/posts/pending/', admin_campaign_posts_pending, name='admin-campaign-posts-pending'),
    path('admin/campaigns/posts/<int:score_id>/moderate/', admin_moderate_post, name='admin-moderate-post'),
    path('admin/campaigns/posts/<int:score_id>/scores/', admin_update_post_scores, name='admin-update-post-scores'),
    path('admin/campaigns/<int:campaign_id>/leaderboard/generate/', admin_generate_leaderboard, name='admin-generate-leaderboard'),
    path('admin/campaigns/<int:campaign_id>/winners/select/', admin_select_winners, name='admin-select-winners'),
    path('admin/campaigns/<int:campaign_id>/analytics/', admin_campaign_analytics, name='admin-campaign-analytics'),
    path('admin/campaigns/<int:campaign_id>/scoring-config/', admin_scoring_config, name='admin-scoring-config'),
    path('admin/campaigns/<int:campaign_id>/scoring-config/reset/', reset_scoring_config, name='reset-scoring-config'),
    
    # Campaign (User)
    path('campaigns/', user_campaigns_list, name='campaigns-list'),
    path('campaigns/active/', get_active_campaigns, name='campaigns-active'),
    path('campaigns/<int:campaign_id>/', user_campaign_detail, name='campaign-detail'),
    path('campaigns/<int:campaign_id>/extended/', get_campaign_detail_extended, name='campaign-detail-extended'),
    path('campaigns/<int:campaign_id>/enter/', user_campaign_enter, name='campaign-enter'),
    path('campaigns/entries/<int:entry_id>/vote/', user_campaign_vote, name='campaign-vote'),
    path('campaigns/<int:campaign_id>/leaderboard/', get_campaign_leaderboard, name='campaign-leaderboard'),
    path('campaigns/<int:campaign_id>/winners/', get_campaign_winners, name='campaign-winners'),
    path('campaigns/<int:campaign_id>/feed/', get_campaign_feed, name='campaign-feed'),
    path('campaigns/<int:campaign_id>/scoring-config/', get_scoring_config, name='campaign-scoring-config'),
    path('campaigns/posts/create/', create_campaign_post, name='create-campaign-post'),
    path('campaigns/notifications/', get_campaign_notifications, name='campaign-notifications'),
    path('campaigns/profile/', get_user_campaign_profile, name='user-campaign-profile'),
    path('campaigns/profile/<int:user_id>/', get_user_campaign_profile, name='user-campaign-profile-detail'),
    path('campaigns/<int:campaign_id>/engagement/update/', update_engagement_scores, name='update-engagement-scores'),
    path('campaigns/<int:campaign_id>/consistency/update/', update_consistency_scores, name='update-consistency-scores'),
    # Reels Feeds
    path('reels/following/', reels_following, name='reels-following'),
    path('reels/saved/', reels_saved, name='reels-saved'),
    path('reels/trending/', reels_trending, name='reels-trending'),
    # Contest System - User
    path('subscription/details/', get_user_subscription, name='subscription-details'),
    path('subscription/upgrade/', upgrade_subscription, name='subscription-upgrade'),
    path('coins/packages/', get_coin_packages, name='coin-packages'),
    path('coins/balance/', get_coin_balance, name='coin-balance'),
    path('coins/purchase/', purchase_coins, name='coin-purchase'),
    path('coins/gift/', gift_creator, name='gift-creator'),
    path('coins/boost/', boost_post, name='boost-post'),
    path('coins/extra-entry/', purchase_extra_entry, name='extra-entry'),
    path('scores/<int:reel_id>/', get_post_score, name='post-score'),
    path('leaderboard/', get_leaderboard, name='leaderboard'),
    path('eligibility/phone/', verify_phone, name='verify-phone'),
    path('eligibility/age/', verify_age, name='verify-age'),
    path('upload/check/', check_upload_eligibility, name='check-upload'),
    path('grand-finale/', get_grand_finale, name='grand-finale'),
    path('grand-finale/vote/', vote_grand_finale, name='grand-vote'),
    # Contest System - Admin
    path('admin/contest/dashboard/', admin_contest_dashboard, name='admin-contest-dashboard'),
    path('admin/contest/flash-toggle/', toggle_flash_challenge, name='flash-toggle'),
    path('admin/contest/judging/', admin_judging_portal, name='admin-judging'),
    path('admin/contest/judge/<int:reel_id>/', judge_post, name='judge-post'),
    path('admin/contest/anti-cheat/', anti_cheat_flags, name='anti-cheat-flags'),
    path('admin/contest/review-flag/<int:flag_id>/', review_flag, name='review-flag'),
    path('', include(router.urls)),
]
