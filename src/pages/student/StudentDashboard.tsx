import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/utils/api';
import { gradeService } from '@/services/gradeService';

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
  const [myCourses, setMyCourses] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/api/v1/courses/my-courses')
      .then(data => setMyCourses(data))
      .catch(err => console.error('Error fetching my courses:', err));
  }, []);

  // --- States ---
  const [points, setPoints] = useState(0);
  const [nextLevelPoints, setNextLevelPoints] = useState(100);
  const [currentLevelTitle, setCurrentLevelTitle] = useState('L1 Beginner');
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    if (user?.userId) {
      api.get<any>('/api/v1/career/progress')
        .then(data => {
          if (data) {
            setPoints(data.totalPointsAtLevel || 0);
            setNextLevelPoints(data.levelPointsRequired || 100);
            setCurrentLevelTitle(data.currentLevelTitle || `L${data.currentLevelNumber || 1} Student`);
          }
        })
        .catch(err => console.error("Error loading career points:", err));

      gradeService.getGrades()
        .then(data => {
          const studentGrades = data.filter((g: any) => g.studentId === user.userId);
          setGrades(studentGrades);
        })
        .catch(err => console.error("Error loading student grades:", err));
    }
  }, [user]);

  // Calendar States
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 6, 25)); // Defaults to July 2026 to showcase sample data
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2026, 6, 25));
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const fetchLmsEvents = async () => {
      try {
        const [apiExams, apiAssignments] = await Promise.all([
          api.get<any[]>('/api/v1/exams').catch(() => []),
          api.get<any[]>('/api/v1/assignments').catch(() => [])
        ]);

        const examEvents: CalendarEvent[] = apiExams.map(ex => ({
          id: `exam-${ex.id}`,
          title: ex.title,
          date: ex.startTime ? ex.startTime.split('T')[0] : '2026-07-25',
          type: 'exam',
          course: ex.description || 'LMS Exam Session',
          time: ex.startTime ? ex.startTime.split('T')[1]?.substring(0, 5) : '09:00 AM'
        }));

        const assignmentEvents: CalendarEvent[] = apiAssignments.map(asg => ({
          id: `assignment-${asg.assignmentId}`,
          title: asg.title,
          date: asg.dueDate ? asg.dueDate.split('T')[0] : '2026-07-25',
          type: 'assignment',
          course: asg.description || 'Course Assignment Submission',
          time: asg.dueDate ? asg.dueDate.split('T')[1]?.substring(0, 5) : '11:59 PM'
        }));

        setEvents([...examEvents, ...assignmentEvents]);
      } catch (err) {
        console.error('Error fetching student calendar events:', err);
      }
    };
    fetchLmsEvents();
  }, []);

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
            You are performing exceptionally! You've achieved {currentLevelTitle} status. Keep up the great work to reach the next level!
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-white select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Current Level: {currentLevelTitle}
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
              Climb to next level in <span className="text-amber-300 font-black">{Math.max(0, nextLevelPoints - points)} points</span>.
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
               {myCourses.map((c: any) => (
                 <Link 
                   key={c.courseId}
                   to={`/student/courses/${c.courseId}`} 
                   className="border border-[#E9EDF5] p-4.5 rounded-2xl hover:border-[#4F3FF0]/40 hover:bg-[#4F3FF0]/5 hover:shadow-md transition-all text-left block cursor-pointer"
                 >
                   <div className="flex justify-between items-start gap-4">
                     <h4 className="font-extrabold text-slate-800 text-sm hover:text-[#4F3FF0] transition-colors">{c.courseName}</h4>
                     <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase leading-none border shrink-0 ${
                       c.status?.toLowerCase() === 'done'
                         ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                         : 'bg-indigo-50 border-indigo-250 text-[#4F3FF0]'
                     }`}>
                       {c.status || 'Ongoing'}
                     </span>
                   </div>
                   {c.description && (
                     <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-2 mt-1.5">
                       {c.description}
                     </p>
                   )}
                   <div className="flex flex-col gap-0.5 mt-2.5 text-[10px] font-bold text-slate-500">
                      {c.batchCode && (
                        <div>
                          Batch: <span className="text-slate-850 font-black">{c.batchCode}</span>
                        </div>
                      )}
                      <div>
                        Instructor: <span className="text-slate-800 font-semibold">{c.instructor || 'Academic Faculty'}</span>
                      </div>
                    </div>
                 </Link>
               ))}

               {myCourses.length === 0 && (
                 <div className="text-center py-6 text-slate-450 text-xs font-semibold">
                   No enrolled or custom granted courses found.
                 </div>
               )}
            </div>

            {/* Test scores */}
            <div className="space-y-3">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block select-none">RECENT TEST SCORES</span>
              <div className="border border-[#E9EDF5] rounded-2xl overflow-hidden text-xs">
                <div className="divide-y divide-[#E9EDF5] font-semibold text-slate-700">
                  {grades.map((g: any) => (
                    <div key={g.gradeId} className="px-5 py-3 flex justify-between items-center hover:bg-slate-50/20">
                      <span>{g.courseId}</span>
                      <span className="font-extrabold text-slate-800">{g.gradeValue}</span>
                    </div>
                  ))}
                  {grades.length === 0 && (
                    <div className="px-5 py-3 text-center text-slate-450 text-[11px]">
                      No recent test scores found.
                    </div>
                  )}
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
