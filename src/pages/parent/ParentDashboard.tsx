import React, { useState, useEffect } from 'react';
import { 
  User, 
  Award, 
  Loader2, 
  AlertCircle,
  FileText,
  Mail,
  GraduationCap,
  Layers,
  Bookmark,
  ChevronDown
} from 'lucide-react';
import { api } from '@/utils/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Child {
  studentId: string;
  fullName: string;
  email: string;
  nic: string;
  regNo: string;
  currentBatchId: string;
  batchName: string;
}



interface ExamRecord {
  attemptId: string;
  examId: string;
  examTitle: string;
  startedAt: string;
  submittedAt: string | null;
  status: string;
  score: number | null;
  courseName: string;
}

interface CareerSubmission {
  submissionId: string;
  taskTitle: string;
  status: string;
  pointsAwarded: number | null;
  feedback: string | null;
  submittedAt: string;
}

interface CareerScaleProgress {
  levelName: string;
  levelIndex: number;
  points: number;
  pointsRequired: number;
  submissions: CareerSubmission[];
}

export const ParentDashboard: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isChildDropdownOpen, setIsChildDropdownOpen] = useState(false);
  const childDropdownRef = React.useRef<HTMLDivElement>(null);
  

  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [careerScale, setCareerScale] = useState<CareerScaleProgress | null>(null);

  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs: 'exams' | 'career'
  const [activeTab, setActiveTab] = useState<'exams' | 'career'>('exams');

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (childDropdownRef.current && !childDropdownRef.current.contains(e.target as Node)) {
        setIsChildDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Load children on mount
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoadingChildren(true);
        setError(null);
        const data = await api.get<Child[]>('/api/v1/parent/children');
        setChildren(data || []);
        if (data && data.length > 0) {
          setSelectedChild(data[0]);
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch linked children. Please verify connection to the server.');
      } finally {
        setLoadingChildren(false);
      }
    };
    fetchChildren();
  }, []);

  // Load child portfolio data when selectedChild changes
  useEffect(() => {
    if (!selectedChild) return;

    const fetchChildData = async () => {
      try {
        setLoadingData(true);
        
        const [examsData, careerData] = await Promise.all([
          api.get<ExamRecord[]>(`/api/v1/parent/children/${selectedChild.studentId}/exams`),
          api.get<CareerScaleProgress>(`/api/v1/parent/children/${selectedChild.studentId}/career-scale`)
        ]);

        setExams(examsData || []);
        setCareerScale(careerData || null);
      } catch (err: any) {
        console.error(err);
        // Silently capture or show generic notice
      } finally {
        setLoadingData(false);
      }
    };

    fetchChildData();
  }, [selectedChild]);



  // Format date helper
  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Pending';
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loadingChildren) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white border border-[#E9EDF5] rounded-3xl min-h-[400px]">
        <Loader2 className="h-10 w-10 text-[#4F3FF0] animate-spin" />
        <p className="text-slate-500 font-bold text-sm tracking-wide">Retrieving student directories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {error && (
        <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20 text-rose-600 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <AlertDescription className="font-semibold text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Header Panel */}
      <div className="border-b border-[#E9EDF5] pb-6 flex flex-wrap items-center justify-between gap-4 select-none text-left">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
            <GraduationCap className="h-8 w-8 text-[#4F3FF0]" />
            Parent Monitoring Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track linked children's assignments, course results, and Career Scale level progressions.
          </p>
        </div>

        {/* Child Selector */}
        {children.length > 0 && (
          <div ref={childDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsChildDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] px-5 py-3 rounded-full hover:border-[#4F3FF0]/40 hover:shadow-md transition-all duration-200 cursor-pointer text-xs font-black shadow-sm uppercase select-none"
            >
              <span className="text-slate-400 font-extrabold tracking-wider">Select Child:</span>
              <span className="text-slate-800 font-extrabold normal-case pl-1">
                {selectedChild?.fullName || ''}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400 pl-0.5 shrink-0" />
            </button>
            
            {isChildDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E9EDF5] rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                {children.map(c => (
                  <button
                    key={c.studentId}
                    type="button"
                    onClick={() => {
                      setSelectedChild(c);
                      setIsChildDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-extrabold text-slate-700 hover:bg-[#4F3FF0]/5 hover:text-[#4F3FF0] transition-colors ${
                      selectedChild?.studentId === c.studentId ? 'bg-[#4F3FF0]/5 text-[#4F3FF0]' : ''
                    }`}
                  >
                    {c.fullName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {children.length === 0 ? (
        <div className="bg-white border border-[#E9EDF5] rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <User className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Children Linked</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Your parent profile currently does not have any linked student profiles. Please contact the administrative faculty to register your relationship link.
          </p>
        </div>
      ) : (
        selectedChild && (
          <div className="space-y-6">
            {/* Child Summary Profile Card */}
            <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-6 text-left">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-indigo-50 border border-indigo-100 text-[#4F3FF0] rounded-2xl flex items-center justify-center font-black text-2xl font-heading shadow-inner">
                  {selectedChild.fullName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 font-heading">{selectedChild.fullName}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Bookmark className="h-3.5 w-3.5 text-slate-400" />
                      Reg: {selectedChild.regNo}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {selectedChild.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      Batch: <strong className="text-indigo-600 font-extrabold">{selectedChild.batchName}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Aggregated KPI Cards */}
              <div className="flex gap-4">
                {/* Career points */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-5 py-3 rounded-2xl text-center min-w-[110px]">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block mb-0.5">Career Scale level</span>
                  <span className="text-xl font-black text-amber-500 block font-heading">
                    {careerScale ? `L${careerScale.levelIndex}` : 'L1'}
                  </span>
                </div>
              </div>
            </div>

            {/* Dashboard Content & Tabs */}
            <div className="space-y-6">
              {/* Tab Bar */}
              <div className="flex gap-2 border-b border-[#E9EDF5] pb-px">

                <button
                  onClick={() => setActiveTab('exams')}
                  className={`pb-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                    activeTab === 'exams' 
                      ? 'border-[#4F3FF0] text-[#4F3FF0]' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Exams & Scores
                </button>
                <button
                  onClick={() => setActiveTab('career')}
                  className={`pb-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                    activeTab === 'career' 
                      ? 'border-[#4F3FF0] text-[#4F3FF0]' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Award className="h-4 w-4" />
                  Career Scale
                </button>
              </div>

              {/* Tab Details */}
              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-3xl min-h-[300px]">
                  <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
                  <p className="text-slate-500 font-semibold text-sm">Aggregating portfolio details...</p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-200">


                  {/* --- EXAMS TAB --- */}
                  {activeTab === 'exams' && (
                    <div className="bg-white border border-[#E9EDF5] rounded-3xl overflow-hidden shadow-sm">
                      {exams.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 text-sm">No exam attempts logged yet.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[#F8FAFC] border-b border-[#E9EDF5] text-[10px] font-black uppercase tracking-wider text-slate-500 select-none">
                                <th className="px-6 py-4">Course</th>
                                <th className="px-6 py-4">Exam Details</th>
                                <th className="px-6 py-4">Submitted Date</th>
                                <th className="px-6 py-4">Attempt Status</th>
                                <th className="px-6 py-4 text-right">Score achieved</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {exams.map(e => {
                                const score = e.score;
                                return (
                                  <tr key={e.attemptId} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4.5 font-bold text-slate-800 text-sm">
                                      {e.courseName}
                                    </td>
                                    <td className="px-6 py-4.5 text-slate-650 text-sm font-semibold">
                                      {e.examTitle}
                                    </td>
                                    <td className="px-6 py-4.5 text-xs text-slate-500 font-medium">
                                      {formatDate(e.submittedAt)}
                                    </td>
                                    <td className="px-6 py-4.5">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full select-none ${
                                        e.status === 'SUBMITTED' || e.status === 'AUTO_SUBMITTED'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                                      }`}>
                                        {e.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4.5 text-right">
                                      {score !== null ? (
                                        <span className="text-sm font-black text-[#4F3FF0] font-heading">
                                          {score.toFixed(1)}%
                                        </span>
                                      ) : (
                                        <span className="text-xs text-slate-400 font-bold select-none">--</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- CAREER SCALE TAB --- */}
                  {activeTab === 'career' && careerScale && (
                    <div className="space-y-6">
                      {/* Progress Metrics Panel */}
                      <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">Career scale progression standing</h4>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-indigo-650 font-heading">
                              {careerScale.levelName}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              (Index Level L{careerScale.levelIndex})
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed font-sans">
                            Industry readiness task milestones and level criteria. Students submit deliverables to reviewer faculty to score leveling criteria.
                          </p>
                        </div>

                        {/* Points Slider */}
                        <div className="space-y-3 flex flex-col justify-center">
                          <div className="flex justify-between text-xs font-bold text-slate-600">
                            <span>Points At Current Level: <strong className="text-indigo-600">{careerScale.points}</strong></span>
                            <span>Level Target: {careerScale.pointsRequired} pts</span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/50">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-[#4F3FF0] h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, (careerScale.points / (careerScale.pointsRequired || 100)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submission History */}
                      <div className="bg-white border border-[#E9EDF5] rounded-3xl overflow-hidden shadow-sm">
                        <div className="bg-[#F8FAFC] border-b border-[#E9EDF5] px-6 py-4 flex items-center justify-between select-none">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">Read-Only Submission Log</h4>
                        </div>
                        {careerScale.submissions.length === 0 ? (
                          <div className="py-20 text-center text-slate-400 text-sm">No task milestones submitted to reviewer list.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[#F8FAFC] border-b border-[#E9EDF5] text-[10px] font-black uppercase tracking-wider text-slate-500 select-none">
                                  <th className="px-6 py-4">Task Milestone Title</th>
                                  <th className="px-6 py-4">Submission Date</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4 text-right">Points awarded</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-sans">
                                {careerScale.submissions.map(sub => {
                                  const points = sub.pointsAwarded;
                                  return (
                                    <tr key={sub.submissionId} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-6 py-4.5 font-bold text-slate-800 text-sm">
                                        {sub.taskTitle}
                                      </td>
                                      <td className="px-6 py-4.5 text-xs text-slate-500 font-medium">
                                        {formatDate(sub.submittedAt)}
                                      </td>
                                      <td className="px-6 py-4.5">
                                        <div className="space-y-1">
                                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full select-none ${
                                            sub.status === 'APPROVED'
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                              : sub.status === 'REJECTED'
                                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                                          }`}>
                                            {sub.status}
                                          </span>
                                          {sub.feedback && (
                                            <span className="block text-[10px] text-slate-400 font-medium leading-relaxed italic" title={sub.feedback}>
                                              "{sub.feedback}"
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4.5 text-right">
                                        {points !== null ? (
                                          <span className="text-sm font-black text-indigo-600 font-heading">
                                            +{points} pts
                                          </span>
                                        ) : (
                                          <span className="text-xs text-slate-400 font-bold select-none">--</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )
      )}

    </div>
  );
};

export default ParentDashboard;
