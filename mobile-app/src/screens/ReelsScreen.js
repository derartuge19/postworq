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
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import api from '../api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const BRAND_GOLD = '#DA9B2A';

// ─────────────────────────────────────────────────────────────
// Single Reel Item Component
// ─────────────────────────────────────────────────────────────
function ReelItem({ item, isActive, isFocused, onComment, onProfile }) {
  const videoRef = useRef(null);
  const insets = useSafeAreaInsets();

  const [liked, setLiked]           = useState(item.is_liked || false);
  const [likeCount, setLikeCount]   = useState(item.votes || 0);
  const [following, setFollowing]   = useState(item.user?.is_following || false);
  const [muted, setMuted]           = useState(false);
  const [paused, setPaused]         = useState(false);

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

  const handleFollow = async () => {
    if (following) return;
    setFollowing(true);
    try {
      await api.toggleFollow(item.user?.id);
    } catch {
      setFollowing(false);
    }
  };

  const toggleMute  = () => setMuted(m => !m);
  const togglePause = () => setPaused(p => !p);

  const mediaUri = item.media || item.image || '';
  const username = item.user?.username || 'unknown';
  const avatarUri = item.user?.profile_photo;
  const initial = username[0]?.toUpperCase() || '?';

  // bottom offset: 60 (tab bar) + safe area bottom
  const bottomBase = 60 + insets.bottom;

  return (
    <View style={styles.slide}>

      {/* ── Full-screen Video ── */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={togglePause}
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

      {/* ── Gradient scrim at bottom ── */}
      <View style={styles.scrim} pointerEvents="none" />

      {/* ── Pause icon (center) ── */}
      {paused && (
        <View style={styles.pauseCenter} pointerEvents="none">
          <Ionicons name="pause" size={56} color="rgba(255,255,255,0.8)" />
        </View>
      )}

      {/* ────────────────────────────────────────────
          RIGHT SIDEBAR  (like, comment, share, save, mute)
      ──────────────────────────────────────────── */}
      <View style={[styles.sidebar, { bottom: bottomBase + 20 }]}>

        <TouchableOpacity style={styles.sideBtn} onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={34}
            color={liked ? '#ff4040' : '#fff'}
          />
          <Text style={styles.sideBtnLabel}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={onComment}>
          <Ionicons name="chatbubble-ellipses" size={32} color="#fff" />
          <Text style={styles.sideBtnLabel}>{item.comment_count || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn}>
          <Ionicons name="share-social" size={30} color="#fff" />
          <Text style={styles.sideBtnLabel}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn}>
          <Ionicons name="bookmark-outline" size={30} color="#fff" />
          <Text style={styles.sideBtnLabel}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={toggleMute}>
          <Ionicons
            name={muted ? 'volume-mute' : 'volume-high'}
            size={26}
            color="#fff"
          />
        </TouchableOpacity>

      </View>

      {/* ────────────────────────────────────────────
          BOTTOM LEFT  (avatar, username, caption)
      ──────────────────────────────────────────── */}
      <View style={[styles.bottomInfo, { bottom: bottomBase + 12 }]}>

        {/* Avatar + follow badge */}
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

        {/* Username + caption */}
        <View style={styles.textBlock}>
          <Text style={styles.username}>@{username}</Text>
          {!!item.caption && (
            <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>
          )}
        </View>

      </View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Reels Screen
// ─────────────────────────────────────────────────────────────
export default function ReelsScreen({ route, navigation }) {
  const isFocused      = useIsFocused();
  const insets         = useSafeAreaInsets();
  const [reels, setReels]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [visibleIdx, setVisibleIdx] = useState(0);
  const [hasMore, setHasMore]       = useState(true);

  const initialId = route?.params?.reelId;

  useEffect(() => { fetchReels(0); }, []);

  const fetchReels = async (offset = 0) => {
    try {
      const data    = await api.request(`/reels/?limit=15&offset=${offset}`);
      const raw     = Array.isArray(data) ? data : (data.results || []);
      // Accept videos AND images (show everything like web)
      let items = raw;

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

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

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

  if (!reels.length) {
    return (
      <View style={styles.loader}>
        <Ionicons name="film-outline" size={60} color="#444" />
        <Text style={{ color: '#666', marginTop: 16 }}>No reels yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <FlatList
        data={reels}
        keyExtractor={item => String(item.id)}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            isActive={index === visibleIdx}
            isFocused={isFocused}
            onComment={() => navigation.navigate('Comments', { reelId: item.id })}
            onProfile={uid => uid && navigation.navigate('ProfileDetail', { userId: uid })}
          />
        )}
        // Paging
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        // Viewability
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // Performance
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        // Infinite scroll
        onEndReached={() => hasMore && !loading && fetchReels(reels.length)}
        onEndReachedThreshold={0.3}
      />

      {/* ── Floating Header ── */}
      <View style={[styles.header, { top: (Platform.OS === 'android' ? StatusBar.currentHeight : insets.top) + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Reels</Text>

        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => navigation.navigate('Create')}
        >
          <Ionicons name="camera-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  loader: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Each reel slide ──
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },

  // ── Gradient scrim ──
  scrim: {
    ...StyleSheet.absoluteFillObject,
    // dark gradient at bottom for readability
    backgroundColor: 'transparent',
    // We fake a gradient with a semi-transparent bottom band
    justifyContent: 'flex-end',
  },

  // ── Pause overlay ──
  pauseCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // ── Right sidebar ──
  sidebar: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    gap: 0, // gap not supported on all RN versions, use marginBottom instead
  },
  sideBtn: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sideBtnLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ── Bottom-left info ──
  bottomInfo: {
    position: 'absolute',
    left: 12,
    right: 75, // leaves space for sidebar
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarFallback: {
    backgroundColor: BRAND_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  followDot: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    left: 14,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND_GOLD,
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  caption: {
    color: '#eee',
    fontSize: 13,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ── Floating header ──
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
