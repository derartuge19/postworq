import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  ArrowLeft, Send, Search, Edit3, Trash2, MoreVertical, X, PenSquare,
} from 'lucide-react';
import api from '../api';
import config from '../config';
import { useTheme } from '../contexts/ThemeContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const relTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = Date.now();
  const s = Math.max(1, Math.round((now - d.getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
};

const clockTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getPhotoUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  return `${config.API_BASE_URL.replace('/api', '')}${photo}`;
};

const Avatar = ({ user, size = 44 }) => {
  const url = getPhotoUrl(user?.profile_photo);
  if (url) {
    return (
      <img
        src={url}
        alt={user?.username || ''}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          background: '#e5e5e5',
        }}
      />
    );
  }
  const initial = (user?.username || '?')[0].toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg,#DA9B2A,#F59E0B)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800, fontSize: size * 0.38, flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
};

// ─── New Chat Modal: search users + start conversation ────────────────────────
function NewChatModal({ onClose, onSelectUser, T }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await api.request(`/messages/users/search/?q=${encodeURIComponent(q.trim())}`);
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch { if (!cancelled) setResults([]); }
      finally { if (!cancelled) setLoading(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 5000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.cardBg, borderRadius: 18, width: '100%', maxWidth: 480,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.txt }}>New Message</div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.sub, padding: 4, display: 'flex',
          }}>
            <X size={22} />
          </button>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: T.bg, borderRadius: 12, padding: '10px 14px',
          }}>
            <Search size={18} color={T.sub} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users..."
              style={{
                flex: 1, border: 'none', outline: 'none',
                background: 'transparent', color: T.txt, fontSize: 15,
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading && <div style={{ padding: 24, textAlign: 'center', color: T.sub, fontSize: 14 }}>Searching...</div>}
          {!loading && q.trim() && results.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: T.sub, fontSize: 14 }}>
              No users found
            </div>
          )}
          {!loading && !q.trim() && (
            <div style={{ padding: 24, textAlign: 'center', color: T.sub, fontSize: 14 }}>
              Start typing a username to search
            </div>
          )}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => onSelectUser(u)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 18px', border: 'none', background: 'none',
                cursor: 'pointer', textAlign: 'left', color: T.txt,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <Avatar user={u} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{u.username}</div>
                {(u.first_name || u.last_name) && (
                  <div style={{ fontSize: 12, color: T.sub }}>
                    {u.first_name} {u.last_name}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
const MessageBubble = memo(function MessageBubble({ msg, T, onEdit, onDelete, priColor }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const own = msg.is_own;

  const bubbleStyle = own
    ? {
        background: priColor,
        color: '#fff',
        borderRadius: '18px 18px 4px 18px',
      }
    : {
        background: T.cardBg === '#FFF' || T.cardBg === '#FFFFFF' ? '#F1F1F3' : T.bg,
        color: T.txt,
        borderRadius: '18px 18px 18px 4px',
      };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: own ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 6,
        marginBottom: 6,
      }}
    >
      <div style={{ position: 'relative', maxWidth: '75%' }}>
        <div
          style={{
            padding: '10px 14px',
            fontSize: 14,
            lineHeight: 1.4,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            ...bubbleStyle,
            ...(msg.is_deleted
              ? { fontStyle: 'italic', opacity: 0.65 }
              : {}),
          }}
        >
          {msg.is_deleted ? 'Message deleted' : msg.text}
        </div>
        <div
          style={{
            fontSize: 10,
            color: T.sub,
            marginTop: 3,
            textAlign: own ? 'right' : 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            justifyContent: own ? 'flex-end' : 'flex-start',
          }}
        >
          {msg.edited_at && !msg.is_deleted && <span>Edited ·</span>}
          <span>{clockTime(msg.created_at)}</span>
        </div>

        {/* Action menu for own, non-deleted messages */}
        {own && !msg.is_deleted && (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              position: 'absolute',
              top: 4,
              left: -30,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: T.sub,
              padding: 4,
              opacity: 0.6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
            title="Options"
          >
            <MoreVertical size={16} />
          </button>
        )}

        {menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 20 }}
            />
            <div
              style={{
                position: 'absolute',
                top: 28,
                left: -4,
                background: T.cardBg,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                zIndex: 21,
                overflow: 'hidden',
                minWidth: 130,
              }}
            >
              {msg.is_editable && (
                <button
                  onClick={() => { setMenuOpen(false); onEdit(msg); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '10px 14px',
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: T.txt, fontSize: 13, textAlign: 'left',
                  }}
                >
                  <Edit3 size={14} /> Edit
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); onDelete(msg); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '10px 14px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: '#ef4444', fontSize: 13, textAlign: 'left',
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

// ─── Composer ─────────────────────────────────────────────────────────────────
// Isolated so typing does NOT re-render the thread + message list.
const Composer = memo(function Composer({
  onSend, onEditSubmit, onCancelEdit, editing, T, priColor, inputRef,
}) {
  const [text, setText] = useState('');

  // When entering edit mode, prefill text. When leaving, clear.
  const editingId = editing?.id || null;
  useEffect(() => {
    if (editing) {
      setText(editing.text || '');
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setText('');
    }
  }, [editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e?.preventDefault?.();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      if (editing) {
        const ok = await onEditSubmit(editing, trimmed);
        if (ok) setText('');
      } else {
        // Clear immediately for snappy UX; parent owns optimistic insert
        setText('');
        await onSend(trimmed);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {editing && (
        <div style={{
          padding: '8px 14px', background: T.cardBg,
          borderTop: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, color: T.sub,
        }}>
          <Edit3 size={14} /> Editing message
          <button type="button" onClick={onCancelEdit} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: T.sub, cursor: 'pointer', padding: 4, display: 'flex',
          }}>
            <X size={16} />
          </button>
        </div>
      )}
      <form
        onSubmit={submit}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px',
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
          borderTop: `1px solid ${T.border}`,
          background: T.cardBg, flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={editing ? 'Edit your message…' : 'Message…'}
          autoComplete="off"
          style={{
            flex: 1,
            padding: '11px 16px',
            borderRadius: 24,
            border: `1px solid ${T.border}`,
            background: T.bg,
            color: T.txt,
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          style={{
            background: text.trim() && !sending ? priColor : T.border,
            color: '#fff',
            border: 'none',
            width: 42, height: 42, borderRadius: '50%',
            cursor: text.trim() && !sending ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </form>
    </>
  );
});

// ─── Thread View (single conversation) ────────────────────────────────────────
function ThreadView({ conversation, onBack, user, T, priColor, onShowProfile, onMessageChanged }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const pendingRef = useRef(0); // count of in-flight sends; pauses poll-replace

  const convId = conversation.id;
  const other = conversation.other_user;

  const scrollToBottom = (smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.request(`/messages/conversations/${convId}/messages/`);
      const arr = Array.isArray(data) ? data : [];
      setMessages((prev) => {
        // If a send is in flight, don't clobber optimistic messages
        if (pendingRef.current > 0) {
          const pendings = prev.filter((m) => typeof m.id === 'string' && m.id.startsWith('tmp-'));
          if (pendings.length) {
            // Merge server arr with pending optimistic tail
            const serverIds = new Set(arr.map((m) => m.id));
            const merged = [...arr, ...pendings.filter((m) => !serverIds.has(m.id))];
            return merged;
          }
        }
        // Bail if nothing meaningful changed
        if (arr.length === prev.length) {
          const lastPrev = prev[prev.length - 1];
          const lastNew = arr[arr.length - 1];
          if (lastPrev && lastNew
              && lastPrev.id === lastNew.id
              && lastPrev.text === lastNew.text
              && lastPrev.is_deleted === lastNew.is_deleted
              && lastPrev.edited_at === lastNew.edited_at) {
            return prev;
          }
        }
        return arr;
      });
      // Mark as read (fire and forget)
      api.request(`/messages/conversations/${convId}/read/`, { method: 'POST' }).catch(() => {});
    } catch (e) {
      console.error('fetchMessages error', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [convId]);

  useEffect(() => { fetchMessages(false); }, [fetchMessages]);

  // Poll every 3 seconds for new messages while thread is open
  useEffect(() => {
    const id = setInterval(() => fetchMessages(true), 3000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!loading) scrollToBottom(false);
  }, [messages.length, loading]);

  // Stable send handler — does NOT depend on text state (Composer owns text)
  const handleSend = useCallback(async (trimmed) => {
    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      sender: { id: user.id, username: user.username, profile_photo: user.profile_photo },
      text: trimmed,
      created_at: new Date().toISOString(),
      edited_at: null,
      is_deleted: false,
      is_own: true,
      is_editable: true,
      _pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    pendingRef.current += 1;
    try {
      const res = await api.request(`/messages/conversations/${convId}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      setMessages((prev) => {
        // Replace optimistic; if poll already added real msg, drop optimistic
        const hasReal = prev.some((m) => m.id === res.id);
        if (hasReal) return prev.filter((m) => m.id !== tempId);
        return prev.map((m) => (m.id === tempId ? res : m));
      });
      onMessageChanged?.();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert(err?.error || err?.message || 'Failed to send');
    } finally {
      pendingRef.current = Math.max(0, pendingRef.current - 1);
    }
  }, [convId, user?.id, user?.username, user?.profile_photo, onMessageChanged]);

  const handleEditSubmit = useCallback(async (msg, trimmed) => {
    try {
      const res = await api.request(`/messages/${msg.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? res : m)));
      setEditing(null);
      onMessageChanged?.();
      return true;
    } catch (err) {
      alert(err?.error || err?.message || 'Failed to edit message');
      return false;
    }
  }, [onMessageChanged]);

  const handleEdit = useCallback((msg) => {
    setEditing(msg);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditing(null);
  }, []);

  const handleDelete = useCallback(async (msg) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.request(`/messages/${msg.id}/`, { method: 'DELETE' });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_deleted: true, text: '' } : m)));
      onMessageChanged?.();
    } catch (err) {
      alert(err?.error || 'Failed to delete');
    }
  }, [onMessageChanged]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.bg }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderBottom: `1px solid ${T.border}`,
        background: T.cardBg, flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.txt, padding: 6, display: 'flex',
          }}
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <button
          onClick={() => onShowProfile?.(other?.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, flex: 1, minWidth: 0, textAlign: 'left',
          }}
        >
          <Avatar user={other} size={36} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {other?.username || 'User'}
            </div>
            {(other?.first_name || other?.last_name) && (
              <div style={{ fontSize: 12, color: T.sub }}>
                {other?.first_name} {other?.last_name}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'auto', padding: '12px 14px',
          display: 'flex', flexDirection: 'column',
          minHeight: 0, // critical for flex scrolling on mobile
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {loading ? (
          <div style={{ color: T.sub, fontSize: 13, padding: 20, textAlign: 'center' }}>Loading...</div>
        ) : messages.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', flex: 1, color: T.sub, gap: 8,
          }}>
            <Avatar user={other} size={72} />
            <div style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginTop: 8 }}>
              {other?.username}
            </div>
            <div style={{ fontSize: 13 }}>Say hi to start the conversation</div>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              msg={m}
              T={T}
              priColor={priColor}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <Composer
        onSend={handleSend}
        onEditSubmit={handleEditSubmit}
        onCancelEdit={handleCancelEdit}
        editing={editing}
        T={T}
        priColor={priColor}
        inputRef={inputRef}
      />
    </div>
  );
}

// ─── Conversation list item ───────────────────────────────────────────────────
const ConvRow = memo(function ConvRow({ conv, active, onClick, T, currentUserId }) {
  const other = conv.other_user;
  const last = conv.last_message;
  const isOwnLast = last && last.sender_id === currentUserId;
  const preview = !last
    ? 'No messages yet'
    : (last.is_deleted
      ? 'Message deleted'
      : (isOwnLast ? `You: ${last.text}` : last.text));

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '10px 16px', border: 'none',
        background: active ? (T.pri + '14') : 'transparent',
        cursor: 'pointer', textAlign: 'left',
        borderLeft: active ? `3px solid ${T.pri}` : '3px solid transparent',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.bg; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Avatar user={other} size={52} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            fontSize: 14, fontWeight: conv.unread_count > 0 ? 700 : 600,
            color: T.txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {other?.username || 'User'}
          </div>
          {last && (
            <div style={{ fontSize: 11, color: T.sub, flexShrink: 0 }}>
              {relTime(last.created_at)}
            </div>
          )}
        </div>
        <div style={{
          fontSize: 12,
          color: conv.unread_count > 0 ? T.txt : T.sub,
          fontWeight: conv.unread_count > 0 ? 600 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginTop: 2,
        }}>
          {preview}
        </div>
      </div>
      {conv.unread_count > 0 && (
        <div style={{
          minWidth: 20, height: 20, padding: '0 6px',
          borderRadius: 10, background: T.pri, color: '#fff',
          fontSize: 11, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {conv.unread_count > 99 ? '99+' : conv.unread_count}
        </div>
      )}
    </button>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────
export function MessagesPage({ user, onShowProfile }) {
  const { colors: T } = useTheme();
  const priColor = T.priGradient || T.pri;
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Stable fetcher — never re-created, so polling interval stays stable.
  const fetchConversations = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.request('/messages/conversations/');
      const arr = Array.isArray(data) ? data : [];
      setConversations((prev) => {
        // Shallow compare: same length + same ids + same last_message snapshot + same unread
        if (prev.length === arr.length) {
          let same = true;
          for (let i = 0; i < arr.length; i++) {
            const a = arr[i]; const b = prev[i];
            if (!b
                || a.id !== b.id
                || a.unread_count !== b.unread_count
                || (a.last_message?.id || null) !== (b.last_message?.id || null)
                || (a.last_message?.text || '') !== (b.last_message?.text || '')
                || (a.last_message?.is_deleted || false) !== (b.last_message?.is_deleted || false)) {
              same = false; break;
            }
          }
          if (same) return prev;
        }
        return arr;
      });
      // Keep activeConv meta in sync, but do NOT force a reference change if unchanged
      setActiveConv((curr) => {
        if (!curr) return curr;
        const fresh = arr.find((c) => c.id === curr.id);
        if (!fresh) return curr;
        if (fresh.unread_count === curr.unread_count
            && (fresh.last_message?.id || null) === (curr.last_message?.id || null)
            && (fresh.last_message?.text || '') === (curr.last_message?.text || '')) {
          return curr;
        }
        return fresh;
      });
    } catch (e) {
      console.error('fetchConversations', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(false); }, [fetchConversations]);
  useEffect(() => {
    const id = setInterval(() => fetchConversations(true), 10000);
    return () => clearInterval(id);
  }, [fetchConversations]);

  // Stable callback for ThreadView — prevents it from re-rendering every poll tick
  const onMessageChanged = useCallback(() => { fetchConversations(true); }, [fetchConversations]);

  const handleStartChat = async (u) => {
    try {
      const conv = await api.request('/messages/conversations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: u.id }),
      });
      setShowNewChat(false);
      setActiveConv(conv);
      fetchConversations(true);
    } catch (e) {
      alert(e?.error || 'Failed to start conversation');
    }
  };

  // On mobile, push a history entry when opening a thread so hardware/browser
  // back closes the thread instead of leaving the messages page.
  const openConv = useCallback((c) => {
    setActiveConv(c);
    if (window.innerWidth <= 1024) {
      try { window.history.pushState({ _msgThread: true }, '', window.location.href); } catch {}
    }
  }, []);

  const closeThread = useCallback(() => {
    setActiveConv(null);
    // If we pushed a state for this thread, pop it so forward nav isn't littered
    try {
      if (window.history.state && window.history.state._msgThread) {
        window.history.back();
      }
    } catch {}
  }, []);

  useEffect(() => {
    const onPop = () => {
      // If thread is open and user pressed browser back, close thread instead.
      setActiveConv((curr) => (curr ? null : curr));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  const inbox = (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: isMobile ? '100%' : 360,
      borderRight: isMobile ? 'none' : `1px solid ${T.border}`,
      background: T.cardBg,
      height: '100%',
      flexShrink: 0,
    }}>
      {/* Inbox header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 18px', borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.txt }}>
          {user?.username || 'Messages'}
        </div>
        <button
          onClick={() => setShowNewChat(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.txt, padding: 6, display: 'flex',
          }}
          aria-label="New message"
          title="New message"
        >
          <PenSquare size={22} />
        </button>
      </div>
      {/* List */}
      <div style={{
        flex: 1, overflowY: 'auto', paddingBottom: 12,
        minHeight: 0,
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: T.sub, fontSize: 13 }}>Loading…</div>
        ) : conversations.length === 0 ? (
          <div style={{
            padding: 24, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 10, color: T.sub, marginTop: 24,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.txt }}>No messages yet</div>
            <div style={{ fontSize: 13, textAlign: 'center' }}>
              Start a conversation with anyone on the platform.
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              style={{
                marginTop: 10, background: priColor, color: '#fff',
                border: 'none', padding: '9px 20px', borderRadius: 22,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              Send message
            </button>
          </div>
        ) : (
          <div style={{ padding: '4px 0' }}>
            {conversations.map((c) => (
              <ConvRow
                key={c.id}
                conv={c}
                active={activeConv?.id === c.id}
                currentUserId={user?.id}
                onClick={() => openConv(c)}
                T={T}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      background: T.bg, overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Mobile: inbox in flow; thread as a fixed full-viewport overlay above bottom nav */}
      {isMobile ? (
        <>
          {inbox}
          {activeConv && (
            <div style={{
              position: 'fixed',
              inset: 0,
              height: '100dvh',
              width: '100vw',
              background: T.bg,
              zIndex: 1500, // above AppShell bottom nav (1000)
              display: 'flex',
              flexDirection: 'column',
            }}>
              <ThreadView
                conversation={activeConv}
                onBack={closeThread}
                user={user}
                T={T}
                priColor={priColor}
                onShowProfile={onShowProfile}
                onMessageChanged={onMessageChanged}
              />
            </div>
          )}
        </>
      ) : (
        // Desktop: side-by-side
        <>
          {inbox}
          <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
            {activeConv ? (
              <ThreadView
                conversation={activeConv}
                onBack={closeThread}
                user={user}
                T={T}
                priColor={priColor}
                onShowProfile={onShowProfile}
                onMessageChanged={onMessageChanged}
              />
            ) : (
              <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: 24,
                color: T.sub,
              }}>
                <div style={{
                  width: 96, height: 96, borderRadius: '50%',
                  border: `2px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Send size={42} color={T.sub} strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
                  Your messages
                </div>
                <div style={{ fontSize: 14, marginBottom: 14 }}>
                  Send a message to start a conversation.
                </div>
                <button
                  onClick={() => setShowNewChat(true)}
                  style={{
                    background: priColor, color: '#fff',
                    border: 'none', padding: '10px 22px', borderRadius: 24,
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Send message
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelectUser={handleStartChat}
          T={T}
        />
      )}
    </div>
  );
}
