import { useState } from "react";
import { Heart } from "lucide-react";

export function LikeButton({ liked, count, onLike, size = 24 }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    if (!liked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
    onLike();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <button
        onClick={handleClick}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: liked ? "#FF0050" : "#fff",
          transform: isAnimating ? "scale(1.2)" : "scale(1)",
          transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <Heart
          size={size}
          fill={liked ? "#FF0050" : "none"}
          stroke={liked ? "#FF0050" : "#fff"}
          strokeWidth={2}
          style={{
            transition: "all 0.2s ease",
          }}
        />
      </button>
      
      {showHeart && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "heartBurst 1s ease-out forwards",
            pointerEvents: "none",
          }}
        >
          <Heart
            size={size * 2}
            fill="#FF0050"
            stroke="#FF0050"
            strokeWidth={2}
          />
        </div>
      )}
      
      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", textAlign: "center" }}>{count}</div>
      
      <style>{`
        @keyframes heartBurst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.5);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2);
          }
        }
      `}</style>
    </div>
  );
}
