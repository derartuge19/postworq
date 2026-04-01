import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Flag,
  Info,
  UserPlus,
  UserCheck,
  Volume,
  VolumeX,
  Bell,
} from 'lucide-react';
import api from '../api';
import config from '../config';
import { ModernCommentSection } from './ModernCommentSection';
import { WinnersSection } from './WinnersSection';
import { LikeButton } from './LikeButton';
import { SearchBar } from './SearchBar';
import { UserSuggestions } from './UserSuggestions';
import { AlertModal } from './AlertModal';
import { getRelativeTime } from '../utils/timeUtils';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import './TikTokLayout.css';

export function TikTokLayout({
  user,
  activeTab: propActiveTab,
  onLogout,
  onRequireAuth,
  onShowPostPage,
  onShowProfile,
  onShowSettings,
  onShowCampaigns,
  onShowNotifications,
}) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();

  // Map external tab names to internal tab names
  const mapTabName = (tab) => {
    const tabMap = {
      home: 'foryou',
      search: 'search',
      explore: 'explore',
      reels: 'foryou',
      messages: 'inbox',
      notifications: 'notifications',
      following: 'following',
      bookmarks: 'bookmarks',
    };
    return tabMap[tab] || 'foryou';
  };

  const [activeTab, setActiveTab] = useState(
    mapTabName(propActiveTab) || 'foryou',
  );

  // Update internal state when prop changes
  useEffect(() => {
    if (propActiveTab) {
      setActiveTab(mapTabName(propActiveTab));
    }
  }, [propActiveTab]);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showMenu, setShowMenu] = useState(null);
  const [showReportModal, setShowReportModal] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [playingVideos, setPlayingVideos] = useState({});
  const [showPauseIcon, setShowPauseIcon] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false,
  });

  const videoRefs = useRef({});
  const videoContainerRefs = useRef({});

  // Mobile detection - runs once on mount and on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch videos based on active tab with pagination
  const fetchVideos = async (pageNum = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      let reelsData = [];
      const limit = 10; // Load 10 videos at a time
      const offset = (pageNum - 1) * limit;

      // Fetch different content based on active tab
      if (activeTab === 'following') {
        // Fetch reels from followed users
        reelsData = await api.request(`/reels/following/?limit=${limit}&offset=${offset}`);
      } else if (activeTab === 'bookmarks') {
        // Fetch saved/bookmarked reels
        reelsData = await api.request(`/reels/saved/?limit=${limit}&offset=${offset}`);
      } else if (activeTab === 'explore') {
        // Fetch trending/popular reels
        reelsData = await api.request(`/reels/trending/?limit=${limit}&offset=${offset}`);
      } else {
        // Default: fetch all reels (For You page)
        reelsData = await api.request(`/reels/?limit=${limit}&offset=${offset}`);
      }

      console.log('API response:', reelsData);

      // Handle different response formats (DRF pagination returns {count, next, previous, results})
      const reelsList = Array.isArray(reelsData)
        ? reelsData
        : reelsData.results || [];
      
      // Check if there are more videos to load using DRF pagination
      const hasMoreVideos = reelsData.next ? true : (reelsList.length === limit);
      setHasMore(hasMoreVideos);

      // Transform backend data to match frontend format
      const formattedVideos = reelsList.map((reel) => {
        const videoUrl = reel.media || reel.image;
        console.log('🎬 Processing reel:', {
          id: reel.id,
          user: reel.user?.username,
          media: reel.media,
          image: reel.image,
          finalUrl: videoUrl,
          isVideo:
            videoUrl &&
            (videoUrl.includes('.mp4') ||
              videoUrl.includes('.webm') ||
              videoUrl.includes('.ogg') ||
              videoUrl.includes('.mov')),
          caption: reel.caption,
        });

        return {
          id: reel.id,
          user: reel.user,
          creator: reel.user?.username || 'Unknown User',
          handle: `@${reel.user?.username || 'unknown'}`,
          avatar: '👤',
          caption: reel.caption,
          hashtags: reel.hashtags_list || [],
          likes: reel.votes || 0,
          comments: reel.comment_count || 0,
          shares: 0,
          imageUrl: reel.media || reel.image,
          liked: reel.is_liked || false,
          saved: reel.is_saved || false,
          created_at: reel.created_at,
        };
      });
      console.log('Formatted videos:', formattedVideos);
      
      if (append) {
        setVideos(prev => [...prev, ...formattedVideos]);
      } else {
        setVideos(formattedVideos);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // Don't use fallback data - show error instead
      if (!append) {
        setVideos([]);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Load more videos function
  const loadMoreVideos = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideos(nextPage, true);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchVideos(1, false);
  }, [activeTab]);

  // Scroll listener for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.video-feed-container');
      if (!scrollContainer) return;

      const scrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;

      // Load more when user is 300px from bottom
      if (scrollHeight - scrollTop - clientHeight < 300) {
        loadMoreVideos();
      }
    };

    const scrollContainer = document.querySelector('.video-feed-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [loadingMore, hasMore, page]);

  // IntersectionObserver to control video playback - only play visible video
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.7, // Video must be 70% visible to play
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        const videoId = entry.target.dataset.videoId;
        const videoElement = videoRefs.current[videoId];

        if (!videoElement) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          // Video is in view - play it
          videoElement
            .play()
            .catch((err) => console.log('Play prevented:', err));
          setPlayingVideos((prev) => ({ ...prev, [videoId]: true }));
        } else {
          // Video is out of view - pause it
          videoElement.pause();
          setPlayingVideos((prev) => ({ ...prev, [videoId]: false }));
        }
      });
    };

    const observer = new IntersectionObserver(
      handleIntersection,
      observerOptions,
    );

    // Observe all video containers
    Object.keys(videoContainerRefs.current).forEach((videoId) => {
      const container = videoContainerRefs.current[videoId];
      if (container) {
        observer.observe(container);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [videos]);

  const handleCommentPosted = (comment) => {
    // Update the comment count for the specific video
    setVideos((prev) =>
      prev.map((video) =>
        video.id === comment.reel
          ? { ...video, comments: video.comments + 1 }
          : video,
      ),
    );
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    // Update all video elements
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.muted = audioEnabled;
      }
    });
  };

  const toggleVideoPlayback = (videoId) => {
    const videoElement = videoRefs.current[videoId];
    if (!videoElement) return;

    if (!audioEnabled) {
      setAudioEnabled(true);
    }

    videoElement.muted = false;
    videoElement.volume = 1;

    if (videoElement.paused) {
      videoElement.play();
      setPlayingVideos((prev) => ({ ...prev, [videoId]: true }));
    } else {
      videoElement.pause();
      setPlayingVideos((prev) => ({ ...prev, [videoId]: false }));
    }

    // Show pause/play icon animation
    setShowPauseIcon((prev) => ({ ...prev, [videoId]: true }));
    setTimeout(() => {
      setShowPauseIcon((prev) => ({ ...prev, [videoId]: false }));
    }, 1000);
  };

  const handleLike = async (videoId) => {
    if (!user) {
      onRequireAuth();
      return;
    }

    try {
      const response = await api.request(`/reels/${videoId}/vote/`, {
        method: 'POST',
      });

      if (response.voted !== undefined) {
        setVideos((prev) =>
          prev.map((video) =>
            video.id === videoId
              ? {
                  ...video,
                  liked: response.voted,
                  likes: response.votes || video.likes,
                }
              : video,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to like video:', error);
    }
  };

  const handleSave = async (videoId) => {
    if (!user) {
      onRequireAuth();
      return;
    }

    try {
      const response = await api.request(`/reels/${videoId}/save/`, {
        method: 'POST',
      });

      if (response.saved !== undefined) {
        setVideos((prev) =>
          prev.map((video) =>
            video.id === videoId ? { ...video, saved: response.saved } : video,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to save video:', error);
    }
  };

  const handleFollow = async (userId) => {
    if (!user) {
      onRequireAuth();
      return;
    }

    try {
      const response = await api.request('/follows/toggle/', {
        method: 'POST',
        body: JSON.stringify({ following_id: userId }),
      });

      if (response.following !== undefined) {
        // Update the follow status in the videos
        setVideos((prev) =>
          prev.map((video) =>
            video.user?.id === userId
              ? {
                  ...video,
                  user: { ...video.user, is_following: response.following },
                }
              : video,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const submitReport = async (videoId, category) => {
    setShowReportModal(null);
    try {
      // Add report API call here when backend is ready
      console.log('Reported video:', videoId, 'Category:', category);
      setAlertModal({
        isOpen: true,
        title: 'Report Submitted',
        message: 'Thank you for your report. We will review it shortly.',
        type: 'success',
        onConfirm: null,
        showCancel: false,
      });
    } catch (error) {
      console.error('Failed to submit report:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to submit report. Please try again.',
        type: 'error',
        onConfirm: null,
        showCancel: false,
      });
    }
  };

  const handleNotInterested = (videoId) => {
    setShowMenu(null);
    // Remove video from feed
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    setAlertModal({
      isOpen: true,
      title: 'Video Removed',
      message: 'This video has been removed from your feed.',
      type: 'info',
      onConfirm: null,
      showCancel: false,
    });
  };

  const handleShowVideoInfo = (video) => {
    setShowMenu(null);
    setAlertModal({
      isOpen: true,
      title: 'Video Information',
      message: `Creator: ${video.creator}\nLikes: ${video.likes}\nComments: ${video.comments}\nPosted: ${getRelativeTime(video.created_at)}`,
      type: 'info',
      onConfirm: null,
      showCancel: false,
    });
  };

  const handleShare = (videoId) => {
    setShowMenu(null);
    const postUrl = `${window.location.origin}/post/${videoId}`;
    navigator.clipboard
      .writeText(postUrl)
      .then(() => {
        setAlertModal({
          isOpen: true,
          title: 'Link Copied',
          message: 'Video link has been copied to clipboard.',
          type: 'success',
          onConfirm: null,
          showCancel: false,
        });
      })
      .catch(() => {
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to copy link. Please try again.',
          type: 'error',
          onConfirm: null,
          showCancel: false,
        });
      });
  };

  const handleHashtagClick = async (hashtag) => {
    try {
      const response = await api.request(`/reels/hashtag/${hashtag}/`);
      const results = response.results || response || [];

      const formattedVideos = results.map((reel) => ({
        id: reel.id,
        user: reel.user,
        creator: reel.user?.username || 'Unknown User',
        handle: `@${reel.user?.username || 'unknown'}`,
        avatar: '👤',
        caption: reel.caption,
        hashtags: reel.hashtags_list || [],
        likes: reel.votes || 0,
        comments: reel.comment_count || 0,
        shares: 0,
        imageUrl: reel.media || reel.image,
        liked: reel.is_liked || false,
        saved: reel.is_saved || false,
        created_at: reel.created_at,
        activeTab,
      })); // Refetch when tab changes;
      setVideos(formattedVideos);
      setActiveTab(`hashtag-${hashtag}`);
    } catch (error) {
      console.error('Failed to search hashtag:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load hashtag posts. Please try again.',
        type: 'error',
        onConfirm: null,
        showCancel: false,
      });
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Expose fetchVideos function so it can be called from parent
  useEffect(() => {
    window.refreshFeed = fetchVideos;
  }, []);

  // Sample user suggestions data
  const userSuggestions = [
    {
      id: 1,
      name: 'John Doe',
      handle: '@johndoe',
      avatar: '👨',
      followers: '10.5K',
    },
    {
      id: 2,
      name: 'Jane Smith',
      handle: '@janesmith',
      avatar: '👩',
      followers: '25.2K',
    },
    {
      id: 3,
      name: 'Mike Johnson',
      handle: '@mikejohnson',
      avatar: '🧑',
      followers: '8.7K',
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      handle: '@sarahwilson',
      avatar: '👩',
      followers: '15.3K',
    },
    {
      id: 5,
      name: 'Fitness Coach',
      handle: '@fitnesscoachjohn',
      avatar: '💪',
      followers: '1.8M',
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* CENTER - Video Feed */}
      <div
        className="video-feed video-feed-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#fff',
        }}
      >
        {/* Feed Header */}
        <div
          style={{
            width: '100%',
            maxWidth: 600,
            padding: '0 20px',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#000',
            }}
          >
            {activeTab === 'foryou' && 'For You'}
            {activeTab === 'following' && 'Following'}
            {activeTab === 'inbox' && 'Messages'}
            {activeTab === 'bookmarks' && 'Saved'}
          </div>

          {/* Search Bar - Only on Explore Tab */}
          {activeTab === 'explore' && (
            <SearchBar
              onUserClick={(user) => {
                console.log('User clicked:', user);
              }}
              onPostClick={(post) => {
                console.log('Post clicked:', post);
              }}
            />
          )}
        </div>

        {/* Messages/Inbox Tab */}
        {activeTab === 'inbox' ? (
          <div style={{ width: '100%', maxWidth: 600, padding: '0 20px' }}>
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 60,
                textAlign: 'center',
                border: `1px solid ${T.border}`,
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 20 }}>💬</div>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: T.txt,
                  marginBottom: 8,
                }}
              >
                Messages Coming Soon
              </h3>
              <p style={{ fontSize: 14, color: T.sub, margin: 0 }}>
                Direct messaging feature will be available soon. Stay tuned!
              </p>
            </div>
          </div>
        ) : (
          <div
            className="video-list-container"
            style={{
              width: '100%',
              maxWidth: 600,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              padding: '0 20px',
            }}
          >
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 200,
                  color: '#000',
                }}
              >
                Loading videos...
              </div>
            ) : videos.length === 0 ? (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 60,
                  textAlign: 'center',
                  border: `1px solid ${T.border}`,
                }}
              >
                <div style={{ fontSize: 64, marginBottom: 20 }}>
                  {activeTab === 'following' && '👥'}
                  {activeTab === 'bookmarks' && '🔖'}
                  {activeTab === 'explore' && '🔍'}
                  {activeTab === 'foryou' && '🎬'}
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: T.txt,
                    marginBottom: 8,
                  }}
                >
                  {activeTab === 'following' &&
                    'No posts from followed users yet'}
                  {activeTab === 'bookmarks' && 'No saved posts yet'}
                  {activeTab === 'explore' && 'No trending posts'}
                  {activeTab === 'foryou' && 'No videos yet'}
                </h3>
                <p style={{ fontSize: 14, color: T.sub, margin: 0 }}>
                  {activeTab === 'following' &&
                    'Follow creators to see their posts here'}
                  {activeTab === 'bookmarks' && 'Save posts to see them here'}
                  {activeTab === 'explore' &&
                    'Check back soon for trending content'}
                  {activeTab === 'foryou' && 'Be the first to post!'}
                </p>
              </div>
            ) : (
              videos.map((video) => (
                <div
                  key={video.id}
                  className="video-card-snap"
                  style={{
                    background: '#000',
                    borderRadius: isMobile ? 0 : 12,
                    overflow: 'hidden',
                    aspectRatio: isMobile ? '9/16' : '9/16',
                    maxHeight: isMobile ? '100vh' : 750,
                    height: isMobile ? '100vh' : 'auto',
                    width: isMobile ? '100vw' : '100%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: isMobile ? 0 : 20,
                  }}
                >
                  {/* Mobile top overlay: Bell (left) + MoreVertical (right) */}
                  {isMobile && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 20,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        paddingTop: 'max(12px, env(safe-area-inset-top))',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)',
                        pointerEvents: 'none',
                      }}
                    >
                      <button
                        onClick={() => {
                          if (!user) { onRequireAuth(); return; }
                          onShowNotifications?.();
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 6,
                          pointerEvents: 'all',
                        }}
                      >
                        <Bell size={26} color="#fff" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setShowMenu(showMenu === video.id ? null : video.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 6,
                          pointerEvents: 'all',
                        }}
                      >
                        <MoreVertical size={26} color="#fff" strokeWidth={2} />
                      </button>
                    </div>
                  )}

                  {/* Video/Image Background */}
                  {video.imageUrl ? (
                    video.imageUrl.includes('.mp4') ||
                    video.imageUrl.includes('.webm') ||
                    video.imageUrl.includes('.ogg') ||
                    video.imageUrl.includes('.mov') ||
                    video.imageUrl.includes('video') ? (
                      <div
                        ref={(el) =>
                          (videoContainerRefs.current[video.id] = el)
                        }
                        data-video-id={video.id}
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '100%',
                        }}
                      >
                        <video
                          ref={(el) => (videoRefs.current[video.id] = el)}
                          src={
                            video.imageUrl.startsWith('http')
                              ? video.imageUrl
                              : `${config.API_BASE_URL.replace('/api', '')}${video.imageUrl}`
                          }
                          loop
                          playsInline
                          muted={!audioEnabled}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onClick={() => toggleVideoPlayback(video.id)}
                        >
                          Your browser does not support the video tag.
                        </video>

                        {/* Pause/Play Animation - TikTok Style */}
                        {showPauseIcon[video.id] && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              fontSize: 60,
                              color: '#fff',
                              background: 'rgba(0,0,0,0.5)',
                              borderRadius: '50%',
                              width: 80,
                              height: 80,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              animation: 'fadeInOut 1s ease-in-out',
                            }}
                          >
                            {playingVideos[video.id] ? '▶' : '❚❚'}
                          </div>
                        )}

                        {/* Three Dots Menu - Top Right */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 10,
                          }}
                        >
                          <button
                            onClick={() => setShowMenu(video.id)}
                            style={{
                              background: 'rgba(0,0,0,0.5)',
                              border: 'none',
                              borderRadius: '50%',
                              width: 40,
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#fff',
                            }}
                          >
                            <MoreVertical size={20} />
                          </button>

                          {/* Dropdown Menu */}
                          {showMenu === video.id && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 50,
                                right: 0,
                                background: '#fff',
                                borderRadius: 8,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                minWidth: 200,
                                zIndex: 1000,
                              }}
                            >
                              <button
                                onClick={() => handleShowVideoInfo(video)}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: 'none',
                                  background: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  fontSize: 14,
                                  color: T.txt,
                                }}
                                onMouseEnter={(e) =>
                                  (e.target.style.background = '#f5f5f5')
                                }
                                onMouseLeave={(e) =>
                                  (e.target.style.background = 'none')
                                }
                              >
                                <Info size={16} />
                                Video Info
                              </button>
                              <button
                                onClick={() => handleShare(video.id)}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: 'none',
                                  background: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  fontSize: 14,
                                  color: T.txt,
                                }}
                                onMouseEnter={(e) =>
                                  (e.target.style.background = '#f5f5f5')
                                }
                                onMouseLeave={(e) =>
                                  (e.target.style.background = 'none')
                                }
                              >
                                <Share2 size={16} />
                                Share
                              </button>
                              <button
                                onClick={() => handleNotInterested(video.id)}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: 'none',
                                  background: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  fontSize: 14,
                                  color: T.txt,
                                }}
                                onMouseEnter={(e) =>
                                  (e.target.style.background = '#f5f5f5')
                                }
                                onMouseLeave={(e) =>
                                  (e.target.style.background = 'none')
                                }
                              >
                                <Flag size={16} />
                                Not Interested
                              </button>
                              <button
                                onClick={() => setShowReportModal(video.id)}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: 'none',
                                  background: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  fontSize: 14,
                                  color: '#e74c3c',
                                }}
                                onMouseEnter={(e) =>
                                  (e.target.style.background = '#ffe5e5')
                                }
                                onMouseLeave={(e) =>
                                  (e.target.style.background = 'none')
                                }
                              >
                                <Flag size={16} />
                                Report
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <img
                        src={
                          video.imageUrl.startsWith('http')
                            ? video.imageUrl
                            : `${config.API_BASE_URL.replace('/api', '')}${video.imageUrl}`
                        }
                        alt={video.caption}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    )
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#fff',
                      }}
                    >
                      🎬
                    </div>
                  )}

                  {/* Creator Info - Bottom Left */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 20,
                      left: 20,
                      color: '#fff',
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        {video.creator}
                      </span>
                      {user && video.user?.id !== user.id && (
                        <button
                          onClick={() => handleFollow(video.user?.id)}
                          style={{
                            background: video.user?.is_following
                              ? '#e74c3c'
                              : '#fff',
                            color: video.user?.is_following ? '#fff' : '#000',
                            border: 'none',
                            borderRadius: 4,
                            padding: '4px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {video.user?.is_following ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        marginBottom: 8,
                      }}
                    >
                      {video.caption}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.8,
                      }}
                    >
                      {getRelativeTime(video.created_at)}
                    </div>
                    {/* Hashtags */}
                    {video.hashtags && video.hashtags.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          marginTop: 8,
                        }}
                      >
                        {video.hashtags.map((tag, index) => (
                          <span
                            key={index}
                            onClick={() => handleHashtagClick(tag)}
                            style={{
                              fontSize: 12,
                              color: '#3498db',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions - Right Side */}
                  <div
                    style={{
                      position: 'absolute',
                      right: 20,
                      bottom: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 20,
                      alignItems: 'center',
                    }}
                  >
                    {/* Like Button */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <LikeButton
                        liked={video.liked}
                        count={video.likes}
                        onLike={() => handleLike(video.id)}
                        size={32}
                      />
                    </div>

                    {/* Volume Button */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <button
                        onClick={toggleAudio}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {audioEnabled ? (
                          <Volume size={32} color="#fff" fill="#fff" />
                        ) : (
                          <VolumeX size={32} color="#fff" />
                        )}
                      </button>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#fff',
                          textAlign: 'center',
                        }}
                      >
                        {audioEnabled ? 'On' : 'Off'}
                      </div>
                    </div>

                    {/* Comment Button */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <button
                        onClick={() => {
                          if (!user) {
                            onRequireAuth();
                            return;
                          }
                          setShowComments(video.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <MessageCircle size={32} color="#fff" fill="#fff" />
                      </button>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#fff',
                          textAlign: 'center',
                        }}
                      >
                        {video.comments}
                      </div>
                    </div>

                    {/* Share Button */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <button
                        onClick={() => handleShare(video.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <Share2 size={32} color="#fff" />
                      </button>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#fff',
                          textAlign: 'center',
                        }}
                      >
                        {video.shares}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <button
                        onClick={() => handleSave(video.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <Bookmark
                          size={32}
                          color={video.saved ? '#fff' : '#fff'}
                          fill={video.saved ? '#fff' : 'none'}
                        />
                      </button>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#fff',
                          textAlign: 'center',
                        }}
                      >
                        {video.saved ? 'Saved' : 'Save'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '40px 0',
                  color: '#000',
                }}
              >
                <div style={{ fontSize: 14 }}>Loading more videos...</div>
              </div>
            )}
            
            {/* No more videos indicator */}
            {!hasMore && videos.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '40px 0',
                  color: '#666',
                }}
              >
                <div style={{ fontSize: 14 }}>You've reached the end</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR - Recommendations (Desktop Only) */}
      {!isMobile && (
        <div
          className="right-sidebar-container"
          style={{
            width: 320,
            minWidth: 320,
            borderLeft: `1px solid ${T.border}`,
            padding: '20px',
            overflowY: 'auto',
            height: '100vh',
            flexShrink: 0,
          }}
        >
          {/* User Suggestions */}
          <div>
            <UserSuggestions
              onUserClick={(user) => {
                console.log('User clicked:', user);
              }}
              onPostClick={(post) => {
                console.log('Post clicked:', post);
              }}
            />
          </div>

          {/* Winners Section */}
          <div
            style={{
              marginTop: 30,
              paddingTop: 20,
              borderTop: `1px solid ${T.border}`,
            }}
          >
            <WinnersSection />
          </div>

          {/* Footer Links */}
          <div
            style={{
              marginTop: 30,
              paddingTop: 20,
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: 12,
              color: T.sub,
            }}
          >
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
              About
            </a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
              Help
            </a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
              Press
            </a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
              Careers
            </a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
              Developers
            </a>
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 12,
              color: T.sub,
            }}
          >
            © 2024 WorqPost (ወorqPost)
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showComments && (
        <ModernCommentSection
          reelId={showComments}
          user={user}
          onClose={() => setShowComments(null)}
          onCommentPosted={handleCommentPosted}
        />
      )}

      {/* Report Category Modal */}
      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setShowReportModal(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '24px',
              maxWidth: 400,
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: T.txt,
                marginBottom: 8,
              }}
            >
              Report Content
            </h3>
            <p
              style={{
                fontSize: 14,
                color: T.sub,
                marginBottom: 20,
              }}
            >
              Why are you reporting this content?
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {[
                { id: 'spam', label: 'Spam or Misleading', icon: '⚠️' },
                {
                  id: 'inappropriate',
                  label: 'Inappropriate Content',
                  icon: '😢',
                },
                { id: 'violence', label: 'Violence or Dangerous', icon: '⚔️' },
                { id: 'hate', label: 'Hate Speech', icon: '🚫' },
                { id: 'copyright', label: 'Copyright Violation', icon: '©️' },
                { id: 'other', label: 'Other', icon: 'Ⓜ' },
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => submitReport(showReportModal, category.id)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    marginBottom: 8,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 14,
                    color: T.txt,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.target.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => (e.target.style.background = '#fff')}
                >
                  <span style={{ fontSize: 20 }}>{category.icon}</span>
                  <span style={{ fontWeight: 500 }}>{category.label}</span>
                </button>
              ))}

              <button
                onClick={() => setShowReportModal(null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: 12,
                  border: 'none',
                  borderRadius: 8,
                  background: T.border,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.txt,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onConfirm={alertModal.onConfirm}
        showCancel={alertModal.showCancel}
      />
    </div>
  );
}
