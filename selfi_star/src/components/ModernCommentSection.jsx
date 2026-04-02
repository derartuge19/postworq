import { useState, useEffect } from "react";
import { X, Heart, MessageCircle, Send, Loader } from "lucide-react";
import api from "../api";
import { AlertModal } from "./AlertModal";
import { getRelativeTime } from "../utils/timeUtils";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function ModernCommentSection({ reelId, user, onClose, onCommentPosted }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  useEffect(() => {
    fetchComments();
  }, [reelId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await api.getComments(reelId);
      setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setPosting(true);
      const comment = await api.postComment(reelId, newComment);
      setComments([comment, ...comments]);
      setNewComment("");
      onCommentPosted?.(comment);
    } catch (error) {
      console.error("Failed to post comment:", error);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Failed to post comment",
        type: "error"
      });
    } finally {
      setPosting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await api.likeComment(commentId);
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, is_liked: response.liked, likes_count: response.likes_count }
          : c
      ));
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

  const handlePostReply = async (commentId) => {
    if (!replyText.trim()) return;
    
    try {
      setPosting(true);
      const reply = await api.replyToComment(commentId, replyText);
      setComments(comments.map(c => 
        c.id === commentId 
          ? { ...c, replies: [...(c.replies || []), reply], replies_count: c.replies_count + 1 }
          : c
      ));
      setReplyText("");
      setReplyTo(null);
    } catch (error) {
      console.error("Failed to post reply:", error);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Failed to post reply",
        type: "error"
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      zIndex: 4000,
    }}
    onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 600,
          height: "min(90vh, 90dvh)",
          maxHeight: "min(90vh, 90dvh)",
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.txt }}>
            Comments ({comments.length})
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              display: "flex",
              color: T.txt,
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Comments List */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: T.sub }}>
              <Loader size={32} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: T.sub }}>
              <MessageCircle size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No comments yet</div>
              <div style={{ fontSize: 13 }}>Be the first to comment!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {comments.map(comment => (
                <div key={comment.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Comment */}
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: T.pri + "30",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0,
                    }}>
                      👤
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>
                          {comment.user?.username || "User"}
                        </span>
                        <span style={{ fontSize: 11, color: T.sub }}>
                          {getRelativeTime(comment.created_at)}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: T.txt, marginBottom: 8, lineHeight: 1.5 }}>
                        {comment.text}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            color: comment.is_liked ? "#EF4444" : T.sub,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <Heart size={16} fill={comment.is_liked ? "#EF4444" : "none"} />
                          {comment.likes_count || 0}
                        </button>
                        <button
                          onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            color: T.sub,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <MessageCircle size={16} />
                          Reply {comment.replies_count > 0 && `(${comment.replies_count})`}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div style={{ marginLeft: 48, display: "flex", flexDirection: "column", gap: 12 }}>
                      {comment.replies.map(reply => (
                        <div key={reply.id} style={{ display: "flex", gap: 12 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: T.pri + "20",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            flexShrink: 0,
                          }}>
                            👤
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>
                                {reply.user?.username || "User"}
                              </span>
                              <span style={{ fontSize: 10, color: T.sub }}>
                                {getRelativeTime(reply.created_at)}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: T.txt, lineHeight: 1.4 }}>
                              {reply.text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyTo === comment.id && (
                    <div style={{ marginLeft: 48, display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          border: `1px solid ${T.border}`,
                          borderRadius: 20,
                          fontSize: 13,
                          outline: "none",
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !posting) {
                            handlePostReply(comment.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handlePostReply(comment.id)}
                        disabled={posting || !replyText.trim()}
                        style={{
                          background: posting || !replyText.trim() ? T.sub : T.pri,
                          border: "none",
                          borderRadius: "50%",
                          width: 32,
                          height: 32,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: posting || !replyText.trim() ? "not-allowed" : "pointer",
                          color: "#fff",
                        }}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input - always visible at bottom */}
        <div style={{
          flexShrink: 0,
          padding: "12px 16px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          gap: 10,
          alignItems: "center",
          background: "#fff",
          boxSizing: "border-box",
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: T.pri + "30",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}>
            👤
          </div>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            style={{
              flex: 1,
              padding: "10px 14px",
              border: `1px solid ${T.border}`,
              borderRadius: 22,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
              minWidth: 0,
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !posting) {
                handlePostComment();
              }
            }}
          />
          <button
            onClick={handlePostComment}
            disabled={posting || !newComment.trim()}
            style={{
              background: posting || !newComment.trim() ? T.sub : T.pri,
              border: "none",
              borderRadius: "50%",
              width: 38,
              height: 38,
              minWidth: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: posting || !newComment.trim() ? "not-allowed" : "pointer",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {posting ? <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={18} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
