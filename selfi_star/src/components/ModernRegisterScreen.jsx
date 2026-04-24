import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Loader } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function ModernRegisterScreen({ onSuccess, onLogin, onBack }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const res = await api.register(
        formData.username,
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      
      api.setAuthToken(res.token);
      
      // Include ALL user data from backend response
      onSuccess({
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
      });
    } catch (e) {
      console.error('Registration error:', e);
      setError("Registration failed. Username or email may already exist.");
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
        top: -50,
        left: 24,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <img src="/ethio-logo.png" alt="Ethio Telecom" style={{ width: 150, height: 150, objectFit: "contain" }} onError={(e) => { console.error('Ethio logo failed to load'); e.target.style.display = 'none'; }} />
      </div>
      <div style={{
        position: "absolute",
        top: -50,
        right: 24,
        display: "flex",
        alignItems: "center",
      }}>
        <img src="/flip-logo.png" alt="FlipStar" style={{ width: 150, height: 150, objectFit: "contain" }} onError={(e) => { console.error('Flip logo failed to load'); e.target.style.display = 'none'; }} />
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
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: T.txt }}>
            Create Account
          </div>
          <div style={{ fontSize: 14, color: T.sub }}>
            Join FLIPSTAR today
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} style={{ padding: "32px" }}>
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

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
              Username *
            </label>
            <div style={{ position: "relative" }}>
              <User
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
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Choose a username"
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

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
              Email *
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
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="your@email.com"
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="First"
                style={{
                  width: "100%",
                  padding: "12px 16px",
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
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Last"
                style={{
                  width: "100%",
                  padding: "12px 16px",
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

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
              Password *
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
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Create a password"
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
            <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>
              At least 6 characters
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? T.sub : `linear-gradient(135deg, ${T.dark}, ${T.pri})`,
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
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <div style={{ textAlign: "center", fontSize: 13, color: T.sub }}>
            Already have an account?{" "}
            <button
              type="button"
              onClick={onLogin}
              style={{
                background: "none",
                border: "none",
                color: T.pri,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Log in
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
