import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { api, useAuth } from '../App';
import { 
  FileText, Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { format } from 'date-fns';

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'earned', label: 'Earned Leave' },
  { value: 'compensatory', label: 'Compensatory Off' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'loss_of_pay', label: 'Loss of Pay' },
];

const LeavesPage = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    leave_type: 'casual',
    start_date: '',
    end_date: '',
    reason: '',
    half_day: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        api.get('/hrm/leaves/my'),
        api.get('/hrm/leaves/balance')
      ]);
      setLeaves(leavesRes.data);
      setBalance(balanceRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/hrm/leaves', formData);
      toast.success('Leave request submitted');
      setLeaves([response.data, ...leaves]);
      setShowAddModal(false);
      setFormData({
        leave_type: 'casual',
        start_date: '',
        end_date: '',
        reason: '',
        half_day: false
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit leave request');
    }
  };

  const handleCancelLeave = async (leaveId) => {
    try {
      await api.put(`/hrm/leaves/${leaveId}/cancel`);
      toast.success('Leave request cancelled');
      setLeaves(leaves.map(l => l.id === leaveId ? { ...l, status: 'cancelled' } : l));
      fetchData(); // Refresh balance
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel leave');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-brand-mint" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-brand-mint/10 text-brand-mint';
      case 'rejected':
        return 'bg-red-500/10 text-red-400';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-400';
      default:
        return 'bg-yellow-500/10 text-yellow-400';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-rubik font-bold text-white flex items-center gap-3">
              <FileText className="w-7 h-7 text-brand-teal" />
              Leave Management
            </h1>
            <p className="text-text-secondary mt-1">Request and track your leaves</p>
          </div>
          
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold shadow-glow-button" data-testid="request-leave-btn">
                <Plus className="w-4 h-4 mr-2" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-white/10 max-w-md">
              <DialogHeader>
                <DialogTitle className="font-rubik text-white">Request Leave</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateLeave} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Leave Type</label>
                  <Select value={formData.leave_type} onValueChange={(v) => setFormData({...formData, leave_type: v})}>
                    <SelectTrigger className="bg-surface-highlight border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-white/10">
                      {LEAVE_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Start Date</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value, end_date: formData.end_date || e.target.value})}
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
                      required
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.half_day}
                    onCheckedChange={(checked) => setFormData({...formData, half_day: checked})}
                  />
                  <span className="text-sm text-text-secondary">Half day leave</span>
                </label>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Reason</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-highlight border border-white/10 rounded-xl text-white placeholder-text-muted focus:border-brand-teal outline-none resize-none"
                    rows={3}
                    placeholder="Reason for leave..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-brand-teal text-black">Submit Request</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Leave Balance Cards */}
        {balance && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(balance.balances || {}).map(([type, days]) => (
              <div key={type} className="bg-surface border border-white/5 rounded-xl p-4">
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
                  {type.replace('_', ' ')}
                </p>
                <p className="font-mono text-2xl font-bold text-white">{days}</p>
                <p className="text-xs text-text-muted">days</p>
              </div>
            ))}
          </div>
        )}

        {/* Leave Requests Table */}
        <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="font-rubik font-semibold text-white">Leave Requests</h2>
          </div>
          
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Type</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Duration</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Reason</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                leaves.map(leave => (
                  <tr key={leave.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`leave-row-${leave.id}`}>
                    <td className="px-6 py-4">
                      <span className="capitalize text-white">{leave.leave_type.replace('_', ' ')}</span>
                      {leave.half_day && (
                        <span className="ml-2 px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400">Half Day</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Calendar className="w-4 h-4" />
                        <span className="font-mono text-sm">
                          {leave.start_date}
                          {leave.start_date !== leave.end_date && ` - ${leave.end_date}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary max-w-xs truncate">{leave.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(leave.status)}`}>
                        {getStatusIcon(leave.status)}
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(leave.status === 'pending' || leave.status === 'approved') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelLeave(leave.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Cancel
                        </Button>
                      )}
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

export default LeavesPage;
