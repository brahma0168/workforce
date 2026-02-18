import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import api from "../api/axios";

export default function Layout({ children }) {
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      const res = await api.get("/leave?status=pending");
      setPendingCount(res.data?.length || 0);
    } catch (err) {
      console.log("Could not fetch pending count");
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, []);

  return (
    <div style={{ 
      display: "flex", 
      height: "100vh", 
      background: "#02040A",
      position: "relative"
    }}>
      {/* Background gradient effects */}
      <div 
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(ellipse at top left, rgba(0,161,199,0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(0,255,170,0.05) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />
      
      {/* Grid pattern overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: 0.03,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
          zIndex: 0
        }}
      />
      
      <Sidebar pendingCount={pendingCount} />
      <div style={{ 
        marginLeft: 240, 
        display: "flex", 
        flexDirection: "column", 
        flex: 1,
        position: "relative",
        zIndex: 1
      }}>
        <TopBar onCheckIn={fetchPendingCount} />
        <main
          style={{
            marginTop: 70,
            flex: 1,
            overflowY: "auto",
            padding: "24px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
