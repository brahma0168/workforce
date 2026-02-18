import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import api from "../api/axios";

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useContext(UserContext);
  const [profileData, setProfileData] = useState({
    fullName: user?.name || user?.fullName || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await api.patch(`/employees/${user?.id}`, profileData);
      const updatedUser = response.data.employee;
      
      if (updatedUser) {
        updateUser(updatedUser);
        setProfileData({
          fullName: updatedUser.fullName || updatedUser.name || "",
          phone: updatedUser.phone || "",
          email: updatedUser.email || "",
        });
      }
      
      setMessageType("success");
      setMessage("Profile updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.error || err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessageType("error");
      setMessage("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMessageType("success");
      setMessage("Password updated successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.error || err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "#18181B",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#FAFAFA",
    outline: "none",
    transition: "all 0.2s"
  };

  return (
    <div data-testid="settings-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Notification */}
      {message && (
        <div
          className={`notification ${messageType}`}
          style={{
            position: "fixed",
            top: 90,
            right: 24,
            zIndex: 1000,
            animation: "slideIn 0.3s ease-out"
          }}
        >
          {messageType === 'success' ? '✓' : '✕'} {message}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          marginBottom: 8,
          fontFamily: "'Rubik', sans-serif",
          background: "linear-gradient(135deg, #FAFAFA, #A1A1AA)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Settings & Profile
        </h1>
        <p style={{ color: "#52525B", fontSize: 14 }}>Manage your account preferences and security</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Profile Information */}
        <div style={{ 
          background: "#09090B", 
          borderRadius: "16px", 
          border: "1px solid rgba(255, 255, 255, 0.1)",
          overflow: "hidden"
        }}>
          <div style={{ 
            padding: "16px 24px", 
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(0, 161, 199, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00A1C7"
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#FAFAFA", fontFamily: "'Rubik', sans-serif" }}>
              Profile Information
            </span>
          </div>
          <form onSubmit={handleUpdateProfile} style={{ padding: "24px" }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A1A1AA", marginBottom: 8 }}>
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                data-testid="settings-fullname"
                value={profileData.fullName}
                onChange={handleProfileChange}
                style={inputStyle}
                placeholder="Enter your full name"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A1A1AA", marginBottom: 8 }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                disabled
                style={{ ...inputStyle, background: "#09090B", cursor: "not-allowed", opacity: 0.6 }}
              />
              <small style={{ color: "#52525B", fontSize: 12, marginTop: 4, display: "block" }}>
                Email cannot be changed
              </small>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A1A1AA", marginBottom: 8 }}>
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                data-testid="settings-phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                style={inputStyle}
                placeholder="Enter your phone number"
              />
            </div>

            <button 
              type="submit" 
              data-testid="save-profile-btn"
              disabled={loading} 
              style={{
                width: "100%",
                padding: "14px",
                background: loading ? "#18181B" : "linear-gradient(135deg, #00A1C7, #00FFAA)",
                border: "none",
                borderRadius: "12px",
                color: loading ? "#52525B" : "#000",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 0 20px rgba(0, 161, 199, 0.3)"
              }}
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div style={{ 
          background: "#09090B", 
          borderRadius: "16px", 
          border: "1px solid rgba(255, 255, 255, 0.1)",
          overflow: "hidden"
        }}>
          <div style={{ 
            padding: "16px 24px", 
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255, 104, 38, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FF6826"
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#FAFAFA", fontFamily: "'Rubik', sans-serif" }}>
              Change Password
            </span>
          </div>
          <form onSubmit={handleUpdatePassword} style={{ padding: "24px" }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A1A1AA", marginBottom: 8 }}>
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                data-testid="current-password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                style={inputStyle}
                placeholder="Enter your current password"
                required
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A1A1AA", marginBottom: 8 }}>
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                data-testid="new-password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                style={inputStyle}
                placeholder="Enter new password (min. 6 characters)"
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A1A1AA", marginBottom: 8 }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                data-testid="confirm-password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                style={inputStyle}
                placeholder="Re-enter your new password"
                required
              />
            </div>

            <button 
              type="submit" 
              data-testid="update-password-btn"
              disabled={loading} 
              style={{
                width: "100%",
                padding: "14px",
                background: loading ? "#18181B" : "rgba(255, 104, 38, 0.15)",
                border: loading ? "none" : "1px solid rgba(255, 104, 38, 0.3)",
                borderRadius: "12px",
                color: loading ? "#52525B" : "#FF6826",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      {/* Account Info */}
      <div style={{ 
        background: "#09090B", 
        borderRadius: "16px", 
        border: "1px solid rgba(255, 255, 255, 0.1)",
        marginTop: "24px",
        overflow: "hidden"
      }}>
        <div style={{ 
          padding: "16px 24px", 
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          fontFamily: "'Rubik', sans-serif",
          fontSize: 16,
          fontWeight: 600,
          color: "#FAFAFA"
        }}>
          Account Information
        </div>
        <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          {[
            { label: "Full Name", value: user?.fullName, color: "#00A1C7" },
            { label: "Email", value: user?.email, color: "#00FFAA" },
            { label: "Role", value: user?.role === "MD" ? "Managing Director" : user?.role === "HR" ? "HR Manager" : user?.role === "MANAGER" ? "Manager" : "Employee", color: "#FF6826" }
          ].map(item => (
            <div key={item.label} style={{ 
              background: "#18181B", 
              padding: "20px", 
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.05)"
            }}>
              <div style={{ fontSize: 12, color: "#52525B", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {item.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
