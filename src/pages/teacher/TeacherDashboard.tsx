import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileQuestion, 
  Award,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/utils/api';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    modulesCount: 0,
    materialsCount: 0,
    examsCount: 0,
    gradesPending: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.get<any>('/api/v1/teachers/dashboard/stats');
        if (data) {
          setStats({
            modulesCount: data.modulesCount || 0,
            materialsCount: data.materialsCount || 0,
            examsCount: data.examsCount || 0,
            gradesPending: data.gradesPending || 0
          });
        }
      } catch (err) {
        console.error('Error fetching teacher stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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

    </div>
  );
};

export default TeacherDashboard;
