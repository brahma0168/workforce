import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { api, useAuth } from '../App';
import { 
  AlertTriangle, Plus, Search, MessageSquare, Clock, User,
  ChevronRight, MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { formatDistanceToNow } from 'date-fns';

const ISSUE_TYPES = [
  { value: 'project', label: 'Project' },
  { value: 'operational', label: 'Operational' },
  { value: 'client', label: 'Client' },
  { value: 'technical', label: 'Technical' },
  { value: 'compliance', label: 'Compliance' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-500/10 text-gray-400' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/10 text-yellow-400' },
  { value: 'high', label: 'High', color: 'bg-brand-orange/10 text-brand-orange' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500/10 text-red-400' },
];

const STATUSES = [
  { value: 'open', label: 'Open', color: 'bg-red-500/10 text-red-400' },
  { value: 'acknowledged', label: 'Acknowledged', color: 'bg-blue-500/10 text-blue-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-brand-teal/10 text-brand-teal' },
  { value: 'blocked', label: 'Blocked', color: 'bg-brand-orange/10 text-brand-orange' },
  { value: 'in_review', label: 'In Review', color: 'bg-yellow-500/10 text-yellow-400' },
  { value: 'resolved', label: 'Resolved', color: 'bg-brand-mint/10 text-brand-mint' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-500/10 text-gray-400' },
];

const IssuesPage = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issue_type: 'project',
    priority: 'medium',
    project_id: '',
    assigned_to: '',
    due_date: '',
    tags: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [issuesRes, projectsRes, usersRes] = await Promise.all([
        api.get('/issues'),
        api.get('/pms/projects'),
        api.get('/users').catch(() => ({ data: [] }))
      ]);
      setIssues(issuesRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/issues/', formData);
      toast.success('Issue created successfully');
      setIssues([response.data, ...issues]);
      setShowAddModal(false);
      setFormData({
        title: '',
        description: '',
        issue_type: 'project',
        priority: 'medium',
        project_id: '',
        assigned_to: '',
        due_date: '',
        tags: []
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create issue');
    }
  };

  const handleSelectIssue = async (issue) => {
    setSelectedIssue(issue);
    try {
      const response = await api.get(`/issues/${issue.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const response = await api.post(`/issues/${selectedIssue.id}/comments`, { content: newComment });
      setComments([...comments, response.data]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await api.put(`/issues/${issueId}/status?status=${newStatus}`);
      setIssues(issues.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
      if (selectedIssue?.id === issueId) {
        setSelectedIssue({ ...selectedIssue, status: newStatus });
      }
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = !searchQuery || 
      issue.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getUserName = (userId) => {
    const u = users.find(u => u.id === userId);
    return u ? `${u.first_name} ${u.last_name}` : 'Unknown';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-rubik font-bold text-white flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-brand-teal" />
              Issues Tracker
            </h1>
            <p className="text-text-secondary mt-1">Track and resolve issues</p>
          </div>
          
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold shadow-glow-button" data-testid="create-issue-btn">
                <Plus className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-white/10 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-rubik text-white">Report New Issue</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateIssue} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="bg-surface-highlight border-white/10"
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-highlight border border-white/10 rounded-xl text-white placeholder-text-muted focus:border-brand-teal outline-none resize-none"
                    rows={4}
                    placeholder="Detailed description..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Type</label>
                    <Select value={formData.issue_type} onValueChange={(v) => setFormData({...formData, issue_type: v})}>
                      <SelectTrigger className="bg-surface-highlight border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-white/10">
                        {ISSUE_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Project (Optional)</label>
                  <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                    <SelectTrigger className="bg-surface-highlight border-white/10">
                      <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-white/10">
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-brand-teal text-black">Create Issue</Button>
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
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface border-white/10"
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

        <div className="grid grid-cols-12 gap-6">
          {/* Issues List */}
          <div className="col-span-5 bg-surface border border-white/5 rounded-2xl p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No issues found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredIssues.map(issue => (
                  <button
                    key={issue.id}
                    onClick={() => handleSelectIssue(issue)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedIssue?.id === issue.id 
                        ? 'bg-brand-teal/10 border border-brand-teal/30' 
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                    data-testid={`issue-${issue.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white line-clamp-1">{issue.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        PRIORITIES.find(p => p.value === issue.priority)?.color
                      }`}>
                        {issue.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span className={`px-2 py-0.5 rounded ${
                        STATUSES.find(s => s.value === issue.status)?.color
                      }`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Issue Detail */}
          <div className="col-span-7 bg-surface border border-white/5 rounded-2xl p-6">
            {!selectedIssue ? (
              <div className="flex flex-col items-center justify-center h-96 text-text-secondary">
                <AlertTriangle className="w-16 h-16 mb-4 opacity-30" />
                <p>Select an issue to view details</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-rubik font-semibold text-white">{selectedIssue.title}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        PRIORITIES.find(p => p.value === selectedIssue.priority)?.color
                      }`}>
                        {selectedIssue.priority}
                      </span>
                      <span className="text-sm text-text-muted capitalize">{selectedIssue.issue_type}</span>
                    </div>
                  </div>
                  <Select value={selectedIssue.status} onValueChange={(v) => handleStatusChange(selectedIssue.id, v)}>
                    <SelectTrigger className={`w-36 ${STATUSES.find(s => s.value === selectedIssue.status)?.color}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-white/10">
                      {STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-surface-highlight rounded-xl">
                  <p className="text-text-secondary whitespace-pre-wrap">{selectedIssue.description}</p>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-text-muted" />
                    <span className="text-text-secondary">Reported by:</span>
                    <span className="text-white">{getUserName(selectedIssue.reported_by)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-text-muted" />
                    <span className="text-text-muted">
                      {formatDistanceToNow(new Date(selectedIssue.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="border-t border-white/5 pt-6">
                  <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comments ({comments.length})
                  </h3>
                  
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {comments.map(comment => (
                      <div key={comment.id} className="p-3 bg-surface-highlight rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{getUserName(comment.user_id)}</span>
                          <span className="text-xs text-text-muted">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary">{comment.content}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-surface-highlight border-white/10"
                    />
                    <Button type="submit" className="bg-brand-teal text-black">Post</Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default IssuesPage;
