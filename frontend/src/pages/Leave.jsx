import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { UserContext } from "../context/UserContext";

export default function Leave() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approveRejectLoading, setApproveRejectLoading] = useState(null);
  const [notification, setNotification] = useState(null);
  const [commentData, setCommentData] = useState({});
  const [formData, setFormData] = useState({
    type: "CL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchLeaveData();
    }
  }, [user?.id]);

  const fetchLeaveData = async () => {
    try {
      const requests = [
        api.get("/leave/balance"),
        api.get("/leave/my"),
      ];

      if (user?.role === "HR" || user?.role === "MD") {
        requests.push(api.get("/leave?status=pending"));
      }

      const responses = await Promise.all(requests);
      setLeaveBalance(responses[0].data);
      setLeaveRequests(responses[1].data);
      
      if (responses[2]) {
        setPendingRequests(responses[2].data);
      }
    } catch (err) {
      console.error("Error fetching leave data:", err);
    }
  };

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      showNotification("Please select both start and end dates", "error");
      return;
    }
    setLoading(true);

    try {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      await api.post("/leave/apply", {
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days,
        reason: formData.reason,
      });
      showNotification("Leave request submitted successfully!", "success");
      setFormData({ type: "CL", startDate: "", endDate: "", reason: "" });
      setShowForm(false);
      await fetchLeaveData();
    } catch (err) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || "Failed to submit leave request",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setApproveRejectLoading(requestId);
    try {
      await api.patch(`/leave/${requestId}/approve`, {
        comment: commentData[requestId] || "",
      });
      showNotification("Leave request approved", "success");
      setCommentData((prev) => {
        const newData = { ...prev };
        delete newData[requestId];
        return newData;
      });
      await fetchLeaveData();
    } catch (err) {
      showNotification(err.response?.data?.error || "Failed to approve", "error");
    } finally {
      setApproveRejectLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    setApproveRejectLoading(requestId);
    try {
      await api.patch(`/leave/${requestId}/reject`, {
        comment: commentData[requestId] || "",
      });
      showNotification("Leave request rejected", "success");
      setCommentData((prev) => {
        const newData = { ...prev };
        delete newData[requestId];
        return newData;
      });
      await fetchLeaveData();
    } catch (err) {
      showNotification(err.response?.data?.error || "Failed to reject", "error");
    } finally {
      setApproveRejectLoading(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCommentChange = (requestId, value) => {
    setCommentData((prev) => ({ ...prev, [requestId]: value }));
  };

  const isHROrMD = user?.role === "HR" || user?.role === "MD";

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
    <div data-testid="leave-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Notification Toast */}
      {notification && (
        <div
          className={`notification ${notification.type}`}
          style={{
            position: "fixed",
            top: 90,
            right: 24,
            zIndex: 1000,
            animation: "slideIn 0.3s ease-out"
          }}
        >
          {notification.type === 'success' ? '✓' : '✕'} {notification.msg}
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
          Leave Management
        </h1>
        <p style={{ color: "#52525B", fontSize: 14 }}>Request and track your leave days</p>
      </div>

      {/* Leave Balance */}
      {leaveBalance && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(2, 1fr)", 
          gap: "16px", 
          marginBottom: "24px" 
        }}>
          <div style={{ 
            background: "#09090B", 
            border: "1px solid rgba(0, 161, 199, 0.3)", 
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center"
          }}>
            <div style={{ 
              fontSize: 11, 
              color: "#52525B", 
              marginBottom: 8, 
              textTransform: "uppercase", 
              letterSpacing: "0.05em" 
            }}>Casual Leave</div>
            <div style={{ 
              fontSize: 48, 
              fontWeight: 700, 
              color: "#00A1C7",
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1
            }}>{leaveBalance.casual || 0}</div>
            <div style={{ fontSize: 12, color: "#52525B", marginTop: 8 }}>Days available</div>
          </div>
          <div style={{ 
            background: "#09090B", 
            border: "1px solid rgba(0, 255, 170, 0.3)", 
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center"
          }}>
            <div style={{ 
              fontSize: 11, 
              color: "#52525B", 
              marginBottom: 8, 
              textTransform: "uppercase", 
              letterSpacing: "0.05em" 
            }}>Sick Leave</div>
            <div style={{ 
              fontSize: 48, 
              fontWeight: 700, 
              color: "#00FFAA",
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1
            }}>{leaveBalance.sick || 0}</div>
            <div style={{ fontSize: 12, color: "#52525B", marginTop: 8 }}>Days available</div>
          </div>
        </div>
      )}

      {/* Pending Requests for HR/MD */}
      {isHROrMD && pendingRequests.length > 0 && (
        <div style={{ 
          background: "#09090B", 
          border: "1px solid rgba(255, 104, 38, 0.3)", 
          borderRadius: "16px", 
          marginBottom: "24px",
          overflow: "hidden"
        }}>
          <div style={{ 
            padding: "16px 24px", 
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <span style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              color: "#FF6826",
              fontFamily: "'Rubik', sans-serif"
            }}>Pending Leave Requests</span>
            <span style={{
              background: "rgba(255, 104, 38, 0.2)",
              color: "#FF6826",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600
            }}>{pendingRequests.length}</span>
          </div>
          <div style={{ padding: "20px 24px" }}>
            {pendingRequests.map((request) => (
              <div key={request.id} style={{ 
                background: "#18181B", 
                padding: "20px", 
                borderRadius: "12px", 
                marginBottom: "12px",
                border: "1px solid rgba(255, 255, 255, 0.05)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#FAFAFA" }}>{request.user?.fullName}</div>
                    <div style={{ fontSize: 12, color: "#52525B", marginTop: 4 }}>
                      {request.type} Leave • {new Date(request.startDate).toLocaleDateString()} to {new Date(request.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{ 
                    background: "rgba(234, 179, 8, 0.15)", 
                    color: "#eab308", 
                    padding: "6px 12px", 
                    borderRadius: "20px", 
                    fontSize: 11,
                    fontWeight: 600,
                    border: "1px solid rgba(234, 179, 8, 0.3)",
                    height: "fit-content"
                  }}>
                    {request.status}
                  </span>
                </div>
                {request.reason && (
                  <div style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 16, fontStyle: "italic" }}>
                    "{request.reason}"
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <textarea
                    data-testid={`comment-${request.id}`}
                    placeholder="Add comment (optional)"
                    value={commentData[request.id] || ""}
                    onChange={(e) => handleCommentChange(request.id, e.target.value)}
                    style={{ 
                      ...inputStyle, 
                      gridColumn: "1 / -1", 
                      minHeight: 60, 
                      resize: "vertical",
                      fontSize: 13
                    }}
                  />
                  <button
                    data-testid={`approve-${request.id}`}
                    onClick={() => handleApprove(request.id)}
                    disabled={approveRejectLoading === request.id}
                    style={{
                      padding: "12px",
                      background: "rgba(0, 255, 170, 0.15)",
                      border: "1px solid rgba(0, 255, 170, 0.3)",
                      borderRadius: "10px",
                      color: "#00FFAA",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {approveRejectLoading === request.id ? "Processing..." : "✓ Approve"}
                  </button>
                  <button
                    data-testid={`reject-${request.id}`}
                    onClick={() => handleReject(request.id)}
                    disabled={approveRejectLoading === request.id}
                    style={{
                      padding: "12px",
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "10px",
                      color: "#ef4444",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {approveRejectLoading === request.id ? "Processing..." : "✕ Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your Requests */}
      <div style={{ 
        background: "#09090B", 
        border: "1px solid rgba(255, 255, 255, 0.1)", 
        borderRadius: "16px",
        overflow: "hidden"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          padding: "16px 24px", 
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)" 
        }}>
          <h2 style={{ 
            fontSize: 16, 
            fontWeight: 600, 
            margin: 0, 
            color: "#FAFAFA",
            fontFamily: "'Rubik', sans-serif"
          }}>Your Requests</h2>
          <button 
            data-testid="new-request-btn"
            onClick={() => setShowForm(!showForm)} 
            style={{
              padding: "10px 20px",
              background: showForm ? "rgba(239, 68, 68, 0.15)" : "linear-gradient(135deg, #00A1C7, #00FFAA)",
              border: showForm ? "1px solid rgba(239, 68, 68, 0.3)" : "none",
              borderRadius: "10px",
              color: showForm ? "#ef4444" : "#000",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: showForm ? "none" : "0 0 20px rgba(0, 161, 199, 0.3)"
            }}
          >
            {showForm ? "✕ Cancel" : "+ New Request"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ padding: "24px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A1A1AA", marginBottom: 8 }}>
                Leave Type
              </label>
              <select
                name="type"
                data-testid="leave-type-select"
                value={formData.type}
                onChange={handleInputChange}
                style={{ ...inputStyle, cursor: "pointer" }}
                required
              >
                <option value="CL">Casual Leave (CL)</option>
                <option value="SL">Sick Leave (SL)</option>
                <option value="UL">Unpaid Leave (UL)</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A1A1AA", marginBottom: 8 }}>
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  data-testid="start-date-input"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A1A1AA", marginBottom: 8 }}>
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  data-testid="end-date-input"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#A1A1AA", marginBottom: 8 }}>
                Reason
              </label>
              <textarea
                name="reason"
                data-testid="leave-reason-input"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Provide a reason for your leave request"
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
              />
            </div>

            <button 
              type="submit" 
              data-testid="submit-leave-btn"
              disabled={loading} 
              style={{
                width: "100%",
                padding: "14px",
                background: loading ? "#18181B" : "linear-gradient(135deg, #00A1C7, #00FFAA)",
                border: "none",
                borderRadius: "12px",
                color: loading ? "#52525B" : "#000",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 0 20px rgba(0, 161, 199, 0.3)"
              }}
            >
              {loading ? "Submitting..." : "✓ Submit Request"}
            </button>
          </form>
        )}

        {leaveRequests.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#52525B" }}>
            No leave requests yet
          </div>
        ) : (
          <div style={{ padding: "20px 24px" }}>
            {leaveRequests.map((request) => (
              <div key={request.id} style={{ 
                background: "#18181B", 
                padding: "20px", 
                borderRadius: "12px", 
                marginBottom: "12px",
                border: "1px solid rgba(255, 255, 255, 0.05)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#FAFAFA" }}>{request.type} Leave</div>
                    <div style={{ fontSize: 12, color: "#52525B", marginTop: 4 }}>
                      {new Date(request.startDate).toLocaleDateString()} – {new Date(request.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "6px 12px",
                    borderRadius: "20px",
                    background: request.status === "Approved" 
                      ? "rgba(0, 255, 170, 0.15)" 
                      : request.status === "Rejected" 
                        ? "rgba(239, 68, 68, 0.15)" 
                        : "rgba(234, 179, 8, 0.15)",
                    color: request.status === "Approved" 
                      ? "#00FFAA" 
                      : request.status === "Rejected" 
                        ? "#ef4444" 
                        : "#eab308",
                    border: `1px solid ${
                      request.status === "Approved" 
                        ? "rgba(0, 255, 170, 0.3)" 
                        : request.status === "Rejected" 
                          ? "rgba(239, 68, 68, 0.3)" 
                          : "rgba(234, 179, 8, 0.3)"
                    }`
                  }}>
                    {request.status}
                  </span>
                </div>
                {request.reason && (
                  <div style={{ fontSize: 13, color: "#A1A1AA", fontStyle: "italic" }}>"{request.reason}"</div>
                )}
              </div>
            ))}
          </div>
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
