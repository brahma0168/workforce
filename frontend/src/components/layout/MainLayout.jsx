import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, api } from '../../App';
import {
  LayoutDashboard, Users, Briefcase, CheckSquare, Shield,
  Bell, AlertTriangle, Calendar, Settings, LogOut, Menu, X,
  RefreshCw, Wifi, ChevronDown, Clock, FileText
} from 'lucide-react';
import { toast } from 'sonner';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Fetch notification count
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications/unread-count');
        setNotificationCount(response.data.count);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Simulate sync action
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Data synchronized successfully');
    } catch (error) {
      toast.error('Sync failed');
    }
    setSyncing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard', minRole: 1 },
    { icon: Users, label: 'Employees', path: '/employees', minRole: 2, badge: null },
    { icon: Briefcase, label: 'Projects', path: '/projects', minRole: 1 },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks', minRole: 1 },
    { icon: Shield, label: 'Vault', path: '/vault', minRole: 1 },
    { icon: Clock, label: 'Attendance', path: '/attendance', minRole: 1 },
    { icon: FileText, label: 'Leaves', path: '/leaves', minRole: 1 },
    { icon: AlertTriangle, label: 'Issues', path: '/issues', minRole: 1 },
    { icon: Calendar, label: 'Calendar', path: '/calendar', minRole: 1 },
  ];

  const filteredNav = navItems.filter(item => user?.role_level >= item.minRole);

  return (
    <div className="min-h-screen bg-app-bg flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-surface border-r border-white/5 flex flex-col transition-all duration-300 fixed h-full z-20`}>
        {/* Logo */}
        <div className="p-4 border-b border-white/5">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img 
              src="/favicon.png" 
              alt="Workforce" 
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            />
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-rubik font-bold text-white tracking-tight">WORKFORCE</h1>
                <p className="text-[10px] text-text-secondary tracking-widest uppercase">BY PROFITCAST</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                  isActive 
                    ? 'bg-brand-teal/10 text-brand-teal' 
                    : 'text-text-secondary hover:bg-white/5 hover:text-white'
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                {sidebarOpen && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-brand-orange text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-teal rounded-r-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-white/5">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              location.pathname === '/settings' 
                ? 'bg-brand-teal/10 text-brand-teal' 
                : 'text-text-secondary hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" strokeWidth={1.5} />
            {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        {/* Header */}
        <header className="h-16 bg-surface/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
              data-testid="toggle-sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync Button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-brand-teal/10 text-brand-teal rounded-xl hover:bg-brand-teal/20 transition-colors"
              data-testid="sync-button"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Sync</span>
            </button>

            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-xl hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
              data-testid="notifications-button"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-text-secondary capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors"
                data-testid="logout-button"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
