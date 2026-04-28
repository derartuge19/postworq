import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TextInput,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 12) / 3; // 3 columns with 3px gaps

const T = {
  bg: '#f5f5f5',
  cardBg: '#ffffff',
  border: '#e0e0e0',
  txt: '#000000',
  sub: '#666666',
  pri: '#F9E08B',
};

const BRAND_GOLD = '#F9E08B';

const CATEGORIES = [
  { id: 'all', label: 'Trending', emoji: '🔥' },
  { id: 'dance', label: 'Dance', emoji: '💃' },
  { id: 'comedy', label: 'Comedy', emoji: '😂' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'beauty', label: 'Beauty', emoji: '✨' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'education', label: 'Learn', emoji: '📚' },
];

const TIME_RANGES = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30d' },
];

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

const fmt = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

export default function ExploreScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // State
  const [activeCategory, setActiveCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hashtags, setHashtags] = useState([]);
  const [hashLoading, setHashLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], hashtags: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [hashtagView, setHashtagView] = useState(null);
  const [showHashtagDropdown, setShowHashtagDropdown] = useState(false);

  const searchTimeout = useRef(null);

  // Load trending content
  const loadTrending = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setHasMore(true);
      }
      
      const limit = reset ? 12 : 12;
      const offset = reset ? 0 : videos.length;
      
      const data = await api.getTrendingContent(activeCategory, timeRange, limit, offset);
      const results = Array.isArray(data) ? data : (data?.results || []);
      
      if (reset) {
        setVideos(results);
      } else {
        setVideos(prev => [...prev, ...results.filter(v => !prev.some(p => p.id === v.id))]);
      }
      
      setHasMore(results.length >= limit);
    } catch (error) {
      console.error('Error loading trending:', error);
      if (reset) setVideos([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeCategory, timeRange, videos.length]);

  // Load trending hashtags
  const loadHashtags = useCallback(async () => {
    try {
      setHashLoading(true);
      const data = await api.getTrendingHashtags(timeRange);
      setHashtags(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading hashtags:', error);
      setHashtags([]);
    } finally {
      setHashLoading(false);
    }
  }, [timeRange]);

  // Search functionality
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults({ users: [], posts: [], hashtags: [] });
      return;
    }
    
    try {
      setSearchLoading(true);
      const data = await api.search(query.trim());
      setSearchResults(data || { users: [], posts: [], hashtags: [] });
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults({ users: [], posts: [], hashtags: [] });
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle hashtag click
  const handleHashtagClick = async (tag) => {
    const cleanTag = tag.replace(/^#/, '');
    setLoading(true);
    try {
      const data = await api.getHashtagContent(cleanTag);
      const results = data?.results || [];
      setHashtagView({ tag: cleanTag, videos: results, count: data?.count || results.length });
      setVideos(results);
      setHasMore(false);
    } catch (error) {
      console.error('Error fetching hashtag:', error);
      setHashtagView({ tag: cleanTag, videos: [], count: 0 });
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // Clear hashtag view
  const clearHashtagView = () => {
    setHashtagView(null);
    loadTrending(true);
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Load initial data
  useEffect(() => {
    loadTrending(true);
    loadHashtags();
  }, [activeCategory, timeRange]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      if (!hashtagView) {
        loadTrending(true);
        loadHashtags();
      }
    }, [activeCategory, timeRange, hashtagView])
  );

  // Load more on scroll
  const handleLoadMore = () => {
    if (!loading && hasMore && !loadingMore && !searchQuery) {
      setLoadingMore(true);
      loadTrending(false);
    }
  };

  // Render video thumbnail
  const renderVideoThumb = ({ item, index }) => {
    // Use the actual fields from ReelSerializer: image and media
    const imageUrl = item.image;
    const mediaUrl_field = item.media;
    const isVideo = !!(mediaUrl_field || '').match(/\.(mp4|webm|ogg|mov)/i) || (mediaUrl_field && mediaUrl_field.includes('/video/'));
    
    // Thumbnail logic matching the API response structure
    let thumb = null;
    if (imageUrl && !isVideo) {
      // If it's an image, use the image field
      thumb = imageUrl;
    } else if (mediaUrl_field) {
      // For videos, use the media field (will show video thumbnail)
      thumb = mediaUrl_field;
    }

    return (
      <TouchableOpacity
        style={styles.videoThumb}
        onPress={() => navigation.navigate('Reels', { reelId: item.id, initialIndex: index })}
      >
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumbImage} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="play" size={24} color="#fff" />
          </View>
        )}
        
        {isVideo && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={8} color="#fff" />
          </View>
        )}
        
        <View style={styles.thumbStats}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={10} color="#fff" />
            <Text style={styles.statText}>{fmt(item.votes || 0)}</Text>
          </View>
          {(item.comment_count > 0 || item.comments > 0) && (
            <View style={styles.statItem}>
              <Ionicons name="eye" size={10} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statText}>{fmt(item.comment_count || item.comments || 0)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render search result
  const renderSearchResult = () => {
    if (searchLoading) {
      return (
        <View style={styles.searchLoading}>
          {[0,1,2,3].map(i => (
            <View key={i} style={styles.skeletonItem} />
          ))}
        </View>
      );
    }

    return (
      <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
        {/* Users */}
        {searchResults.users?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PEOPLE</Text>
            {searchResults.users.map(u => {
              const photo = u.profile_photo ? mediaUrl(u.profile_photo) : null;
              return (
                <TouchableOpacity
                  key={u.id}
                  style={styles.userItem}
                  onPress={() => navigation.navigate('ProfileDetail', { userId: u.id })}
                >
                  <View style={styles.userAvatar}>
                    {photo ? (
                      <Image source={{ uri: photo }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>👤</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>@{u.username}</Text>
                    {u.followers_count > 0 && (
                      <Text style={styles.userStats}>{fmt(u.followers_count)} followers</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={T.sub} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Hashtags */}
        {searchResults.hashtags?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HASHTAGS</Text>
            <View style={styles.hashtagGrid}>
              {searchResults.hashtags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={styles.hashtagChip}
                  onPress={() => handleHashtagClick(tag)}
                >
                  <Text style={styles.hashtagText}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Posts */}
        {searchResults.posts?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>POSTS</Text>
            <FlashList
              data={searchResults.posts}
              renderItem={renderVideoThumb}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              scrollEnabled={false}
              estimatedItemSize={ITEM_WIDTH * 1.78}
            />
          </View>
        )}

        {/* No results */}
        {!searchResults.users?.length && !searchResults.hashtags?.length && !searchResults.posts?.length && (
          <View style={styles.noResults}>
            <Ionicons name="search" size={40} color={T.sub} style={{ opacity: 0.3 }} />
            <Text style={styles.noResultsTitle}>No results for "{searchQuery}"</Text>
            <Text style={styles.noResultsText}>Try different keywords or browse trending below</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const inSearchMode = searchQuery.trim().length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T.txt} />
        </TouchableOpacity>
        
        {!inSearchMode && !searchFocused && (
          <View style={styles.headerTitle}>
            <Ionicons name="flame" size={22} color={T.pri} />
            <Text style={styles.titleText}>Explore</Text>
          </View>
        )}

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={T.sub} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
            placeholder="Search videos, users, #tags…"
            placeholderTextColor={T.sub}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close" size={15} color={T.sub} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Time Range Pills */}
      {!inSearchMode && !searchFocused && (
        <View style={styles.timeRangeContainer}>
          {TIME_RANGES.map(r => (
            <TouchableOpacity
              key={r.id}
              onPress={() => { setTimeRange(r.id); setHashtagView(null); }}
              style={[styles.timeRangeBtn, timeRange === r.id && styles.timeRangeBtnActive]}
            >
              <Text style={[styles.timeRangeText, timeRange === r.id && styles.timeRangeTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Categories */}
      {!inSearchMode && (
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => { setActiveCategory(cat.id); setHashtagView(null); }}
                  style={[styles.categoryBtn, isActive && styles.categoryBtnActive]}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Hashtag View Header */}
      {hashtagView && (
        <View style={styles.hashtagHeader}>
          <TouchableOpacity onPress={clearHashtagView} style={styles.hashtagBackBtn}>
            <Ionicons name="arrow-back" size={20} color={T.txt} />
          </TouchableOpacity>
          <Text style={styles.hashtagTitle}>#{hashtagView.tag}</Text>
          <Text style={styles.hashtagCount}>{fmt(hashtagView.count)} posts</Text>
        </View>
      )}

      {/* Content */}
      {inSearchMode ? (
        renderSearchResult()
      ) : (
        <View style={styles.content}>
          {/* Trending Hashtags */}
          {!hashLoading && hashtags.length > 0 && !hashtagView && (
            <View style={styles.trendingHashtags}>
              <TouchableOpacity
                onPress={() => setShowHashtagDropdown(!showHashtagDropdown)}
                style={styles.hashtagDropdownHeader}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="trending-up" size={16} color={T.pri} />
                  <Text style={styles.sectionTitle}>TRENDING HASHTAGS</Text>
                </View>
                <Ionicons 
                  name="chevron-down" 
                  size={18} 
                  color={T.pri} 
                  style={{ 
                    transform: [{ rotate: showHashtagDropdown ? '180deg' : '0deg' }] 
                  }} 
                />
              </TouchableOpacity>
              
              {showHashtagDropdown && (
                <View style={styles.hashtagDropdownContent}>
                  {hashtags.map(h => (
                    <TouchableOpacity
                      key={h.tag}
                      onPress={() => handleHashtagClick(h.tag)}
                      style={styles.trendingHashtagBtn}
                    >
                      <Text style={styles.trendingHashtagText}>#{h.tag}</Text>
                      <Text style={styles.trendingHashtagCount}>{fmt(h.posts)} posts</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Video Grid */}
          <FlashList
            data={videos}
            renderItem={renderVideoThumb}
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            estimatedItemSize={ITEM_WIDTH * 1.78}
            ListFooterComponent={() => (
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={T.pri} />
                </View>
              ) : null
            )}
            ListEmptyComponent={() => (
              !loading && (
                <View style={styles.emptyState}>
                  <Ionicons name="flame" size={48} color={T.sub} style={{ opacity: 0.3 }} />
                  <Text style={styles.emptyTitle}>No trending content</Text>
                  <Text style={styles.emptyText}>Check back later for new content</Text>
                </View>
              )
            )}
            refreshing={loading}
            onRefresh={() => loadTrending(true)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginLeft: 10,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: T.txt,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 36,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: T.border,
    fontSize: 14,
    backgroundColor: T.bg,
    color: T.txt,
  },
  clearBtn: {
    position: 'absolute',
    right: 10,
    padding: 4,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  timeRangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: 'transparent',
  },
  timeRangeBtnActive: {
    backgroundColor: T.pri,
    borderColor: T.pri,
  },
  timeRangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: T.sub,
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    marginRight: 6,
  },
  categoryBtnActive: {
    backgroundColor: T.pri + '15',
    borderColor: T.pri + '30',
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: T.txt,
  },
  categoryTextActive: {
    color: T.pri,
  },
  hashtagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  hashtagBackBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashtagTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: T.txt,
    marginLeft: 8,
  },
  hashtagCount: {
    fontSize: 14,
    color: T.sub,
    marginLeft: 'auto',
  },
  content: {
    flex: 1,
  },
  trendingHashtags: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  hashtagDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: T.pri + '15',
    borderWidth: 1,
    borderColor: T.pri + '35',
  },
  hashtagDropdownContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: T.sub,
  },
  hashtagScroll: {
    flexDirection: 'row',
  },
  trendingHashtagBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: T.pri + '12',
    borderWidth: 1,
    borderColor: T.pri + '35',
  },
  trendingHashtagText: {
    fontSize: 13,
    fontWeight: '800',
    color: T.pri,
  },
  trendingHashtagCount: {
    fontSize: 10,
    color: T.sub,
  },
  videoThumb: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.78, // 9:16 aspect ratio
    backgroundColor: '#111',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 1.5,
    marginBottom: 3,
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: `linear-gradient(135deg,${T.pri}30,#00000080)`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    top: 7,
    left: 7,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderRadius: 4,
    padding: '2px 5px',
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbStats: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.72))',
    padding: '12px 6px 6px',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.txt,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: T.sub,
    marginTop: 6,
  },
  // Search results styles
  searchResults: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchLoading: {
    padding: 12,
    flexDirection: 'column',
    gap: 10,
  },
  skeletonItem: {
    height: 56,
    borderRadius: 12,
    backgroundColor: T.border,
  },
  section: {
    marginBottom: 28,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.pri + '30',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: T.border,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: T.txt,
  },
  userStats: {
    fontSize: 12,
    color: T.sub,
  },
  hashtagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: T.pri + '18',
    borderWidth: 1,
    borderColor: T.pri + '40',
  },
  hashtagText: {
    fontSize: 14,
    fontWeight: '700',
    color: T.pri,
  },
  noResults: {
    padding: 60,
    alignItems: 'center',
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.txt,
    marginTop: 12,
  },
  noResultsText: {
    fontSize: 13,
    color: T.sub,
    marginTop: 6,
  },
});
