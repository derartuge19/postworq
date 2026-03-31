import { useState, useEffect } from "react";
import { Play, Heart, MessageCircle, Share2, TrendingUp, Users, Zap, Trophy } from "lucide-react";
import api from "../api";
import { getRelativeTime } from "../utils/timeUtils";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function LandingPage({ onLogin, onRegister, onShowCampaigns }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await api.getReels();
      setPosts(data.slice(0, 6)); // Show first 6 posts
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Hero Section */}
      <div style={{
        background: `linear-gradient(135deg, ${T.dark}, ${T.pri})`,
        color: "#fff",
        padding: "60px 20px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>✨</div>
          <h1 style={{ 
            fontSize: 56, 
            fontWeight: 900, 
            marginBottom: 16,
            background: "linear-gradient(to right, #fff, #FFD700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            WorqPost
          </h1>
          <div style={{ fontSize: 20, marginBottom: 8, opacity: 0.95 }}>
            ወorqPost - Share Your Story
          </div>
          <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            Join millions of creators sharing videos, images, and moments. Connect with friends, discover new content, and express yourself.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={onRegister}
              style={{
                padding: "16px 40px",
                background: "#fff",
                color: T.dark,
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              }}
            >
              Get Started Free
            </button>
            <button
              onClick={onLogin}
              style={{
                padding: "16px 40px",
                background: "transparent",
                color: "#fff",
                border: "2px solid #fff",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Log In
            </button>
            <button
              onClick={onShowCampaigns}
              style={{
                padding: "16px 40px",
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                color: "#000",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(255,215,0,0.4)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Trophy size={20} />
              View Campaigns
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: "80px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 60, color: T.txt }}>
            Why Choose WorqPost?
          </h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
            gap: 40 
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: T.pri + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Play size={40} color={T.pri} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: T.txt }}>
                Share Videos & Images
              </h3>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
                Upload and share your favorite moments with high-quality video and image support.
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: T.pri + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Users size={40} color={T.pri} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: T.txt }}>
                Connect with Friends
              </h3>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
                Follow your friends, discover new creators, and build your community.
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: T.pri + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Heart size={40} color={T.pri} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: T.txt }}>
                Engage & Interact
              </h3>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
                Like, comment, and share content. Join conversations and express yourself.
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: T.pri + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Trophy size={40} color={T.pri} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: T.txt }}>
                Win Prizes
              </h3>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
                Join exciting campaigns and competitions. Showcase your creativity and win amazing prizes!
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: T.pri + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <TrendingUp size={40} color={T.pri} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: T.txt }}>
                Trending Content
              </h3>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
                Discover what's trending and stay updated with the latest viral content.
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: T.pri + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <MessageCircle size={40} color={T.pri} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: T.txt }}>
                Real-time Chat
              </h3>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
                Message your friends and followers with instant notifications.
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: T.pri + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Zap size={40} color={T.pri} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: T.txt }}>
                Competitions & Rewards
              </h3>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.6 }}>
                Participate in competitions, earn votes, and win amazing prizes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Preview Section */}
      <div style={{ padding: "80px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 16, color: T.txt }}>
            Trending Posts
          </h2>
          <p style={{ textAlign: "center", fontSize: 16, color: T.sub, marginBottom: 60 }}>
            See what's popular on WorqPost. Join to like, comment, and share!
          </p>
          
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: T.sub }}>Loading posts...</div>
          ) : (
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
              gap: 20 
            }}>
              {posts.map(post => (
                <div key={post.id} style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  border: `1px solid ${T.border}`,
                  background: "#fff",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                >
                  {post.media || post.image ? (
                    <div style={{ aspectRatio: "1", background: "#000", position: "relative" }}>
                      {(post.media?.match(/\.(mp4|webm|ogg)$/i) || post.media?.includes('video')) ? (
                        <video
                          src={post.media?.startsWith('http') ? post.media : `http://localhost:8000${post.media}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <img
                          src={(post.media || post.image)?.startsWith('http') ? (post.media || post.image) : `http://localhost:8000${post.media || post.image}`}
                          alt={post.caption}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                    </div>
                  ) : (
                    <div style={{ aspectRatio: "1", background: T.pri + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                      🎬
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 14, color: T.txt, marginBottom: 8, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {post.caption || "No caption"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: T.sub }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Heart size={16} />
                        {post.votes || 0}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MessageCircle size={16} />
                        {post.comment_count || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button
              onClick={onRegister}
              style={{
                padding: "14px 32px",
                background: T.pri,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Join to See More
            </button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        padding: "80px 20px",
        background: `linear-gradient(135deg, ${T.pri}20, ${T.dark}10)`,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 20, color: T.txt }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: 16, color: T.sub, marginBottom: 40 }}>
            Join thousands of creators and start sharing your story today. It's free!
          </p>
          <button
            onClick={onRegister}
            style={{
              padding: "16px 48px",
              background: `linear-gradient(135deg, ${T.pri}, ${T.dark})`,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 18,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            Create Your Account
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "40px 20px",
        background: T.dark,
        color: "#fff",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 10, opacity: 0.7 }}>
          © 2024 WorqPost (ወorqPost) - All rights reserved
        </div>
      </div>
    </div>
  );
}
