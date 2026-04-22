import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const T = {
  bg: '#f5f5f5',
  cardBg: '#ffffff',
  border: '#e0e0e0',
  txt: '#000000',
  sub: '#666666',
  pri: '#DA9B2A',
};

const ALL_TABS = ['For You', 'Explore', 'Campaigns', 'Categories'];

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

export default function HomeScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('For You');
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getReels();
      setPosts(data.results || data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleVote = async (reelId, currentLiked) => {
    try {
      setPosts(posts.map(post => 
        post.id === reelId 
          ? { ...post, votes: currentLiked ? Math.max(0, (post.votes || 0) - 1) : (post.votes || 0) + 1, has_voted: !currentLiked }
          : post
      ));
      await api.voteReel(reelId);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSave = async (reelId, currentSaved) => {
    try {
      setPosts(posts.map(post => 
        post.id === reelId 
          ? { ...post, is_saved: !currentSaved }
          : post
      ));
      await api.toggleSavePost(reelId);
    } catch (error) {
      console.error('Error saving:', error);
    }
  }

  const handleShare = async (postId) => {
    try {
      await Share.share({
        message: `Check out this post on FlipStar! ${config.API_BASE_URL.replace('/api', '')}/post/${postId}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleComment = (reelId) => {
    navigation.navigate('Comments', { reelId });
  };

  const handleProfile = (userId) => {
    if (userId) {
      navigation.navigate('ProfileDetail', { userId });
    }
  };

  const handleVideoPress = (reelId) => {
     navigation.navigate('VideoDetail', { reelId });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    setVisibleItems(viewableItems.map(item => item.item.id));
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const renderHeader = () => (
    <View style={styles.tabsContainer}>
      <FlatList
        horizontal
        data={ALL_TABS}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = activeTab === item;
          return (
            <TouchableOpacity
              onPress={() => setActiveTab(item)}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const renderPost = ({ item }) => {
    const isVideo = !!item.media && (
      /\.(mp4|webm|ogg|mov)(\?|$)/i.test(item.media) ||
      item.media.includes('/video/upload/') ||
      !item.image
    );
    const mediaSrc = mediaUrl(item.media || item.image);
    const avatarSrc = mediaUrl(item.user?.profile_photo);
    const isVisible = visibleItems.includes(item.id);

    return (
      <View style={styles.postCard}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => handleProfile(item.user?.id)} style={styles.avatarContainer}>
            {avatarSrc ? (
              <Image source={{ uri: avatarSrc }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {item.user?.username?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <View style={styles.usernameRow}>
              <TouchableOpacity onPress={() => handleProfile(item.user?.id)}>
                <Text style={styles.username}>{item.user?.username || 'user'}</Text>
              </TouchableOpacity>
              <Ionicons name="checkmark-circle" size={14} color={T.pri} style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color={T.sub} />
          </TouchableOpacity>
        </View>

        {/* Media */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => isVideo && handleVideoPress(item.id)}
          style={styles.mediaContainer}
        >
          {mediaSrc ? (
            isVideo ? (
              <>
                <Video
                  source={{ uri: mediaSrc }}
                  style={styles.media}
                  shouldPlay={isVisible}
                  isLooping
                  resizeMode={ResizeMode.COVER}
                  useNativeControls={false}
                  isMuted={true}
                />
                {!isVisible && (
                  <View style={styles.playOverlay}>
                    <View style={styles.playCircle}>
                      <Ionicons name="play" size={24} color="#000" style={{ marginLeft: 3 }} />
                    </View>
                  </View>
                )}
              </>
            ) : (
              <Image source={{ uri: mediaSrc }} style={styles.media} />
            )
          ) : (
            <View style={[styles.media, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: T.sub }}>No Media</Text>
            </View>
          )}

          {/* View count */}
          {mediaSrc && (
            <View style={styles.viewBadge}>
              <Ionicons name="eye" size={12} color="#fff" />
              <Text style={styles.viewBadgeText}>{item.view_count || 0}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleVote(item.id, item.has_voted)}>
              <Ionicons name={item.has_voted ? "heart" : "heart-outline"} size={22} color={item.has_voted ? "#EF4444" : T.txt} />
              <Text style={styles.actionText}>{item.votes > 0 ? item.votes : ''}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleComment(item.id)}>
              <Ionicons name="chatbubble-outline" size={20} color={T.txt} />
              <Text style={styles.actionText}>{(item.comments_count || 0) > 0 ? item.comments_count : ''}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item.id)}>
              <Ionicons name="share-social-outline" size={22} color={T.txt} />
              <Text style={styles.actionText}>{(item.shares || 0) > 0 ? item.shares : ''}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="gift-outline" size={20} color={T.txt} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSave(item.id, item.is_saved)}>
            <Ionicons name={item.is_saved ? "bookmark" : "bookmark-outline"} size={22} color={item.is_saved ? T.pri : T.txt} />
          </TouchableOpacity>
        </View>

        {/* Caption & Comments link */}
        <View style={styles.captionContainer}>
          {!!item.caption && (
            <Text style={styles.captionText} numberOfLines={2}>
              <Text style={styles.captionUsername}>{item.user?.username} </Text>
              {item.caption}
            </Text>
          )}
          
          <TouchableOpacity onPress={() => handleComment(item.id)}>
            <Text style={styles.commentsLink}>
              {(item.comments_count || 0) > 0 ? `View all ${item.comments_count} comments` : 'Add a comment...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={T.pri} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📸</Text>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to share something!</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  tabsContainer: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: T.cardBg,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonActive: {
    backgroundColor: T.pri,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: T.txt,
  },
  tabTextActive: {
    color: '#fff',
  },
  postCard: {
    backgroundColor: T.cardBg,
    borderRadius: 16,
    marginHorizontal: 8,
    marginBottom: 16,
    overflow: 'hidden',
    borderColor: T.border,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eee',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontWeight: '700',
    fontSize: 14,
    color: T.txt,
  },
  time: {
    fontSize: 11,
    color: T.sub,
    marginTop: 1,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#000',
    position: 'relative',
  },
  media: {
    ...StyleSheet.absoluteFillObject,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  viewBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: T.sub,
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  captionText: {
    fontSize: 13,
    color: T.txt,
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '700',
  },
  commentsLink: {
    color: T.sub,
    fontSize: 13,
    marginTop: 6,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: T.txt,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: T.sub,
  },
});
