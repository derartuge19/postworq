import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Heart, Trophy, MessageCircle, Share2, Bookmark, MoreHorizontal, Eye, CheckCircle, Play, X, Send, Info, Link2, Download, Flag, Trash2 } from 'lucide-react';
import api from '../api';
import config from '../config';
import { useTheme } from '../contexts/ThemeContext';

const BACKEND = config.API_BASE_URL.replace('/api', '');

function mediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return BACKEND + url;
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Cache helpers for HomePage
const CACHE_KEY = 'homepage_feed_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function readHomeCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function writeHomeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

/* ── Comment Sheet ── */
function CommentSheet({ post, currentUser, onClose, T, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    api.request(`/comments/?reel=${post.id}`)
      .then(d => setComments(Array.isArray(d) ? d : (d.results || [])))
      .catch(() => {});
  }, [post.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    if (!api.hasToken()) return;
    setSending(true);
    try {
      const res = await api.request('/comments/', { method: 'POST', body: JSON.stringify({ reel: post.id, text: text.trim() }), headers: { 'Content-Type': 'application/json' } });
      setComments(prev => [...prev, res]);
      setText('');
      onCommentAdded?.();
    } catch {} finally { setSending(false); }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'flex-end' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: T.cardBg || '#fff', borderRadius: '20px 20px 0 0', maxHeight: '75vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.txt }}>Comments</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub }}><X size={20} /></button>
        </div>
        {/* Comments list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: T.sub, padding: 30, fontSize: 14 }}>No comments yet. Be first!</div>
          ) : comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.pri + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {c.user?.profile_photo ? <img src={mediaUrl(c.user.profile_photo)} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: T.txt }}>{c.user?.username} </span>
                <span style={{ fontSize: 13, color: T.txt }}>{c.text}</span>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{timeAgo(c.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Input */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, padding: '10px 16px', borderTop: `1px solid ${T.border}` }}>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={api.hasToken() ? 'Add a comment…' : 'Log in to comment'}
            disabled={!api.hasToken()}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 24, border: `1px solid ${T.border}`, background: T.bg, color: T.txt, fontSize: 14, outline: 'none' }}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending || !api.hasToken()}
            style={{ background: T.pri, border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (!text.trim() || sending) ? 0.5 : 1, transition: 'opacity 0.2s, transform 0.1s', flexShrink: 0 }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Send size={16} color="#fff" />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Post Info Sheet ── */
function PostInfoSheet({ post, onClose, T }) {
  const raw = post.media || post.image || '';
  const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(raw) || raw.includes('/video/upload/');
  const avatarSrc = post.user?.profile_photo ? mediaUrl(post.user.profile_photo) : null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9300, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: T.cardBg || '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', boxSizing: 'border-box' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border, margin: '0 auto 16px' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 16 }}>Post Info</div>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px', background: T.bg, borderRadius: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: T.pri + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {avatarSrc ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.txt }}>@{post.user?.username || 'unknown'}</div>
            <div style={{ fontSize: 12, color: T.sub }}>{post.user?.full_name || ''}</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[['❤️', post.votes || 0, 'Likes'], ['💬', post.comment_count || 0, 'Comments'], ['👁️', post.view_count || 0, 'Views']].map(([emoji, val, lbl]) => (
            <div key={lbl} style={{ flex: 1, background: T.bg, borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 18 }}>{emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.txt }}>{Number(val).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: T.sub }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Meta */}
        <div style={{ fontSize: 13, color: T.sub, marginBottom: post.caption ? 10 : 0 }}>
          <span style={{ color: T.pri, fontWeight: 600 }}>{isVideo ? '🎬 Video' : '🖼️ Image'}</span>
          {' · '}
          {timeAgo(post.created_at)}
        </div>

        {/* Caption */}
        {post.caption && (
          <div style={{ fontSize: 14, color: T.txt, lineHeight: 1.55, marginTop: 8 }}>
            <span style={{ fontWeight: 700 }}>@{post.user?.username} </span>
            {post.caption}
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 12, background: T.bg, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: T.txt }}>Close</button>
      </div>
    </div>
  );
}

/* ── Post Options Popover ── */
function PostOptionsMenu({ post, currentUser, onClose, T, onRequireAuth, anchorRect }) {
  const isOwn = currentUser?.id === post.user?.id;
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const menuRef = useRef(null);

  // Calculate position: appear to the left of the button, align top
  const menuWidth = 220;
  const vp = { w: window.innerWidth, h: window.innerHeight };
  let left = anchorRect ? anchorRect.right - menuWidth : vp.w - menuWidth - 12;
  let top  = anchorRect ? anchorRect.bottom + 6 : 60;
  if (left < 8) left = 8;
  if (left + menuWidth > vp.w - 8) left = vp.w - menuWidth - 8;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handlePostInfo = () => { setShowInfo(true); };

  const handleCopy = () => {
    const url = window.location.origin + '/post/' + post.id;
    navigator.clipboard?.writeText(url).catch(() => {});
    onClose();
  };

  const handleSaveFav = async () => {
    if (!api.hasToken()) { onRequireAuth?.(); onClose(); return; }
    try { await api.request(`/reels/${post.id}/save/`, { method: 'POST' }); } catch {}
    onClose();
  };

  const handleDownload = async () => {
    const src = mediaUrl(post.media || post.image || '');
    if (!src) { onClose(); return; }
    try {
      // For Cloudinary: insert fl_attachment to force download
      let downloadUrl = src;
      if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
        downloadUrl = src.replace('/upload/', '/upload/fl_attachment/');
      }
      const a = document.createElement('a');
      a.href = downloadUrl;
      const ext = src.split('.').pop()?.split('?')[0] || 'file';
      a.download = `flipstar_post_${post.id}.${ext}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {}
    onClose();
  };

  const handleNotInterested = async () => {
    if (!api.hasToken()) { onRequireAuth?.(); onClose(); return; }
    try { await api.request('/reels/not-interested/', { method: 'POST', body: JSON.stringify({ reel_id: post.id }), headers: { 'Content-Type': 'application/json' } }); } catch {}
    onClose();
  };
  const handleReport = async () => {
    if (!api.hasToken()) { onRequireAuth?.(); onClose(); return; }
    try { await api.request('/reports/create/', { method: 'POST', body: JSON.stringify({ reel: post.id, reason: 'inappropriate' }), headers: { 'Content-Type': 'application/json' } }); } catch {}
    onClose();
  };
  const handleDelete = async () => {
    if (!api.hasToken()) return;
    try { await api.request(`/reels/${post.id}/`, { method: 'DELETE' }); } catch {}
    onClose();
  };

  const groups = [
    [
      { Icon: Info,     label: 'Post Info',        action: handlePostInfo },
      { Icon: Link2,    label: 'Copy Link',         action: handleCopy },
      { Icon: Bookmark, label: 'Save to Favorites', action: handleSaveFav },
      { Icon: Download, label: 'Download',          action: handleDownload },
    ],
    [
      { Icon: Flag,  label: 'Not Interested', action: handleNotInterested },
      ...(isOwn
        ? [{ Icon: Trash2, label: 'Delete Post', action: handleDelete, danger: true }]
        : [{ Icon: Flag,   label: 'Report',      action: handleReport,  danger: true }]
      ),
    ],
  ];

  let idx = 0;
  return (
    <>
      <div
        ref={menuRef}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top, left, width: menuWidth,
          zIndex: 9200,
          background: T.cardBg || '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
          border: `1px solid ${T.border}`,
          overflow: 'hidden',
          animation: 'menuFadeIn 0.15s ease',
        }}
      >
        <style>{`@keyframes menuFadeIn { from { opacity:0; transform:scale(0.95) translateY(-6px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        {groups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div style={{ height: 1, background: T.border }} />}
            {group.map(opt => {
              const i = idx++;
              const { Icon } = opt;
              return (
                <button
                  key={opt.label}
                  onClick={opt.action}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '12px 16px',
                    background: hoveredIdx === i ? T.bg : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontSize: 14, fontWeight: 500,
                    color: opt.danger ? '#EF4444' : T.txt,
                    transition: 'background 0.12s',
                  }}
                >
                  <Icon size={17} strokeWidth={1.8} color={opt.danger ? '#EF4444' : T.sub} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {showInfo && <PostInfoSheet post={post} onClose={() => { setShowInfo(false); onClose(); }} T={T} />}
    </>
  );
}

/* ── Post Card ── */
const PostCard = memo(function PostCard({ post, currentUser, onShowProfile, onRequireAuth, onShowVideoDetail, index = 0, videoObserver }) {
  const { colors: T } = useTheme();
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likes, setLikes] = useState(post.votes || 0);
  const [saved, setSaved] = useState(post.is_saved || false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [optionsAnchor, setOptionsAnchor] = useState(null);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewCount, setViewCount] = useState(post.view_count || 0);
  const [shareToast, setShareToast] = useState('');
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const cardRef = useRef(null);
  const videoRef = useRef(null);

  // Campaign detection — a post is a campaign entry if the backend flagged it
  // (is_campaign_post) or it is linked to a campaign (campaign_id/campaign).
  const isCampaignPost = !!(post.is_campaign_post || post.campaign_id || post.campaign);
  const CAPTION_LIMIT = 140;
  const rafRef = useRef(null);
  const viewTracked = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), index * 60);
    return () => clearTimeout(t);
  }, [index]);

  // Track view when card is 50% visible for at least 1 second
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    let timer = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewTracked.current) {
          timer = setTimeout(async () => {
            viewTracked.current = true;
            try {
              const res = await api.request(`/reels/${post.id}/view/`, { method: 'POST' });
              if (res?.view_count !== undefined) setViewCount(res.view_count);
            } catch {}
          }, 1000);
        } else {
          if (timer) { clearTimeout(timer); timer = null; }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(card);
    return () => { observer.disconnect(); if (timer) clearTimeout(timer); };
  }, [post.id]);

  const handleMouseMove = (e) => {
    // Tilt + shine disabled: keep hover to scale/lift only.
    return;
    // eslint-disable-next-line no-unreachable
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const shineX = ((e.clientX - rect.left) / rect.width) * 100;
    const shineY = ((e.clientY - rect.top) / rect.height) * 100;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTilt({ x: -dy * 5, y: dx * 5 });
      setShine({ x: shineX, y: shineY, opacity: 0.18 });
    });
  };

  const handleMouseEnter = () => { setIsHovered(true); };
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleTouchStart = (e) => {
    setIsPressed(true);
    const touch = e.touches[0];
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const shineX = ((touch.clientX - rect.left) / rect.width) * 100;
    const shineY = ((touch.clientY - rect.top) / rect.height) * 100;
    setShine({ x: shineX, y: shineY, opacity: 0.22 });
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    setShine(s => ({ ...s, opacity: 0 }));
  };

  // Detect if this post has video media
  const raw = post.media || post.image || '';
  const isVideo = !!(post.media) && (
    /\.(mp4|webm|ogg|mov)(\?|$)/i.test(raw) ||
    raw.includes('/video/upload/')
  );
  const mediaSrc = mediaUrl(raw);
  const avatarSrc = post.user?.profile_photo ? mediaUrl(post.user.profile_photo) : null;

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!api.hasToken()) { onRequireAuth?.(); return; }
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    try { await api.request(`/reels/${post.id}/vote/`, { method: 'POST' }); } catch {}
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!api.hasToken()) { onRequireAuth?.(); return; }
    setSaved(s => !s);
    setSaveAnim(true);
    setTimeout(() => setSaveAnim(false), 300);
    try { await api.request(`/reels/${post.id}/save/`, { method: 'POST' }); } catch {}
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    const title = post.caption ? post.caption.slice(0, 80) : 'Check out this post on FlipStar';
    // Prefer native share (mobile + modern browsers), fall back to clipboard
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        // increment share count (best-effort)
        try { await api.request(`/reels/${post.id}/share/`, { method: 'POST' }); } catch {}
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // user cancelled
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareToast('🔗 Link copied!');
      setTimeout(() => setShareToast(''), 1800);
      try { await api.request(`/reels/${post.id}/share/`, { method: 'POST' }); } catch {}
    } catch {
      // Ultimate fallback: legacy exec
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setShareToast('🔗 Link copied!'); setTimeout(() => setShareToast(''), 1800); } catch { setShareToast('Could not copy'); setTimeout(() => setShareToast(''), 1800); }
      document.body.removeChild(ta);
    }
  };

  const handleVideoClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    // Navigate to Reels page for video posts (Instagram-style)
    if (onShowVideoDetail) {
      onShowVideoDetail(post.id);
    }
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
    setShowComments(true);
  };

  // IntersectionObserver to play/pause videos based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo || !videoObserver) return;

    videoObserver.observe(video);
    return () => videoObserver.unobserve(video);
  }, [isVideo, videoObserver]);

  const hashtags = Array.isArray(post.hashtags_list)
    ? post.hashtags_list
    : (post.hashtags || '').split(/\s+/).filter(Boolean);

  return (
    <>
      <style>{`
        @keyframes heartPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.45); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes savePop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .hp-btn { transition: transform 0.12s, opacity 0.15s, background 0.15s; }
        .hp-btn:active { transform: scale(0.82) !important; opacity: 0.7; }
        .hp-action:hover { background: var(--hp-hover) !important; border-radius: 10px; }
        .hp-action:hover svg { transform: scale(1.18); }
      `}</style>

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: T.cardBg || '#fff',
          borderRadius: 16,
          boxShadow: isHovered
            ? `0 16px 48px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.10)`
            : '0 2px 16px rgba(0,0,0,0.08)',
          border: `1px solid ${isHovered ? T.pri + '50' : T.border}`,
          overflow: 'hidden',
          marginBottom: 20,
          maxWidth: 560,
          width: '100%',
          position: 'relative',
          transform: mounted
            ? isPressed
              ? 'scale(0.985)'
              : `translateY(${isHovered ? -3 : 0}px) scale(${isHovered ? 1.015 : 1})`
            : 'translateY(28px) scale(0.97)',
          opacity: mounted ? 1 : 0,
          transition: isPressed
            ? 'transform 0.1s ease, box-shadow 0.1s'
            : 'transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease, opacity 0.4s ease, border-color 0.3s',
          willChange: 'transform',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 10 }}>
          <button
            className="hp-btn"
            onClick={(e) => { e.stopPropagation(); onShowProfile?.(post.user?.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', background: T.pri + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: `2px solid ${T.pri}30` }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                : '👤'}
            </div>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                className="hp-btn"
                onClick={(e) => { e.stopPropagation(); onShowProfile?.(post.user?.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 14, fontWeight: 700, color: T.txt }}
              >
                {post.user?.username || 'user'}
              </button>
              <CheckCircle size={14} fill={T.pri} color="#fff" />
            </div>
            <div style={{ fontSize: 12, color: T.sub }}>{timeAgo(post.created_at)}</div>
          </div>
          <button
            className="hp-btn"
            onClick={(e) => { e.stopPropagation(); setOptionsAnchor(e.currentTarget.getBoundingClientRect()); setShowOptions(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: T.sub, display: 'flex', alignItems: 'center' }}
          >
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Media */}
        <div
          style={{ position: 'relative', width: '100%', background: '#111', minHeight: 120, cursor: isVideo ? 'pointer' : 'default' }}
        >
          {mediaSrc && !imgError ? (
            isVideo ? (
              <>
                <video
                  ref={videoRef}
                  src={mediaSrc}
                  poster={post.image ? mediaUrl(post.image) : undefined}
                  preload="none"
                  loading="lazy"
                  style={{ width: '100%', maxHeight: 'clamp(160px, 38vh, 320px)', objectFit: 'cover', display: 'block', background: '#111' }}
                  playsInline
                  loop
                  muted
                  onPlay={() => setVideoPlaying(true)}
                  onPause={() => setVideoPlaying(false)}
                  onError={() => setImgError(true)}
                />
                {/* Clickable overlay to navigate to Reels */}
                <div
                  onClick={handleVideoClick}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    cursor: 'pointer',
                  }}
                />
              </>
            ) : (
              <img
                src={mediaSrc}
                alt={post.caption || ''}
                style={{ width: '100%', maxHeight: 'clamp(160px, 38vh, 320px)', objectFit: 'cover', display: 'block', cursor: 'default' }}
                onError={() => setImgError(true)}
              />
            )
          ) : (
            <div style={{ width: '100%', height: 260, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sub, fontSize: 14 }}>No media</div>
          )}

          {/* Play button overlay - only shows when paused */}
          {isVideo && !videoPlaying && (
            <div 
              onClick={handleVideoClick}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.25)',
                cursor: 'pointer',
                zIndex: 11,
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
              }}>
                <Play size={26} fill="#1C1917" color="#1C1917" style={{ marginLeft: 3 }} />
              </div>
            </div>
          )}

          {/* View count badge */}
          {mediaSrc && !imgError && (
            <div style={{
              position: 'absolute', bottom: 10, right: 10,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
              backdropFilter: 'blur(6px)',
              pointerEvents: 'none',
            }}>
              <Eye size={13} />
              {viewCount.toLocaleString()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '10px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {/* Like */}
              <button
                className="hp-btn hp-action"
                onClick={handleLike}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 10px', borderRadius: 10,
                  display: 'flex', alignItems: 'center', gap: 5,
                  animation: likeAnim ? 'heartPop 0.4s ease' : 'none',
                  '--hp-hover': liked ? '#EF444420' : T.border + '60',
                }}
              >
                {isCampaignPost ? (
                  <Trophy
                    size={24}
                    fill={liked ? (T.priFallback || T.pri) : 'none'}
                    color={liked ? (T.priFallback || T.pri) : T.txt}
                    style={{ transition: 'transform 0.15s' }}
                  />
                ) : (
                  <Heart
                    size={24}
                    fill={liked ? '#EF4444' : 'none'}
                    color={liked ? '#EF4444' : T.txt}
                    style={{ transition: 'transform 0.15s' }}
                  />
                )}
              </button>
              {/* Comment */}
              <button
                className="hp-btn hp-action"
                onClick={handleCommentClick}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 10px', borderRadius: 10,
                  display: 'flex', alignItems: 'center', gap: 5,
                  '--hp-hover': T.border + '60',
                }}
              >
                <MessageCircle size={24} color={T.txt} style={{ transition: 'transform 0.15s' }} />
              </button>
              {/* Share */}
              <button
                className="hp-btn hp-action"
                onClick={handleShare}
                title="Share"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 10px', borderRadius: 10,
                  display: 'flex', alignItems: 'center', gap: 5,
                  '--hp-hover': T.border + '60',
                }}
              >
                <Share2 size={24} color={T.txt} style={{ transition: 'transform 0.15s' }} />
                {post.shares > 0 && <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>{post.shares}</span>}
              </button>
            </div>
            {/* Save */}
            <button
              className="hp-btn hp-action"
              onClick={handleSave}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px 10px', borderRadius: 10,
                animation: saveAnim ? 'savePop 0.3s ease' : 'none',
                '--hp-hover': saved ? T.pri + '25' : T.border + '60',
              }}
            >
              <Bookmark
                size={24}
                fill={saved ? T.pri : 'none'}
                color={saved ? T.pri : T.txt}
              />
            </button>
          </div>

          {/* Like count */}
          <div style={{ fontSize: 14, fontWeight: 700, color: T.txt, marginTop: 4 }}>
            {likes.toLocaleString()} likes
          </div>

          {/* Caption with expand/collapse (Instagram/TikTok style) */}
          {post.caption && (() => {
            const isLong = post.caption.length > CAPTION_LIMIT;
            const shown = !isLong || captionExpanded
              ? post.caption
              : post.caption.slice(0, CAPTION_LIMIT).trimEnd() + '…';
            return (
              <div style={{ fontSize: 14, color: T.txt, marginTop: 4, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                <span style={{ fontWeight: 700 }}>{post.user?.username} </span>
                {shown}
                {isLong && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCaptionExpanded(v => !v); }}
                    style={{
                      background: 'none', border: 'none', padding: 0, marginLeft: 4,
                      color: T.sub, fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', lineHeight: 1.55,
                    }}
                  >
                    {captionExpanded ? 'less' : 'more'}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Recent comments preview */}
          {post.recent_comments && post.recent_comments.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {post.recent_comments.slice(0, 3).map((comment) => (
                <div 
                  key={comment.id}
                  onClick={handleCommentClick}
                  style={{ fontSize: 13, color: T.txt, marginTop: 3, cursor: 'pointer' }}
                >
                  <span style={{ fontWeight: 700 }}>{comment.user?.username}</span>
                  <span> {comment.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Comments link */}
          <button
            onClick={handleCommentClick}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontSize: 13, color: T.sub, display: 'block', marginTop: 4 }}
          >
            {commentCount > 0 ? `View all ${commentCount} comments` : 'Add a comment…'}
          </button>

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {hashtags.map((tag, i) => (
                <span key={i} style={{ fontSize: 13, color: T.pri, fontWeight: 600 }}>
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comment Sheet */}
      {showComments && (
        <CommentSheet
          post={post}
          currentUser={currentUser}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentCount(c => c + 1)}
          T={T}
        />
      )}

      {/* Post Options Popover */}
      {showOptions && (
        <PostOptionsMenu
          post={post}
          currentUser={currentUser}
          onClose={() => setShowOptions(false)}
          onRequireAuth={onRequireAuth}
          anchorRect={optionsAnchor}
          T={T}
        />
      )}

      {/* Share toast */}
      {shareToast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.88)', color: '#fff', padding: '10px 18px',
          borderRadius: 20, fontSize: 14, fontWeight: 600, zIndex: 10000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)', animation: 'toastIn 0.2s ease-out',
        }}>
          {shareToast}
        </div>
      )}
    </>
  );
});

const ALL_TABS = ['For You', 'Explore', 'Campaigns', 'Categories'];

export function HomePage({ user, onShowProfile, onShowPostPage, onRequireAuth, onShowExplorer, onShowCampaigns, onShowVideoDetail }) {
  const { colors: T } = useTheme();
  const [activeTab, setActiveTab] = useState('For You');
  const [posts, setPosts] = useState(() => readHomeCache() || []);
  const [loading, setLoading] = useState(() => !readHomeCache());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const videoObserverRef = useRef(null);
  const loaderRef = useRef(null);
  
  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef(null);

  const LIMIT = 10;
  const PULL_THRESHOLD = 80;

  // Create shared IntersectionObserver for all videos
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );
    
    videoObserverRef.current = observer;
    return () => observer.disconnect();
  }, []);

  const handleTabClick = (tab) => {
    if (tab === 'Explore') { onShowExplorer?.(); return; }
    if (tab === 'Campaigns') { onShowCampaigns?.(); return; }
    setActiveTab(tab);
  };

  const fetchPosts = useCallback(async (offset = 0, reset = false) => {
    try {
      setLoading(true);
      const data = await api.request(`/reels/?limit=${LIMIT}&offset=${offset}`);
      const results = Array.isArray(data) ? data : (data.results || []);
      const newPosts = reset ? results : [...posts, ...results];
      setPosts(newPosts);
      if (reset) writeHomeCache(newPosts); // Save to cache on initial fetch
      setHasMore(Array.isArray(data) ? results.length === LIMIT : !!data.next);
      setPage(offset);
    } catch (e) {
      console.error('HomePage fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Explore' || activeTab === 'Campaigns') return;
    // Only fetch if no cached data
    const cached = readHomeCache();
    if (!cached || cached.length === 0) {
      fetchPosts(0, true);
    }
  }, [activeTab, fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(page + LIMIT, false);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchPosts]);

  // Pull to refresh handlers
  const handleTouchStart = (e) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (isRefreshing || !containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    if (scrollTop === 0 && touchStartY.current > 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - touchStartY.current);
      if (distance > 0) {
        // React's synthetic touchmove listener is passive, so preventDefault
        // would be a no-op and just emit a console warning. Skip it and rely
        // on `overscroll-behavior: contain` to suppress the browser's own
        // pull-to-refresh.
        setPullDistance(Math.min(distance, PULL_THRESHOLD * 1.5));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      // Clear cache and fetch fresh data
      try {
        localStorage.removeItem('home_feed_cache');
        await fetchPosts(0, true);
      } catch (e) {
        console.error('Refresh error:', e);
      }
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 500);
    } else {
      setPullDistance(0);
    }
    touchStartY.current = 0;
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: '100vh', background: T.bg, overflowY: 'auto', position: 'relative', overscrollBehaviorY: 'contain', touchAction: 'pan-y' }}
    >
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: pullDistance,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(180deg, ${T.bg} 0%, transparent 100%)`,
          zIndex: 40,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `3px solid ${T.pri}`,
            borderTopColor: 'transparent',
            animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
            transform: `rotate(${(pullDistance / PULL_THRESHOLD) * 360}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.1s',
          }} />
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Tab bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: T.cardBg || '#fff',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        padding: '0 12px',
        gap: 0,
        WebkitOverflowScrolling: 'touch',
      }}>
        <style>{`.hp-tabbar::-webkit-scrollbar { display: none; }`}</style>
        {ALL_TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              style={{
                background: isActive ? T.pri : 'transparent',
                border: `1.5px solid ${isActive ? T.pri : T.border}`,
                borderRadius: 24,
                padding: '8px 18px',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#fff' : T.sub,
                cursor: 'pointer',
                transition: 'all 0.18s',
                margin: '6px 3px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = T.pri; e.currentTarget.style.color = T.pri; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.sub; } }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {loading && posts.length === 0 ? (
          [1,2,3].map(i => (
            <div key={i} style={{
              width: '100%', maxWidth: 560, background: T.cardBg || '#fff',
              borderRadius: 16, border: `1px solid ${T.border}`,
              overflow: 'hidden', marginBottom: 20,
            }}>
              <div style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: T.border }} />
                <div>
                  <div style={{ width: 100, height: 12, background: T.border, borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ width: 60, height: 10, background: T.border, borderRadius: 5 }} />
                </div>
              </div>
              <div style={{ width: '100%', height: 300, background: T.border }} />
              <div style={{ padding: 16 }}>
                <div style={{ width: 80, height: 12, background: T.border, borderRadius: 6, marginBottom: 8 }} />
                <div style={{ width: '70%', height: 10, background: T.border, borderRadius: 5 }} />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: T.sub }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No posts yet</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Be the first to share something!</div>
          </div>
        ) : (
          posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              currentUser={user}
              onShowProfile={onShowProfile}
              onRequireAuth={onRequireAuth}
              onShowVideoDetail={onShowVideoDetail}
              videoObserver={videoObserverRef.current}
            />
          ))
        )}

        {/* Infinite scroll loader */}
        <div ref={loaderRef} style={{ height: 40, width: '100%' }} />
        {loading && posts.length > 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: T.sub, fontSize: 14 }}>
            Loading more...
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: T.sub, fontSize: 13 }}>
            You're all caught up ✓
          </div>
        )}
      </div>
    </div>
  );
}
