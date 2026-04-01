import { useState, useEffect } from "react";
import { Grid, Film, Bookmark, Settings, ArrowLeft, UserPlus, UserCheck, Edit, Trash2, Edit2, MoreVertical } from "lucide-react";
import api from "../api";
import config from "../config";
import { getRelativeTime } from "../utils/timeUtils";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function ProfilePage({ user, userId, onBack, onEditProfile, onShowFollowers, onShowFollowing, onShowSettings }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showPostMenu, setShowPostMenu] = useState(null);

  const isOwnProfile = !userId || userId === user?.id;

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
        setLoading(true);
        const targetUserId = userId || user?.id;
        
        if (isOwnProfile) {
          // Always get fresh user data from localStorage for own profile
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setProfileUser(parsedUser);
          } else {
            setProfileUser(user);
          }
        } else {
          const userData = await api.getUser(userId);
          setProfileUser(userData);
        }
        
        // Get follower/following counts
        await fetchFollowCounts(targetUserId);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId, user]);

  useEffect(() => {
    // Refresh profile when user data changes
    const storedUser = localStorage.getItem('user');
    if (storedUser && isOwnProfile) {
      const userData = JSON.parse(storedUser);
      setProfileData(userData);
    }
  }, [user, isOwnProfile]);

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

  if (loading) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}>
        <div style={{ fontSize: 14, color: T.sub }}>Loading profile...</div>
      </div>
    );
  }

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
          { id: "posts", icon: Grid, label: "Posts" },
          { id: "reels", icon: Film, label: "Reels" },
          { id: "saved", icon: Bookmark, label: "Saved" },
        ].filter(tab => isOwnProfile || (tab.id !== "saved")).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "12px",
                border: "none",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderBottom: isActive ? `2px solid ${T.pri}` : "2px solid transparent",
                color: isActive ? T.txt : T.sub,
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Posts Grid */}
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
                return (
                  <>
                    <video
                      src={videoUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
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
        <div style={{
          padding: 40,
          textAlign: "center",
          color: T.sub,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No posts yet</div>
          <div style={{ fontSize: 13 }}>
            {isOwnProfile ? "Share your first post!" : "No posts to show"}
          </div>
        </div>
      )}
    </div>
  );
}
