import { useState, useEffect } from 'react';
import { TrendingUp, Flame, Music, Laugh, Dumbbell, Utensils, Plane, Palette } from 'lucide-react';
import { TikTokLayout } from './TikTokLayout';
import api from '../api';

const T = {
  pri: '#DA9B2A',
  txt: '#1C1917',
  sub: '#78716C',
  bg: '#FAFAF9',
  card: '#FFFFFF',
  border: '#E7E5E4',
};

const categories = [
  { id: 'all', label: 'All', icon: TrendingUp },
  { id: 'dance', label: 'Dance', icon: Music },
  { id: 'comedy', label: 'Comedy', icon: Laugh },
  { id: 'sports', label: 'Sports', icon: Dumbbell },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'art', label: 'Art', icon: Palette },
];

export function ExplorerPage({ 
  user, 
  onBack, 
  onShowProfile, 
  onShowVideoDetail,
  onRequireAuth,
  onShowPostPage,
  onShowSettings,
  onShowNotifications 
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingVideos();
  }, [activeCategory]);

  const loadTrendingVideos = async () => {
    try {
      setLoading(true);
      const data = await api.request(`/explorer/trending/?category=${activeCategory}&time_range=7d&limit=30`);
      setTrendingVideos(data || []);
    } catch (err) {
      console.error('Failed to load trending videos:', err);
      setTrendingVideos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
    }}>
      {/* Header with Categories */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.9)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Flame size={24} color={T.pri} />
            <h1 style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
              margin: 0,
            }}>
              Trending
            </h1>
          </div>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 12px',
            }}
          >
            Close
          </button>
        </div>

        {/* Category Filters */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
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
                  background: isActive ? T.pri : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: 20,
                  color: isActive ? '#000' : '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending Feed */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#fff',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}>
              <Flame size={48} color={T.pri} />
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                Loading trending content...
              </div>
            </div>
          </div>
        ) : trendingVideos.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#fff',
            textAlign: 'center',
            padding: 20,
          }}>
            <div>
              <TrendingUp size={48} color={T.sub} style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                No trending content yet
              </div>
              <div style={{ fontSize: 14, color: T.sub }}>
                Check back later for trending videos in this category
              </div>
            </div>
          </div>
        ) : (
          <TikTokLayout
            user={user}
            activeTab="explore"
            initialVideos={trendingVideos}
            onRequireAuth={onRequireAuth}
            onShowPostPage={onShowPostPage}
            onShowProfile={onShowProfile}
            onShowSettings={onShowSettings}
            onShowNotifications={onShowNotifications}
            onShowVideoDetail={onShowVideoDetail}
            hideNavigation={true}
          />
        )}
      </div>
    </div>
  );
}
