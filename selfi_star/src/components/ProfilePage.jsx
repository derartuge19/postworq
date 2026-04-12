import { useState, useEffect } from "react";
import { Grid, Film, Bookmark, Settings, ArrowLeft, UserPlus, UserCheck, Edit, Trash2, Edit2, MoreVertical, Trophy, Flag } from "lucide-react";
import { GamificationBar } from "./GamificationBar";
import api from "../api";
import config from "../config";
import { getRelativeTime } from "../utils/timeUtils";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { TikTokPostViewer } from "./TikTokPostViewer";
import CampaignStats from "./CampaignStats";

export function ProfilePage({ user, userId, onBack, onEditProfile, onShowFollowers, onShowFollowing, onShowSettings }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const isOwnProfile = !userId || userId === user?.id;

  // For own profile, initialize immediately from cache so no loading screen
  const cachedUser = isOwnProfile ? (() => {
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : user; } catch { return user; }
  })() : null;
  const [profileUser, setProfileUser] = useState(cachedUser);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [profileData, setProfileData] = useState(cachedUser);
  const [loading, setLoading] = useState(!isOwnProfile);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showPostMenu, setShowPostMenu] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postMenuId, setPostMenuId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editMediaFile, setEditMediaFile] = useState(null);
  const [editMediaPreview, setEditMediaPreview] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showReportUser, setShowReportUser] = useState(false);
  const [reportingUser, setReportingUser] = useState(false);
  const [reportUserMsg, setReportUserMsg] = useState(null);

  const USER_REPORT_REASONS = [
    { id: 'harassment', label: 'Harassment or Bullying', icon: '😡' },
    { id: 'spam', label: 'Spam or Fake Account', icon: '⚠️' },
    { id: 'inappropriate', label: 'Inappropriate Content', icon: '😢' },
    { id: 'hate_speech', label: 'Hate Speech', icon: '🚫' },
    { id: 'scam', label: 'Scam or Fraud', icon: '💸' },
    { id: 'other', label: 'Other', icon: '📋' },
  ];

  const handleReportUser = async (reportType) => {
    setShowReportUser(false);
    setReportingUser(true);
    try {
      await api.request('/reports/create/', {
        method: 'POST',
        body: JSON.stringify({
          reported_user_id: userId,
          report_type: reportType,
          description: `User reported as: ${reportType}`,
          target_type: 'user',
        }),
      });
      setReportUserMsg({ type: 'success', text: 'Report submitted. Thank you for keeping the community safe.' });
    } catch (err) {
      setReportUserMsg({ type: 'error', text: 'Failed to submit report. Please try again.' });
    } finally {
      setReportingUser(false);
      setTimeout(() => setReportUserMsg(null), 4000);
    }
  };
  
  const handleDeletePost = async (postId) => {
    setConfirmDeleteId(null);
    try {
      await api.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      if (selectedPost?.id === postId) setSelectedPost(null);
      setSuccessMsg('Post deleted!');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleRequestDelete = (postId) => {
    setPostMenuId(null);
    setConfirmDeleteId(postId);
  };

  const handleEditPost = (postIdOrPost) => {
    const post = typeof postIdOrPost === 'object' ? postIdOrPost : posts.find(p => p.id === postIdOrPost);
    if (!post) return;
    setPostMenuId(null);
    setEditingPost(post);
    setEditCaption(post.caption || '');
    setEditHashtags(post.hashtags || '');
    setEditMediaFile(null);
    setEditMediaPreview(null);
  };

  const handleEditMediaChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setEditMediaFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setEditMediaPreview(previewUrl);
  };

  const handleEditSave = async () => {
    if (!editingPost) return;
    setIsSaving(true);
    try {
      // If there's a new media file, use FormData
      if (editMediaFile) {
        const formData = new FormData();
        formData.append('caption', editCaption);
        formData.append('hashtags', editHashtags);
        formData.append('file', editMediaFile);
        
        await api.request(`/reels/${editingPost.id}/`, {
          method: 'PATCH',
          body: formData,
          isFormData: true,
        });
      } else {
        // No new media, just update text fields
        await api.updatePost(editingPost.id, { 
          caption: editCaption,
          hashtags: editHashtags 
        });
      }
      
      // Refresh posts to get updated data
      const updatedPosts = await api.request(`/reels/?user=${userId || user?.id}`);
      setPosts(Array.isArray(updatedPosts) ? updatedPosts : updatedPosts.results || []);
      
      setEditingPost(null);
      setEditMediaFile(null);
      setEditMediaPreview(null);
      setSuccessMsg('Post updated!');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      console.error('Failed to update post:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchFollowCounts = async (targetUserId) => {
    if (!targetUserId || targetUserId === 'null' || targetUserId === null) {
      console.log('No valid user ID for fetching follow counts');
      return;
    }
    
    // Skip API calls if user is not authenticated
    if (!user) {
      return;
    }
    
    try {
      const followersRaw = await api.getFollowers(targetUserId);
      const followingRaw = await api.getFollowing(targetUserId);
      const followers = Array.isArray(followersRaw) ? followersRaw : (followersRaw.results || []);
      const following = Array.isArray(followingRaw) ? followingRaw : (followingRaw.results || []);
      setFollowersCount(followers.length);
      setFollowingCount(following.length);
      
      if (!isOwnProfile && user) {
        const isFollowingUser = followers.some(f => f.follower?.id === user.id);
        setIsFollowing(isFollowingUser);
      }
    } catch (error) {
      console.error("Failed to fetch follow counts:", error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const targetUserId = userId || user?.id;
        
        
        if (isOwnProfile) {
          // Own profile: already initialized from cache, just refresh counts in background
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setProfileUser(parsed);
            setProfileData(parsed);
          }
          // Don't block — fetch counts in background
          fetchFollowCounts(targetUserId);
        } else {
          // Other user profile: show skeleton until data arrives
          setLoading(true);
          try {
            const [userData] = await Promise.all([
              api.getUser(userId),
              fetchFollowCounts(targetUserId),
            ]);
            setProfileUser(userData);
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId, user]);

  useEffect(() => {
    const fetchPosts = async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId || targetUserId === 'null' || targetUserId === null) {
        console.log('No valid user ID available, skipping fetch');
        setPosts([]);
        return;
      }

      try {
        let data;
        if (activeTab === "saved") {
          const raw = await api.getSavedPosts();
          data = Array.isArray(raw) ? raw : (raw.results || []);
        } else if (activeTab === "reels") {
          const raw = await api.getUserPosts(targetUserId);
          data = Array.isArray(raw) ? raw : (raw.results || []);
          data = data.filter(post => {
            const url = post.media || post.image || '';
            return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video');
          });
        } else {
          const raw = await api.getUserPosts(targetUserId);
          data = Array.isArray(raw) ? raw : (raw.results || []);
        }
        setPosts(data || []);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        setPosts([]);
      }
    };
    
    fetchPosts();
  }, [activeTab, userId, user, isOwnProfile]);

  const handleFollowToggle = async () => {
    try {
      const response = await api.toggleFollow(userId);
      setIsFollowing(response.following);
      
      // Immediately update counts based on action
      setFollowersCount(prev => response.following ? prev + 1 : prev - 1);
      
      // Fetch fresh counts from server to ensure accuracy
      const targetUserId = userId || user?.id;
      await fetchFollowCounts(targetUserId);
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "#fff",
      overflowY: "auto",
      zIndex: 200,
    }}>
      {loading ? (
        <>
          {/* Skeleton header */}
          <div style={{
            padding: "12px 20px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0f0f0" }} />
            <div style={{ width: 120, height: 16, background: "#f0f0f0", borderRadius: 8 }} />
          </div>
          {/* Skeleton profile info */}
          <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              background: "linear-gradient(135deg, #f0f0f0, #e0e0e0)",
            }} />
            <div style={{ width: 140, height: 16, background: "#f0f0f0", borderRadius: 8 }} />
            <div style={{ width: 100, height: 12, background: "#f5f5f5", borderRadius: 6 }} />
            <div style={{ display: "flex", gap: 32, marginTop: 8 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ width: 36, height: 16, background: "#f0f0f0", borderRadius: 8, margin: "0 auto 4px" }} />
                  <div style={{ width: 50, height: 10, background: "#f5f5f5", borderRadius: 5 }} />
                </div>
              ))}
            </div>
            <div style={{ width: 160, height: 36, background: "#f0f0f0", borderRadius: 20, marginTop: 8 }} />
          </div>
          {/* Skeleton grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, padding: "0 2px" }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ aspectRatio: "1", background: "#f5f5f5" }} />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Header */}
      <div style={{
        position: "sticky",
        top: 0,
        background: "#fff",
        borderBottom: `1px solid ${T.border}`,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        zIndex: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            display: "flex",
            alignItems: "center",
            color: T.txt,
          }}
        >
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.txt }}>
            {profileUser?.username}
          </div>
          <div style={{ fontSize: 12, color: T.sub }}>
            {posts.length} posts
          </div>
        </div>
        {isOwnProfile && (
          <button
            onClick={onShowSettings}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              color: T.txt,
            }}
          >
            <Settings size={24} />
          </button>
        )}
      </div>

      {isOwnProfile && <GamificationBar userId={userId || user?.id} theme={T} />}

      {/* Profile Info */}
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {profileUser?.profile_photo ? (
              <img
                src={profileUser.profile_photo.startsWith('http') ? profileUser.profile_photo : `${config.API_BASE_URL.replace('/api', '')}${profileUser.profile_photo}`}
                alt="Profile"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: T.pri + "30",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
              }}>
                👤
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.txt }}>{posts.length}</div>
                <div style={{ fontSize: 13, color: T.sub }}>Posts</div>
              </div>
              <button
                onClick={() => onShowFollowers?.(userId || user?.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color: T.txt }}>{followersCount}</div>
                <div style={{ fontSize: 13, color: T.sub }}>Followers</div>
              </button>
              <button
                onClick={() => onShowFollowing?.(userId || user?.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color: T.txt }}>{followingCount}</div>
                <div style={{ fontSize: 13, color: T.sub }}>Following</div>
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.txt, marginBottom: 4 }}>
            {profileUser?.first_name} {profileUser?.last_name}
          </div>
          {profileUser?.bio && (
            <div style={{ fontSize: 14, color: T.txt, lineHeight: 1.5 }}>
              {profileUser.bio}
            </div>
          )}
        </div>

        {!isOwnProfile && (
          <>
            {/* Toast */}
            {reportUserMsg && (
              <div style={{ marginBottom: 10, padding: '10px 14px', borderRadius: 8, background: reportUserMsg.type === 'success' ? '#D1FAE5' : '#FEE2E2', color: reportUserMsg.type === 'success' ? '#065F46' : '#991B1B', fontSize: 13, fontWeight: 500 }}>
                {reportUserMsg.text}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleFollowToggle}
                style={{
                  flex: 1,
                  padding: "10px 20px",
                  border: isFollowing ? `1px solid ${T.border}` : "none",
                  background: isFollowing ? "#fff" : T.pri,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  color: isFollowing ? T.txt : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s",
                }}
              >
                {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                {isFollowing ? "Following" : "Follow"}
              </button>
              <button
                onClick={() => setShowReportUser(true)}
                disabled={reportingUser}
                style={{
                  padding: "10px 14px",
                  border: `1px solid ${T.border}`,
                  background: "#fff",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: '#EF4444',
                  opacity: reportingUser ? 0.5 : 1,
                }}
                title="Report user"
              >
                <Flag size={18} />
              </button>
            </div>
          </>
        )}

        {isOwnProfile && (
          <button
            onClick={() => onEditProfile?.()}
            style={{
              width: "100%",
              padding: "10px 20px",
              border: `1px solid ${T.border}`,
              background: "#fff",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              color: T.txt,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}>
            <Edit size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}>
        {[
          { id: "posts",     icon: Grid,     label: "Posts"     },
          { id: "reels",     icon: Film,     label: "Reels"     },
          { id: "saved",     icon: Bookmark, label: "Saved"     },
          { id: "campaigns", icon: Trophy,   label: "Campaigns" },
        ].filter(tab => isOwnProfile || tab.id !== "saved").map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              style={{
                flex: 1,
                padding: "14px 8px",
                border: "none",
                background: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                borderBottom: isActive ? `3px solid ${T.pri}` : "3px solid transparent",
                color: isActive ? T.pri : T.sub,
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, letterSpacing: 0.3 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Campaign Stats Tab */}
      {activeTab === "campaigns" && (
        <div style={{ padding: "20px" }}>
          <CampaignStats userId={userId || user?.id} />
        </div>
      )}

      {/* Posts Grid */}
      {activeTab !== "campaigns" && (
      <>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 2,
        padding: 2,
      }}>
        {posts.map(post => (
          <div
            key={post.id}
            style={{
              aspectRatio: "1",
              background: T.bg,
              position: "relative",
              cursor: "pointer",
              overflow: "hidden",
            }}
            onClick={() => setSelectedPost(post)}
            onMouseEnter={(e) => {
              if (isOwnProfile && window.innerWidth > 768) {
                const btn = e.currentTarget.querySelector('.post-menu-btn');
                if (btn) btn.style.opacity = '1';
              }
            }}
            onMouseLeave={(e) => {
              if (isOwnProfile && window.innerWidth > 768) {
                const btn = e.currentTarget.querySelector('.post-menu-btn');
                if (btn) btn.style.opacity = '0';
              }
            }}
          >
            {/* Three-dot menu - hover on desktop, always visible on mobile */}
            {isOwnProfile && (
              <button
                className="post-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setPostMenuId(postMenuId === post.id ? null : post.id);
                }}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  zIndex: 10,
                  opacity: window.innerWidth <= 768 ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
              >
                <MoreVertical size={13} />
              </button>
            )}
            
            {(() => {
              const mediaUrl = post.media || post.image || '';
              const fullUrl = mediaUrl.startsWith('http') ? mediaUrl : `${config.API_BASE_URL.replace('/api', '')}${mediaUrl}`;
              const isVideo = mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) || mediaUrl.includes('video');
              
              if (!mediaUrl) {
                return (
                  <div style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: T.sub,
                  }}>
                    No media
                  </div>
                );
              }
              
              if (isVideo) {
                // Append .mp4 if Cloudinary video URL missing extension
                const videoUrl = (fullUrl.includes('cloudinary') && !fullUrl.match(/\.(mp4|webm|ogg|mov)$/i))
                  ? fullUrl + '.mp4'
                  : fullUrl;
                
                // Generate poster thumbnail from video URL
                const getVideoPoster = (url) => {
                  if (!url || !url.includes('cloudinary')) return '';
                  if (!url.includes('/video/upload/')) return '';
                  return url
                    .replace('/video/upload/', '/video/upload/so_0,w_300,h_300,c_fill,q_auto:low,f_jpg/')
                    .replace(/\.(mp4|webm|ogg|mov)(\?.*)?$/i, '.jpg');
                };
                
                return (
                  <>
                    <video
                      src={videoUrl}
                      poster={getVideoPoster(videoUrl)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        background: T.bg,
                      }}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onMouseEnter={(e) => e.target.play()}
                      onMouseLeave={(e) => e.target.pause()}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: 4,
                      padding: '3px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <Film size={12} color="#fff" />
                    </div>
                  </>
                );
              }
              
              return (
                <img
                  src={fullUrl}
                  alt={post.caption}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              );
            })()}
            <div style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "rgba(0,0,0,0.6)",
              borderRadius: 4,
              padding: "4px 8px",
              fontSize: 11,
              color: "#fff",
              fontWeight: 600,
            }}>
              ❤️ {post.votes}
            </div>
          </div>
        ))}
      </div>
      {posts.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: T.sub }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No posts yet</div>
          <div style={{ fontSize: 13 }}>
            {isOwnProfile ? "Share your first post!" : "No posts to show"}
          </div>
        </div>
      )}
      </>
      )}

      {/* TikTok-Style Post Detail Viewer */}
      {selectedPost && (
        <TikTokPostViewer
          posts={posts}
          initialIndex={posts.findIndex(p => p.id === selectedPost.id)}
          user={user}
          profileUser={profileUser}
          onClose={() => setSelectedPost(null)}
          onDeletePost={handleRequestDelete}
          onEditPost={handleEditPost}
          isOwnProfile={isOwnProfile}
        />
      )}

      {/* Post Menu Bottom Sheet */}
      {postMenuId && (
        <div
          onClick={() => setPostMenuId(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.45)', zIndex: 2000,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480, background: '#fff',
              borderRadius: '20px 20px 0 0', padding: '8px 0 40px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ width: 36, height: 4, background: '#E7E5E4', borderRadius: 4, margin: '12px auto 20px' }} />
            <button
              onClick={() => { const p = posts.find(p => p.id === postMenuId); handleEditPost(p); }}
              style={{
                width: '100%', padding: '16px 24px', background: 'none', border: 'none',
                textAlign: 'left', fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14, color: T.txt,
              }}
            >
              <Edit2 size={20} style={{ color: T.pri }} /> Edit Caption
            </button>
            <button
              onClick={() => { setConfirmDeleteId(postMenuId); setPostMenuId(null); }}
              style={{
                width: '100%', padding: '16px 24px', background: 'none', border: 'none',
                textAlign: 'left', fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14, color: '#EF4444',
              }}
            >
              <Trash2 size={20} /> Delete Post
            </button>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div
          onClick={() => setEditingPost(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 2100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            overflowY: 'auto',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 520, background: '#fff',
              borderRadius: 20, padding: 24,
              boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: T.txt, marginBottom: 4 }}>Edit Post</div>
            <div style={{ fontSize: 13, color: T.sub, marginBottom: 20 }}>Update your post details below.</div>
            
            {/* Media Preview */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 8 }}>Media</div>
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: 12,
                overflow: 'hidden', background: T.bg,
                border: `1px solid ${T.border}`,
                position: 'relative',
              }}>
                {(() => {
                  // Show new preview if file selected, otherwise show original
                  const displayUrl = editMediaPreview || (() => {
                    const mediaUrl = editingPost.media || editingPost.image || '';
                    return mediaUrl.startsWith('http') ? mediaUrl : `${config.API_BASE_URL.replace('/api', '')}${mediaUrl}`;
                  })();
                  
                  const isVideo = editMediaFile 
                    ? editMediaFile.type.startsWith('video/')
                    : (editingPost.media || '').match(/\.(mp4|webm|ogg|mov)$/i) || (editingPost.media || '').includes('video');
                  
                  if (isVideo) {
                    return (
                      <video
                        src={displayUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        controls
                      />
                    );
                  } else {
                    return (
                      <img
                        src={displayUrl}
                        alt="Post media"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    );
                  }
                })()}
              </div>
              <input
                type="file"
                id="edit-media-input"
                accept="image/*,video/*"
                onChange={handleEditMediaChange}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => document.getElementById('edit-media-input').click()}
                style={{
                  marginTop: 10,
                  padding: '10px 16px',
                  background: T.bg,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.txt,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                📷 {editMediaFile ? 'Change Media Again' : 'Change Media'}
              </button>
              {editMediaFile && (
                <div style={{ fontSize: 12, color: T.pri, marginTop: 6, fontWeight: 600 }}>
                  ✓ New media selected: {editMediaFile.name}
                </div>
              )}
            </div>

            {/* Caption */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 8 }}>Caption</div>
              <textarea
                value={editCaption}
                onChange={e => setEditCaption(e.target.value)}
                rows={4}
                style={{
                  width: '100%', padding: 12, fontSize: 15, color: T.txt,
                  border: `1.5px solid ${T.border}`, borderRadius: 12,
                  resize: 'none', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box', lineHeight: 1.5,
                }}
                placeholder="Write a caption..."
                autoFocus
              />
            </div>

            {/* Hashtags */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 8 }}>Hashtags</div>
              <input
                type="text"
                value={editHashtags}
                onChange={e => setEditHashtags(e.target.value)}
                style={{
                  width: '100%', padding: 12, fontSize: 15, color: T.txt,
                  border: `1.5px solid ${T.border}`, borderRadius: 12,
                  outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
                placeholder="#hashtag1 #hashtag2"
              />
              <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>
                Separate hashtags with spaces (e.g., #travel #photography)
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setEditingPost(null)}
                style={{
                  flex: 1, padding: '12px 20px',
                  border: `1px solid ${T.border}`, background: '#fff',
                  borderRadius: 12, fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', color: T.txt,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={isSaving}
                style={{
                  flex: 1, padding: '12px 20px',
                  border: 'none', background: T.pri,
                  borderRadius: 12, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', color: '#fff', opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div
          onClick={() => setConfirmDeleteId(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 2100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 360, background: '#fff',
              borderRadius: 20, padding: 28, textAlign: 'center',
              boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.txt, marginBottom: 8 }}>Delete Post?</div>
            <div style={{ fontSize: 14, color: T.sub, marginBottom: 24 }}>This cannot be undone.</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  flex: 1, padding: '12px 20px',
                  border: `1px solid ${T.border}`, background: '#fff',
                  borderRadius: 12, fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', color: T.txt,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePost(confirmDeleteId)}
                style={{
                  flex: 1, padding: '12px 20px',
                  border: 'none', background: '#EF4444',
                  borderRadius: 12, fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', color: '#fff',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successMsg && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: '#1C1917', color: '#fff',
          padding: '12px 24px', borderRadius: 24,
          fontSize: 14, fontWeight: 600, zIndex: 2200,
          whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ✓ {successMsg}
        </div>
      )}
        </>
      )}

      {/* Report User Bottom Sheet */}
      {showReportUser && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowReportUser(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px 36px', boxSizing: 'border-box' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 4, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Flag size={18} color="#EF4444" />
              <span style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>Report @{profileUser?.username}</span>
            </div>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
              Why are you reporting this account?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {USER_REPORT_REASONS.map(r => (
                <button key={r.id} onClick={() => handleReportUser(r.id)}
                  style={{ padding: '13px 16px', border: '1px solid #F3F4F6', borderRadius: 10, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#111', fontWeight: 500, textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <span style={{ fontSize: 18 }}>{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowReportUser(false)}
              style={{ marginTop: 12, width: '100%', padding: 12, border: 'none', borderRadius: 10, background: '#F3F4F6', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
