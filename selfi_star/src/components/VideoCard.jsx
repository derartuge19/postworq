import { useState } from "react";

const T = { pri:"#DA9B2A", txt:"#1C1917", sub:"#78716C", bg:"#FAFAF7", dark:"#0C1A12", border:"#E7E5E4", red:"#EF4444" };

export function VideoCard({ video, onLike, onComment, onShare }) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    onLike?.();
  };

  return (
    <div style={{
      background: "#000",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 20,
      position: "relative",
      aspectRatio: "9/16",
      maxHeight: 600,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Video/Image */}
      <div style={{
        flex: 1,
        background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {video?.image ? (
          <img src={video.image} alt="video" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center", color: "#666" }}>
            <div style={{ fontSize: 60, marginBottom: 10 }}>🎬</div>
            <div>Video coming soon</div>
          </div>
        )}

        {/* Play Button Overlay */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: 60,
          opacity: 0.7,
          pointerEvents: "none",
        }}>
          ▶️
        </div>

        {/* Creator Info Overlay */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
          padding: "20px 16px",
          color: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: T.pri,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}>
              👤
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{video?.creator || "Creator"}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>@{video?.handle || "handle"}</div>
            </div>
            <button style={{
              marginLeft: "auto",
              background: T.pri,
              border: "none",
              borderRadius: 20,
              color: "#fff",
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}>
              Follow
            </button>
          </div>
          <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.4 }}>
            {video?.caption || "Check out this amazing content!"}
          </div>
        </div>
      </div>

      {/* Actions Sidebar */}
      <div style={{
        position: "absolute",
        right: 12,
        bottom: 80,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {/* Like */}
        <button
          onClick={handleLike}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            color: liked ? T.red : "#fff",
            transition: "all .2s",
          }}
        >
          <div style={{ fontSize: 32 }}>{liked ? "❤️" : "🤍"}</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{video?.likes || 0}</div>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 32 }}>💬</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{video?.comments || 0}</div>
        </button>

        {/* Share */}
        <button
          onClick={onShare}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 32 }}>📤</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{video?.shares || 0}</div>
        </button>

        {/* Bookmark */}
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 32 }}>🔖</div>
        </button>
      </div>
    </div>
  );
}
