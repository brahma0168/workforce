import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../App';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Moon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-rubik font-bold text-white flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-brand-teal" />
            Settings
          </h1>
          <p className="text-text-secondary mt-1">Manage your account preferences</p>
        </div>

        {/* Profile Section */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-brand-teal" />
            <h2 className="font-rubik font-semibold text-white">Profile</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-teal to-brand-mint flex items-center justify-center text-black text-2xl font-bold">
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white">{user?.first_name} {user?.last_name}</h3>
              <p className="text-text-secondary">{user?.email}</p>
              <p className="text-sm text-text-muted capitalize mt-1">{user?.role?.replace('_', ' ')}</p>
            </div>
            <Button variant="outline">Edit Profile</Button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-brand-teal" />
            <h2 className="font-rubik font-semibold text-white">Notification Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-xl">
              <div>
                <p className="font-medium text-white">HRM Notifications</p>
                <p className="text-sm text-text-secondary">Leave requests, attendance, escalations</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-xl">
              <div>
                <p className="font-medium text-white">Project Notifications</p>
                <p className="text-sm text-text-secondary">Task assignments, project updates</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-xl">
              <div>
                <p className="font-medium text-white">Vault Notifications</p>
                <p className="text-sm text-text-secondary">Access requests, credential updates</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-xl">
              <div>
                <p className="font-medium text-white">Issue Notifications</p>
                <p className="text-sm text-text-secondary">Issue assignments, status changes</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-brand-teal" />
            <h2 className="font-rubik font-semibold text-white">Security</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-xl">
              <div>
                <p className="font-medium text-white">Change Password</p>
                <p className="text-sm text-text-secondary">Update your account password</p>
              </div>
              <Button variant="outline">Change</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-xl">
              <div>
                <p className="font-medium text-white">Active Sessions</p>
                <p className="text-sm text-text-secondary">Manage your logged in devices</p>
              </div>
              <Button variant="outline">View All</Button>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-brand-teal" />
            <h2 className="font-rubik font-semibold text-white">Appearance</h2>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-xl">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-text-secondary" />
              <div>
                <p className="font-medium text-white">Dark Mode</p>
                <p className="text-sm text-text-secondary">Signal uses dark mode only for optimal viewing</p>
              </div>
            </div>
            <Switch checked disabled />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
