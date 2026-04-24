import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader, Home, Search, Compass, Film, MessageCircle, Bell, Bookmark, Settings } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function ModernLoginScreen({ onSuccess, onRegister, onBack }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e?.preventDefault();
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const username = email.includes("@") ? email.split("@")[0] : email;
      console.log('🔐 Attempting login for username:', username);
      const res = await api.login(username, password);
      
      console.log('✅ Login successful:', {
        userId: res.user.id,
        username: res.user.username,
        token: res.token ? res.token.substring(0, 10) + '...' : 'NONE'
      });
      
      api.setAuthToken(res.token);
      console.log('🔑 Token set via api.setAuthToken');
      
      // Include ALL user data from backend response (profile_photo, bio, etc.)
      const userData = {
        id: res.user.id,
        username: res.user.username,
        email: res.user.email,
        first_name: res.user.first_name || "",
        last_name: res.user.last_name || "",
        name: res.user.first_name || res.user.username,
        profile_photo: res.user.profile_photo || null,
        bio: res.user.bio || "",
        followers_count: res.user.followers_count || 0,
        following_count: res.user.following_count || 0,
        is_staff: res.user.is_staff || false,
      };
      
      console.log('👤 Calling onSuccess with user data:', userData);
      onSuccess(userData);
    } catch (e) {
      console.error('❌ Login error:', e);
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      position: "relative",
    }}>
      {/* Logos - Top Left and Right */}
      <div style={{
        position: "absolute",
        top: 20,
        left: 24,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <img src="/ethio-logo.png" alt="Ethio Telecom" style={{ width: 32, height: 32, objectFit: "contain" }} />
      </div>
      <div style={{
        position: "absolute",
        top: 20,
        right: 24,
        display: "flex",
        alignItems: "center",
      }}>
        <img src="/flip-logo.png" alt="FlipStar" style={{ width: 32, height: 32, objectFit: "contain" }} />
      </div>

      <div style={{
        width: "100%",
        maxWidth: 440,
      }}>
        {/* Header */}
        <div style={{
          padding: "40px 32px",
          textAlign: "center",
          marginBottom: 20,
        }}>
          <img src="/logo.jpeg" alt="flipstar" style={{ width: 100, height: 100, objectFit: "contain", margin: "0 auto 16px" }} />
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: T.txt }}>
            Welcome Back!
          </div>
          <div style={{ fontSize: 14, color: T.sub }}>
            Log in to continue to flipstar
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ padding: "0 32px" }}>
          {error && (
            <div style={{
              padding: "12px 16px",
              background: "#FEE2E2",
              border: "1px solid #EF4444",
              borderRadius: 8,
              color: "#EF4444",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
              Email or Username
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={18}
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: T.sub,
                }}
              />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or username"
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 44px",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  transition: "border 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = T.pri}
                onBlur={(e) => e.target.style.borderColor = T.border}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: T.sub,
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  padding: "12px 44px 12px 44px",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  transition: "border 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = T.pri}
                onBlur={(e) => e.target.style.borderColor = T.border}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  color: T.sub,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: "right", marginBottom: 24 }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: T.pri,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? T.sub : `linear-gradient(135deg, ${T.pri}, ${T.dark})`,
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {loading ? (
              <>
                <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </button>

          <div style={{ textAlign: "center", fontSize: 13, color: T.sub }}>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onRegister}
              style={{
                background: "none",
                border: "none",
                color: T.pri,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Sign up free
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
