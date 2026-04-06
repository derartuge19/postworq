import { useState, useEffect } from 'react';
import api from '../../api';

/**
 * TYPE-SPECIFIC Scoring Configuration
 * Shows ONLY the config fields relevant to the campaign's actual type
 * Daily, Weekly, Monthly, Grand each have completely different config pages
 */
export function CampaignScoringConfigPage({ campaignId, campaignType, onBack, theme }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadConfig();
  }, [campaignId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.request(`/admin/campaigns/${campaignId}/scoring-config/`);
      setConfig(response);
    } catch (error) {
      console.error('Failed to load scoring config:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { [campaignType]: config[campaignType] };
      await api.request(`/admin/campaigns/${campaignId}/scoring-config/update/`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setMessage({ type: 'success', text: 'Configuration saved' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
      setMessage({ type: 'error', text: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [campaignType]: {
        ...prev[campaignType],
        [section]: {
          ...prev[campaignType]?.[section],
          [field]: parseFloat(value) || 0
        }
      }
    }));
  };

  const updateSimple = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [campaignType]: {
        ...prev[campaignType],
        [field]: field.includes('percentage') || field.includes('threshold') || field.includes('days') || field.includes('count')
          ? parseInt(value) || 0 
          : parseFloat(value) || 0
      }
    }));
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: theme.sub }}>Loading...</div>;
  if (!config) return null;

  const typeConfig = config[campaignType];

  return (
    <div style={{ marginLeft: 240, padding: '20px 40px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: theme.pri, cursor: 'pointer', fontSize: 14, marginBottom: 16 }}>
          ← Back to Campaign
        </button>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: theme.txt }}>
          {getTypeIcon(campaignType)} {campaignType.toUpperCase()} Campaign Scoring
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: 14, color: theme.sub }}>
          {getTypeDescription(campaignType)}
        </p>
      </div>

      {message && (
        <div style={{
          padding: 12, borderRadius: 8, marginBottom: 20,
          background: message.type === 'success' ? theme.green + '15' : theme.red + '15',
          border: `1px solid ${message.type === 'success' ? theme.green : theme.red}`,
          color: message.type === 'success' ? theme.green : theme.red
        }}>
          {message.text}
        </div>
      )}

      {campaignType === 'daily' && (
        <DailyConfig config={typeConfig} updateField={updateField} updateSimple={updateSimple} theme={theme} />
      )}
      {campaignType === 'weekly' && (
        <WeeklyConfig config={typeConfig} updateField={updateField} updateSimple={updateSimple} theme={theme} />
      )}
      {campaignType === 'monthly' && (
        <MonthlyConfig config={typeConfig} updateField={updateField} updateSimple={updateSimple} theme={theme} />
      )}
      {campaignType === 'grand' && (
        <GrandConfig config={typeConfig} updateField={updateField} updateSimple={updateSimple} theme={theme} />
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end' }}>
        <button onClick={loadConfig} style={{ padding: '12px 24px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'white', color: theme.txt, cursor: 'pointer' }}>
          Reset
        </button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: theme.pri, color: 'white', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}

// DAILY CAMPAIGN
function DailyConfig({ config, updateField, updateSimple, theme }) {
  return (
    <div style={{ background: theme.card, borderRadius: 16, padding: 24 }}>
      
      <Section theme={theme} icon="🏆" title="Winner Selection (Hybrid)" color="#10B981">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Daily campaigns use a hybrid approach: top scorers + random participants. No voting allowed.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <NumberInput label="Top Scorer %" value={config?.top_scorer_percentage} onChange={v => updateSimple('top_scorer_percentage', v)} suffix="%" theme={theme} />
          <NumberInput label="Random Selection %" value={config?.random_percentage} onChange={v => updateSimple('random_percentage', v)} suffix="%" theme={theme} />
        </div>
      </Section>

      <Section theme={theme} icon="🚫" title="Win Protection" color="#EF4444">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Prevent the same users from winning too frequently.
        </p>
        <NumberInput label="Win Cooldown Period" value={config?.win_cooldown_days} onChange={v => updateSimple('win_cooldown_days', v)} suffix="days" theme={theme} />
      </Section>

      <Section theme={theme} icon="❤️" title="Engagement Points (Per Action)" color="#3B82F6">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Points awarded for each like, comment, and share on campaign posts.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <NumberInput label="Likes" value={config?.engagement?.likes_weight} onChange={v => updateField('engagement', 'likes_weight', v)} suffix="pts" theme={theme} />
          <NumberInput label="Comments" value={config?.engagement?.comments_weight} onChange={v => updateField('engagement', 'comments_weight', v)} suffix="pts" theme={theme} />
          <NumberInput label="Shares" value={config?.engagement?.shares_weight} onChange={v => updateField('engagement', 'shares_weight', v)} suffix="pts" theme={theme} />
        </div>
      </Section>

      <Section theme={theme} icon="🎮" title="Gamification Points" color="#8B5CF6">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Points from app activities: daily spin, receiving coin gifts, login bonuses.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <NumberInput label="Daily Spin Reward" value={config?.gamification?.spin_reward} onChange={v => updateField('gamification', 'spin_reward', v)} suffix="pts" theme={theme} />
          <NumberInput label="Coin Gift Received" value={config?.gamification?.coin_gift} onChange={v => updateField('gamification', 'coin_gift', v)} suffix="pts" theme={theme} />
          <NumberInput label="Login Bonus" value={config?.gamification?.login_bonus} onChange={v => updateField('gamification', 'login_bonus', v)} suffix="pts" theme={theme} />
        </div>
      </Section>

      <Section theme={theme} icon="📅" title="Daily Consistency" color="#F59E0B">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Points for posting content on any given day of the campaign.
        </p>
        <NumberInput label="Points for Daily Post" value={config?.consistency?.daily_post_points} onChange={v => updateField('consistency', 'daily_post_points', v)} suffix="pts" theme={theme} />
      </Section>

    </div>
  );
}

// WEEKLY CAMPAIGN
function WeeklyConfig({ config, updateField, updateSimple, theme }) {
  return (
    <div style={{ background: theme.card, borderRadius: 16, padding: 24 }}>
      
      <Section theme={theme} icon="🏆" title="Winner Selection (Pure Scoring)" color="#10B981">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Weekly campaigns use ONLY top scorers. No randomness. No voting.
        </p>
        <div style={{ padding: 16, background: '#10B98115', borderRadius: 8, borderLeft: '4px solid #10B981' }}>
          <strong style={{ color: '#10B981' }}>Rule:</strong> Users can only win once per weekly cycle. If they already won, they're excluded from future wins even if they rank high.
        </div>
      </Section>

      <Section theme={theme} icon="❤️" title="Engagement Points (Cumulative)" color="#3B82F6">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Total engagement points aggregated across the entire week.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <NumberInput label="Likes" value={config?.engagement?.likes_weight} onChange={v => updateField('engagement', 'likes_weight', v)} suffix="pts" theme={theme} />
          <NumberInput label="Comments" value={config?.engagement?.comments_weight} onChange={v => updateField('engagement', 'comments_weight', v)} suffix="pts" theme={theme} />
          <NumberInput label="Shares" value={config?.engagement?.shares_weight} onChange={v => updateField('engagement', 'shares_weight', v)} suffix="pts" theme={theme} />
        </div>
      </Section>

      <Section theme={theme} icon="🎮" title="Gamification Boosts" color="#8B5CF6">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Points from spins, coin gifts, and daily participation.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <NumberInput label="Spin Reward" value={config?.gamification?.spin_reward} onChange={v => updateField('gamification', 'spin_reward', v)} suffix="pts" theme={theme} />
          <NumberInput label="Coin Gift" value={config?.gamification?.coin_gift} onChange={v => updateField('gamification', 'coin_gift', v)} suffix="pts" theme={theme} />
          <NumberInput label="Daily Participation" value={config?.gamification?.consistency_boost} onChange={v => updateField('gamification', 'consistency_boost', v)} suffix="pts/day" theme={theme} />
        </div>
      </Section>

      <Section theme={theme} icon="🔥" title="Streak Bonuses" color="#EF4444">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Bonus points for consecutive posting days. Full week = max bonus!
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <NumberInput label="3-Day Streak" value={config?.streak_bonuses?.['3_day']} onChange={v => updateField('streak_bonuses', '3_day', v)} suffix="pts" theme={theme} />
          <NumberInput label="5-Day Streak" value={config?.streak_bonuses?.['5_day']} onChange={v => updateField('streak_bonuses', '5_day', v)} suffix="pts" theme={theme} />
          <NumberInput label="7-Day Streak (Full Week)" value={config?.streak_bonuses?.['7_day']} onChange={v => updateField('streak_bonuses', '7_day', v)} suffix="pts" theme={theme} />
        </div>
      </Section>

      <Section theme={theme} icon="📉" title="Decay Penalty (Missed Days)" color="#78716C">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Points deducted for days the user didn't post (up to max days).
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <NumberInput label="Penalty per Missed Day" value={config?.decay?.per_missed_day} onChange={v => updateField('decay', 'per_missed_day', v)} suffix="pts" theme={theme} />
          <NumberInput label="Max Days for Decay" value={config?.decay?.max_days} onChange={v => updateField('decay', 'max_days', v)} suffix="days" theme={theme} />
        </div>
      </Section>

    </div>
  );
}

// MONTHLY CAMPAIGN
function MonthlyConfig({ config, updateField, updateSimple, theme }) {
  return (
    <div style={{ background: theme.card, borderRadius: 16, padding: 24 }}>
      
      <Section theme={theme} icon="🏆" title="Winner Selection (Strict Scoring)" color="#10B981">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Monthly campaigns prioritize sustained performance. Top performers only. No randomness. No voting.
        </p>
        <div style={{ padding: 16, background: '#10B98115', borderRadius: 8, borderLeft: '4px solid #10B981' }}>
          <strong style={{ color: '#10B981' }}>Rule:</strong> Weekly winners get bonus points. Long streaks get multipliers. One win per monthly cycle enforced.
        </div>
      </Section>

      <Section theme={theme} icon="❤️" title="Engagement Points (Monthly Total)" color="#3B82F6">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Points per engagement action, aggregated across the entire month.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <NumberInput label="Likes" value={config?.engagement?.likes_weight} onChange={v => updateField('engagement', 'likes_weight', v)} suffix="pts" theme={theme} />
          <NumberInput label="Comments" value={config?.engagement?.comments_weight} onChange={v => updateField('engagement', 'comments_weight', v)} suffix="pts" theme={theme} />
          <NumberInput label="Shares" value={config?.engagement?.shares_weight} onChange={v => updateField('engagement', 'shares_weight', v)} suffix="pts" theme={theme} />
        </div>
      </Section>

      <Section theme={theme} icon="🎁" title="Weekly Winner Bonus" color="#F59E0B">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Extra points awarded to users who won weekly campaigns during this month.
        </p>
        <NumberInput label="Bonus per Weekly Win" value={config?.weekly_winner_bonus} onChange={v => updateSimple('weekly_winner_bonus', v)} suffix="pts" theme={theme} />
      </Section>

      <Section theme={theme} icon="⚡" title="Streak Multipliers (Applied to Total)" color="#8B5CF6">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Multipliers applied to final score based on longest posting streak in the month.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <NumberInput label="7-Day Streak" value={config?.streak_multipliers?.['7_day']} onChange={v => updateField('streak_multipliers', '7_day', v)} suffix="x" step="0.1" theme={theme} />
          <NumberInput label="14-Day Streak" value={config?.streak_multipliers?.['14_day']} onChange={v => updateField('streak_multipliers', '14_day', v)} suffix="x" step="0.1" theme={theme} />
          <NumberInput label="21-Day Streak" value={config?.streak_multipliers?.['21_day']} onChange={v => updateField('streak_multipliers', '21_day', v)} suffix="x" step="0.1" theme={theme} />
        </div>
      </Section>

      <Section theme={theme} icon="🔥" title="High Engagement Bonus" color="#EF4444">
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
          Bonus for individual posts that achieve high engagement (viral posts).
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <NumberInput label="Likes Threshold" value={config?.high_engagement?.threshold} onChange={v => updateField('high_engagement', 'threshold', v)} suffix="likes" theme={theme} />
          <NumberInput label="Bonus Points" value={config?.high_engagement?.bonus} onChange={v => updateField('high_engagement', 'bonus', v)} suffix="pts" theme={theme} />
        </div>
      </Section>

    </div>
  );
}

// GRAND CAMPAIGN
function GrandConfig({ config, updateField, updateSimple, theme }) {
  const updateNested = (section, subsection, field, value) => {
    const current = config?.[section]?.[subsection] || {};
    const updated = { ...current, [field]: parseFloat(value) || 0 };
    updateField(section, subsection, updated);
  };

  return (
    <div style={{ background: theme.card, borderRadius: 16, padding: 24 }}>
      
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🎯</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: theme.txt }}>Phase 1: Qualification</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: theme.sub }}>Performance-based scoring to determine finalists</p>
          </div>
        </div>

        <Section theme={theme} icon="📊" title="Qualification Threshold" color="#3B82F6">
          <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
            Top percentage of users advance to Phase 2 finals based on engagement scores.
          </p>
          <NumberInput label="Top % Qualifying" value={config?.phase1_qualification?.qualification_percentage} onChange={v => updateField('phase1_qualification', 'qualification_percentage', v)} suffix="%" theme={theme} />
        </Section>

        <Section theme={theme} icon="❤️" title="Engagement Weights (Qualification)" color="#3B82F6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <NumberInput label="Likes" value={config?.phase1_qualification?.likes_weight} onChange={v => updateField('phase1_qualification', 'likes_weight', v)} suffix="pts" theme={theme} />
            <NumberInput label="Comments" value={config?.phase1_qualification?.comments_weight} onChange={v => updateField('phase1_qualification', 'comments_weight', v)} suffix="pts" theme={theme} />
            <NumberInput label="Shares" value={config?.phase1_qualification?.shares_weight} onChange={v => updateField('phase1_qualification', 'shares_weight', v)} suffix="pts" theme={theme} />
          </div>
        </Section>
      </div>

      <div style={{ height: 2, background: theme.border, marginBottom: 32 }} />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>👑</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: theme.txt }}>Phase 2: Final Judging</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: theme.sub }}>Combined judge scoring + public voting</p>
          </div>
        </div>

        <Section theme={theme} icon="⚖️" title="Score Weights" color="#8B5CF6">
          <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
            Final score = (Judge Score × Judge Weight) + (Vote Score × Vote Weight)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <NumberInput label="Judge Scoring Weight" value={config?.phase2_judging?.judging_weight} onChange={v => updateField('phase2_judging', 'judging_weight', v)} suffix="%" step="0.05" theme={theme} />
            <NumberInput label="Public Voting Weight" value={config?.phase2_judging?.voting_weight} onChange={v => updateField('phase2_judging', 'voting_weight', v)} suffix="%" step="0.05" theme={theme} />
          </div>
        </Section>

        <Section theme={theme} icon="📝" title="Judge Criteria (Max Points Each)" color="#F59E0B">
          <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
            Judges score finalists on these criteria. Total = sum of all four.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <NumberInput label="Creativity" value={config?.phase2_judging?.judge_criteria?.creativity_max} onChange={v => updateNested('phase2_judging', 'judge_criteria', 'creativity_max', v)} suffix="pts" theme={theme} />
            <NumberInput label="Quality" value={config?.phase2_judging?.judge_criteria?.quality_max} onChange={v => updateNested('phase2_judging', 'judge_criteria', 'quality_max', v)} suffix="pts" theme={theme} />
            <NumberInput label="Theme Relevance" value={config?.phase2_judging?.judge_criteria?.theme_max} onChange={v => updateNested('phase2_judging', 'judge_criteria', 'theme_max', v)} suffix="pts" theme={theme} />
            <NumberInput label="Impact" value={config?.phase2_judging?.judge_criteria?.impact_max} onChange={v => updateNested('phase2_judging', 'judge_criteria', 'impact_max', v)} suffix="pts" theme={theme} />
          </div>
        </Section>

        <Section theme={theme} icon="🗳️" title="Voting Settings" color="#10B981">
          <p style={{ fontSize: 13, color: theme.sub, marginBottom: 16 }}>
            Public voting configuration for finalists.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <NumberInput label="Max Votes per User" value={config?.phase2_judging?.voting?.max_votes_per_user} onChange={v => updateNested('phase2_judging', 'voting', 'max_votes_per_user', v)} suffix="votes" theme={theme} />
            <NumberInput label="Points per Vote" value={config?.phase2_judging?.voting?.vote_value} onChange={v => updateNested('phase2_judging', 'voting', 'vote_value', v)} suffix="pts" theme={theme} />
          </div>
        </Section>
      </div>

    </div>
  );
}

function Section({ theme, icon, title, color, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: color || theme.txt, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: `1px solid ${theme.border}` }}>
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function NumberInput({ label, value, onChange, suffix, step = '0.1', theme }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: theme.sub, marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={value || 0}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          style={{ width: '100%', padding: '10px 12px', paddingRight: 45, border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 14, color: theme.txt, boxSizing: 'border-box' }}
        />
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: theme.sub }}>{suffix}</span>
      </div>
    </div>
  );
}

function getTypeIcon(type) {
  const icons = { daily: '☀️', weekly: '📅', monthly: '📆', grand: '👑' };
  return icons[type] || '🎯';
}

function getTypeDescription(type) {
  const desc = {
    daily: 'Lightweight & gamified. Hybrid winner selection (top scorers + random). No voting.',
    weekly: 'Cumulative & competitive. Streak bonuses + decay. Top scorers only. No randomness.',
    monthly: 'Deep weighting with multipliers. Weekly winner bonuses. Top performers only.',
    grand: 'Two-phase: Qualification scoring → Final judging + public voting (70/30 split).'
  };
  return desc[type] || '';
}
