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
function ReelItem({ item, isActive, isFocused, onComment, onProfile, onShare, onSave }) {
  const videoRef = useRef(null);
  const insets = useSafeAreaInsets();
  
  const [liked, setLiked]           = useState(item.is_liked || false);
  const [likeCount, setLikeCount]   = useState(item.votes || 0);
  const [following, setFollowing]   = useState(item.user?.is_following || false);
  const [muted, setMuted]           = useState(false);
  const [paused, setPaused]         = useState(false);
  const [saved, setSaved]           = useState(item.is_saved || false);

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
    } else {
      // Single tap detected - toggle pause after delay to distinguish from double tap
      setTimeout(() => {
        if (Date.now() - lastTap.current >= 300) {
          setPaused(p => !p);
        }
      }, 300);
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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 20,
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
            <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>
          )}
        </View>
      </View>

    </View>
  );
}

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
      
      if (offset === 0 && initialId) {
        const idx = raw.findIndex(r => r.id === initialId);
        if (idx > 0) {
          const [t] = raw.splice(idx, 1);
          raw.unshift(t);
        }
        setReels(raw);
      } else if (offset === 0) {
        setReels(raw);
      } else {
        setReels(prev => [...prev, ...raw]);
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
            onProfile={uid => uid && navigation.navigate('ProfileDetail', { userId: uid })}
            onShare={() => {}} // TODO: Implement native share
            onSave={() => {}}
          />
        )}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
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
        onEndReached={() => hasMore && !loading && fetchReels(reels.length)}
        onEndReachedThreshold={0.5}
      />

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
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '800' },
  followDot: { 
    position: 'absolute', bottom: -2, right: -2, backgroundColor: BRAND_GOLD, 
    width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' 
  },
  textBlock: { flex: 1 },
  username: { color: '#fff', fontSize: 16, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  caption: { color: '#fff', fontSize: 14, marginTop: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  header: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
});
