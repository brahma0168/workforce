import { useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { UserContext } from "../context/UserContext";

export default function Attendance() {
  const { user } = useContext(UserContext);
  const [records, setRecords] = useState([]);
  const [month, setMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notification, setNotification] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchTodayAttendance();
      fetchAttendance();
    }
  }, [month, user?.id]);

  const fetchTodayAttendance = async () => {
    try {
      const res = await api.get("/attendance/today");
      const sessions = Array.isArray(res.data) ? res.data : [res.data];
      const activeSession = sessions.find(session => 
        session.checkIn && !session.checkOut
      ) || sessions[sessions.length - 1];
      setTodayRecord(activeSession);
    } catch (err) {
      console.error("Error fetching today's attendance:", err);
      setTodayRecord(null);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get("/attendance/monthly", {
        params: {
          month: month.getMonth() + 1,
          year: month.getFullYear(),
        },
      });
      setRecords(res.data.attendances || res.data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const res = await api.post("/attendance/checkin");
      showNotification(`Checked in at ${new Date(res.data.attendance.checkIn).toLocaleTimeString()}`);
      await fetchTodayAttendance();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Check-in failed");
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckInLoading(true);
    try {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      
      if (todayRecord?.breakStartTime && !todayRecord?.breakEndTime) {
        await api.post("/attendance/checkout");
        showNotification(`Work resumed at ${currentTime.toLocaleTimeString()}`);
      } else if (todayRecord?.checkIn && !todayRecord?.checkOut) {
        let checkoutType = 'FINAL';
        
        if (currentHour >= 12 && currentHour <= 15) {
          checkoutType = 'BREAK';
          showNotification(`Lunch break started at ${currentTime.toLocaleTimeString()}`);
        } else {
          showNotification(`Checked out at ${currentTime.toLocaleTimeString()}`);
        }
        
        await api.post("/attendance/checkout", { 
          checkoutType,
          breakType: checkoutType === 'BREAK' ? 'LUNCH' : undefined
        });
      } else {
        showNotification('No active check-in session found');
      }
      
      await fetchTodayAttendance();
    } catch (err) {
      alert(err.response?.data?.message || "Check-out failed");
    } finally {
      setCheckInLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1));
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const formatMinutes = (mins) => {
    if (mins <= 0) return '0h 0m';
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present": return "#00FFAA";
      case "Late": return "#FF6826";
      case "Absent": return "#ef4444";
      default: return "#A1A1AA";
    }
  };

  return (
    <div data-testid="attendance-page" style={{ maxWidth: 1400 }}>
      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "rgba(0, 255, 170, 0.1)",
            color: "#00FFAA",
            padding: "14px 20px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 100,
            border: "1px solid rgba(0, 255, 170, 0.3)",
            animation: "slideIn 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00FFAA" }}></span>
          {notification}
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
          Attendance
        </h1>
        <p style={{ color: "#52525B", fontSize: 14 }}>Track your daily attendance and work hours</p>
      </div>

      {/* Attendance Log Table */}
      <div style={{ 
        background: "#09090B", 
        borderRadius: 16, 
        border: "1px solid rgba(255, 255, 255, 0.1)", 
        overflow: "hidden" 
      }}>
        <div style={{ 
          padding: "20px 24px", 
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              color: "#FAFAFA", 
              margin: 0, 
              marginBottom: 4,
              fontFamily: "'Rubik', sans-serif"
            }}>
              My Attendance Log
            </h2>
            <p style={{ fontSize: 12, color: "#52525B", margin: 0 }}>
              {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            background: "#18181B",
          }}
        >
          <button
            data-testid="prev-month-btn"
            onClick={handlePrevMonth}
            style={{
              padding: "8px 16px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.05)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "#FAFAFA",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.borderColor = "#00A1C7";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            }}
          >
            ← Prev
          </button>
          <span style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: "#00A1C7",
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            {month.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
          <button
            data-testid="next-month-btn"
            onClick={handleNextMonth}
            style={{
              padding: "8px 16px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.05)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "#FAFAFA",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.borderColor = "#00A1C7";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            }}
          >
            Next →
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div className="spinner"></div>
            <p style={{ color: "#52525B", marginTop: 16 }}>Loading attendance...</p>
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#52525B" }}>
            No attendance records for this month
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#18181B" }}>
                {["Date", "Check In", "Check Out", "Hours", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 24px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#52525B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const checkIn = record.checkIn ? new Date(record.checkIn) : null;
                const checkOut = record.checkOut ? new Date(record.checkOut) : null;

                return (
                  <tr
                    key={record.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA" }}>
                        {new Date(record.date || record.checkIn).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: 11, color: "#52525B", marginTop: 2 }}>
                        {new Date(record.date || record.checkIn).toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                    </td>
                    <td style={{ 
                      padding: "16px 24px", 
                      fontSize: 14, 
                      color: "#A1A1AA",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {checkIn ? checkIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td style={{ 
                      padding: "16px 24px", 
                      fontSize: 14, 
                      color: "#A1A1AA",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {checkOut ? checkOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 13 }}>
                      {checkIn && checkOut ? (
                        <div>
                          <div style={{ fontWeight: 600, color: "#00FFAA", fontFamily: "'JetBrains Mono', monospace" }}>
                            {formatMinutes(Math.round((record.totalWorkHours || 0) * 60))}
                          </div>
                          {(record.totalBreakMinutes > 0 || record.breakMinutes > 0) && (
                            <div style={{ fontSize: 11, color: "#eab308", marginTop: 2 }}>
                              Break: {formatMinutes(record.totalBreakMinutes || record.breakMinutes || 0)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#52525B" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "6px 12px",
                          borderRadius: 20,
                          background: `${getStatusColor(record.status)}15`,
                          color: getStatusColor(record.status),
                          border: `1px solid ${getStatusColor(record.status)}40`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span style={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: "50%", 
                          background: getStatusColor(record.status) 
                        }}></span>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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
