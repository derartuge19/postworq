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
  Menu,
  X,
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

export function TikTokLayout({
  user,
  activeTab: propActiveTab,
  onLogout,
  onRequireAuth,
  onShowPostPage,
  onShowProfile,
  onShowSettings,
  onShowCampaigns,
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
    return tabMap[tab] || tab;
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
  const [showComments, setShowComments] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false,
  });
  const [playingVideos, setPlayingVideos] = useState({});
  const [showPauseIcon, setShowPauseIcon] = useState({});
  const [showMenu, setShowMenu] = useState(null);
  const [followingUsers, setFollowingUsers] = useState({});
  const [showReportModal, setShowReportModal] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('Fetching videos from API for tab:', activeTab);

      let reelsData = [];

      // Fetch different content based on active tab
      if (activeTab === 'following') {
        // Fetch reels from followed users
        reelsData = await api.request('/reels/following/');
      } else if (activeTab === 'bookmarks') {
        // Fetch saved/bookmarked reels
        reelsData = await api.request('/reels/saved/');
      } else if (activeTab === 'explore') {
        // Fetch trending/popular reels
        reelsData = await api.request('/reels/trending/');
      } else {
        // Default: For You feed
        reelsData = await api.getReels();
      }

      console.log('API response:', reelsData);

      // Handle different response formats
      const reelsList = Array.isArray(reelsData)
        ? reelsData
        : reelsData.results || [];

      // Transform backend data to match frontend format
      const formattedVideos = reelsList.map((reel) => {
        const videoUrl = reel.media || reel.image;
        console.log('🎬 Processing reel:', {
          id: reel.id,
          user: reel.user?.username,
          media: reel.media,
          image: reel.image,
          finalUrl: videoUrl,
          isVideo: /\.(mp4|webm|ogg|mov)$/i.test(videoUrl),
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
      setVideos(formattedVideos);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // Don't use fallback data - show error instead
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [activeTab]);

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

  const toggleVideoPlayback = (videoId) => {
    const videoElement = videoRefs.current[videoId];
    if (!videoElement) return;

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
    }, 500);
  };

  const handleFollow = async (videoId, userId, username) => {
    if (!user) {
      setAlertModal({
        isOpen: true,
        title: 'Login Required',
        message: 'Please login to follow users.',
        type: 'warning',
        onConfirm: onRequireAuth,
        showCancel: false,
      });
      return;
    }

    try {
      const isFollowing = followingUsers[userId];
      if (isFollowing) {
        await api.unfollowUser(userId);
        setFollowingUsers((prev) => ({ ...prev, [userId]: false }));
      } else {
        await api.followUser(userId);
        setFollowingUsers((prev) => ({ ...prev, [userId]: true }));
      }
    } catch (error) {
      console.error('Follow error:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update follow status. Please try again.',
        type: 'error',
        onConfirm: null,
        showCancel: false,
      });
    }
  };

  const handleReport = (videoId) => {
    setShowMenu(null);
    setShowReportModal(videoId);
  };

  const submitReport = async (videoId, category) => {
    setShowReportModal(null);
    try {
      // Add report API call here when backend is ready
      console.log('Reported video:', videoId, 'Category:', category);
      setAlertModal({
        isOpen: true,
        title: 'Reported',
        message:
          "Thank you for reporting. We'll review this content within 24 hours.",
        type: 'success',
        onConfirm: null,
        showCancel: false,
      });
    } catch (error) {
      console.error('Report error:', error);
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
      title: 'Noted',
      message: "We'll show you less content like this.",
      type: 'info',
      onConfirm: null,
      showCancel: false,
    });
  };

  const handleInfo = (video) => {
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

  const handleLike = async (videoId) => {
    if (!user) {
      setAlertModal({
        isOpen: true,
        title: 'Login Required',
        message:
          'Please login to like posts. Click OK to go to login page or click outside to dismiss.',
        type: 'warning',
        onConfirm: onRequireAuth,
        showCancel: false,
      });
      return;
    }
    try {
      await api.voteReel(videoId);
      setVideos(
        videos.map((v) =>
          v.id === videoId
            ? {
                ...v,
                liked: !v.liked,
                likes: v.liked ? v.likes - 1 : v.likes + 1,
              }
            : v,
        ),
      );
    } catch (error) {
      console.error('Failed to like video:', error);
    }
  };

  const handleHashtagClick = async (hashtag) => {
    try {
      setLoading(true);
      console.log('Searching for hashtag:', hashtag);
      const results = await api.searchByHashtag(hashtag);
      const formattedVideos = results.map((reel) => ({
        id: reel.id,
        creator: reel.user?.username || 'Unknown User',
        handle: `@${reel.user?.username || 'unknown'}`,
        avatar: '👤',
        caption: reel.caption,
        hashtags: reel.hashtags_list || [],
        likes: reel.votes || 0,
        comments: reel.comment_count || 0,
        shares: 0,
        imageUrl: reel.media || reel.image,
        liked: false,
        activeTab,
      })); // Refetch when tab changes;
      setVideos(formattedVideos);
      setActiveTab(`hashtag-${hashtag}`);
    } catch (error) {
      console.error('Failed to search hashtag:', error);
      setAlertModal({
        isOpen: true,
        title: 'Search Failed',
        message: 'Failed to search. Please try again.',
        type: 'error',
        showCancel: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Expose fetchVideos function so it can be called from parent
  useEffect(() => {
    window.refreshFeed = fetchVideos;
  }, []);

  const recommendations = [
    {
      id: 1,
      name: 'Sarah Creator',
      handle: '@sarahcreator',
      avatar: '👩',
      followers: '1.2M',
    },
    {
      id: 2,
      name: 'Tech Guru',
      handle: '@techguru',
      avatar: '👨',
      followers: '2.5M',
    },
    {
      id: 3,
      name: 'Cooking with Love',
      handle: '@cookingwithlove',
      avatar: '👩‍🍳',
      followers: '890K',
    },
    {
      id: 4,
      name: 'Travel Vlogger',
      handle: '@travelvlogger',
      avatar: '✈️',
      followers: '3.1M',
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
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        }

        @media (max-width: 1024px) {
          .video-feed-container {
            scroll-snap-type: y mandatory;
            overflow-y: scroll;
            height: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .video-list-container {
            width: 100vw !important;
            max-width: 100vw !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .video-card-snap {
            scroll-snap-align: start;
            height: 100% !important;
            width: 100vw !important;
            max-width: 100vw !important;
            max-height: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* CENTER - Video Feed */}
      <div
        className="video-feed video-feed-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#000',
        }}
      >
          {/* Feed Header */}
          <div
            style={{
              width: '100%',
              maxWidth: 600,
              padding: '0 20px',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: T.txt,
                marginBottom: activeTab === 'explore' ? 16 : 0,
              }}
            >
              {activeTab === 'foryou' && 'For You'}
              {activeTab === 'explore' && 'Explore'}
              {activeTab === 'following' && 'Following'}
              {activeTab === 'inbox' && 'Messages'}
              {activeTab === 'bookmarks' && 'Saved'}
            </div>

            {/* Search Bar - Only on Explore Tab */}
            {activeTab === 'explore' && (
              <SearchBar
                onUserClick={(user) => {
                  setSelectedUser(user);
                  onShowProfile?.(user.id);
                }}
                onHashtagClick={(tag) => handleHashtagClick(tag)}
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
                  background: T.cardBg,
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
                    marginBottom: 12,
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
            /* Videos Feed */
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
                  style={{ textAlign: 'center', padding: '40px', color: T.sub }}
                >
                  Loading{' '}
                  {activeTab === 'following'
                    ? 'following'
                    : activeTab === 'bookmarks'
                      ? 'saved'
                      : activeTab === 'explore'
                        ? 'trending'
                        : ''}
                  ...
                </div>
              ) : videos.length === 0 ? (
                <div
                  style={{
                    background: T.cardBg,
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
                      marginBottom: 12,
                    }}
                  >
                    {activeTab === 'following' &&
                      'No posts from people you follow'}
                    {activeTab === 'bookmarks' && 'No saved posts yet'}
                    {activeTab === 'explore' && 'No trending posts'}
                    {activeTab === 'foryou' && 'No videos yet'}
                  </h3>
                  <p style={{ fontSize: 14, color: T.sub, margin: 0 }}>
                    {activeTab === 'following' &&
                      'Follow creators to see their posts here'}
                    {activeTab === 'bookmarks' &&
                      'Save posts to view them later'}
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
                    {/* Video/Image Background */}
                    {video.imageUrl ? (
                      video.imageUrl.match(/\.(mp4|webm|ogg|mov)$/i) ||
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
                            cursor: 'pointer',
                          }}
                          onClick={() => toggleVideoPlayback(video.id)}
                        >
                          <video
                            key={video.id}
                            ref={(el) => (videoRefs.current[video.id] = el)}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            loop
                            playsInline
                            preload="auto"
                            crossOrigin="anonymous"
                            onLoadedData={(e) => {
                              console.log(
                                '✅ Video loaded successfully:',
                                video.imageUrl,
                              );
                            }}
                            onError={(e) => {
                              const errorDetails = {
                                url: video.imageUrl,
                                errorCode: e.target.error?.code,
                                errorMessage: e.target.error?.message,
                                networkState: e.target.networkState,
                                readyState: e.target.readyState,
                                src: e.target.src,
                              };
                              console.error(
                                '❌ Video load error:',
                                errorDetails,
                              );
                              console.error(
                                'Error codes: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED',
                              );
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display =
                                  'flex';
                              }
                            }}
                          >
                            <source
                              src={
                                video.imageUrl.startsWith('http')
                                  ? video.imageUrl
                                  : `${config.API_BASE_URL.replace('/api', '')}${video.imageUrl}`
                              }
                              type={
                                video.imageUrl.endsWith('.webm')
                                  ? 'video/webm'
                                  : 'video/mp4'
                              }
                            />
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
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: 'fadeInOut 0.6s ease-out',
                                pointerEvents: 'none',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 32,
                                  color: '#fff',
                                  fontWeight: 300,
                                }}
                              >
                                {playingVideos[video.id] ? '▶' : '❚❚'}
                              </div>
                            </div>
                          )}

                          {/* Three Dots Menu - Top Right */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              zIndex: 10,
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(
                                  showMenu === video.id ? null : video.id,
                                );
                              }}
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
                                  top: 48,
                                  right: 0,
                                  background: '#fff',
                                  borderRadius: 12,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  minWidth: 180,
                                  overflow: 'hidden',
                                  zIndex: 100,
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReport(video.id);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    fontSize: 14,
                                    color: '#EF4444',
                                    transition: 'background 0.2s',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.target.style.background = '#FEE2E2')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.target.style.background = 'none')
                                  }
                                >
                                  <Flag size={16} />
                                  Report
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotInterested(video.id);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    fontSize: 14,
                                    color: T.txt,
                                    transition: 'background 0.2s',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.target.style.background = '#F5F5F4')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.target.style.background = 'none')
                                  }
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                  </svg>
                                  Not Interested
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInfo(video);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    fontSize: 14,
                                    color: T.txt,
                                    transition: 'background 0.2s',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.target.style.background = '#F5F5F4')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.target.style.background = 'none')
                                  }
                                >
                                  <Info size={16} />
                                  Info
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
                              : `http://localhost:8000${video.imageUrl}`
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
                    ) : null}
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                        display: video.imageUrl ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 80,
                      }}
                    >
                      🎬
                    </div>

                    {/* Creator Info - Bottom Left */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: isMobile ? 20 : 0,
                        left: isMobile ? 12 : 0,
                        right: isMobile ? 80 : 0,
                        background:
                          'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                        padding: isMobile ? '16px' : '20px',
                        paddingBottom: isMobile ? '80px' : '24px',
                        color: '#fff',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: isMobile ? 12 : 16,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (video.user?.id) {
                              onShowProfile(video.user.id);
                            }
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              background: T.pri,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 22,
                              border: '2px solid rgba(255,255,255,0.2)',
                            }}
                          >
                            {video.avatar}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>
                              {video.creator}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: 'rgba(255,255,255,0.7)',
                              }}
                            >
                              {video.handle}
                            </div>
                          </div>
                        </div>

                        {/* Follow Button */}
                        {user &&
                          video.user?.id &&
                          video.creator !== user.username && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollow(
                                  video.id,
                                  video.user.id,
                                  video.creator,
                                );
                              }}
                              style={{
                                padding: '8px 20px',
                                border: followingUsers[video.user.id]
                                  ? '1px solid rgba(255,255,255,0.4)'
                                  : 'none',
                                background: followingUsers[video.user.id]
                                  ? 'rgba(255,255,255,0.15)'
                                  : T.pri,
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.2s',
                                boxShadow: followingUsers[video.user.id]
                                  ? 'none'
                                  : '0 2px 8px rgba(218, 155, 42, 0.4)',
                              }}
                              onMouseEnter={(e) => {
                                if (!followingUsers[video.user.id]) {
                                  e.currentTarget.style.transform =
                                    'scale(1.05)';
                                  e.currentTarget.style.boxShadow =
                                    '0 4px 12px rgba(218, 155, 42, 0.6)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow =
                                  followingUsers[video.user.id]
                                    ? 'none'
                                    : '0 2px 8px rgba(218, 155, 42, 0.4)';
                              }}
                            >
                              {followingUsers[video.user.id] ? (
                                <>
                                  <UserCheck size={15} />
                                  Following
                                </>
                              ) : (
                                <>
                                  <UserPlus size={15} />
                                  Follow
                                </>
                              )}
                            </button>
                          )}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: '#fff',
                          lineHeight: 1.4,
                          marginBottom: 4,
                        }}
                      >
                        {video.caption}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.7)',
                          marginBottom: 8,
                        }}
                      >
                        {getRelativeTime(video.created_at)}
                      </div>
                      {video.hashtags && video.hashtags.length > 0 && (
                        <div
                          style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
                        >
                          {video.hashtags.map((tag, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleHashtagClick(tag)}
                              style={{
                                background: 'rgba(218, 155, 42, 0.3)',
                                border: 'none',
                                borderRadius: 12,
                                padding: '4px 10px',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all .2s',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  'rgba(218, 155, 42, 0.5)')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  'rgba(218, 155, 42, 0.3)')
                              }
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions - Right Side */}
                    <div
                      style={{
                        position: 'absolute',
                        right: isMobile ? 12 : 16,
                        bottom: isMobile ? 120 : 100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isMobile ? 16 : 24,
                        zIndex: 10,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <LikeButton
                          liked={video.liked}
                          count={video.likes}
                          onLike={() => handleLike(video.id)}
                          size={28}
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={() => {
                            if (!user) {
                              setAlertModal({
                                isOpen: true,
                                title: 'Login Required',
                                message:
                                  'Please login to comment on posts. Click OK to go to login page or click outside to dismiss.',
                                type: 'warning',
                                onConfirm: onRequireAuth,
                                showCancel: false,
                              });
                              return;
                            }
                            setShowComments(video.id);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#fff',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MessageCircle size={28} strokeWidth={2} />
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
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={() => {
                            const postUrl = `${window.location.origin}/post/${video.id}`;
                            navigator.clipboard
                              .writeText(postUrl)
                              .then(() => {
                                setAlertModal({
                                  isOpen: true,
                                  title: 'Success',
                                  message: 'Link copied to clipboard!',
                                  type: 'success',
                                  showCancel: false,
                                });
                              })
                              .catch(() => {
                                setAlertModal({
                                  isOpen: true,
                                  title: 'Error',
                                  message: 'Failed to copy link',
                                  type: 'error',
                                  showCancel: false,
                                });
                              });
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#fff',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Share2 size={28} strokeWidth={2} />
                        </button>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#fff',
                            textAlign: 'center',
                          }}
                        >
                          Share
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={async () => {
                            if (!user) {
                              setAlertModal({
                                isOpen: true,
                                title: 'Login Required',
                                message:
                                  'Please login to save posts. Click OK to go to login page or click outside to dismiss.',
                                type: 'warning',
                                onConfirm: onRequireAuth,
                                showCancel: false,
                              });
                              return;
                            }
                            try {
                              const response = await api.toggleSavePost(
                                video.id,
                              );
                              setVideos(
                                videos.map((v) =>
                                  v.id === video.id
                                    ? { ...v, saved: response.saved }
                                    : v,
                                ),
                              );
                            } catch (error) {
                              console.error('Failed to save post:', error);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: video.saved ? T.pri : '#fff',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Bookmark
                            size={28}
                            strokeWidth={2}
                            fill={video.saved ? T.pri : 'none'}
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
              background: '#fff',
              flexShrink: 0,
            }}
          >
            {/* User Suggestions */}
            <div>
              <UserSuggestions
                onUserClick={(user) => {
                  setSelectedUser(user);
                  onShowProfile?.(user.id);
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
                fontSize: 11,
                color: T.sub,
              }}
            >
              <a href="#" style={{ color: T.sub, textDecoration: 'none' }}>
                About
              </a>
              <a href="#" style={{ color: T.sub, textDecoration: 'none' }}>
                Newsroom
              </a>
              <a href="#" style={{ color: T.sub, textDecoration: 'none' }}>
                Contact
              </a>
              <a href="#" style={{ color: T.sub, textDecoration: 'none' }}>
                Careers
              </a>
              <a href="#" style={{ color: T.sub, textDecoration: 'none' }}>
                Privacy
              </a>
              <a href="#" style={{ color: T.sub, textDecoration: 'none' }}>
                Terms
              </a>
            </div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 12 }}>
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
              <p style={{ fontSize: 14, color: T.sub, marginBottom: 20 }}>
                Why are you reporting this content?
              </p>

              {[
                { id: 'adult', label: 'Adult Content', icon: '🔞' },
                { id: 'spam', label: 'Spam or Misleading', icon: '⚠️' },
                {
                  id: 'harassment',
                  label: 'Harassment or Bullying',
                  icon: '😢',
                },
                { id: 'violence', label: 'Violence or Dangerous', icon: '⚔️' },
                { id: 'hate', label: 'Hate Speech', icon: '🚫' },
                { id: 'copyright', label: 'Copyright Violation', icon: '©️' },
                { id: 'other', label: 'Other', icon: '❓' },
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
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F5F5F4';
                    e.currentTarget.style.borderColor = T.pri;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = T.border;
                  }}
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
    </div>
  );
}
