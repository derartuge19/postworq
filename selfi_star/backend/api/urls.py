from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    register, login, create_post, search, UserProfileViewSet, ReelViewSet, QuestViewSet,
    SubscriptionViewSet, NotificationPreferenceViewSet, CompetitionViewSet, WinnerViewSet, FollowViewSet,
    get_user_notifications, mark_notifications_read, create_report, admin_reports_list, admin_report_detail, admin_reports_stats
)
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
from .views_reels import reels_following, reels_saved, reels_trending

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

urlpatterns = [
    path('auth/register/', register, name='auth-register'),
    path('auth/login/', login, name='auth-login'),
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
    # Campaign (User)
    path('campaigns/', user_campaigns_list, name='campaigns-list'),
    path('campaigns/<int:campaign_id>/', user_campaign_detail, name='campaign-detail'),
    path('campaigns/<int:campaign_id>/enter/', user_campaign_enter, name='campaign-enter'),
    path('campaigns/entries/<int:entry_id>/vote/', user_campaign_vote, name='campaign-vote'),
    # Reels Feeds
    path('reels/following/', reels_following, name='reels-following'),
    path('reels/saved/', reels_saved, name='reels-saved'),
    path('reels/trending/', reels_trending, name='reels-trending'),
    path('', include(router.urls)),
]
