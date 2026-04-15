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
  Volume2,
  VolumeX,
  Bell,
  Heart,
  Download,
  Link,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import api from '../api';
import config from '../config';
import { ModernCommentSection } from './ModernCommentSection';
import { WinnersSection } from './WinnersSection';
import { SidebarCampaigns } from './SidebarCampaigns';
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
  onShowVideoDetail,
  unreadNotifCount = 0,
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

  // ── Feed cache helpers (stale-while-revalidate) ──────────────────────────
  const CACHE_KEY = (tab) => `feed_cache_${tab}`;
  const CACHE_TTL = 30 * 60 * 1000; // 30 min
  const readFeedCache = (tab) => {
    try {
      const raw = localStorage.getItem(CACHE_KEY(tab));
      if (!raw) return null;
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY(tab)); return null; }
      return data;
    } catch { return null; }
  };
  const writeFeedCache = (tab, data) => {
    try { localStorage.setItem(CACHE_KEY(tab), JSON.stringify({ ts: Date.now(), data })); } catch {}
  };

  const [videos, setVideos] = useState(() => readFeedCache('foryou') || []);
  const [loading, setLoading] = useState(() => !(readFeedCache('foryou')?.length > 0));
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showMenu, setShowMenu] = useState(null);
  const [showReportModal, setShowReportModal] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [playingVideos, setPlayingVideos] = useState({});
  const [showPauseIcon, setShowPauseIcon] = useState({});
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [likeAnimations, setLikeAnimations] = useState({});
  const [doubleTapLike, setDoubleTapLike] = useState({});
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
  const [visibleVideos, setVisibleVideos] = useState({});
  const activeVideoIdRef = useRef(null); // only this video plays with sound
  const longPressTimer = useRef(null);
  const [longPressMenu, setLongPressMenu] = useState(null); // { videoId, x, y } for long-press context menu

  // Generate Cloudinary poster thumbnail from video URL
  const getVideoPoster = (url) => {
    // Only generate for proper Cloudinary VIDEO urls — not phantom image urls
    // constructed by the storage backend for locally-saved files.
    if (!url || !url.includes('res.cloudinary.com')) return undefined;
    if (!url.includes('/video/upload/')) return undefined; // skip image/upload phantom urls
    try {
      const marker = '/video/upload/';
      const idx = url.indexOf(marker);
      if (idx === -1) return undefined;
      const base = url.slice(0, idx + marker.length);
      const rest = url.slice(idx + marker.length);
      const thumb = base + 'so_0,w_480,q_60,f_jpg/' + rest;
      return thumb.replace(/\.(mp4|webm|ogg|mov)(\?.*)?$/i, '.jpg');
    } catch {
      return undefined;
    }
  };

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
    const isFirst = pageNum === 1 && !append;

    if (append) {
      setLoadingMore(true);
    } else {
      // Show cached data immediately so LCP fires without waiting for API
      if (isFirst) {
        const cached = readFeedCache(activeTab);
        if (cached?.length > 0) {
          setVideos(cached);
          setLoading(false); // content visible instantly
        } else {
          setLoading(true);
        }
      }
    }
    
    try {
      let reelsData = [];
      const limit = 5; // Load 5 videos at a time for faster initial paint
      const offset = (pageNum - 1) * limit;

      // Fetch different content based on active tab
      if (activeTab === 'following') {
        reelsData = await api.request(`/reels/following/?limit=${limit}&offset=${offset}`);
      } else if (activeTab === 'bookmarks') {
        reelsData = await api.request(`/reels/saved/?limit=${limit}&offset=${offset}`);
      } else if (activeTab === 'explore') {
        reelsData = await api.request(`/reels/trending/?limit=${limit}&offset=${offset}`);
      } else {
        // For the initial foryou load, reuse the warm-up fetch fired in index.html
        // so we don't pay the cost of a second cold-start round-trip
        if (isFirst && window.__warmupFeed) {
          const warmup = window.__warmupFeed;
          window.__warmupFeed = null; // consume once
          reelsData = (await warmup) || [];
        } else {
          reelsData = await api.request(`/reels/?limit=${limit}&offset=${offset}`);
        }
      }


      // Handle different response formats (DRF pagination returns {count, next, previous, results})
      const reelsList = Array.isArray(reelsData)
        ? reelsData
        : reelsData.results || [];
      
      // Check if there are more videos to load using DRF pagination
      // Only continue if we got a full page AND there's a next link, or if it's the first page with exactly limit items
      const hasMoreVideos = reelsData.next ? true : (pageNum === 1 && reelsList.length === limit);
      setHasMore(hasMoreVideos);

      // Transform backend data to match frontend format
      const formattedVideos = reelsList.map((reel) => {
        const videoUrl = reel.media || reel.image;

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
          imageUrl: (() => {
            const url = reel.media || reel.image;
            if (!url) return null;
            if (
              url.includes('/video/upload/') &&
              !url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)
            ) {
              return url + '.mp4';
            }
            return url;
          })(),
          liked: reel.is_liked || false,
          saved: reel.is_saved || false,
          created_at: reel.created_at,
          overlayText: (() => {
            if (!reel.overlay_text) return [];
            try { return JSON.parse(reel.overlay_text); } catch { return []; }
          })(),
        };
      });
      
      if (append) {
        setVideos(prev => [...prev, ...formattedVideos]);
      } else {
        setVideos(formattedVideos);
        // Persist fresh data so next load is instant (stale-while-revalidate)
        if (formattedVideos.length > 0) {
          writeFeedCache(activeTab, formattedVideos);
        }
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // Keep cached data visible if API fails - don't blank the screen
      if (!append) {
        const cached = readFeedCache(activeTab);
        if (!cached?.length) setVideos([]);
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
    // Clear current videos immediately when switching tabs to prevent mixing
    setVideos([]);
    setPage(1);
    setHasMore(true);
    fetchVideos(1, false);
  }, [activeTab]);

  // Remove the HTML skeleton overlay as soon as we have content to show
  useEffect(() => {
    if (videos.length > 0 || !loading) {
      const skeleton = document.getElementById('app-skeleton');
      if (skeleton) {
        skeleton.style.transition = 'opacity 0.2s ease';
        skeleton.style.opacity = '0';
        setTimeout(() => skeleton.remove(), 220);
      }
    }
  }, [videos.length, loading]);

  // Preload first video's poster with better timing and cleanup
  useEffect(() => {
    if (!videos.length) return;
    const firstUrl = videos[0]?.imageUrl;
    if (!firstUrl) return;
    const poster = getVideoPoster(firstUrl);
    if (!poster) return;
    
    // Remove any existing preload
    const existing = document.head.querySelector(`link[data-video-poster]`);
    if (existing) existing.remove();
    
    // Only preload if we're likely to use it soon
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = poster;
    link.setAttribute('data-video-poster', '1');
    
    // Add timeout to remove preload if not used within 5 seconds
    const timeoutId = setTimeout(() => {
      try { link.remove(); } catch {}
    }, 5000);
    
    document.head.appendChild(link);
    
    return () => { 
      clearTimeout(timeoutId);
      try { link.remove(); } catch {} 
    };
  }, [videos[0]?.id]);

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

  // IntersectionObserver to control video playback AND lazy-load src
  useEffect(() => {
    // Observer for playback (70% visible)
    const playbackObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = entry.target.dataset.videoId;
          const videoElement = videoRefs.current[videoId];
          if (!videoElement) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            // Mute ALL other playing videos first
            Object.entries(videoRefs.current).forEach(([id, el]) => {
              if (el && id !== videoId) {
                el.muted = true;
                el.pause();
              }
            });
            // Play and optionally unmute the active video
            activeVideoIdRef.current = videoId;
            videoElement.muted = !audioEnabled;
            videoElement
              .play()
              .catch((err) => console.log('Play prevented:', err));
            setPlayingVideos((prev) => ({ ...prev, [videoId]: true }));
          } else {
            videoElement.muted = true;
            videoElement.pause();
            setPlayingVideos((prev) => ({ ...prev, [videoId]: false }));
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.7 },
    );

    // Observer for lazy-loading src (preload when 1 screen away)
    const lazyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = entry.target.dataset.videoId;
          if (entry.isIntersecting) {
            setVisibleVideos((prev) => ({ ...prev, [videoId]: true }));
          }
        });
      },
      { root: null, rootMargin: '200% 0px', threshold: 0 },
    );

    Object.keys(videoContainerRefs.current).forEach((videoId) => {
      const container = videoContainerRefs.current[videoId];
      if (container) {
        playbackObserver.observe(container);
        lazyObserver.observe(container);
      }
    });

    return () => {
      playbackObserver.disconnect();
      lazyObserver.disconnect();
    };
  }, [videos]);

  // Auto-play first video on initial load
  useEffect(() => {
    if (videos.length === 0 || loading) return;
    
    const firstVideo = videos[0];
    const videoElement = videoRefs.current[firstVideo.id];
    
    // Small delay to ensure video element is mounted
    const timer = setTimeout(() => {
      if (videoElement && videoElement.paused) {
        activeVideoIdRef.current = String(firstVideo.id);
        videoElement.muted = !audioEnabled;
        videoElement.play()
          .then(() => {
            setPlayingVideos((prev) => ({ ...prev, [firstVideo.id]: true }));
          })
          .catch((err) => console.log('Auto-play prevented:', err));
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [videos.length > 0 && !loading]); // Only run when videos first load

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
    const next = !audioEnabled;
    setAudioEnabled(next);
    // Only unmute the currently active video — all others stay muted
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (video) video.muted = id === activeVideoIdRef.current ? !next : true;
    });
  };

  const handleDoubleTap = (videoId) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    
    // Trigger like (only if not already liked)
    const video = videos.find(v => v.id === videoId);
    if (video && !video.liked) {
      handleLike(videoId);
    }
    
    // Show double-tap heart animation (use timestamp key for re-triggering)
    setDoubleTapLike((prev) => ({ ...prev, [videoId]: Date.now() }));
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

    // Show heart animation instantly
    setLikeAnimations((prev) => ({ ...prev, [videoId]: Date.now() }));

    // Optimistic UI: update immediately before API call
    setVideos((prev) =>
      prev.map((video) =>
        video.id === videoId
          ? {
              ...video,
              liked: !video.liked,
              likes: video.liked ? video.likes - 1 : video.likes + 1,
            }
          : video,
      ),
    );

    try {
      const response = await api.request(`/reels/${videoId}/vote/`, {
        method: 'POST',
      });

      // Reconcile with server truth
      if (response.voted !== undefined) {
        setVideos((prev) =>
          prev.map((video) =>
            video.id === videoId
              ? {
                  ...video,
                  liked: response.voted,
                  likes: response.votes ?? video.likes,
                }
              : video,
          ),
        );
      }
    } catch (error) {
      // Revert optimistic update on failure
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                liked: !video.liked,
                likes: video.liked ? video.likes - 1 : video.likes + 1,
              }
            : video,
        ),
      );
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

  // Store follow states separately to persist across video refreshes
  const [followStates, setFollowStates] = useState({});

  const handleFollow = async (userId) => {
    if (!user) {
      onRequireAuth();
      return;
    }

    // Optimistically update local state first
    const currentFollowing = followStates[userId] ?? videos.find(v => v.user?.id === userId)?.user?.is_following;
    const newFollowing = !currentFollowing;
    
    setFollowStates(prev => ({
      ...prev,
      [userId]: newFollowing
    }));

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
        // Also update followStates to match server response
        setFollowStates(prev => ({
          ...prev,
          [userId]: response.following
        }));
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
      // Revert on error
      setFollowStates(prev => ({
        ...prev,
        [userId]: currentFollowing
      }));
    }
  };

  const submitReport = async (videoId, category) => {
    setShowReportModal(null);
    try {
      await api.request('/reports/create/', {
        method: 'POST',
        body: JSON.stringify({
          reported_reel_id: videoId,
          report_type: category,
          description: `Reported as ${category}`,
        }),
      });
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

  const handleNotInterested = async (videoId) => {
    setShowMenu(null);
    try {
      await api.request('/reels/not-interested/', {
        method: 'POST',
        body: JSON.stringify({ reel_id: videoId }),
      });
      // Remove video from feed locally too
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      setAlertModal({
        isOpen: true,
        title: 'Video Removed',
        message: "This video won't appear in your feed anymore.",
        type: 'info',
        onConfirm: null,
        showCancel: false,
      });
    } catch (error) {
      console.error('Failed to mark not interested:', error);
      // Still remove from local feed even if API fails
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    }
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
        // Show success toast
        const toast = document.createElement('div');
        toast.textContent = '✓ Link copied to clipboard!';
        toast.style.cssText = `
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 24px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 600;
          z-index: 10000;
          animation: fadeInOut 2s ease-in-out;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
        
        console.log('Link copied to clipboard:', postUrl);
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
        alert('Failed to copy link');
      });
  };

  // Long-press handlers for TikTok-style context menu (separate from 3-dots menu)
  const handleLongPressStart = (videoId, e) => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(null); // Close dropdown menu if open
      setLongPressMenu(videoId); // Show bottom sheet only
      // Haptic feedback on mobile if available
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms for long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleLongPressMove = () => {
    // Cancel long press if user moves finger
    handleLongPressEnd();
  };

  // Download video/image - optimized size like TikTok
  const handleDownload = async (video) => {
    setLongPressMenu(null);
    setShowMenu(null);
    
    let mediaUrl = video.imageUrl?.startsWith('http') 
      ? video.imageUrl 
      : `${config.API_BASE_URL.replace('/api', '')}${video.imageUrl}`;
    
    const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || 
                    mediaUrl.includes('.mov') || mediaUrl.includes('video');
    
    // Apply Cloudinary transformations for smaller file size (like TikTok)
    // - Videos: 720p max height, quality 70, smaller bitrate
    // - Images: 1080p max, quality 80
    if (mediaUrl.includes('cloudinary.com')) {
      if (isVideo && mediaUrl.includes('/video/upload/')) {
        // Insert transformation: h_720 (720p), q_70 (quality 70%), vc_h264 (h264 codec for smaller size)
        mediaUrl = mediaUrl.replace(
          '/video/upload/',
          '/video/upload/h_720,q_70,vc_h264/'
        );
      } else if (mediaUrl.includes('/image/upload/')) {
        // Insert transformation: h_1080, q_80, f_jpg
        mediaUrl = mediaUrl.replace(
          '/image/upload/',
          '/image/upload/h_1080,q_80,f_jpg/'
        );
      }
    }
    
    try {
      // Show downloading toast
      const toast = document.createElement('div');
      toast.textContent = '⬇️ Preparing download...';
      toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
      `;
      document.body.appendChild(toast);
      
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      
      // Show file size in toast
      const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
      toast.textContent = `⬇️ Downloading (${sizeMB}MB)...`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `postworq_${video.id}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.textContent = `✓ Downloaded (${sizeMB}MB)`;
      setTimeout(() => toast.remove(), 2000);
    } catch (err) {
      console.error('Download failed:', err);
      setAlertModal({
        isOpen: true,
        title: 'Download Failed',
        message: 'Could not download the video. Please try again.',
        type: 'error',
        onConfirm: null,
        showCancel: false,
      });
    }
  };

  // Save to favorites (bookmark)
  const handleSaveToFavorites = async (videoId) => {
    setLongPressMenu(null);
    setShowMenu(null);
    
    if (!user) {
      onRequireAuth();
      return;
    }
    
    try {
      await api.request(`/saved/`, {
        method: 'POST',
        body: JSON.stringify({ reel: videoId }),
      });
      
      // Show success toast
      const toast = document.createElement('div');
      toast.textContent = '⭐ Saved to favorites!';
      toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        animation: fadeInOut 2s ease-in-out;
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    }
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
      <style>{`
        .video-feed-container::-webkit-scrollbar { display: none; }
        .right-sidebar-container::-webkit-scrollbar { display: none; }
        .feed-action-icon > div > button { filter: drop-shadow(0 1px 8px rgba(0,0,0,0.95)) drop-shadow(0 0 3px rgba(0,0,0,0.8)); }
        .feed-action-icon > div > div:first-child { filter: drop-shadow(0 1px 8px rgba(0,0,0,0.95)) drop-shadow(0 0 3px rgba(0,0,0,0.8)); }
        .feed-action-label { text-shadow: 0 1px 5px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.8) !important; color: #fff !important; }
        .feed-top-icon { filter: drop-shadow(0 1px 6px rgba(0,0,0,0.95)) drop-shadow(0 0 2px rgba(0,0,0,0.8)); }
      `}</style>
      <div
        className="video-feed video-feed-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#fff',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          ...(isMobile ? { scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' } : {}),
        }}
      >
        {/* Feed Header - desktop only; hiding on mobile fixes scroll-snap offset */}
        {!isMobile && <div
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
        </div>}

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
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 0 : 20 }}>
                {[0, 1].map(i => (
                  <div key={i} className="video-card-snap" style={{
                    background: '#111',
                    borderRadius: isMobile ? 0 : 12,
                    overflow: 'hidden',
                    height: isMobile ? 'calc(100dvh - 70px)' : 750,
                    width: isMobile ? '100vw' : '100%',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
                      animation: 'shimmer 1.5s infinite',
                    }} />
                    <div style={{ position: 'absolute', bottom: 80, left: 16, right: 70 }}>
                      <div style={{ width: 100, height: 14, background: 'rgba(255,255,255,0.12)', borderRadius: 7, marginBottom: 10 }} />
                      <div style={{ width: 180, height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, marginBottom: 6 }} />
                      <div style={{ width: 140, height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />
                    </div>
                    <div style={{ position: 'absolute', bottom: 80, right: 12, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                      {[0,1,2].map(j => (
                        <div key={j} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                  </div>
                ))}
                <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
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
                  onTouchStart={(e) => {
                    // Only trigger long-press on mobile, not when tapping buttons
                    if (e.target.closest('button')) return;
                    handleLongPressStart(video.id, e);
                  }}
                  onTouchEnd={handleLongPressEnd}
                  onTouchMove={handleLongPressMove}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    // On mobile, show bottom sheet; on desktop, show dropdown
                    if (isMobile) {
                      setLongPressMenu(video.id);
                    } else {
                      setShowMenu(video.id);
                    }
                  }}
                  style={{
                    background: isMobile ? '#fff' : 'transparent',
                    borderRadius: isMobile ? 0 : 12,
                    overflow: 'hidden',
                    aspectRatio: isMobile ? undefined : '9/16',
                    maxHeight: isMobile ? 'calc(100dvh - 70px)' : 750,
                    height: isMobile ? 'calc(100dvh - 70px)' : 'auto',
                    minHeight: isMobile ? 'calc(100dvh - 70px)' : undefined,
                    width: isMobile ? '100vw' : '100%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: isMobile ? 0 : 20,
                    scrollSnapAlign: isMobile ? 'start' : undefined,
                    scrollSnapStop: isMobile ? 'always' : undefined,
                    flexShrink: isMobile ? 0 : undefined,
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
                        background: 'none',
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
                          position: 'relative',
                        }}
                      >
                        <Bell size={26} color="#fff" strokeWidth={2} className="feed-top-icon" />
                        {unreadNotifCount > 0 && (
                          <div style={{
                            position: 'absolute', top: 0, right: 0,
                            minWidth: 16, height: 16, borderRadius: 8,
                            background: '#EF4444', color: '#fff',
                            fontSize: 9, fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '0 3px', boxSizing: 'border-box',
                            border: '1.5px solid rgba(0,0,0,0.4)', lineHeight: 1,
                          }}>
                            {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                          </div>
                        )}
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setShowMenu(showMenu === video.id ? null : video.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 6,
                            pointerEvents: 'all',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                          }}
                        >
                          <MoreVertical size={26} color="#fff" strokeWidth={2.5} />
                        </button>

                        {/* Mobile 3-Dots Dropdown Menu - Top right like desktop */}
                        {showMenu === video.id && (
                          <>
                            {/* Backdrop to close menu */}
                            <div
                              onClick={() => setShowMenu(null)}
                              style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 998,
                              }}
                            />
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: 'absolute',
                                top: 40,
                                right: 0,
                                background: '#fff',
                                borderRadius: 12,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                                minWidth: 180,
                                zIndex: 999,
                                overflow: 'hidden',
                              }}
                            >
                              <button
                                onClick={() => handleShare(video.id)}
                                style={{
                                  width: '100%',
                                  padding: '14px 16px',
                                  background: 'none',
                                  border: 'none',
                                  textAlign: 'left',
                                  fontSize: 14,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  color: T.txt,
                                }}
                              >
                                <Share2 size={18} style={{ color: T.pri }} /> Share
                              </button>
                              <button
                                onClick={() => handleNotInterested(video.id)}
                                style={{
                                  width: '100%',
                                  padding: '14px 16px',
                                  background: 'none',
                                  border: 'none',
                                  textAlign: 'left',
                                  fontSize: 14,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  color: T.txt,
                                }}
                              >
                                <EyeOff size={18} style={{ color: '#78716C' }} /> Not Interested
                              </button>
                              <button
                                onClick={() => { setShowMenu(null); setShowReportModal(video.id); }}
                                style={{
                                  width: '100%',
                                  padding: '14px 16px',
                                  background: 'none',
                                  border: 'none',
                                  textAlign: 'left',
                                  fontSize: 14,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  color: '#EF4444',
                                }}
                              >
                                <AlertTriangle size={18} /> Report
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Long-Press Menu - TikTok-style full menu */}
                  {isMobile && longPressMenu === video.id && (
                    <div
                      onClick={() => setLongPressMenu(null)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          maxWidth: 480,
                          background: '#fff',
                          borderRadius: '20px 20px 0 0',
                          padding: '8px 0 40px',
                          paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))',
                          boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
                        }}
                      >
                        <div style={{ width: 36, height: 4, background: '#E7E5E4', borderRadius: 4, margin: '12px auto 16px' }} />
                        {/* TikTok-style grid of action icons */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '8px 16px 16px' }}>
                          {[
                            { icon: Link, label: 'Copy Link', color: T.pri, action: () => { setLongPressMenu(null); handleShare(video.id); } },
                            { icon: Bookmark, label: 'Save', color: '#F59E0B', action: () => handleSaveToFavorites(video.id) },
                            { icon: Download, label: 'Download', color: '#10B981', action: () => handleDownload(video) },
                            { icon: Share2, label: 'Share', color: '#8B5CF6', action: () => { setLongPressMenu(null); handleShare(video.id); } },
                          ].map((item, idx) => (
                            <button
                              key={idx}
                              onClick={item.action}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 6,
                                padding: '12px 8px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: `${item.color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <item.icon size={22} color={item.color} />
                              </div>
                              <span style={{ fontSize: 11, color: T.txt, fontWeight: 500 }}>{item.label}</span>
                            </button>
                          ))}
                        </div>
                        {/* Divider */}
                        <div style={{ height: 1, background: T.border, margin: '4px 16px 8px' }} />
                        {/* List options */}
                        <button
                          onClick={() => { setLongPressMenu(null); handleNotInterested(video.id); }}
                          style={{
                            width: '100%',
                            padding: '14px 24px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            fontSize: 15,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            color: T.txt,
                          }}
                        >
                          <EyeOff size={20} style={{ color: '#78716C' }} /> Not Interested
                        </button>
                        <button
                          onClick={() => { setLongPressMenu(null); setShowReportModal(video.id); }}
                          style={{
                            width: '100%',
                            padding: '14px 24px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            fontSize: 15,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            color: '#EF4444',
                          }}
                        >
                          <AlertTriangle size={20} /> Report
                        </button>
                        <button
                          onClick={() => setLongPressMenu(null)}
                          style={{
                            width: '100%',
                            padding: '14px 24px',
                            marginTop: 8,
                            background: '#F5F5F4',
                            border: 'none',
                            textAlign: 'center',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: T.txt,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
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
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      >
                        <video
                          key={video.id}
                          ref={(el) => (videoRefs.current[video.id] = el)}
                          src={
                            !video.imageUrl
                              ? undefined
                              : video.imageUrl.startsWith('http')
                                ? video.imageUrl
                                : `${config.API_BASE_URL.replace('/api', '')}${video.imageUrl}`
                          }
                          poster={getVideoPoster(video.imageUrl)}
                          preload={
                            videos.indexOf(video) === 0 || visibleVideos[video.id]
                              ? 'metadata'
                              : 'none'
                          }
                          loop
                          playsInline
                          muted
                          onLoadedData={(e) => {
                            // Keep muted on load; IntersectionObserver controls playback
                            e.target.muted = true;
                          }}
                          onError={(e) => {
                            const code = e.target?.error?.code;
                            // Suppress range/abort errors — these are benign browser prefetch artifacts
                            if (code === 3 || code === 2) return;
                            e.target.style.display = 'none';
                            const placeholder = e.target.parentElement?.querySelector('.video-error-placeholder');
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            background: '#000',
                          }}
                          onClick={() => toggleVideoPlayback(video.id)}
                          onDoubleClick={() => handleDoubleTap(video.id)}
                        >
                          Your browser does not support the video tag.
                        </video>
                        <div
                          className="video-error-placeholder"
                          style={{
                            display: 'none',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            color: '#fff',
                          }}
                        >
                          <span style={{ fontSize: 48, marginBottom: 10 }}>🎬</span>
                          <span style={{ fontSize: 14, opacity: 0.7 }}>Video unavailable</span>
                        </div>

                        {/* Text Overlays from creator */}
                        {video.overlayText && video.overlayText.length > 0 && video.overlayText.map((ov, idx) => (
                          <div
                            key={idx}
                            style={{
                              position: 'absolute',
                              left: `${ov.x || 50}%`,
                              top: `${ov.y || 50}%`,
                              transform: 'translate(-50%, -50%)',
                              pointerEvents: 'none',
                              zIndex: 15,
                            }}
                          >
                            <span style={{
                              fontSize: ov.fontSize || 22,
                              fontWeight: 800,
                              color: ov.color || '#fff',
                              textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5)',
                              background: 'rgba(0,0,0,0.3)',
                              padding: '4px 12px',
                              borderRadius: 8,
                              whiteSpace: 'nowrap',
                            }}>
                              {ov.text}
                            </span>
                          </div>
                        ))}

                        {/* Double-tap heart animation */}
                        {doubleTapLike[video.id] && (
                          <div
                            key={doubleTapLike[video.id]}
                            onAnimationEnd={() => setDoubleTapLike((prev) => ({ ...prev, [video.id]: 0 }))}
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              animation: 'heartPop 0.7s ease-out forwards',
                              pointerEvents: 'none',
                              zIndex: 100,
                              willChange: 'transform, opacity',
                            }}
                          >
                            <Heart size={100} fill="#ff2e63" stroke="none" style={{ filter: 'drop-shadow(0 0 12px rgba(255,46,99,0.6))' }} />
                          </div>
                        )}

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
                      </div>
                    ) : (
                      <>
                        <img
                          src={
                            video.imageUrl.startsWith('http')
                              ? video.imageUrl
                              : `${config.API_BASE_URL.replace('/api', '')}${video.imageUrl}`
                          }
                          alt={video.caption}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                        <div
                          style={{
                            display: 'none',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            color: '#fff',
                          }}
                        >
                          <span style={{ fontSize: 48, marginBottom: 10 }}>📷</span>
                          <span style={{ fontSize: 14, opacity: 0.7 }}>Image unavailable</span>
                        </div>
                      </>
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

                  {/* Three Dots Menu - Top Right (Desktop) */}
                  {!isMobile && (
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
                          background: 'none',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 6,
                          color: '#fff',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                        }}
                      >
                        <MoreVertical size={24} strokeWidth={2.5} />
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
                            Post Info
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
                            <Link size={16} />
                            Copy Link
                          </button>
                          <button
                            onClick={() => handleSaveToFavorites(video.id)}
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
                            <Bookmark size={16} />
                            Save to Favorites
                          </button>
                          <button
                            onClick={() => handleDownload(video)}
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
                            <Download size={16} />
                            Download
                          </button>
                          <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
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
                        onClick={() => {
                          if (!user) { onRequireAuth(); return; }
                          onShowProfile?.(video.user?.id);
                        }}
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textDecorationColor: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {video.creator}
                      </span>
                      {user && video.user?.id !== user.id && (
                        <button
                          onClick={() => handleFollow(video.user?.id)}
                          style={{
                            background: (followStates[video.user?.id] ?? video.user?.is_following)
                              ? 'rgba(255,255,255,0.15)'
                              : 'linear-gradient(135deg, #DA9B2A 0%, #f0b840 100%)',
                            color: '#fff',
                            border: (followStates[video.user?.id] ?? video.user?.is_following)
                              ? '1px solid rgba(255,255,255,0.4)'
                              : 'none',
                            borderRadius: 14,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            letterSpacing: 0.3,
                            boxShadow: (followStates[video.user?.id] ?? video.user?.is_following)
                              ? 'none'
                              : '0 2px 8px rgba(218,155,42,0.45)',
                            transition: 'all 0.2s ease',
                            backdropFilter: (followStates[video.user?.id] ?? video.user?.is_following) ? 'blur(8px)' : 'none',
                            WebkitBackdropFilter: (followStates[video.user?.id] ?? video.user?.is_following) ? 'blur(8px)' : 'none',
                          }}
                        >
                          {(followStates[video.user?.id] ?? video.user?.is_following) ? 'Following' : 'Follow'}
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
                    className="feed-action-icon"
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
                          <Volume2 size={32} color="#fff" strokeWidth={2} />
                        ) : (
                          <VolumeX size={32} color="#fff" strokeWidth={2} />
                        )}
                      </button>
                      <div
                        className="feed-action-label"
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
                          // Prevent rapid clicking that causes React error #426
                          if (showComments === video.id) return;
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
                        className="feed-action-label"
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
                        className="feed-action-label"
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
                          color={video.saved ? '#F59E0B' : '#fff'}
                          fill={video.saved ? '#F59E0B' : 'none'}
                        />
                      </button>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: video.saved ? '#F59E0B' : '#fff',
                          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
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
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* ── Who to Follow ─────────────────────────────────────── */}
          <div style={{ marginBottom: 24 }}>
            <UserSuggestions
              onUserClick={(clickedUser) => {
                if (!user) { onRequireAuth(); return; }
                onShowProfile?.(clickedUser.id);
              }}
              onPostClick={(post) => { console.log('Post clicked:', post); }}
            />
          </div>

          {/* ── Divider ───────────────────────────────────────────── */}
          <div style={{ height: 1, background: T.border, marginBottom: 24 }} />

          {/* ── Live Campaigns · Coming Soon · Recent Winners ────── */}
          <SidebarCampaigns
            onCampaignClick={(c) => {
              if (!user) { onRequireAuth(); return; }
              onShowCampaigns?.();
            }}
          />

          {/* ── Footer ────────────────────────────────────────────── */}
          <div style={{ height: 1, background: T.border, margin: '8px 0 16px' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', fontSize: 11, color: T.sub }}>
            {['About','Help','Press','Careers','Developers'].map(lnk => (
              <a key={lnk} href="#" style={{ color: 'inherit', textDecoration: 'none' }}>{lnk}</a>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: T.sub }}>© 2025 WorqPost</div>
        </div>
      )}

      {/* Comments Modal */}
      {showComments && (
        <div key={showComments}>
          <ModernCommentSection
            reelId={showComments}
            user={user}
            onClose={() => setShowComments(null)}
            onCommentPosted={handleCommentPosted}
          />
        </div>
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
                { id: 'hate_speech', label: 'Hate Speech', icon: '🚫' },
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
