import React, { useState, useEffect } from 'react';
import api from '../../api';
import { ArrowLeft, Save, RotateCcw, Info } from 'lucide-react';


const CampaignScoringConfig = ({ campaignId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [config, setConfig] = useState({
    max_creativity_points: 30,
    max_engagement_points: 25,
    max_consistency_points: 20,
    max_quality_points: 15,
    max_theme_relevance_points: 10,
    likes_weight: 0.6,
    comments_weight: 1.5,
    shares_weight: 2.0,
    streak_points_per_day: 1.0,
    participation_points_per_day: 0.5,
  });

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignRes, configRes] = await Promise.all([
        api.request(`/campaigns/${campaignId}/`),
        api.request(`/admin/campaigns/${campaignId}/scoring-config/`)
      ]);
      setCampaign(campaignRes);
      if (configRes.max_points) {
        setConfig({
          max_creativity_points: configRes.max_points.creativity,
          max_engagement_points: configRes.max_points.engagement,
          max_consistency_points: configRes.max_points.consistency,
          max_quality_points: configRes.max_points.quality,
          max_theme_relevance_points: configRes.max_points.theme_relevance,
          likes_weight: configRes.engagement_weights.likes,
          comments_weight: configRes.engagement_weights.comments,
          shares_weight: configRes.engagement_weights.shares,
          streak_points_per_day: configRes.consistency_settings.streak_points_per_day,
          participation_points_per_day: configRes.consistency_settings.participation_points_per_day,
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load scoring configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.request(`/admin/campaigns/${campaignId}/scoring-config/`, {
        method: 'POST',
        body: JSON.stringify(config)
      });
      alert('Scoring configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save scoring configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset scoring configuration to defaults? This cannot be undone.')) {
      return;
    }
    try {
      setSaving(true);
      await api.request(`/admin/campaigns/${campaignId}/scoring-config/reset/`, {
        method: 'POST'
      });
      alert('Scoring configuration reset to defaults!');
      loadData();
    } catch (error) {
      console.error('Error resetting config:', error);
      alert('Failed to reset scoring configuration');
    } finally {
      setSaving(false);
    }
  };

  const getTotalMaxPoints = () => {
    return (
      parseFloat(config.max_creativity_points) +
      parseFloat(config.max_engagement_points) +
      parseFloat(config.max_consistency_points) +
      parseFloat(config.max_quality_points) +
      parseFloat(config.max_theme_relevance_points)
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => onBack?.()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#f0f0f0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          <ArrowLeft size={20} />
          Back to Campaigns
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Scoring Configuration
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          {campaign?.title}
        </p>
      </div>

      {/* Info Banner */}
      <div style={{
        background: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '30px',
        display: 'flex',
        gap: '12px'
      }}>
        <Info size={20} color="#2196f3" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '14px', color: '#1565c0' }}>
          <strong>Total Max Points: {getTotalMaxPoints()}</strong>
          <br />
          Configure how posts are scored in this campaign. Changes apply to all future scoring calculations.
        </div>
      </div>

      {/* Maximum Points Section */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          Maximum Points per Component
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Creativity Points
            </label>
            <input
              type="number"
              step="0.01"
              value={config.max_creativity_points}
              onChange={(e) => setConfig({ ...config, max_creativity_points: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Manual admin scoring</small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Engagement Points
            </label>
            <input
              type="number"
              step="0.01"
              value={config.max_engagement_points}
              onChange={(e) => setConfig({ ...config, max_engagement_points: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Likes, comments, shares</small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Consistency Points
            </label>
            <input
              type="number"
              step="0.01"
              value={config.max_consistency_points}
              onChange={(e) => setConfig({ ...config, max_consistency_points: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Posting frequency</small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Quality Points
            </label>
            <input
              type="number"
              step="0.01"
              value={config.max_quality_points}
              onChange={(e) => setConfig({ ...config, max_quality_points: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Video/image quality</small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Theme Relevance Points
            </label>
            <input
              type="number"
              step="0.01"
              value={config.max_theme_relevance_points}
              onChange={(e) => setConfig({ ...config, max_theme_relevance_points: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Match with theme</small>
          </div>
        </div>
      </div>

      {/* Engagement Weights Section */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          Engagement Calculation Weights
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Likes Weight
            </label>
            <input
              type="number"
              step="0.1"
              value={config.likes_weight}
              onChange={(e) => setConfig({ ...config, likes_weight: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Points per like</small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Comments Weight
            </label>
            <input
              type="number"
              step="0.1"
              value={config.comments_weight}
              onChange={(e) => setConfig({ ...config, comments_weight: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Points per comment</small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Shares Weight
            </label>
            <input
              type="number"
              step="0.1"
              value={config.shares_weight}
              onChange={(e) => setConfig({ ...config, shares_weight: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Points per share</small>
          </div>
        </div>
      </div>

      {/* Consistency Settings Section */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          Consistency Calculation Settings
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Points per Day of Streak
            </label>
            <input
              type="number"
              step="0.1"
              value={config.streak_points_per_day}
              onChange={(e) => setConfig({ ...config, streak_points_per_day: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Rewards consecutive posting days</small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Points per Day Participated
            </label>
            <input
              type="number"
              step="0.1"
              value={config.participation_points_per_day}
              onChange={(e) => setConfig({ ...config, participation_points_per_day: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Rewards total participation</small>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={handleReset}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1
          }}
        >
          <RotateCcw size={20} />
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1
          }}
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default CampaignScoringConfig;
