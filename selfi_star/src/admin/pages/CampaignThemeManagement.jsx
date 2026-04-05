import React, { useState, useEffect } from 'react';
import api from '../../api';
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle, Calendar } from 'lucide-react';

const CampaignThemeManagement = ({ campaignId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [themes, setThemes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignRes, themesRes] = await Promise.all([
        api.request(`/campaigns/${campaignId}/`),
        api.request(`/admin/campaigns/${campaignId}/themes/`)
      ]);
      setCampaign(campaignRes);
      setThemes(themesRes.themes || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTheme = async (themeId) => {
    if (!window.confirm('Delete this theme? This cannot be undone.')) {
      return;
    }
    try {
      await api.request(`/admin/campaigns/themes/${themeId}/`, {
        method: 'DELETE'
      });
      alert('Theme deleted successfully!');
      loadData();
    } catch (error) {
      console.error('Error deleting theme:', error);
      alert('Failed to delete theme');
    }
  };

  const handleActivateTheme = async (themeId) => {
    try {
      await api.request(`/admin/campaigns/themes/${themeId}/activate/`, {
        method: 'POST'
      });
      alert('Theme activated successfully!');
      loadData();
    } catch (error) {
      console.error('Error activating theme:', error);
      alert('Failed to activate theme');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
              Weekly Themes
            </h1>
            <p style={{ color: '#666', fontSize: '16px' }}>
              {campaign?.title}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Plus size={20} />
            Create Theme
          </button>
        </div>
      </div>

      {/* Themes List */}
      {themes.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Calendar size={48} color="#ccc" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#666' }}>No Themes Yet</h3>
          <p style={{ color: '#999', marginBottom: '20px' }}>Create weekly themes to guide participants</p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Create First Theme
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {themes.map((theme) => (
            <div
              key={theme.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: theme.is_active ? '2px solid #4CAF50' : '1px solid #e0e0e0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      Week {theme.week_number}: {theme.title}
                    </h3>
                    {theme.is_active && (
                      <span style={{
                        background: '#4CAF50',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <CheckCircle size={14} />
                        Active
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#666', marginBottom: '12px' }}>{theme.description}</p>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#999' }}>
                    <span>
                      Start: {new Date(theme.start_date).toLocaleDateString()}
                    </span>
                    <span>
                      End: {new Date(theme.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  {theme.hashtags && theme.hashtags.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {theme.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: '#e3f2fd',
                            color: '#2196f3',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!theme.is_active && (
                    <button
                      onClick={() => handleActivateTheme(theme.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => setEditingTheme(theme)}
                    style={{
                      padding: '8px',
                      background: '#f0f0f0',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteTheme(theme.id)}
                    style={{
                      padding: '8px',
                      background: '#ffebee',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={18} color="#f44336" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTheme) && (
        <ThemeModal
          campaignId={campaignId}
          theme={editingTheme}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTheme(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingTheme(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

const ThemeModal = ({ campaignId, theme, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: theme?.title || '',
    description: theme?.description || '',
    week_number: theme?.week_number || 1,
    start_date: theme?.start_date?.split('T')[0] || '',
    end_date: theme?.end_date?.split('T')[0] || '',
    hashtags: theme?.hashtags?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        hashtags: formData.hashtags.split(',').map(t => t.trim()).filter(t => t),
      };

      if (theme) {
        await api.request(`/admin/campaigns/themes/${theme.id}/`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await api.request(`/admin/campaigns/${campaignId}/themes/`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      alert(`Theme ${theme ? 'updated' : 'created'} successfully!`);
      onSuccess();
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          {theme ? 'Edit Theme' : 'Create New Theme'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Week Number
            </label>
            <input
              type="number"
              required
              value={formData.week_number}
              onChange={(e) => setFormData({ ...formData, week_number: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Theme Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Nature & Wildlife"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the theme and what participants should create..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Start Date
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                End Date
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Hashtags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.hashtags}
              onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
              placeholder="nature, wildlife, outdoors"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? 'Saving...' : (theme ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignThemeManagement;
