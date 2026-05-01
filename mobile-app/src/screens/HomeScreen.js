import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, TextInput, Modal, ScrollView,
  Dimensions, Alert, StatusBar, Animated, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const { width, height } = Dimensions.get('window');
const GOLD = '#C8B56A';
const LIGHT_GOLD = '#F9E08B';
const BG = '#0D0D0D';
const CARD = '#1A1A1A';
const BORDER = '#262626';
const TABS = ['For You', 'Explore', 'Campaigns'];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function Avatar({ uri, size = 36, name = '' }) {
  const [err, setErr] = useState(false);
  const safeName = name || '?';
  if (uri && !err) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} onError={() => setErr(true)} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#000', fontWeight: '700', fontSize: size * 0.4 }}>{safeName[0].toUpperCase()}</Text>
    </View>
  );
}

function SkeletonPost() {
  return (
    <View style={{ backgroundColor: CARD, marginBottom: 8, padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#2a2a2a' }} />
        <View style={{ marginLeft: 10 }}>
          <View style={{ width: 100, height: 12, borderRadius: 6, backgroundColor: '#2a2a2a', marginBottom: 6 }} />
          <View style={{ width: 60, height: 10, borderRadius: 5, backgroundColor: '#222' }} />
        </View>
      </View>
      <View style={{ width: '100%', height: width * 0.75, borderRadius: 8, backgroundColor: '#2a2a2a' }} />
      <View style={{ flexDirection: 'row', marginTop: 10, gap: 16 }}>
        <View style={{ width: 48, height: 12, borderRadius: 6, backgroundColor: '#2a2a2a' }} />
        <View style={{ width: 48, height: 12, borderRadius: 6, backgroundColor: '#2a2a2a' }} />
      </View>
    </View>
  );
}


export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const user = auth?.user ?? null;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentPost, setCommentPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [activeTab, setActiveTab] = useState('For You');
  const [showOptions, setShowOptions] = useState(null);
  const [followStates, setFollowStates] = useState({});
  const [viewCounts, setViewCounts] = useState({});
  const [shareToast, setShareToast] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [sendingGift, setSendingGift] = useState(false);
  const [giftSent, setGiftSent] = useState(null);
  const [giftError, setGiftError] = useState('');
  const [userCoins, setUserCoins] = useState(0);
  const [gifts, setGifts] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const LIMIT = 5;

  const CATEGORY_ICONS = {
    flowers: '🌹',
    hearts: '❤️',
    gems: '💎',
    special: '⭐',
    animals: '🐻',
  };

  const DEFAULT_GIFTS = [
    { id: 1, name: 'Rose', description: 'A beautiful red rose', coin_value: 10, rarity: 'common', category: 'flowers' },
    { id: 2, name: 'Heart', description: 'A heart symbol', coin_value: 20, rarity: 'common', category: 'hearts' },
    { id: 3, name: 'Medal', description: 'A gold medal', coin_value: 50, rarity: 'rare', category: 'special' },
    { id: 4, name: 'Diamond', description: 'A sparkling diamond', coin_value: 100, rarity: 'epic', category: 'gems' },
    { id: 5, name: 'Teddy Bear', description: 'A cute teddy bear', coin_value: 30, rarity: 'common', category: 'animals' },
  ];

  useEffect(() => {
    if (activeTab === 'For You') {
      // Show stale cache immediately, refresh in background
      const stale = api.requestStale(`/reels/?limit=${LIMIT}&offset=0`, (fresh) => {
        const results = Array.isArray(fresh) ? fresh : (fresh.results || []);
        setPosts(results);
        setHasMore(results.length === LIMIT);
        setPage(0);
      });
      if (stale) {
        const results = Array.isArray(stale) ? stale : (stale.results || []);
        setPosts(results);
        setHasMore(results.length === LIMIT);
        setPage(0);
        setLoading(false);
      } else {
        fetchPosts(0, true);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const loadUserCoins = async () => {
      try {
        const status = await api.request('/gamification/status/');
        setUserCoins(status.coins?.balance || 0);
      } catch (error) {
        console.error('Failed to load user coins:', error);
      }
    };
    loadUserCoins();
  }, [showGiftModal]);

  useEffect(() => {
    const loadGifts = async () => {
      try {
        const response = await api.request('/gifts/');
        const giftsData = response.results || response;
        if (Array.isArray(giftsData) && giftsData.length > 0) {
          setGifts(giftsData);
        } else {
          setGifts(DEFAULT_GIFTS);
        }
      } catch (error) {
        console.error('Failed to load gifts:', error);
        setGifts(DEFAULT_GIFTS);
      }
    };
    loadGifts();
  }, []);

  const fetchPosts = async (offset = 0, reset = false) => {
    try {
      if (reset) setLoading(true); else setLoadingMore(true);
      const data = await api.request(`/reels/?limit=${LIMIT}&offset=${offset}`);
      const results = Array.isArray(data) ? data : (data.results || []);
      setPosts(prev => reset ? results : [...prev, ...results]);
      setHasMore(results.length === LIMIT);
      setPage(offset);
    } catch (e) {
      console.error('Feed error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleTabPress = (tab) => {
    if (tab === 'Explore') {
      navigation.navigate('Explore');
      return;
    }
    if (tab === 'Campaigns') {
      navigation.navigate('Campaigns');
      return;
    }
    setActiveTab(tab);
  };

  const onRefresh = () => { setRefreshing(true); fetchPosts(0, true); };
  const onEndReached = () => { if (!loadingMore && hasMore && activeTab === 'For You') fetchPosts(page + LIMIT); };

  const sharePost = async (post) => {
    const url = `https://flipstar.app/post/${post.id}`;
    const title = post.caption ? post.caption.slice(0, 80) : 'Check out this post on FlipStar';
    
    try {
      await Share.share({
        message: `${title} ${url}`,
        title: 'FlipStar Post',
      });
      // Increment share count
      try { await api.request(`/reels/${post.id}/share/`, { method: 'POST' }); } catch {}
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const toggleFollow = async (userId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to follow users');
      return;
    }
    
    setFollowStates(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await api.request('/follows/toggle/', {
        method: 'POST',
        body: JSON.stringify({ following_id: userId }),
      });
      
      // Update follow status based on response
      const newFollowStatus = response.following !== undefined ? response.following : true;
      setPosts(prev => prev.map(p => 
        p.user?.id === userId ? { ...p, user: { ...p.user, is_following: newFollowStatus } } : p
      ));
      setFollowStates(prev => ({ ...prev, [userId]: newFollowStatus }));
    } catch (error) {
      console.error('Follow error:', error);
      setFollowStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  const trackView = async (postId) => {
    if (viewCounts[postId]) return;
    
    setViewCounts(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await api.request(`/reels/${postId}/view/`, { method: 'POST' });
      if (res?.view_count !== undefined) {
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, view_count: res.view_count } : p
        ));
      }
    } catch {}
  };

  const showPostOptions = (post) => {
    setShowOptions(post);
  };

  const copyPostLink = async (post) => {
    const url = `https://flipstar.app/post/${post.id}`;
    // In React Native, we'll just show a toast since clipboard access varies
    setShareToast('Link copied!');
    setTimeout(() => setShareToast(''), 2000);
    setShowOptions(null);
  };

  const reportPost = (post) => {
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => submitReport(post, 'spam') },
        { text: 'Inappropriate', onPress: () => submitReport(post, 'inappropriate') },
        { text: 'Other', onPress: () => submitReport(post, 'other') },
      ]
    );
    setShowOptions(null);
  };

  const submitReport = async (post, reason) => {
    try {
      await api.request('/reports/create/', {
        method: 'POST',
        body: JSON.stringify({
          reported_reel_id: post.id,
          report_type: reason,
          description: `Reported as ${reason}`,
        }),
      });
      Alert.alert('Success', 'Report submitted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report');
    }
  };

  const goToReel = (postId) => {
    trackView(postId);
    navigation.navigate('ReelsDetail', { initialVideoId: postId });
  };

  const toggleLike = async (post) => {
    const newLiked = !post.is_liked;
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, is_liked: newLiked, votes: newLiked ? (p.votes + 1) : Math.max(0, p.votes - 1) }
      : p));
    try { 
      await api.request(`/reels/${post.id}/vote/`, { method: 'POST' });
    } catch { 
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_liked: post.is_liked, votes: post.votes } : p));
    }
  };

  const toggleSave = async (post) => {
    const newSaved = !post.is_saved;
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_saved: newSaved } : p));
    try {
      await api.request(`/reels/${post.id}/save/`, { method: 'POST' });
    } catch {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_saved: post.is_saved } : p));
    }
  };

  const openGiftModal = (postUser) => {
    setGiftRecipient(postUser?.username || '');
    setSelectedGift(null);
    setGiftQuantity(1);
    setGiftMessage('');
    setGiftError('');
    setGiftSent(null);
    setSelectedCategory('all');
    setShowGiftModal(true);
  };

  const sendGift = async () => {
    if (!giftRecipient.trim()) {
      setGiftError('Enter a recipient username');
      return;
    }
    if (!selectedGift) {
      setGiftError('Select a gift to send');
      return;
    }
    const totalCost = selectedGift.coin_value * giftQuantity;
    if (totalCost > userCoins) {
      setGiftError('Insufficient coins');
      return;
    }
    setSendingGift(true);
    setGiftError('');
    try {
      const res = await api.request('/gifts/send/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gift_id: selectedGift.id,
          recipient_username: giftRecipient,
          quantity: giftQuantity,
          message: giftMessage,
        }),
      });
      setGiftSent(res);
      setUserCoins(prev => prev - totalCost);
    } catch (error) {
      setGiftError(error.message || 'Failed to send gift');
    } finally {
      setSendingGift(false);
    }
  };

  const openComments = async (post) => {
    setCommentPost(post);
    try {
      const data = await api.request(`/reels/${post.id}/comments/?include_replies=true`);
      setComments(Array.isArray(data) ? data : (data.results || []));
    } catch { setComments([]); }
  };

  const postComment = async () => {
    if (!commentText.trim() || !commentPost) return;
    setPostingComment(true);
    try {
      const c = await api.request(`/reels/${commentPost.id}/comments/`, {
        method: 'POST', body: JSON.stringify({ text: commentText.trim() }),
      });
      setComments(prev => [c, ...prev]);
      setCommentText('');
      setPosts(prev => prev.map(p => p.id === commentPost.id
        ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p));
    } catch { Alert.alert('Error', 'Failed to post comment'); }
    finally { setPostingComment(false); }
  };

  const renderHashtags = (hashtags) => {
    if (!hashtags) return null;
    const tags = String(hashtags).split(/[\s,]+/).filter(Boolean)
      .map(t => t.startsWith('#') ? t : `#${t}`).join('  ');
    return <Text style={styles.hashtags}>{tags}</Text>;
  };

  const renderPost = ({ item: post, index }) => {
    const isVideo = !!(post.media) && (
      /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.media) ||
      post.media.includes('/video/upload/')
    );
    const isOwnPost = user?.id === post.user?.id;
    const isFollowing = post.user?.is_following || followStates[post.user?.id];
    const isCampaignPost = !!(post.is_campaign_post || post.campaign_id || post.campaign);
    
    return (
      <Animated.View 
        style={[
          styles.postCard, 
          { opacity: scrollY.interpolate({
            inputRange: [0, 300],
            outputRange: [1, 0.8],
            extrapolate: 'clamp',
          })}
        ]}
      >
        {/* Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.postUser}
            onPress={() => navigation.navigate('Profile', { userId: post.user?.id })}
          >
            <Avatar uri={post.user?.profile_photo} size={36} name={post.user?.username} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.username}>{post.user?.username || 'Unknown'}</Text>
                <Ionicons name="checkmark-circle" size={14} color={GOLD} />
              </View>
              <Text style={styles.timeAgo}>{timeAgo(post.created_at)}</Text>
            </View>
          </TouchableOpacity>
          
          {/* Follow/Unfollow button */}
          {!isOwnPost && (
            <TouchableOpacity
              style={[
                styles.followBtn,
                isFollowing && styles.followingBtn
              ]}
              onPress={() => toggleFollow(post.user?.id)}
            >
              <Text style={[
                styles.followBtnText,
                isFollowing && styles.followingBtnText
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.optionsBtn}
            onPress={() => showPostOptions(post)}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {post.caption && (
          <TouchableOpacity 
            style={styles.captionContainer}
            onPress={() => {}} // Could expand caption
          >
            <Text style={styles.caption} numberOfLines={2}>
              <Text style={styles.captionUsername}>{post.user?.username} </Text>
              {post.caption}
            </Text>
            {post.caption.length > 100 && (
              <Text style={styles.captionMore}> more</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Media */}
        {(post.media || post.image) && (
          <TouchableOpacity onPress={() => goToReel(post.id)} activeOpacity={0.9}>
            <View style={styles.mediaWrapper}>
              {isVideo ? (
                <>
                  <Image
                    source={{ uri: post.image || post.media.replace(/\.(mp4|webm|ogg|mov)$/i, '.jpg') }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                  <View style={styles.playOverlay} pointerEvents="none">
                    <View style={styles.playBtn}>
                      <Ionicons name="play" size={24} color="#000" />
                    </View>
                  </View>
                </>
              ) : (
                <Image
                  source={{ uri: post.image || post.media }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              )}
              
              {/* View count badge */}
              <View style={styles.viewBadge}>
                <Ionicons name="eye" size={12} color="#fff" />
                <Text style={styles.viewCount}>{(post.view_count || 0).toLocaleString()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.leftActions}>
            {/* Like */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post)}>
              <Ionicons
                name={post.is_liked ? 'heart' : 'heart-outline'}
                size={24}
                color={post.is_liked ? LIGHT_GOLD : LIGHT_GOLD}
                fill={post.is_liked ? LIGHT_GOLD : 'none'}
              />
              {post.votes > 0 && <Text style={styles.actionCount}>{post.votes}</Text>}
            </TouchableOpacity>
            
            {/* Comment */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(post)}>
              <Ionicons name="chatbubble-outline" size={22} color={LIGHT_GOLD} />
              {post.comment_count > 0 && <Text style={styles.actionCount}>{post.comment_count}</Text>}
            </TouchableOpacity>
            
            {/* Share */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => sharePost(post)}>
              <Ionicons name="share-social-outline" size={22} color={LIGHT_GOLD} />
              {post.shares > 0 && <Text style={styles.actionCount}>{post.shares}</Text>}
            </TouchableOpacity>
            
            {/* Gift - only for other people's posts */}
            {post.user?.username !== user?.username && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => openGiftModal(post.user)}>
                <Ionicons name="gift-outline" size={22} color={LIGHT_GOLD} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Save */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => toggleSave(post)}
          >
            <Ionicons
              name={post.is_saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={post.is_saved ? LIGHT_GOLD : LIGHT_GOLD}
            />
          </TouchableOpacity>
        </View>

        {/* Recent comments */}
        {post.recent_comments && post.recent_comments.length > 0 && (
          <TouchableOpacity 
            style={styles.recentComments}
            onPress={() => openComments(post)}
          >
            <Text style={styles.recentComment}>
              <Text style={styles.commentUsername}>{post.recent_comments[0].user?.username} </Text>
              {post.recent_comments[0].text}
            </Text>
          </TouchableOpacity>
        )}

        {/* Comments link */}
        <TouchableOpacity onPress={() => openComments(post)}>
          <Text style={styles.commentsLink}>
            {post.comment_count > 0 ? `View all ${post.comment_count} comments` : 'Add a comment...'}
          </Text>
        </TouchableOpacity>

        {/* Hashtags */}
        {renderHashtags(post.hashtags_list || post.hashtags)}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FlipStar</Text>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={GOLD} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
            <Ionicons name="search" size={24} color={GOLD} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => handleTabPress(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading && posts.length === 0 ? (
        <View style={{ paddingTop: 8 }}>
          <SkeletonPost />
          <SkeletonPost />
          <SkeletonPost />
        </View>
      ) : activeTab === 'For You' ? (
        <Animated.FlatList
          data={posts}
          keyExtractor={p => String(p.id)}
          renderItem={renderPost}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={GOLD} style={{ padding: 16 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ color: '#666', fontSize: 16 }}>No posts yet</Text>
              <Text style={{ color: '#666', marginTop: 8 }}>Be the first to share something!</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={{ color: '#666' }}>Navigate to {activeTab}</Text>
        </View>
      )}

      {/* Share Toast */}
      {shareToast !== '' && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{shareToast}</Text>
        </View>
      )}

      {/* Post Options Modal */}
      <Modal
        visible={!!showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowOptions(null)}
        >
          <View style={styles.optionsSheet}>
            <View style={styles.optionsHandle} />
            <View style={styles.optionsList}>
              <TouchableOpacity style={styles.optionItem} onPress={() => copyPostLink(showOptions)}>
                <Ionicons name="link-outline" size={20} color="#fff" />
                <Text style={styles.optionText}>Copy Link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionItem} onPress={() => reportPost(showOptions)}>
                <Ionicons name="flag-outline" size={20} color="#fff" />
                <Text style={styles.optionText}>Report</Text>
              </TouchableOpacity>
              {user?.id === showOptions?.user?.id && (
                <TouchableOpacity style={styles.optionItem}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete Post</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={styles.cancelOption} 
              onPress={() => setShowOptions(null)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={!!commentPost}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentPost(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentsSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentPost(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {comments.length === 0 ? (
                <Text style={{ color: '#666', textAlign: 'center', padding: 32 }}>
                  No comments yet
                </Text>
              ) : (
                comments.map(c => (
                  <View key={c.id} style={styles.commentItem}>
                    <Avatar uri={c.user?.profile_photo} size={32} name={c.user?.username} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.commentUser}>{c.user?.username}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={styles.commentInput}>
              <Avatar uri={user?.profile_photo} size={32} name={user?.username} />
              <TextInput
                style={styles.commentTextInput}
                placeholder="Add a comment..."
                placeholderTextColor="#666"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                onPress={postComment}
                disabled={!commentText.trim() || postingComment}
              >
                {postingComment ? (
                  <ActivityIndicator size="small" color={GOLD} />
                ) : (
                  <Ionicons
                    name="send"
                    size={22}
                    color={commentText.trim() ? GOLD : '#444'}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gift Modal */}
      <Modal
        visible={showGiftModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGiftModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGiftModal(false)}
        >
          <TouchableOpacity style={styles.giftSheet} activeOpacity={1}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>🎁 Gift to @{giftRecipient}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={styles.coinBalance}>🪙 {userCoins}</Text>
                <TouchableOpacity onPress={() => setShowGiftModal(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {giftSent ? (
              <View style={{ alignItems: 'center', padding: 32 }}>
                <Text style={{ fontSize: 64, marginBottom: 12 }}>🎉</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: GOLD, marginBottom: 4 }}>Gift Sent!</Text>
                <Text style={{ fontSize: 14, color: '#78716C', marginBottom: 24, textAlign: 'center' }}>
                  Your gift has been sent successfully
                </Text>
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => setShowGiftModal(false)}
                >
                  <Text style={styles.sendButtonText}>Done 🎊</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Category Filter */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryFilter}
                  contentContainerStyle={{ paddingHorizontal: 12 }}
                >
                  {['all', ...new Set(gifts.map(g => g.category))].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryButton, selectedCategory === cat && styles.categoryButtonActive]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[styles.categoryButtonText, selectedCategory === cat && styles.categoryButtonTextActive]}>
                        {cat !== 'all' && CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Gift Selection Grid */}
                <View style={styles.giftGrid}>
                  {(selectedCategory === 'all' ? gifts : gifts.filter(g => g.category === selectedCategory)).map(gift => (
                    <TouchableOpacity
                      key={gift.id}
                      style={[styles.giftItem, selectedGift?.id === gift.id && styles.giftItemActive]}
                      onPress={() => { setSelectedGift(gift); setGiftQuantity(1); }}
                    >
                      <Text style={styles.giftEmoji}>{gift.image_url ? '🎁' : (CATEGORY_ICONS[gift.category] || '🎁')}</Text>
                      <Text style={styles.giftCoinValue}>{gift.coin_value}🪙</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Selected Gift Info & Quantity */}
                {selectedGift && (
                  <View style={styles.selectedGiftContainer}>
                    <Text style={styles.selectedGiftName}>{selectedGift.name}</Text>
                    <View style={styles.quantitySelector}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setGiftQuantity(Math.max(1, giftQuantity - 1))}
                      >
                        <Text style={styles.quantityButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.quantityValue}>{giftQuantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setGiftQuantity(giftQuantity + 1)}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Message Input */}
                <Text style={styles.fieldLabel}>Message (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Add a message..."
                  placeholderTextColor="#666"
                  value={giftMessage}
                  onChangeText={setGiftMessage}
                />

                {giftError ? <Text style={styles.errorText}>{giftError}</Text> : null}

                {/* Send Button */}
                <TouchableOpacity
                  style={[styles.sendButton, sendingGift && { opacity: 0.6 }]}
                  onPress={sendGift}
                  disabled={sendingGift || !selectedGift}
                >
                  {sendingGift ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.sendButtonText}>
                      Send Gift · 🪙 {selectedGift ? selectedGift.coin_value * giftQuantity : 0}
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: GOLD },
  
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tab: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: CARD,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: LIGHT_GOLD,
  },
  activeTabText: {
    color: '#000',
    fontWeight: '700',
  },
  
  // Post Card
  postCard: { 
    backgroundColor: CARD, 
    marginHorizontal: 8,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 12,
  },
  postUser: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  username: { fontSize: 14, fontWeight: '700', color: '#fff' },
  timeAgo: { fontSize: 12, color: LIGHT_GOLD, marginTop: 1 },
  followBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  followingBtn: {
    backgroundColor: 'rgba(249,224,139,0.15)',
    borderColor: GOLD,
  },
  followBtnText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
  },
  followingBtnText: {
    color: GOLD,
  },
  optionsBtn: {
    padding: 4,
  },
  
  // Caption
  captionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  caption: { 
    fontSize: 14, 
    color: '#ddd', 
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '700',
    color: LIGHT_GOLD,
  },
  captionMore: {
    color: '#666',
    fontWeight: '600',
    fontSize: 12,
  },
  
  // Media
  mediaWrapper: { position: 'relative' },
  mediaImage: { 
    width: '100%', 
    height: width * 0.75, 
    backgroundColor: '#111',
  },
  playOverlay: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playBtn: {
    width: 56, 
    height: 56, 
    borderRadius: 28,
    backgroundColor: 'rgba(249,224,139,0.9)',
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  viewBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Actions
  actions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 12, 
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionCount: { 
    fontSize: 13, 
    color: LIGHT_GOLD, 
    marginLeft: 3,
    fontWeight: '600',
  },
  
  // Comments
  recentComments: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  recentComment: {
    fontSize: 12,
    color: '#ddd',
    lineHeight: 16,
  },
  commentUsername: {
    fontWeight: '700',
    color: LIGHT_GOLD,
  },
  commentsLink: {
    fontSize: 12,
    color: LIGHT_GOLD,
    paddingHorizontal: 12,
    paddingBottom: 8,
    fontWeight: '600',
  },
  
  // Hashtags
  hashtags: { 
    fontSize: 13, 
    color: LIGHT_GOLD, 
    paddingHorizontal: 12, 
    paddingBottom: 12, 
    fontWeight: '600', 
    lineHeight: 20,
  },
  
  // Modals
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'flex-end' 
  },
  optionsSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  optionsHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  optionsList: {
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelOption: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 10,
  },
  cancelText: {
    color: LIGHT_GOLD,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Comments Modal
  commentsSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '75%',
    paddingBottom: 20,
  },
  sheetHandle: { 
    width: 40, 
    height: 4, 
    backgroundColor: '#444', 
    borderRadius: 2, 
    alignSelf: 'center', 
    marginTop: 10 
  },
  sheetHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: BORDER,
  },
  sheetTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#fff' 
  },
  commentItem: { 
    flexDirection: 'row', 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1a1a1a' 
  },
  commentUser: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: LIGHT_GOLD, 
    marginBottom: 2 
  },
  commentText: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 18
  },

  // Gift Modal
  giftSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    paddingBottom: 40,
  },
  coinBalance: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
  },
  categoryFilter: {
    marginBottom: 12,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#1a1a1a',
    marginRight: 6,
  },
  categoryButtonActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(249,224,139,0.15)',
  },
  categoryButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
  },
  categoryButtonTextActive: {
    color: GOLD,
  },
  giftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  giftItem: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '1%',
  },
  giftItemActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(249,224,139,0.15)',
  },
  giftEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  giftCoinValue: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD,
  },
  selectedGiftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  selectedGiftName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  quantityValue: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 8,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: BORDER,
    marginHorizontal: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    marginHorizontal: 12,
  },
  sendButton: {
    width: '92%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: GOLD,
    marginTop: 16,
    alignSelf: 'center',
  },
  sendButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 10,
  },
  commentTextInput: {
    flex: 1, 
    backgroundColor: '#1a1a1a', 
    borderRadius: 20,
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    color: '#fff', 
    fontSize: 14, 
    maxHeight: 80,
  },
  
  // Toast
  toast: {
    position: 'absolute',
    bottom: 80,
    left: width / 2 - 60,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});


