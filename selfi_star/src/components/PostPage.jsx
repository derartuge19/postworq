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

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: T.bg,
      zIndex: 4000,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 20px",
        borderBottom: `1px solid ${T.border}`,
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            marginRight: 16,
            color: "#1a1a1a",
            padding: 8,
          }}
        >
          ←
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>
          Create Post
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={handlePost}
          disabled={!selectedFile || isUploading}
          style={{
            padding: "10px 24px",
            background: selectedFile && !isUploading ? T.pri : "#f0f0f0",
            border: selectedFile && !isUploading ? "none" : "1px solid #d0d0d0",
            borderRadius: 8,
            color: selectedFile && !isUploading ? "#fff" : "#666",
            fontSize: 14,
            fontWeight: 600,
            cursor: selectedFile && !isUploading ? "pointer" : "not-allowed",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => {
            if (selectedFile && !isUploading) e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            if (selectedFile && !isUploading) e.currentTarget.style.opacity = "1";
          }}
        >
          {isUploading ? "Posting..." : "Post"}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", maxWidth: 600, margin: "0 auto", width: "100%" }}>
        {/* Media Upload Area */}
        <div style={{
          width: "100%",
          aspectRatio: "9/16",
          background: T.cardBg,
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          border: `2px dashed ${T.border}`,
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}
        onClick={() => document.getElementById('file-input').click()}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = T.pri}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setPreview(null);
                }}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "rgba(0,0,0,0.6)",
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
            </>
          ) : (
            <div style={{
              textAlign: "center",
              color: T.sub,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📹</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.txt, marginBottom: 4 }}>Tap to upload</div>
              <div style={{ fontSize: 13 }}>Video or image</div>
            </div>
          )}
        </div>

        <input
          id="file-input"
          type="file"
          accept="video/*,image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {/* Caption Input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: T.sub, display: "block", marginBottom: 8 }}>Caption</label>
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{
              width: "100%",
              minHeight: 100,
              padding: "14px",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              fontSize: 14,
              resize: "vertical",
              outline: "none",
              fontFamily: "inherit",
              background: T.cardBg,
              color: T.txt,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = T.pri}
            onBlur={(e) => e.currentTarget.style.borderColor = T.border}
          />
        </div>

        {/* Hashtags Input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: T.sub, display: "block", marginBottom: 8 }}>Hashtags</label>
          <input
            type="text"
            placeholder="#fashion, #style, #trending"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
              fontFamily: "inherit",
              background: T.cardBg,
              color: T.txt,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = T.pri}
            onBlur={(e) => e.currentTarget.style.borderColor = T.border}
          />
          <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>Separate with commas</div>
        </div>

        {/* Post Options */}
        <div style={{
          padding: 16,
          background: T.cardBg,
          borderRadius: 12,
          border: `1px solid ${T.border}`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.sub, marginBottom: 16, textTransform: "uppercase" }}>Post Settings</div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 14, color: T.txt }}>Allow comments</span>
              <input type="checkbox" defaultChecked style={{ cursor: "pointer", width: 18, height: 18 }} />
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 14, color: T.txt }}>Allow duets</span>
              <input type="checkbox" defaultChecked style={{ cursor: "pointer", width: 18, height: 18 }} />
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 14, color: T.txt }}>Allow stitches</span>
              <input type="checkbox" defaultChecked style={{ cursor: "pointer", width: 18, height: 18 }} />
            </div>
          </div>
        </div>
      </div>

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
