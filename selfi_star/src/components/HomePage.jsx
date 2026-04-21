import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Heart, Trophy, MessageCircle, Share2, Bookmark, MoreHorizontal, Eye, CheckCircle, Play, X, Send, Info, Link2, Download, Flag, Trash2 } from 'lucide-react';
import api from '../api';
import config from '../config';
import { useTheme } from '../contexts/ThemeContext';
import realtimeService from '../services/RealtimeService';

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
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes for faster post distribution

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

// ── Local like/save state ──────────────────────────────────────────────────
// The feed is cached for 30 min, so when the user likes a post and then
// comes back, the server-side `is_liked` on the cached payload is stale and
// the heart appears un-filled again.  We fix this by mirroring like/save
// toggles in localStorage and merging them on top of cached posts.
const LIKES_KEY = 'liked_post_ids';
const SAVES_KEY = 'saved_post_ids';
function readIdSet(key) {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function writeIdSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch {}
}
function toggleIdInSet(key, id, on) {
  const s = readIdSet(key);
  if (on) s.add(id); else s.delete(id);
  writeIdSet(key, s);
}
function mergeLocalEngagement(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return posts;
  const liked = readIdSet(LIKES_KEY);
  const saved = readIdSet(SAVES_KEY);
  if (liked.size === 0 && saved.size === 0) return posts;
  return posts.map(p => {
    const wasLikedLocal = liked.has(p.id);
    const wasSavedLocal = saved.has(p.id);
    // Only fill in if local says "liked" — we don't want to un-like a post
    // the server knows we liked on another device.
    return {
      ...p,
      is_liked: p.is_liked || wasLikedLocal,
      is_saved: p.is_saved || wasSavedLocal,
    };
  });
}

/* ── Comment Sheet ── */
const CommentSheet = memo(function CommentSheet({ post, currentUser, onClose, T, onCommentAdded }) {
  // Seed from the feed payload so the sheet paints instantly with whatever
  // the backend already shipped — no loading spinner on first open.  The
  // full list is fetched in the background and replaces the seed.
  const [comments, setComments] = useState(() =>
    Array.isArray(post.recent_comments) ? post.recent_comments : []
  );
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    // Use the extended endpoint that includes replies
    api.request(`/comments/?reel=${post.id}&include_replies=true`)
      .then(d => {
        if (cancelled) return;
        const full = Array.isArray(d) ? d : (d?.results || []);
        // Drop any temp (optimistic) entries that the server now knows about.
        setComments(prev => {
          const temps = prev.filter(c => String(c.id).startsWith('temp-'));
          const seen = new Set(full.map(c => c.id));
          const keepTemps = temps.filter(t => !seen.has(t.serverId));
          return [...full, ...keepTemps];
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [post.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    if (!api.hasToken()) return;
    const draft = text.trim();
    // Optimistic insert — user sees their comment immediately.  On error
    // we remove the temp row; on success we swap it for the server row.
    const tempId = `temp-${Date.now()}`;
    const temp = {
      id: tempId,
      text: draft,
      user: currentUser || { username: 'you', profile_photo: null },
      created_at: new Date().toISOString(),
      likes: 0,
      is_liked: false,
      pending: true,
    };
    if (replyingTo) {
      setComments(prev => prev.map(c =>
        c.id === replyingTo.id
          ? { ...c, replies: [...(c.replies || []), temp] }
          : c
      ));
    } else {
      setComments(prev => [...prev, temp]);
    }
    setText('');
    const replyTarget = replyingTo;
    setReplyingTo(null);
    setSending(true);
    onCommentAdded?.();                     // bump count in parent immediately

    try {
      const body = replyTarget
        ? { reel: post.id, text: draft, parent: replyTarget.id }
        : { reel: post.id, text: draft };
      const res = await api.request('/comments/', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });
      // Swap temp for real server row
      if (replyTarget) {
        setComments(prev => prev.map(c =>
          c.id === replyTarget.id
            ? { ...c, replies: (c.replies || []).map(r => r.id === tempId ? res : r) }
            : c
        ));
      } else {
        setComments(prev => prev.map(c => c.id === tempId ? res : c));
      }
    } catch (err) {
      // Roll back optimistic insert + put the draft back in the box.
      if (replyTarget) {
        setComments(prev => prev.map(c =>
          c.id === replyTarget.id
            ? { ...c, replies: (c.replies || []).filter(r => r.id !== tempId) }
            : c
        ));
      } else {
        setComments(prev => prev.filter(c => c.id !== tempId));
      }
      setText(draft);
      console.error('[Comment] post failed:', err);
    } finally { setSending(false); }
  };

  const handleLikeComment = async (comment) => {
    if (!api.hasToken()) return;
    try {
      await api.request(`/comments/${comment.id}/like/`, { method: 'POST' });
      setComments(prev => prev.map(c => 
        c.id === comment.id 
          ? { ...c, is_liked: !c.is_liked, likes: (c.likes || 0) + (c.is_liked ? -1 : 1) }
          : c
      ));
    } catch {}
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setText('');
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'flex-end' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: T?.cardBg || '#fff', borderRadius: '20px 20px 0 0', maxHeight: '75vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: `1px solid ${T?.border || '#e0e0e0'}` }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: T?.txt || '#000' }}>Comments</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T?.sub || '#666' }}><X size={20} /></button>
        </div>
        {/* Comments list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: T?.sub || '#666', padding: 30, fontSize: 14 }}>No comments yet. Be first!</div>
          ) : comments.map(c => (
            <div key={c.id} style={{ marginBottom: 20 }}>
              {/* Main comment */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: (T?.pri || '#000') + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {c.user?.profile_photo ? <img src={mediaUrl(c.user.profile_photo)} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: T?.txt || '#000' }}>{c.user?.username}</span>
                    <span style={{ fontSize: 13, color: T?.txt || '#000' }}>{c.text}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: T?.sub || '#666' }}>{timeAgo(c.created_at)}</span>
                    {api.hasToken() && (
                      <>
                        <button
                          onClick={() => handleLikeComment(c)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Heart size={14} fill={c.is_liked ? (T?.pri || '#000') : 'none'} color={c.is_liked ? (T?.pri || '#000') : T?.sub || '#666'} />
                          {c.likes > 0 && <span style={{ fontSize: 11, color: T?.sub || '#666' }}>{c.likes}</span>}
                        </button>
                        <button
                          onClick={() => handleReply(c)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <MessageCircle size={14} color={T?.sub || '#666'} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Replies */}
              {c.replies && c.replies.length > 0 && (
                <div style={{ marginLeft: 44, marginTop: 12 }}>
                  {c.replies.map(r => (
                    <div key={r.id} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: (T?.pri || '#000') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                        {r.user?.profile_photo ? <img src={mediaUrl(r.user.profile_photo)} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: T?.txt || '#000' }}>{r.user?.username}</span>
                          <span style={{ fontSize: 12, color: T?.txt || '#000' }}>
                            <span style={{ color: T?.pri || '#DA9B2A', fontWeight: 600 }}>@{c.user?.username}</span> {r.text}
                          </span>
                        </div>
                        <span style={{ fontSize: 10, color: T?.sub || '#666', marginTop: 2 }}>{timeAgo(r.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Input */}
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 16px', borderTop: `1px solid ${T?.border || '#e0e0e0'}` }}>
          {replyingTo && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: (T?.pri || '#000') + '10', borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: T?.txt || '#000' }}>
                Replying to <strong>@{replyingTo.user?.username}</strong>
              </span>
              <button
                onClick={handleCancelReply}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: T?.sub || '#666' }}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={replyingTo ? `Reply to @${replyingTo.user?.username}...` : (api.hasToken() ? 'Add a comment…' : 'Log in to comment')}
              disabled={!api.hasToken()}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 24, border: `1px solid ${T?.border || '#e0e0e0'}`, background: T?.cardBg || '#fff', color: T?.txt || '#000', fontSize: 14, outline: 'none' }}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending || !api.hasToken()}
              style={{ background: T?.pri || '#000', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (!text.trim() || sending) ? 0.5 : 1, transition: 'opacity 0.2s, transform 0.1s', flexShrink: 0 }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Send size={16} color="#fff" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

/* ── Post Info Sheet ── */
const PostInfoSheet = memo(function PostInfoSheet({ post, onClose, T }) {
  const raw = post.media || post.image || '';
  const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(raw) || raw.includes('/video/upload/');
  const avatarSrc = post.user?.profile_photo ? mediaUrl(post.user.profile_photo) : null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9300, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: T?.cardBg || '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', boxSizing: 'border-box' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T?.border || '#e0e0e0', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: T?.txt || '#000', marginBottom: 16 }}>Post Info</div>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px', background: T?.cardBg || '#fff', borderRadius: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: (T?.pri || '#000') + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {avatarSrc ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T?.txt || '#000' }}>@{post.user?.username || 'unknown'}</div>
            <div style={{ fontSize: 12, color: T?.sub || '#666' }}>{post.user?.full_name || ''}</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[['❤️', post.votes || 0, 'Likes'], ['💬', post.comment_count || 0, 'Comments'], ['👁️', post.view_count || 0, 'Views']].map(([emoji, val, lbl]) => (
            <div key={lbl} style={{ flex: 1, background: T?.cardBg || '#fff', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 18 }}>{emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T?.txt || '#000' }}>{Number(val).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: T?.sub || '#666' }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Meta */}
        <div style={{ fontSize: 13, color: T?.sub || '#666', marginBottom: post.caption ? 10 : 0 }}>
          <span style={{ color: T?.pri || '#000', fontWeight: 600 }}>{isVideo ? '🎬 Video' : '🖼️ Image'}</span>
          {' · '}
          {timeAgo(post.created_at)}
        </div>

        {/* Caption */}
        {post.caption && (
          <div style={{ fontSize: 14, color: T?.txt || '#000', lineHeight: 1.55, marginTop: 8 }}>
            <span style={{ fontWeight: 700 }}>@{post.user?.username} </span>
            {post.caption}
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 12, background: T?.cardBg || '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: T?.txt || '#000' }}>Close</button>
      </div>
    </div>
  );
});

/* ── Post Options Popover ── */
const PostOptionsMenu = memo(function PostOptionsMenu({ post, currentUser, onClose, T, onRequireAuth, anchorRect }) {
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
          background: T?.cardBg || '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
          border: `1px solid ${T?.border || '#e0e0e0'}`,
          overflow: 'hidden',
          animation: 'menuFadeIn 0.15s ease',
        }}
      >
        <style>{`@keyframes menuFadeIn { from { opacity:0; transform:scale(0.95) translateY(-6px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        {groups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div style={{ height: 1, background: T?.border || '#e0e0e0' }} />}
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
                    background: hoveredIdx === i ? T?.cardBg || '#fff' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontSize: 14, fontWeight: 500,
                    color: opt.danger ? '#EF4444' : T?.txt || '#000',
                    transition: 'background 0.12s',
                  }}
                >
                  <Icon size={17} strokeWidth={1.8} color={opt.danger ? '#EF4444' : T?.sub || '#666'} />
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
});

/* ── Post Card ── */
const PostCard = memo(function PostCard({ post, index, currentUser, T, onShowProfile, onRequireAuth, onNavigateToReel, onCommentAdded, onVoteAdded, onShowVideoDetail, videoObserver }) {
  // Seed from post + any persisted local state so the heart stays filled
  // even when the cached feed's `is_liked` is stale.
  const [liked, setLiked] = useState(() => post.is_liked || readIdSet(LIKES_KEY).has(post.id));
  const [likes, setLikes] = useState(post.votes || 0);
  const [saved, setSaved] = useState(() => post.is_saved || readIdSet(SAVES_KEY).has(post.id));
  const [likeAnim, setLikeAnim] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [optionsAnchor, setOptionsAnchor] = useState(null);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  // Inline comments — seed from backend-provided recent_comments so we
  // paint instantly without a per-card fetch.
  const [inlineComments, setInlineComments] = useState(
    Array.isArray(post.recent_comments) ? post.recent_comments.slice(0, 3) : []
  );
  const [showAllInline, setShowAllInline] = useState(false);

  // ── Re-sync local UI with prop changes ────────────────────────────────────
  // When the feed background-refreshes, the same card receives a new `post`
  // object with fresh server values.  Without this effect, the local
  // `likes` / `commentCount` numbers would stick at whatever they were when
  // the card first mounted (the bug the user reported: "it counts the next
  // time not count — as it wants").
  useEffect(() => {
    setLikes(post.votes || 0);
    setCommentCount(post.comment_count || 0);
    setLiked(prev => prev || !!post.is_liked || readIdSet(LIKES_KEY).has(post.id));
    setSaved(prev => prev || !!post.is_saved || readIdSet(SAVES_KEY).has(post.id));
    if (Array.isArray(post.recent_comments) && post.recent_comments.length) {
      setInlineComments(post.recent_comments.slice(0, 3));
    }
  }, [post.id, post.votes, post.comment_count, post.is_liked, post.is_saved, post.recent_comments]);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
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

  // Check if this user has already viewed this post (persisted in localStorage)
  const hasViewedPost = () => {
    try {
      const userId = currentUser?.id || 'anonymous';
      const viewedPosts = JSON.parse(localStorage.getItem(`viewed_posts_${userId}`) || '[]');
      return viewedPosts.includes(post.id);
    } catch {
      return false;
    }
  };

  // Mark this post as viewed by this user
  const markPostAsViewed = () => {
    try {
      const userId = currentUser?.id || 'anonymous';
      const viewedPosts = JSON.parse(localStorage.getItem(`viewed_posts_${userId}`) || '[]');
      if (!viewedPosts.includes(post.id)) {
        viewedPosts.push(post.id);
        localStorage.setItem(`viewed_posts_${userId}`, JSON.stringify(viewedPosts));
      }
    } catch {}
  };

  // Track view when card is 50% visible for at least 1 second
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    
    // Skip if already viewed by this user
    if (hasViewedPost()) return;
    
    let timer = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewTracked.current) {
          timer = setTimeout(async () => {
            viewTracked.current = true;
            markPostAsViewed();
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
  }, [post.id, currentUser?.id]);

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
    // Optimistic UI + persist locally so the heart survives feed re-renders,
    // cache reloads, and navigation roundtrips.
    setLiked(newLiked);
    setLikes(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    toggleIdInSet(LIKES_KEY, post.id, newLiked);
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    try {
      await api.request(`/reels/${post.id}/vote/`, { method: 'POST' });
    } catch (err) {
      // Rollback on failure so the count doesn't drift from truth.
      setLiked(!newLiked);
      setLikes(prev => newLiked ? Math.max(0, prev - 1) : prev + 1);
      toggleIdInSet(LIKES_KEY, post.id, !newLiked);
      console.error('[HomePage] Vote failed:', err);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!api.hasToken()) { onRequireAuth?.(); return; }
    const newSaved = !saved;
    setSaved(newSaved);
    toggleIdInSet(SAVES_KEY, post.id, newSaved);
    setSaveAnim(true);
    setTimeout(() => setSaveAnim(false), 300);
    try {
      await api.request(`/reels/${post.id}/save/`, { method: 'POST' });
    } catch (err) {
      setSaved(!newSaved);
      toggleIdInSet(SAVES_KEY, post.id, !newSaved);
      console.error('[HomePage] Save failed:', err);
    }
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
          background: T?.cardBg || '#fff',
          borderRadius: 16,
          boxShadow: isHovered
            ? `0 16px 48px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.10)`
            : '0 2px 16px rgba(0,0,0,0.08)',
          border: `1px solid ${isHovered ? (T?.pri || '#000') + '50' : T?.border || '#e0e0e0'}`,
          overflow: 'hidden',
          marginBottom: 6,
          // Cap total card height so header + media + actions + caption all
          // fit in one mobile viewport without scrolling.  Reserve ~110px
          // for the sticky tabs at top + bottom nav + page padding.
          maxHeight: 'calc(100vh - 140px)',
          maxWidth: 560,
          width: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          transform: isPressed
            ? 'scale(0.985)'
            : `translateY(${isHovered ? -3 : 0}px) scale(${isHovered ? 1.015 : 1})`,
          transition: isPressed
            ? 'transform 0.1s ease, box-shadow 0.1s'
            : 'transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease, border-color 0.3s',
          willChange: 'transform',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', gap: 8, flexShrink: 0 }}>
          <button
            className="hp-btn"
            onClick={(e) => { e.stopPropagation(); onShowProfile?.(post.user?.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          >
            <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', background: (T?.pri || '#000') + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: `1px solid ${(T?.pri || '#000')}20` }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                : '??'}
            </div>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <button
                className="hp-btn"
                onClick={(e) => { e.stopPropagation(); onShowProfile?.(post.user?.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 700, color: T?.txt || '#000' }}
              >
                {post.user?.username || 'user'}
              </button>
              <CheckCircle size={12} fill={T?.pri || '#000'} color="#fff" />
            </div>
            <div style={{ fontSize: 11, color: T?.sub || '#666' }}>{timeAgo(post.created_at)}</div>
          </div>
          <button
            className="hp-btn"
            onClick={(e) => { e.stopPropagation(); setOptionsAnchor(e.currentTarget.getBoundingClientRect()); setShowOptions(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: T?.sub || '#666', display: 'flex', alignItems: 'center' }}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Media — flexes to fill remaining card height so the whole post
            (header + media + actions + caption) fits in one viewport. */}
        <div
          style={{
            position: 'relative', width: '100%', background: 'transparent',
            flex: '1 1 auto',
            minHeight: 0,
            maxHeight: 'calc(100vh - 280px)',
            // Remove fixed aspect ratio to allow media to display at natural dimensions
            cursor: isVideo ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0',
            overflow: 'hidden',
          }}
        >
          {mediaSrc && !imgError ? (
            isVideo ? (
              <>
                <video
                  ref={videoRef}
                  src={mediaSrc}
                  poster={post.image ? mediaUrl(post.image) : undefined}
                  preload={index === 0 ? 'metadata' : 'none'}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', background: 'transparent', pointerEvents: 'none' }}
                  playsInline
                  loop
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
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', cursor: 'default' }}
                onError={() => setImgError(true)}
              />
            )
          ) : (
            <div style={{ width: '100%', height: 260, background: T?.cardBg || '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T?.sub || '#666', fontSize: 14 }}>No media</div>
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
              position: 'absolute', bottom: 8, right: 8,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 3,
              backdropFilter: 'blur(6px)',
              pointerEvents: 'none',
              zIndex: 5,
              maxWidth: 'calc(100% - 16px)',
            }}>
              <Eye size={12} />
              {viewCount.toLocaleString()}
            </div>
          )}
        </div>

        {/* Actions + caption - compact so everything fits in one viewport. */}
        <div style={{ padding: '4px 10px 8px', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {/* Like */}
              <button
                className="hp-btn hp-action"
                onClick={handleLike}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 3,
                  '--hp-hover': (T?.border || '#e0e0e0') + '60',
                }}
              >
                {isCampaignPost ? (
                  <Trophy
                    size={16}
                    fill={liked ? T?.pri || '#000' : 'none'}
                    color={liked ? T?.pri || '#000' : T?.txt || '#000'}
                    style={{ transition: 'transform 0.15s' }}
                  />
                ) : (
                  <Heart
                    size={16}
                    fill={liked ? '#EF4444' : 'none'}
                    color={liked ? '#EF4444' : T?.txt || '#000'}
                    style={{ transition: 'transform 0.15s' }}
                  />
                )}
                <span style={{ fontSize: 11, color: T?.sub || '#666', fontWeight: 600 }}>{likes > 0 ? likes : ''}</span>
              </button>
              {/* Comment */}
              <button
                className="hp-btn hp-action"
                onClick={handleCommentClick}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 3,
                  '--hp-hover': (T?.border || '#e0e0e0') + '60',
                }}
              >
                <MessageCircle size={16} color={T?.txt || '#000'} style={{ transition: 'transform 0.15s' }} />
                <span style={{ fontSize: 11, color: T?.sub || '#666', fontWeight: 600 }}>{commentCount > 0 ? commentCount : ''}</span>
              </button>
              {/* Share */}
              <button
                className="hp-btn hp-action"
                onClick={handleShare}
                title="Share"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 3,
                  '--hp-hover': (T?.border || '#e0e0e0') + '60',
                }}
              >
                <Share2 size={16} color={T?.txt || '#000'} style={{ transition: 'transform 0.15s' }} />
                <span style={{ fontSize: 11, color: T?.sub || '#666', fontWeight: 600 }}>{post.shares > 0 ? post.shares : ''}</span>
              </button>
            </div>
            {/* Save */}
            <button
              className="hp-btn hp-action"
              onClick={handleSave}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 6px', borderRadius: 8,
                animation: saveAnim ? 'savePop 0.3s ease' : 'none',
                '--hp-hover': saved ? (T?.pri || '#000') + '25' : (T?.border || '#e0e0e0') + '60',
              }}
            >
              <Bookmark
                size={16}
                fill={saved ? T?.pri || '#000' : 'none'}
                color={saved ? T?.pri || '#000' : T?.txt || '#000'}
              />
            </button>
          </div>

          {/* Caption - minimized, only if caption exists */}
          {post.caption && (
            <div
              onClick={(e) => { e.stopPropagation(); setCaptionExpanded(v => !v); }}
              style={{
                fontSize: 12, color: T?.txt || '#000', marginTop: 1, lineHeight: 1.3,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: captionExpanded ? 'unset' : 1,
                overflow: 'hidden',
                wordBreak: 'break-word',
                cursor: 'pointer',
              }}
            >
              {post.caption}
            </div>
          )}
          {inlineComments.length > 0 && (
            <div style={{ marginTop: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {inlineComments.slice(0, 1).map(c => (
                <div
                  key={c.id}
                  onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                  style={{
                    fontSize: 12, color: T?.txt || '#000', lineHeight: 1.3,
                    display: '-webkit-box', WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 1, overflow: 'hidden',
                    wordBreak: 'break-word', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{c.user?.username} </span>
                  {c.text}
                </div>
              ))}
            </div>
          )}

          {/* Comments link */}
          <button
            onClick={handleCommentClick}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, fontSize: 12, color: T?.sub || '#666',
              display: 'block', marginTop: post.caption || inlineComments.length ? 2 : 0,
            }}
          >
            {commentCount > 0 ? `View all ${commentCount} comments` : 'Add a comment...'}
          </button>

          {/* Hashtags - after comments link */}
          {Array.isArray(post.hashtags_list) && post.hashtags_list.length > 0 && (
            <div style={{
              fontSize: 13, marginTop: 4,
            }}>
              {post.hashtags_list.map(tag => (
                <span key={tag} style={{ color: T?.pri || '#DA9B2A', fontWeight: 600, marginRight: 4 }}>
                  #{tag}
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
  // Seed from cache + merge persisted like/save state so the heart stays
  // filled on the very first paint.
  const [posts, setPosts] = useState(() => mergeLocalEngagement(readHomeCache() || []));
  const [loading, setLoading] = useState(() => !readHomeCache());
  const [mounted, setMounted] = useState(false); // Prevent flash on initial load
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const videoObserverRef = useRef(null);
  const loaderRef = useRef(null);
  
  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef(null);

  // Prevent flash on initial load
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const LIMIT = 5; // Load fewer posts initially for faster LCP
  const PULL_THRESHOLD = 80;

  // Create shared IntersectionObserver for all videos
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch((err) => {
              if (err.name !== 'AbortError') console.log('Play error:', err);
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.3, rootMargin: '50px' }
    );
    
    videoObserverRef.current = observer;
    return () => observer.disconnect();
  }, []);

  const handleTabClick = (tab) => {
    if (tab === 'Explore') { onShowExplorer?.(); return; }
    if (tab === 'Campaigns') { onShowCampaigns?.(); return; }
    setActiveTab(tab);
  };

  // Use ref to avoid stale closure on `posts` inside fetchPosts without
  // re-creating the callback (which would trash memoization in child effects).
  const postsRef = useRef(posts);
  useEffect(() => { postsRef.current = posts; }, [posts]);

  const fetchPosts = useCallback(async (offset = 0, reset = false) => {
    try {
      setLoading(true);
      const limit = reset ? LIMIT * 2 : LIMIT;
      const data = await api.request(`/reels/?limit=${limit}&offset=${offset}`);
      const results = Array.isArray(data) ? data : (data.results || []);
      // Merge persisted like/save state so the heart doesn't flip off when
      // the server returns a stale is_liked for a just-liked post.
      const merged = mergeLocalEngagement(results);
      const newPosts = reset ? merged : [...postsRef.current, ...merged];
      setPosts(newPosts);
      if (reset) writeHomeCache(newPosts);
      setHasMore(Array.isArray(data) ? results.length === limit : !!data.next);
      setPage(offset);
    } catch (e) {
      console.error('[HomePage] Fetch error:', e);
      if (reset) {
        const cached = readHomeCache();
        if (cached && cached.length > 0) setPosts(mergeLocalEngagement(cached));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup real-time listeners for post updates
  useEffect(() => {
    // Listen for new posts from other tabs
    const handleNewPost = (postData) => {
      console.log('HomePage: New post received:', postData);
      // Clear cache and refresh feed to show new post
      try {
        localStorage.removeItem(CACHE_KEY);
        fetchPosts(0, true);
      } catch (error) {
        console.error('Error refreshing HomePage for new post:', error);
      }
    };

    // Listen for feed refresh requests
    const handleFeedRefresh = () => {
      console.log('HomePage: Feed refresh requested');
      // Clear cache and refresh feed
      try {
        localStorage.removeItem(CACHE_KEY);
        fetchPosts(0, true);
      } catch (error) {
        console.error('Error refreshing HomePage feed:', error);
      }
    };

    // Add event listeners
    realtimeService.addEventListener('NEW_POST', handleNewPost);
    realtimeService.addEventListener('FEED_REFRESH', handleFeedRefresh);

    // Cleanup on unmount
    return () => {
      realtimeService.removeEventListener('NEW_POST', handleNewPost);
      realtimeService.removeEventListener('FEED_REFRESH', handleFeedRefresh);
    };
  }, []);

  // Track whether this tab has ever loaded, to avoid redundant re-fetches
  // when the user navigates back to Home from another page.
  const loadedTabsRef = useRef(new Set());

  useEffect(() => {
    if (activeTab === 'Explore' || activeTab === 'Campaigns') return;
    const cached = readHomeCache();
    if (cached && cached.length > 0) {
      setPosts(mergeLocalEngagement(cached));
      setLoading(false);
      // Only refresh in background ONCE per session per tab, not on every
      // remount. api.js request-dedup makes repeat calls cheap, but this
      // avoids kicking off a background fetch when the user just briefly
      // left and came back.
      if (!loadedTabsRef.current.has(activeTab)) {
        loadedTabsRef.current.add(activeTab);
        setTimeout(() => fetchPosts(0, true), 2000);
      }
    } else {
      loadedTabsRef.current.add(activeTab);
      fetchPosts(0, true);
    }
  }, [activeTab, fetchPosts]);

  // ── Scroll to top on mount + tab change ───────────────────────────────────
  // Fixes the bug where Home sometimes opened scrolled to the bottom: if the
  // browser restored a stale scroll position or an infinite-scroll fetch
  // slipped in before paint, we'd land deep in the feed.  Force top.
  useEffect(() => {
    // Run in a microtask so the new posts have painted and the container
    // actually has a scrollHeight to scroll within.
    const snap = () => {
      if (containerRef.current) containerRef.current.scrollTop = 0;
      try { window.scrollTo(0, 0); } catch {}
    };
    snap();
    const t = setTimeout(snap, 50);     // belt-and-braces after paint
    return () => clearTimeout(t);
  }, [activeTab]);

  // Scroll to top + refresh when user taps the already-active home tab icon
  useEffect(() => {
    const handleTabReselect = (e) => {
      if (e.detail?.tab !== 'home') return;
      if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      fetchPosts(0, true);
    };
    window.addEventListener('tabReselected', handleTabReselect);
    return () => window.removeEventListener('tabReselected', handleTabReselect);
  }, [fetchPosts]);

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
      style={{ height: '100vh', background: T?.bg || '#fff', overflowY: 'auto', overflowX: 'hidden', position: 'relative', overscrollBehaviorY: 'contain', touchAction: 'pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
          background: `linear-gradient(180deg, ${T?.bg || '#fff'} 0%, transparent 100%)`,
          zIndex: 40,
        }}>
          <div style={{
            width: 32,
            height: 32,
          }} />
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16,
        position: 'sticky', top: 0, zIndex: 10,
        background: T?.bg || '#f5f5f5', padding: '8px 0',
        backdropFilter: 'blur(10px)',
      }}>
        {ALL_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            style={{
              padding: '8px 16px', borderRadius: 20,
              border: 'none', cursor: 'pointer',
              background: activeTab === tab ? (T?.pri || '#000') : (T?.cardBg || '#fff'),
              color: activeTab === tab ? '#fff' : (T?.txt || '#000'),
              fontWeight: 600, fontSize: 14,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feed — tight padding so each post fits fully in the viewport. */}
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '8px 8px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {loading && posts.length === 0 ? (
          [1,2,3].map(i => (
            <div key={i} style={{
              width: '100%', maxWidth: 560, background: T?.cardBg || '#fff',
              borderRadius: 16, border: `1px solid ${T?.border || '#e0e0e0'}`,
              overflow: 'hidden', marginBottom: 20,
            }}>
              <div style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: T?.border || '#e0e0e0' }} />
                <div>
                  <div style={{ width: 100, height: 12, background: T?.border || '#e0e0e0', borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ width: 60, height: 10, background: T?.border || '#e0e0e0', borderRadius: 5 }} />
                </div>
              </div>
              <div style={{ width: '100%', height: 300, background: T?.border || '#e0e0e0' }} />
              <div style={{ padding: 16 }}>
                <div style={{ width: 80, height: 12, background: T?.border || '#e0e0e0', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ width: '70%', height: 10, background: T?.border || '#e0e0e0', borderRadius: 5 }} />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: T?.sub || '#666' }}>
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
              onCommentAdded={() => {}}
              onVoteAdded={() => {}}
              videoObserver={videoObserverRef.current}
            />
          ))
        )}

        {/* Infinite scroll loader */}
        <div ref={loaderRef} style={{ height: 40, width: '100%' }} />
        {loading && posts.length > 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: T?.sub || '#666', fontSize: 14 }}>
            Loading more...
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: T?.sub || '#666', fontSize: 13 }}>
            You're all caught up ✓
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
