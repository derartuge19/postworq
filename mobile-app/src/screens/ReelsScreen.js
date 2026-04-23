import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Platform,
  Animated,
  PanResponder,
  Modal,
  Alert,
  Share,
  ScrollView,
  TextInput,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import api from '../api';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const BRAND_GOLD = '#DA9B2A';

// ─────────────────────────────────────────────────────────────
// Single Reel Item Component
// ─────────────────────────────────────────────────────────────
const ReelItem = React.memo(({ item, isActive, isFocused, onComment, onProfile, onShare, onSave, onLongPress, onGift }) => {
  const videoRef = useRef(null);
  const insets = useSafeAreaInsets();
  
  const [liked, setLiked]           = useState(item.is_liked || false);
  const [likeCount, setLikeCount]   = useState(item.votes || 0);
  const [following, setFollowing]   = useState(item.user?.is_following || false);
  const [muted, setMuted]           = useState(false);
  const [paused, setPaused]         = useState(false);
  const [saved, setSaved]           = useState(item.is_saved || false);
  const [expanded, setExpanded]     = useState(false);

  // Heart animation state
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  // Play / pause based on visibility AND screen focus
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive && isFocused && !paused) {
      videoRef.current.playAsync().catch(() => {});
    } else {
      videoRef.current.pauseAsync().catch(() => {});
    }
  }, [isActive, isFocused, paused]);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount(c => next ? c + 1 : c - 1);
    try {
      await api.voteReel(item.id);
    } catch {
      setLiked(!next);
      setLikeCount(c => next ? c - 1 : c + 1);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap detected
      if (!liked) handleLike();
      animateHeart();
      // Clear timeout if double tap happens
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
    } else {
      // Single tap detected - toggle pause after delay
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      tapTimeout.current = setTimeout(() => {
        setPaused(p => !p);
        tapTimeout.current = null;
      }, 300);
    }
    lastTap.current = now;
  };

  const tapTimeout = useRef(null);

  const animateHeart = () => {
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 0, duration: 200, delay: 500, useNativeDriver: true }),
    ]).start();
  };

  const handleSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      await api.toggleSavePost(item.id);
    } catch {
      setSaved(!next);
    }
  };

  const handleFollow = async () => {
    if (following) return;
    setFollowing(true);
    try {
      await api.toggleFollow(item.user?.id);
    } catch {
      setFollowing(false);
    }
  };

  // ── Swipe to restart gesture ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 30 && Math.abs(gesture.dy) < 10,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 100) { // Swipe right to restart
          videoRef.current?.setPositionAsync(0);
          videoRef.current?.playAsync();
        }
      }
    })
  ).current;

  const mediaUri = item.media || item.image || '';
  const username = item.user?.username || 'unknown';
  const avatarUri = item.user?.profile_photo;
  const initial = username[0]?.toUpperCase() || '?';
  const bottomBase = 60 + insets.bottom;

  return (
    <View style={styles.slide} {...panResponder.panHandlers}>

      {/* ── Full-screen Video ── */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleDoubleTap}
        onLongPress={() => onLongPress(item)}
        delayLongPress={500}
        style={StyleSheet.absoluteFill}
      >
        <Video
          ref={videoRef}
          source={{ uri: mediaUri }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          isLooping
          isMuted={muted}
          shouldPlay={isActive && isFocused && !paused}
          useNativeControls={false}
        />
      </TouchableOpacity>

      {/* ── Heart Pop Animation Overlay ── */}
      <Animated.View style={[styles.heartOverlay, { transform: [{ scale: heartScale }] }]}>
        <Ionicons name="heart" size={100} color="#ff4040" />
      </Animated.View>

      {/* ── Gradient scrim at bottom ── */}
      <View style={styles.scrim} pointerEvents="none" />

      {/* ── Pause icon (center) ── */}
      {paused && (
        <View style={styles.pauseCenter} pointerEvents="none">
          <Ionicons name="play" size={60} color="rgba(255,255,255,0.8)" />
        </View>
      )}

      {/* ────────────────────────────────────────────
          RIGHT SIDEBAR (Matches web order: Like, Mute, Comment, Share, Save)
      ──────────────────────────────────────────── */}
      <View style={[styles.sidebar, { bottom: bottomBase + 20 }]}>

        {/* 1. Like */}
        <TouchableOpacity style={styles.sideBtn} onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={36}
            color={liked ? '#ff4040' : '#fff'}
          />
          <Text style={styles.sideBtnLabel}>{likeCount}</Text>
        </TouchableOpacity>

        {/* 2. Mute (Premium integration like web) */}
        <TouchableOpacity style={styles.sideBtn} onPress={() => setMuted(!muted)}>
          <Ionicons
            name={muted ? 'volume-mute' : 'volume-high'}
            size={32}
            color="#fff"
          />
          <Text style={styles.sideBtnLabel}>{muted ? 'Off' : 'On'}</Text>
        </TouchableOpacity>

        {/* 3. Comment */}
        <TouchableOpacity style={styles.sideBtn} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={32} color="#fff" />
          <Text style={styles.sideBtnLabel}>{item.comment_count || 0}</Text>
        </TouchableOpacity>

        {/* 4. Share */}
        <TouchableOpacity style={styles.sideBtn} onPress={onShare}>
          <Ionicons name="paper-plane-outline" size={30} color="#fff" />
          <Text style={styles.sideBtnLabel}>Share</Text>
        </TouchableOpacity>

        {/* 5. Save/Favorite */}
        <TouchableOpacity style={styles.sideBtn} onPress={handleSave}>
          <Ionicons 
            name={saved ? 'bookmark' : 'bookmark-outline'} 
            size={30} 
            color={saved ? BRAND_GOLD : '#fff'} 
          />
          <Text style={styles.sideBtnLabel}>Save</Text>
        </TouchableOpacity>

        {/* 6. Gift (Gamification) */}
        <TouchableOpacity style={styles.sideBtn} onPress={() => onGift(item)}>
          <Ionicons name="gift-outline" size={32} color={BRAND_GOLD} />
          <Text style={[styles.sideBtnLabel, { color: BRAND_GOLD }]}>Gift</Text>
        </TouchableOpacity>

      </View>

      {/* ────────────────────────────────────────────
          BOTTOM LEFT (Creator info)
      ──────────────────────────────────────────── */}
      <View style={[styles.bottomInfo, { bottom: bottomBase + 12 }]}>
        <TouchableOpacity onPress={() => onProfile(item.user?.id)} style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          {!following && (
            <TouchableOpacity style={styles.followDot} onPress={handleFollow}>
              <Ionicons name="add" size={10} color="#fff" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <View style={styles.textBlock}>
          <TouchableOpacity onPress={() => onProfile(item.user?.id)}>
            <Text style={styles.username}>@{username}</Text>
          </TouchableOpacity>
          {!!item.caption && (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setExpanded(!expanded)}>
              <Text style={styles.caption} numberOfLines={expanded ? undefined : 2}>
                {item.caption}
                {!expanded && item.caption.length > 50 && (
                  <Text style={styles.moreLabel}> ...more</Text>
                )}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

    </View>
  );
});

export default function ReelsScreen({ route, navigation }) {
  const isFocused      = useIsFocused();
  const insets         = useSafeAreaInsets();
  const [reels, setReels]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [visibleIdx, setVisibleIdx] = useState(0);
  const [hasMore, setHasMore]       = useState(true);
  const [longPressItem, setLongPressItem] = useState(null);

  const initialId = route?.params?.reelId;

  const [visibleItems, setVisibleItems] = useState([]);
  const [giftPost, setGiftPost] = useState(null);
  const [giftAmount, setGiftAmount] = useState(50);
  const [customGift, setCustomGift] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => { fetchReels(0); }, []);

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
      await api.sendGift(giftPost.user?.username, amount, giftMessage || 'Gift from Reels!');
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

  const handleShare = async (reel) => {
    try {
      await Share.share({
        message: `Check out this reel on FlipStar! ${config.API_BASE_URL.replace('/api', '')}/reel/${reel.id}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const fetchReels = async (offset = 0) => {
    try {
      const data    = await api.request(`/reels/?limit=15&offset=${offset}`);
      const raw     = Array.isArray(data) ? data : (data.results || []);
      const isVideo = (url) => {
        if (!url) return false;
        return url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) || url.includes('/video/upload/');
      };
      
      let items = raw.filter(r => isVideo(r.media || r.image));
      
      if (offset === 0 && initialId) {
        const idx = items.findIndex(r => r.id === initialId);
        if (idx > 0) {
          const [t] = items.splice(idx, 1);
          items.unshift(t);
        }
        setReels(items);
      } else if (offset === 0) {
        setReels(items);
      } else {
        setReels(prev => [...prev, ...items]);
      }
      setHasMore(!!data?.next);
    } catch (e) {
      console.error('Reels fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setVisibleIdx(viewableItems[0].index ?? 0);
    }
  }).current;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={BRAND_GOLD} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <FlatList
        data={reels}
        keyExtractor={item => String(item.id)}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            isActive={index === visibleIdx}
            isFocused={isFocused}
            onComment={() => navigation.navigate('Comments', { reelId: item.id })}
            onProfile={(uid) => navigation.navigate('ProfileDetail', { userId: uid })}
            onShare={() => handleShare(item)}
            onSave={() => {}}
            onLongPress={(item) => setLongPressItem(item)}
            onGift={(item) => setGiftPost(item)}
          />
        )}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        updateCellsBatchingPeriod={50}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        onEndReached={() => hasMore && !loading && fetchReels(reels.length)}
        onEndReachedThreshold={0.5}
      />

      {/* ── Long Press Modal ── */}
      <Modal visible={!!longPressItem} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setLongPressItem(null)}
        >
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              handleShare(longPressItem);
              setLongPressItem(null);
            }}>
              <Ionicons name="share-outline" size={24} color="#000" />
              <Text style={styles.menuItemText}>Share to...</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => {
              Alert.alert('Report', 'Post has been reported for review.');
              setLongPressItem(null);
            }}>
              <Ionicons name="flag-outline" size={24} color="#FF3B30" />
              <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => {
              Alert.alert('Not Interested', 'We will show you fewer posts like this.');
              setLongPressItem(null);
            }}>
              <Ionicons name="eye-off-outline" size={24} color="#000" />
              <Text style={styles.menuItemText}>Not Interested</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomWidth: 0 }]} 
              onPress={() => setLongPressItem(null)}
            >
              <Text style={[styles.menuItemText, { marginLeft: 0, width: '100%', textAlign: 'center', fontWeight: '700' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating Header */}
      <View style={[styles.header, { top: (Platform.OS === 'android' ? StatusBar.currentHeight : insets.top) + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reels</Text>
        <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('Create')}>
          <Ionicons name="camera-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

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
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  loader: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  slide: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' },
  heartOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  pauseCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  sidebar: { position: 'absolute', right: 12, alignItems: 'center', zIndex: 20 },
  sideBtn: { alignItems: 'center', marginBottom: 20 },
  sideBtnLabel: { 
    color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 3,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 
  },
  bottomInfo: { position: 'absolute', left: 12, right: 75, flexDirection: 'row', alignItems: 'flex-end', zIndex: 20 },
  avatarWrap: { position: 'relative', marginRight: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff' },
  avatarFallback: { backgroundColor: BRAND_GOLD, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: BRAND_GOLD, fontWeight: '700', fontSize: 16 },
  followDot: { 
    position: 'absolute', bottom: -2, right: -2, backgroundColor: BRAND_GOLD, 
    width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' 
  },
  textBlock: { marginLeft: 12, flex: 1 },
  username: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  caption: { color: '#fff', fontSize: 14, lineHeight: 18 },
  moreLabel: { color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menuCard: { width: SCREEN_WIDTH * 0.7, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  menuItemText: { marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#000' },
  header: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  
  // Gifting Styles
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, maxHeight: '80%' },
  sheetHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F4' },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E7E5E4', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#1C1917' },
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
});
