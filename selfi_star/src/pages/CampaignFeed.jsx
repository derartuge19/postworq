import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import config from '../config';
import { ArrowLeft, Heart, MessageCircle, Award, TrendingUp, Clock, Star, Trophy } from 'lucide-react';

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

const PRI = '#DA9B2A';
const PRI_LIGHT = '#DA9B2A18';
const BORDER = '#E7E5E4';
const TXT = '#1C1917';
const SUB = '#78716C';
const BG = '#FAFAF9';
const RED = '#EF4444';

const RANK_STYLES = {
  1: { bg: '#FFD70020', border: '#FFD700', text: '#B8860B', label: '🥇 #1' },
  2: { bg: '#C0C0C020', border: '#C0C0C0', text: '#808080', label: '🥈 #2' },
  3: { bg: '#CD7F3220', border: '#CD7F32', text: '#8B4513', label: '🥉 #3' },
};

const CampaignFeed = ({ campaignId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const engagementTimer = useRef(null);

  useEffect(() => { loadData(); }, [campaignId, filter]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [campaignRes, feedRes] = await Promise.all([
        api.request(`/campaigns/${campaignId}/`, { noCache: true }),
        api.request(`/campaigns/${campaignId}/feed/?filter=${filter}`, { noCache: true })
      ]);
      setCampaign(campaignRes);
      setPosts(feedRes.posts || []);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (post) => {
    const reelId = post.reel?.id;
    if (!reelId) return;

    const wasLiked = post.engagement?.user_liked ?? false;
    const prevLikes = post.engagement?.likes ?? 0;

    // Optimistic update — instant UI response
    setPosts(prev => prev.map(p =>
      p.id === post.id
        ? { ...p, engagement: { ...p.engagement, user_liked: !wasLiked, likes: wasLiked ? prevLikes - 1 : prevLikes + 1 } }
        : p
    ));

    try {
      // 1. Toggle like on the reel (syncs with profile vote count everywhere)
      await api.request(`/reels/${reelId}/vote/`, { method: 'POST' });

      // 2. Debounce engagement score refresh (avoids hammering on rapid clicks)
      clearTimeout(engagementTimer.current);
      engagementTimer.current = setTimeout(async () => {
        try {
          // Update engagement_score → total_score on all posts in campaign
          await api.request(`/campaigns/${campaignId}/engagement/update/`, { method: 'POST' });
          // Re-fetch feed to get updated scores + re-ordered ranking
          loadData(true);
        } catch (e) {
          console.error('Engagement sync error:', e);
        }
      }, 1200);
    } catch (error) {
      // Revert optimistic update on failure
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, engagement: { ...p.engagement, user_liked: wasLiked, likes: prevLikes } }
          : p
      ));
      console.error('Vote error:', error);
    }
  };

  const FILTERS = [
    { id: 'all', label: 'All Posts', icon: <TrendingUp size={14} /> },
    { id: 'top', label: 'Top Scored', icon: <Star size={14} /> },
    { id: 'recent', label: 'Recent', icon: <Clock size={14} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        borderBottom: `1px solid ${BORDER}`,
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <button
            onClick={() => onBack?.()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: SUB, fontSize: 14, fontWeight: 600, padding: '4px 0',
              marginBottom: 10,
            }}
          >
            <ArrowLeft size={16} />
            Back to Campaign
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TXT }}>{campaign?.title}</h1>
              <p style={{ margin: 0, fontSize: 13, color: SUB }}>Campaign Feed · {posts.length} entries</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 14px',
                    background: filter === f.id ? PRI : '#fff',
                    color: filter === f.id ? '#fff' : SUB,
                    border: `1.5px solid ${filter === f.id ? PRI : BORDER}`,
                    borderRadius: 20, cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.icon}{f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: SUB }}>
            <div style={{ fontSize: 15 }}>Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: 14, padding: '48px 24px',
            textAlign: 'center', border: `1px solid ${BORDER}`,
          }}>
            <Award size={44} color={PRI} style={{ marginBottom: 16, opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: TXT }}>No Posts Yet</h3>
            <p style={{ margin: 0, color: SUB, fontSize: 14 }}>Be the first to participate!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {posts.map((post, idx) => (
              <PostCard key={post.id} post={post} rank={idx + 1} onVote={handleVote} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PostCard = ({ post, rank, onVote }) => {
  const [showScores, setShowScores] = useState(false);

  const totalScore = post.scores?.total ?? post.total_score ?? 0;
  const likes = post.engagement?.likes ?? post.votes_count ?? 0;
  const comments = post.engagement?.comments ?? post.comments_count ?? 0;
  const userLiked = post.engagement?.user_liked ?? post.has_voted ?? false;
  const createdAt = post.reel?.created_at ?? post.created_at;
  const scores = post.scores ?? {
    creativity: post.creativity_score,
    engagement: post.engagement_score,
    quality: post.quality_score,
    theme_relevance: post.theme_relevance_score,
  };
  const rankStyle = RANK_STYLES[rank];

  return (
    <div style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      border: `1.5px solid ${rankStyle ? rankStyle.border : BORDER}`,
      boxShadow: rankStyle ? `0 2px 12px ${rankStyle.border}30` : '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* User Row */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: `linear-gradient(135deg, ${PRI}, #F59E0B)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0,
        }}>
          {post.user?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TXT }}>{post.user?.username}</div>
          {createdAt && (
            <div style={{ fontSize: 12, color: SUB }}>
              {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {rankStyle && (
            <div style={{
              background: rankStyle.bg, color: rankStyle.text,
              border: `1px solid ${rankStyle.border}`,
              padding: '4px 10px', borderRadius: 20,
              fontSize: 12, fontWeight: 700,
            }}>
              {rankStyle.label}
            </div>
          )}
          {!rankStyle && rank && (
            <div style={{
              background: BG, color: SUB,
              border: `1px solid ${BORDER}`,
              padding: '4px 10px', borderRadius: 20,
              fontSize: 12, fontWeight: 600,
            }}>
              #{rank}
            </div>
          )}
          {totalScore > 0 && (
            <div style={{
              background: PRI_LIGHT, color: PRI,
              border: `1px solid ${PRI}40`,
              padding: '5px 12px', borderRadius: 20,
              fontSize: 13, fontWeight: 700,
            }}>
              {Number(totalScore).toFixed(1)} pts
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      {(post.reel?.image || post.reel?.media) && (
        <div style={{ background: '#000', maxHeight: 480, overflow: 'hidden' }}>
          {post.reel?.media ? (
            <video
              src={mediaUrl(post.reel.media)}
              controls
              playsInline
              style={{ width: '100%', display: 'block', maxHeight: 480 }}
            />
          ) : post.reel?.image ? (
            <img
              src={mediaUrl(post.reel.image)}
              alt=""
              style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 480 }}
            />
          ) : null}
        </div>
      )}

      {/* Caption */}
      {post.reel?.caption && (
        <div style={{ padding: '12px 16px' }}>
          <p style={{ margin: 0, fontSize: 14, color: TXT, lineHeight: 1.55 }}>{post.reel.caption}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: '10px 16px', borderTop: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button
          onClick={() => onVote(post)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: userLiked ? `${RED}12` : 'transparent',
            border: `1.5px solid ${userLiked ? RED : BORDER}`,
            borderRadius: 20, padding: '5px 12px',
            cursor: 'pointer', fontSize: 14, fontWeight: 700,
            color: userLiked ? RED : SUB,
            transition: 'all 0.18s ease',
          }}
        >
          <Heart size={16} fill={userLiked ? RED : 'none'} color={userLiked ? RED : SUB} />
          {likes}
        </button>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: 'none', cursor: 'default',
          fontSize: 14, fontWeight: 600, color: SUB,
        }}>
          <MessageCircle size={18} />
          {comments}
        </button>
        {totalScore > 0 && (
          <button
            onClick={() => setShowScores(!showScores)}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: PRI,
            }}
          >
            <Award size={16} />
            {showScores ? 'Hide' : 'View'} Scores
          </button>
        )}
      </div>

      {/* Score Breakdown */}
      {showScores && totalScore > 0 && (
        <div style={{ padding: '14px 16px', background: BG, borderTop: `1px solid ${BORDER}` }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: TXT }}>Score Breakdown</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {scores.creativity > 0 && <ScoreBar label="Creativity" score={scores.creativity} max={30} />}
            {scores.engagement > 0 && <ScoreBar label="Engagement" score={scores.engagement} max={25} />}
            {scores.quality > 0 && <ScoreBar label="Quality" score={scores.quality} max={15} />}
            {scores.theme_relevance > 0 && <ScoreBar label="Theme Relevance" score={scores.theme_relevance} max={10} />}
          </div>
        </div>
      )}
    </div>
  );
};

const ScoreBar = ({ label, score, max }) => {
  const pct = Math.round((score / max) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
        <span style={{ color: SUB, fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700, color: PRI }}>{score}/{max}</span>
      </div>
      <div style={{ height: 6, background: BORDER, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: PRI, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
};

export default CampaignFeed;
