import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Trophy, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/utils/api';

export const ReviewerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    pendingReviews: 0,
    reviewedCount: 0,
    overridesApplied: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.get<any>('/api/v1/reviewers/dashboard/stats');
        if (data) {
          setStats({
            pendingReviews: data.pendingReviews || 0,
            reviewedCount: data.reviewedCount || 0,
            overridesApplied: data.overridesApplied || 0
          });
        }
      } catch (err) {
        console.error('Error fetching reviewer stats:', err);
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
        <p className="text-slate-500 font-bold text-sm tracking-wide">Retrieving reviewer dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* Welcome Banner */}
      <div className="bg-[#4F3FF0] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-[0_8px_30px_rgba(79,63,240,0.15)]">
        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-extrabold tracking-widest bg-white/20 uppercase px-3 py-1 rounded-full text-white">
            REVIEWER PORTAL
          </span>
          <h2 className="text-2xl font-black font-heading mt-2">Welcome back, {user?.fullName || 'Reviewer'}</h2>
          <p className="text-white/80 text-xs font-semibold leading-relaxed max-w-md">
            Assess portfolio submissions, assign points against rubric metrics, and adjust configurations.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">PENDING EVALUATIONS</span>
            <span className="text-2xl font-black text-rose-600 leading-none block font-heading">{stats.pendingReviews}</span>
            <span className="text-[10px] font-semibold text-slate-400 block">Needs assessment</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">EVALUATED SUBMISSIONS</span>
            <span className="text-2xl font-black text-slate-800 leading-none block font-heading">{stats.reviewedCount}</span>
            <span className="text-[10px] font-semibold text-slate-400 block">Successfully updated</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-[#4F3FF0] tracking-wider uppercase block">L7 OVERRIDES</span>
            <span className="text-2xl font-black text-[#4F3FF0] leading-none block font-heading">{stats.overridesApplied}</span>
            <span className="text-[10px] font-semibold text-slate-400 block">Coordinators audit</span>
          </div>
          <div className="p-3 bg-indigo-50 text-[#4F3FF0] rounded-xl shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Action boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E9EDF5] p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 font-heading">Evaluations Queue</h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Review student portfolio repository details, verify target levels, and write assessment feedback.
          </p>
          <button
            onClick={() => navigate('/reviewer/workflow')}
            className="text-xs font-bold text-[#4F3FF0] hover:text-[#4335D6] inline-flex items-center gap-1 cursor-pointer"
          >
            Go to workflow queue
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="bg-white border border-[#E9EDF5] p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 font-heading">Level Threshold Parameters</h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Modify L1-L7 dynamic thresholds, learning descriptions, hex colors, and coordinate overrides rules.
          </p>
          <button
            onClick={() => navigate('/reviewer/points-levels')}
            className="text-xs font-bold text-[#4F3FF0] hover:text-[#4335D6] inline-flex items-center gap-1 cursor-pointer"
          >
            Configure thresholds
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default ReviewerDashboard;
