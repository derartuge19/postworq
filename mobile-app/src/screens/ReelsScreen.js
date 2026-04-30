import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image,
  Dimensions, ActivityIndicator, StatusBar, TextInput, Modal,
  ScrollView, Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const { width, height } = Dimensions.get('window');
const GOLD = '#C8B56A';

function timeAgo(d) {
  if (!d) return '';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return `${Math.floor(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function Avatar({ uri, size = 36, name = '' }) {
  const [err, setErr] = useState(false);
  if (uri && !err) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: GOLD }} onError={() => setErr(true)} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' }}>
      <Text style={{ color: '#000', fontWeight: '700', fontSize: size * 0.4 }}>{(name || '?')[0].toUpperCase()}</Text>
    </View>
  );
}

function ReelItem({ item, isActive, onLike, onComment, onSave, onFollow, navigation }) {
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive && !paused) {
      videoRef.current.playAsync().catch(() => {});
    } else {
      videoRef.current.pauseAsync().catch(() => {});
    }
  }, [isActive, paused]);

  const togglePlay = () => setPaused(p => !p);

  return (
    <View style={styles.reelContainer}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={togglePlay} activeOpacity={1}>
        {item.video_url ? (
          <Video
            ref={videoRef}
            source={{ uri: item.video_url }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted={muted}
            onLoad={() => setLoaded(true)}
          />
        ) : item.image_url ? (
          <Image source={{ uri: item.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]} />
        )}
        {!loaded && item.video_url && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
            <ActivityIndicator color={GOLD} size="large" />
          </View>
        )}
        {paused && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="play" size={64} color="rgba(255,255,255,0.7)" />
          </View>
        )}
      </TouchableOpacity>

      {/* Gradient overlay */}
      <View style={styles.gradient} pointerEvents="none" />

      {/* Right actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Profile', { userId: item.user?.id })}>
          <Avatar uri={item.user?.profile_photo} size={44} name={item.user?.username} />
          <View style={styles.followBadge}>
            <Ionicons name="add" size={12} color="#000" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => onLike(item)}>
          <Ionicons name={item.is_liked ? 'heart' : 'heart-outline'} size={30} color={item.is_liked ? '#EF4444' : '#fff'} />
          <Text style={styles.actionLabel}>{item.likes_count || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => onComment(item)}>
          <Ionicons name="chatbubble-outline" size={28} color="#fff" />
          <Text style={styles.actionLabel}>{item.comments_count || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => onSave(item)}>
          <Ionicons name={item.is_saved ? 'bookmark' : 'bookmark-outline'} size={28} color={item.is_saved ? GOLD : '#fff'} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => setMuted(m => !m)}>
          <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.reelUsername}>@{item.user?.username}</Text>
        {!!item.caption && <Text style={styles.reelCaption} numberOfLines={2}>{item.caption}</Text>}
      </View>
    </View>
  );
}

export default function ReelsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentReel, setCommentReel] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [activeTab, setActiveTab] = useState('for_you');
  const LIMIT = 10;
  const initialVideoId = route?.params?.initialVideoId;

  useEffect(() => { fetchReels(0, true); }, [activeTab]);

  const fetchReels = async (offset = 0, reset = false) => {
    try {
      if (reset) setLoading(true); else setLoadingMore(true);
      const endpoint = activeTab === 'following'
        ? `/reels/following/?limit=${LIMIT}&offset=${offset}`
        : `/reels/?limit=${LIMIT}&offset=${offset}`;
      const data = await api.request(endpoint);
      const results = Array.isArray(data) ? data : (data.results || []);
      if (reset && initialVideoId) {
        const idx = results.findIndex(r => r.id === initialVideoId);
        if (idx > 0) { const [item] = results.splice(idx, 1); results.unshift(item); }
      }
      setReels(prev => reset ? results : [...prev, ...results]);
      setHasMore(results.length === LIMIT);
    } catch (e) { console.error('Reels error:', e); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  const onViewableChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  }, []);

  const toggleLike = async (reel) => {
    setReels(prev => prev.map(r => r.id === reel.id
      ? { ...r, is_liked: !r.is_liked, likes_count: r.is_liked ? r.likes_count - 1 : r.likes_count + 1 }
      : r));
    try { await api.request(`/reels/${reel.id}/vote/`, { method: 'POST' }); }
    catch { setReels(prev => prev.map(r => r.id === reel.id ? { ...r, is_liked: reel.is_liked, likes_count: reel.likes_count } : r)); }
  };

  const toggleSave = async (reel) => {
    setReels(prev => prev.map(r => r.id === reel.id ? { ...r, is_saved: !r.is_saved } : r));
    try { await api.request('/saved/toggle/', { method: 'POST', body: JSON.stringify({ reel_id: reel.id }) }); }
    catch { setReels(prev => prev.map(r => r.id === reel.id ? { ...r, is_saved: reel.is_saved } : r)); }
  };

  const openComments = async (reel) => {
    setCommentReel(reel);
    try {
      const data = await api.request(`/reels/${reel.id}/comments/?include_replies=true`);
      setComments(Array.isArray(data) ? data : (data.results || []));
    } catch { setComments([]); }
  };

  const postComment = async () => {
    if (!commentText.trim() || !commentReel) return;
    setPostingComment(true);
    try {
      const c = await api.request(`/reels/${commentReel.id}/comments/`, {
        method: 'POST', body: JSON.stringify({ text: commentText.trim() }),
      });
      setComments(prev => [c, ...prev]);
      setCommentText('');
    } catch { Alert.alert('Error', 'Failed to post comment'); }
    finally { setPostingComment(false); }
  };

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={GOLD} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Tabs */}
      <View style={[styles.tabs, { top: insets.top + 8 }]}>
        {['for_you', 'following'].map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabBtn}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'for_you' ? 'For You' : 'Following'}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={reels}
        keyExtractor={r => String(r.id)}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            isActive={index === activeIndex}
            onLike={toggleLike}
            onComment={openComments}
            onSave={toggleSave}
            onFollow={() => {}}
            navigation={navigation}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onEndReached={() => { if (!loadingMore && hasMore) fetchReels(reels.length); }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={GOLD} style={{ padding: 16 }} /> : null}
      />

      {/* Comments Modal */}
      <Modal visible={!!commentReel} animationType="slide" transparent onRequestClose={() => setCommentReel(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.commentsSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentReel(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }}>
              {comments.length === 0
                ? <Text style={{ color: '#666', textAlign: 'center', padding: 32 }}>No comments yet</Text>
                : comments.map(c => (
                  <View key={c.id} style={styles.commentItem}>
                    <Avatar uri={c.user?.profile_photo} size={32} name={c.user?.username} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.commentUser}>{c.user?.username}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  </View>
                ))}
            </ScrollView>
            <View style={styles.commentInput}>
              <Avatar uri={user?.profile_photo} size={32} name={user?.username} />
              <TextInput
                style={styles.commentTextInput}
                placeholder="Add a comment..."
                placeholderTextColor="#666"
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity onPress={postComment} disabled={!commentText.trim() || postingComment}>
                {postingComment ? <ActivityIndicator size="small" color={GOLD} /> : <Ionicons name="send" size={22} color={commentText.trim() ? GOLD : '#444'} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  reelContainer: { width, height, backgroundColor: '#000' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, backgroundColor: 'transparent', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' },
  rightActions: { position: 'absolute', right: 12, bottom: 100, alignItems: 'center', gap: 20 },
  actionItem: { alignItems: 'center' },
  actionLabel: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 3 },
  followBadge: { position: 'absolute', bottom: -6, left: '50%', marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center' },
  bottomInfo: { position: 'absolute', bottom: 80, left: 12, right: 80 },
  reelUsername: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  reelCaption: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18 },
  tabs: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 24, zIndex: 10 },
  tabBtn: { alignItems: 'center', paddingVertical: 4 },
  tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  tabIndicator: { width: 20, height: 2, backgroundColor: '#fff', borderRadius: 1, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  commentsSheet: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '70%', paddingBottom: 20 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#262626' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  commentItem: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  commentUser: { fontSize: 13, fontWeight: '700', color: GOLD, marginBottom: 2 },
  commentText: { fontSize: 14, color: '#ddd', lineHeight: 18 },
  commentInput: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#262626', gap: 10 },
  commentTextInput: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, color: '#fff', fontSize: 14 },
});
