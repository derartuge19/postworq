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
      // Mock videos for now - replace with API call
      const mockVideos = [
        {
          id: 1,
          creator: "Sarah Creator",
          handle: "sarahcreator",
          caption: "Just finished my morning workout! 💪 #fitness #motivation",
          likes: 1234,
          comments: 89,
          shares: 45,
          image: "https://via.placeholder.com/400x600?text=Video+1",
        },
        {
          id: 2,
          creator: "Tech Guru",
          handle: "techguru",
          caption: "New iPhone 15 Pro Max unboxing! 📱✨",
          likes: 5678,
          comments: 234,
          shares: 123,
          image: "https://via.placeholder.com/400x600?text=Video+2",
        },
        {
          id: 3,
          creator: "Cooking with Love",
          handle: "cookingwithlove",
          caption: "Easy 5-minute pasta recipe 🍝 #cooking #recipe",
          likes: 3456,
          comments: 156,
          shares: 78,
          image: "https://via.placeholder.com/400x600?text=Video+3",
        },
        {
          id: 4,
          creator: "Travel Vlogger",
          handle: "travelvlogger",
          caption: "Hidden gem in Bali 🏝️ #travel #bali",
          likes: 8901,
          comments: 567,
          shares: 234,
          image: "https://via.placeholder.com/400x600?text=Video+4",
        },
      ];
      setVideos(mockVideos);
    } catch (error) {
      console.error("Error loading videos:", error);
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
