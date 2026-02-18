import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "#18181B",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#FAFAFA",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s"
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setMessage("Recovery code sent to " + email);
      setStep("code");
      setLoading(false);
    }, 1500);
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!resetCode || resetCode.length < 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setStep("reset");
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Both password fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setStep("success");
      setLoading(false);
    }, 1500);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#02040A",
        padding: "20px",
        position: "relative",
      }}
    >
      {/* Background effects */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at top left, rgba(0,161,199,0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(0,255,170,0.1) 0%, transparent 50%)",
        pointerEvents: "none"
      }} />

      <div
        style={{
          background: "#09090B",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          padding: "40px",
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          zIndex: 1
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #00A1C7, #00FFAA)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              color: "#000",
              marginBottom: 16,
              boxShadow: "0 0 40px rgba(0, 161, 199, 0.4)"
            }}
          >
            P
          </div>
          <h1 style={{ 
            fontSize: "24px", 
            fontWeight: "700", 
            marginBottom: "8px",
            background: "linear-gradient(135deg, #00A1C7, #00FFAA)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "'Rubik', sans-serif"
          }}>
            {step === "email" && "Forgot Password?"}
            {step === "code" && "Enter Recovery Code"}
            {step === "reset" && "Create New Password"}
            {step === "success" && "Password Reset"}
          </h1>
          <p style={{ color: "#52525B", fontSize: "14px" }}>
            {step === "email" && "Enter your email to receive a recovery code"}
            {step === "code" && "Check your email for the 6-digit code"}
            {step === "reset" && "Enter your new password below"}
            {step === "success" && "Your password has been successfully reset"}
          </p>
        </div>

        {/* Success State */}
        {step === "success" && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: "rgba(0, 255, 170, 0.15)",
                border: "1px solid rgba(0, 255, 170, 0.3)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                margin: "0 auto 20px",
                color: "#00FFAA"
              }}
            >
              ✓
            </div>
            <p style={{ color: "#00FFAA", fontWeight: "600", marginBottom: "24px" }}>
              Your password has been reset successfully!
            </p>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                background: "linear-gradient(135deg, #00A1C7, #00FFAA)",
                color: "#000",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "14px",
                boxShadow: "0 0 30px rgba(0, 161, 199, 0.4)"
              }}
            >
              Back to Login
            </Link>
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "12px",
                padding: "12px 16px",
                color: "#ef4444",
                fontSize: "13px",
              }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{
                background: "rgba(0, 255, 170, 0.1)",
                border: "1px solid rgba(0, 255, 170, 0.3)",
                borderRadius: "12px",
                padding: "12px 16px",
                color: "#00FFAA",
                fontSize: "13px",
              }}>
                {message}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "#00A1C7";
                  e.target.style.boxShadow = "0 0 0 4px rgba(0, 161, 199, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "14px 16px",
                background: loading ? "#18181B" : "linear-gradient(135deg, #00A1C7, #00FFAA)",
                color: loading ? "#52525B" : "#000",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "8px",
                boxShadow: loading ? "none" : "0 0 30px rgba(0, 161, 199, 0.4)"
              }}
            >
              {loading ? "Sending Code..." : "Send Recovery Code"}
            </button>
          </form>
        )}

        {/* Step 2: Code */}
        {step === "code" && (
          <form onSubmit={handleCodeSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "12px",
                padding: "12px 16px",
                color: "#ef4444",
                fontSize: "13px",
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
                Recovery Code
              </label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                placeholder="E.g., ABC123"
                maxLength="6"
                style={{
                  ...inputStyle,
                  textAlign: "center",
                  letterSpacing: "4px",
                  fontSize: "18px",
                  fontWeight: "600",
                  fontFamily: "'JetBrains Mono', monospace"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#00A1C7";
                  e.target.style.boxShadow = "0 0 0 4px rgba(0, 161, 199, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: "14px 16px",
                background: "linear-gradient(135deg, #00A1C7, #00FFAA)",
                color: "#000",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                marginTop: "8px",
                boxShadow: "0 0 30px rgba(0, 161, 199, 0.4)"
              }}
            >
              Verify Code
            </button>

            <button
              type="button"
              onClick={() => setStep("email")}
              style={{
                padding: "14px 16px",
                background: "transparent",
                color: "#00A1C7",
                border: "1px solid rgba(0, 161, 199, 0.3)",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Use Different Email
            </button>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === "reset" && (
          <form onSubmit={handlePasswordReset} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "12px",
                padding: "12px 16px",
                color: "#ef4444",
                fontSize: "13px",
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "#00A1C7";
                  e.target.style.boxShadow = "0 0 0 4px rgba(0, 161, 199, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "#00A1C7";
                  e.target.style.boxShadow = "0 0 0 4px rgba(0, 161, 199, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "14px 16px",
                background: loading ? "#18181B" : "linear-gradient(135deg, #00A1C7, #00FFAA)",
                color: loading ? "#52525B" : "#000",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "8px",
                boxShadow: loading ? "none" : "0 0 30px rgba(0, 161, 199, 0.4)"
              }}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Footer Links */}
        {step !== "success" && (
          <div style={{ textAlign: "center", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <Link
              to="/login"
              style={{
                color: "#00FFAA",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
