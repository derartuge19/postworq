import { useState, useEffect } from 'react';
import { Trophy, Calendar, Award, Users, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import api from '../api';
import config from '../config.js';
import { useTheme } from '../contexts/ThemeContext';

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
`;
if (!document.head.querySelector('style[data-campaigns]')) {
  style.setAttribute('data-campaigns', 'true');
  document.head.appendChild(style);
}

export function CampaignsPage({ onCampaignClick, onBack }) {
  const { colors: T } = useTheme();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadCampaigns();
  }, [filter]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.request(`/campaigns/?status=${filter}`);
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return T.pri;
      case 'voting': return '#3B82F6';
      case 'upcoming': return '#F97316';
      case 'completed': return T.sub;
      default: return T.sub;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      padding: '20px 24px',
      boxSizing: 'border-box',
    }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.txt, fontSize: 14, fontWeight: 600,
          padding: '4px 0', marginBottom: 16,
        }}
      >
        <ArrowLeft size={20} strokeWidth={2.5} />
        Back
      </button>

      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: 32,
        padding: '32px 20px',
        background: `linear-gradient(135deg, ${theme.pri}15, ${theme.orange}15)`,
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          margin: '0 auto 16px',
          background: `linear-gradient(135deg, ${theme.pri}, ${theme.orange})`,
          borderRadius: '50%',
          boxShadow: `0 4px 16px ${theme.pri}40`,
        }}>
          <Trophy size={28} color="#fff" strokeWidth={2.5} />
        </div>
        <h1 style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 900,
          background: `linear-gradient(135deg, ${theme.pri}, ${theme.orange})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 8,
          letterSpacing: '-0.02em',
        }}>
          Prize Campaigns
        </h1>
        <p style={{
          fontSize: 14,
          color: theme.sub,
          maxWidth: 500,
          margin: '0 auto',
          lineHeight: 1.5
        }}>
          Participate in exciting competitions and win amazing prizes!
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 28,
      }}>
          {[
            { id: 'all', label: 'All', icon: Trophy, color: '#DA9B2A' },
            { id: 'active', label: 'Active Now', icon: Trophy, color: theme.green },
            { id: 'voting', label: 'Voting Open', icon: Award, color: theme.blue },
            { id: 'upcoming', label: 'Coming Soon', icon: Clock, color: theme.orange },
            { id: 'completed', label: 'Completed', icon: Calendar, color: theme.sub },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '8px 16px',
                  background: isActive ? `linear-gradient(135deg, ${tab.color}, ${tab.color}dd)` : theme.card,
                  border: `2px solid ${isActive ? tab.color : theme.border}`,
                  borderRadius: 16,
                  color: isActive ? '#fff' : theme.txt,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? `0 8px 20px ${tab.color}40` : '0 2px 8px rgba(0,0,0,0.05)',
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                  }
                }}
              >
                <Icon size={20} strokeWidth={2.5} />
                {tab.label}
              </button>
            );
          })}
      </div>

      {/* Campaigns Grid */}
      {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
            maxWidth: '1100px',
            margin: '0 auto',
          }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: `1px solid ${theme.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{
                  width: '100%',
                  height: 160,
                  background: `linear-gradient(90deg, ${theme.bg} 0%, ${theme.border} 50%, ${theme.bg} 100%)`,
                  backgroundSize: '1000px 100%',
                  animation: 'shimmer 2s infinite',
                }} />
                <div style={{ padding: 16 }}>
                  <div style={{
                    height: 16,
                    background: `linear-gradient(90deg, ${theme.bg} 0%, ${theme.border} 50%, ${theme.bg} 100%)`,
                    backgroundSize: '1000px 100%',
                    animation: 'shimmer 2s infinite',
                    borderRadius: 8,
                    marginBottom: 8,
                  }} />
                  <div style={{
                    height: 24,
                    background: `linear-gradient(90deg, ${theme.bg} 0%, ${theme.border} 50%, ${theme.bg} 100%)`,
                    backgroundSize: '1000px 100%',
                    animation: 'shimmer 2s infinite',
                    borderRadius: 8,
                    marginBottom: 12,
                  }} />
                  <div style={{
                    height: 40,
                    background: `linear-gradient(90deg, ${theme.bg} 0%, ${theme.border} 50%, ${theme.bg} 100%)`,
                    backgroundSize: '1000px 100%',
                    animation: 'shimmer 2s infinite',
                    borderRadius: 12,
                  }} />
                </div>
              </div>
            ))}
          </div>
      ) : campaigns.length === 0 ? (
          <div style={{
            background: T.cardBg,
            borderRadius: 16,
            padding: 40,
            textAlign: 'center',
            border: `1px solid ${T.border}`,
          }}>
            <Trophy size={48} color={T.pri} style={{ marginBottom: 12 }} />
            <h3 style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: T.txt,
              marginBottom: 8,
            }}>
              No {filter} campaigns
            </h3>
            <p style={{
              margin: 0,
              fontSize: 14,
              color: T.sub,
            }}>
              Check back later for new opportunities!
            </p>
          </div>
      ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
            maxWidth: '1100px',
            margin: '0 auto',
          }}>
            {campaigns.map(campaign => {
              const statusColor = getStatusColor(campaign.status);
              
              return (
                <div
                  key={campaign.id}
                  onClick={() => onCampaignClick?.(campaign.id)}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: `1px solid ${theme.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 6px 20px ${statusColor}25`;
                    e.currentTarget.style.borderColor = statusColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = theme.border;
                  }}
                >
                  {/* Campaign Image */}
                  {campaign.image ? (
                    <div style={{
                      width: '100%',
                      height: 160,
                      background: `url(${mediaUrl(campaign.image)}) center/cover`,
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)',
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        padding: '8px 16px',
                        borderRadius: 12,
                        background: statusColor,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      }}>
                        {campaign.status}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      width: '100%',
                      height: 160,
                      background: `linear-gradient(135deg, ${theme.pri}25, ${theme.orange}25)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute',
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${theme.pri}15, transparent)`,
                        animation: 'pulse 3s ease-in-out infinite',
                      }} />
                      <Trophy size={48} color={theme.pri} opacity={0.4} strokeWidth={1.5} />
                      <div style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        padding: '8px 16px',
                        borderRadius: 12,
                        background: statusColor,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      }}>
                        {campaign.status}
                      </div>
                    </div>
                  )}

                  {/* Campaign Content */}
                  <div style={{ padding: 12 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 6,
                    }}>
                      <span style={{
                        padding: '2px 8px',
                        background: `${theme.pri}15`,
                        color: theme.pri,
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {campaign.campaign_type === 'grand' ? 'Grand' : 
                         campaign.campaign_type === 'daily' ? 'Daily' : 
                         campaign.campaign_type === 'weekly' ? 'Weekly' : 'Monthly'}
                      </span>
                    </div>
                    <h3 style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 700,
                      color: theme.txt,
                      marginBottom: 6,
                      lineHeight: 1.3,
                    }}>
                      {campaign.title}
                    </h3>
                    
                    <p style={{
                      margin: 0,
                      fontSize: 12,
                      color: theme.sub,
                      marginBottom: 12,
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {campaign.description}
                    </p>

                    {/* Prize */}
                    <div style={{
                      padding: 10,
                      background: `linear-gradient(135deg, ${theme.pri}12, ${theme.orange}12)`,
                      borderRadius: 8,
                      marginBottom: 12,
                      border: `1px solid ${theme.pri}25`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        position: 'relative',
                      }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${theme.pri}, ${theme.orange})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 2px 8px ${theme.pri}40`,
                        }}>
                          <Award size={18} color="#fff" strokeWidth={2.5} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: 10,
                            color: theme.sub,
                            marginBottom: 2,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}>
                            Grand Prize
                          </div>
                          <div style={{
                            fontSize: 18,
                            fontWeight: 900,
                            background: `linear-gradient(135deg, ${theme.pri}, ${theme.orange})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            lineHeight: 1,
                            marginBottom: 4,
                          }}>
                            ${campaign.prize_value}
                          </div>
                          <div style={{
                            fontSize: 13,
                            color: theme.txt,
                            fontWeight: 600,
                          }}>
                            {campaign.prize_title}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 8,
                      marginBottom: 12,
                      paddingTop: 12,
                      borderTop: `1px solid ${theme.border}`,
                    }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '8px 4px',
                        background: theme.bg,
                        borderRadius: 6,
                      }}>
                        <div style={{
                          fontSize: 9,
                          color: theme.sub,
                          marginBottom: 4,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          Entries
                        </div>
                        <div style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: theme.blue,
                        }}>
                          {campaign.total_entries || 0}
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'center',
                        padding: '8px 4px',
                        background: theme.bg,
                        borderRadius: 6,
                      }}>
                        <div style={{
                          fontSize: 10,
                          color: theme.sub,
                          marginBottom: 6,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          Votes
                        </div>
                        <div style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: theme.red,
                        }}>
                          {campaign.total_votes || 0}
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'center',
                        padding: '12px 8px',
                        background: theme.bg,
                        borderRadius: 10,
                      }}>
                        <div style={{
                          fontSize: 10,
                          color: theme.sub,
                          marginBottom: 6,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          Time Left
                        </div>
                        <div style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: statusColor,
                        }}>
                          {getTimeRemaining(campaign.voting_end || campaign.entry_deadline).split(' ')[0]}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: `linear-gradient(135deg, ${theme.pri}, ${theme.orange})`,
                        border: 'none',
                        borderRadius: 12,
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: `0 4px 16px ${theme.pri}40`,
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                    >
                      View Campaign
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
