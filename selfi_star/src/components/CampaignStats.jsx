import React, { useState, useEffect } from 'react';
import api from '../api';
import { Trophy, Award, TrendingUp, Target, Calendar } from 'lucide-react';

const CampaignStats = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.request(`/campaigns/profile/${userId || ''}`);
      setStats(response);
    } catch (error) {
      console.error('Error loading campaign stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#999' }}>Loading campaign stats...</div>
      </div>
    );
  }

  if (!stats || stats.campaigns?.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Trophy size={20} color="#FFD700" />
        Campaign Achievements
      </h3>

      {/* Overall Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <StatCard
          icon={<Target size={18} />}
          label="Campaigns"
          value={stats.total_campaigns || 0}
          color="#2196f3"
        />
        <StatCard
          icon={<Award size={18} />}
          label="Total Score"
          value={stats.total_score || 0}
          color="#9c27b0"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Best Rank"
          value={stats.best_rank ? `#${stats.best_rank}` : '-'}
          color="#4caf50"
        />
        <StatCard
          icon={<Calendar size={18} />}
          label="Streak"
          value={stats.current_streak || 0}
          color="#ff9800"
        />
      </div>

      {/* Campaign List */}
      {stats.campaigns && stats.campaigns.length > 0 && (
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#666' }}>
            Active Campaigns
          </h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {stats.campaigns.map((campaign) => (
              <div
                key={campaign.campaign_id}
                style={{
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                    {campaign.campaign_title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {campaign.posts_count} posts • Rank #{campaign.rank || '-'}
                  </div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {campaign.total_score} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {stats.badges && stats.badges.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#666' }}>
            Badges Earned
          </h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {stats.badges.map((badge, idx) => (
              <div
                key={idx}
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Award size={14} />
                {badge.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  return (
    <div style={{
      background: 'white',
      border: `2px solid ${color}`,
      borderRadius: '8px',
      padding: '12px',
      textAlign: 'center'
    }}>
      <div style={{ color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
        {icon}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#999' }}>
        {label}
      </div>
    </div>
  );
};

export default CampaignStats;
