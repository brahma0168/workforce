import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth, api } from '../App';
import { 
  CheckCircle, Clock, AlertTriangle, Heart, BarChart3, 
  ChevronRight, Calendar as CalendarIcon, Users, Briefcase,
  ArrowUpRight, ArrowDownRight, TrendingUp
} from 'lucide-react';
import { format, subDays } from 'date-fns';

// Meta and Google Icons
const MetaIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-meta-blue flex items-center justify-center">
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
    </svg>
  </div>
);

const GoogleIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  </div>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const styles = {
    live: 'status-live',
    paused: 'status-paused',
    alert: 'status-alert',
    good: 'status-good'
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, value, label, subLabel, status, color = 'teal', trend }) => {
  const colorClasses = {
    teal: 'text-brand-teal bg-brand-teal/10 border-brand-teal/20',
    mint: 'text-brand-mint bg-brand-mint/10 border-brand-mint/20',
    orange: 'text-brand-orange bg-brand-orange/10 border-brand-orange/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {status && <StatusBadge status={status} />}
      </div>
      <div className="font-mono text-4xl font-bold text-white mb-1">{value}</div>
      <div className="text-text-secondary text-sm mb-2">{label}</div>
      {subLabel && (
        <div className="flex items-center gap-3 text-xs">
          {subLabel.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
              <span className="text-text-muted">{item.text}</span>
            </span>
          ))}
        </div>
      )}
      {trend && (
        <div className={`flex items-center gap-1 text-sm mt-2 ${trend > 0 ? 'text-brand-mint' : 'text-red-400'}`}>
          {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
};

// Platform Card Component
const PlatformCard = ({ icon, name, totalAccounts, stats, onViewPerformance }) => (
  <div className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h3 className="font-rubik font-semibold text-white">{name}</h3>
          <p className="text-sm text-text-secondary">{totalAccounts} total accounts</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-text-muted" />
    </div>
    
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, i) => (
        <div key={i} className={`rounded-xl p-4 text-center ${stat.bgClass}`}>
          <div className={`font-mono text-2xl font-bold ${stat.textClass}`}>{stat.value}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
    
    <div className="flex gap-2 mt-4">
      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-sm text-text-secondary hover:bg-white/10 hover:text-white transition-colors">
        <BarChart3 className="w-4 h-4" />
        View detailed performance
      </button>
      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-sm text-text-secondary hover:bg-white/10 hover:text-white transition-colors">
        <TrendingUp className="w-4 h-4" />
        Campaign analytics
      </button>
    </div>
  </div>
);

// Account Alert Card
const AccountAlertCard = ({ name, campaigns, percentage, platform }) => (
  <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-xl">
    <div className="flex items-center gap-3">
      {platform === 'meta' ? (
        <div className="w-8 h-8 rounded-lg bg-meta-blue/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-meta-blue" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
          </svg>
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-google-blue/20 flex items-center justify-center">
          <span className="text-google-blue font-bold text-sm">G</span>
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-white">{name}</p>
        <p className="text-xs text-text-muted">{campaigns} campaigns</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
        percentage >= 50 ? 'bg-brand-mint/10 text-brand-mint' : 'bg-brand-orange/10 text-brand-orange'
      }`}>
        {percentage}%
      </span>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [overviewRes, statsRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/stats')
        ]);
        setStats({ ...overviewRes.data, ...statsRes.data });
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const today = new Date();
  const startDate = subDays(today, parseInt(dateRange));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-rubik font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-brand-teal" />
              Account Health Dashboard
            </h1>
            <p className="text-text-secondary mt-1">Monitor account status across all platforms</p>
          </div>
          
          <div className="flex items-center gap-2 bg-surface border border-white/10 rounded-xl px-4 py-2">
            <CalendarIcon className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-white">Last {dateRange} Days</span>
            <span className="text-xs text-text-muted">
              ({format(startDate, 'MMM d')} - {format(today, 'MMM d')})
            </span>
            <ChevronRight className="w-4 h-4 text-text-muted rotate-90" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="stats-grid">
          <StatCard
            icon={CheckCircle}
            value={stats.employees || 64}
            label="Total Active Accounts"
            status="live"
            color="teal"
            subLabel={[
              { text: '46 Meta', color: 'bg-meta-blue' },
              { text: '18 Google', color: 'bg-google-blue' }
            ]}
          />
          <StatCard
            icon={Clock}
            value={5}
            label="Recently Inactive"
            status="paused"
            color="orange"
            subLabel={[
              { text: '3 Meta', color: 'bg-meta-blue' },
              { text: '2 Google', color: 'bg-google-blue' }
            ]}
          />
          <StatCard
            icon={AlertTriangle}
            value={stats.issues_open || 2}
            label="Need Attention"
            status="alert"
            color="red"
            subLabel={[
              { text: '2 Meta', color: 'bg-meta-blue' },
              { text: '0 Google', color: 'bg-google-blue' }
            ]}
          />
          <StatCard
            icon={Heart}
            value={4}
            label="Healthy Accounts"
            status="good"
            color="mint"
            subLabel={[
              { text: '4 Meta', color: 'bg-meta-blue' },
              { text: '0 Google', color: 'bg-google-blue' }
            ]}
          />
        </div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlatformCard
            icon={<MetaIcon />}
            name="Meta Ads"
            totalAccounts={67}
            stats={[
              { value: 46, label: 'Active', bgClass: 'bg-brand-teal/10', textClass: 'text-brand-teal' },
              { value: 3, label: 'Inactive', bgClass: 'bg-yellow-500/10', textClass: 'text-yellow-400' },
              { value: 2, label: 'Attention', bgClass: 'bg-red-500/10', textClass: 'text-red-400' },
            ]}
          />
          <PlatformCard
            icon={<GoogleIcon />}
            name="Google Ads"
            totalAccounts={20}
            stats={[
              { value: 18, label: 'Active', bgClass: 'bg-brand-teal/10', textClass: 'text-brand-teal' },
              { value: 2, label: 'Inactive', bgClass: 'bg-yellow-500/10', textClass: 'text-yellow-400' },
              { value: 0, label: 'Attention', bgClass: 'bg-red-500/10', textClass: 'text-red-400' },
            ]}
          />
        </div>

        {/* Accounts Needing Attention */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h2 className="text-lg font-rubik font-semibold text-white">Accounts Needing Attention</h2>
            </div>
            <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm font-medium">
              2 accounts
            </span>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium">
              All (2)
            </button>
            <button className="px-4 py-2 bg-transparent text-text-secondary hover:bg-white/5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-meta-blue flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">f</span>
              </div>
              Meta (2)
            </button>
            <button className="px-4 py-2 bg-transparent text-text-secondary hover:bg-white/5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <span className="text-google-blue font-bold">G</span>
              Google (0)
            </button>
          </div>
          
          {/* Account List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AccountAlertCard 
              name="Motofence Bengaluru" 
              campaigns={1} 
              percentage={50} 
              platform="meta"
            />
            <AccountAlertCard 
              name="Aavaranaa Chennai" 
              campaigns={1} 
              percentage={55} 
              platform="meta"
            />
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/projects" className="bg-surface border border-white/5 rounded-xl p-4 hover:border-brand-teal/30 transition-all group">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-brand-teal" />
              <div>
                <p className="font-mono text-xl font-bold text-white">{stats.projects || 0}</p>
                <p className="text-xs text-text-secondary">Active Projects</p>
              </div>
            </div>
          </Link>
          <Link to="/tasks" className="bg-surface border border-white/5 rounded-xl p-4 hover:border-brand-teal/30 transition-all group">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-brand-mint" />
              <div>
                <p className="font-mono text-xl font-bold text-white">{stats.tasks_pending || 0}</p>
                <p className="text-xs text-text-secondary">Pending Tasks</p>
              </div>
            </div>
          </Link>
          <Link to="/employees" className="bg-surface border border-white/5 rounded-xl p-4 hover:border-brand-teal/30 transition-all group">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-brand-orange" />
              <div>
                <p className="font-mono text-xl font-bold text-white">{stats.employees || 0}</p>
                <p className="text-xs text-text-secondary">Team Members</p>
              </div>
            </div>
          </Link>
          <Link to="/vault" className="bg-surface border border-white/5 rounded-xl p-4 hover:border-brand-teal/30 transition-all group">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-400" />
              <div>
                <p className="font-mono text-xl font-bold text-white">{stats.vault_folders || 0}</p>
                <p className="text-xs text-text-secondary">Vault Folders</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
