import React, { useState, useEffect } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/utils/api';
import type { CalendarEvent } from './types';

export const AcademicCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar viewed date state (Defaults to July 2026 to showcase sample data first)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1));

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [apiExams, apiAssignments] = await Promise.all([
        api.get<any[]>('/api/v1/exams').catch(() => []),
        api.get<any[]>('/api/v1/assignments').catch(() => [])
      ]);

      const examEvents: CalendarEvent[] = apiExams.map(ex => ({
        calendarId: `exam-${ex.id}`,
        eventName: ex.title,
        description: ex.description || 'Online LMS exam session',
        eventDate: ex.startTime ? ex.startTime.split('T')[0] : '2026-07-25',
        status: 'EXAM'
      }));

      const assignmentEvents: CalendarEvent[] = apiAssignments.map(asg => ({
        calendarId: `assignment-${asg.assignmentId}`,
        eventName: asg.title,
        description: asg.description || 'LMS course assignment submission',
        eventDate: asg.dueDate ? asg.dueDate.split('T')[0] : '2026-07-25',
        status: 'ASSIGNMENT'
      }));

      const combined = [...examEvents, ...assignmentEvents].sort((a, b) => 
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      );

      setEvents(combined);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Calculate first day of the month starts on
  const firstDay = new Date(year, month, 1);
  let startDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Mon...
  // Adjust Monday as 0, Sunday as 6
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Number of days in the month
  const totalDays = new Date(year, month + 1, 0).getDate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Events List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-455 mb-4 select-none">UPCOMING ACADEMIC EVENTS</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 text-[#4F3FF0] animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No scheduled events.</p>
          ) : (
            <div className="space-y-3.5">
              {events.map(evt => (
                <div 
                  key={evt.calendarId}
                  className="flex items-center gap-4 p-4 border border-[#E9EDF5] hover:border-slate-350 rounded-2xl transition-all duration-200"
                >
                  <div className={`h-11 w-24 flex items-center justify-center rounded-xl font-extrabold text-[9px] tracking-wider border shrink-0 ${
                    evt.status === 'EXAM' 
                      ? 'bg-rose-50 border-rose-250 text-rose-700'
                      : 'bg-indigo-50 border-indigo-250 text-[#4F3FF0]'
                  }`}>
                    {evt.status}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{evt.eventName}</h4>
                    <p className="text-slate-455 text-xs mt-0.5 font-medium">{evt.description}</p>
                    <p className="text-slate-400 text-[10px] font-bold mt-1.5">{evt.eventDate}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar Preview Widget */}
      <div className="space-y-4">
        <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm text-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-455 mb-5 select-none">CALENDAR LAYOUT PREVIEW</h3>
          
          {/* Visual Calendar */}
          <div className="border border-slate-250 rounded-2xl p-4.5 inline-block w-full max-w-sm">
            {/* Calendar Header Month with navigation controls */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 select-none">
              <button 
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-xl text-slate-500 transition-all cursor-pointer border border-[#E2E8F0] shadow-xs"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-extrabold text-slate-805 tracking-tight">
                {monthNames[month]} {year}
              </div>
              <button 
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-xl text-slate-500 transition-all cursor-pointer border border-[#E2E8F0] shadow-xs"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            {/* Days headers */}
            <div className="grid grid-cols-7 gap-1 text-[10px] font-bold text-slate-400 uppercase mb-2">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5 text-xs text-slate-800 font-semibold select-none">
              {/* Empty slots for starting alignment */}
              {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                <span key={`empty-${idx}`} className="p-2"></span>
              ))}
              
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const dayStr = day < 10 ? '0' + day : '' + day;
                const monthNum = month + 1;
                const monthStr = monthNum < 10 ? '0' + monthNum : '' + monthNum;
                const dateStr = `${year}-${monthStr}-${dayStr}`;

                // Find all events on this date
                const dayEvents = events.filter(e => e.eventDate === dateStr);
                const hasEvent = dayEvents.length > 0;
                
                let dayClass = 'hover:bg-slate-100 rounded-xl transition-all cursor-pointer p-2.5 flex flex-col items-center justify-center relative min-h-[40px] border border-transparent';

                if (hasEvent) {
                  const hasExam = dayEvents.some(e => e.status === 'EXAM');
                  if (hasExam) {
                    dayClass += ' text-rose-700 bg-rose-50/70 border-rose-100 font-bold';
                  } else {
                    dayClass += ' text-[#4F3FF0] bg-indigo-50/70 border-indigo-100 font-bold';
                  }
                }

                return (
                  <div key={day} className={dayClass} title={dayEvents.map(e => `[${e.status}] ${e.eventName}`).join('\n')}>
                    <span>{day}</span>
                    {hasEvent && (
                      <div className="absolute bottom-1.5 flex gap-1 justify-center w-full px-0.5">
                        {dayEvents.map((evt, idx) => (
                          <span 
                            key={idx} 
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              evt.status === 'EXAM' ? 'bg-rose-600' : 'bg-[#4F3FF0]'
                            }`} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-400 mt-4.5 select-none">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-600" /> EXAM</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#4F3FF0]" /> ASSIGNMENT</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendar;
