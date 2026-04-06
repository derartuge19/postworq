import { useState, useEffect } from 'react';
import api from '../../api';

export function CampaignScoringConfig({ campaignId, campaignType, onBack, theme }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(campaignType || 'daily');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadConfig();
  }, [campaignId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.request(`/admin/campaigns/${campaignId}/scoring-config/`);
      setConfig(response);
      setActiveTab(response.campaign_type || 'daily');
    } catch (error) {
      console.error('Failed to load scoring config:', error);
      setMessage({ type: 'error', text: 'Failed to load scoring configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.request(`/admin/campaigns/${campaignId}/scoring-config/update/`, {
        method: 'PUT',
        body: JSON.stringify({ [activeTab]: config[activeTab] })
      });
      setMessage({ type: 'success', text: 'Configuration saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [section]: {
          ...prev[activeTab][section],
          [field]: parseFloat(value) || 0
        }
      }
    }));
  };

  const updateSimpleField = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: parseFloat(value) || parseInt(value) || 0
      }
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.sub }}>
        Loading scoring configuration...
      </div>
    );
  }

  const tabs = [
    { key: 'daily', label: 'Daily', icon: '☀️' },
    { key: 'weekly', label: 'Weekly', icon: '📅' },
    { key: 'monthly', label: 'Monthly', icon: '📆' },
    { key: 'grand', label: 'Grand', icon: '👑' },
  ];

  return (
    <div style={{ marginLeft: 240, padding: '20px 40px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: theme.pri,
            cursor: 'pointer',
            fontSize: 14,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          ← Back to Campaign
        </button>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: theme.txt }}>
          Scoring Configuration
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: 14, color: theme.sub }}>
          Configure scoring weights and rules for each campaign type
        </p>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
          background: message.type === 'success' ? theme.green + '15' : theme.red + '15',
          border: `1px solid ${message.type === 'success' ? theme.green : theme.red}`,
          color: message.type === 'success' ? theme.green : theme.red
        }}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `2px solid ${theme.border}` }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === tab.key ? theme.pri : theme.sub,
              borderBottom: `2px solid ${activeTab === tab.key ? theme.pri : 'transparent'}`,
              marginBottom: -2,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Configuration Form */}
      <div style={{ background: theme.card, borderRadius: 12, padding: 24 }}>
        {activeTab === 'daily' && <DailyConfig config={config?.daily} updateField={updateField} updateSimpleField={updateSimpleField} theme={theme} />}
        {activeTab === 'weekly' && <WeeklyConfig config={config?.weekly} updateField={updateField} updateSimpleField={updateSimpleField} theme={theme} />}
        {activeTab === 'monthly' && <MonthlyConfig config={config?.monthly} updateField={updateField} updateSimpleField={updateSimpleField} theme={theme} />}
        {activeTab === 'grand' && <GrandConfig config={config?.grand} updateField={updateField} updateSimpleField={updateSimpleField} theme={theme} />}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
        <button
          onClick={loadConfig}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: 'white',
            color: theme.txt,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          Reset Changes
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            background: theme.pri,
            color: 'white',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}

function DailyConfig({ config, updateField, updateSimpleField, theme }) {
  if (!config) return null;

  return (
    <div>
      <SectionTitle theme={theme}>Winner Selection</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <NumberInput
          label="Top Scorer Percentage"
          value={config.top_scorer_percentage}
          onChange={(v) => updateSimpleField('top_scorer_percentage', v)}
          suffix="%"
          theme={theme}
        />
        <NumberInput
          label="Random Percentage"
          value={config.random_percentage}
          onChange={(v) => updateSimpleField('random_percentage', v)}
          suffix="%"
          theme={theme}
        />
        <NumberInput
          label="Win Cooldown (Days)"
          value={config.win_cooldown_days}
          onChange={(v) => updateSimpleField('win_cooldown_days', v)}
          suffix="days"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>Engagement Weights (Points per action)</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <NumberInput
          label="Likes"
          value={config.engagement?.likes_weight}
          onChange={(v) => updateField('engagement', 'likes_weight', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Comments"
          value={config.engagement?.comments_weight}
          onChange={(v) => updateField('engagement', 'comments_weight', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Shares"
          value={config.engagement?.shares_weight}
          onChange={(v) => updateField('engagement', 'shares_weight', v)}
          suffix="pts"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>Gamification Points</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <NumberInput
          label="Daily Spin Reward"
          value={config.gamification?.spin_reward}
          onChange={(v) => updateField('gamification', 'spin_reward', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Coin Gift Received"
          value={config.gamification?.coin_gift}
          onChange={(v) => updateField('gamification', 'coin_gift', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Login Bonus"
          value={config.gamification?.login_bonus}
          onChange={(v) => updateField('gamification', 'login_bonus', v)}
          suffix="pts"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>Consistency</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <NumberInput
          label="Daily Post Points"
          value={config.consistency?.daily_post_points}
          onChange={(v) => updateField('consistency', 'daily_post_points', v)}
          suffix="pts"
          theme={theme}
        />
      </div>
    </div>
  );
}

function WeeklyConfig({ config, updateField, updateSimpleField, theme }) {
  if (!config) return null;

  return (
    <div>
      <SectionTitle theme={theme}>Engagement Weights</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <NumberInput
          label="Likes"
          value={config.engagement?.likes_weight}
          onChange={(v) => updateField('engagement', 'likes_weight', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Comments"
          value={config.engagement?.comments_weight}
          onChange={(v) => updateField('engagement', 'comments_weight', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Shares"
          value={config.engagement?.shares_weight}
          onChange={(v) => updateField('engagement', 'shares_weight', v)}
          suffix="pts"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>Gamification & Consistency</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <NumberInput
          label="Spin Reward"
          value={config.gamification?.spin_reward}
          onChange={(v) => updateField('gamification', 'spin_reward', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Coin Gift"
          value={config.gamification?.coin_gift}
          onChange={(v) => updateField('gamification', 'coin_gift', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Daily Participation"
          value={config.gamification?.consistency_boost}
          onChange={(v) => updateField('gamification', 'consistency_boost', v)}
          suffix="pts/day"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>Streak Bonuses</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <NumberInput
          label="3-Day Streak"
          value={config.streak_bonuses?.['3_day']}
          onChange={(v) => updateField('streak_bonuses', '3_day', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="5-Day Streak"
          value={config.streak_bonuses?.['5_day']}
          onChange={(v) => updateField('streak_bonuses', '5_day', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="7-Day Streak (Full Week)"
          value={config.streak_bonuses?.['7_day']}
          onChange={(v) => updateField('streak_bonuses', '7_day', v)}
          suffix="pts"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>Decay Penalty (for missed days)</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <NumberInput
          label="Penalty per Missed Day"
          value={config.decay?.per_missed_day}
          onChange={(v) => updateField('decay', 'per_missed_day', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Max Days for Decay"
          value={config.decay?.max_days}
          onChange={(v) => updateField('decay', 'max_days', v)}
          suffix="days"
          theme={theme}
        />
      </div>
    </div>
  );
}

function MonthlyConfig({ config, updateField, updateSimpleField, theme }) {
  if (!config) return null;

  return (
    <div>
      <SectionTitle theme={theme}>Engagement Weights</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <NumberInput
          label="Likes"
          value={config.engagement?.likes_weight}
          onChange={(v) => updateField('engagement', 'likes_weight', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Comments"
          value={config.engagement?.comments_weight}
          onChange={(v) => updateField('engagement', 'comments_weight', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Shares"
          value={config.engagement?.shares_weight}
          onChange={(v) => updateField('engagement', 'shares_weight', v)}
          suffix="pts"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>Gamification</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <NumberInput
          label="Spin Reward"
          value={config.gamification?.spin_reward}
          onChange={(v) => updateField('gamification', 'spin_reward', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Coin Gift"
          value={config.gamification?.coin_gift}
          onChange={(v) => updateField('gamification', 'coin_gift', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Consistency Multiplier"
          value={config.gamification?.consistency_multiplier}
          onChange={(v) => updateField('gamification', 'consistency_multiplier', v)}
          suffix="x"
          step="0.1"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>Weekly Winner Bonus</SectionTitle>
      <div style={{ marginBottom: 24 }}>
        <NumberInput
          label="Points per Weekly Win"
          value={config.weekly_winner_bonus}
          onChange={(v) => updateSimpleField('weekly_winner_bonus', v)}
          suffix="pts"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>Streak Multipliers</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <NumberInput
          label="7-Day Streak"
          value={config.streak_multipliers?.['7_day']}
          onChange={(v) => updateField('streak_multipliers', '7_day', v)}
          suffix="x"
          step="0.1"
          theme={theme}
        />
        <NumberInput
          label="14-Day Streak"
          value={config.streak_multipliers?.['14_day']}
          onChange={(v) => updateField('streak_multipliers', '14_day', v)}
          suffix="x"
          step="0.1"
          theme={theme}
        />
        <NumberInput
          label="21-Day Streak"
          value={config.streak_multipliers?.['21_day']}
          onChange={(v) => updateField('streak_multipliers', '21_day', v)}
          suffix="x"
          step="0.1"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>High Engagement Bonus</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <NumberInput
          label="Likes Threshold"
          value={config.high_engagement?.threshold}
          onChange={(v) => updateField('high_engagement', 'threshold', v)}
          suffix="likes"
          theme={theme}
        />
        <NumberInput
          label="Bonus Points"
          value={config.high_engagement?.bonus}
          onChange={(v) => updateField('high_engagement', 'bonus', v)}
          suffix="pts"
          theme={theme}
        />
      </div>
    </div>
  );
}

function GrandConfig({ config, updateField, updateSimpleField, theme }) {
  if (!config) return null;

  return (
    <div>
      <div style={{ background: theme.bg, padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: theme.txt }}>
          Phase 1: Qualification
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: theme.sub }}>
          Top performers qualify for finals based on engagement metrics
        </p>
      </div>

      <SectionTitle theme={theme}>Qualification Weights</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <NumberInput
          label="Likes Weight"
          value={config.phase1_qualification?.likes_weight}
          onChange={(v) => updateField('phase1_qualification', 'likes_weight', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Comments Weight"
          value={config.phase1_qualification?.comments_weight}
          onChange={(v) => updateField('phase1_qualification', 'comments_weight', v)}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Shares Weight"
          value={config.phase1_qualification?.shares_weight}
          onChange={(v) => updateField('phase1_qualification', 'shares_weight', v)}
          suffix="pts"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>Qualification Threshold</SectionTitle>
      <div style={{ marginBottom: 32 }}>
        <NumberInput
          label="Top Percentage Qualifying"
          value={config.phase1_qualification?.qualification_percentage}
          onChange={(v) => updateField('phase1_qualification', 'qualification_percentage', v)}
          suffix="%"
          theme={theme}
        />
      </div>

      <div style={{ background: theme.bg, padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: theme.txt }}>
          Phase 2: Final Judging
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: theme.sub }}>
          Final score combines judge scoring and public voting
        </p>
      </div>

      <SectionTitle theme={theme}>Score Weights</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <NumberInput
          label="Judge Scoring Weight"
          value={config.phase2_judging?.judging_weight}
          onChange={(v) => updateField('phase2_judging', 'judging_weight', v)}
          suffix="%"
          step="0.05"
          theme={theme}
        />
        <NumberInput
          label="Public Voting Weight"
          value={config.phase2_judging?.voting_weight}
          onChange={(v) => updateField('phase2_judging', 'voting_weight', v)}
          suffix="%"
          step="0.05"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>Judge Criteria (Max Points)</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <NumberInput
          label="Creativity"
          value={config.phase2_judging?.judge_criteria?.creativity_max}
          onChange={(v) => {
            const newCriteria = { ...config.phase2_judging.judge_criteria, creativity_max: parseFloat(v) || 0 };
            updateField('phase2_judging', 'judge_criteria', newCriteria);
          }}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Quality"
          value={config.phase2_judging?.judge_criteria?.quality_max}
          onChange={(v) => {
            const newCriteria = { ...config.phase2_judging.judge_criteria, quality_max: parseFloat(v) || 0 };
            updateField('phase2_judging', 'judge_criteria', newCriteria);
          }}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Theme Relevance"
          value={config.phase2_judging?.judge_criteria?.theme_max}
          onChange={(v) => {
            const newCriteria = { ...config.phase2_judging.judge_criteria, theme_max: parseFloat(v) || 0 };
            updateField('phase2_judging', 'judge_criteria', newCriteria);
          }}
          suffix="pts"
          theme={theme}
        />
        <NumberInput
          label="Impact"
          value={config.phase2_judging?.judge_criteria?.impact_max}
          onChange={(v) => {
            const newCriteria = { ...config.phase2_judging.judge_criteria, impact_max: parseFloat(v) || 0 };
            updateField('phase2_judging', 'judge_criteria', newCriteria);
          }}
          suffix="pts"
          theme={theme}
        />
      </div>

      <SectionTitle theme={theme}>Voting Settings</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <NumberInput
          label="Max Votes per User"
          value={config.phase2_judging?.voting?.max_votes_per_user}
          onChange={(v) => {
            const newVoting = { ...config.phase2_judging.voting, max_votes_per_user: parseInt(v) || 0 };
            updateField('phase2_judging', 'voting', newVoting);
          }}
          suffix="votes"
          theme={theme}
        />
        <NumberInput
          label="Vote Value"
          value={config.phase2_judging?.voting?.vote_value}
          onChange={(v) => {
            const newVoting = { ...config.phase2_judging.voting, vote_value: parseFloat(v) || 0 };
            updateField('phase2_judging', 'voting', newVoting);
          }}
          suffix="pts"
          theme={theme}
        />
      </div>
    </div>
  );
}

function SectionTitle({ children, theme }) {
  return (
    <h3 style={{
      fontSize: 14,
      fontWeight: 600,
      color: theme.txt,
      margin: '0 0 12px 0',
      paddingBottom: 8,
      borderBottom: `1px solid ${theme.border}`
    }}>
      {children}
    </h3>
  );
}

function NumberInput({ label, value, onChange, suffix, step = '0.1', theme }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.sub, marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={value || 0}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          style={{
            width: '100%',
            padding: '10px 12px',
            paddingRight: 50,
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            fontSize: 14,
            color: theme.txt,
            boxSizing: 'border-box'
          }}
        />
        <span style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 12,
          color: theme.sub
        }}>
          {suffix}
        </span>
      </div>
    </div>
  );
}
