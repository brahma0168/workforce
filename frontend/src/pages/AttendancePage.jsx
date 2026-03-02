import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { api, useAuth } from '../App';
import { 
  Clock, LogIn, LogOut, Calendar, AlertTriangle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { format, formatDuration, intervalToDuration } from 'date-fns';

const AttendancePage = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/hrm/attendance/my');
      setAttendance(response.data);
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayAtt = response.data.find(a => a.date === today);
      setTodayRecord(todayAtt);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const response = await api.post('/hrm/attendance/checkin', {});
      toast.success('Checked in successfully!');
      setTodayRecord(response.data);
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingIn(true);
    try {
      const response = await api.post('/hrm/attendance/checkout', {});
      toast.success('Checked out successfully!');
      setTodayRecord(response.data);
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Check-out failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const isCheckedIn = () => {
    if (!todayRecord || !todayRecord.entries || todayRecord.entries.length === 0) return false;
    const lastEntry = todayRecord.entries[todayRecord.entries.length - 1];
    return lastEntry.check_in && !lastEntry.check_out;
  };

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-rubik font-bold text-white flex items-center gap-3">
              <Clock className="w-7 h-7 text-brand-teal" />
              Attendance
            </h1>
            <p className="text-text-secondary mt-1">Track your work hours</p>
          </div>
        </div>

        {/* Today's Status Card */}
        <div className="bg-surface border border-white/5 rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-rubik font-semibold text-white text-lg mb-2">
                Today - {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </h2>
              {todayRecord ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      todayRecord.is_late ? 'bg-brand-orange/10 text-brand-orange' : 'bg-brand-mint/10 text-brand-mint'
                    }`}>
                      {todayRecord.is_late ? 'Late' : 'On Time'}
                    </span>
                    {todayRecord.has_overtime && (
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-500/10 text-purple-400">
                        Overtime
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary">
                    Total hours today: <span className="font-mono text-white">{formatHours(todayRecord.total_hours || 0)}</span>
                  </p>
                </div>
              ) : (
                <p className="text-text-secondary">No attendance record for today</p>
              )}
            </div>
            
            <div className="flex flex-col items-center gap-3">
              {isCheckedIn() ? (
                <Button
                  onClick={handleCheckOut}
                  disabled={checkingIn}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 px-8 py-6"
                  data-testid="checkout-btn"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  {checkingIn ? 'Processing...' : 'Check Out'}
                </Button>
              ) : (
                <Button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold shadow-glow-button px-8 py-6"
                  data-testid="checkin-btn"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  {checkingIn ? 'Processing...' : 'Check In'}
                </Button>
              )}
              <p className="text-xs text-text-muted">
                {isCheckedIn() ? 'Currently checked in' : 'Click to start your day'}
              </p>
            </div>
          </div>

          {/* Today's Entries */}
          {todayRecord && todayRecord.entries && todayRecord.entries.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <h3 className="font-medium text-white mb-4">Today's Entries</h3>
              <div className="space-y-2">
                {todayRecord.entries.map((entry, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-surface-highlight rounded-lg">
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4 text-brand-mint" />
                      <span className="font-mono text-sm text-white">
                        {entry.check_in ? format(new Date(entry.check_in), 'hh:mm a') : '-'}
                      </span>
                    </div>
                    <span className="text-text-muted">→</span>
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span className="font-mono text-sm text-white">
                        {entry.check_out ? format(new Date(entry.check_out), 'hh:mm a') : 'Active'}
                      </span>
                    </div>
                    {entry.note && (
                      <span className="text-xs text-text-muted ml-auto">{entry.note}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attendance History */}
        <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="font-rubik font-semibold text-white">Attendance History</h2>
          </div>
          
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Date</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">First In</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Last Out</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Total Hours</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-4">Status</th>
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
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                attendance.map(record => {
                  const firstIn = record.entries?.[0]?.check_in;
                  const lastOut = record.entries?.[record.entries.length - 1]?.check_out;
                  
                  return (
                    <tr key={record.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-white">{record.date}</td>
                      <td className="px-6 py-4 font-mono text-sm text-text-secondary">
                        {firstIn ? format(new Date(firstIn), 'hh:mm a') : '-'}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-text-secondary">
                        {lastOut ? format(new Date(lastOut), 'hh:mm a') : '-'}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-white">{formatHours(record.total_hours || 0)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {record.is_late && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-brand-orange/10 text-brand-orange">Late</span>
                          )}
                          {record.has_overtime && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/10 text-purple-400">OT</span>
                          )}
                          {!record.is_late && !record.has_overtime && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-brand-mint/10 text-brand-mint">Normal</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default AttendancePage;
