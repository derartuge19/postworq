# Generated manually for campaign winner prize rules and cooldown enforcement

from django.db import migrations, models


def seed_campaign_prize_configs(apps, schema_editor):
    CampaignPrizeConfig = apps.get_model('api', 'CampaignPrizeConfig')
    defaults = [
        ('daily', 1, 200, 'data', '1GB Daily Data'),
        ('weekly', 1, 10, 'telebirr', '1000 ETB'),
        ('monthly', 1, 5, 'telebirr', '10000 ETB'),
        ('grand', 1, 3, 'telebirr', '500000 ETB'),
        ('grand', 2, 3, 'telebirr', '300000 ETB'),
        ('grand', 3, 3, 'telebirr', '200000 ETB'),
    ]
    for campaign_type, rank, winner_count, prize_type, prize_value in defaults:
        CampaignPrizeConfig.objects.get_or_create(
            campaign_type=campaign_type,
            rank=rank,
            defaults={
                'winner_count': winner_count,
                'prize_type': prize_type,
                'prize_value': prize_value,
                'cooldown_days': 30,
                'is_active': True,
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0061_subscriptionplan_setup_otp'),
    ]

    operations = [
        migrations.CreateModel(
            name='CampaignPrizeConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('campaign_type', models.CharField(choices=[('daily', 'Daily Campaign'), ('weekly', 'Weekly Campaign'), ('monthly', 'Monthly Campaign'), ('grand', 'Grand Campaign')], max_length=20)),
                ('rank', models.PositiveIntegerField(default=1)),
                ('winner_count', models.PositiveIntegerField(default=1)),
                ('prize_type', models.CharField(choices=[('data', 'Mobile Data'), ('telebirr', 'Telebirr Cash'), ('points', 'Points'), ('coins', 'Coins'), ('other', 'Other')], max_length=20)),
                ('prize_value', models.CharField(max_length=100)),
                ('cooldown_days', models.PositiveIntegerField(default=30)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['campaign_type', 'rank'],
                'unique_together': {('campaign_type', 'rank')},
            },
        ),
        migrations.AddField(
            model_name='campaignwinner',
            name='campaign_type',
            field=models.CharField(choices=[('daily', 'Daily Campaign'), ('weekly', 'Weekly Campaign'), ('monthly', 'Monthly Campaign'), ('grand', 'Grand Campaign')], default='daily', max_length=20),
        ),
        migrations.AddField(
            model_name='campaignwinner',
            name='cooldown_until',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='campaignwinner',
            name='final_score',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='campaignwinner',
            name='prize_type',
            field=models.CharField(choices=[('data', 'Mobile Data'), ('telebirr', 'Telebirr Cash'), ('points', 'Points'), ('coins', 'Coins'), ('other', 'Other')], default='other', max_length=20),
        ),
        migrations.AddField(
            model_name='campaignwinner',
            name='prize_value',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='selectedwinner',
            name='cooldown_until',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='selectedwinner',
            name='prize_type',
            field=models.CharField(choices=[('data', 'Mobile Data'), ('telebirr', 'Telebirr Cash'), ('points', 'Points'), ('coins', 'Coins'), ('other', 'Other')], default='other', max_length=20),
        ),
        migrations.AddField(
            model_name='selectedwinner',
            name='prize_value',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='campaignscoringconfig',
            name='daily_coin_gift_weight',
            field=models.DecimalField(decimal_places=2, default=10.0, help_text='Points per gift/vote point received', max_digits=5),
        ),
        migrations.AlterField(
            model_name='campaignscoringconfig',
            name='daily_shares_weight',
            field=models.DecimalField(decimal_places=2, default=5.0, help_text='Points per share (Daily)', max_digits=5),
        ),
        migrations.AlterField(
            model_name='campaignscoringconfig',
            name='daily_win_cooldown_days',
            field=models.IntegerField(default=30, help_text='Days before user can win again (Daily)'),
        ),
        migrations.AlterField(
            model_name='campaignscoringconfig',
            name='grand_qualification_shares_weight',
            field=models.DecimalField(decimal_places=2, default=5.0, help_text='Points per share (Qualification)', max_digits=5),
        ),
        migrations.AlterField(
            model_name='campaignscoringconfig',
            name='monthly_coin_gift_weight',
            field=models.DecimalField(decimal_places=2, default=10.0, help_text='Points per gift/vote point (Monthly)', max_digits=5),
        ),
        migrations.AlterField(
            model_name='campaignscoringconfig',
            name='monthly_shares_weight',
            field=models.DecimalField(decimal_places=2, default=5.0, help_text='Points per share (Monthly)', max_digits=5),
        ),
        migrations.AlterField(
            model_name='campaignscoringconfig',
            name='weekly_coin_gift_weight',
            field=models.DecimalField(decimal_places=2, default=10.0, help_text='Points per gift/vote point (Weekly)', max_digits=5),
        ),
        migrations.AlterField(
            model_name='campaignscoringconfig',
            name='weekly_shares_weight',
            field=models.DecimalField(decimal_places=2, default=5.0, help_text='Points per share (Weekly)', max_digits=5),
        ),
        migrations.AlterField(
            model_name='postscore',
            name='engagement_score',
            field=models.DecimalField(decimal_places=2, default=0, help_text='Formula: likes*1 + comments*2 + shares*5 + gift/vote points*10', max_digits=12),
        ),
        migrations.AlterField(
            model_name='postscore',
            name='total_score',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddIndex(
            model_name='campaignwinner',
            index=models.Index(fields=['user', 'campaign_type', 'cooldown_until'], name='campaign_win_cooldown_idx'),
        ),
        migrations.AddIndex(
            model_name='campaignprizeconfig',
            index=models.Index(fields=['campaign_type', 'is_active'], name='api_campaig_campaig_e83d6e_idx'),
        ),
        migrations.RunPython(seed_campaign_prize_configs, migrations.RunPython.noop),
    ]
