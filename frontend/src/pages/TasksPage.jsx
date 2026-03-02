import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { api, useAuth } from '../App';
import { 
  CheckSquare, Plus, Search, Filter, Calendar, Clock,
  ChevronDown, MoreVertical, User
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-500/10 text-gray-400' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/10 text-yellow-400' },
  { value: 'high', label: 'High', color: 'bg-brand-orange/10 text-brand-orange' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500/10 text-red-400' },
];

const STATUSES = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-500/10 text-gray-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-brand-teal/10 text-brand-teal' },
  { value: 'in_review', label: 'In Review', color: 'bg-yellow-500/10 text-yellow-400' },
  { value: 'completed', label: 'Completed', color: 'bg-brand-mint/10 text-brand-mint' },
];

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    estimated_hours: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        api.get('/pms/tasks/my'),
        api.get('/pms/projects'),
        api.get('/users').catch(() => ({ data: [] }))
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/pms/tasks', formData);
      toast.success('Task created successfully');
      setTasks([response.data, ...tasks]);
      setShowAddModal(false);
      setFormData({
        project_id: '',
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
        estimated_hours: 0
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/pms/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toast.success('Task status updated');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getUserName = (userId) => {
    const u = users.find(u => u.id === userId);
    return u ? `${u.first_name} ${u.last_name}` : 'Unassigned';
  };

  const getProjectName = (projectId) => {
    const p = projects.find(p => p.id === projectId);
    return p?.name || 'N/A';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-rubik font-bold text-white flex items-center gap-3">
              <CheckSquare className="w-7 h-7 text-brand-teal" />
              My Tasks
            </h1>
            <p className="text-text-secondary mt-1">Track and manage your assigned tasks</p>
          </div>
          
          {user?.role_level >= 2 && (
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold shadow-glow-button" data-testid="add-task-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-surface border-white/10 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-rubik text-white">Create New Task</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Project</label>
                    <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                      <SelectTrigger className="bg-surface-highlight border-white/10">
                        <SelectValue placeholder="Select project..." />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-white/10">
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                      placeholder="Task title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-highlight border border-white/10 rounded-xl text-white placeholder-text-muted focus:border-brand-teal outline-none resize-none"
                      rows={3}
                      placeholder="Task description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-text-secondary">Priority</label>
                      <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                        <SelectTrigger className="bg-surface-highlight border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border-white/10">
                          {PRIORITIES.map(p => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-text-secondary">Due Date</label>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                        className="bg-surface-highlight border-white/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Assign To</label>
                    <Select value={formData.assigned_to} onValueChange={(v) => setFormData({...formData, assigned_to: v})}>
                      <SelectTrigger className="bg-surface-highlight border-white/10">
                        <SelectValue placeholder="Select assignee..." />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-white/10">
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.first_name} {u.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button type="submit" className="bg-brand-teal text-black">Create Task</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface border-white/10"
              data-testid="search-tasks"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-surface border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-white/10">
              <SelectItem value="all">All Status</SelectItem>
              {STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tasks Table */}
        <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Task</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Project</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Priority</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Due Date</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                    No tasks found
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`task-row-${task.id}`}>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{task.title}</p>
                      {task.service_type && (
                        <span className="text-xs text-brand-teal">{task.service_type}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{getProjectName(task.project_id)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        PRIORITIES.find(p => p.value === task.priority)?.color || 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Select value={task.status} onValueChange={(value) => handleStatusChange(task.id, value)}>
                        <SelectTrigger className={`w-32 border-0 ${STATUSES.find(s => s.value === task.status)?.color || ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border-white/10">
                          {STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      {task.due_date ? (
                        <span className="flex items-center gap-2 text-text-secondary font-mono text-sm">
                          <Calendar className="w-4 h-4" />
                          {task.due_date}
                        </span>
                      ) : (
                        <span className="text-text-muted">No due date</span>
                      )}
                    </td>
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

export default TasksPage;
