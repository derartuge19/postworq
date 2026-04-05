import React, { useState, useEffect } from 'react';
import api from '../api';
import { ArrowLeft, Heart, MessageCircle, Share2, Award, Filter } from 'lucide-react';

const CampaignFeed = ({ campaignId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [campaignId, filter]);

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
      await api.request(`/campaigns/entries/${entryId}/vote/`, {
        method: 'POST'
      });
      loadData();
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote');
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '16px 20px',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button
          onClick={() => onBack?.()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          <ArrowLeft size={20} />
          <span style={{ fontWeight: '500' }}>Back</span>
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
          {campaign?.title} Feed
        </h1>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {['all', 'top', 'recent'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                background: filter === f ? '#2196f3' : '#f0f0f0',
                color: filter === f ? 'white' : '#666',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      <div style={{ padding: '20px' }}>
        {posts.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <Award size={48} color="#ccc" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>
              No Posts Yet
            </h3>
            <p style={{ color: '#999', fontSize: '14px' }}>
              Be the first to participate in this campaign!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onVote={handleVote}
              />
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
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* User Header */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#2196f3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          {post.user?.username?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', fontSize: '15px' }}>
            {post.user?.username}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>
        {post.total_score > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {post.total_score} pts
          </div>
        )}
      </div>

      {/* Media */}
      <div style={{ position: 'relative', background: '#000' }}>
        {post.reel?.image && (
          <img
            src={post.reel.image}
            alt="Post"
            style={{ width: '100%', display: 'block' }}
          />
        )}
        {post.reel?.media && (
          <video
            src={post.reel.media}
            controls
            style={{ width: '100%', display: 'block' }}
          />
        )}
      </div>

      {/* Caption */}
      {post.reel?.caption && (
        <div style={{ padding: '16px' }}>
          <p style={{ fontSize: '14px', color: '#333', lineHeight: '1.5' }}>
            {post.reel.caption}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <button
          onClick={() => onVote(post.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: post.has_voted ? '#f44336' : '#666'
          }}
        >
          <Heart size={20} fill={post.has_voted ? '#f44336' : 'none'} />
          {post.votes_count || 0}
        </button>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#666'
          }}
        >
          <MessageCircle size={20} />
          {post.comments_count || 0}
        </button>
        <button
          onClick={() => setShowScores(!showScores)}
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#2196f3',
            fontWeight: '500'
          }}
        >
          <Award size={18} />
          {showScores ? 'Hide' : 'Show'} Scores
        </button>
      </div>

      {/* Score Breakdown */}
      {showScores && post.total_score > 0 && (
        <div style={{
          padding: '16px',
          background: '#f9f9f9',
          borderTop: '1px solid #f0f0f0'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            Score Breakdown
          </h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            {post.creativity_score > 0 && (
              <ScoreBar label="Creativity" score={post.creativity_score} max={30} color="#9c27b0" />
            )}
            {post.engagement_score > 0 && (
              <ScoreBar label="Engagement" score={post.engagement_score} max={25} color="#2196f3" />
            )}
            {post.consistency_score > 0 && (
              <ScoreBar label="Consistency" score={post.consistency_score} max={20} color="#4caf50" />
            )}
            {post.quality_score > 0 && (
              <ScoreBar label="Quality" score={post.quality_score} max={15} color="#ff9800" />
            )}
            {post.theme_relevance_score > 0 && (
              <ScoreBar label="Theme" score={post.theme_relevance_score} max={10} color="#f44336" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ScoreBar = ({ label, score, max, color }) => {
  const percentage = (score / max) * 100;
  
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
        fontSize: '12px'
      }}>
        <span style={{ color: '#666' }}>{label}</span>
        <span style={{ fontWeight: '600', color }}>{score}/{max}</span>
      </div>
      <div style={{
        height: '6px',
        background: '#e0e0e0',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
};

export default CampaignFeed;
