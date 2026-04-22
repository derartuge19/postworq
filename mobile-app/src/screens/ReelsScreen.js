import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// ── BRAND THEME ──────────────────────────────────────────────────────────────
const BRAND = {
  pri: '#DA9B2A',
  bg: '#000000',
  txt: '#ffffff',
  sub: '#cccccc',
};

const ReelItem = ({ item, isVisible, navigation }) => {
  const [liked, setLiked] = useState(item.is_liked);
  const [likesCount, setLikesCount] = useState(item.votes || 0);
  const [following, setFollowing] = useState(item.user?.is_following);
  const videoRef = useRef(null);
  const insets = useSafeAreaInsets();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isVisible && isFocused) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [isVisible, isFocused]);

  const handleLike = async () => {
    try {
      const newLiked = !liked;
      setLiked(newLiked);
      setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
      await api.voteReel(item.id);
    } catch (error) {
      setLiked(!liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
    }
  };

  const handleFollow = async () => {
    try {
      setFollowing(true);
      await api.toggleFollow(item.user.id);
    } catch (error) {
      setFollowing(false);
    }
  };

  return (
    <View style={styles.reelContainer}>
      <Video
        ref={videoRef}
        source={{ uri: item.media || item.image }}
        style={styles.fullScreenVideo}
        resizeMode={Video.RESIZE_MODE_COVER}
        isLooping
        shouldPlay={isVisible}
        isMuted={false}
      />

      {/* Overlay: Bottom Left (User Info) */}
      <View style={[styles.bottomOverlay, { bottom: 80 + insets.bottom }]}>
        <View style={styles.userInfo}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ProfileDetail', { userId: item.user.id })}
            style={styles.avatarContainer}
          >
            {item.user?.profile_photo ? (
              <Image source={{ uri: item.user.profile_photo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{item.user?.username?.[0]?.toUpperCase()}</Text>
              </View>
            )}
            {!following && (
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleFollow}
                style={styles.followBadge}
              >
                <Ionicons name="add" size={12} color="#fff" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          <View style={styles.textContainer}>
            <Text style={styles.username}>@{item.user?.username}</Text>
            <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>
          </View>
        </View>
      </View>

      {/* Overlay: Right Sidebar (Actions) */}
      <View style={[styles.rightSidebar, { bottom: 100 + insets.bottom }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={36} color={liked ? "#ff4d4d" : "#fff"} />
          <Text style={styles.actionText}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => navigation.navigate('Comments', { reelId: item.id })}
        >
          <Ionicons name="chatbubble-ellipses" size={32} color="#fff" />
          <Text style={styles.actionText}>{item.comment_count || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-social" size={32} color="#fff" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="bookmark-outline" size={30} color="#fff" />
          <Text style={styles.actionText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ReelsScreen({ route, navigation }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const initialReelId = route?.params?.reelId;

  useEffect(() => {
    loadReels();
  }, [initialReelId]);

  const loadReels = async (offset = 0) => {
    try {
      const data = await api.request(`/reels/?limit=10&offset=${offset}`);
      const results = Array.isArray(data) ? data : (data.results || []);
      
      // Filter for videos only
      let videoReels = results.filter(r => 
        r.media && (r.media.includes('.mp4') || r.media.includes('/video/upload/') || r.media.includes('.mov'))
      );

      // Deep-link logic: if we have an initialReelId, find it and move it to top
      if (offset === 0 && initialReelId) {
        const targetIdx = videoReels.findIndex(r => r.id === initialReelId);
        if (targetIdx > 0) {
          const [target] = videoReels.splice(targetIdx, 1);
          videoReels.unshift(target);
        } else if (targetIdx === -1) {
          // If not in first 10, try to fetch it specifically or just ignore
          // For now we assume it's in the recent feed
        }
      }

      if (offset === 0) {
        setReels(videoReels);
      } else {
        setReels(prev => [...prev, ...videoReels]);
      }
      
      setHasMore(!!data.next);
    } catch (error) {
      console.error('Failed to load reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setVisibleIndex(viewableItems[0].index);
    }
  }).current;

  if (loading && reels.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BRAND.pri} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <FlatList
        data={reels}
        renderItem={({ item, index }) => (
          <ReelItem 
            item={item} 
            isVisible={index === visibleIndex} 
            navigation={navigation}
          />
        )}
        keyExtractor={item => item.id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onEndReached={() => hasMore && loadReels(reels.length)}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
      />

      {/* Top Header Overlays (matching web mobile) */}
      <View style={[styles.header, { top: StatusBar.currentHeight || 40 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.tabContainer}>
          <Text style={[styles.tabText, { fontWeight: '800' }]}>Reels</Text>
        </View>
        <TouchableOpacity style={styles.cameraBtn}>
          <Ionicons name="camera-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  reelContainer: {
    width: width,
    height: height,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  fullScreenVideo: {
    width: width,
    height: height,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  tabText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 80, // More space for sidebar
    zIndex: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    backgroundColor: BRAND.pri,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  followBadge: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND.pri,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  textContainer: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  caption: {
    color: '#eee',
    fontSize: 14,
    lineHeight: 18,
  },
  rightSidebar: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    gap: 22,
    zIndex: 10,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
