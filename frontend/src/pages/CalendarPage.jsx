import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { api } from '../App';
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  Clock, MapPin, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';

const EVENT_TYPES = [
  { value: 'personal', label: 'Personal', color: 'bg-blue-500' },
  { value: 'meeting', label: 'Meeting', color: 'bg-brand-orange' },
  { value: 'task', label: 'Task', color: 'bg-brand-teal' },
  { value: 'leave', label: 'Leave', color: 'bg-brand-mint' },
  { value: 'milestone', label: 'Milestone', color: 'bg-purple-500' },
  { value: 'holiday', label: 'Holiday', color: 'bg-gray-500' },
];

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    all_day: false,
    location: '',
    is_private: false,
    event_type: 'personal',
    participants: [],
    reminder_minutes: []
  });

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
    try {
      const response = await api.get(`/calendar/events?start_date=${start}&end_date=${end}`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/calendar/events', formData);
      toast.success('Event created successfully');
      setEvents([...events, response.data]);
      setShowAddModal(false);
      setFormData({
        title: '',
        description: '',
        start_at: '',
        end_at: '',
        all_day: false,
        location: '',
        is_private: false,
        event_type: 'personal',
        participants: [],
        reminder_minutes: []
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create event');
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getEventsForDay = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_at);
      return isSameDay(eventDate, date);
    });
  };

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      start_at: `${format(date, 'yyyy-MM-dd')}T09:00`,
      end_at: `${format(date, 'yyyy-MM-dd')}T10:00`
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-rubik font-bold text-white flex items-center gap-3">
              <CalendarIcon className="w-7 h-7 text-brand-teal" />
              Calendar
            </h1>
            <p className="text-text-secondary mt-1">Schedule and track events</p>
          </div>
          
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold shadow-glow-button" data-testid="add-event-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-white/10 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-rubik text-white">Create Event</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateEvent} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="bg-surface-highlight border-white/10"
                    placeholder="Event title"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">Start</label>
                    <Input
                      type="datetime-local"
                      value={formData.start_at}
                      onChange={(e) => setFormData({...formData, start_at: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">End</label>
                    <Input
                      type="datetime-local"
                      value={formData.end_at}
                      onChange={(e) => setFormData({...formData, end_at: e.target.value})}
                      className="bg-surface-highlight border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Event Type</label>
                  <Select value={formData.event_type} onValueChange={(v) => setFormData({...formData, event_type: v})}>
                    <SelectTrigger className="bg-surface-highlight border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-white/10">
                      {EVENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Location (Optional)</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="bg-surface-highlight border-white/10"
                    placeholder="Meeting room, address, or link"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-highlight border border-white/10 rounded-xl text-white placeholder-text-muted focus:border-brand-teal outline-none resize-none"
                    rows={3}
                    placeholder="Event details..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-brand-teal text-black">Create Event</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar Grid */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-rubik font-semibold text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const isCurrentDay = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square p-1 rounded-xl transition-all ${
                    isCurrentDay ? 'bg-brand-teal/20 border border-brand-teal' :
                    isSelected ? 'bg-white/10 border border-white/20' :
                    'hover:bg-white/5 border border-transparent'
                  }`}
                  data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                >
                  <div className={`text-sm font-medium ${
                    isCurrentDay ? 'text-brand-teal' : 'text-white'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map(event => {
                      const eventType = EVENT_TYPES.find(t => t.value === event.event_type);
                      return (
                        <div
                          key={event.id}
                          className={`h-1.5 rounded-full ${eventType?.color || 'bg-brand-teal'}`}
                          title={event.title}
                        ></div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-text-muted">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Events */}
        {selectedDate && (
          <div className="bg-surface border border-white/5 rounded-2xl p-6">
            <h3 className="font-rubik font-semibold text-white mb-4">
              Events for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            
            {getEventsForDay(selectedDate).length === 0 ? (
              <p className="text-text-secondary">No events scheduled</p>
            ) : (
              <div className="space-y-3">
                {getEventsForDay(selectedDate).map(event => {
                  const eventType = EVENT_TYPES.find(t => t.value === event.event_type);
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 p-4 bg-surface-highlight rounded-xl"
                    >
                      <div className={`w-1 h-full min-h-[40px] rounded-full ${eventType?.color || 'bg-brand-teal'}`}></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-text-secondary mt-1">{event.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(event.start_at), 'h:mm a')}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${eventType?.color}/20 text-white`}>
                        {eventType?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CalendarPage;
