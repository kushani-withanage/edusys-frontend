import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Award,
  ExternalLink,
  AlertCircle,
  X,
  Calendar,
  Clock
} from 'lucide-react';
import Button from '@/components/common/Button';
import { api } from '@/utils/api';
import { useAuth } from '../../hooks/useAuth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { Student, Batch } from '@/interfaces';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    activeBatchesCount: number;
  }

  interface CareerLevelStat {
    levelId: string;
    levelNumber: number;
    title: string;
    studentCount: number;
  }

  interface CareerStatsResponse {
    levelStats: CareerLevelStat[];
    industryReadyCount: number;
  }

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [careerStats, setCareerStats] = useState<CareerStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [
          studentsData,
          batchesData,
          statsData,
          careerStatsData
        ] = await Promise.all([
          api.get<Student[]>('/api/v1/students'),
          api.get<Batch[]>('/api/v1/batches'),
          api.get<DashboardStats>('/api/v1/dashboard/stats'),
          api.get<CareerStatsResponse>('/api/v1/career/stats').catch(() => null)
        ]);

        setStudents(studentsData);
        setBatches(batchesData);
        setDashboardStats(statsData);
        setCareerStats(careerStatsData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard metrics:', err);
        setError('Could not connect to the backend server. Please make sure the service is running.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Dynamic Career Distribution
  const levels = useMemo(() => {
    if (!careerStats || !careerStats.levelStats || careerStats.levelStats.length === 0) {
      return [
        { label: 'L1: Explorer', count: 0, color: 'bg-slate-300', stroke: '#E2E8F0', percentage: 0 },
        { label: 'L2: Builder', count: 0, color: 'bg-[#0F172A]', stroke: '#0F172A', percentage: 0 },
        { label: 'L3: Developer', count: 0, color: 'bg-[#4F3FF0]', stroke: '#4F3FF0', percentage: 0 },
        { label: 'L4: Engineer', count: 0, color: 'bg-[#0EA5E9]', stroke: '#0EA5E9', percentage: 0 },
        { label: 'L5: Architect', count: 0, color: 'bg-[#8B5CF6]', stroke: '#8B5CF6', percentage: 0 },
        { label: 'L6: Lead', count: 0, color: 'bg-[#F59E0B]', stroke: '#F59E0B', percentage: 0 },
        { label: 'L7: Master', count: 0, color: 'bg-[#EF4444]', stroke: '#EF4444', percentage: 0 },
      ];
    }

    const totalStudents = careerStats.levelStats.reduce((acc, curr) => acc + curr.studentCount, 0) || 1;

    const colors = [
      'bg-slate-300', 'bg-[#0F172A]', 'bg-[#4F3FF0]', 'bg-[#0EA5E9]', 
      'bg-[#8B5CF6]', 'bg-[#F59E0B]', 'bg-[#EF4444]'
    ];
    const strokes = [
      '#E2E8F0', '#0F172A', '#4F3FF0', '#0EA5E9', 
      '#8B5CF6', '#F59E0B', '#EF4444'
    ];

    const sortedStats = [...careerStats.levelStats].sort((a, b) => a.levelNumber - b.levelNumber);

    return sortedStats.map((stat, index) => {
      const percentage = (stat.studentCount / totalStudents) * 100;
      return {
        label: `L${stat.levelNumber}: ${stat.title}`,
        count: stat.studentCount,
        color: colors[index] || 'bg-slate-400',
        stroke: strokes[index] || '#94A3B8',
        percentage: Math.round(percentage * 10) / 10
      };
    });
  }, [careerStats]);

  // Donut chart stroke segments
  const donutChartSegments = useMemo(() => {
    let currentOffset = 0;
    const circumference = 439.8;
    return levels.map(lvl => {
      const strokeDasharray = `${(lvl.percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -currentOffset;
      currentOffset += (lvl.percentage / 100) * circumference;
      return { ...lvl, strokeDasharray, strokeDashoffset };
    });
  }, [levels]);

  // Metrics Card Configuration
  const metrics = [
    {
      title: 'TOTAL STUDENTS',
      value: loading || !dashboardStats ? '...' : dashboardStats.totalStudents.toString(),
      trend: '+8.4% vs last month',
      isPositive: true,
      icon: Users,
      iconBg: 'bg-[#4F3FF0]/10',
      iconColor: 'text-[#4F3FF0]',
    },
    {
      title: 'TOTAL TEACHERS',
      value: loading || !dashboardStats ? '...' : dashboardStats.totalTeachers.toString(),
      trend: '+4.2% vs last month',
      isPositive: true,
      icon: Users,
      iconBg: 'bg-[#4F3FF0]/10',
      iconColor: 'text-[#4F3FF0]',
    },
    {
      title: 'ACTIVE BATCHES',
      value: loading || !dashboardStats ? '...' : dashboardStats.activeBatchesCount.toString(),
      trend: `${batches.length} Total Batches`,
      isPositive: true,
      icon: GraduationCap,
      iconBg: 'bg-[#4F3FF0]/10',
      iconColor: 'text-[#4F3FF0]',
    },
  ];

  return (
    <div className="space-y-8 select-none">

      {showError && error && (
        <div className="fixed top-6 right-6 z-50 w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-300">
          <Alert variant="destructive" className="pr-10">
            <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <AlertTitle>Connection Failure</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="absolute top-3 right-3 text-[#7E8B9B] hover:text-[#111111] bg-slate-300/20 hover:bg-slate-300/50 p-1 rounded-lg transition-all cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Alert>
        </div>
      )}

      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#4F3FF0] via-[#5C4EF2] to-[#7C6EF6] rounded-3xl p-8 text-white shadow-[0_12px_30px_rgba(79,63,240,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Decorative glowing circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <h1 className="text-[18px] md:text-xl lg:text-2xl font-semibold tracking-tight">
            {getGreeting()}, {user?.fullName || 'Admin'}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/80">
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
              <Calendar className="h-4 w-4" />
              <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <span className="hidden sm:inline text-white/30">|</span>
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
              <Clock className="h-4 w-4" />
              <span className="tabular-nums">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#E9EDF5] p-6 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.025)] hover:border-slate-350 transition-all duration-300 group"
            >
              <div className="space-y-2.5">
                <span className="block text-[10px] font-extrabold text-[#7E8B9B] tracking-wider uppercase">
                  {card.title}
                </span>
                <span className="block text-3xl font-extrabold text-[#111111] tracking-tight transition-transform duration-300 group-hover:translate-x-0.5">
                  {card.value}
                </span>
                <span
                  className={`inline-block text-[11px] font-bold ${card.isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                >
                  {card.trend}
                </span>
              </div>
              <div className={`h-14 w-14 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shadow-md shadow-transparent transition-all duration-300 group-hover:scale-105 group-hover:shadow-[#4F3FF0]/5`}>
                <Icon className="h-6 w-6 transition-transform duration-300 group-hover:rotate-3" />
              </div>
            </div>
          );
        })}
      </div>



      {/* Middle Grid: Career Scale Distribution + System Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Career Scale Level Distribution (Donut Chart) */}
        <div className="bg-white rounded-2xl border border-[#E9EDF5] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[#111111] tracking-tight">Career Scale Level Distribution</h3>
              <p className="text-xs font-normal text-[#7E8B9B] mt-0.5">Total student counts across professional levels</p>
            </div>
            <Award className="h-5 w-5 text-amber-500" />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
            {/* SVG Donut Chart */}
            <div className="relative w-40 h-40 shrink-0">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {donutChartSegments.map((segment, idx) => (
                  <circle
                     key={idx}
                     cx="100"
                     cy="100"
                     r="70"
                     fill="transparent"
                     stroke={segment.stroke}
                     strokeWidth="16"
                     strokeDasharray={segment.strokeDasharray}
                     strokeDashoffset={segment.strokeDashoffset}
                  />
                ))}
              </svg>
              {/* Inner Circle Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-semibold text-[#111111] leading-none">
                  {loading ? '...' : students.length.toString()}
                </span>
                <span className="text-xs font-medium text-[#7E8B9B] tracking-wider uppercase mt-1">STUDENTS</span>
              </div>
            </div>

            {/* Legend grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1 w-full text-xs font-semibold text-[#1A202C]">
              {levels.map((lvl, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50/60">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${lvl.color} shrink-0`} />
                    <span className="text-slate-600 font-medium">{lvl.label}</span>
                  </div>
                  <span className="font-bold text-slate-800 pr-1">{lvl.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Actions Needed */}
        <div className="bg-white rounded-2xl border border-[#E9EDF5] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111111] tracking-tight">System Actions Needed</h3>
            <span className="text-xs font-medium text-[#4F3FF0] bg-[#4F3FF0]/10 px-2 py-1 rounded-md border border-[#4F3FF0]/10">
              0 Pending
            </span>
          </div>

          <div className="space-y-4 mb-4">
            {/* Item 1 */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-slate-800 leading-tight">Monitor active batch registrations</h4>
                <p className="text-xs text-slate-400 font-normal leading-none">
                  {batches.length} total cohorts currently loaded in system database
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-slate-800 leading-tight">Audit Career scale reviews count</h4>
                <p className="text-xs text-slate-400 font-normal leading-none">Syncing student progress records with active reviewer panels</p>
              </div>
            </div>
          </div>

          <Button variant="outline" color="secondary" width="full" endIcon={<ExternalLink className="h-3.5 w-3.5 ml-1" />}>
            <span className="text-xs font-bold">Audit System Logs</span>
          </Button>
        </div>
      </div>

      {/* Bottom Section: Milestones */}
      <div className="bg-white rounded-2xl border border-[#E9EDF5] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-[#111111] tracking-tight">Upcoming Academic & Batch Milestones</h3>
          <p className="text-xs font-normal text-[#7E8B9B] mt-0.5">Scheduled calendar events and exam timetables</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0]/80 rounded-xl p-4.5 space-y-2">
            <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">BATCHES INCEPTION</span>
            <h4 className="text-xs font-semibold text-slate-800 leading-tight">FSW-2026-C (Web Development)</h4>
            <p className="text-xs font-normal text-slate-500 leading-relaxed">
              Starts next Monday. Instructor: Ada Lovelace. 30 registered students.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0]/80 rounded-xl p-4.5 space-y-2">
            <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">UPCOMING EXAMS</span>
            <h4 className="text-xs font-semibold text-slate-800 leading-tight">Term 1 Assessment: Databases</h4>
            <p className="text-xs font-normal text-slate-500 leading-relaxed">
              Scheduled for July 20th, 10:00 AM. 1-Hour timed MCQ question pool.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0]/80 rounded-xl p-4.5 space-y-2">
            <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">CAMPUS HOLIDAYS</span>
            <h4 className="text-xs font-semibold text-slate-800 leading-tight">Mid-Term Summer Holiday</h4>
            <p className="text-xs font-normal text-slate-500 leading-relaxed">
              July 25th. All batch programs suspended for campus maintenance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
