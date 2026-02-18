import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";

export default function TopBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useContext(UserContext);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 240,
        right: 0,
        height: 70,
        background: "#09090B",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingRight: 24,
        paddingLeft: 24,
        zIndex: 50,
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Left: Date and Time */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#FAFAFA", fontFamily: "'Rubik', sans-serif" }}>
          {formatDate(currentTime)}
        </div>
        <div style={{ 
          fontSize: 13, 
          color: "#00A1C7", 
          marginTop: 2,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500
        }}>
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Right: User info and notifications */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Notification bell */}
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            color: "#A1A1AA"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.borderColor = "rgba(0, 161, 199, 0.5)";
            e.currentTarget.style.color = "#00A1C7";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.color = "#A1A1AA";
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 20, height: 20 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* User avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #00A1C7, #00FFAA)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {user?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FAFAFA" }}>
              {user?.fullName || "User"}
            </div>
            <div style={{ fontSize: 11, color: "#52525B" }}>
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
