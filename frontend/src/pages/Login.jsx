import { useState, useContext } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { login } = useContext(UserContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Email and password are required");
        return;
      }

      const res = await api.post("/auth/login", { email, password });
      
      if (res.data.token && res.data.user) {
        login(res.data.user, res.data.token);
        nav("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Floating particles background */}
      <div style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none"
      }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 200 + i * 50,
              height: 200 + i * 50,
              borderRadius: "50%",
              background: i % 2 === 0 
                ? "radial-gradient(circle, rgba(0,161,199,0.1) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(0,255,170,0.08) 0%, transparent 70%)",
              left: `${(i * 20) % 100}%`,
              top: `${(i * 15) % 100}%`,
              animation: `float ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      <form onSubmit={handleLogin} className="login-form" data-testid="login-form">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
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
          <p style={{ color: "#52525B", fontSize: 14 }}>Sign in to your account</p>
        </div>
        
        {error && <div className="error-message" data-testid="login-error">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            data-testid="email-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            data-testid="password-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Link 
            to="/forgot-password" 
            style={{ 
              fontSize: "12px", 
              color: "#00A1C7", 
              textDecoration: "none", 
              marginTop: "8px", 
              display: "block",
              fontWeight: 500
            }}
          >
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={loading} data-testid="login-submit">
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(0,0,0,0.2)",
                borderTopColor: "#000",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                display: "inline-block"
              }} />
              Signing in...
            </span>
          ) : "Sign In"}
        </button>

        <div style={{ 
          textAlign: "center", 
          marginTop: "24px", 
          paddingTop: "24px", 
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          fontSize: "14px", 
          color: "#A1A1AA" 
        }}>
          Don't have an account?{" "}
          <Link 
            to="/register" 
            style={{ 
              color: "#00FFAA", 
              textDecoration: "none", 
              fontWeight: "600" 
            }}
          >
            Sign up
          </Link>
        </div>
      </form>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(15px, -20px) scale(1.1); opacity: 0.5; }
          50% { transform: translate(25px, -35px) scale(1.2); opacity: 0.4; }
          75% { transform: translate(10px, -15px) scale(1.05); opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
