import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

export default function Sidebar({ pendingCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(UserContext);

  const getCurrentPath = () => {
    const path = location.pathname.toLowerCase();
    if (path === "/dashboard" || path === "/") return "dashboard";
    if (path === "/employees") return "employees";
    if (path === "/attendance") return "attendance";
    if (path === "/leave") return "leave";
    if (path === "/reports" || path === "/hr-dashboard") return "reports";
    if (path === "/settings") return "settings";
    if (path === "/escalation") return "escalation";
    if (path === "/my-escalations") return "my-escalations";
    return "dashboard";
  };

  const activeNav = getCurrentPath();
  const isHR = user?.role === "HR" || user?.role === "MD";
  const canAccessEscalation = user?.role === "TL" || user?.role === "HR" || user?.role === "MD" || user?.role === "MANAGER";

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", path: "/dashboard" },
    { id: "employees", label: "Employees", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", path: "/employees" },
    { id: "attendance", label: "Attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", path: "/attendance" },
    { id: "leave", label: "Leave", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", path: "/leave" },
    ...(isHR ? [{ id: "reports", label: "Reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", path: "/reports" }] : []),
    ...(canAccessEscalation ? [{ id: "escalation", label: "Escalation", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", path: "/escalation" }] : []),
    ...(user?.role === "EMPLOYEE" ? [{ id: "my-escalations", label: "My Escalations", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", path: "/my-escalations" }] : []),
    { id: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", path: "/settings" },
  ];

  const NavIcon = ({ path }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
      style={{ width: 20, height: 20 }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
    </svg>
  );

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: 240,
        background: "#09090B",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
      }}
    >
      {/* Logo Section */}
      <div style={{ 
        padding: "24px", 
        display: "flex", 
        alignItems: "center", 
        gap: 12, 
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)" 
      }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg, #00A1C7, #00FFAA)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 800,
            color: "#000",
            boxShadow: "0 0 20px rgba(0, 161, 199, 0.4)"
          }}
        >
          P
        </div>
        <div>
          <div style={{ 
            fontSize: 16, 
            fontWeight: 700, 
            background: "linear-gradient(135deg, #00A1C7, #00FFAA)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "'Rubik', sans-serif"
          }}>
            Profitcast
          </div>
          <div style={{ fontSize: 11, color: "#52525B", marginTop: 2 }}>HR Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            data-testid={`nav-${item.id}`}
            onClick={() => navigate(item.path)}
            style={{
              width: "100%",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: activeNav === item.id 
                ? "linear-gradient(90deg, rgba(0, 161, 199, 0.15) 0%, rgba(0, 255, 170, 0.1) 100%)" 
                : "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: activeNav === item.id ? 600 : 400,
              color: activeNav === item.id ? "#00FFAA" : "#A1A1AA",
              transition: "all 0.2s ease",
              borderRadius: 12,
              marginBottom: 4,
              borderLeft: activeNav === item.id ? "3px solid #00FFAA" : "3px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (activeNav !== item.id) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "#FAFAFA";
              }
            }}
            onMouseLeave={(e) => {
              if (activeNav !== item.id) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#A1A1AA";
              }
            }}
          >
            <NavIcon path={item.icon} />
            <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
            {item.id === "reports" && pendingCount > 0 && (
              <div
                style={{
                  background: "linear-gradient(135deg, #FF6826, #ef4444)",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {pendingCount}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", padding: "16px" }}>
        <div style={{ 
          background: "#18181B", 
          borderRadius: 12, 
          padding: "14px",
          marginBottom: 12,
          border: "1px solid rgba(255, 255, 255, 0.05)"
        }}>
          <div style={{ fontSize: 11, color: "#52525B", marginBottom: 4 }}>Logged in as</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#FAFAFA", marginBottom: 2 }}>{user?.email}</div>
          <div style={{ 
            fontSize: 10, 
            color: "#00A1C7",
            fontWeight: 500 
          }}>
            {user?.role === "MD" && "Managing Director"}
            {user?.role === "HR" && "HR Manager"}
            {user?.role === "MANAGER" && "Manager"}
            {user?.role === "TL" && "Team Lead"}
            {user?.role === "EMPLOYEE" && "Employee"}
          </div>
        </div>
        <button
          data-testid="logout-btn"
          onClick={logout}
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#ef4444",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}
