import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileQuestion, 
  Award,
  ArrowRight,
  Loader2,
  BookOpen,
  Calendar,
  Bookmark,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/utils/api';
import { courseService } from '@/services/courseService';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    modulesCount: 0,
    materialsCount: 0,
    examsCount: 0,
    gradesPending: 0
  });
  const [assignedCourses, setAssignedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (!user?.email) return;

        // Fetch stats
        const data = await api.get<any>('/api/v1/teachers/dashboard/stats').catch(() => null);
        if (data) {
          setStats({
            modulesCount: data.modulesCount || 0,
            materialsCount: data.materialsCount || 0,
            examsCount: data.examsCount || 0,
            gradesPending: data.gradesPending || 0
          });
        }

        // Fetch assigned courses
        const grants = await api.get<any[]>(`/api/v1/course-access-grants?email=${user.email}`).catch(() => []);
        const allCourses = await courseService.getCourses().catch(() => []);
        const assigned = allCourses.filter((c: any) => 
          grants.some((g: any) => g.courseId.toLowerCase() === c.courseId.toLowerCase())
        );
        setAssignedCourses(assigned);
      } catch (err) {
        console.error('Error fetching teacher dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white border border-[#E9EDF5] rounded-3xl min-h-[400px]">
        <Loader2 className="h-10 w-10 text-[#4F3FF0] animate-spin" />
        <p className="text-slate-500 font-bold text-sm tracking-wide">Retrieving teacher dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* Welcome Banner */}
      <div className="bg-[#4F3FF0] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-[0_8px_30px_rgba(79,63,240,0.15)]">
        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-extrabold tracking-widest bg-white/20 uppercase px-3 py-1 rounded-full text-white">
            TEACHER PORTAL
          </span>
          <h2 className="text-2xl font-black font-heading mt-2">Welcome back, {user?.fullName || 'Teacher'}</h2>
          <p className="text-white/80 text-xs font-semibold leading-relaxed max-w-md">
            Manage course materials, examinations, assignments, and student grades in one consolidated space.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">ASSIGNED COURSES</span>
            <span className="text-2xl font-black text-slate-800 leading-none block font-heading">{stats.modulesCount}</span>
            <span className="text-[10px] font-semibold text-slate-400 block">Active this semester</span>
          </div>
          <div className="p-3 bg-indigo-50 text-[#4F3FF0] rounded-xl shrink-0">
            <LayoutDashboard className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">SCHEDULED EXAMS</span>
            <span className="text-2xl font-black text-slate-800 leading-none block font-heading">{stats.examsCount}</span>
            <span className="text-[10px] font-semibold text-slate-400 block">In question bank</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl shrink-0">
            <FileQuestion className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">PENDING GRADINGS</span>
            <span className="text-2xl font-black text-rose-600 leading-none block font-heading">{stats.gradesPending}</span>
            <span className="text-[10px] font-semibold text-slate-400 block">Requires score inputs</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <Award className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E9EDF5] p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 font-heading">Question Bank & Exams</h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Write new questions, schedule test configurations, and customize candidate durations.
          </p>
          <button
            onClick={() => navigate('/teacher/exams')}
            className="text-xs font-bold text-[#4F3FF0] hover:text-[#4335D6] inline-flex items-center gap-1 cursor-pointer"
          >
            Schedule Tests
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="bg-white border border-[#E9EDF5] p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 font-heading">Academic Results</h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Record assignment points, view student roster details, and compute totals automatically.
          </p>
          <button
            onClick={() => navigate('/teacher/results')}
            className="text-xs font-bold text-[#4F3FF0] hover:text-[#4335D6] inline-flex items-center gap-1 cursor-pointer"
          >
            Enter Grades
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Assigned Course Modules Grid */}
      <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm space-y-5 text-left">
        <div>
          <h3 className="text-sm font-black text-slate-805 tracking-tight flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-[#4F3FF0]" />
            Permitted Course Modules
          </h3>
          <p className="text-slate-500 text-[10px] font-medium mt-0.5">
            Select an assigned module to edit syllabus content, schedule exams, and manage materials.
          </p>
        </div>

        {assignedCourses.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-405 font-extrabold text-xs">No active module access grants found</p>
            <p className="text-slate-405 text-[10px] mt-0.5 font-medium">Please contact admin to request module access permissions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignedCourses.map(course => (
              <div 
                key={course.courseId}
                onClick={() => navigate(`/teacher/courses/${course.courseId}`)}
                className="bg-white border border-[#E9EDF5] hover:border-slate-350 rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {course.level || 'Level 1'}
                    </span>
                    {course.isCompulsory !== false && (
                      <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Compulsory
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-850 leading-snug group-hover:text-[#4F3FF0] transition-colors line-clamp-1">
                      {course.courseName}
                    </h4>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">{course.courseId}</p>
                  </div>
                  <p className="text-slate-455 text-[10px] font-semibold leading-relaxed line-clamp-2">
                    {course.description || 'No course overview description provided.'}
                  </p>
                </div>
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-450">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {course.durationWeeks || '12'} Weeks
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark className="h-3 w-3 shrink-0" />
                      {course.credits || '3'} Credits
                    </span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default TeacherDashboard;
