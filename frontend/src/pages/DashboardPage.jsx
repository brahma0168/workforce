import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth, api } from '../App';
import { 
  Users, Briefcase, CheckSquare, Shield, AlertTriangle,
  Clock, FileText, Calendar, ArrowUpRight, TrendingUp,
  CheckCircle, XCircle, Hourglass, UserCheck, UserX, Activity
} from 'lucide-react';
import { format } from 'date-fns';

// Quick Stat Card
const QuickStatCard = ({ icon: Icon, value, label, trend, color = 'teal', to }) => {
  const colorClasses = {
    teal: 'text-brand-teal bg-brand-teal/10',
    mint: 'text-brand-mint bg-brand-mint/10',
    orange: 'text-brand-orange bg-brand-orange/10',
    purple: 'text-purple-400 bg-purple-500/10',
    red: 'text-red-400 bg-red-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
  };

  const content = (
    <div className="bg-surface border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-brand-mint' : 'text-red-400'}`}>
            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="font-mono text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-text-secondary mt-1">{label}</p>
      </div>
      {to && (
        <div className="mt-4 flex items-center gap-1 text-brand-teal text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <span>View details</span>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return content;
};

// Module Summary Card
const ModuleSummaryCard = ({ icon: Icon, title, items, to, color = 'teal' }) => {
  const colorClasses = {
    teal: 'text-brand-teal bg-brand-teal/10 border-brand-teal/20',
    mint: 'text-brand-mint bg-brand-mint/10 border-brand-mint/20',
    orange: 'text-brand-orange bg-brand-orange/10 border-brand-orange/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-rubik font-semibold text-white">{title}</h3>
        </div>
        <Link to={to} className="text-sm text-brand-teal hover:text-brand-mint transition-colors flex items-center gap-1">
          View All
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-surface-highlight rounded-lg">
            <div className="flex items-center gap-3">
              {item.icon && <item.icon className={`w-4 h-4 ${item.iconColor || 'text-text-muted'}`} />}
              <span className="text-sm text-text-secondary">{item.label}</span>
            </div>
            <span className={`font-mono text-lg font-bold ${item.valueColor || 'text-white'}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Activity Item
const ActivityItem = ({ icon: Icon, title, description, time, color = 'teal' }) => {
  const colorClasses = {
    teal: 'text-brand-teal bg-brand-teal/10',
    mint: 'text-brand-mint bg-brand-mint/10',
    orange: 'text-brand-orange bg-brand-orange/10',
    red: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-white/[0.02] rounded-lg transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-sm text-text-secondary truncate">{description}</p>
      </div>
      <span className="text-xs text-text-muted whitespace-nowrap">{time}</span>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [overview, setOverview] = useState({});

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [overviewRes, statsRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/stats')
        ]);
        setOverview(overviewRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-10 h-10 border-2 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-rubik font-bold text-white">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.first_name}!
            </h1>
            <p className="text-text-secondary mt-1">{today}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/10 rounded-xl">
            <Activity className="w-4 h-4 text-brand-mint" />
            <span className="text-sm text-text-secondary">System Status:</span>
            <span className="text-sm text-brand-mint font-medium">Operational</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" data-testid="stats-grid">
          <QuickStatCard
            icon={Users}
            value={stats.employees || 0}
            label="Team Members"
            color="teal"
            to="/employees"
          />
          <QuickStatCard
            icon={Briefcase}
            value={stats.projects || 0}
            label="Active Projects"
            color="mint"
            to="/projects"
          />
          <QuickStatCard
            icon={CheckSquare}
            value={stats.tasks_pending || 0}
            label="Pending Tasks"
            color="orange"
            to="/tasks"
          />
          <QuickStatCard
            icon={AlertTriangle}
            value={stats.issues_open || 0}
            label="Open Issues"
            color="red"
            to="/issues"
          />
          <QuickStatCard
            icon={Shield}
            value={stats.vault_folders || 0}
            label="Vault Folders"
            color="purple"
            to="/vault"
          />
          <QuickStatCard
            icon={Clock}
            value={overview.attendance_this_month || 0}
            label="Days Present"
            color="blue"
            to="/attendance"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* HRM Summary */}
          <ModuleSummaryCard
            icon={Users}
            title="Team Overview"
            color="teal"
            to="/employees"
            items={[
              { label: 'Active Employees', value: stats.employees || 0, icon: UserCheck, iconColor: 'text-brand-mint' },
              { label: 'Pending Leave Requests', value: overview.pending_leave_approvals || 0, icon: FileText, iconColor: 'text-yellow-400' },
              { label: 'Open Escalations', value: overview.escalation_backlog || 0, icon: AlertTriangle, iconColor: 'text-brand-orange' },
            ]}
          />

          {/* PMS Summary */}
          <ModuleSummaryCard
            icon={Briefcase}
            title="Project Status"
            color="mint"
            to="/projects"
            items={[
              { label: 'Active Projects', value: stats.projects || 0, icon: Briefcase, iconColor: 'text-brand-teal' },
              { label: 'Tasks In Progress', value: overview.team_tasks?.active || stats.tasks_pending || 0, icon: Hourglass, iconColor: 'text-brand-mint' },
              { label: 'Overdue Tasks', value: overview.team_tasks?.overdue || 0, icon: XCircle, iconColor: 'text-red-400' },
            ]}
          />

          {/* Issues & Vault Summary */}
          <ModuleSummaryCard
            icon={Shield}
            title="Security & Issues"
            color="purple"
            to="/vault"
            items={[
              { label: 'Vault Folders', value: stats.vault_folders || 0, icon: Shield, iconColor: 'text-purple-400' },
              { label: 'Open Issues', value: stats.issues_open || 0, icon: AlertTriangle, iconColor: 'text-red-400' },
              { label: 'Automation Rules', value: stats.automation_rules || 0, icon: Activity, iconColor: 'text-blue-400' },
            ]}
          />
        </div>

        {/* My Tasks & Leave Balance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tasks Summary */}
          <div className="bg-surface border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-rubik font-semibold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-brand-teal" />
                My Tasks
              </h3>
              <Link to="/tasks" className="text-sm text-brand-teal hover:text-brand-mint transition-colors">
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-highlight rounded-xl text-center">
                <p className="font-mono text-3xl font-bold text-white">{overview.my_tasks?.total || 0}</p>
                <p className="text-sm text-text-secondary mt-1">Total Assigned</p>
              </div>
              <div className="p-4 bg-surface-highlight rounded-xl text-center">
                <p className="font-mono text-3xl font-bold text-brand-mint">{overview.my_tasks?.completed || 0}</p>
                <p className="text-sm text-text-secondary mt-1">Completed</p>
              </div>
            </div>
            
            {overview.my_tasks?.total > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-secondary">Completion Rate</span>
                  <span className="text-brand-teal font-mono">
                    {Math.round((overview.my_tasks?.completed / overview.my_tasks?.total) * 100 || 0)}%
                  </span>
                </div>
                <div className="h-2 bg-surface-highlight rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-teal to-brand-mint transition-all duration-500"
                    style={{ width: `${(overview.my_tasks?.completed / overview.my_tasks?.total) * 100 || 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Leave Balance */}
          {overview.leave_balance && (
            <div className="bg-surface border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-rubik font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-teal" />
                  Leave Balance ({new Date().getFullYear()})
                </h3>
                <Link to="/leaves" className="text-sm text-brand-teal hover:text-brand-mint transition-colors">
                  Request Leave
                </Link>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(overview.leave_balance.balances || {}).slice(0, 6).map(([type, days]) => (
                  <div key={type} className="p-3 bg-surface-highlight rounded-lg text-center">
                    <p className="font-mono text-xl font-bold text-white">{days}</p>
                    <p className="text-xs text-text-muted capitalize mt-1">{type.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-rubik font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-teal" />
              Recent Notifications
            </h3>
            <Link to="/notifications" className="text-sm text-brand-teal hover:text-brand-mint transition-colors">
              View All
            </Link>
          </div>
          
          <div className="divide-y divide-white/5">
            {(overview.recent_notifications || []).length > 0 ? (
              overview.recent_notifications.map((notif, index) => (
                <ActivityItem
                  key={notif.id || index}
                  icon={notif.type === 'hrm' ? Users : notif.type === 'pms' ? Briefcase : notif.type === 'vault' ? Shield : AlertTriangle}
                  title={notif.title}
                  description={notif.message}
                  time="Recently"
                  color={notif.type === 'hrm' ? 'teal' : notif.type === 'pms' ? 'mint' : notif.type === 'vault' ? 'orange' : 'red'}
                />
              ))
            ) : (
              <div className="py-8 text-center text-text-secondary">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No new notifications</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/attendance" className="bg-surface border border-white/5 rounded-xl p-4 hover:border-brand-teal/30 transition-all text-center group">
            <Clock className="w-8 h-8 text-brand-teal mx-auto mb-2" />
            <p className="text-sm font-medium text-white group-hover:text-brand-teal transition-colors">Check In/Out</p>
          </Link>
          <Link to="/leaves" className="bg-surface border border-white/5 rounded-xl p-4 hover:border-brand-teal/30 transition-all text-center group">
            <FileText className="w-8 h-8 text-brand-mint mx-auto mb-2" />
            <p className="text-sm font-medium text-white group-hover:text-brand-mint transition-colors">Request Leave</p>
          </Link>
          <Link to="/issues" className="bg-surface border border-white/5 rounded-xl p-4 hover:border-brand-teal/30 transition-all text-center group">
            <AlertTriangle className="w-8 h-8 text-brand-orange mx-auto mb-2" />
            <p className="text-sm font-medium text-white group-hover:text-brand-orange transition-colors">Report Issue</p>
          </Link>
          <Link to="/calendar" className="bg-surface border border-white/5 rounded-xl p-4 hover:border-brand-teal/30 transition-all text-center group">
            <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">View Calendar</p>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
