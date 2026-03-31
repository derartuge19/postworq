import { useState, useEffect } from 'react';
import { Settings, Save, Key, Database, Bell, Shield, Zap, Globe } from 'lucide-react';
import api from '../../api';
import { AlertModal } from '../components/AlertModal';

export function SettingsPage({ theme }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.request('/admin/settings/');
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.request('/admin/settings/update/', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      setAlertModal({ isOpen: true, title: 'Success', message: 'Settings saved successfully!', type: 'success' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div style={{ marginLeft: 240, padding: 40, textAlign: 'center', color: theme.sub }}>
        Loading settings...
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'content', label: 'Content', icon: Globe },
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'api', label: 'API', icon: Key },
  ];

  return (
    <div style={{ marginLeft: 240, padding: '20px 40px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            color: theme.txt,
            marginBottom: 8,
          }}>
            Platform Settings
          </h1>
          <p style={{
            margin: 0,
            fontSize: 16,
            color: theme.sub,
          }}>
            Configure your platform settings and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 24px',
            background: theme.pri,
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: `1px solid ${theme.border}`,
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isActive ? theme.pri : 'transparent'}`,
                color: isActive ? theme.pri : theme.sub,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Settings Content */}
      <div style={{
        background: theme.card,
        borderRadius: 12,
        padding: 32,
        border: `1px solid ${theme.border}`,
      }}>
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SettingField
              label="Platform Name"
              value={settings.platform_name}
              onChange={(v) => handleChange('platform_name', v)}
              theme={theme}
            />
            <SettingField
              label="Platform Description"
              value={settings.platform_description}
              onChange={(v) => handleChange('platform_description', v)}
              multiline
              theme={theme}
            />
            <SettingToggle
              label="Maintenance Mode"
              description="Put the platform in maintenance mode"
              value={settings.maintenance_mode}
              onChange={(v) => handleChange('maintenance_mode', v)}
              theme={theme}
            />
            <SettingToggle
              label="Allow Registrations"
              description="Allow new users to register"
              value={settings.allow_registrations}
              onChange={(v) => handleChange('allow_registrations', v)}
              theme={theme}
            />
            <SettingToggle
              label="Require Email Verification"
              description="Users must verify their email before accessing the platform"
              value={settings.require_email_verification}
              onChange={(v) => handleChange('require_email_verification', v)}
              theme={theme}
            />
          </div>
        )}

        {activeTab === 'content' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SettingField
              label="Max File Size (MB)"
              type="number"
              value={settings.max_file_size_mb}
              onChange={(v) => handleChange('max_file_size_mb', parseInt(v))}
              theme={theme}
            />
            <SettingField
              label="Allowed Video Formats"
              value={settings.allowed_video_formats}
              onChange={(v) => handleChange('allowed_video_formats', v)}
              placeholder="mp4,mov,avi"
              theme={theme}
            />
            <SettingField
              label="Allowed Image Formats"
              value={settings.allowed_image_formats}
              onChange={(v) => handleChange('allowed_image_formats', v)}
              placeholder="jpg,jpeg,png,gif"
              theme={theme}
            />
            <SettingField
              label="Max Caption Length"
              type="number"
              value={settings.max_caption_length}
              onChange={(v) => handleChange('max_caption_length', parseInt(v))}
              theme={theme}
            />
            <SettingToggle
              label="Enable Comments"
              description="Allow users to comment on posts"
              value={settings.enable_comments}
              onChange={(v) => handleChange('enable_comments', v)}
              theme={theme}
            />
            <SettingToggle
              label="Enable Voting"
              description="Allow users to vote on posts"
              value={settings.enable_voting}
              onChange={(v) => handleChange('enable_voting', v)}
              theme={theme}
            />
          </div>
        )}

        {activeTab === 'moderation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SettingToggle
              label="Auto Moderation"
              description="Automatically moderate content using AI"
              value={settings.auto_moderation}
              onChange={(v) => handleChange('auto_moderation', v)}
              theme={theme}
            />
            <SettingToggle
              label="Profanity Filter"
              description="Filter profanity in comments and captions"
              value={settings.profanity_filter}
              onChange={(v) => handleChange('profanity_filter', v)}
              theme={theme}
            />
            <SettingToggle
              label="Spam Detection"
              description="Detect and prevent spam content"
              value={settings.spam_detection}
              onChange={(v) => handleChange('spam_detection', v)}
              theme={theme}
            />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SettingToggle
              label="Email Notifications"
              description="Send email notifications to users"
              value={settings.email_notifications}
              onChange={(v) => handleChange('email_notifications', v)}
              theme={theme}
            />
            <SettingToggle
              label="Push Notifications"
              description="Send push notifications to users"
              value={settings.push_notifications}
              onChange={(v) => handleChange('push_notifications', v)}
              theme={theme}
            />
            <SettingToggle
              label="SMS Notifications"
              description="Send SMS notifications to users"
              value={settings.sms_notifications}
              onChange={(v) => handleChange('sms_notifications', v)}
              theme={theme}
            />
          </div>
        )}

        {activeTab === 'performance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SettingToggle
              label="Cache Enabled"
              description="Enable caching for better performance"
              value={settings.cache_enabled}
              onChange={(v) => handleChange('cache_enabled', v)}
              theme={theme}
            />
            <SettingToggle
              label="CDN Enabled"
              description="Use CDN for static assets"
              value={settings.cdn_enabled}
              onChange={(v) => handleChange('cdn_enabled', v)}
              theme={theme}
            />
            {settings.cdn_enabled && (
              <SettingField
                label="CDN URL"
                value={settings.cdn_url || ''}
                onChange={(v) => handleChange('cdn_url', v)}
                placeholder="https://cdn.example.com"
                theme={theme}
              />
            )}
            <SettingToggle
              label="Analytics Enabled"
              description="Track platform analytics"
              value={settings.analytics_enabled}
              onChange={(v) => handleChange('analytics_enabled', v)}
              theme={theme}
            />
            <SettingToggle
              label="Track User Activity"
              description="Track detailed user activity"
              value={settings.track_user_activity}
              onChange={(v) => handleChange('track_user_activity', v)}
              theme={theme}
            />
          </div>
        )}

        {activeTab === 'api' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SettingToggle
              label="API Enabled"
              description="Enable API access"
              value={settings.api_enabled}
              onChange={(v) => handleChange('api_enabled', v)}
              theme={theme}
            />
            <SettingField
              label="API Rate Limit (requests/minute)"
              type="number"
              value={settings.api_rate_limit}
              onChange={(v) => handleChange('api_rate_limit', parseInt(v))}
              theme={theme}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SettingField({ label, value, onChange, type = 'text', multiline = false, placeholder = '', theme }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: 14,
        fontWeight: 600,
        color: theme.txt,
        marginBottom: 8,
      }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'vertical',
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px',
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
          }}
        />
      )}
    </div>
  );
}

function SettingToggle({ label, description, value, onChange, theme }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      background: theme.bg,
      borderRadius: 8,
    }}>
      <div>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: theme.txt,
          marginBottom: 4,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 13,
          color: theme.sub,
        }}>
          {description}
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          background: value ? theme.pri : theme.border,
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s',
        }}
      >
        <div style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          left: value ? 22 : 2,
          transition: 'all 0.2s',
        }} />
      </button>
    </div>
  );
}
