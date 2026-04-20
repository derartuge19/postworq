# Generated migration to add missing Comment fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0040_rename_api_convers_last_me_idx_api_convers_last_me_eb2fc0_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='comment',
            name='edited_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='comment',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='commentreply',
            name='edited_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='commentreply',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
    ]
