import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Share,
  Modal,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../api';
import GamificationBar from '../components/GamificationBar';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const T = {
  bg: '#f5f5f5',
  cardBg: '#ffffff',
  border: '#e0e0e0',
  txt: '#000000',
  sub: '#666666',
  pri: '#DA9B2A',
};

const BRAND_GOLD = '#DA9B2A';

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
  const nav = useNavigation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('For You');
  const [refreshing, setRefreshing] = useState(false);
  const [giftPost, setGiftPost] = useState(null); // Post being gifted
  const [showPostMenu, setShowPostMenu] = useState(null);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [visibleItems, setVisibleItems] = useState([]);
  const [expandedCaptions, setExpandedCaptions] = useState({}); // { postId: boolean }
  const [giftAmount, setGiftAmount] = useState(50);
  const [customGift, setCustomGift] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [votingInProgress, setVotingInProgress] = useState({}); // { reelId: boolean }

  const toggleCaption = (postId) => {
    setExpandedCaptions(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Parse caption to handle hashtags
  const parseCaption = (caption, postId) => {
    if (!caption) return null;
    
    // Better regex to match hashtags with letters, numbers, and underscores
    const parts = caption.split(/(#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#') && part.length > 1) {
        return (
          <Text 
            key={`${postId}-hashtag-${index}`}
            style={styles.hashtagText}
            onPress={() => {
              // Navigate to explore with hashtag
              navigation.navigate('Explore', { hashtag: part.slice(1) });
            }}
          >
            {part}
          </Text>
        );
      }
      return <Text key={`${postId}-text-${index}`}>{part}</Text>;
    });
  };

  const handleSendGift = async () => {
    if (!giftPost) return;
    if (giftPost.user?.id === user?.id) {
      Alert.alert('Error', 'Cannot gift yourself');
      return;
    }

    const amount = customGift ? parseInt(customGift) : giftAmount;
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      await api.sendGift(giftPost.user?.username, amount, giftMessage || 'Gift from mobile!');
      Alert.alert('Success', `Gift of ${amount} coins sent to @${giftPost.user?.username}!`);
      setGiftPost(null);
      setCustomGift('');
      setGiftMessage('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send gift');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Refresh posts when screen comes into focus (e.g., returning from Comments)
  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  // Listen for tab press event to refresh when already on Home screen
  useEffect(() => {
    const unsubscribe = nav.addListener('tabPress', (e) => {
      // Only refresh if we're already on the Home screen
      // Don't prevent navigation from other tabs
      const currentRoute = nav.getState()?.routes[nav.getState()?.index];
      if (currentRoute?.name === 'Home') {
        loadPosts();
      }
    });

    return unsubscribe;
  }, [nav]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getReels();
      const posts = Array.isArray(data) ? data : (data.results || []);
      setPosts(posts);
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
    // Prevent multiple rapid clicks
    if (votingInProgress[reelId]) return;
    
    setVotingInProgress(prev => ({ ...prev, [reelId]: true }));
    
    // Optimistic update
    setPosts(posts.map(post => 
      post.id === reelId 
        ? { ...post, votes: currentLiked ? Math.max(0, (post.votes || 0) - 1) : (post.votes || 0) + 1, has_voted: !currentLiked, is_liked: !currentLiked }
        : post
    ));
    
    try {
      const response = await api.voteReel(reelId);
      // Update with server response if available
      if (response && response.votes !== undefined) {
        setPosts(posts.map(post => 
          post.id === reelId 
            ? { ...post, votes: response.votes, has_voted: response.has_voted ?? !currentLiked, is_liked: response.is_liked ?? !currentLiked, comments_count: response.comments_count ?? post.comments_count }
            : post
        ));
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Revert on error
      setPosts(posts.map(post => 
        post.id === reelId 
          ? { ...post, votes: currentLiked ? (post.votes || 0) + 1 : Math.max(0, (post.votes || 0) - 1), has_voted: currentLiked, is_liked: currentLiked }
          : post
      ));
    } finally {
      setVotingInProgress(prev => ({ ...prev, [reelId]: false }));
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
  };

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
     navigation.navigate('Reels', { reelId });
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
        contentContainerStyle={{ paddingHorizontal: 8 }}
        renderItem={({ item }) => {
          const isActive = activeTab === item;
          return (
            <TouchableOpacity
              onPress={() => {
                if (item === 'Explore') {
                  navigation.navigate('Explore');
                } else if (item === 'Campaigns') {
                  navigation.navigate('Campaigns');
                } else {
                  setActiveTab(item);
                }
              }}
              activeOpacity={0.75}
              style={[
                styles.tabButton,
                isActive && styles.tabButtonActive,
              ]}
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
    if (!item) return null;
    
    const isVideo = !!item.media && (
      /\.(mp4|webm|ogg|mov)(\?|$)/i.test(item.media) ||
      item.media.includes('/video/upload/') ||
      !item.image
    );
    const mediaSrc = mediaUrl(item.media || item.image);
    const avatarSrc = mediaUrl(item.user?.profile_photo);
    const isVisible = visibleItems.includes(item.id);
    const currentLiked = item.has_voted || item.is_liked || false;

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
          <TouchableOpacity onPress={() => setShowPostMenu(item)}>
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
            <TouchableOpacity style={[styles.actionBtn, votingInProgress[item.id] && { opacity: 0.6 }]} onPress={() => handleVote(item.id, item.has_voted || item.is_liked)} disabled={votingInProgress[item.id]}>
              <Ionicons name={(item.has_voted || item.is_liked) ? "heart" : "heart-outline"} size={22} color={(item.has_voted || item.is_liked) ? "#EF4444" : T.txt} />
              <Text style={styles.actionText}>{item.votes || 0}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleComment(item.id)}>
              <Ionicons name="chatbubble-outline" size={20} color={T.txt} />
              <Text style={styles.actionText}>{(item.comments_count || item.comment_count || 0) > 0 ? (item.comments_count || item.comment_count) : ''}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item.id)}>
              <Ionicons name="share-social-outline" size={22} color={T.txt} />
              <Text style={styles.actionText}>{(item.shares || 0) > 0 ? item.shares : ''}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => setGiftPost(item)}>
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
            <View>
              <Text 
                style={styles.captionText} 
                numberOfLines={expandedCaptions[item.id] ? undefined : 2}
              >
                <Text style={styles.captionUsername} onPress={() => handleProfile(item.user?.id)}>
                  {item.user?.username}{' '}
                </Text>
                {parseCaption(item.caption, item.id)}
              </Text>
              {item.caption.length > 60 && (
                <TouchableOpacity onPress={() => toggleCaption(item.id)}>
                  <Text style={styles.moreBtn}>
                    {expandedCaptions[item.id] ? 'less' : 'more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Inline Comments - show first 1-2 comments */}
          {Array.isArray(item.recent_comments) && item.recent_comments.length > 0 && (
            <View style={styles.inlineCommentsContainer}>
              {item.recent_comments.slice(0, 2).map(comment => (
                <TouchableOpacity 
                  key={comment.id} 
                  style={styles.inlineCommentItem}
                  onPress={() => handleComment(item.id)}
                >
                  <Text style={styles.inlineCommentUsername}>{comment.user?.username || 'User'}</Text>
                  <Text style={styles.inlineCommentText}> {comment.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <TouchableOpacity onPress={() => handleComment(item.id)}>
            <Text style={styles.commentsLink}>
              {(item.comment_count || item.comments_count || 0) > 0 ? `View all ${item.comment_count || item.comments_count || 0} comments` : 'Add a comment...'}
            </Text>
          </TouchableOpacity>

          {/* Hashtags */}
          {(item.hashtags_list?.length > 0 || item.hashtags) && (
            <View style={styles.hashtagsContainer}>
              {(item.hashtags_list || (item.hashtags || '').split(/\s+/).filter(Boolean)).map((tag, idx) => (
                <Text key={idx} style={styles.hashtagText}>#{tag}</Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar translucent backgroundColor="transparent" style="dark" />
        {renderHeader()}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={T.pri} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" style="dark" />
      {renderHeader()}
      <FlashList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        estimatedItemSize={450}
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

      {/* ── Post Menu Modal ── */}
      <Modal visible={!!showPostMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowPostMenu(null)}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Post Options</Text>
            
            <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowPostMenu(null); handleShare(showPostMenu.id); }}>
              <Ionicons name="link-outline" size={20} color={T.txt} />
              <Text style={styles.sheetItemText}>Copy Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowPostMenu(null); alert('Post info: ' + showPostMenu.caption); }}>
              <Ionicons name="information-circle-outline" size={20} color={T.txt} />
              <Text style={styles.sheetItemText}>Post Info</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowPostMenu(null); alert('Reported'); }}>
              <Ionicons name="flag-outline" size={20} color="#EF4444" />
              <Text style={[styles.sheetItemText, { color: '#EF4444' }]}>Report Post</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetClose} onPress={() => setShowPostMenu(null)}>
              <Text style={styles.sheetCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Gift Modal ── */}
      <Modal visible={!!giftPost} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setGiftPost(null)}
        >
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <Ionicons name="gift" size={24} color={BRAND_GOLD} />
                <Text style={styles.sheetTitle}>Send Gift to @{giftPost?.user?.username}</Text>
              </View>
            </View>

            <ScrollView style={styles.giftScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.giftLabel}>Choose an amount</Text>
              <View style={styles.giftGrid}>
                {[10, 25, 50, 100, 250, 500].map(amt => (
                  <TouchableOpacity 
                    key={amt} 
                    style={[styles.giftChip, giftAmount === amt && styles.giftChipActive]}
                    onPress={() => { setGiftAmount(amt); setCustomGift(''); }}
                  >
                    <Ionicons name="flash" size={14} color={giftAmount === amt ? '#fff' : BRAND_GOLD} />
                    <Text style={[styles.giftChipText, giftAmount === amt && styles.giftChipTextActive]}>{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.giftLabel}>Or custom amount</Text>
              <TextInput
                style={styles.giftInput}
                placeholder="Enter coins..."
                keyboardType="numeric"
                value={customGift}
                onChangeText={setCustomGift}
              />

              <Text style={styles.giftLabel}>Message (optional)</Text>
              <TextInput
                style={[styles.giftInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Say something nice..."
                multiline
                value={giftMessage}
                onChangeText={setGiftMessage}
              />

              <TouchableOpacity 
                style={[styles.sendGiftBtn, loading && { opacity: 0.7 }]} 
                onPress={handleSendGift}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendGiftBtnText}>Send Gift</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: T.bg,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  tabButton: {
    // Matches web: px-18 py-8 rounded-20 chip
    paddingHorizontal: 18,
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
    // Active = brand-gold solid fill, matching web
    backgroundColor: T.pri,
    shadowColor: T.pri,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: T.txt,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
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
    height: 350,
    backgroundColor: '#000',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    fontSize: 12,
    fontWeight: '600',
    color: T.sub,
    minWidth: 16,
    textAlign: 'center',
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
  hashtagText: {
    color: T.pri,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  commentsLink: {
    color: T.sub,
    fontSize: 13,
    marginTop: 6,
  },
  moreBtn: {
    color: T.pri,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  hashtagText: {
    fontSize: 13,
    color: T.pri,
    fontWeight: '600',
  },
  inlineCommentsContainer: {
    marginTop: 8,
    flexDirection: 'column',
    gap: 4,
  },
  inlineCommentItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  inlineCommentUsername: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  inlineCommentText: {
    fontSize: 13,
    color: '#333',
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
  sheetCloseText: { fontSize: 16, fontWeight: '700', color: T.sub },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '80%', marginHorizontal: 0 },
  sheetHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F4' },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E7E5E4', borderRadius: 2, alignSelf: 'center', marginBottom: 15, marginTop: 8 },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#1C1917', textAlign: 'center', paddingHorizontal: 20 },
  giftScroll: { padding: 20 },
  giftLabel: { fontSize: 13, fontWeight: '700', color: '#78716C', marginBottom: 12, textTransform: 'uppercase' },
  giftGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  giftChip: { flexBasis: '30%', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#F5F5F4', backgroundColor: '#FAFAF9', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
  giftChipActive: { borderColor: BRAND_GOLD, backgroundColor: '#FFF8F0' },
  giftChipText: { fontSize: 14, fontWeight: '700', color: '#444' },
  giftChipTextActive: { color: BRAND_GOLD },
  giftInput: { backgroundColor: '#FAFAF9', borderWidth: 1.5, borderColor: '#F5F5F4', borderRadius: 12, padding: 14, fontSize: 16, color: '#1C1917', marginBottom: 20 },
  sendGiftBtn: { backgroundColor: BRAND_GOLD, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 10 },
  sendGiftBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F4' },
  sheetItemText: { fontSize: 16, fontWeight: '600', marginLeft: 12, color: T.txt },
  sheetClose: { marginTop: 10, paddingVertical: 15, alignItems: 'center' },
});
