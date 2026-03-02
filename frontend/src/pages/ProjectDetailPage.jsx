import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { api } from '../App';
import { 
  ArrowLeft, Users, Calendar, DollarSign, CheckCircle, Clock,
  MoreVertical, Plus, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const TASK_COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'border-gray-500' },
  { id: 'in_progress', label: 'In Progress', color: 'border-brand-teal' },
  { id: 'in_review', label: 'In Review', color: 'border-yellow-500' },
  { id: 'completed', label: 'Completed', color: 'border-brand-mint' }
];

const ProjectDetailPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes, usersRes] = await Promise.all([
        api.get(`/pms/projects/${id}`),
        api.get(`/pms/tasks?project_id=${id}`),
        api.get('/users').catch(() => ({ data: [] }))
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
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

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unassigned';
  };

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl text-white mb-4">Project not found</h2>
          <Link to="/projects" className="text-brand-teal hover:underline">Back to projects</Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/projects" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-rubik font-bold text-white">{project.name}</h1>
            <p className="text-text-secondary">{project.client_name}</p>
          </div>
          <span className={`px-4 py-2 rounded-xl text-sm font-bold uppercase ${
            project.status === 'active' ? 'bg-brand-mint/10 text-brand-mint' :
            project.status === 'in_progress' ? 'bg-brand-teal/10 text-brand-teal' :
            'bg-gray-500/10 text-gray-400'
          }`}>
            {project.status.replace('_', ' ')}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-surface border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-teal/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-brand-teal" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">{project.progress || 0}%</p>
                <p className="text-xs text-text-secondary">Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-surface border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-mint/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand-mint" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">{tasks.length}</p>
                <p className="text-xs text-text-secondary">Total Tasks</p>
              </div>
            </div>
          </div>
          <div className="bg-surface border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">{project.team_members?.length || 0}</p>
                <p className="text-xs text-text-secondary">Team Members</p>
              </div>
            </div>
          </div>
          <div className="bg-surface border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">₹{((project.budget || 0) / 100).toLocaleString()}</p>
                <p className="text-xs text-text-secondary">Budget</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-rubik font-semibold text-white">Task Board</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {TASK_COLUMNS.map(column => (
              <div key={column.id} className="space-y-3">
                <div className={`flex items-center justify-between p-3 bg-surface-highlight rounded-xl border-l-4 ${column.color}`}>
                  <h3 className="font-medium text-white">{column.label}</h3>
                  <span className="px-2 py-1 bg-white/5 rounded-full text-xs text-text-secondary">
                    {getTasksByStatus(column.id).length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[400px]">
                  {getTasksByStatus(column.id).map(task => (
                    <div
                      key={task.id}
                      className="bg-surface-highlight border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all cursor-pointer"
                      data-testid={`task-card-${task.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-white">{task.title}</h4>
                        <Select
                          value={task.status}
                          onValueChange={(value) => handleStatusChange(task.id, value)}
                        >
                          <SelectTrigger className="w-8 h-8 p-0 border-0 bg-transparent">
                            <MoreVertical className="w-4 h-4 text-text-muted" />
                          </SelectTrigger>
                          <SelectContent className="bg-surface border-white/10">
                            {TASK_COLUMNS.map(col => (
                              <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {task.service_type && (
                        <span className="inline-block px-2 py-1 bg-brand-teal/10 text-brand-teal text-xs rounded-md mb-2">
                          {task.service_type}
                        </span>
                      )}
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span>{getUserName(task.assigned_to)}</span>
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProjectDetailPage;
