import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    department: "",
    designation: "",
    dateOfJoining: "",
    role: "Employee",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.employeeId || !formData.email || !formData.password) {
      setError("Full Name, Employee ID, Email, and Password are required");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Invalid email format");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post("/auth/register", {
        fullName: formData.fullName,
        employeeId: formData.employeeId,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null,
        department: formData.department || null,
        designation: formData.designation || null,
        dateOfJoining: formData.dateOfJoining || null,
        role: formData.role,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
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
    boxSizing: "border-box",
    transition: "all 0.2s"
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#02040A",
        padding: "40px 20px",
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
          maxWidth: "500px",
          position: "relative",
          zIndex: 1
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <img 
            src="/logo.png" 
            alt="Workforce by Profitcast" 
            style={{ 
              height: 60, 
              width: "auto",
              objectFit: "contain",
              marginBottom: 16
            }} 
          />
          <h1 style={{ 
            fontSize: "24px", 
            fontWeight: "700", 
            marginBottom: "8px",
            color: "#FAFAFA",
            fontFamily: "'Rubik', sans-serif"
          }}>
            Create Account
          </h1>
          <p style={{ color: "#52525B", fontSize: "14px" }}>Join Workforce HR Platform</p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "20px",
              color: "#ef4444",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Full Name */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
              Full Name*
            </label>
            <input
              type="text"
              name="fullName"
              data-testid="register-fullname"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
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

          {/* Employee ID */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
              Employee ID*
            </label>
            <input
              type="text"
              name="employeeId"
              data-testid="register-employeeid"
              value={formData.employeeId}
              onChange={handleChange}
              placeholder="EMP001"
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

          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
              Email*
            </label>
            <input
              type="email"
              name="email"
              data-testid="register-email"
              value={formData.email}
              onChange={handleChange}
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

          {/* Password Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
                Password*
              </label>
              <input
                type="password"
                name="password"
                data-testid="register-password"
                value={formData.password}
                onChange={handleChange}
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
                Confirm Password*
              </label>
              <input
                type="password"
                name="confirmPassword"
                data-testid="register-confirm-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
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
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
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

          {/* Department & Role Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#00A1C7";
                  e.target.style.boxShadow = "0 0 0 4px rgba(0, 161, 199, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value="">Select Department</option>
                <option value="Creative">Creative</option>
                <option value="Content">Content</option>
                <option value="Performance">Performance</option>
                <option value="Client Services">Client Services</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#00A1C7";
                  e.target.style.boxShadow = "0 0 0 4px rgba(0, 161, 199, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="HR">HR</option>
                <option value="MD">MD</option>
              </select>
            </div>
          </div>

          {/* Designation */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
              Designation
            </label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g., Senior Developer"
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

          {/* Date of Joining */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A1A1AA", marginBottom: "8px" }}>
              Date of Joining
            </label>
            <input
              type="date"
              name="dateOfJoining"
              value={formData.dateOfJoining}
              onChange={handleChange}
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

          {/* Submit Button */}
          <button
            type="submit"
            data-testid="register-submit"
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
              transition: "all 0.2s ease",
              boxShadow: loading ? "none" : "0 0 30px rgba(0, 161, 199, 0.4)"
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "24px 0",
            gap: "12px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }} />
          <span style={{ color: "#52525B", fontSize: "12px" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }} />
        </div>

        {/* Login Link */}
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#A1A1AA", fontSize: "14px" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#00FFAA",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
