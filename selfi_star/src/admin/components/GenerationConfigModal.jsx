import { useState, useEffect } from 'react';
import { X, Settings, Calendar, TrendingUp, Award } from 'lucide-react';
import api from '../../api';

export function GenerationConfigModal({ campaign, onClose, onSave, theme }) {
  const [config, setConfig] = useState({
    auto_generate_daily: campaign?.auto_generate_daily ?? true,
    auto_generate_weekly: campaign?.auto_generate_weekly ?? true,
    auto_generate_monthly: campaign?.auto_generate_monthly ?? true,
    auto_generate_grand: campaign?.auto_generate_grand ?? true,
    daily_campaign_count: campaign?.daily_campaign_count ?? 0,
    weekly_campaign_count: campaign?.weekly_campaign_count ?? 0,
    monthly_campaign_count: campaign?.monthly_campaign_count ?? 0,
    grand_campaign_count: campaign?.grand_campaign_count ?? 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate max possible campaigns based on date range
  const getMaxCampaigns = (type) => {
    if (!campaign?.start_date || !campaign?.end_date) return 0;
    
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    switch(type) {
      case 'daily':
        return diffDays + 1;
      case 'weekly':
        return Math.ceil(diffDays / 7);
      case 'monthly':
        return Math.ceil(diffDays / 30);
      case 'grand':
        return 1;
      default:
        return 0;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.request(`/admin/master-campaigns/${campaign.id}/config/`, {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      
      onSave(response);
      onClose();
    } catch (err) {
      console.error('Failed to update configuration:', err);
      setError('Failed to update configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    
    try {
      // First save the configuration
      await api.request(`/admin/master-campaigns/${campaign.id}/config/`, {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      
      // Then trigger generation
      const response = await api.request(`/admin/master-campaigns/${campaign.id}/generate/`, {
        method: 'POST',
        body: JSON.stringify({
          generate_daily: config.auto_generate_daily,
          generate_weekly: config.auto_generate_weekly,
          generate_monthly: config.auto_generate_monthly,
          generate_grand: config.auto_generate_grand
        })
      });
      
      alert(`Generated ${response.campaigns?.length || 0} sub-campaigns`);
      onSave(response);
      onClose();
    } catch (err) {
      console.error('Failed to generate campaigns:', err);
      setError('Failed to generate campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const campaignTypes = [
    {
      key: 'daily',
      label: 'Daily Campaigns',
      icon: Calendar,
      color: theme.blue,
      description: 'One campaign per day',
      max: getMaxCampaigns('daily')
    },
    {
      key: 'weekly',
      label: 'Weekly Campaigns',
      icon: TrendingUp,
      color: theme.green,
      description: 'One campaign per week',
      max: getMaxCampaigns('weekly')
    },
    {
      key: 'monthly',
      label: 'Monthly Campaigns',
      icon: Calendar,
      color: theme.orange,
      description: 'One campaign per month',
      max: getMaxCampaigns('monthly')
    },
    {
      key: 'grand',
      label: 'Grand Campaign',
      icon: Award,
      color: theme.pri,
      description: 'Final championship',
      max: 1
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 20
    }} onClick={onClose}>
      <div style={{
        background: theme.card,
        borderRadius: 12,
        width: '100%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 20,
          borderBottom: `1px solid ${theme.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: `${theme.pri}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Settings size={20} color={theme.pri} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.txt }}>
                Generation Configuration
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: theme.sub }}>
                Configure sub-campaign generation
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: theme.bg,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <X size={16} color={theme.sub} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            margin: 20,
            padding: 12,
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            color: '#DC2626',
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        {/* Campaign Types */}
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {campaignTypes.map(type => (
              <div key={type.key} style={{
                background: theme.bg,
                borderRadius: 8,
                padding: 16,
                border: `1px solid ${theme.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: `${type.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <type.icon size={18} color={type.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme.txt }}>
                        {type.label}
                      </h3>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={config[`auto_generate_${type.key}`]}
                          onChange={(e) => setConfig({
                            ...config,
                            [`auto_generate_${type.key}`]: e.target.checked
                          })}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 13, color: theme.sub }}>Enable</span>
                      </label>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: theme.sub }}>
                      {type.description}
                    </p>
                  </div>
                </div>

                {config[`auto_generate_${type.key}`] && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      color: theme.txt,
                      marginBottom: 6
                    }}>
                      Number of {type.label} (0 = all possible)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="number"
                        min="0"
                        max={type.max}
                        value={config[`${type.key}_campaign_count`]}
                        onChange={(e) => setConfig({
                          ...config,
                          [`${type.key}_campaign_count`]: parseInt(e.target.value) || 0
                        })}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: `1px solid ${theme.border}`,
                          background: theme.card,
                          color: theme.txt,
                          fontSize: 14
                        }}
                      />
                      <span style={{ fontSize: 13, color: theme.sub }}>
                        Max: {type.max}
                      </span>
                    </div>
                    {config[`${type.key}_campaign_count`] === 0 && (
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: type.color }}>
                        Will generate all {type.max} {type.label.toLowerCase()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 12,
          padding: 20,
          borderTop: `1px solid ${theme.border}`
        }}>
          <button onClick={onClose} disabled={loading} style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: theme.bg,
            color: theme.txt,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: theme.blue,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}>
            {loading ? 'Saving...' : 'Save Config'}
          </button>
          <button onClick={handleGenerate} disabled={loading} style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: theme.pri,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}>
            {loading ? 'Generating...' : 'Save & Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
