import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  CreditCard,
  Calendar,
  Clock,
  ArrowUpRight,
  Award,
  ExternalLink,
  AlertCircle,
  X
} from 'lucide-react';
import Button from '@/components/common/Button';
import { api } from '@/utils/api';
import { useAuth } from '../../hooks/useAuth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { Student, Batch, FeeRecord, Enrollment, Course, Receipt } from '@/interfaces';

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
    newAdmissionIntake: number;
    overduePaymentsCount: number;
    pendingPaymentsCount: number;
  }

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
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
          feeRecordsData,
          enrollmentsData,
          coursesData,
          receiptsData,
          statsData
        ] = await Promise.all([
          api.get<Student[]>('/api/v1/students'),
          api.get<Batch[]>('/api/v1/batches'),
          api.get<FeeRecord[]>('/api/v1/fee-records'),
          api.get<Enrollment[]>('/api/v1/enrollments'),
          api.get<Course[]>('/api/v1/courses'),
          api.get<Receipt[]>('/api/v1/receipts'),
          api.get<DashboardStats>('/api/v1/dashboard/stats')
        ]);

        setStudents(studentsData);
        setBatches(batchesData);
        setFeeRecords(feeRecordsData);
        setEnrollments(enrollmentsData);
        setCourses(coursesData);
        setReceipts(receiptsData);
        setDashboardStats(statsData);
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



  const overdueFeeRecords = useMemo(() => {
    return feeRecords.filter(r => r.status === 'UNPAID');
  }, [feeRecords]);

  // 3. Calculate New Admissions (Current/Latest Month with registrations)
  const admissionsStats = useMemo(() => {
    if (students.length === 0) {
      return { count: 0, label: 'Month' };
    }
    // Find the latest enrollment date
    const latestDateObj = students.reduce((latest, s) => {
      if (!s.enrollmentDate) return latest;
      const date = new Date(s.enrollmentDate);
      return date > latest ? date : latest;
    }, new Date(0));

    const count = students.filter(s => {
      if (!s.enrollmentDate) return false;
      const date = new Date(s.enrollmentDate);
      return date.getMonth() === latestDateObj.getMonth() &&
        date.getFullYear() === latestDateObj.getFullYear();
    }).length;

    const label = latestDateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return { count, label };
  }, [students]);

  // Helper: Get batch name for a student
  const getStudentBatchName = (studentId: string) => {
    const studentEnrollment = enrollments.find(e => e.studentId === studentId);
    if (!studentEnrollment) return 'No Batch';
    const batch = batches.find(b => b.batchId === studentEnrollment.batchId);
    return batch ? batch.batchName : 'Unknown Batch';
  };

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
    {
      title: 'PENDING FEE PAYMENTS',
      value: loading || !dashboardStats ? '...' : dashboardStats.pendingPaymentsCount.toString(),
      trend: 'Awaiting submission',
      isPositive: true,
      icon: CreditCard,
      iconBg: 'bg-[#4F3FF0]/10',
      iconColor: 'text-[#4F3FF0]',
    },
    {
      title: `NEW ADMISSIONS (${admissionsStats.label.toUpperCase()})`,
      value: loading || !dashboardStats ? '...' : dashboardStats.newAdmissionIntake.toString(),
      trend: 'Registered intake',
      isPositive: true,
      icon: Calendar,
      iconBg: 'bg-[#4F3FF0]/10',
      iconColor: 'text-[#4F3FF0]',
    },
    {
      title: 'OVERDUE PAYMENTS',
      value: loading || !dashboardStats ? '...' : dashboardStats.overduePaymentsCount.toString(),
      trend: 'Action required',
      isPositive: !dashboardStats || dashboardStats.overduePaymentsCount === 0,
      icon: Clock,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
  ];

  // Dynamic Career Distribution
  const levels = useMemo(() => {
    if (students.length === 0) {
      return [
        { label: 'L1: Explorer', count: 18, color: 'bg-slate-300', stroke: '#E2E8F0', percentage: 11.7 },
        { label: 'L2: Builder', count: 29, color: 'bg-[#0F172A]', stroke: '#0F172A', percentage: 18.8 },
        { label: 'L3: Developer', count: 48, color: 'bg-[#4F3FF0]', stroke: '#4F3FF0', percentage: 31.2 },
        { label: 'L4: Engineer', count: 32, color: 'bg-[#0EA5E9]', stroke: '#0EA5E9', percentage: 20.8 },
        { label: 'L5: Architect', count: 15, color: 'bg-[#8B5CF6]', stroke: '#8B5CF6', percentage: 9.7 },
        { label: 'L6: Lead', count: 9, color: 'bg-[#F59E0B]', stroke: '#F59E0B', percentage: 5.8 },
        { label: 'L7: Master', count: 3, color: 'bg-[#EF4444]', stroke: '#EF4444', percentage: 1.9 },
      ];
    }
    // Distribute actual 5 students visually for demonstration
    return [
      { label: 'L1: Explorer', count: 1, color: 'bg-slate-300', stroke: '#E2E8F0', percentage: 20 },
      { label: 'L2: Builder', count: 1, color: 'bg-[#0F172A]', stroke: '#0F172A', percentage: 20 },
      { label: 'L3: Developer', count: 2, color: 'bg-[#4F3FF0]', stroke: '#4F3FF0', percentage: 40 },
      { label: 'L4: Engineer', count: 1, color: 'bg-[#0EA5E9]', stroke: '#0EA5E9', percentage: 20 },
      { label: 'L5: Architect', count: 0, color: 'bg-[#8B5CF6]', stroke: '#8B5CF6', percentage: 0 },
      { label: 'L6: Lead', count: 0, color: 'bg-[#F59E0B]', stroke: '#F59E0B', percentage: 0 },
      { label: 'L7: Master', count: 0, color: 'bg-[#EF4444]', stroke: '#EF4444', percentage: 0 },
    ];
  }, [students]);

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

  // Course Enrollments Bar Chart Calculations
  const barChartData = useMemo(() => {
    if (courses.length === 0) return [];

    const counts = courses.map(course => {
      const count = enrollments.filter(e => e.courseId === course.courseId).length;
      let shortName = course.courseName;
      if (shortName.length > 15) {
        shortName = shortName.substring(0, 12) + '...';
      }
      return { name: shortName, count };
    });

    return counts.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [courses, enrollments]);

  const scaledBars = useMemo(() => {
    const maxCount = Math.max(...barChartData.map(b => b.count), 1);
    const maxBarHeight = 130;
    const baselineY = 190;

    return barChartData.map((bar, index) => {
      const height = (bar.count / maxCount) * maxBarHeight;
      const y = baselineY - height;
      const x = 60 + index * 85;
      const textX = x + 15;
      return { ...bar, x, y, height, textX };
    });
  }, [barChartData]);

  // Revenue collections history (LKR)
  const monthlyRevenues = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months: Array<{ monthName: string; monthIndex: number; year: number; amount: number }> = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      last6Months.push({
        monthName: months[d.getMonth()],
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        amount: 0
      });
    }

    receipts.forEach(r => {
      if (!r.paymentDate) return;
      const date = new Date(r.paymentDate);
      const match = last6Months.find(m => m.monthIndex === date.getMonth() && m.year === date.getFullYear());
      if (match) {
        match.amount += Number(r.amountPaid || 0);
      }
    });

    return last6Months;
  }, [receipts]);

  const lineChartData = useMemo(() => {
    const maxAmount = Math.max(...monthlyRevenues.map(m => m.amount), 1);
    const baselineY = 180;
    const peakY = 60;
    const maxYRange = baselineY - peakY;

    const points = monthlyRevenues.map((m, index) => {
      const x = 50 + index * 80;
      const height = (m.amount / maxAmount) * maxYRange;
      const y = baselineY - height;
      return { month: m.monthName, amount: m.amount, x, y };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

    const totalCollected = monthlyRevenues.reduce((sum, m) => sum + m.amount, 0);

    return { points, pathD, areaD, totalCollected };
  }, [monthlyRevenues]);

  const totalCollectedFormatted = useMemo(() => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(lineChartData.totalCollected);
  }, [lineChartData.totalCollected]);

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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Course Enrollments Bar Chart */}
        <div className="bg-white rounded-2xl border border-[#E9EDF5] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[#111111] tracking-tight">Student Course Enrollments</h3>
            <p className="text-xs font-medium text-[#7E8B9B] mt-0.5">Total active enrollment breakdown per academic subject</p>
          </div>
          <div className="relative w-full h-[220px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-semibold">Loading data...</div>
            ) : barChartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-semibold">No enrollment records.</div>
            ) : (
              <svg viewBox="0 0 500 220" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F3FF0" />
                    <stop offset="100%" stopColor="#818CF8" />
                  </linearGradient>
                </defs>

                {/* Dotted grid lines */}
                <line x1="40" y1="40" x2="480" y2="40" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="40" y1="90" x2="480" y2="90" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="40" y1="140" x2="480" y2="140" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="40" y1="190" x2="480" y2="190" stroke="#E2E8F0" strokeWidth="1.5" />

                {/* Render Dynamic Bars */}
                {scaledBars.map((bar) => (
                  <g key={bar.name}>
                    <text x={bar.textX} y={bar.y - 8} textAnchor="middle" className="text-xs font-semibold fill-slate-800">
                      {bar.count}
                    </text>
                    <rect x={bar.x} y={bar.y} width="30" height={bar.height} rx="4" ry="4" fill="url(#barGrad)" className="hover:opacity-90 transition-opacity cursor-pointer" />
                    <text x={bar.textX} y="210" textAnchor="middle" className="text-xs font-medium fill-slate-500">
                      {bar.name}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>

        {/* Revenue Collections History Line Chart */}
        <div className="bg-white rounded-2xl border border-[#E9EDF5] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#111111] tracking-tight">Revenue Collections History</h3>
              <p className="text-xs font-medium text-[#7E8B9B] mt-0.5">Total fee receipts collected over the last 6 months</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#4F3FF0] bg-[#4F3FF0]/10 px-2.5 py-1 rounded-lg border border-[#4F3FF0]/10">
              <ArrowUpRight className="h-3 w-3" />
              <span>{loading ? '...' : totalCollectedFormatted}</span>
            </div>
          </div>
          <div className="relative w-full h-[220px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-semibold">Loading data...</div>
            ) : receipts.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-semibold">No receipt payments recorded.</div>
            ) : (
              <svg viewBox="0 0 500 220" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F3FF0" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#4F3FF0" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Dotted grid lines */}
                <line x1="50" y1="60" x2="450" y2="60" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="50" y1="100" x2="450" y2="100" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="50" y1="140" x2="450" y2="140" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="50" y1="180" x2="450" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />

                {/* Area gradient under path */}
                <path d={lineChartData.areaD} fill="url(#lineGrad)" />

                {/* Line stroke */}
                <path d={lineChartData.pathD} fill="none" stroke="#4F3FF0" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Circle nodes & tooltips */}
                {lineChartData.points.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="5" fill="#4F3FF0" stroke="#FFFFFF" strokeWidth="2.5" />
                    {p.amount > 0 && (
                      <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-xs font-semibold fill-slate-800">
                        {p.amount >= 1000 ? `${(p.amount / 1000).toFixed(0)}k` : p.amount}
                      </text>
                    )}
                    <text x={p.x} y="200" textAnchor="middle" className="text-xs font-medium fill-slate-500">
                      {p.month}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Tables: Admissions & Payments Details */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Admissions Details */}
          <div className="bg-white rounded-2xl border border-[#E9EDF5] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-[#111111] tracking-tight">Recent Student Admissions</h3>
                <p className="text-xs font-normal text-[#7E8B9B] mt-0.5">Enrolled student records and their assigned batches</p>
              </div>
              <span className="text-xs font-medium text-[#4F3FF0] bg-[#4F3FF0]/10 px-2 py-1 rounded-md border border-[#4F3FF0]/10">
                Admitted
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm font-normal">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3">REG NO</th>
                    <th className="pb-3">NAME</th>
                    <th className="pb-3">ENROLLED DATE</th>
                    <th className="pb-3">BATCH NO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 font-normal">
                  {students.slice(-5).reverse().map((student) => (
                    <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-550">{student.regNo || 'N/A'}</td>
                      <td className="py-3 text-slate-800">{student.fullName}</td>
                      <td className="py-3 text-slate-500">
                        {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'N/A'}
                      </td>
                      <td className="py-3">
                        <span className="inline-block px-2 py-0.5 bg-[#4F3FF0]/8 text-[#4F3FF0] rounded-md font-medium text-xs">
                          {getStudentBatchName(student.studentId)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">No student records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overdue Payments Details */}
          <div className="bg-white rounded-2xl border border-[#E9EDF5] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-[#111111] tracking-tight">Overdue Payments</h3>
                <p className="text-xs font-normal text-[#7E8B9B] mt-0.5">Unpaid tuition fee records and outstanding balances</p>
              </div>
              <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                Pending
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm font-normal">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3">STUDENT</th>
                    <th className="pb-3">FEE DETAILS</th>
                    <th className="pb-3">DUE DATE</th>
                    <th className="pb-3 text-right">AMOUNT (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 font-normal">
                  {overdueFeeRecords.map((record) => {
                    const student = students.find(s => s.studentId === record.studentId);
                    const formattedAmount = new Intl.NumberFormat('en-LK', {
                      style: 'currency',
                      currency: 'LKR',
                      minimumFractionDigits: 0
                    }).format(record.amount);
                    return (
                      <tr key={record.feeId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 text-slate-800 font-bold">{student ? student.fullName : 'Unknown Student'}</td>
                        <td className="py-3 text-slate-500 max-w-[150px] truncate" title={record.feeType}>{record.feeType}</td>
                        <td className="py-3 text-rose-500 font-bold">
                          {record.dueDate ? new Date(record.dueDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'N/A'}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">{formattedAmount}</td>
                      </tr>
                    );
                  })}
                  {overdueFeeRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">No overdue payments.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
              {loading ? '...' : (overdueFeeRecords.length > 0 ? '1 Pending' : '0 Pending')}
            </span>
          </div>

          <div className="space-y-4 mb-4">
            {/* Item 1 */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <span className={`h-2 w-2 rounded-full shrink-0 mt-1.5 ${overdueFeeRecords.length > 0 ? 'bg-rose-500' : 'bg-slate-300'}`} />
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-slate-800 leading-tight">
                  {overdueFeeRecords.length > 0 ? `Review ${overdueFeeRecords.length} outstanding fee payments` : 'All payments up to date'}
                </h4>
                <p className="text-xs text-slate-400 font-normal leading-none">
                  {overdueFeeRecords.length > 0 ? 'Overdue payments detected in active batches' : 'No overdue accounts found'}
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-slate-800 leading-tight">Monitor active batch registrations</h4>
                <p className="text-xs text-slate-400 font-normal leading-none">
                  {batches.length} total cohorts currently loaded in system database
                </p>
              </div>
            </div>

            {/* Item 3 */}
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
          <p className="text-xs font-normal text-[#7E8B9B] mt-0.5">Scheduled calendar events, exam timetables, and admissions intakes</p>
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
