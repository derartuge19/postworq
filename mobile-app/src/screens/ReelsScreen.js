import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Animated,
  PanResponder,
  Alert,
  Share,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../api';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import GiftSelectorScreen from './GiftSelectorScreen';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const BRAND_GOLD = '#C8B56A';

const isVideo = (url) => {
  if (!url) return false;
  return url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) || url.includes('/video/upload/');
};

// ─────────────────────────────────────────────────────────────
// Single Reel Item Component
// ─────────────────────────────────────────────────────────────
const ReelItem = React.memo(({ item, isActive, isFocused, onComment, onProfile, onShare, onSave, onLongPress, navigation }) => {
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
  const tapTimeout = useRef(null);
  const DOUBLE_TAP_WINDOW = 280; // ms - match web app

  // Play / pause based on visibility AND screen focus
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive && isFocused && !paused) {
      videoRef.current.playAsync().catch((err) => {
        console.log('Play error:', err.message);
      });
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

  // Clear any pending single-tap timer
  const clearPendingSingleTap = () => {
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
      tapTimeout.current = null;
    }
  };

  const togglePause = () => {
    const nextPaused = !paused;
    console.log('ReelItem: Toggling pause to:', nextPaused);
    setPaused(nextPaused);
    
    // Immediate playback control
    if (videoRef.current) {
      if (nextPaused) {
        videoRef.current.pauseAsync().catch(() => {});
      } else if (isActive && isFocused) {
        videoRef.current.playAsync().catch((err) => {
          console.log('Resume play error:', err.message);
        });
      }
    }
  };

  const handleVideoTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap.current;
    
    if (timeSinceLastTap < DOUBLE_TAP_WINDOW) {
      // Double tap detected - LIKE
      console.log('ReelItem: Double tap! Liking...');
      clearPendingSingleTap();
      if (!liked) handleLike();
      animateHeart();
    } else {
      // First tap - schedule single tap action (pause toggle)
      tapTimeout.current = setTimeout(() => {
        togglePause();
        tapTimeout.current = null;
      }, DOUBLE_TAP_WINDOW);
    }
    
    lastTap.current = now;
  };

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

  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'

  const onReadyForDisplay = (event) => {
    if (event.naturalSize) {
      const { width, height } = event.naturalSize;
      const newOrientation = width > height ? 'landscape' : 'portrait';
      console.log(`ReelItem: Video natural size: ${width}x${height} (${newOrientation})`);
      setOrientation(newOrientation);
    }
  };

  const bgImageUri = item.thumbnail || item.image || (mediaUri.includes('.mp4') ? null : mediaUri);

  return (
    <View style={styles.slide} {...panResponder.panHandlers}>

      {/* ── Background (Blurred for landscape) ── */}
      {orientation === 'landscape' && (
        <View style={StyleSheet.absoluteFill}>
          {bgImageUri ? (
            <Image 
              source={{ uri: bgImageUri }} 
              style={StyleSheet.absoluteFill} 
              blurRadius={Platform.OS === 'ios' ? 20 : 10} // Adjust for platform
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0B0B0C' }]} />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
        </View>
      )}

      {/* ── Full-screen Video ── */}
      <View style={StyleSheet.absoluteFill}>
        <Video
          ref={videoRef}
          source={{ uri: mediaUri }}
          style={StyleSheet.absoluteFill}
          resizeMode={orientation === 'landscape' ? ResizeMode.CONTAIN : ResizeMode.COVER}
          isLooping
          isMuted={muted}
          shouldPlay={isActive && isFocused && !paused}
          useNativeControls={false}
          onReadyForDisplay={onReadyForDisplay}
        />
        {/* Transparent touch layer to capture gestures */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleVideoTap}
          onLongPress={() => onLongPress(item)}
          delayLongPress={500}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* ── Heart Pop Animation Overlay ── */}
      <Animated.View style={[styles.heartOverlay, { transform: [{ scale: heartScale }] }]}>
        <Ionicons name="heart" size={100} color={BRAND_GOLD} />
      </Animated.View>

      {/* ── Gradient scrim at bottom ── */}
      <View style={styles.scrim} pointerEvents="none" />

      {/* ── Play/Pause indicator (center) ── */}
      {paused && (
        <View style={styles.pauseCenter} pointerEvents="none">
          <View style={styles.pauseCircle}>
            <Ionicons name="play" size={40} color="#fff" style={{ marginLeft: 4 }} />
          </View>
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
            color={liked ? BRAND_GOLD : BRAND_GOLD}
          />
          <Text style={styles.sideBtnLabel}>{likeCount}</Text>
        </TouchableOpacity>

        {/* 2. Mute (Premium integration like web) */}
        <TouchableOpacity style={styles.sideBtn} onPress={() => setMuted(!muted)}>
          <Ionicons
            name={muted ? 'volume-mute' : 'volume-high'}
            size={32}
            color={BRAND_GOLD}
          />
          <Text style={styles.sideBtnLabel}>{muted ? 'Off' : 'On'}</Text>
        </TouchableOpacity>

        {/* 3. Comment */}
        <TouchableOpacity style={styles.sideBtn} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={32} color={BRAND_GOLD} />
          <Text style={styles.sideBtnLabel}>{item.comment_count || 0}</Text>
        </TouchableOpacity>

        {/* 4. Share */}
        <TouchableOpacity style={styles.sideBtn} onPress={onShare}>
          <Ionicons name="share-social" size={30} color={BRAND_GOLD} />
          <Text style={styles.sideBtnLabel}>Share</Text>
        </TouchableOpacity>

        {/* 5. Save/Favorite */}
        <TouchableOpacity style={styles.sideBtn} onPress={handleSave}>
          <Ionicons 
            name={saved ? 'bookmark' : 'bookmark-outline'} 
            size={30} 
            color={BRAND_GOLD} 
          />
          <Text style={styles.sideBtnLabel}>Save</Text>
        </TouchableOpacity>

        {/* 6. Gift (Gamification) */}
        <TouchableOpacity style={styles.sideBtn} onPress={() => navigation.navigate('GiftSelector', { recipientUsername: item.user?.username })}>
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
  const nav            = useNavigation();
  const isFocused      = useIsFocused();
  const insets         = useSafeAreaInsets();
  const [reels, setReels]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [visibleIdx, setVisibleIdx] = useState(0);
  const [hasMore, setHasMore]       = useState(true);
  const [longPressItem, setLongPressItem] = useState(null);

  const initialId = route?.params?.reelId;

  const [visibleItems, setVisibleItems] = useState([]);
  const { user } = useAuth();
  const { colors: T, isDarkMode } = useTheme();

  useEffect(() => { fetchReels(0); }, []);

  // Refresh reels when screen comes into focus (e.g., returning from Comments)
  useFocusEffect(
    useCallback(() => {
      fetchReels(0);
    }, [fetchReels])
  );

  // Listen for tab press event to refresh when already on Reels screen
  useEffect(() => {
    const unsubscribe = nav.addListener('tabPress', (e) => {
      // Refresh reels when tab is pressed while already on screen
      const currentRoute = nav.getState()?.routes[nav.getState()?.index];
      if (currentRoute?.name === 'Reels') {
        fetchReels(0);
      }
    });

    return unsubscribe;
  }, [nav, fetchReels]);

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
      
      // Filter to show only videos in Reels page
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

  const handleComment = useCallback((reelId) => {
    navigation.navigate('Comments', { reelId });
  }, [navigation]);

  const handleProfile = useCallback((uid) => {
    navigation.navigate('ProfileDetail', { userId: uid });
  }, [navigation]);

  const handleLongPress = useCallback((item) => {
    setLongPressItem(item);
  }, []);

  const handleSave = useCallback(() => {}, []);

  const renderItem = useCallback(({ item, index }) => (
    <ReelItem
      key={item.id}
      item={item}
      isActive={index === visibleIdx}
      isFocused={isFocused}
      onComment={() => handleComment(item.id)}
      onProfile={() => handleProfile(item.user?.id)}
      onShare={() => handleShare(item)}
      onSave={handleSave}
      onLongPress={() => handleLongPress(item)}
      navigation={navigation}
    />
  ), [visibleIdx, isFocused, handleComment, handleProfile, handleShare, handleSave, handleLongPress, navigation]);

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

      <FlashList
        data={reels}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
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
        estimatedItemSize={SCREEN_HEIGHT}
        onEndReached={() => hasMore && !loading && fetchReels(reels.length)}
        onEndReachedThreshold={0.5}
      />

      {/* ── Long Press Modal ── */}
      <Modal visible={!!longPressItem} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setLongPressItem(null)}
        >
          <View style={[styles.bottomSheet, { backgroundColor: T.card }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.sheetHandle, { backgroundColor: T.border }]} />
            
            {/* Grid of icons */}
            <View style={styles.iconGrid}>
              <TouchableOpacity style={styles.iconGridItem} onPress={() => {
                handleShare(longPressItem);
                setLongPressItem(null);
              }}>
                <View style={[styles.iconCircleGrid, { backgroundColor: BRAND_GOLD + '15' }]}>
                  <Ionicons name="link-outline" size={24} color={BRAND_GOLD} />
                </View>
                <Text style={[styles.iconGridText, { color: T.text }]}>Copy Link</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.iconGridItem} onPress={() => {
                // Save functionality
                setLongPressItem(null);
              }}>
                <View style={[styles.iconCircleGrid, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="bookmark-outline" size={24} color="#F59E0B" />
                </View>
                <Text style={[styles.iconGridText, { color: T.text }]}>Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.iconGridItem} onPress={() => {
                // Download functionality
                setLongPressItem(null);
              }}>
                <View style={[styles.iconCircleGrid, { backgroundColor: '#10B98115' }]}>
                  <Ionicons name="download-outline" size={24} color="#10B981" />
                </View>
                <Text style={[styles.iconGridText, { color: T.text }]}>Download</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.iconGridItem} onPress={() => {
                handleShare(longPressItem);
                setLongPressItem(null);
              }}>
                <View style={[styles.iconCircleGrid, { backgroundColor: '#8B5CF615' }]}>
                  <Ionicons name="share-social" size={24} color="#8B5CF6" />
                </View>
                <Text style={[styles.iconGridText, { color: T.text }]}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* List options */}
            <TouchableOpacity style={[styles.sheetItem, { borderBottomColor: T.border }]} onPress={() => {
              Alert.alert('Not Interested', 'We will show you fewer posts like this.');
              setLongPressItem(null);
            }}>
              <Ionicons name="eye-off-outline" size={20} color={T.sub} style={{ marginRight: 12 }} />
              <Text style={[styles.sheetItemText, { color: T.text }]}>Not Interested</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.sheetItem, { borderBottomColor: T.border }]} onPress={() => {
              Alert.alert('Report', 'Post has been reported for review.');
              setLongPressItem(null);
            }}>
              <Ionicons name="flag-outline" size={20} color="#FF3B30" style={{ marginRight: 12 }} />
              <Text style={[styles.sheetItemText, { color: '#FF3B30' }]}>Report</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.sheetItem, { borderBottomWidth: 0 }]} 
              onPress={() => setLongPressItem(null)}
            >
              <Text style={[styles.sheetItemText, { fontWeight: '700', color: T.text, textAlign: 'center', width: '100%' }]}>Cancel</Text>
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

    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundcolor: '#C8B56A' },
  loader: { flex: 1, backgroundcolor: '#C8B56A', alignItems: 'center', justifyContent: 'center' },
  slide: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundcolor: '#C8B56A' },
  heartOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 10,
    shadowcolor: '#C8B56A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  pauseCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  pauseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowcolor: '#C8B56A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#0B0B0C', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '80%', marginHorizontal: 0 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E7E5E4', borderRadius: 2, alignSelf: 'center', marginBottom: 15, marginTop: 8 },
  iconCircleGrid: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  iconGrid: { flexDirection: 'row', justifyContent: 'space-around', padding: '8px 16px 16px', gap: 8 },
  iconGridItem: { alignItems: 'center', gap: 4 },
  iconGridText: { fontSize: 11, color: '#C8B56A', marginTop: 4, fontWeight: '500' },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F4' },
  sheetItemText: { fontSize: 16, fontWeight: '600', color: '#1C1917' },
  menuCard: { width: SCREEN_WIDTH * 0.7, backgroundColor: '#0B0B0C', borderRadius: 20, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  menuItemText: { marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#C8B56A' },
  header: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
});





