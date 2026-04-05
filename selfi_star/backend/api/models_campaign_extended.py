from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from .models_campaign import Campaign, CampaignEntry

class CampaignScoringConfig(models.Model):
    """Configurable scoring weights for campaigns"""
    campaign = models.OneToOneField(Campaign, on_delete=models.CASCADE, related_name='scoring_config')
    
    # Maximum points for each component (configurable by admin)
    max_creativity_points = models.DecimalField(max_digits=5, decimal_places=2, default=30, help_text='Max points for creativity')
    max_engagement_points = models.DecimalField(max_digits=5, decimal_places=2, default=25, help_text='Max points for engagement')
    max_consistency_points = models.DecimalField(max_digits=5, decimal_places=2, default=20, help_text='Max points for consistency')
    max_quality_points = models.DecimalField(max_digits=5, decimal_places=2, default=15, help_text='Max points for quality')
    max_theme_relevance_points = models.DecimalField(max_digits=5, decimal_places=2, default=10, help_text='Max points for theme relevance')
    
    # Engagement calculation weights
    likes_weight = models.DecimalField(max_digits=5, decimal_places=2, default=0.6, help_text='Weight for likes in engagement score')
    comments_weight = models.DecimalField(max_digits=5, decimal_places=2, default=1.5, help_text='Weight for comments in engagement score')
    shares_weight = models.DecimalField(max_digits=5, decimal_places=2, default=2.0, help_text='Weight for shares in engagement score')
    
    # Consistency calculation settings
    streak_points_per_day = models.DecimalField(max_digits=5, decimal_places=2, default=1.0, help_text='Points per day of streak')
    participation_points_per_day = models.DecimalField(max_digits=5, decimal_places=2, default=0.5, help_text='Points per day participated')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Campaign Scoring Configuration'
        verbose_name_plural = 'Campaign Scoring Configurations'
    
    def __str__(self):
        return f"Scoring Config for {self.campaign.title}"
    
    def get_total_max_points(self):
        """Calculate total maximum possible points"""
        return (
            self.max_creativity_points +
            self.max_engagement_points +
            self.max_consistency_points +
            self.max_quality_points +
            self.max_theme_relevance_points
        )

class CampaignTheme(models.Model):
    """Weekly themes for campaigns"""
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='themes')
    title = models.CharField(max_length=200)
    description = models.TextField()
    week_number = models.IntegerField(help_text='Week 1, 2, 3, etc.')
    
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    hashtags = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['campaign', 'week_number']
        unique_together = ['campaign', 'week_number']
    
    def __str__(self):
        return f"{self.campaign.title} - Week {self.week_number}: {self.title}"
    
    def activate(self):
        """Activate this theme and deactivate others in the same campaign"""
        CampaignTheme.objects.filter(campaign=self.campaign).update(is_active=False)
        self.is_active = True
        self.save()

class PostScore(models.Model):
    """Scoring for campaign posts"""
    MODERATION_STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    reel = models.OneToOneField('api.Reel', on_delete=models.CASCADE, related_name='campaign_score')
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='post_scores')
    theme = models.ForeignKey(CampaignTheme, on_delete=models.SET_NULL, null=True, blank=True, related_name='post_scores')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaign_scores')
    
    # Moderation
    moderation_status = models.CharField(max_length=20, choices=MODERATION_STATUS, default='pending')
    rejection_reason = models.TextField(blank=True)
    moderated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='moderated_posts')
    moderated_at = models.DateTimeField(null=True, blank=True)
    
    # Score components (out of 100 total)
    creativity_score = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Max 30 points')
    engagement_score = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Max 25 points')
    consistency_score = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Max 20 points')
    quality_score = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Max 15 points')
    theme_relevance_score = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Max 10 points')
    
    # Total score
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-total_score', '-created_at']
        indexes = [
            models.Index(fields=['campaign', '-total_score']),
            models.Index(fields=['user', 'campaign']),
        ]
    
    def __str__(self):
        return f"Score for {self.user.username} - {self.total_score}"
    
    def calculate_total_score(self):
        """Calculate and update total score"""
        self.total_score = (
            self.creativity_score +
            self.engagement_score +
            self.consistency_score +
            self.quality_score +
            self.theme_relevance_score
        )
        self.save()
        return self.total_score
    
    def update_engagement_score(self):
        """Calculate engagement score based on likes, comments, shares using configurable weights"""
        from .models import Vote, Comment
        
        # Get scoring config for this campaign
        config = CampaignScoringConfig.objects.filter(campaign=self.campaign).first()
        if not config:
            # Create default config if not exists
            config = CampaignScoringConfig.objects.create(campaign=self.campaign)
        
        likes = Vote.objects.filter(reel=self.reel).count()
        comments = Comment.objects.filter(reel=self.reel).count()
        # shares = 0  # TODO: Implement shares tracking
        
        # Use configurable weights
        raw_engagement = (likes * float(config.likes_weight)) + (comments * float(config.comments_weight))
        
        # Normalize to max points configured by admin
        max_points = float(config.max_engagement_points)
        self.engagement_score = min(max_points, raw_engagement / 10)  # Scale down
        self.save()
        self.calculate_total_score()

class UserCampaignStats(models.Model):
    """Aggregated stats for user participation in a campaign"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaign_stats')
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='user_stats')
    
    # Participation metrics
    total_posts = models.IntegerField(default=0)
    approved_posts = models.IntegerField(default=0)
    rejected_posts = models.IntegerField(default=0)
    
    # Scoring
    total_score = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Consistency tracking
    days_participated = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_post_date = models.DateField(null=True, blank=True)
    
    # Rankings
    daily_rank = models.IntegerField(null=True, blank=True)
    weekly_rank = models.IntegerField(null=True, blank=True)
    monthly_rank = models.IntegerField(null=True, blank=True)
    overall_rank = models.IntegerField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'campaign']
        ordering = ['-total_score']
        indexes = [
            models.Index(fields=['campaign', '-total_score']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.campaign.title} ({self.total_score})"
    
    def update_stats(self):
        """Recalculate all stats for this user in this campaign"""
        scores = PostScore.objects.filter(
            user=self.user,
            campaign=self.campaign,
            moderation_status='approved'
        )
        
        self.approved_posts = scores.count()
        self.total_score = sum(score.total_score for score in scores)
        self.average_score = self.total_score / self.approved_posts if self.approved_posts > 0 else 0
        
        # Update rejected posts
        self.rejected_posts = PostScore.objects.filter(
            user=self.user,
            campaign=self.campaign,
            moderation_status='rejected'
        ).count()
        
        self.total_posts = self.approved_posts + self.rejected_posts
        self.save()

class Leaderboard(models.Model):
    """Leaderboard snapshots for different time periods"""
    PERIOD_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('overall', 'Overall'),
    ]
    
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='leaderboards')
    period_type = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    is_current = models.BooleanField(default=True)
    is_finalized = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-period_start']
        indexes = [
            models.Index(fields=['campaign', 'period_type', '-period_start']),
        ]
    
    def __str__(self):
        return f"{self.campaign.title} - {self.period_type} ({self.period_start.date()})"

class LeaderboardEntry(models.Model):
    """Individual entries in a leaderboard"""
    leaderboard = models.ForeignKey(Leaderboard, on_delete=models.CASCADE, related_name='entries')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leaderboard_entries')
    
    rank = models.IntegerField()
    score = models.DecimalField(max_digits=10, decimal_places=2)
    posts_count = models.IntegerField(default=0)
    
    # Bonus points
    bonus_points = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['rank']
        unique_together = ['leaderboard', 'user']
        indexes = [
            models.Index(fields=['leaderboard', 'rank']),
        ]
    
    def __str__(self):
        return f"#{self.rank} {self.user.username} - {self.score}"

class WinnerSelection(models.Model):
    """Track winner selection for different periods"""
    SELECTION_TYPE = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('grand', 'Grand Finale'),
    ]
    
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='winner_selections')
    selection_type = models.CharField(max_length=20, choices=SELECTION_TYPE)
    leaderboard = models.ForeignKey(Leaderboard, on_delete=models.CASCADE, related_name='winner_selections')
    
    # Selection criteria
    top_scorers_percentage = models.IntegerField(default=70, help_text='Percentage from top scorers')
    random_participants_percentage = models.IntegerField(default=30, help_text='Percentage from random active users')
    
    is_finalized = models.BooleanField(default=False)
    finalized_at = models.DateTimeField(null=True, blank=True)
    finalized_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='finalized_selections')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.campaign.title} - {self.selection_type} winners"

class SelectedWinner(models.Model):
    """Individual winners from selection process"""
    selection = models.ForeignKey(WinnerSelection, on_delete=models.CASCADE, related_name='winners')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaign_winner_selections')
    
    rank = models.IntegerField()
    final_score = models.DecimalField(max_digits=10, decimal_places=2)
    selection_method = models.CharField(max_length=20, choices=[('top_scorer', 'Top Scorer'), ('random', 'Random Selection')])
    
    prize_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    prize_claimed = models.BooleanField(default=False)
    prize_claimed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['rank']
        unique_together = ['selection', 'rank']
    
    def __str__(self):
        return f"#{self.rank} {self.user.username} - {self.selection.selection_type}"

class CampaignBadge(models.Model):
    """Badges earned by users in campaigns"""
    BADGE_TYPES = [
        ('participation', 'Participation'),
        ('consistency', 'Consistency'),
        ('top_scorer', 'Top Scorer'),
        ('winner', 'Winner'),
        ('engagement_king', 'Engagement King'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaign_badges')
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='badges')
    badge_type = models.CharField(max_length=50, choices=BADGE_TYPES)
    
    title = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, blank=True, help_text='Emoji or icon identifier')
    
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-earned_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
