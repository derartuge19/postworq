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
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../api';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';
import GiftSelectorScreen from './GiftSelectorScreen';

const BRAND_GOLD = '#C8B56A';

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
    
    if (parentId && String(parentId) !== '0' && String(parentId) !== 'null') {
      const parent = map[parentId];
      if (parent) {
        parent.replies.push(node);
      } else {
        // Parent not found, treat as root
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
const CommentItem = memo(function CommentItem({ comment, depth = 0, onLike, onReply, onReport, onGift, expandedReplies, onToggleReplies }) {
  const isReply = depth > 0;
  const avatarSize = isReply ? 28 : 34;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isExpanded = expandedReplies?.has(comment.id);
  const showRepliesToggle = !isReply && hasReplies;

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
            {onGift && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => onGift(comment)}>
                <Ionicons name="gift-outline" size={14} color={BRAND_GOLD} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.reportBtn} onPress={() => onReport(comment)}>
              <Ionicons name="flag-outline" size={13} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* View replies toggle — only at top level */}
      {showRepliesToggle && (
        <TouchableOpacity
          style={styles.viewRepliesToggle}
          onPress={() => onToggleReplies(comment.id)}
        >
          <View style={styles.viewRepliesLine} />
          <Text style={styles.viewRepliesText}>
            {isExpanded
              ? `Hide ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
              : `View ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Recursive Replies */}
      {hasReplies && (isReply || isExpanded) && (
        <View style={[styles.repliesContainer, { marginLeft: depth === 0 ? 44 : 24 }]}>
          <View style={styles.replyThreadLine} />
          {comment.replies.map(r => (
            <CommentItem
              key={r.id}
              comment={r}
              depth={depth + 1}
              onLike={onLike}
              onReply={onReply}
              onReport={onReport}
              onGift={onGift}
              expandedReplies={expandedReplies}
              onToggleReplies={onToggleReplies}
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
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [expandedReplies, setExpandedReplies] = useState(() => new Set());
  const [reportingComment, setReportingComment] = useState(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [reelId]);

  // Mention autocomplete
  useEffect(() => {
    const match = text.match(/@(\w*)$/);
    if (match) {
      const query = match[1];
      setMentionQuery(query);
      setShowMentionSuggestions(true);
      if (query.length >= 2) {
        api.search(query).then(d => {
          setMentionSuggestions(d?.users?.slice(0, 5) || []);
        }).catch(() => setMentionSuggestions([]));
      } else {
        setMentionSuggestions([]);
      }
    } else {
      setShowMentionSuggestions(false);
      setMentionQuery('');
      setMentionSuggestions([]);
    }
  }, [text]);

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
      
      // Only refetch if not in reply mode to preserve reply state
      if (!replyingTo) {
        setTimeout(() => {
          api.request(`/reels/${reelId}/comments/?include_replies=true&depth=2`)
            .then(d => {
              const latest = Array.isArray(d) ? d : (d?.results || []);
              setComments(buildCommentTree(latest));
            })
            .catch(() => {});
        }, 800);
      }
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

  const handleSelectMention = (username) => {
    const match = text.match(/@(\w*)$/);
    if (match) {
      const newText = text.replace(/@\w*$/, `@${username} `);
      setText(newText);
      setShowMentionSuggestions(false);
      setMentionQuery('');
      setMentionSuggestions([]);
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const COMMENT_REPORT_REASONS = [
    { id: 'spam', label: 'Spam or Misleading', icon: '⚠️' },
    { id: 'harassment', label: 'Harassment or Bullying', icon: '😡' },
    { id: 'hate_speech', label: 'Hate Speech', icon: '🚫' },
    { id: 'inappropriate', label: 'Inappropriate Content', icon: '😢' },
    { id: 'other', label: 'Other', icon: '📋' },
  ];

  const handleReportComment = async (commentId, reportType) => {
    setReportingComment(null);
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to report comments.');
      return;
    }
    setReportSubmitting(true);
    try {
      await api.request('/reports/create/', {
        method: 'POST',
        body: JSON.stringify({
          reported_comment_id: commentId,
          report_type: reportType,
          description: `Comment reported as: ${reportType}`,
          target_type: 'comment',
        }),
      });
      Alert.alert('Report Submitted', 'Thank you. Our team will review this comment.');
    } catch (err) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleGift = (comment) => {
    navigation.navigate('GiftSelector', { recipientUsername: comment.user?.username });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comments ({comments.length})</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#C8B56A" />
        </TouchableOpacity>
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
                onReport={setReportingComment}
                onGift={handleGift}
                expandedReplies={expandedReplies}
                onToggleReplies={toggleReplies}
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
            style={styles.iconButton}
            onPress={() => setText(prev => prev + '@')}
          >
            <Ionicons name="at" size={20} color={BRAND_GOLD} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              if (reelUserId && reelUsername) {
                navigation.navigate('GiftSelector', {
                  recipientId: reelUserId,
                  recipientUsername: reelUsername,
                  reelId: reelId,
                });
              }
            }}
          >
            <Ionicons name="gift" size={20} color={BRAND_GOLD} />
          </TouchableOpacity>
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

        {/* Mention Suggestions Dropdown */}
        {showMentionSuggestions && mentionSuggestions.length > 0 && (
          <View style={styles.mentionSuggestionsContainer}>
            <ScrollView style={styles.mentionSuggestionsList} keyboardShouldPersistTaps="handled">
              {mentionSuggestions.map(u => (
                <TouchableOpacity
                  key={u.id}
                  style={styles.mentionSuggestionItem}
                  onPress={() => handleSelectMention(u.username)}
                >
                  <View style={styles.mentionAvatar}>
                    {u.profile_photo ? (
                      <Image source={{ uri: mediaUrl(u.profile_photo) }} style={styles.mentionAvatarImage} />
                    ) : (
                      <Text style={styles.mentionAvatarText}>{u.username[0]?.toUpperCase() || 'U'}</Text>
                    )}
                  </View>
                  <Text style={styles.mentionUsername}>@{u.username}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Comment Report Reason Modal */}
      <Modal visible={!!reportingComment} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setReportingComment(null)}
        >
          <View style={styles.reportModal} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <View style={styles.reportHeader}>
              <Ionicons name="flag" size={18} color="#EF4444" />
              <Text style={styles.reportTitle}>Report Comment</Text>
            </View>
            <Text style={styles.reportSubtitle}>Why are you reporting this comment?</Text>
            
            <ScrollView style={styles.reportScroll} showsVerticalScrollIndicator={false}>
              {COMMENT_REPORT_REASONS.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.reportItem}
                  onPress={() => handleReportComment(reportingComment, r.id)}
                  disabled={reportSubmitting}
                >
                  <Text style={styles.reportIcon}>{r.icon}</Text>
                  <Text style={styles.reportLabel}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={styles.reportCancel}
              onPress={() => setReportingComment(null)}
            >
              <Text style={styles.reportCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2E',
    backgroundColor: '#0B0B0C',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5F5F7',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2E',
    backgroundColor: '#0B0B0C',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#C8B56A',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#C8B56A',
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
    gap: 10,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  commentRowIndented: {
    marginLeft: 0,
  },
  avatar: {
    borderRadius: 20,
    backgroundColor: BRAND_GOLD + '30',
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
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  username: {
    fontWeight: '700',
    color: '#F5F5F7',
    fontSize: 14,
  },
  commentBody: {
    fontSize: 14,
    color: '#F5F5F7',
    lineHeight: 21,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timestamp: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  reportBtn: {
    marginLeft: 'auto',
  },
  viewRepliesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    marginLeft: 48,
  },
  viewRepliesLine: {
    width: 24,
    height: 1,
    backgroundColor: '#A1A1AA',
    opacity: 0.5,
  },
  viewRepliesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  repliesContainer: {
    marginLeft: 44,
    paddingLeft: 30,
    borderLeftWidth: 2,
    borderLeftColor: '#2A2A2E',
    gap: 14,
  },
  replyThreadLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#2A2A2E',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#0B0B0C',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F5F5F7',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    minHeight: 40,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  replyingTo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  replyingToUser: {
    color: BRAND_GOLD,
    fontWeight: '600',
  },
  cancelReplyBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  reportModal: {
    backgroundColor: '#0B0B0C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
    marginHorizontal: 0,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E7E5E4',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
    marginTop: 8,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  reportTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F5F5F7',
  },
  reportSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  reportScroll: {
    paddingHorizontal: 20,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    borderRadius: 10,
    backgroundColor: '#0B0B0C',
    marginBottom: 4,
  },
  reportIcon: {
    fontSize: 18,
  },
  reportLabel: {
    fontSize: 14,
    color: '#F5F5F7',
    fontWeight: '500',
  },
  reportCancel: {
    marginTop: 12,
    marginHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 0,
    borderRadius: 10,
    backgroundColor: '#2A2A2E',
    alignItems: 'center',
  },
  reportCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F5F7',
  },
  mentionSuggestionsContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 16,
    right: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    maxHeight: 200,
    zIndex: 100,
    marginBottom: 8,
  },
  mentionSuggestionsList: {
    maxHeight: 200,
  },
  mentionSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  mentionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_GOLD + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  mentionAvatarText: {
    fontWeight: 'bold',
    color: BRAND_GOLD,
  },
  mentionUsername: {
    fontSize: 14,
    color: '#F5F5F7',
    fontWeight: '600',
  },
});