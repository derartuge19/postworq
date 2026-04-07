import { useState, useEffect } from "react";
import { Grid, Film, Bookmark, Settings, ArrowLeft, UserPlus, UserCheck, Edit, Trash2, Edit2, MoreVertical, Trophy } from "lucide-react";
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
  
  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await api.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setShowPostMenu(null);
      alert('Post deleted successfully!');
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleEditPost = (postId) => {
    setShowPostMenu(null);
    // TODO: Implement edit post functionality
    alert('Edit post functionality coming soon!');
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
          <button
            onClick={handleFollowToggle}
            style={{
              width: "100%",
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
              if (isOwnProfile) {
                e.currentTarget.querySelector('.post-actions').style.opacity = '1';
              }
            }}
            onMouseLeave={(e) => {
              if (isOwnProfile) {
                e.currentTarget.querySelector('.post-actions').style.opacity = '0';
              }
            }}
          >
            {/* Edit/Delete Actions - Only for own profile */}
            {isOwnProfile && (
              <div
                className="post-actions"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  display: "flex",
                  gap: 8,
                  zIndex: 10,
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPost(post.id);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.7)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                  title="Edit post"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePost(post.id);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(220,38,38,0.9)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                  title="Delete post"
                >
                  <Trash2 size={16} />
                </button>
              </div>
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
                  if (!url.includes('cloudinary')) return '';
                  // Create thumbnail by replacing /video/upload/ with transformed image URL
                  return url
                    .replace('/video/upload/', '/video/upload/so_0,w_300,h_300,c_fill,q_auto:low/')
                    .replace(/\.mp4$/i, '.jpg');
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
          onDeletePost={handleDeletePost}
          onEditPost={handleEditPost}
          isOwnProfile={isOwnProfile}
        />
      )}
        </>
      )}
    </div>
  );
}
