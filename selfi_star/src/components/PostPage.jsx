import { useState } from "react";
import api from "../api";
import { useLegacyT } from "../contexts/ThemeContext";

export function PostPage({ user, onBack }) {
  const T = useLegacyT();
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    console.log("File selected:", file);
    console.log("File type:", file?.type);
    console.log("File size:", file?.size);
    console.log("File name:", file?.name);
    
    if (file) {
      // Check if it's a video or image
      if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
        alert("Please select a video or image file");
        return;
      }
      
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestPost = async () => {
    console.log("Testing post without file...");
    try {
      // Create a simple text file for testing
      const testBlob = new Blob(['test content'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append("file", testFile);
      formData.append("caption", "Test post");
      
      console.log("Test FormData created");
      const response = await api.createPost(formData);
      console.log("Test post successful:", response);
      
      alert("Test post successful!");
      
      if (window.refreshFeed) {
        window.refreshFeed();
      }
      
      onBack();
    } catch (error) {
      console.error("Test post error:", error);
      alert("Test post failed: " + JSON.stringify(error));
    }
  };

  const handlePost = async () => {
    if (!selectedFile) {
      alert("Please select a video or image to post");
      return;
    }

    setIsUploading(true);
    
    try {
      console.log("Starting post upload...");
      console.log("Selected file:", selectedFile);
      console.log("Caption:", caption);
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("caption", caption);
      formData.append("hashtags", hashtags);
      
      console.log("FormData created, calling API...");
      const response = await api.createPost(formData);
      console.log("API response:", response);
      
      alert("Post uploaded successfully!");
      
      // Reset form
      setCaption("");
      setHashtags("");
      setSelectedFile(null);
      setPreview(null);
      
      // Refresh the feed to show the new post
      if (window.refreshFeed) {
        console.log("Calling refreshFeed...");
        await window.refreshFeed();
      }
      
      onBack();
    } catch (error) {
      console.error("Upload error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Check if it's a subscription error
      if (error.error === 'Subscription required' || error.message?.includes('subscribe')) {
        setShowSubscriptionModal(true);
        return;
      }
      
      const errorMessage = typeof error === 'string' ? JSON.parse(error).error : error.message || 'Failed to upload post. Please try again.';
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadOptions = [
    {
      id: "camera-input",
      label: "Take Photo/Video",
      sub: "Use camera with filters",
      accept: "image/*,video/*",
      capture: "environment",
      gradient: "linear-gradient(135deg, #a855f7, #7c3aed)",
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
          <path d="M23 7l-7 5 7 5V7z" fill="#fff"/>
          <rect x="1" y="5" width="15" height="14" rx="2" fill="#fff"/>
        </svg>
      ),
    },
    {
      id: "image-input",
      label: "Upload Image",
      sub: "From gallery or files",
      accept: "image/*",
      capture: undefined,
      gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="#fff" fillOpacity="0.25"/>
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#fff" strokeWidth="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="#fff"/>
          <path d="M21 15l-5-5L5 21" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: "video-input",
      label: "Upload Video",
      sub: "Short or long form",
      accept: "video/*",
      capture: undefined,
      gradient: "linear-gradient(135deg, #ec4899, #ef4444)",
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
          <rect x="2" y="5" width="15" height="14" rx="2" fill="#fff" fillOpacity="0.25"/>
          <rect x="2" y="5" width="15" height="14" rx="2" stroke="#fff" strokeWidth="2"/>
          <path d="M22 8l-5 4 5 4V8z" fill="#fff"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "#EEEEFF",
      zIndex: 4000,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          background: "none",
          border: "none",
          fontSize: 22,
          cursor: "pointer",
          color: "#5b21b6",
          padding: 8,
          zIndex: 10,
          lineHeight: 1,
        }}
      >
        ←
      </button>

      {!selectedFile ? (
        /* ── Selection screen ── */
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "70px 24px 40px",
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
        }}>
          {/* Camera hero icon */}
          <div style={{ position: "relative", marginBottom: 20 }}>
            <div style={{
              width: 84,
              height: 84,
              background: "linear-gradient(135deg, #c026d3, #7c3aed)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
            }}>
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
                <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" fill="#fff"/>
                <path d="M9 3L7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9z" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Star badge */}
            <div style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 26,
              height: 26,
              background: "#facc15",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              border: "2px solid #EEEEFF",
            }}>
              ⭐
            </div>
          </div>

          {/* Title */}
          <div style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", marginBottom: 8, letterSpacing: -0.3 }}>
            Create Post
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 36, textAlign: "center" }}>
            Choose how you want to create content
          </div>

          {/* Option cards */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
            {uploadOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => document.getElementById(opt.id).click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: "#fff",
                  borderRadius: 16,
                  padding: "16px 20px",
                  cursor: "pointer",
                  border: "1.5px solid #e0e4ff",
                  boxShadow: "0 2px 12px rgba(99,102,241,0.07)",
                  transition: "box-shadow 0.2s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.18)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(99,102,241,0.07)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: opt.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}>
                  {opt.icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>
                    {opt.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Hidden file inputs */}
          {uploadOptions.map((opt) => (
            <input
              key={opt.id}
              id={opt.id}
              type="file"
              accept={opt.accept}
              {...(opt.capture ? { capture: opt.capture } : {})}
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          ))}
        </div>
      ) : (
        /* ── Form screen (after file selected) ── */
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #e0e4ff",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            <div style={{ width: 40 }} />
            <div style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
              New Post
            </div>
            <button
              onClick={handlePost}
              disabled={isUploading}
              style={{
                padding: "9px 22px",
                background: !isUploading ? "linear-gradient(135deg, #a855f7, #7c3aed)" : "#e5e7eb",
                border: "none",
                borderRadius: 10,
                color: !isUploading ? "#fff" : "#9ca3af",
                fontSize: 14,
                fontWeight: 700,
                cursor: !isUploading ? "pointer" : "not-allowed",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => { if (!isUploading) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { if (!isUploading) e.currentTarget.style.opacity = "1"; }}
            >
              {isUploading ? "Posting..." : "Share"}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px", maxWidth: 600, margin: "0 auto", width: "100%" }}>
            {/* Preview */}
            <div style={{
              width: "100%",
              aspectRatio: "1/1",
              background: "#f3f4f6",
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 20,
              position: "relative",
              border: "2px solid #e0e4ff",
            }}>
              <img
                src={preview}
                alt="Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                onClick={() => { setSelectedFile(null); setPreview(null); }}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "rgba(0,0,0,0.65)",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  color: "#fff",
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Caption */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6", display: "block", marginBottom: 8 }}>Caption</label>
              <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 90,
                  padding: "13px 14px",
                  border: "1.5px solid #e0e4ff",
                  borderRadius: 12,
                  fontSize: 14,
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  background: "#fff",
                  color: "#1a1a2e",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#a855f7"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e0e4ff"}
              />
            </div>

            {/* Hashtags */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6", display: "block", marginBottom: 8 }}>Hashtags</label>
              <input
                type="text"
                placeholder="#fashion, #style, #trending"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  border: "1.5px solid #e0e4ff",
                  borderRadius: 12,
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  background: "#fff",
                  color: "#1a1a2e",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#a855f7"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e0e4ff"}
              />
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 5 }}>Separate with commas</div>
            </div>

            {/* Post Settings */}
            <div style={{ padding: "16px 20px", background: "#fff", borderRadius: 16, border: "1.5px solid #e0e4ff" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#a855f7", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.6 }}>Post Settings</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Allow comments"], ["Allow duets"], ["Allow stitches"]].map(([label]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: "#1a1a2e" }}>{label}</span>
                    <input type="checkbox" defaultChecked style={{ cursor: "pointer", width: 18, height: 18, accentColor: "#7c3aed" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5000,
        }}>
          <div style={{
            background: T.cardBg,
            borderRadius: 16,
            padding: 32,
            maxWidth: 500,
            width: "90%",
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.txt, marginBottom: 12, textAlign: "center" }}>🔒 Subscription Required</div>
            <div style={{ fontSize: 14, color: T.sub, marginBottom: 24, textAlign: "center", lineHeight: 1.6 }}>
              To upload videos and images, you need to subscribe to our Pro or Premium plan.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <div style={{
                padding: 20,
                background: T.bg,
                borderRadius: 12,
                border: `2px solid ${T.border}`,
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 4 }}>⭐ Pro Plan</div>
                <div style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>Upload unlimited videos & images</div>
                <button
                  onClick={async () => {
                    try {
                      await api.upgradeToProPlan();
                      alert("Successfully upgraded to Pro!");
                      setShowSubscriptionModal(false);
                    } catch (e) {
                      alert("Failed to upgrade: " + e.message);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: T.pri,
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  Upgrade to Pro
                </button>
              </div>
              <div style={{
                padding: 20,
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                borderRadius: 12,
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#000", marginBottom: 4 }}>💎 Premium Plan</div>
                <div style={{ fontSize: 13, color: "#333", marginBottom: 16 }}>All Pro features + priority support</div>
                <button
                  onClick={async () => {
                    try {
                      await api.upgradeToPremiumPlan();
                      alert("Successfully upgraded to Premium!");
                      setShowSubscriptionModal(false);
                    } catch (e) {
                      alert("Failed to upgrade: " + e.message);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "#000",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowSubscriptionModal(false)}
              style={{
                width: "100%",
                padding: 12,
                background: "transparent",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                color: T.txt,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = T.bg}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
