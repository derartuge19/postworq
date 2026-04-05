import React, { useState, useEffect } from 'react';
import api from '../../api';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';

const PRI = '#DA9B2A';
const BG = '#FAFAF9';
const CARD = '#FFFFFF';
const BORDER = '#E7E5E4';
const TXT = '#1C1917';
const SUB = '#78716C';
const RED = '#EF4444';
const GREEN = '#10B981';

const inp = {
  width: '100%', padding: '10px 12px', border: `1.5px solid ${BORDER}`,
  borderRadius: 8, fontSize: 14, color: TXT, background: CARD,
  outline: 'none', boxSizing: 'border-box',
};

const SectionCard = ({ title, subtitle, accent, children }) => (
  <div style={{ background: CARD, borderRadius: 12, border: `1.5px solid ${BORDER}`, overflow: 'hidden', marginBottom: 18 }}>
    <div style={{ padding: '14px 20px', borderBottom: `1.5px solid ${BORDER}`, background: `${accent}08`, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 6, height: 22, borderRadius: 3, background: accent }} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: TXT }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: SUB, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ padding: '18px 20px' }}>{children}</div>
  </div>
);

const NumField = ({ label, hint, value, step, onChange }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: SUB, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</label>
    <input type="number" step={step || '0.1'} value={value} onChange={onChange} style={inp} />
    {hint && <span style={{ fontSize: 11, color: SUB, marginTop: 4, display: 'block' }}>{hint}</span>}
  </div>
);

const CampaignScoringConfig = ({ campaignId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [toast, setToast] = useState(null);
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

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const set = (k, v) => setConfig(p => ({ ...p, [k]: v }));

  useEffect(() => { loadData(); }, [campaignId]);

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
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.request(`/admin/campaigns/${campaignId}/scoring-config/`, { method: 'POST', body: JSON.stringify(config) });
      setSaved(true);
      showToast('Scoring configuration saved!');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      showToast('Failed to save configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      await api.request(`/admin/campaigns/${campaignId}/scoring-config/reset/`, { method: 'POST' });
      showToast('Reset to defaults');
      loadData();
    } catch (err) {
      showToast('Failed to reset configuration', 'error');
    } finally {
      setResetting(false);
    }
  };

  const totalMax = [
    config.max_creativity_points, config.max_engagement_points, config.max_consistency_points,
    config.max_quality_points, config.max_theme_relevance_points
  ].reduce((s, v) => s + parseFloat(v || 0), 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${PRI}30`, borderTopColor: PRI, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '12px 20px', borderRadius: 10, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1.5px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? RED : GREEN, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => onBack?.()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: SUB }}>
            <ArrowLeft size={15} /> Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: TXT }}>Scoring Configuration</h1>
            {campaign && <p style={{ margin: 0, fontSize: 13, color: SUB, marginTop: 2 }}>{campaign.title}</p>}
          </div>
        </div>

        {/* Total Points Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: `${PRI}12`, border: `1.5px solid ${PRI}30`, borderRadius: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRI }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: PRI }}>Total Max: {totalMax} pts</span>
        </div>
      </div>

      {/* Max Points */}
      <SectionCard title="Maximum Points per Component" subtitle="Sets the ceiling for each scoring category" accent={PRI}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          <NumField label="Creativity" hint="Manual admin scoring" value={config.max_creativity_points} step="1" onChange={e => set('max_creativity_points', e.target.value)} />
          <NumField label="Engagement" hint="Likes, comments, shares" value={config.max_engagement_points} step="1" onChange={e => set('max_engagement_points', e.target.value)} />
          <NumField label="Consistency" hint="Posting frequency" value={config.max_consistency_points} step="1" onChange={e => set('max_consistency_points', e.target.value)} />
          <NumField label="Quality" hint="Video / image quality" value={config.max_quality_points} step="1" onChange={e => set('max_quality_points', e.target.value)} />
          <NumField label="Theme Relevance" hint="Match with weekly theme" value={config.max_theme_relevance_points} step="1" onChange={e => set('max_theme_relevance_points', e.target.value)} />
        </div>
        {/* Visual bar */}
        <div style={{ marginTop: 18, display: 'flex', gap: 4, height: 10, borderRadius: 6, overflow: 'hidden' }}>
          {[
            { v: config.max_creativity_points, c: PRI },
            { v: config.max_engagement_points, c: '#3B82F6' },
            { v: config.max_consistency_points, c: GREEN },
            { v: config.max_quality_points, c: '#8B5CF6' },
            { v: config.max_theme_relevance_points, c: '#F59E0B' },
          ].map((seg, i) => (
            <div key={i} style={{ flex: parseFloat(seg.v) || 0, background: seg.c, minWidth: 2 }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Creativity', c: PRI }, { label: 'Engagement', c: '#3B82F6' },
            { label: 'Consistency', c: GREEN }, { label: 'Quality', c: '#8B5CF6' },
            { label: 'Theme', c: '#F59E0B' },
          ].map((l, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: SUB }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: l.c, display: 'inline-block' }} />{l.label}
            </span>
          ))}
        </div>
      </SectionCard>

      {/* Engagement Weights */}
      <SectionCard title="Engagement Weights" subtitle="Points multiplier for each engagement type" accent="#3B82F6">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <NumField label="Likes Weight" hint="Points per like received" value={config.likes_weight} step="0.1" onChange={e => set('likes_weight', e.target.value)} />
          <NumField label="Comments Weight" hint="Points per comment received" value={config.comments_weight} step="0.1" onChange={e => set('comments_weight', e.target.value)} />
          <NumField label="Shares Weight" hint="Points per share received" value={config.shares_weight} step="0.1" onChange={e => set('shares_weight', e.target.value)} />
        </div>
      </SectionCard>

      {/* Consistency Settings */}
      <SectionCard title="Consistency Settings" subtitle="Rewards for regular posting behaviour" accent={GREEN}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <NumField label="Streak Points / Day" hint="Bonus for consecutive posting days" value={config.streak_points_per_day} step="0.1" onChange={e => set('streak_points_per_day', e.target.value)} />
          <NumField label="Participation Points / Day" hint="Base points for each active day" value={config.participation_points_per_day} step="0.1" onChange={e => set('participation_points_per_day', e.target.value)} />
        </div>
      </SectionCard>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingBottom: 8 }}>
        <button onClick={handleReset} disabled={resetting || saving}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', background: '#FEF2F2', color: RED, border: `1.5px solid #FECACA`, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: resetting ? 'not-allowed' : 'pointer', opacity: resetting ? 0.6 : 1 }}>
          <RotateCcw size={15} />{resetting ? 'Resetting...' : 'Reset to Defaults'}
        </button>
        <button onClick={handleSave} disabled={saving || saved}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 24px', background: saved ? GREEN : saving ? `${PRI}aa` : PRI, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: saving || saved ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
          <Save size={15} />{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default CampaignScoringConfig;
