import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Heart, MessageCircle, Share2, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import config from '../config';
import { getRelativeTime } from '../utils/timeUtils';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// TikTok-style scrollable post detail for ProfilePage
export function TikTokPostViewer({ posts, initialIndex, user, profileUser, onClose, onDeletePost, onEditPost, isOwnProfile, onNavigate }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const currentPost = posts[currentIndex];
  const hasNext = currentIndex < posts.length - 1;
  const hasPrev = currentIndex > 0;

  // Auto-play video when changing posts
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [currentIndex, isPlaying]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, posts.length]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex(prev => prev + 1);
      onNavigate?.(currentIndex + 1);
    }
  }, [hasNext, currentIndex, onNavigate]);

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      setCurrentIndex(prev => prev - 1);
      onNavigate?.(currentIndex - 1);
    }
  }, [hasPrev, currentIndex, onNavigate]);

  // Touch/swipe handling
  const touchStartY = useRef(0);
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  // Wheel/scroll handling
  const wheelTimeout = useRef(null);
  const handleWheel = (e) => {
    e.preventDefault();
    if (wheelTimeout.current) return;
    
    wheelTimeout.current = setTimeout(() => {
      wheelTimeout.current = null;
    }, 300);

    if (e.deltaY > 0) goToNext();
    else goToPrev();
  };

  const mediaUrl = currentPost?.media || currentPost?.image || '';
  const fullUrl = mediaUrl.startsWith('http') ? mediaUrl : `${config.API_BASE_URL.replace('/api', '')}${mediaUrl}`;
  const isVideo = mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) || mediaUrl.includes('video');
  const videoUrl = (fullUrl.includes('cloudinary') && !fullUrl.match(/\.(mp4|webm|ogg|mov)$/i))
    ? fullUrl + '.mp4'
    : fullUrl;

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  if (!currentPost) return null;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#000',
        zIndex: 1000,
        display: 'flex',
        overflow: 'hidden',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 100,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          backdropFilter: 'blur(10px)',
        }}
      >
        <X size={24} />
      </button>

      {/* Navigation Arrows (Desktop) */}
      {hasPrev && (
        <button
          onClick={goToPrev}
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            backdropFilter: 'blur(10px)',
          }}
        >
          <ChevronLeft size={28} />
        </button>
      )}
      {hasNext && (
        <button
          onClick={goToNext}
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            backdropFilter: 'blur(10px)',
          }}
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Progress Indicator */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 100,
        background: 'rgba(0,0,0,0.6)',
        padding: '8px 16px',
        borderRadius: 20,
        color: '#fff',
        fontSize: 14,
        fontWeight: 600,
      }}>
        {currentIndex + 1} / {posts.length}
      </div>

      {/* Main Content - Video/Image */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: isVideo ? 'pointer' : 'default',
        }}
        onClick={isVideo ? handleVideoClick : undefined}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={videoUrl}
            style={{
              maxWidth: '100%',
              maxHeight: '100vh',
              objectFit: 'contain',
            }}
            autoPlay
            loop
            playsInline
            muted={false}
          />
        ) : (
          <img
            src={fullUrl}
            alt={currentPost.caption}
            style={{
              maxWidth: '100%',
              maxHeight: '100vh',
              objectFit: 'contain',
            }}
          />
        )}

        {/* Pause indicator */}
        {isVideo && !isPlaying && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 0,
              height: 0,
              borderTop: '15px solid transparent',
              borderBottom: '15px solid transparent',
              borderLeft: '25px solid #fff',
              marginLeft: 5,
            }} />
          </div>
        )}
      </div>

      {/* Right Side Info Panel */}
      <div style={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        left: 0,
        padding: '20px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        color: '#fff',
        zIndex: 50,
      }}>
        {/* User Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}>
          {profileUser?.profile_photo ? (
            <img
              src={profileUser.profile_photo.startsWith('http') ? profileUser.profile_photo : `${config.API_BASE_URL.replace('/api', '')}${profileUser.profile_photo}`}
              alt="Profile"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #fff',
              }}
            />
          ) : (
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              border: '2px solid #fff',
            }}>
              👤
            </div>
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              @{profileUser?.username}
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {getRelativeTime(new Date(currentPost.created_at || currentPost.timestamp))}
            </div>
          </div>
        </div>

        {/* Caption */}
        {currentPost.caption && (
          <div style={{
            fontSize: 15,
            lineHeight: 1.5,
            marginBottom: 16,
            maxHeight: 80,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {currentPost.caption}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 24,
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Heart size={24} fill="#fff" color="#fff" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{currentPost.votes || 0}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={24} color="#fff" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{currentPost.comments_count || 0}</span>
          </div>
          
          {/* Edit/Delete for own profile */}
          {isOwnProfile && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPost?.(currentPost.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>✏️ Edit</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this post?')) {
                    onDeletePost?.(currentPost.id);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>🗑️ Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Swipe hint for mobile */}
      <div style={{
        position: 'absolute',
        bottom: 100,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        background: 'rgba(0,0,0,0.5)',
        padding: '8px 16px',
        borderRadius: 20,
        color: '#fff',
        fontSize: 13,
        display: window.innerWidth <= 768 ? 'flex' : 'none',
        alignItems: 'center',
        gap: 8,
        animation: 'fadeOut 3s forwards',
      }}>
        👆 Swipe to navigate
      </div>
    </div>
  );
}
