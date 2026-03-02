import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { api } from '../App';
import { 
  Users, Plus, Search, Filter, MoreVertical, Mail, Phone,
  Building, Calendar, ChevronDown, Edit, Trash2, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    phone: '',
    address: '',
    date_of_birth: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    designation: '',
    department_id: '',
    reporting_manager_id: '',
    employment_type: 'full_time',
    status: 'active'
  });

  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'employee'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, deptRes, usersRes] = await Promise.all([
        api.get('/hrm/employees'),
        api.get('/hrm/departments'),
        api.get('/users').catch(() => ({ data: [] }))
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/register', newUserData);
      toast.success('User created successfully');
      setUsers([...users, response.data]);
      setFormData({ ...formData, user_id: response.data.id });
      setShowCreateUser(false);
      setNewUserData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'employee'
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!formData.user_id) {
      toast.error('Please select or create a user first');
      return;
    }
    try {
      const response = await api.post('/hrm/employees', formData);
      toast.success('Employee created successfully');
      setEmployees([...employees, response.data]);
      setShowAddModal(false);
      setFormData({
        user_id: '',
        phone: '',
        address: '',
        date_of_birth: '',
        date_of_joining: new Date().toISOString().split('T')[0],
        designation: '',
        department_id: '',
        reporting_manager_id: '',
        employment_type: 'full_time',
        status: 'active'
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create employee');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const user = users.find(u => u.id === emp.user_id);
    const matchesSearch = !searchQuery || 
      emp.employee_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown';
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || 'N/A';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-rubik font-bold text-white flex items-center gap-3">
              <Users className="w-7 h-7 text-brand-teal" />
              Employees
            </h1>
            <p className="text-text-secondary mt-1">Manage your team members</p>
          </div>
          
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold shadow-glow-button" data-testid="add-employee-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-white/10 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-rubik text-white">Add New Employee</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateEmployee} className="space-y-4 mt-4">
                {/* User Selection */}
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">User Account</label>
                  <div className="flex gap-2">
                    <Select value={formData.user_id} onValueChange={(v) => setFormData({...formData, user_id: v})}>
                      <SelectTrigger className="flex-1 bg-surface-highlight border-white/10">
                        <SelectValue placeholder="Select user..." />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-white/10">
                        {users.filter(u => !employees.some(e => e.user_id === u.id)).map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => setShowCreateUser(true)}>
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Designation</label>
                    <Input
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                      placeholder="e.g., Software Engineer"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Department</label>
                    <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v})}>
                      <SelectTrigger className="bg-surface-highlight border-white/10">
                        <SelectValue placeholder="Select department..." />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-white/10">
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Date of Joining</label>
                    <Input
                      type="date"
                      value={formData.date_of_joining}
                      onChange={(e) => setFormData({...formData, date_of_joining: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Employment Type</label>
                    <Select value={formData.employment_type} onValueChange={(v) => setFormData({...formData, employment_type: v})}>
                      <SelectTrigger className="bg-surface-highlight border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-white/10">
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="bg-surface-highlight border-white/10"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-brand-teal text-black">Create Employee</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Create User Modal */}
          <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
            <DialogContent className="bg-surface border-white/10 max-w-md">
              <DialogHeader>
                <DialogTitle className="font-rubik text-white">Create User Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">First Name</label>
                    <Input
                      value={newUserData.first_name}
                      onChange={(e) => setNewUserData({...newUserData, first_name: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Last Name</label>
                    <Input
                      value={newUserData.last_name}
                      onChange={(e) => setNewUserData({...newUserData, last_name: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Username</label>
                  <Input
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                    className="bg-surface-highlight border-white/10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Email</label>
                  <Input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    className="bg-surface-highlight border-white/10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Password</label>
                  <Input
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                    className="bg-surface-highlight border-white/10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Role</label>
                  <Select value={newUserData.role} onValueChange={(v) => setNewUserData({...newUserData, role: v})}>
                    <SelectTrigger className="bg-surface-highlight border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-white/10">
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="team_lead">Team Lead</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="hr_manager">HR Manager</SelectItem>
                      <SelectItem value="managing_director">Managing Director</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateUser(false)}>Cancel</Button>
                  <Button type="submit" className="bg-brand-teal text-black">Create User</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface border-white/10"
              data-testid="search-employees"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-surface border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-white/10">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="resigned">Resigned</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employee Table */}
        <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Employee</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Code</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Department</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Designation</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Joined</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`employee-row-${emp.id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-teal to-brand-mint flex items-center justify-center text-black font-bold">
                          {getUserName(emp.user_id).charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{getUserName(emp.user_id)}</p>
                          <p className="text-xs text-text-muted">{emp.phone || 'No phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-brand-teal">{emp.employee_code}</span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{getDepartmentName(emp.department_id)}</td>
                    <td className="px-6 py-4 text-white">{emp.designation}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        emp.status === 'active' ? 'bg-brand-mint/10 text-brand-mint' :
                        emp.status === 'on_leave' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {emp.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-mono text-sm">{emp.date_of_joining}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-white transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default EmployeesPage;
