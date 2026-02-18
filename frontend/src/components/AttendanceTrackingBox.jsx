import { useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { UserContext } from "../context/UserContext";

export default function AttendanceTrackingBox() {
  const { user } = useContext(UserContext);
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
    }
  }, [user?.id]);

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
      }
      await fetchTodayAttendance();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Check-out failed");
    } finally {
      setCheckInLoading(false);
    }
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

  const checkedInToday = todayRecord?.checkIn;
  const checkedOutToday = todayRecord?.checkOut;
  const onBreak = todayRecord?.breakStartTime && !todayRecord?.breakEndTime;
  const isCurrentlyWorking = checkedInToday && !checkedOutToday && !onBreak;

  return (
    <div style={{
      background: '#09090B',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '16px', 
        fontWeight: '600', 
        color: '#FAFAFA',
        fontFamily: "'Rubik', sans-serif"
      }}>
        Attendance Tracking
      </h3>

      {/* Time Stats */}
      {todayRecord?.checkIn && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            background: 'rgba(0, 255, 170, 0.1)',
            border: '1px solid rgba(0, 255, 170, 0.2)',
            borderRadius: '12px',
            padding: '14px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#00FFAA', fontFamily: "'JetBrains Mono', monospace" }}>
              {formatMinutes(Math.round((todayRecord.totalWorkHours || 0) * 60))}
            </div>
            <div style={{ fontSize: 11, color: '#52525B', marginTop: '4px' }}>Working</div>
          </div>
          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            borderRadius: '12px',
            padding: '14px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#eab308', fontFamily: "'JetBrains Mono', monospace" }}>
              {formatMinutes(todayRecord.totalBreakMinutes || todayRecord.breakMinutes || 0)}
            </div>
            <div style={{ fontSize: 11, color: '#52525B', marginTop: '4px' }}>Break</div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        data-testid="attendance-action-btn"
        onClick={checkedOutToday ? () => showNotification("Already checked out") : 
               onBreak ? handleCheckOut : 
               isCurrentlyWorking ? handleCheckOut : 
               handleCheckIn}
        disabled={checkInLoading || checkedOutToday}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          border: 'none',
          cursor: checkInLoading || checkedOutToday ? 'not-allowed' : 'pointer',
          background: checkedOutToday ? '#18181B' : 
                     onBreak ? 'rgba(0, 255, 170, 0.15)' : 
                     isCurrentlyWorking ? 'rgba(255, 104, 38, 0.15)' : 
                     'linear-gradient(135deg, #00A1C7, #00FFAA)',
          color: checkedOutToday ? '#52525B' : 
                 onBreak ? '#00FFAA' : 
                 isCurrentlyWorking ? '#FF6826' : '#000',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.2s ease',
          opacity: checkInLoading || checkedOutToday ? 0.7 : 1,
          boxShadow: checkedOutToday || onBreak || isCurrentlyWorking ? 'none' : '0 0 20px rgba(0, 161, 199, 0.3)'
        }}
      >
        {checkInLoading ? "Processing..." : 
         checkedOutToday ? "✓ Day Complete" : 
         onBreak ? "▶ Resume Work" : 
         isCurrentlyWorking ? "⏸ Take Break / Check Out" : 
         "▶ Check In"}
      </button>

      {/* Status Info */}
      {todayRecord?.checkIn && (
        <div style={{
          background: '#18181B',
          borderRadius: '10px',
          padding: '12px',
          textAlign: 'center',
          marginTop: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ fontSize: 12, color: '#00FFAA' }}>
            ✓ Since {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          {onBreak && (
            <div style={{ fontSize: 11, color: '#eab308', marginTop: '4px' }}>
              ⏸ On Break
            </div>
          )}
        </div>
      )}

      {notification && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'rgba(0, 255, 170, 0.1)',
          color: '#00FFAA',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: '500',
          border: '1px solid rgba(0, 255, 170, 0.3)',
          zIndex: 1000
        }}>
          {notification}
        </div>
      )}
    </div>
  );
}
