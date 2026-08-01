import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Save,
  Check,
  XCircle,
  ClipboardCheck,
  MessageSquare
} from 'lucide-react';
import Button from '@/components/common/Button';
import { reviewService, type CareerSubmissionData } from '@/services/reviewService';
import { studentService } from '@/services/studentService';
import { careerTaskService } from '@/services/careerTaskService';

interface Student {
  studentId: string;
  fullName: string;
  email: string;
}

interface CareerTask {
  taskId: string;
  title: string;
  pointValue: number;
  rubricCriteria: string;
}

interface PortfolioSubmission {
  submissionId: string;
  taskId: string;
  studentId: string;
  status: string; // PENDING, APPROVED, REJECTED
  submittedFile?: string;
  submitDate?: string;
  // Resolved UI fields
  studentName: string;
  studentEmail: string;
  taskTitle: string;
  targetLevel: string;
  pointValue: number;
  feedback?: string;
}

export const Reviews: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // --- States ---
  const [submissions, setSubmissions] = useState<PortfolioSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Modals State ---
  const [selectedSubmission, setSelectedSubmission] = useState<PortfolioSubmission | null>(null);
  const [showAssessModal, setShowAssessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Form States ---
  const [assessForm, setAssessForm] = useState({
    comments: '',
    decision: 'APPROVED' // APPROVED or REJECTED
  });

  // --- Mock Fallbacks (Sandbox visualization mode) ---
  const defaultStudents = useMemo<Student[]>(() => [
    { studentId: 'stu-1', fullName: 'Sachin Samarawickrama', email: 'sachin@edusys.edu' },
    { studentId: 'stu-2', fullName: 'Pawara Minimuthu', email: 'pawara@edusys.edu' },
    { studentId: 'stu-3', fullName: 'Sharadha Madusinghe', email: 'sharadha@edusys.edu' }
  ], []);

  const defaultTasks = useMemo<CareerTask[]>(() => [
    { taskId: 't-1', title: 'Build responsive App Layout', pointValue: 150, rubricCriteria: 'Level L3' },
    { taskId: 't-2', title: 'Integrate OAuth security flow', pointValue: 250, rubricCriteria: 'Level L5' },
    { taskId: 't-3', title: 'Complete Git Workflow & Pull Requests', pointValue: 50, rubricCriteria: 'Level L2' }
  ], []);

  const defaultSubmissions = useMemo<PortfolioSubmission[]>(() => [
    {
      submissionId: 'sub-1',
      taskId: 't-1',
      studentId: 'stu-1',
      status: 'PENDING',
      studentName: 'Sachin Samarawickrama',
      studentEmail: 'sachin@edusys.edu',
      taskTitle: 'Build responsive App Layout',
      targetLevel: 'Level L3',
      pointValue: 150
    },
    {
      submissionId: 'sub-2',
      taskId: 't-2',
      studentId: 'stu-3',
      status: 'PENDING',
      studentName: 'Sharadha Madusinghe',
      studentEmail: 'sharadha@edusys.edu',
      taskTitle: 'Integrate OAuth security flow',
      targetLevel: 'Level L5',
      pointValue: 250
    },
    {
      submissionId: 'sub-3',
      taskId: 't-3',
      studentId: 'stu-2',
      status: 'APPROVED',
      studentName: 'Pawara Minimuthu',
      studentEmail: 'pawara@edusys.edu',
      taskTitle: 'Complete Git Workflow & Pull Requests',
      targetLevel: 'Level L2',
      pointValue: 50,
      feedback: 'Excellent work on git branching and conflict resolution!'
    }
  ], []);

  // --- Fetch API Data ---
  const fetchSubmissionsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subsData, studentsData, tasksData] = await Promise.all([
        reviewService.getSubmissions(),
        studentService.getStudents().catch(() => []),
        careerTaskService.getTasks().catch(() => [])
      ]);

      const resolvedStudents = studentsData.length > 0 ? studentsData : defaultStudents;
      const resolvedTasks = tasksData.length > 0 ? tasksData : defaultTasks;

      // Map backend CareerSubmissionDTOs to resolved portfolio items
      const mapped: PortfolioSubmission[] = subsData.map((item, idx) => {
        const student = resolvedStudents.find((s: any) => s.studentId === item.studentId) || defaultStudents[idx % defaultStudents.length];
        const task = resolvedTasks.find((t: any) => t.taskId === item.taskId) || defaultTasks[idx % defaultTasks.length];

        return {
          submissionId: item.submissionId,
          taskId: item.taskId,
          studentId: item.studentId,
          status: item.status || 'PENDING',
          submittedFile: item.submittedFile,
          submitDate: item.submitDate,
          studentName: student.fullName || student.name || 'Student',
          studentEmail: student.email || 'student@edusys.edu',
          taskTitle: task.title || 'Task Portfolio',
          targetLevel: task.rubricCriteria || 'Level L3',
          pointValue: task.pointValue || 100
        };
      });

      setSubmissions(mapped.length > 0 ? mapped : defaultSubmissions);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to backend server. Running in simulated sandbox mode.');
      setSubmissions(defaultSubmissions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionsData();
  }, [defaultStudents, defaultTasks, defaultSubmissions]);

  // --- Filtered Submissions ---
  const pendingSubmissions = useMemo(() => {
    return submissions.filter(s => s.status === 'PENDING');
  }, [submissions]);

  const reviewedSubmissions = useMemo(() => {
    return submissions.filter(s => s.status === 'APPROVED' || s.status === 'REJECTED');
  }, [submissions]);

  // --- Dynamic Stats calculation ---
  const stats = useMemo(() => {
    const pendingCount = pendingSubmissions.length;
    const reviewedCount = reviewedSubmissions.length;
    const totalCount = pendingCount + reviewedCount;
    
    // Evaluation ratio
    const ratio = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;
    
    return {
      pendingCount,
      reviewedCount,
      ratio
    };
  }, [pendingSubmissions, reviewedSubmissions]);

  // --- Assess Click Handlers ---
  const handleAssessClick = (sub: PortfolioSubmission) => {
    setSelectedSubmission(sub);
    setAssessForm({
      comments: '',
      decision: 'APPROVED'
    });
    setShowAssessModal(true);
  };

  const handleAssessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      setSubmitting(true);
      const payload: CareerSubmissionData = {
        taskId: selectedSubmission.taskId,
        studentId: selectedSubmission.studentId,
        status: assessForm.decision,
        submittedFile: selectedSubmission.submittedFile || 'evaluated_portfolio'
      };

      const updated = await reviewService.updateSubmissionStatus(selectedSubmission.submissionId, payload);
      
      // Update local state list
      setSubmissions(prev => prev.map(s => s.submissionId === selectedSubmission.submissionId ? {
        ...s,
        status: updated.status,
        feedback: assessForm.comments || 'Evaluated.'
      } : s));

      setShowAssessModal(false);
      alert('Portfolio submission assessed successfully!');
    } catch (err: any) {
      console.error(err);
      // Fallback
      setSubmissions(prev => prev.map(s => s.submissionId === selectedSubmission.submissionId ? {
        ...s,
        status: assessForm.decision,
        feedback: assessForm.comments || 'Evaluated.'
      } : s));
      setShowAssessModal(false);
      alert('Simulation: Portfolio assessed locally.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-250 rounded-2xl text-rose-800 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
            <ClipboardCheck className="h-7 w-7 text-[#4F3FF0]" />
            Review Queue Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Assess portfolios, record grading rubrics, and award Career Scale levels L1-L7.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start select-none">
        
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1: PENDING REVIEWS */}
          <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">PENDING REVIEWS</span>
              <span className="text-2xl font-black text-slate-800 block font-heading">{stats.pendingCount}</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          </div>

          {/* Card 2: REVIEWED TASKS */}
          <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">REVIEWED TASKS</span>
              <span className="text-2xl font-black text-slate-800 block font-heading">{stats.reviewedCount}</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>

          {/* Card 3: EVALUATION RATIO */}
          <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">EVALUATION RATIO</span>
              <span className="text-2xl font-black text-slate-800 block font-heading">{stats.ratio}%</span>
              <span className="text-[10px] font-semibold text-slate-450 block">{stats.reviewedCount} reviewed : {stats.pendingCount} pending</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Save className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 4: Circular levels gauge chart */}
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-3 block">EVALUATED LEVELS RATIO</span>
          
          <div className="relative flex items-center justify-center">
            {/* Visual Circular ring */}
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="#E2E8F0"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="#4F3FF0"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="226"
                strokeDashoffset={226 - (226 * stats.ratio) / 100}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-sm font-black text-slate-800 font-heading">L3/L4</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">PRIMARY</span>
            </div>
          </div>
        </div>

      </div>

      {/* Tabs Selector Bar */}
      <div className="flex border-b border-[#E2E8F0] gap-8 select-none">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
            activeTab === 'pending' 
              ? 'text-[#4F3FF0] font-extrabold' 
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Pending Reviews ({stats.pendingCount})
          {activeTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
            activeTab === 'history' 
              ? 'text-[#4F3FF0] font-extrabold' 
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Reviewed History ({stats.reviewedCount})
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
          )}
        </button>
      </div>

      {/* Table Data */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
            <p className="text-slate-500 font-medium text-sm">Loading Review Queue...</p>
          </div>
        ) : activeTab === 'pending' ? (
          /* --- PENDING REVIEWS TAB --- */
          pendingSubmissions.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-extrabold text-slate-800 text-sm">Review queue is empty!</h3>
              <p className="text-slate-400 text-xs mt-1">All portfolios have been assessed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                    <th className="px-6 py-4">STUDENT NAME</th>
                    <th className="px-6 py-4">TASK PORTFOLIO</th>
                    <th className="px-6 py-4">DESIGNATED LEVEL</th>
                    <th className="px-6 py-4">REWARD POINTS</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
                  {pendingSubmissions.map(sub => (
                    <tr key={sub.submissionId} className="hover:bg-slate-50/20 transition-colors duration-150">
                      <td className="px-6 py-5">
                        <div className="font-extrabold text-slate-800 text-xs">{sub.studentName}</div>
                        <div className="text-[10px] text-slate-450 mt-0.5 font-semibold">{sub.studentEmail}</div>
                      </td>
                      <td className="px-6 py-5 text-slate-700 font-extrabold max-w-sm truncate">
                        {sub.taskTitle}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold text-[#4F3FF0] bg-indigo-50 border border-indigo-100 rounded-full select-none">
                          {sub.targetLevel}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-amber-600 font-black text-xs uppercase">
                        +{sub.pointValue} pts
                      </td>
                      <td className="px-6 py-5 text-right select-none">
                        <button
                          onClick={() => handleAssessClick(sub)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold rounded-xl transition-all cursor-pointer shadow-sm outline-none"
                        >
                          Assess Work
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* --- REVIEWED HISTORY TAB --- */
          reviewedSubmissions.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs">
              No portfolios evaluated in this session.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                    <th className="px-6 py-4">STUDENT NAME</th>
                    <th className="px-6 py-4">TASK PORTFOLIO</th>
                    <th className="px-6 py-4">EVALUATION DECISION</th>
                    <th className="px-6 py-4">FEEDBACK / CRITERIA LOG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
                  {reviewedSubmissions.map(sub => (
                    <tr key={sub.submissionId} className="hover:bg-slate-50/20 transition-colors duration-150">
                      <td className="px-6 py-5">
                        <div className="font-extrabold text-slate-800 text-xs">{sub.studentName}</div>
                        <div className="text-[10px] text-slate-450 mt-0.5 font-semibold">{sub.studentEmail}</div>
                      </td>
                      <td className="px-6 py-5 text-slate-700 font-extrabold max-w-sm truncate">
                        {sub.taskTitle}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 border text-[10px] font-bold rounded-full select-none leading-none ${
                          sub.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {sub.status === 'APPROVED' ? (
                            <>
                              <Check className="h-3.5 w-3.5 shrink-0" />
                              Approved
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5 shrink-0" />
                              Revision Requested
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-655 font-semibold leading-relaxed max-w-xs">
                        <span className="flex items-start gap-1.5">
                          <MessageSquare className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                          {sub.feedback || 'No comments left.'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* --- EVALUATION / ASSESS MODAL --- */}
      {showAssessModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-805 mb-1 font-heading">Evaluate Task Portfolio</h3>
            <p className="text-slate-450 text-xs font-semibold mb-5 select-none leading-none">Review student deliverables and award career points.</p>
            
            <div className="mb-5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-500 space-y-2">
              <div className="flex justify-between">
                <span>Student Name:</span>
                <span className="text-slate-800">{selectedSubmission.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span>Task Portfolio:</span>
                <span className="text-slate-800 max-w-[220px] truncate">{selectedSubmission.taskTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Designated Level:</span>
                <span className="text-[#4F3FF0]">{selectedSubmission.targetLevel}</span>
              </div>
              <div className="flex justify-between">
                <span>Reward Weight:</span>
                <span className="text-amber-600">+{selectedSubmission.pointValue} PTS</span>
              </div>
            </div>

            <form onSubmit={handleAssessSubmit} className="space-y-4 font-sans">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Comments / Evaluation Feedback *</label>
                <textarea
                  value={assessForm.comments}
                  onChange={e => setAssessForm(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Leave feedback on student's repository and code structure..."
                  className="w-full pl-4 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-850 placeholder-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 min-h-[80px]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Evaluation Decision</label>
                <select
                  value={assessForm.decision}
                  onChange={e => setAssessForm(prev => ({ ...prev, decision: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                >
                  <option value="APPROVED">Approve Portfolio & Award Points</option>
                  <option value="REJECTED">Request Portfolio Revision</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <Button type="button" variant="outline" color="secondary" onClick={() => setShowAssessModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  Save Evaluation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reviews;
