import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Camera, Save } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function EditProfilePage({ user, onBack, onSave }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    bio: user?.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profile_photo || null);
  const fileInputRef = useRef(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Photo must be less than 5MB");
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      if (formData.username) formDataToSend.append('username', formData.username);
      if (formData.email) formDataToSend.append('email', formData.email);
      if (formData.firstName) formDataToSend.append('first_name', formData.firstName);
      if (formData.lastName) formDataToSend.append('last_name', formData.lastName);
      if (formData.bio) formDataToSend.append('bio', formData.bio);
      if (profilePhoto) formDataToSend.append('profile_photo', profilePhoto);
      
      const response = await fetch(`http://localhost:8000/api/profile/update_profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
        },
        body: formDataToSend,
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const data = await response.json();
      
      // Update localStorage with new user data
      // Ensure profile_photo has full URL
      let profilePhotoUrl = data.profile_photo;
      if (profilePhotoUrl && !profilePhotoUrl.startsWith('http')) {
        profilePhotoUrl = `http://localhost:8000${profilePhotoUrl}`;
      }
      
      const updatedUser = { 
        ...user, 
        first_name: data.first_name,
        last_name: data.last_name,
        bio: data.bio,
        profile_photo: profilePhotoUrl,
        username: data.username,
        email: data.email,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      onSave?.(updatedUser);
      onBack();
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
        <div style={{ flex: 1, fontSize: 18, fontWeight: 700, color: T.txt }}>
          Edit Profile
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: T.pri,
            border: "none",
            borderRadius: 8,
            padding: "8px 20px",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "20px", maxWidth: 600, margin: "0 auto" }}>
        {/* Profile Photo */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile"
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `3px solid ${T.pri}`,
                }}
              />
            ) : (
              <div style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: T.pri + "30",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
              }}>
                👤
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: T.pri,
                border: "2px solid #fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#fff",
              }}
            >
              <Camera size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              style={{ display: "none" }}
            />
          </div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>
            Click camera icon to change photo
          </div>
        </div>

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 6 }}>
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value)}
              placeholder="Enter your username"
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
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Enter your email"
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
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 6 }}>
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder="Enter your first name"
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
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 6 }}>
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder="Enter your last name"
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
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 6 }}>
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={150}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                transition: "border 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = T.pri}
              onBlur={(e) => e.target.style.borderColor = T.border}
            />
            <div style={{ fontSize: 11, color: T.sub, marginTop: 4, textAlign: "right" }}>
              {formData.bio.length}/150
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
