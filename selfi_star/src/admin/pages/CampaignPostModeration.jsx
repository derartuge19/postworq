import React, { useState, useEffect } from 'react';
import api from '../../api';
import { ArrowLeft, CheckCircle, XCircle, Star, Eye } from 'lucide-react';

const CampaignPostModeration = ({ campaignId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignRes, postsRes] = await Promise.all([
        api.request(`/campaigns/${campaignId}/`),
        api.request(`/admin/campaigns/${campaignId}/posts/pending/`)
      ]);
      setCampaign(campaignRes);
      setPosts(postsRes.posts || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (scoreId, action, scores = {}) => {
    try {
      await api.request(`/admin/campaigns/posts/${scoreId}/moderate/`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          ...scores
        })
      });
      alert(`Post ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setSelectedPost(null);
      loadData();
    } catch (error) {
      console.error('Error moderating post:', error);
      alert('Failed to moderate post');
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
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
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
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Post Moderation
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          {campaign?.title} - {posts.length} pending posts
        </p>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <CheckCircle size={48} color="#4CAF50" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#666' }}>All Caught Up!</h3>
          <p style={{ color: '#999' }}>No posts pending moderation</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onClick={() => setSelectedPost(post)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Media */}
              <div style={{ position: 'relative', paddingTop: '100%', background: '#f0f0f0' }}>
                {post.reel?.image && (
                  <img
                    src={post.reel.image}
                    alt="Post"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                )}
                {post.reel?.media && (
                  <video
                    src={post.reel.media}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                )}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Eye size={14} />
                  Review
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#2196f3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {post.user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>
                      {post.user?.username}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {post.reel?.caption && (
                  <p style={{
                    fontSize: '14px',
                    color: '#666',
                    marginTop: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {post.reel.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Moderation Modal */}
      {selectedPost && (
        <ModerationModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onModerate={handleModerate}
        />
      )}
    </div>
  );
};

const ModerationModal = ({ post, onClose, onModerate }) => {
  const [action, setAction] = useState('approve');
  const [scores, setScores] = useState({
    creativity_score: 20,
    quality_score: 10,
    theme_relevance_score: 5
  });

  const handleSubmit = () => {
    if (action === 'approve') {
      onModerate(post.id, 'approve', scores);
    } else {
      onModerate(post.id, 'reject');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0'
      }}>
        {/* Left: Media */}
        <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {post.reel?.image && (
            <img
              src={post.reel.image}
              alt="Post"
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
            />
          )}
          {post.reel?.media && (
            <video
              src={post.reel.media}
              controls
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
            />
          )}
        </div>

        {/* Right: Moderation Form */}
        <div style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
            Moderate Post
          </h2>

          {/* User Info */}
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#2196f3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                {post.user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '16px' }}>
                  {post.user?.username}
                </div>
                <div style={{ fontSize: '14px', color: '#999' }}>
                  {new Date(post.created_at).toLocaleString()}
                </div>
              </div>
            </div>
            {post.reel?.caption && (
              <p style={{ fontSize: '14px', color: '#666' }}>
                {post.reel.caption}
              </p>
            )}
          </div>

          {/* Action Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
              Decision
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setAction('approve')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: action === 'approve' ? '#4CAF50' : '#f0f0f0',
                  color: action === 'approve' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle size={18} />
                Approve
              </button>
              <button
                onClick={() => setAction('reject')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: action === 'reject' ? '#f44336' : '#f0f0f0',
                  color: action === 'reject' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <XCircle size={18} />
                Reject
              </button>
            </div>
          </div>

          {/* Scoring (only if approving) */}
          {action === 'approve' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
                Initial Scores
              </label>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px' }}>Creativity (0-30)</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{scores.creativity_score}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={scores.creativity_score}
                  onChange={(e) => setScores({ ...scores, creativity_score: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px' }}>Quality (0-15)</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{scores.quality_score}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={scores.quality_score}
                  onChange={(e) => setScores({ ...scores, quality_score: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px' }}>Theme Relevance (0-10)</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{scores.theme_relevance_score}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={scores.theme_relevance_score}
                  onChange={(e) => setScores({ ...scores, theme_relevance_score: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{
                background: '#f5f5f5',
                padding: '12px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: '600' }}>Initial Total:</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196f3' }}>
                  {scores.creativity_score + scores.quality_score + scores.theme_relevance_score}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                Engagement and consistency scores will be calculated automatically
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
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
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: '12px',
                background: action === 'approve' ? '#4CAF50' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {action === 'approve' ? 'Approve Post' : 'Reject Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignPostModeration;
