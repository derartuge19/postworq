import { useState, useEffect } from "react";
import { VideoCard } from "./VideoCard";
import api from "../api";

const T = { pri:"#DA9B2A", txt:"#1C1917", sub:"#78716C", bg:"#FAFAF7", dark:"#0C1A12", border:"#E7E5E4" };

export function FeedPage({ tab }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, [tab]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const response = await api.request('/reels/');
      const reels = response.results || response || [];
      
      // Transform reels to match VideoCard expected format
      const transformedVideos = reels.map(reel => ({
        id: reel.id,
        creator: reel.user?.username || reel.user?.first_name || 'User',
        handle: reel.user?.username || 'user',
        caption: reel.caption || '',
        likes: reel.votes || 0,
        comments: reel.comments_count || 0,
        shares: 0,
        image: reel.image,
        media: reel.media,
        user: reel.user,
      }));
      
      setVideos(transformedVideos);
    } catch (error) {
      console.error("Error loading videos:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (videoId) => {
    setVideos(videos.map(v => 
      v.id === videoId ? { ...v, likes: v.likes + 1 } : v
    ));
  };

  const handleShare = (videoId) => {
    setVideos(videos.map(v => 
      v.id === videoId ? { ...v, shares: v.shares + 1 } : v
    ));
  };

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "20px",
      background: T.bg,
    }}>
      {/* Header */}
      <div style={{
        marginBottom: 30,
        paddingBottom: 20,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.txt }}>
          {tab === "feed" && "For You"}
          {tab === "following" && "Following"}
          {tab === "explore" && "Explore"}
          {tab === "likes" && "Your Likes"}
          {tab === "bookmarks" && "Bookmarks"}
        </div>
        <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>
          {tab === "feed" && "Discover trending content"}
          {tab === "following" && "Videos from creators you follow"}
          {tab === "explore" && "What's trending now"}
          {tab === "likes" && "Videos you've liked"}
          {tab === "bookmarks" && "Your saved videos"}
        </div>
      </div>

      {/* Videos Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 20,
      }}>
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            onLike={() => handleLike(video.id)}
            onShare={() => handleShare(video.id)}
          />
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: T.sub }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
          <div>Loading videos...</div>
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: T.sub }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div>No videos yet</div>
        </div>
      )}
    </div>
  );
}
