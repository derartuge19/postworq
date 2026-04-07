from django.db import migrations, connection


def wipe_all_posts(apps, schema_editor):
    """One-time data migration: delete all reels/posts and related data using raw SQL."""
    tables_to_wipe = [
        'api_campaignvote',
        'api_campaignwinner',
        'api_campaignnotification',
        'api_campaignentry',
        'api_commentlike',
        'api_commentreply',
        'api_comment',
        'api_savedpost',
        'api_vote',
        # Tables from contest models that may or may not exist
        'contest_post_scores',
        'contest_judge_scores',
        'contest_finalist',
        'contest_boost',
        'contest_gift',
        # Finally the reels
        'api_reel',
    ]
    existing = set(connection.introspection.table_names())
    with connection.cursor() as cursor:
        # Use TRUNCATE CASCADE on api_reel — Postgres will auto-cascade
        # to ALL tables that reference it, even ones we didn't list
        if 'api_reel' in existing:
            cursor.execute('TRUNCATE TABLE "api_reel" CASCADE')
        # Clean up any remaining child-only data
        for table in tables_to_wipe:
            if table in existing and table != 'api_reel':
                cursor.execute(f'TRUNCATE TABLE "{table}" CASCADE')


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0027_add_user_gamification'),
    ]

    operations = [
        migrations.RunPython(wipe_all_posts, migrations.RunPython.noop),
    ]
