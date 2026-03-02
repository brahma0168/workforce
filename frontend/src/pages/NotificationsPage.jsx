import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { api } from '../App';
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';

const NOTIFICATION_TYPES = {
  hrm: { label: 'HRM', color: 'bg-purple-500/10 text-purple-400' },
  pms: { label: 'Project', color: 'bg-brand-teal/10 text-brand-teal' },
  vault: { label: 'Vault', color: 'bg-brand-mint/10 text-brand-mint' },
  issue: { label: 'Issue', color: 'bg-brand-orange/10 text-brand-orange' },
  automation: { label: 'Automation', color: 'bg-blue-500/10 text-blue-400' },
  calendar: { label: 'Calendar', color: 'bg-yellow-500/10 text-yellow-400' },
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const filteredNotifications = notifications.filter(n => 
    filterType === 'all' || n.type === filterType
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-rubik font-bold text-white flex items-center gap-3">
              <Bell className="w-7 h-7 text-brand-teal" />
              Notifications
            </h1>
            <p className="text-text-secondary mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead} variant="outline">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filterType === 'all' ? 'bg-brand-teal/10 text-brand-teal' : 'bg-white/5 text-text-secondary hover:text-white'
            }`}
          >
            All
          </button>
          {Object.entries(NOTIFICATION_TYPES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filterType === key ? value.color : 'bg-white/5 text-text-secondary hover:text-white'
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="bg-surface border border-white/5 rounded-2xl divide-y divide-white/5">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
              <p className="text-text-secondary">No notifications</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors ${
                  !notification.is_read ? 'bg-brand-teal/5' : ''
                }`}
                data-testid={`notification-${notification.id}`}
              >
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  notification.is_read ? 'bg-transparent' : 'bg-brand-teal'
                }`}></div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      NOTIFICATION_TYPES[notification.type]?.color || 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {NOTIFICATION_TYPES[notification.type]?.label || notification.type}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <h4 className="font-medium text-white">{notification.title}</h4>
                  <p className="text-sm text-text-secondary mt-1">{notification.message}</p>
                </div>
                
                {!notification.is_read && (
                  <button
                    onClick={() => handleMarkRead(notification.id)}
                    className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-brand-teal transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default NotificationsPage;
