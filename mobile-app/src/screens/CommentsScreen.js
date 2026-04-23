import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';

const BRAND_GOLD = '#DA9B2A';

// Build comment tree from flat list
function buildCommentTree(flatList) {
  if (!Array.isArray(flatList)) return [];
  const map = {};
  const roots = [];
  
  // First pass: Create map and ensure replies array
  flatList.forEach(c => {
    map[c.id] = { ...c };
    if (!map[c.id].replies) map[c.id].replies = [];
  });
  
  // Second pass: Link children to parents
  flatList.forEach(c => {
    const node = map[c.id];
    const parentVal = c.parent_id || c.parent;
    const parentId = (parentVal && typeof parentVal === 'object') ? parentVal.id : parentVal;
    
    if (parentId && String(parentId) !== '0') {
      const parent = map[parentId];
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });
  
  return roots;
}

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

// Time ago helper
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

// Comment Item Component (recursive)
const CommentItem = memo(function CommentItem({ comment, depth = 0, onLike, onReply }) {
  const isReply = depth > 0;
  const avatarSize = isReply ? 28 : 34;

  return (
    <View style={styles.commentContainer}>
      <View style={[styles.commentRow, depth > 0 && styles.commentRowIndented]}>
        <View style={[styles.avatar, { width: avatarSize, height: avatarSize }]}>
          {comment.user?.profile_photo ? (
            <Image source={{ uri: mediaUrl(comment.user.profile_photo) }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarText, { fontSize: isReply ? 12 : 14 }]}>
              {comment.user?.username?.[0]?.toUpperCase() || 'U'}
            </Text>
          )}
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={[styles.username, { fontSize: isReply ? 12 : 13 }]}>
              {comment.user?.username}
            </Text>
            <Text style={[styles.commentBody, { fontSize: isReply ? 12 : 13 }]}>
              {comment.text}
            </Text>
          </View>
          <View style={styles.commentActions}>
            <Text style={styles.timestamp}>{timeAgo(comment.created_at)}</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(comment)}>
              <Ionicons 
                name={comment.is_liked ? "heart" : "heart-outline"} 
                size={14} 
                color={comment.is_liked ? BRAND_GOLD : "#666"} 
              />
              {comment.likes_count > 0 && <Text style={styles.likeCount}>{comment.likes_count}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.replyBtn} onPress={() => onReply(comment)}>
              <Text style={styles.replyText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Recursive Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={[styles.repliesContainer, { marginLeft: depth === 0 ? 44 : 20 }]}>
          {comment.replies.map(r => (
            <CommentItem
              key={r.id}
              comment={r}
              depth={depth + 1}
              onLike={onLike}
              onReply={onReply}
            />
          ))}
        </View>
      )}
    </View>
  );
});

export default function CommentsScreen({ route, navigation }) {
  const { reelId } = route.params;
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const scrollViewRef = useRef(null);
  
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [reelId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await api.request(`/reels/${reelId}/comments/?include_replies=true&depth=2`);
      const full = Array.isArray(data) ? data : (data?.results || []);
      setComments(buildCommentTree(full));
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    if (!api.hasToken()) return;
    const draft = text.trim();
    
    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const temp = {
      id: tempId,
      text: draft,
      user: currentUser || { username: 'you', profile_photo: null },
      created_at: new Date().toISOString(),
      likes_count: 0,
      is_liked: false,
      replies: [],
      pending: true,
    };

    const updateDeep = (list) => list.map(c => {
      if (replyingTo && String(c.id) === String(replyingTo.id)) {
        return { ...c, replies: [...(c.replies || []), temp] };
      }
      if (c.replies && c.replies.length) {
        return { ...c, replies: updateDeep(c.replies) };
      }
      return c;
    });

    if (replyingTo) {
      setComments(prev => updateDeep(prev));
    } else {
      setComments(prev => [temp, ...prev]);
    }
    
    setText('');
    const replyTarget = replyingTo;
    setReplyingTo(null);
    setSending(true);

    try {
      let res;
      if (replyTarget) {
        res = await api.replyToComment(replyTarget.id, draft);
      } else {
        res = await api.postComment(reelId, draft);
      }

      if (res && !res.replies) res.replies = [];

      // Swap temp for real server row
      const swapDeep = (list) => list.map(c => {
        if (String(c.id) === String(tempId)) return res;
        if (c.replies && c.replies.length) {
          return { ...c, replies: swapDeep(c.replies) };
        }
        return c;
      });
      setComments(prev => swapDeep(prev));
      
      // Secondary safety fetch
      setTimeout(() => {
        api.request(`/reels/${reelId}/comments/?include_replies=true&depth=2`)
          .then(d => {
            const latest = Array.isArray(d) ? d : (d?.results || []);
            setComments(buildCommentTree(latest));
          })
          .catch(() => {});
      }, 800);
    } catch (err) {
      // Roll back
      const removeDeep = (list) => list.filter(c => c.id !== tempId).map(c => ({
        ...c,
        replies: c.replies ? removeDeep(c.replies) : []
      }));
      setComments(prev => removeDeep(prev));
      setText(draft);
      console.error('Comment post failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleLikeComment = async (comment) => {
    if (!api.hasToken()) return;
    // Optimistic like
    const updateLikesDeep = (list) => list.map(c => {
      if (String(c.id) === String(comment.id)) {
        const newIsLiked = !c.is_liked;
        const newLikes = (c.likes_count || c.likes || 0) + (newIsLiked ? 1 : -1);
        return { ...c, is_liked: newIsLiked, likes_count: newLikes, likes: newLikes };
      }
      if (c.replies && c.replies.length) {
        return { ...c, replies: updateLikesDeep(c.replies) };
      }
      return c;
    });
    setComments(prev => updateLikesDeep(prev));

    try {
      await api.likeComment(comment.id);
    } catch (err) {
      // Roll back on error
      setComments(prev => updateLikesDeep(prev));
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    // Scroll to input
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Comments List */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {loading && comments.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND_GOLD} />
            <Text style={styles.loadingText}>Loading comments...</Text>
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubtext}>Be the first to comment!</Text>
          </View>
        ) : (
          <View style={styles.commentsList}>
            {comments.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                onLike={handleLikeComment}
                onReply={handleReply}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
        {replyingTo && (
          <View style={styles.replyingTo}>
            <Text style={styles.replyingToText}>
              Replying to <Text style={styles.replyingToUser}>@{replyingTo.user?.username}</Text>
            </Text>
            <TouchableOpacity onPress={handleCancelReply} style={styles.cancelReplyBtn}>
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={replyingTo ? `Reply to @${replyingTo.user?.username}...` : (api.hasToken() ? 'Add a comment...' : 'Log in to comment')}
            placeholderTextColor="#999"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backBtn: {
    width: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  commentsList: {
    flexDirection: 'column',
    gap: 20,
  },
  commentContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  commentRowIndented: {
    marginLeft: 0,
  },
  avatar: {
    borderRadius: 20,
    backgroundColor: BRAND_GOLD + '20',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontWeight: 'bold',
    color: BRAND_GOLD,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  username: {
    fontWeight: '700',
    color: '#000',
  },
  commentBody: {
    color: '#000',
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 10,
    color: '#666',
  },
  replyBtn: {
    padding: 0,
  },
  replyText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
  repliesContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  replyingTo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: BRAND_GOLD + '10',
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#000',
  },
  replyingToUser: {
    fontWeight: '700',
  },
  cancelReplyBtn: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 80,
    fontSize: 14,
    color: '#000',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
