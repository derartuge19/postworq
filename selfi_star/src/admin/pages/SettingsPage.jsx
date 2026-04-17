import { useState, useEffect } from 'react';
import { Settings, Save, Key, Database, Bell, Shield, Zap, Globe, Type, Palette } from 'lucide-react';
import api from '../../api';
import { AlertModal } from '../components/AlertModal';

// Available Google Fonts
const AVAILABLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Nunito',
  'Raleway',
  'Ubuntu',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
  'Oswald',
  'Quicksand',
  'Work Sans',
  'Rubik',
  'Karla',
  'Fira Sans',
  'Barlow',
  'DM Sans',
];

export function SettingsPage({ theme }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  // Load Google Fonts dynamically when settings change
  useEffect(() => {
    if (!settings) return;
    
    const fonts = [
      settings.font_family_primary,
      settings.font_family_secondary,
      settings.font_family_username,
      settings.font_family_caption,
    ].filter((f, i, arr) => f && arr.indexOf(f) === i); // unique fonts only
    
    fonts.forEach(font => {
      if (font && font !== 'Inter') {
        const fontUrl = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
        const existingLink = document.querySelector(`link[href*="${font.replace(/ /g, '+')}"]`);
        
        if (!existingLink) {
          const link = document.createElement('link');
          link.href = fontUrl;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
          console.log('[Admin] Loaded font:', font);
        }
      }
    });
  }, [settings?.font_family_primary, settings?.font_family_secondary, settings?.font_family_username, settings?.font_family_caption]);

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
      <div style={{ padding: 40, textAlign: 'center', color: theme.sub }}>
        Loading settings...
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'content', label: 'Content', icon: Globe },
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'api', label: 'API', icon: Key },
  ];

  return (
    <div>
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

        {activeTab === 'typography' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
            {/* Left: Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{
                padding: 16,
                background: `${theme.pri}10`,
                borderRadius: 8,
              }}>
                <p style={{ margin: 0, fontSize: 14, color: theme.sub }}>
                  Customize the fonts used throughout the platform. Changes preview in real-time on the right.
                </p>
              </div>
              
              <FontSelect
              label="Primary Font (Headings & UI)"
              value={settings.font_family_primary || 'Inter'}
              onChange={(v) => handleChange('font_family_primary', v)}
              theme={theme}
            />
            <FontSelect
              label="Secondary Font (Body Text)"
              value={settings.font_family_secondary || 'Inter'}
              onChange={(v) => handleChange('font_family_secondary', v)}
              theme={theme}
            />
            <FontSelect
              label="Username Font"
              value={settings.font_family_username || 'Inter'}
              onChange={(v) => handleChange('font_family_username', v)}
              theme={theme}
            />
            <FontSelect
              label="Caption Font"
              value={settings.font_family_caption || 'Inter'}
              onChange={(v) => handleChange('font_family_caption', v)}
              theme={theme}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <SettingField
                label="Base Font Size (px)"
                type="number"
                value={settings.font_size_base || 16}
                onChange={(v) => handleChange('font_size_base', parseInt(v))}
                theme={theme}
              />
              <SettingField
                label="Line Height"
                value={settings.line_height || '1.5'}
                onChange={(v) => handleChange('line_height', v)}
                placeholder="1.5"
                theme={theme}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: theme.txt,
                  marginBottom: 8,
                }}>
                  Heading Font Weight
                </label>
                <select
                  value={settings.font_weight_headings || '700'}
                  onChange={(e) => handleChange('font_weight_headings', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    background: '#fff',
                  }}
                >
                  <option value="400">Regular (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi-Bold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="800">Extra Bold (800)</option>
                  <option value="900">Black (900)</option>
                </select>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: theme.txt,
                  marginBottom: 8,
                }}>
                  Body Font Weight
                </label>
                <select
                  value={settings.font_weight_body || '400'}
                  onChange={(e) => handleChange('font_weight_body', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    background: '#fff',
                  }}
                >
                  <option value="300">Light (300)</option>
                  <option value="400">Regular (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi-Bold (600)</option>
                </select>
              </div>
            </div>
            
            <SettingField
              label="Letter Spacing"
              value={settings.letter_spacing || 'normal'}
              onChange={(v) => handleChange('letter_spacing', v)}
              placeholder="normal, 0.5px, -0.02em"
              theme={theme}
            />
            </div>
            
            {/* Right: Live Preview Panel (Sticky) */}
            <div style={{
              position: 'sticky',
              top: 20,
              height: 'fit-content',
            }}>
              <div style={{
                background: '#fff',
                borderRadius: 12,
                border: `2px solid ${theme.border}`,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}>
                <div style={{
                  padding: '16px 20px',
                  background: theme.pri,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16,
                }}>
                  Live Preview
                </div>
                
                <div style={{ padding: 24 }}>
                  {/* Heading Preview */}
                  <div style={{
                    marginBottom: 24,
                    paddingBottom: 24,
                    borderBottom: `1px solid ${theme.border}`,
                  }}>
                    <div style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: theme.sub,
                      marginBottom: 8,
                      fontWeight: 600,
                    }}>
                      Heading Font
                    </div>
                    <h1 style={{
                      fontFamily: `"${settings.font_family_primary || 'Inter'}", sans-serif`,
                      fontWeight: settings.font_weight_headings || '700',
                      fontSize: 32,
                      color: theme.txt,
                      margin: '0 0 8px 0',
                      lineHeight: 1.2,
                    }}>
                      Welcome Back!
                    </h1>
                    <h2 style={{
                      fontFamily: `"${settings.font_family_primary || 'Inter'}", sans-serif`,
                      fontWeight: settings.font_weight_headings || '700',
                      fontSize: 24,
                      color: theme.txt,
                      margin: '0 0 8px 0',
                      lineHeight: 1.3,
                    }}>
                      Section Title
                    </h2>
                    <h3 style={{
                      fontFamily: `"${settings.font_family_primary || 'Inter'}", sans-serif`,
                      fontWeight: settings.font_weight_headings || '700',
                      fontSize: 18,
                      color: theme.txt,
                      margin: 0,
                      lineHeight: 1.4,
                    }}>
                      Subsection
                    </h3>
                  </div>
                  
                  {/* Body Text Preview */}
                  <div style={{
                    marginBottom: 24,
                    paddingBottom: 24,
                    borderBottom: `1px solid ${theme.border}`,
                  }}>
                    <div style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: theme.sub,
                      marginBottom: 8,
                      fontWeight: 600,
                    }}>
                      Body Font
                    </div>
                    <p style={{
                      fontFamily: `"${settings.font_family_secondary || 'Inter'}", sans-serif`,
                      fontWeight: settings.font_weight_body || '400',
                      fontSize: settings.font_size_base || 16,
                      lineHeight: settings.line_height || '1.5',
                      letterSpacing: settings.letter_spacing || 'normal',
                      color: theme.txt,
                      margin: '0 0 12px 0',
                    }}>
                      This is how body text will appear throughout the entire platform. The quick brown fox jumps over the lazy dog.
                    </p>
                    <p style={{
                      fontFamily: `"${settings.font_family_secondary || 'Inter'}", sans-serif`,
                      fontWeight: settings.font_weight_body || '400',
                      fontSize: (settings.font_size_base || 16) * 0.875,
                      lineHeight: settings.line_height || '1.5',
                      letterSpacing: settings.letter_spacing || 'normal',
                      color: theme.sub,
                      margin: 0,
                    }}>
                      Smaller text for descriptions and secondary content.
                    </p>
                  </div>
                  
                  {/* Username Preview */}
                  <div style={{
                    marginBottom: 24,
                    paddingBottom: 24,
                    borderBottom: `1px solid ${theme.border}`,
                  }}>
                    <div style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: theme.sub,
                      marginBottom: 12,
                      fontWeight: 600,
                    }}>
                      Username Font
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: theme.pri,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 16,
                      }}>
                        JD
                      </div>
                      <div>
                        <div style={{
                          fontFamily: `"${settings.font_family_username || 'Inter'}", sans-serif`,
                          fontWeight: 600,
                          fontSize: 15,
                          color: theme.txt,
                          marginBottom: 2,
                        }}>
                          @johndoe
                        </div>
                        <div style={{
                          fontFamily: `"${settings.font_family_secondary || 'Inter'}", sans-serif`,
                          fontSize: 13,
                          color: theme.sub,
                        }}>
                          John Doe
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Caption Preview */}
                  <div>
                    <div style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: theme.sub,
                      marginBottom: 8,
                      fontWeight: 600,
                    }}>
                      Caption Font
                    </div>
                    <div style={{
                      fontFamily: `"${settings.font_family_caption || 'Inter'}", sans-serif`,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: theme.txt,
                    }}>
                      This is a caption or description text that appears under posts and images. It's designed to be readable and complement the main content.
                    </div>
                  </div>
                  
                  {/* Button Preview */}
                  <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${theme.border}` }}>
                    <button style={{
                      fontFamily: `"${settings.font_family_secondary || 'Inter'}", sans-serif`,
                      padding: '12px 24px',
                      background: theme.pri,
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '100%',
                    }}>
                      Button Text
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Font Info */}
              <div style={{
                marginTop: 16,
                padding: 12,
                background: `${theme.pri}10`,
                borderRadius: 8,
                fontSize: 12,
                color: theme.sub,
              }}>
                <div style={{ marginBottom: 4 }}>
                  <strong>Primary:</strong> {settings.font_family_primary || 'Inter'}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <strong>Secondary:</strong> {settings.font_family_secondary || 'Inter'}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <strong>Username:</strong> {settings.font_family_username || 'Inter'}
                </div>
                <div>
                  <strong>Caption:</strong> {settings.font_family_caption || 'Inter'}
                </div>
              </div>
              
              {/* Debug Info */}
              <div style={{
                marginTop: 16,
                padding: 12,
                background: '#FEF3C7',
                border: '2px solid #F59E0B',
                borderRadius: 8,
                fontSize: 11,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: '#92400E' }}>
                  ⚠️ Preview Status
                </div>
                <div style={{ color: '#78350F', marginBottom: 4 }}>
                  Fonts loaded in admin panel. After saving, refresh the main app to see changes.
                </div>
                <button
                  onClick={() => {
                    const fonts = [settings.font_family_primary, settings.font_family_secondary, settings.font_family_username, settings.font_family_caption];
                    alert(`Current fonts:\n${fonts.join('\n')}\n\nCheck browser console for font loading status.`);
                  }}
                  style={{
                    marginTop: 8,
                    padding: '6px 12px',
                    background: '#F59E0B',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Check Font Status
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'theme' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
              padding: 16,
              background: `${theme.pri}10`,
              borderRadius: 8,
              marginBottom: 8,
            }}>
              <p style={{ margin: 0, fontSize: 14, color: theme.sub }}>
                Customize the brand colors used throughout the platform.
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: theme.txt,
                  marginBottom: 8,
                }}>
                  Primary Color
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={settings.primary_color || '#8B5CF6'}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    style={{
                      width: 48,
                      height: 48,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  />
                  <input
                    type="text"
                    value={settings.primary_color || '#8B5CF6'}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: theme.txt,
                  marginBottom: 8,
                }}>
                  Secondary Color
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={settings.secondary_color || '#F97316'}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    style={{
                      width: 48,
                      height: 48,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  />
                  <input
                    type="text"
                    value={settings.secondary_color || '#F97316'}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Color Preview */}
            <div style={{
              padding: 24,
              background: theme.bg,
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
            }}>
              <h4 style={{ margin: '0 0 16px 0', color: theme.txt }}>Color Preview</h4>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <button style={{
                  padding: '12px 24px',
                  background: settings.primary_color || '#8B5CF6',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  Primary Button
                </button>
                <button style={{
                  padding: '12px 24px',
                  background: settings.secondary_color || '#F97316',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  Secondary Button
                </button>
                <div style={{
                  padding: '12px 24px',
                  background: `${settings.primary_color || '#8B5CF6'}20`,
                  borderRadius: 8,
                  color: settings.primary_color || '#8B5CF6',
                  fontWeight: 600,
                }}>
                  Badge Style
                </div>
              </div>
            </div>
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

      {/* Success/Error Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        showCancel={false}
      />
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

function FontSelect({ label, value, onChange, theme }) {
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          fontSize: 14,
          outline: 'none',
          background: '#fff',
          fontFamily: `"${value}", sans-serif`,
        }}
      >
        {AVAILABLE_FONTS.map(font => (
          <option key={font} value={font} style={{ fontFamily: `"${font}", sans-serif` }}>
            {font}
          </option>
        ))}
      </select>
      <div style={{
        marginTop: 8,
        padding: '8px 12px',
        background: theme.bg,
        borderRadius: 6,
        fontFamily: `"${value}", sans-serif`,
        fontSize: 14,
        color: theme.sub,
      }}>
        The quick brown fox jumps over the lazy dog
      </div>
    </div>
  );
}
