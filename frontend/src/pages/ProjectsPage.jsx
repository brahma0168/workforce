import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { api } from '../App';
import { 
  Briefcase, Plus, Search, Filter, MoreVertical, Users,
  Calendar, DollarSign, ChevronRight, Clock, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';

const SERVICE_OPTIONS = [
  { key: 'gmb', name: 'Google My Business' },
  { key: 'meta_ads', name: 'Meta Ads' },
  { key: 'google_ads', name: 'Google Ads' },
  { key: 'seo', name: 'SEO' },
  { key: 'amazon_ads', name: 'Amazon Ads' },
  { key: 'amazon_seo', name: 'Amazon SEO' },
  { key: 'linkedin_ads', name: 'LinkedIn Ads' },
  { key: 'graphic_design', name: 'Graphic Design' },
  { key: 'smm', name: 'Social Media Management' },
  { key: 'web_development', name: 'Web Development' },
  { key: 'email_marketing', name: 'Email Marketing' },
  { key: 'whatsapp_marketing', name: 'WhatsApp Marketing' },
  { key: 'video_marketing', name: 'Video Marketing' },
  { key: 'personal_branding', name: 'Personal Branding' },
  { key: 'influencer_outreach', name: 'Influencer Outreach' },
  { key: 'personal_assistance', name: 'Personal Assistance' },
];

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    client_name: '',
    description: '',
    budget: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    services: [],
    team_members: [],
    tags: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        api.get('/pms/projects'),
        api.get('/users').catch(() => ({ data: [] }))
      ]);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/pms/projects', {
        ...formData,
        budget: Math.round(parseFloat(formData.budget || 0) * 100) // Convert to paise
      });
      toast.success('Project created successfully');
      setProjects([response.data, ...projects]);
      setShowAddModal(false);
      setFormData({
        name: '',
        client_name: '',
        description: '',
        budget: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        services: [],
        team_members: [],
        tags: []
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create project');
    }
  };

  const toggleService = (serviceKey) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceKey)
        ? prev.services.filter(s => s !== serviceKey)
        : [...prev.services, serviceKey]
    }));
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      onboarding: 'bg-blue-500/10 text-blue-400',
      active: 'bg-brand-mint/10 text-brand-mint',
      in_progress: 'bg-brand-teal/10 text-brand-teal',
      on_hold: 'bg-yellow-500/10 text-yellow-400',
      completed: 'bg-purple-500/10 text-purple-400',
      archived: 'bg-gray-500/10 text-gray-400'
    };
    return colors[status] || 'bg-gray-500/10 text-gray-400';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-rubik font-bold text-white flex items-center gap-3">
              <Briefcase className="w-7 h-7 text-brand-teal" />
              Projects
            </h1>
            <p className="text-text-secondary mt-1">Manage client projects and campaigns</p>
          </div>
          
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold shadow-glow-button" data-testid="add-project-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-rubik text-white">Create New Project</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Project Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                      placeholder="e.g., Q1 Marketing Campaign"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Client Name</label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                      placeholder="e.g., Acme Corp"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-highlight border border-white/10 rounded-xl text-white placeholder-text-muted focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 transition-all outline-none resize-none"
                    rows={3}
                    placeholder="Project description..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Budget (INR)</label>
                    <Input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Start Date</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">End Date</label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Services (Tasks auto-generated)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-surface-highlight rounded-xl border border-white/10">
                    {SERVICE_OPTIONS.map(service => (
                      <label key={service.key} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg">
                        <Checkbox
                          checked={formData.services.includes(service.key)}
                          onCheckedChange={() => toggleService(service.key)}
                        />
                        <span className="text-sm text-white">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-brand-teal text-black">Create Project</Button>
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
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface border-white/10"
              data-testid="search-projects"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-surface border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-white/10">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-surface border border-white/5 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-white/5 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-white/5 rounded w-1/2 mb-6"></div>
                <div className="h-2 bg-white/5 rounded-full w-full"></div>
              </div>
            ))
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-3 bg-surface border border-white/5 rounded-2xl p-12 text-center">
              <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No projects found</h3>
              <p className="text-text-secondary">Create your first project to get started</p>
            </div>
          ) : (
            filteredProjects.map(project => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-brand-teal/30 transition-all group"
                data-testid={`project-card-${project.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-rubik font-semibold text-white group-hover:text-brand-teal transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-text-secondary">{project.client_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-text-secondary">Progress</span>
                    <span className="text-brand-teal font-mono">{project.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-surface-highlight rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-teal to-brand-mint transition-all duration-500"
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-text-muted">
                      <Users className="w-4 h-4" />
                      {project.team_members?.length || 0}
                    </span>
                    <span className="flex items-center gap-1.5 text-text-muted">
                      <CheckCircle className="w-4 h-4" />
                      {project.services?.length || 0} services
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-teal transition-colors" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ProjectsPage;
