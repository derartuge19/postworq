import React, { useState, useEffect } from 'react';
import api from '../api';
import { ArrowLeft, Heart, MessageCircle, Award, TrendingUp, Clock, Star } from 'lucide-react';

const PRI = '#DA9B2A';
const PRI_LIGHT = '#DA9B2A18';
const BORDER = '#E7E5E4';
const TXT = '#1C1917';
const SUB = '#78716C';
const BG = '#FAFAF9';

const CampaignFeed = ({ campaignId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadData(); }, [campaignId, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignRes, feedRes] = await Promise.all([
        api.request(`/campaigns/${campaignId}/`),
        api.request(`/campaigns/${campaignId}/feed/?filter=${filter}`)
      ]);
      setCampaign(campaignRes);
      setPosts(feedRes.posts || []);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (entryId) => {
    try {
      await api.request(`/campaigns/entries/${entryId}/vote/`, { method: 'POST' });
      loadData();
    } catch (error) {
      console.error('Error voting:', error);
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
            {posts.map(post => (
              <PostCard key={post.id} post={post} onVote={handleVote} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PostCard = ({ post, onVote }) => {
  const [showScores, setShowScores] = useState(false);

  return (
    <div style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      border: `1px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
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
          <div style={{ fontSize: 12, color: SUB }}>
            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        {post.total_score > 0 && (
          <div style={{
            background: PRI_LIGHT, color: PRI,
            border: `1px solid ${PRI}40`,
            padding: '5px 12px', borderRadius: 20,
            fontSize: 13, fontWeight: 700,
          }}>
            {post.total_score} pts
          </div>
        )}
      </div>

      {/* Media */}
      {(post.reel?.image || post.reel?.media) && (
        <div style={{ background: '#000', maxHeight: 480, overflow: 'hidden' }}>
          {post.reel?.image && (
            <img src={post.reel.image} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
          )}
          {post.reel?.media && !post.reel?.image && (
            <video src={post.reel.media} controls style={{ width: '100%', display: 'block' }} />
          )}
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
          onClick={() => onVote(post.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            color: post.has_voted ? '#EF4444' : SUB,
          }}
        >
          <Heart size={18} fill={post.has_voted ? '#EF4444' : 'none'} color={post.has_voted ? '#EF4444' : SUB} />
          {post.votes_count || 0}
        </button>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: 'none', cursor: 'default',
          fontSize: 14, fontWeight: 600, color: SUB,
        }}>
          <MessageCircle size={18} />
          {post.comments_count || 0}
        </button>
        {post.total_score > 0 && (
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
      {showScores && post.total_score > 0 && (
        <div style={{ padding: '14px 16px', background: BG, borderTop: `1px solid ${BORDER}` }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: TXT }}>Score Breakdown</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {post.creativity_score > 0 && <ScoreBar label="Creativity" score={post.creativity_score} max={30} />}
            {post.engagement_score > 0 && <ScoreBar label="Engagement" score={post.engagement_score} max={25} />}
            {post.consistency_score > 0 && <ScoreBar label="Consistency" score={post.consistency_score} max={20} />}
            {post.quality_score > 0 && <ScoreBar label="Quality" score={post.quality_score} max={15} />}
            {post.theme_relevance_score > 0 && <ScoreBar label="Theme Relevance" score={post.theme_relevance_score} max={10} />}
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
