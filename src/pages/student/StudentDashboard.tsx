import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'assignment' | 'exam' | 'class' | 'event';
  course?: string;
  time?: string;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  // Load custom granted courses
  const grantedCourses = useMemo(() => {
    if (!user?.email) return [];
    const userKey = user.email.toLowerCase();
    
    const storedGrants = localStorage.getItem('course_access_grants');
    if (!storedGrants) return [];
    
    const allGrants = JSON.parse(storedGrants);
    return allGrants.filter((g: any) => g.userIdentifier.toLowerCase() === userKey);
  }, [user]);

  // --- States ---
  const points = 240;
  const nextLevelPoints = 300;

  // Calendar States
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 2)); // Default to August 2, 2026
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2026, 7, 2)); // Default selected date
  const [events] = useState<CalendarEvent[]>([
    { id: '1', title: 'Advanced SE Assignment 1', date: '2026-08-05', type: 'assignment', course: 'Advanced Software Engineering', time: '11:59 PM' },
    { id: '2', title: 'OOP Review Session', date: '2026-08-18', type: 'class', course: 'Object Oriented Programming', time: '02:00 PM' },
    { id: '3', title: 'Design Patterns Exam', date: '2026-08-20', type: 'exam', course: 'Advanced Software Engineering', time: '09:00 AM' },
    { id: '4', title: 'Clean Architecture Review', date: '2026-08-28', type: 'class', course: 'Advanced Software Engineering', time: '03:00 PM' }
  ]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const numDaysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = useMemo(() => {
    const days = [];
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push(lastDayOfPrevMonth - i);
    }
    return days;
  }, [year, month, firstDayOfMonth]);

  const currentMonthDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= numDaysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [numDaysInMonth]);

  const nextMonthDays = useMemo(() => {
    const totalCells = 42;
    const count = totalCells - (prevMonthDays.length + currentMonthDays.length);
    const days = [];
    for (let i = 1; i <= count; i++) {
      days.push(i);
    }
    return days;
  }, [prevMonthDays, currentMonthDays]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const getEventsForDate = (day: number, m: number, y: number) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const monthEvents = useMemo(() => {
    return events.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [events, month, year]);

  const displayedEvents = useMemo(() => {
    if (!selectedDate) return monthEvents;
    return events.filter(e => {
      const d = new Date(e.date);
      return d.getDate() === selectedDate.getDate() &&
             d.getMonth() === selectedDate.getMonth() &&
             d.getFullYear() === selectedDate.getFullYear();
    });
  }, [selectedDate, monthEvents, events]);

  const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-[#4F3FF0] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-8 shadow-[0_8px_30px_rgba(79,63,240,0.15)] font-sans animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="space-y-3.5 relative z-10 flex-1">
          <span className="text-[10px] font-extrabold tracking-widest bg-white/20 uppercase px-3 py-1 rounded-full text-white inline-block">
            WELCOME BACK, {user?.fullName?.toUpperCase() || 'STUDENT'}!
          </span>
          <h2 className="text-2xl font-black font-heading mt-1">Software Trainee LMS Portal</h2>
          <p className="text-white/80 text-xs font-semibold leading-relaxed max-w-xl">
            You are performing exceptionally! You've achieved L3 Developer status. Keep up the great work to reach L4: Engineer!
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-white select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Current Level: L3 Developer
          </div>
        </div>

        {/* Integrated Career Scale Progress */}
        <div className="relative z-10 shrink-0 bg-white/10 border border-white/20 p-4.5 rounded-3xl flex flex-col items-center justify-center text-center backdrop-blur-md gap-3 min-w-[200px] select-none">
          <span className="text-[9px] font-extrabold text-white/70 uppercase tracking-wider block">
            CAREER SCALE STATUS
          </span>

          {/* Circular Progress Gauge */}
          <div className="relative h-24 w-24">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-white/15 fill-transparent"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-amber-400 fill-transparent transition-all duration-500"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - points / nextLevelPoints)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-white leading-none block font-heading">{points}</span>
              <span className="text-[8px] font-bold text-white/70 uppercase tracking-wider block mt-0.5">/ {nextLevelPoints} PTS</span>
            </div>
          </div>

          <div className="bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl w-full text-center">
            <p className="text-[9px] font-extrabold text-white leading-tight">
              Climb to L4: Engineer in <span className="text-amber-300 font-black">60 points</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-sans">
        
        {/* Left Section: Academic Standing */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Standing Panel */}
          <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm space-y-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-2 select-none">
              <BookOpen className="h-4.5 w-4.5 text-slate-400" />
              ACADEMIC STANDING OVERVIEW
            </h3>

            <div className="grid grid-cols-1 gap-4 select-none">
              <Link 
                to="/student/courses/ICD110" 
                className="border border-[#E9EDF5] p-4.5 rounded-2xl hover:border-[#4F3FF0]/40 hover:bg-[#4F3FF0]/5 hover:shadow-md transition-all text-left block cursor-pointer"
              >
                <h4 className="font-extrabold text-slate-800 text-sm hover:text-[#4F3FF0] transition-colors">Advanced Software Engineering</h4>
                <p className="text-[10px] font-extrabold text-[#4F3FF0] mt-1">ICD110</p>
                <p className="text-[10px] font-semibold text-slate-450 mt-1">Instructor: Mrs. Kushani Withanage</p>
              </Link>

              {grantedCourses.map((grant: any) => (
                <Link 
                  key={grant.id}
                  to={`/student/courses/${grant.courseId}`} 
                  className="border border-[#E9EDF5] p-4.5 rounded-2xl hover:border-[#4F3FF0]/40 hover:bg-[#4F3FF0]/5 hover:shadow-md transition-all text-left block cursor-pointer animate-in fade-in duration-200"
                >
                  <h4 className="font-extrabold text-slate-800 text-sm hover:text-[#4F3FF0] transition-colors">{grant.courseName}</h4>
                  <p className="text-[10px] font-extrabold text-[#4F3FF0] mt-1">{grant.batchCode}</p>
                  <p className="text-[10px] font-semibold text-slate-450 mt-1">Instructor: Academic Faculty</p>
                </Link>
              ))}
            </div>

            {/* Test scores */}
            <div className="space-y-3">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block select-none">RECENT TEST SCORES</span>
              <div className="border border-[#E9EDF5] rounded-2xl overflow-hidden text-xs">
                <div className="divide-y divide-[#E9EDF5] font-semibold text-slate-700">
                  <div className="px-5 py-3 flex justify-between items-center hover:bg-slate-50/20">
                    <span>Software Engineering</span>
                    <span className="font-extrabold text-slate-800">88/100</span>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Right Section: Academic Calendar & Schedule */}
        <div className="space-y-6">

          {/* Calendar Card */}
          <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2 select-none">
                <Calendar className="h-4.5 w-4.5 text-slate-400" />
                Academic Calendar
              </h3>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-[9px] font-bold text-[#4F3FF0] hover:underline cursor-pointer"
                >
                  Show All Month
                </button>
              )}
            </div>

            {/* Calendar Grid Controller */}
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <span className="text-xs font-extrabold text-slate-800">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-1">
              <div className="grid grid-cols-7 gap-1 text-center">
                {DAYS_OF_WEEK.map(day => (
                  <span key={day} className="text-[9px] font-bold text-slate-400 uppercase select-none">
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Previous month grayed-out days */}
                {prevMonthDays.map((day, idx) => (
                  <div
                    key={`prev-${idx}`}
                    className="py-1.5 text-center text-[10px] font-semibold text-slate-300 select-none"
                  >
                    {day}
                  </div>
                ))}

                {/* Current month active days */}
                {currentMonthDays.map(day => {
                  const isToday = day === 2 && month === 7 && year === 2026; // today's date context
                  const isSelected = selectedDate &&
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getFullYear() === year;

                  const dateEvents = getEventsForDate(day, month, year);
                  const hasEvents = dateEvents.length > 0;

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => setSelectedDate(new Date(year, month, day))}
                      className={`py-1 text-center relative focus:outline-none rounded-lg cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[28px] text-[10px] font-bold ${
                        isToday
                          ? 'bg-[#4F3FF0] text-white font-extrabold shadow-sm shadow-[#4F3FF0]/20'
                          : isSelected
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{day}</span>
                      {hasEvents && !isToday && !isSelected && (
                        <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                          dateEvents.some(e => e.type === 'exam') ? 'bg-rose-500' :
                          dateEvents.some(e => e.type === 'assignment') ? 'bg-amber-500' :
                          'bg-[#4F3FF0]'
                        }`} />
                      )}
                    </button>
                  );
                })}

                {/* Next month grayed-out days */}
                {nextMonthDays.map((day, idx) => (
                  <div
                    key={`next-${idx}`}
                    className="py-1.5 text-center text-[10px] font-semibold text-slate-300 select-none"
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Events List */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block select-none">
                {selectedDate 
                  ? `Tasks on ${selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}` 
                  : 'Tasks in this month'}
              </span>

              {displayedEvents.length > 0 ? (
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-0.5">
                  {displayedEvents.map(event => (
                    <div
                      key={event.id}
                      className="p-2.5 border border-[#E9EDF5] rounded-xl hover:bg-slate-50 transition-all text-left flex gap-2.5 items-start"
                    >
                      <div className={`w-1 h-8 rounded-full shrink-0 ${
                        event.type === 'assignment' ? 'bg-amber-500' :
                        event.type === 'exam' ? 'bg-rose-500' :
                        event.type === 'class' ? 'bg-[#4F3FF0]' :
                        'bg-emerald-500'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <h5 className="font-extrabold text-slate-800 text-[11px] leading-tight truncate">
                          {event.title}
                        </h5>
                        <p className="text-[9px] font-semibold text-slate-400 truncate mt-0.5">
                          {event.course}
                        </p>
                        <span className="text-[9px] font-extrabold text-[#4F3FF0] uppercase tracking-wider block mt-0.5">
                          {event.time} • {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-slate-400 space-y-1.5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <AlertCircle className="h-5 w-5 mx-auto opacity-30 text-slate-400" />
                  <p className="text-[9px] font-semibold">No tasks scheduled for this duration.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default StudentDashboard;
