import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, MoreVertical } from 'lucide-react';
import api from '../api';
import config from '../config';
import { useLegacyT } from '../contexts/ThemeContext';

export function VideoDetailPage({ reelId, onBack, onShowProfile, user }) {
  const T = useLegacyT();
  const [reel, setReel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    loadReel();
  }, [reelId]);

  const loadReel = async () => {
    try {
      setLoading(true);
      const data = await api.request(`/reels/${reelId}/`);
      setReel(data);
      setLiked(data.is_liked || false);
      setSaved(data.is_saved || false);
      setLikesCount(data.votes || 0);
      
      // Load comments
      const commentsData = await api.request(`/reels/${reelId}/comments/`);
      setComments(Array.isArray(commentsData) ? commentsData : commentsData.results || []);
    } catch (err) {
      console.error('Failed to load reel:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      await api.request(`/reels/${reelId}/vote/`, { method: 'POST' });
      setLiked(!liked);
      setLikesCount(prev => liked ? prev - 1 : prev + 1);
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      if (saved) {
        await api.request(`/saved/${reelId}/`, { method: 'DELETE' });
      } else {
        await api.request('/saved/', {
          method: 'POST',
          body: JSON.stringify({ reel: reelId }),
        });
      }
      setSaved(!saved);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${reelId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    try {
      const comment = await api.request(`/reels/${reelId}/comments/`, {
        method: 'POST',
        body: JSON.stringify({ text: newComment }),
      });
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#000', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000,
      }}>
        <div style={{ color: '#fff', fontSize: 16 }}>Loading...</div>
      </div>
    );
  }

  if (!reel) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#000', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}>
        <div style={{ color: '#fff', fontSize: 16, marginBottom: 20 }}>Post not found</div>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px', background: T.pri, color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const mediaUrl = reel.media || reel.image;
  const fullUrl = mediaUrl?.startsWith('http') ? mediaUrl : `${config.API_BASE_URL.replace('/api', '')}${mediaUrl}`;
  const isVideo = (reel.media || '').match(/\.(mp4|webm|ogg|mov)$/i) || (reel.media || '').includes('video');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#000', zIndex: 1000, display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center',
        gap: 12, background: 'rgba(0,0,0,0.5)', position: 'absolute',
        top: 0, left: 0, right: 0, zIndex: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, display: 'flex', alignItems: 'center',
          }}
        >
          <ArrowLeft size={24} color="#fff" />
        </button>
        <div
          onClick={() => onShowProfile?.(reel.user.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', flex: 1,
          }}
        >
          <img
            src={reel.user.profile_photo || '/default-avatar.png'}
            alt={reel.user.username}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              objectFit: 'cover', border: '2px solid #fff',
            }}
          />
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>
            {reel.user.username}
          </div>
        </div>
      </div>

      {/* Media */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', position: 'relative',
      }}>
        {isVideo ? (
          <video
            ref={videoRef}
            src={fullUrl}
            style={{
              width: '100%', height: '100%', objectFit: 'contain',
            }}
            controls
            autoPlay
            loop
          />
        ) : (
          <img
            src={fullUrl}
            alt="Post"
            style={{
              width: '100%', height: '100%', objectFit: 'contain',
            }}
          />
        )}

        {/* Action Buttons */}
        <div style={{
          position: 'absolute', right: 12, bottom: 80,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleLike}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4,
              }}
            >
              <Heart
                size={32}
                color={liked ? '#EF4444' : '#fff'}
                fill={liked ? '#EF4444' : 'none'}
              />
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                {likesCount}
              </div>
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setShowComments(!showComments)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4,
              }}
            >
              <MessageCircle size={32} color="#fff" />
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                {comments.length}
              </div>
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleSave}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0,
              }}
            >
              <Bookmark
                size={32}
                color={saved ? T.pri : '#fff'}
                fill={saved ? T.pri : 'none'}
              />
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleShare}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0,
              }}
            >
              <Share2 size={32} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* Caption */}
      {reel.caption && (
        <div style={{
          padding: '12px 16px', background: 'rgba(0,0,0,0.7)',
          color: '#fff', fontSize: 14, lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 600 }}>{reel.user.username}</span> {reel.caption}
        </div>
      )}

      {/* Comments Panel */}
      {showComments && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTopLeftRadius: 20,
          borderTopRightRadius: 20, maxHeight: '60%',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.txt }}>
              Comments ({comments.length})
            </div>
            <button
              onClick={() => setShowComments(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 24, color: T.sub,
              }}
            >
              ×
            </button>
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px 20px',
          }}>
            {comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  marginBottom: 16, display: 'flex', gap: 12,
                }}
              >
                <img
                  src={comment.user.profile_photo || '/default-avatar.png'}
                  alt={comment.user.username}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.txt }}>
                    {comment.user.username}
                  </div>
                  <div style={{ fontSize: 14, color: T.txt, marginTop: 4 }}>
                    {comment.text}
                  </div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {user && (
            <div style={{
              padding: '12px 20px', borderTop: `1px solid ${T.border}`,
              display: 'flex', gap: 12,
            }}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add a comment..."
                style={{
                  flex: 1, padding: '10px 14px', fontSize: 14,
                  border: `1px solid ${T.border}`, borderRadius: 20,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                style={{
                  padding: '10px 20px', background: T.pri,
                  color: '#fff', border: 'none', borderRadius: 20,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  opacity: newComment.trim() ? 1 : 0.5,
                }}
              >
                Post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
