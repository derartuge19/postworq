# Generated migration to create UserProfile for existing users

from django.db import migrations
from django.contrib.auth.models import User
from api.models import UserProfile

def create_missing_user_profiles(apps, schema_editor):
    for user in User.objects.all():
        UserProfile.objects.get_or_create(user=user)

def reverse_create_missing_user_profiles(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_cleanup_broken_video_urls'),
    ]

    operations = [
        migrations.RunPython(create_missing_user_profiles, reverse_create_missing_user_profiles),
    ]
