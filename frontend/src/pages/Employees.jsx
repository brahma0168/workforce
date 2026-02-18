import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { UserContext } from "../context/UserContext";
import EmployeeActivity from "../components/EmployeeActivity";

const tierColor = (role) => {
  const colors = { MD: "#00A1C7", HR: "#00FFAA", MANAGER: "#FF6826", EMPLOYEE: "#A1A1AA", TL: "#eab308" };
  return colors[role] || "#A1A1AA";
};

const tierLabel = (role) => {
  switch (role) {
    case "MD": return "Managing Director";
    case "HR": return "HR Manager";
    case "MANAGER": return "Manager";
    case "TL": return "Team Lead";
    case "EMPLOYEE": return "Employee";
    default: return role;
  }
};

export default function Employees() {
  const { user, updateUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showActivity, setShowActivity] = useState(false);
  const [selectedEmployeeForActivity, setSelectedEmployeeForActivity] = useState(null);
  
  const [formData, setFormData] = useState({
    employeeId: "", fullName: "", email: "", password: "", phone: "",
    department: "", designation: "", role: "EMPLOYEE", workMode: "ONSITE", reportingManagerId: "",
  });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/employees");
      setEmployees(res.data.employees || res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.fullName || !formData.email || !formData.password) {
      alert("Please fill in all required fields");
      return;
    }
    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      await api.post("/employees", formData);
      showNotificationMsg("Employee added successfully!");
      setFormData({ employeeId: "", fullName: "", email: "", password: "", phone: "", department: "", designation: "", role: "EMPLOYEE" });
      setShowForm(false);
      await fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Failed to add employee");
    }
  };

  const showNotificationMsg = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleEditEmployee = () => {
    setEditFormData({
      fullName: selectedEmployee.fullName,
      phone: selectedEmployee.phone || "",
      department: selectedEmployee.department || "",
      designation: selectedEmployee.designation || "",
      role: selectedEmployee.role,
      status: selectedEmployee.status || "Active",
      workMode: selectedEmployee.workMode || "ONSITE",
      reportingTo: selectedEmployee.reportingManagerId || "",
    });
    setEditMode(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEmployee = async () => {
    try {
      await api.patch(`/employees/${selectedEmployee.id}`, editFormData);
      showNotificationMsg("Employee saved successfully!");
      setEditMode(false);
      const updatedEmployee = { ...selectedEmployee, ...editFormData };
      setSelectedEmployee(updatedEmployee);
      if (user?.id === selectedEmployee.id) updateUser(updatedEmployee);
      await fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || "Failed to update employee");
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditFormData({});
  };

  const canAddEmployee = user?.role === "HR" || user?.role === "MD";
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || emp.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const inputStyle = {
    width: "100%", padding: "12px 16px", background: "#18181B",
    border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px",
    fontSize: "14px", color: "#FAFAFA", outline: "none", boxSizing: "border-box"
  };

  return (
    <div data-testid="employees-page" style={{ maxWidth: 1400 }}>
      {/* Notification Toast */}
      {notification && (
        <div className="notification success" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, animation: "slideIn 0.3s ease" }}>
          ✓ {notification}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, fontFamily: "'Rubik', sans-serif", background: "linear-gradient(135deg, #FAFAFA, #A1A1AA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Employees
          </h1>
          <p style={{ fontSize: 14, color: "#52525B", margin: 0 }}>{filteredEmployees.length} total</p>
        </div>
        {canAddEmployee && (
          <button
            data-testid="add-employee-btn"
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
              background: showForm ? "rgba(239, 68, 68, 0.15)" : "linear-gradient(135deg, #00A1C7, #00FFAA)",
              color: showForm ? "#ef4444" : "#000",
              boxShadow: showForm ? "none" : "0 0 20px rgba(0, 161, 199, 0.3)"
            }}
          >
            {showForm ? "✕ Cancel" : "+ Add Employee"}
          </button>
        )}
      </div>

      {/* Add Employee Form */}
      {showForm && canAddEmployee && (
        <div style={{ background: "#09090B", borderRadius: 16, border: "1px solid rgba(255, 255, 255, 0.1)", padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#FAFAFA", marginTop: 0, marginBottom: 20, fontFamily: "'Rubik', sans-serif" }}>
            Add New Employee
          </h2>
          <form onSubmit={handleAddEmployee}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                { name: "employeeId", label: "Employee ID", type: "text", required: true, placeholder: "EMP001" },
                { name: "fullName", label: "Full Name", type: "text", required: true, placeholder: "John Doe" },
                { name: "email", label: "Email", type: "email", required: true, placeholder: "john@company.com" },
                { name: "password", label: "Password", type: "password", required: true, placeholder: "Min 6 characters" },
                { name: "phone", label: "Phone", type: "tel", placeholder: "+1234567890" },
                { name: "department", label: "Department", type: "select", options: ["Video Editor", "Graphic", "Operation & Support", "Performance Marketing", "SMM", "GMB", "Development"] },
                { name: "designation", label: "Designation", type: "text", placeholder: "Job Title" },
                { name: "workMode", label: "Work Mode", type: "select", options: ["ONSITE", "REMOTE", "CLIENT_OFFICE"] },
                { name: "role", label: "Role", type: "select", options: ["EMPLOYEE", "MANAGER", "TL", "HR", "MD"], required: true },
              ].map((field) => (
                <div key={field.name}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#A1A1AA", display: "block", marginBottom: 8 }}>
                    {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                  </label>
                  {field.type === "select" ? (
                    <select name={field.name} value={formData[field.name]} onChange={handleInputChange} required={field.required} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">{`Select ${field.label}`}</option>
                      {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input type={field.type} name={field.name} placeholder={field.placeholder} value={formData[field.name]} onChange={handleInputChange} required={field.required} style={inputStyle} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" style={{ padding: "12px 28px", background: "linear-gradient(135deg, #00A1C7, #00FFAA)", color: "#000", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 0 20px rgba(0, 161, 199, 0.3)" }}>
                Add Employee
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "12px 28px", background: "rgba(255, 255, 255, 0.05)", color: "#A1A1AA", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <input
          type="text"
          data-testid="employee-search"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <select
          data-testid="role-filter"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{ ...inputStyle, minWidth: 160, cursor: "pointer" }}
        >
          <option value="all">All Roles</option>
          <option value="MD">Managing Director</option>
          <option value="HR">HR Manager</option>
          <option value="MANAGER">Manager</option>
          <option value="TL">Team Lead</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
      </div>

      {/* Employees Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px" }}><div className="spinner"></div><p style={{ color: "#52525B", marginTop: 16 }}>Loading employees...</p></div>
      ) : filteredEmployees.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#52525B" }}>No employees found</div>
      ) : (
        <div style={{ background: "#09090B", borderRadius: 16, border: "1px solid rgba(255, 255, 255, 0.1)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#18181B" }}>
                {["Employee", "Department", "Role", "Email", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, idx) => (
                <tr
                  key={emp.id}
                  onClick={() => { setSelectedEmployee(emp); setModalOpen(true); }}
                  style={{ borderBottom: idx !== filteredEmployees.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "12px", background: `linear-gradient(135deg, ${tierColor(emp.role)}, ${tierColor(emp.role)}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 13, fontWeight: 700 }}>
                        {emp.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA" }}>{emp.fullName}</div>
                        <div style={{ fontSize: 12, color: "#52525B", display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{emp.designation || "N/A"}</span>
                          {emp.workMode && (
                            <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600, background: emp.workMode === "REMOTE" ? "rgba(0, 161, 199, 0.15)" : emp.workMode === "CLIENT_OFFICE" ? "rgba(234, 179, 8, 0.15)" : "rgba(0, 255, 170, 0.15)", color: emp.workMode === "REMOTE" ? "#00A1C7" : emp.workMode === "CLIENT_OFFICE" ? "#eab308" : "#00FFAA" }}>
                              {emp.workMode === "REMOTE" ? "Remote" : emp.workMode === "CLIENT_OFFICE" ? "Client" : "On-site"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: 13, color: "#A1A1AA" }}>{emp.department || "—"}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 20, background: `${tierColor(emp.role)}20`, color: tierColor(emp.role), border: `1px solid ${tierColor(emp.role)}40` }}>
                      {tierLabel(emp.role)}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "#52525B", padding: "16px 24px" }}>{emp.email}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 20, background: emp.status === "Active" ? "rgba(0, 255, 170, 0.15)" : emp.status === "Resigned" ? "rgba(234, 179, 8, 0.15)" : "rgba(239, 68, 68, 0.15)", color: emp.status === "Active" ? "#00FFAA" : emp.status === "Resigned" ? "#eab308" : "#ef4444", border: `1px solid ${emp.status === "Active" ? "rgba(0, 255, 170, 0.3)" : emp.status === "Resigned" ? "rgba(234, 179, 8, 0.3)" : "rgba(239, 68, 68, 0.3)"}` }}>
                      {emp.status || "Active"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/profile/${emp.id}`); }} style={{ padding: "6px 12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 8, fontSize: 12, color: "#A1A1AA", cursor: "pointer" }}>
                        View Profile
                      </button>
                      {(user.role === "HR" || user.role === "MD" || user.role === "MANAGER") && (
                        <button onClick={(e) => { e.stopPropagation(); setSelectedEmployeeForActivity(emp.id); setShowActivity(true); }} style={{ padding: "6px 12px", background: "rgba(0, 161, 199, 0.15)", border: "1px solid rgba(0, 161, 199, 0.3)", borderRadius: 8, fontSize: 12, color: "#00A1C7", cursor: "pointer" }}>
                          Activity
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Detail Modal */}
      {modalOpen && selectedEmployee && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => { if (!editMode) setModalOpen(false); }}>
          <div style={{ background: "#09090B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 24, width: 520, padding: 32, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: "16px", background: `linear-gradient(135deg, ${tierColor(selectedEmployee.role)}, ${tierColor(selectedEmployee.role)}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 20, fontWeight: 800 }}>
                {selectedEmployee.fullName?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#FAFAFA", margin: 0, fontFamily: "'Rubik', sans-serif" }}>
                  {editMode ? <input type="text" name="fullName" value={editFormData.fullName} onChange={handleEditFormChange} style={{ ...inputStyle, fontSize: 18, fontWeight: 700, padding: "8px 12px" }} /> : selectedEmployee.fullName}
                </h2>
                <p style={{ fontSize: 13, color: "#52525B", margin: "4px 0" }}>
                  {editMode ? <select name="designation" value={editFormData.designation} onChange={handleEditFormChange} style={{ ...inputStyle, fontSize: 13, padding: "6px 10px", marginTop: 4 }}><option value="">Select Designation</option><option value="Junior">Junior</option><option value="Senior">Senior</option><option value="Lead">Lead</option><option value="Manager">Manager</option></select> : (selectedEmployee.designation || "No designation")}
                </p>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: `${tierColor(selectedEmployee.role)}20`, color: tierColor(selectedEmployee.role), border: `1px solid ${tierColor(selectedEmployee.role)}40` }}>
                  {tierLabel(selectedEmployee.role)}
                </span>
              </div>
              <button onClick={() => { if (editMode) handleCancelEdit(); else setModalOpen(false); }} style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: "pointer", color: "#A1A1AA", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Department", value: editMode ? <select name="department" value={editFormData.department} onChange={handleEditFormChange} style={inputStyle}><option value="">Select</option><option value="Engineering">Engineering</option><option value="HR">HR</option><option value="Marketing">Marketing</option></select> : (selectedEmployee.department || "—") },
                { label: "Email", value: selectedEmployee.email },
                { label: "Phone", value: editMode ? <input type="tel" name="phone" value={editFormData.phone} onChange={handleEditFormChange} placeholder="Phone" style={inputStyle} /> : (selectedEmployee.phone || "—") },
                { label: "Status", value: editMode ? <select name="status" value={editFormData.status} onChange={handleEditFormChange} style={inputStyle}><option value="Active">Active</option><option value="Resigned">Resigned</option><option value="Terminated">Terminated</option></select> : <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: selectedEmployee.status === "Active" ? "rgba(0, 255, 170, 0.15)" : "rgba(239, 68, 68, 0.15)", color: selectedEmployee.status === "Active" ? "#00FFAA" : "#ef4444" }}>{selectedEmployee.status || "Active"}</span> },
                { label: "Work Mode", value: editMode ? <select name="workMode" value={editFormData.workMode} onChange={handleEditFormChange} style={inputStyle}><option value="ONSITE">On-site</option><option value="REMOTE">Remote</option><option value="CLIENT_OFFICE">Client Office</option></select> : <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: selectedEmployee.workMode === "REMOTE" ? "rgba(0, 161, 199, 0.15)" : "rgba(0, 255, 170, 0.15)", color: selectedEmployee.workMode === "REMOTE" ? "#00A1C7" : "#00FFAA" }}>{selectedEmployee.workMode === "REMOTE" ? "Remote" : selectedEmployee.workMode === "CLIENT_OFFICE" ? "Client Office" : "On-site"}</span> },
                { label: "Reporting To", value: selectedEmployee.reportingManager?.fullName || "—" },
              ].map((field) => (
                <div key={field.label} style={{ background: editMode ? "#18181B" : "rgba(255, 255, 255, 0.02)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <div style={{ fontSize: 11, color: "#52525B", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{field.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#FAFAFA" }}>{field.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              {editMode ? (
                <>
                  <button onClick={handleSaveEmployee} style={{ flex: 1, padding: "14px", background: "linear-gradient(135deg, #00A1C7, #00FFAA)", color: "#000", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 0 20px rgba(0, 161, 199, 0.3)" }}>Save Changes</button>
                  <button onClick={handleCancelEdit} style={{ flex: 1, padding: "14px", background: "rgba(255, 255, 255, 0.05)", color: "#A1A1AA", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  {(user?.role === "HR" || user?.role === "MD") && (
                    <button onClick={handleEditEmployee} style={{ flex: 1, padding: "14px", background: "rgba(0, 161, 199, 0.15)", color: "#00A1C7", border: "1px solid rgba(0, 161, 199, 0.3)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Edit Employee</button>
                  )}
                  <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: "14px", background: "rgba(255, 255, 255, 0.05)", color: "#A1A1AA", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Close</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employee Activity Modal */}
      {showActivity && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#09090B", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 24, width: "90%", maxWidth: "1200px", height: "90vh", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#FAFAFA", fontFamily: "'Rubik', sans-serif" }}>Employee Activity</h2>
              <button onClick={() => { setShowActivity(false); setSelectedEmployeeForActivity(null); }} style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: "pointer", color: "#A1A1AA" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
              <EmployeeActivity employeeId={selectedEmployeeForActivity} />
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}
