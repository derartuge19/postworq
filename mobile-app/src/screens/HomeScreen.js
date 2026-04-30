import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, TextInput, Modal, ScrollView,
  Dimensions, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const { width } = Dimensions.get('window');
const GOLD = '#C8B56A';
const BG = '#0D0D0D';
const CARD = '#1A1A1A';
const BORDER = '#262626';

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
  if (uri && !err) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} onError={() => setErr(true)} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#000', fontWeight: '700', fontSize: size * 0.4 }}>{(name || '?')[0].toUpperCase()}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
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
  const LIMIT = 10;

  useEffect(() => { fetchPosts(0, true); }, []);

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

  const onRefresh = () => { setRefreshing(true); fetchPosts(0, true); };
  const onEndReached = () => { if (!loadingMore && hasMore) fetchPosts(page + LIMIT); };

  const toggleLike = async (post) => {
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? (p.likes_count - 1) : (p.likes_count + 1) }
      : p));
    try { await api.request(`/reels/${post.id}/vote/`, { method: 'POST' }); }
    catch { setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_liked: post.is_liked, likes_count: post.likes_count } : p)); }
  };

  const toggleSave = async (post) => {
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_saved: !p.is_saved } : p));
    try { await api.request('/saved/toggle/', { method: 'POST', body: JSON.stringify({ reel_id: post.id }) }); }
    catch { setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_saved: post.is_saved } : p)); }
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
      setPosts(prev => prev.map(p => p.id === commentPost.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
    } catch { Alert.alert('Error', 'Failed to post comment'); }
    finally { setPostingComment(false); }
  };

  const renderPost = ({ item: post }) => (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.postUser} onPress={() => navigation.navigate('Profile', { userId: post.user?.id })}>
          <Avatar uri={post.user?.profile_photo} size={38} name={post.user?.username} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.username}>{post.user?.username || 'Unknown'}</Text>
            <Text style={styles.timeAgo}>{timeAgo(post.created_at)}</Text>
          </View>
        </TouchableOpacity>
        <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
      </View>

      {/* Caption */}
      {!!post.caption && <Text style={styles.caption}>{post.caption}</Text>}

      {/* Media */}
      {post.video_url ? (
        <TouchableOpacity onPress={() => navigation.navigate('ReelsDetail', { initialVideoId: post.id })} activeOpacity={0.9}>
          <View style={styles.videoThumb}>
            {post.thumbnail_url
              ? <Image source={{ uri: post.thumbnail_url }} style={styles.mediaImage} resizeMode="cover" />
              : <View style={[styles.mediaImage, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="play-circle" size={56} color={GOLD} />
                </View>}
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.85)" />
            </View>
          </View>
        </TouchableOpacity>
      ) : post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.mediaImage} resizeMode="cover" />
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post)}>
          <Ionicons name={post.is_liked ? 'heart' : 'heart-outline'} size={24} color={post.is_liked ? '#EF4444' : '#aaa'} />
          <Text style={styles.actionCount}>{post.likes_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(post)}>
          <Ionicons name="chatbubble-outline" size={22} color="#aaa" />
          <Text style={styles.actionCount}>{post.comments_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-social-outline" size={22} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { marginLeft: 'auto' }]} onPress={() => toggleSave(post)}>
          <Ionicons name={post.is_saved ? 'bookmark' : 'bookmark-outline'} size={22} color={post.is_saved ? GOLD : '#aaa'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⭐ FlipStar</Text>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={GOLD} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
            <Ionicons name="search" size={24} color={GOLD} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={GOLD} /></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => String(p.id)}
          renderItem={renderPost}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={GOLD} style={{ padding: 16 }} /> : null}
          ListEmptyComponent={<View style={styles.centered}><Text style={{ color: '#666' }}>No posts yet</Text></View>}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Comments Modal */}
      <Modal visible={!!commentPost} animationType="slide" transparent onRequestClose={() => setCommentPost(null)}>
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
                multiline
              />
              <TouchableOpacity onPress={postComment} disabled={!commentText.trim() || postingComment}>
                {postingComment
                  ? <ActivityIndicator size="small" color={GOLD} />
                  : <Ionicons name="send" size={22} color={commentText.trim() ? GOLD : '#444'} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { fontSize: 20, fontWeight: '900', color: GOLD },
  postCard: { backgroundColor: CARD, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  postUser: { flexDirection: 'row', alignItems: 'center' },
  username: { fontSize: 14, fontWeight: '700', color: '#fff' },
  timeAgo: { fontSize: 12, color: '#666', marginTop: 1 },
  caption: { fontSize: 14, color: '#ddd', paddingHorizontal: 12, paddingBottom: 10, lineHeight: 20 },
  mediaImage: { width: '100%', height: width * 0.75, backgroundColor: '#111' },
  videoThumb: { position: 'relative' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  actions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 18 },
  actionCount: { fontSize: 13, color: '#aaa', marginLeft: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  commentsSheet: { backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '75%', paddingBottom: 20 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  commentItem: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  commentUser: { fontSize: 13, fontWeight: '700', color: GOLD, marginBottom: 2 },
  commentText: { fontSize: 14, color: '#ddd', lineHeight: 18 },
  commentInput: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: BORDER, gap: 10 },
  commentTextInput: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, color: '#fff', fontSize: 14, maxHeight: 80 },
});
