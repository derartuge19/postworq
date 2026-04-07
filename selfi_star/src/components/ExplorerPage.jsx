import { useState, useEffect } from 'react';
import { TrendingUp, Flame, Music, Laugh, Dumbbell, Utensils, Plane, Palette, Play, Heart, Eye } from 'lucide-react';
import api from '../api';
import { useTheme } from '../contexts/ThemeContext';
import config from '../config';

const categories = [
  { id: 'all',     label: '🔥 Trending', icon: Flame },
  { id: 'dance',   label: 'Dance',       icon: Music },
  { id: 'comedy',  label: 'Comedy',      icon: Laugh },
  { id: 'sports',  label: 'Sports',      icon: Dumbbell },
  { id: 'food',    label: 'Food',        icon: Utensils },
  { id: 'travel',  label: 'Travel',      icon: Plane },
  { id: 'art',     label: 'Art',         icon: Palette },
];

const timeRanges = [
  { id: '24h', label: '24h' },
  { id: '7d',  label: '7 days' },
  { id: '30d', label: '30 days' },
];

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

export function ExplorerPage({ user, onBack, onShowProfile, onShowVideoDetail }) {
  const { colors: T } = useTheme();
  const [activeCategory, setActiveCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.request(`/explorer/trending/?category=${activeCategory}&time_range=${timeRange}&limit=30`)
      .then(data => { if (!cancelled) setVideos(data || []); })
      .catch(() => { if (!cancelled) setVideos([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeCategory, timeRange]);

  return (
    <div style={{ minHeight: '100%', background: T.bg, display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '20px 20px 0',
        background: T.cardBg || T.bg,
        borderBottom: `1px solid ${T.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Flame size={26} color={T.pri} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.txt, margin: 0 }}>Explore</h1>
          <div style={{ flex: 1 }} />
          {/* Time range pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {timeRanges.map(r => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: `1.5px solid ${timeRange === r.id ? T.pri : T.border}`,
                  background: timeRange === r.id ? T.pri : 'transparent',
                  color: timeRange === r.id ? '#fff' : T.sub,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 12,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: `1.5px solid ${isActive ? T.pri : T.border}`,
                  background: isActive ? T.pri : T.cardBg || '#fff',
                  color: isActive ? '#fff' : T.txt,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                <Icon size={15} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: '16px 16px 24px' }}>
        {loading ? (
          /* Skeleton grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                aspectRatio: '9/16',
                background: T.border,
                borderRadius: 4,
                animation: 'pulse 1.5s ease-in-out infinite',
                opacity: 0.6,
              }} />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            gap: 16,
            color: T.sub,
            textAlign: 'center',
          }}>
            <TrendingUp size={56} color={T.border} />
            <div style={{ fontSize: 18, fontWeight: 700, color: T.txt }}>No trending content yet</div>
            <div style={{ fontSize: 14 }}>Check back later for trending videos in this category</div>
          </div>
        ) : (
          /* 3-column thumbnail grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 3,
          }}>
            {videos.map((reel, idx) => {
              const thumb = reel.thumbnail_url
                ? mediaUrl(reel.thumbnail_url)
                : reel.file_url
                  ? mediaUrl(reel.file_url)
                  : null;
              const isVideo = reel.file_url && (reel.file_url.endsWith('.mp4') || reel.file_url.endsWith('.webm') || reel.file_type === 'video');
              const isHovered = hoveredId === reel.id;

              return (
                <div
                  key={reel.id}
                  onClick={() => onShowVideoDetail?.(reel.id)}
                  onMouseEnter={() => setHoveredId(reel.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    position: 'relative',
                    aspectRatio: '9/16',
                    background: '#111',
                    borderRadius: 4,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    transition: 'transform 0.15s',
                    zIndex: isHovered ? 1 : 0,
                  }}
                >
                  {/* Thumbnail */}
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: `linear-gradient(135deg, ${T.pri}30, #00000080)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Play size={32} color="#fff" fill="#fff" />
                    </div>
                  )}

                  {/* Dark overlay on hover */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: isHovered ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)',
                    transition: 'background 0.2s',
                  }} />

                  {/* Video badge */}
                  {isVideo && (
                    <div style={{
                      position: 'absolute', top: 6, left: 6,
                      background: 'rgba(0,0,0,0.6)',
                      borderRadius: 4, padding: '2px 6px',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      <Play size={10} color="#fff" fill="#fff" />
                    </div>
                  )}

                  {/* Trending rank badge (top 3) */}
                  {idx < 3 && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      background: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32',
                      color: '#000',
                      borderRadius: '50%',
                      width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 900,
                    }}>
                      {idx + 1}
                    </div>
                  )}

                  {/* Stats overlay at bottom */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    padding: '12px 6px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Heart size={11} color="#fff" fill="#fff" />
                      <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>
                        {reel.votes > 999 ? `${(reel.votes / 1000).toFixed(1)}k` : reel.votes || 0}
                      </span>
                    </div>
                    {reel.comment_count > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Eye size={11} color="rgba(255,255,255,0.8)" />
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>
                          {reel.comment_count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:.3} }`}</style>
    </div>
  );
}
