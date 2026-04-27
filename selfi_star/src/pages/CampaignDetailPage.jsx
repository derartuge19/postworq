import { useState, useEffect } from 'react';
import { Trophy, Calendar, Award, Users, Clock, Upload, Video, Check, X, Heart, Share2, ArrowLeft, AlertCircle, Star, Zap, TrendingUp, Medal, Crown, Target, Flame, List, BarChart3 } from 'lucide-react';
import api from '../api';
import config from '../config.js';
import { useTheme } from '../contexts/ThemeContext';

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

export function CampaignDetailPage({ campaignId, onBack, onShowLeaderboard, onShowFeed }) {
  const { colors: T } = useTheme();
  const [campaign, setCampaign] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [userEntry, setUserEntry] = useState(null);

  useEffect(() => {
    if (campaignId) {
      loadCampaignDetails();
    }
  }, [campaignId]);

  const loadCampaignDetails = async () => {
    try {
      setLoading(true);
      const data = await api.request(`/campaigns/${campaignId}/`);
      setCampaign(data);
      setEntries(data.entries || []);
      // Check if user has already entered
      const userHasEntered = data.entries?.some(entry => entry.user?.id === data.current_user_id);
      setUserEntry(userHasEntered ? data.entries.find(entry => entry.user?.id === data.current_user_id) : null);
    } catch (error) {
      console.error('Failed to load campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (entryId) => {
    try {
      await api.request(`/campaigns/entries/${entryId}/vote/`, {
        method: 'POST'
      });
      // Reload to get updated rankings
      loadCampaignDetails();
    } catch (error) {
      console.error('Failed to vote:', error);
      alert(error.message || 'Failed to vote. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    
    // Validate date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getTimeRemaining = (endDate) => {
    if (!endDate) return 'N/A';
    const now = new Date();
    const end = new Date(endDate);
    
    // Validate date
    if (isNaN(end.getTime())) {
      console.warn('Invalid end date:', endDate);
      return 'N/A';
    }
    
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days ${hours} hours`;
    return `${hours} hours`;
  };

  const canSubmit = () => {
    if (!campaign) return false;
    const now = new Date();
    const start = new Date(campaign.start_date);
    const deadline = new Date(campaign.entry_deadline);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(deadline.getTime())) {
      console.warn('Invalid campaign dates:', { start_date: campaign.start_date, entry_deadline: campaign.entry_deadline });
      return false;
    }
    
    return campaign.status === 'active' && now >= start && now <= deadline && !userEntry;
  };

  const canVote = () => {
    if (!campaign) return false;
    const now = new Date();
    const votingStart = new Date(campaign.voting_start);
    const votingEnd = new Date(campaign.voting_end);
    
    // Validate dates
    if (isNaN(votingStart.getTime()) || isNaN(votingEnd.getTime())) {
      console.warn('Invalid voting dates:', { voting_start: campaign.voting_start, voting_end: campaign.voting_end });
      return false;
    }
    
    return campaign.status === 'voting' && now >= votingStart && now <= votingEnd;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: '240px',
      }}>
        <div style={{ color: T.sub }}>Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{
        minHeight: '100vh',
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: '240px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={48} color={T.red} style={{ marginBottom: 16 }} />
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.txt, marginBottom: 8 }}>
            Campaign Not Found
          </h2>
          <button
            onClick={onBack}
            style={{
              marginTop: 16,
              padding: '12px 24px',
              background: T.pri,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      padding: '24px 32px 60px 32px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            color: T.sub,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={18} />
          Back to Campaigns
        </button>

        {/* Campaign Header */}
        <div style={{
          background: T.cardBg || '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          border: `1px solid ${T.border}`,
          marginBottom: 32,
        }}>
          {campaign.image && (
            <div style={{
              width: '100%',
              height: 300,
              background: `url(${mediaUrl(campaign.image)}) center/cover`,
            }} />
          )}
          
          <div style={{ padding: 32 }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: T.pri + '20',
                    color: T.pri,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>
                    {campaign.status}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(59,130,246,0.2)',
                    color: '#3B82F6',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>
                    {campaign.campaign_type === 'grand' ? 'Grand Campaign' : 
                     campaign.campaign_type === 'daily' ? 'Daily Campaign' : 
                     campaign.campaign_type === 'weekly' ? 'Weekly Campaign' : 'Monthly Campaign'}
                  </div>
                </div>
                
                <h1 style={{
                  margin: 0,
                  fontSize: 36,
                  fontWeight: 800,
                  color: T.txt,
                  marginBottom: 12,
                }}>
                  {campaign.title}
                </h1>
                
                <p style={{
                  margin: 0,
                  fontSize: 16,
                  color: T.sub,
                  lineHeight: 1.6,
                }}>
                  {campaign.description}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {canSubmit() ? (
                  <button
                    onClick={() => {
                      if (!api.hasToken()) {
                        alert('Please log in to submit a campaign entry.');
                        return;
                      }
                      setShowSubmitModal(true);
                    }}
                    style={{
                      padding: '16px 32px',
                      background: 'linear-gradient(135deg, #DA9B2A, #F97316)',
                      border: 'none',
                      borderRadius: 16,
                      color: '#fff',
                      fontSize: 18,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      boxShadow: '0 8px 24px rgba(218,155,42,0.6)',
                      transition: 'all 0.3s ease',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(218,155,42,0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(218,155,42,0.6)';
                    }}
                  >
                    <Upload size={22} strokeWidth={2.5} />
                    🎯 Join Campaign
                  </button>
                ) : userEntry ? (
                  <div style={{
                    padding: '12px 20px',
                    background: 'rgba(16,185,129,0.15)',
                    border: '2px solid #10B981',
                    borderRadius: 16,
                    color: '#10B981',
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <Check size={18} strokeWidth={3} />
                    Already Entered
                  </div>
                ) : (
                  <div style={{
                    padding: '12px 20px',
                    background: 'rgba(239,68,68,0.15)',
                    border: '2px solid #EF4444',
                    borderRadius: 16,
                    color: '#EF4444',
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <AlertCircle size={18} strokeWidth={3} />
                    Cannot Submit
                  </div>
                )}
                
                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onShowLeaderboard?.()}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: T.cardBg || '#fff',
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                      color: T.txt,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <BarChart3 size={18} />
                    Leaderboard
                  </button>
                  <button
                    onClick={() => onShowFeed?.()}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: T.cardBg || '#fff',
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                      color: T.txt,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <List size={18} />
                    Feed
                  </button>
                </div>
              </div>
            </div>

            {/* Prize Section */}
            <div style={{
              padding: 24,
              background: 'linear-gradient(135deg, rgba(218,155,42,0.15), rgba(249,115,22,0.15))',
              borderRadius: 12,
              border: '2px solid rgba(218,155,42,0.3)',
              marginBottom: 24,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: T.pri,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Trophy size={32} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14,
                    color: T.sub,
                    marginBottom: 4,
                  }}>
                    Prize
                  </div>
                  <div style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: T.pri,
                    marginBottom: 4,
                  }}>
                    {campaign.prize_value} ETB
                  </div>
                  <div style={{
                    fontSize: 15,
                    color: T.txt,
                  }}>
                    {campaign.prize_title}
                  </div>
                </div>
              </div>
            </div>

            {/* Gamification Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 24,
            }}>
              <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
                borderRadius: 12,
                border: '2px solid rgba(59,130,246,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(59,130,246,0.1)',
                }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}>
                  <Users size={18} color="#3B82F6" />
                  <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>
                    Participants
                  </span>
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: T.blue,
                }}>
                  {campaign.total_entries || 0}
                </div>
              </div>

              <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                borderRadius: 12,
                border: '2px solid rgba(239,68,68,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(239,68,68,0.1)',
                }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}>
                  <Flame size={18} color={T.red} />
                  <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>
                    Total Votes
                  </span>
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: T.red,
                }}>
                  {campaign.total_votes || 0}
                </div>
              </div>

              <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))',
                borderRadius: 12,
                border: '2px solid rgba(249,115,22,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(249,115,22,0.1)',
                }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}>
                  <Clock size={18} color={T.orange} />
                  <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>
                    Time Left
                  </span>
                </div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: T.orange,
                }}>
                  {getTimeRemaining(campaign.voting_end || campaign.entry_deadline)}
                </div>
              </div>

              {/* Engagement Score */}
              <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))',
                borderRadius: 12,
                border: '2px solid rgba(139,92,246,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(139,92,246,0.1)',
                }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}>
                  <TrendingUp size={18} color="#8B5CF6" />
                  <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>
                    Engagement
                  </span>
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: T.purple,
                }}>
                  {campaign.total_entries > 0 ? Math.round((campaign.total_votes / campaign.total_entries) * 10) / 10 : 0}
                </div>
              </div>
            </div>

            {/* Entry Requirements */}
            {(campaign.min_followers > 0 || campaign.min_level > 0 || campaign.min_votes_per_reel > 0 || campaign.required_hashtags) && (
              <div style={{
                padding: 20,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
                borderRadius: 12,
                border: '2px solid rgba(59,130,246,0.3)',
                marginBottom: 24,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Target size={20} color="#fff" strokeWidth={2.5} />
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: T.txt,
                  }}>
                    Entry Requirements
                  </h3>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                }}>
                  {campaign.required_hashtags && (
                    <div style={{
                      padding: 16,
                      background: T.cardBg || '#fff',
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                    }}>
                      <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600 }}>
                        Required Hashtags
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.pri }}>
                        {campaign.required_hashtags}
                      </div>
                    </div>
                  )}
                  {campaign.min_followers > 0 && (
                    <div style={{
                      padding: 16,
                      background: T.cardBg || '#fff',
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                    }}>
                      <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600 }}>
                        Minimum Followers
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#3B82F6' }}>
                        {campaign.min_followers}+
                      </div>
                    </div>
                  )}
                  {campaign.min_level > 0 && (
                    <div style={{
                      padding: 16,
                      background: T.cardBg || '#fff',
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                    }}>
                      <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600 }}>
                        Minimum Level
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#F97316' }}>
                        Level {campaign.min_level}
                      </div>
                    </div>
                  )}
                  {campaign.min_votes_per_reel > 0 && (
                    <div style={{
                      padding: 16,
                      background: T.cardBg || '#fff',
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                    }}>
                      <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600 }}>
                        Minimum Votes per Reel
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#EF4444' }}>
                        {campaign.min_votes_per_reel}+
                      </div>
                    </div>
                  )}
                  {campaign.winner_count > 0 && (
                    <div style={{
                      padding: 16,
                      background: T.cardBg || '#fff',
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                    }}>
                      <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600 }}>
                        Number of Winners
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981' }}>
                        {campaign.winner_count}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div style={{
              padding: 20,
              background: T.bg,
              borderRadius: 12,
              border: `1px solid ${T.border}`,
            }}>
              <h3 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: T.txt,
                marginBottom: 16,
              }}>
                Campaign Timeline
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
              }}>
                <div>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>
                    Start Date
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.txt }}>
                    {formatDate(campaign.start_date)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>
                    Entry Deadline
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.txt }}>
                    {formatDate(campaign.entry_deadline)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>
                    Voting Period
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.txt }}>
                    {formatDate(campaign.voting_start)} - {formatDate(campaign.voting_end)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Entry with Gamification */}
        {userEntry && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(218,155,42,0.1))',
            borderRadius: 16,
            padding: 24,
            border: '2px solid #10B981',
            marginBottom: 32,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(218,155,42,0.1)',
            }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Check size={24} color="#fff" strokeWidth={3} />
                </div>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: T.txt,
                  }}>
                    Your Entry Submitted!
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: 13,
                    color: T.sub,
                  }}>
                    Good luck! 🍀
                  </p>
                </div>
              </div>
              {userEntry.rank && userEntry.rank <= 3 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: userEntry.rank === 1 ? '#FFD700' : userEntry.rank === 2 ? '#C0C0C0' : '#CD7F32',
                  borderRadius: 20,
                }}>
                  <Crown size={18} color="#fff" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>#{userEntry.rank}</span>
                </div>
              )}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}>
              <div style={{
                padding: 12,
                background: T.cardBg || '#fff',
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>Votes</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: T.pri }}>{userEntry.vote_count || 0}</div>
              </div>
              <div style={{
                padding: 12,
                background: T.cardBg || '#fff',
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>Rank</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#3B82F6' }}>#{userEntry.rank || '-'}</div>
              </div>
              <div style={{
                padding: 12,
                background: T.cardBg || '#fff',
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>✓ Active</div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Section */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #DA9B2A, #F97316)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Trophy size={24} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 800,
                  color: T.txt,
                }}>
                  {canVote() ? '🔥 Vote for Your Favorites' : '🏆 Leaderboard'}
                </h2>
                <p style={{
                  margin: 0,
                  fontSize: 13,
                  color: T.sub,
                }}>
                  {entries.length} entries competing for {campaign.prize_value} ETB
                </p>
              </div>
            </div>
            {canVote() && (
              <div style={{
                padding: '8px 16px',
                background: 'rgba(16,185,129,0.15)',
                borderRadius: 20,
                border: `2px solid #10B981`,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <Zap size={16} color="#10B981" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Voting Open</span>
              </div>
            )}
          </div>

          {entries.length === 0 ? (
            <div style={{
              background: T.cardBg || '#fff',
              borderRadius: 16,
              padding: 60,
              textAlign: 'center',
              border: `1px solid ${T.border}`,
            }}>
              <Video size={48} color={T.sub} style={{ marginBottom: 16 }} />
              <h3 style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: T.txt,
                marginBottom: 8,
              }}>
                No entries yet
              </h3>
              <p style={{
                margin: 0,
                fontSize: 14,
                color: T.sub,
              }}>
                Be the first to submit your entry!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 24,
            }}>
              {entries.map(entry => (
                <CampaignEntryCard
                  key={entry.id}
                  entry={entry}
                  theme={theme}
                  canVote={canVote()}
                  onVote={() => handleVote(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <SubmitEntryModal
          theme={theme}
          campaign={campaign}
          campaignId={campaignId}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => {
            setShowSubmitModal(false);
            loadCampaignDetails();
          }}
        />
      )}
    </div>
  );
}

function CampaignEntryCard({ entry, theme, canVote, onVote }) {
  const [hasVoted, setHasVoted] = useState(entry.user_voted);
  const [isHovered, setIsHovered] = useState(false);
  const [voteCount, setVoteCount] = useState(entry.vote_count);

  const handleVote = () => {
    if (!canVote || hasVoted) return;
    setHasVoted(true);
    setVoteCount(voteCount + 1);
    onVote();
  };

  const getRankBadge = () => {
    if (!entry.rank || entry.rank > 3) return null;
    const badges = {
      1: { color: '#FFD700', icon: '🥇', label: '1st Place' },
      2: { color: '#C0C0C0', icon: '🥈', label: '2nd Place' },
      3: { color: '#CD7F32', icon: '🥉', label: '3rd Place' },
    };
    return badges[entry.rank];
  };

  const rankBadge = getRankBadge();

  return (
    <div 
      style={{
        background: T.cardBg || '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: rankBadge ? `2px solid ${rankBadge.color}` : `1px solid ${T.border}`,
        boxShadow: isHovered ? `0 8px 24px ${rankBadge ? rankBadge.color + '40' : 'rgba(0,0,0,0.1)'}` : '0 2px 8px rgba(0,0,0,0.05)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {rankBadge && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          padding: '6px 12px',
          background: rankBadge.color,
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <span style={{ fontSize: 16 }}>{rankBadge.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{rankBadge.label}</span>
        </div>
      )}
      
      {entry.reel?.media ? (
        <div style={{ position: 'relative', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          {entry.reel.media.endsWith('.mp4') || entry.reel.media.endsWith('.mov') ? (
            <video
              src={mediaUrl(entry.reel.media)}
              style={{
                maxWidth: '100%',
                maxHeight: 400,
                objectFit: 'contain',
                background: '#000',
              }}
              controls
            />
          ) : (
            <img
              src={mediaUrl(entry.reel.media)}
              alt="Entry"
              style={{
                maxWidth: '100%',
                maxHeight: 400,
                objectFit: 'contain',
              }}
            />
          )}
        </div>
      ) : entry.reel?.image && (
        <div style={{ position: 'relative', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          <img
            src={mediaUrl(entry.reel.image)}
            alt="Entry"
            style={{
              maxWidth: '100%',
              maxHeight: 400,
              objectFit: 'contain',
            }}
          />
        </div>
      )}
      
      <div style={{ padding: 16 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #DA9B2A, #F97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              border: '2px solid #fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
              {entry.user.username[0].toUpperCase()}
            </div>
            <div>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: T.txt,
              }}>
                @{entry.user.username}
              </div>
              {entry.rank && (
                <div style={{
                  fontSize: 11,
                  color: rankBadge ? rankBadge.color : T.pri,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <TrendingUp size={12} />
                  Rank #{entry.rank}
                </div>
              )}
            </div>
          </div>
          {entry.is_winner && (
            <div style={{
              padding: '4px 10px',
              background: 'linear-gradient(135deg, #DA9B2A, #F97316)',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <Crown size={12} />
              WINNER
            </div>
          )}
        </div>

        <p style={{
          margin: 0,
          fontSize: 14,
          color: T.sub,
          marginBottom: 16,
          lineHeight: 1.5,
        }}>
          {entry.reel?.caption || 'No caption'}
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTop: `1px solid ${T.border}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: hasVoted ? 'rgba(239,68,68,0.15)' : T.bg,
            borderRadius: 20,
            border: hasVoted ? `2px solid #EF4444` : `1px solid ${T.border}`,
          }}>
            <Heart 
              size={20} 
              color="#EF4444" 
              fill={hasVoted ? "#EF4444" : 'none'}
              style={{
                transition: 'all 0.3s ease',
                transform: hasVoted ? 'scale(1.2)' : 'scale(1)',
              }}
            />
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              color: hasVoted ? "#EF4444" : T.txt,
            }}>
              {voteCount}
            </span>
            <span style={{
              fontSize: 11,
              color: T.sub,
              fontWeight: 600,
            }}>
              votes
            </span>
          </div>

          {canVote && (
            <button
              onClick={handleVote}
              disabled={hasVoted}
              style={{
                padding: '10px 20px',
                background: hasVoted 
                  ? `#10B981` 
                  : `linear-gradient(135deg, ${T.pri}, #F97316)`,
                border: 'none',
                borderRadius: 20,
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: hasVoted ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: hasVoted ? 'none' : `0 4px 12px ${T.pri}40`,
                opacity: hasVoted ? 0.7 : 1,
                transition: 'all 0.3s ease',
              }}
            >
              {hasVoted ? (
                <>
                  <Check size={16} strokeWidth={3} />
                  Voted
                </>
              ) : (
                <>
                  <Heart size={16} />
                  Vote
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmitEntryModal({ theme, campaign, campaignId, onClose, onSuccess }) {
  const [selectedReel, setSelectedReel] = useState(null);
  const [userReels, setUserReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newReelFile, setNewReelFile] = useState(null);
  const [newReelCaption, setNewReelCaption] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    loadUserReels();
  }, []);

  const loadUserReels = async () => {
    if (!api.hasToken()) {
      setLoading(false);
      setError('Please log in to submit a campaign entry.');
      return;
    }
    try {
      // Get current user's ID first
      const userResponse = await api.request('/profile/me/');
      const userId = userResponse.id;
      
      // Fetch only current user's reels
      const response = await api.request(`/reels/?user=${userId}`);
      setUserReels(response.results || []);
    } catch (error) {
      console.error('Failed to load reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewReelFile(file);
      setShowCreateNew(true);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      });
      setStream(mediaStream);
      setShowCamera(true);
      setShowCreateNew(true);
    } catch (error) {
      console.error('Camera access denied:', error);
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const startRecording = async () => {
    if (!stream) return;
    
    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      });
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], `camera_recording_${Date.now()}.webm`, { type: 'video/webm' });
        setNewReelFile(file);
        stopCamera();
      };
      
      mediaRecorder.start();
      
      // Stop recording after 30 seconds or when user clicks stop
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 30000);
      
      // Store mediaRecorder instance for stopping
      window.currentMediaRecorder = mediaRecorder;
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please try again.');
    }
  };
  
  const stopRecording = () => {
    if (window.currentMediaRecorder && window.currentMediaRecorder.state === 'recording') {
      window.currentMediaRecorder.stop();
    }
  };

  const handleCreateAndSubmit = async () => {
    if (!api.hasToken()) {
      setError('Please log in to submit a campaign entry.');
      return;
    }
    if (!newReelFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      // Create new reel
      const formData = new FormData();
      formData.append('media', newReelFile);
      formData.append('caption', newReelCaption || 'Campaign Entry');
      
      const newReel = await api.request('/reels/', {
        method: 'POST',
        body: formData,
        isFormData: true
      });
      
      // Submit to campaign
      await api.request(`/campaigns/${campaignId}/enter/`, {
        method: 'POST',
        body: JSON.stringify({ reel_id: newReel.id })
      });
      
      console.log('Entry submitted successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error submitting entry:', error);
      setError(error.message || 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (showCreateNew) {
      return handleCreateAndSubmit();
    }
    
    if (!selectedReel) {
      setError('Please select a reel to submit');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.request(`/campaigns/${campaignId}/enter/`, {
        method: 'POST',
        body: JSON.stringify({ reel_id: selectedReel })
      });
      console.log('Entry submitted successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error submitting entry:', error);
      setError(error.message || 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 600,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 700,
          color: T.txt,
          marginBottom: 8,
        }}>
          Submit Your Entry
        </h2>
        <p style={{
          margin: 0,
          fontSize: 14,
          color: T.sub,
          marginBottom: 16,
        }}>
          {showCreateNew ? 'Upload new content for this campaign' : 'Select existing reel or create new'}
        </p>
        
        {/* Toggle Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
        }}>
          <button
            onClick={() => setShowCreateNew(false)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: !showCreateNew ? T.pri : 'transparent',
              border: `2px solid ${T.pri}`,
              borderRadius: 8,
              color: !showCreateNew ? '#fff' : T.pri,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📚 Use Existing
          </button>
          <button
            onClick={() => setShowCreateNew(true)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: showCreateNew ? T.pri : 'transparent',
              border: `2px solid ${T.pri}`,
              borderRadius: 8,
              color: showCreateNew ? '#fff' : T.pri,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🎬 Create New
          </button>
        </div>

        {error && (
          <div style={{
            padding: 12,
            background: 'rgba(239,68,68,0.15)',
            border: `1px solid #EF4444`,
            borderRadius: 8,
            color: '#EF4444',
            fontSize: 14,
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {showCreateNew ? (
          <div>
            {/* Campaign Requirements */}
            {campaign && (
              <div style={{
                padding: 16,
                background: 'rgba(59,130,246,0.1)',
                borderRadius: 12,
                border: '2px solid rgba(59,130,246,0.3)',
                marginBottom: 20,
              }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.txt, marginBottom: 12 }}>
                  📋 Campaign Requirements
                </h4>
                <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8 }}>
                  {campaign.required_hashtags && (
                    <div style={{ marginBottom: 8 }}>
                      <strong style={{ color: T.txt }}>Required Hashtags:</strong> {campaign.required_hashtags}
                    </div>
                  )}
                  {campaign.min_followers > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <strong style={{ color: T.txt }}>Min Followers:</strong> {campaign.min_followers}
                    </div>
                  )}
                  {campaign.min_level > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <strong style={{ color: T.txt }}>Min Level:</strong> {campaign.min_level}
                    </div>
                  )}
                  {campaign.min_votes_per_reel > 0 && (
                    <div>
                      <strong style={{ color: T.txt }}>Min Votes Required:</strong> {campaign.min_votes_per_reel}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Upload or Record Options */}
            <div style={{
              display: 'flex',
              gap: 12,
              marginBottom: 20,
            }}>
              <button
                onClick={() => document.getElementById('campaign-file-upload').click()}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  background: T.cardBg || '#fff',
                  border: `2px solid ${T.border}`,
                  borderRadius: 12,
                  color: T.txt,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Upload size={18} />
                Upload File
              </button>
              <button
                onClick={startCamera}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  background: T.cardBg || '#fff',
                  border: `2px solid ${T.border}`,
                  borderRadius: 12,
                  color: T.txt,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Video size={18} />
                Record Video
              </button>
            </div>
            
            {/* Camera or File Upload Area */}
            <div style={{
              marginBottom: 20,
              padding: 24,
              border: `2px dashed ${T.border}`,
              borderRadius: 12,
              textAlign: 'center',
              background: newReelFile ? `${T.green}10` : T.bg,
              position: 'relative',
              minHeight: 200,
            }}
            >
              {showCamera && stream ? (
                <div style={{ position: 'relative', width: '100%', height: '300px' }}>
                  <video
                    ref={(videoEl) => {
                      if (videoEl && stream) {
                        videoEl.srcObject = stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      background: '#000',
                      borderRadius: 8,
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    Recording...
                  </div>
                </div>
              ) : newReelFile ? (
                <div>
                  <Check size={48} color={T.green} style={{ marginBottom: 12 }} />
                  <p style={{ margin: 0, color: T.txt, fontWeight: 600 }}>
                    {newReelFile.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: T.sub, marginTop: 4 }}>
                    Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <Upload size={48} color={T.sub} style={{ marginBottom: 12 }} />
                  <p style={{ margin: 0, color: T.txt, fontWeight: 600, marginBottom: 4 }}>
                    Click to upload photo or video
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: T.sub }}>
                    MP4, MOV, JPG, PNG up to 100MB
                  </p>
                </div>
              )}
              <input
                id="campaign-file-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: T.txt,
                marginBottom: 8,
              }}>
                Caption {campaign?.required_hashtags ? '(Include required hashtags)' : '(optional)'}
              </label>
              <textarea
                value={newReelCaption}
                onChange={(e) => setNewReelCaption(e.target.value)}
                placeholder={campaign?.required_hashtags ? `Add caption with: ${campaign.required_hashtags}` : "Add a caption for your entry..."}
                rows={3}
                style={{
                  width: '100%',
                  padding: 12,
                  border: `2px solid ${T.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              {campaign?.required_hashtags && (
                <div style={{
                  fontSize: 12,
                  color: T.sub,
                  marginTop: 6,
                }}>
                  💡 Tip: Copy and paste: {campaign.required_hashtags}
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.sub }}>
            Loading your reels...
          </div>
        ) : userReels.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            background: T.bg,
            borderRadius: 12,
          }}>
            <Video size={48} color={T.sub} style={{ marginBottom: 16 }} />
            <p style={{ margin: 0, color: T.sub, marginBottom: 20 }}>
              You don't have any reels yet. Create one first!
            </p>
            <button
              onClick={() => {
                onClose();
                // Navigate to create post - will be handled by parent component
                window.dispatchEvent(new CustomEvent('navigateToCreatePost'));
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #DA9B2A, #F97316)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(218,155,42,0.4)',
              }}
            >
              🎬 Create Reel Now
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}>
            {userReels.map(reel => (
              <div
                key={reel.id}
                onClick={() => setSelectedReel(reel.id)}
                style={{
                  position: 'relative',
                  aspectRatio: '9/16',
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedReel === reel.id ? `3px solid ${T.pri}` : `1px solid ${T.border}`,
                }}
              >
                {reel.image ? (
                  <img
                    src={mediaUrl(reel.image)}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: T.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Video size={32} color={T.sub} />
                  </div>
                )}
                {selectedReel === reel.id && (
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: T.pri,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Check size={16} color="#fff" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: 12,
          paddingTop: 24,
          borderTop: `1px solid ${T.border}`,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 14,
              background: '#fff',
              border: `2px solid ${T.border}`,
              borderRadius: 8,
              color: T.txt,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={(showCreateNew ? !newReelFile : !selectedReel) || submitting}
            style={{
              flex: 1,
              padding: 14,
              background: ((showCreateNew ? newReelFile : selectedReel) && !submitting) ? T.pri : T.sub + '30',
              border: 'none',
              borderRadius: 8,
              color: ((showCreateNew ? newReelFile : selectedReel) && !submitting) ? '#fff' : T.sub,
              fontSize: 15,
              fontWeight: 600,
              cursor: ((showCreateNew ? newReelFile : selectedReel) && !submitting) ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Submitting...' : showCreateNew ? '🚀 Create & Submit' : 'Submit Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
