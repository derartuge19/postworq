from django.db import migrations


def wipe_all_posts(apps, schema_editor):
    """One-time data migration: delete all reels/posts and related data."""
    CampaignVote = apps.get_model('api', 'CampaignVote')
    CampaignWinner = apps.get_model('api', 'CampaignWinner')
    CampaignNotification = apps.get_model('api', 'CampaignNotification')
    CampaignEntry = apps.get_model('api', 'CampaignEntry')
    CommentLike = apps.get_model('api', 'CommentLike')
    CommentReply = apps.get_model('api', 'CommentReply')
    Comment = apps.get_model('api', 'Comment')
    SavedPost = apps.get_model('api', 'SavedPost')
    Vote = apps.get_model('api', 'Vote')
    Reel = apps.get_model('api', 'Reel')

    CampaignVote.objects.all().delete()
    CampaignWinner.objects.all().delete()
    CampaignNotification.objects.all().delete()
    CampaignEntry.objects.all().delete()
    CommentLike.objects.all().delete()
    CommentReply.objects.all().delete()
    Comment.objects.all().delete()
    SavedPost.objects.all().delete()
    Vote.objects.all().delete()
    Reel.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0027_add_user_gamification'),
    ]

    operations = [
        migrations.RunPython(wipe_all_posts, migrations.RunPython.noop),
    ]
