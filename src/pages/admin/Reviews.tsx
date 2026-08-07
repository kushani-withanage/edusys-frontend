import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  BookOpen,
  CheckCircle,
  Trophy,
  Activity,
  ArrowLeft,
  X,
  AlertTriangle,
  ClipboardCheck,
  ChevronRight
} from 'lucide-react';
import { careerSubmissionService, type CareerSubmissionData } from '@/services/careerSubmissionService';
import { careerTaskService, type CareerTaskData } from '@/services/careerTaskService';
import { pointsLevelService, type CareerLevelData } from '@/services/pointsLevelService';
import { batchService } from '@/services/batchService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubmissionsTable } from '@/components/common/SubmissionsTable';
import { toast } from '@/utils/toast';

export const Reviews: React.FC = () => {
  // --- States ---
  const [batches, setBatches] = useState<any[]>([]);
  const [levels, setLevels] = useState<CareerLevelData[]>([]);
  const [tasks, setTasks] = useState<CareerTaskData[]>([]);
  
  // Selection
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedTask, setSelectedTask] = useState<CareerTaskData | null>(null);

  // Table rows data
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [taskSubmissions, setTaskSubmissions] = useState<CareerSubmissionData[]>([]);

  // Statistics
  const [statsData, setStatsData] = useState<{
    industryReadyCount: number;
    levelStats: Array<{
      levelId: string;
      levelNumber: number;
      title: string;
      completedCount: number;
    }>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Review/Assess Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<CareerSubmissionData | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [reviewForm, setReviewForm] = useState({
    status: 'APPROVED', // APPROVED, REJECTED, REVISION_REQUESTED
    points: 0,
    comment: ''
  });

  // Fetch initial stats, levels, batches
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [levelsData, batchesData] = await Promise.all([
        pointsLevelService.getLevels(),
        batchService.getBatches()
      ]);

      setLevels(levelsData || []);
      setBatches(batchesData || []);

      // Load stats
      try {
        const fetchedStats = await fetchStats();
        setStatsData(fetchedStats);
      } catch (e) {
        console.error('Failed to load stats', e);
      }

      if (batchesData && batchesData.length > 0) {
        setSelectedBatchId(batchesData[0].batchId);
      }
      if (levelsData && levelsData.length > 0) {
        setSelectedLevelId(levelsData[0].id || '');
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to backend server. Make sure the server is online.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/career/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Stats load failed');
    }
    return response.json();
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch tasks when selected level changes
  useEffect(() => {
    if (!selectedLevelId) return;
    const fetchTasks = async () => {
      try {
        const list = await careerTaskService.getActiveTasksByLevel(selectedLevelId);
        setTasks(list || []);
        // Reset selected task
        setSelectedTask(null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTasks();
  }, [selectedLevelId]);

  // Load students & submissions when a task is opened
  const handleOpenTaskSubmissions = async (task: CareerTaskData) => {
    if (!selectedBatchId) {
      toast.error('Please select a batch first.');
      return;
    }
    
    try {
      setLoading(true);
      setSelectedTask(task);

      // 1. Get students of selected batch
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/v1/batches/${selectedBatchId}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch batch students.');
      const students = await response.json();

      // 2. Get submissions for this task
      const submissions = await careerSubmissionService.getSubmissions(undefined, task.id);

      setBatchStudents(students || []);
      // Filter submissions only for students in this batch
      const studentIds = new Set(students.map((s: any) => s.userId));
      const filteredSubmissions = (submissions || []).filter(s => studentIds.has(s.studentId));

      setTaskSubmissions(filteredSubmissions);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load submissions list.');
    } finally {
      setLoading(false);
    }
  };

  // Open review modal
  const handleOpenReview = (student: any, sub: any) => {
    setActiveStudent(student);
    setActiveSubmission(sub);
    setReviewError('');
    setReviewForm({
      status: 'APPROVED',
      points: selectedTask?.pointsValue || 0,
      comment: ''
    });
    setShowReviewModal(true);
  };

  // Save review
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission?.id) return;
    setReviewError('');

    const pts = Number(reviewForm.points);
    if (reviewForm.status === 'APPROVED') {
      if (pts < 0 || pts > (selectedTask?.pointsValue || 0)) {
        setReviewError(`Points must be between 0 and ${selectedTask?.pointsValue}`);
        return;
      }
    }

    try {
      setReviewSubmitting(true);
      await careerSubmissionService.reviewSubmission(
        activeSubmission.id,
        reviewForm.status,
        reviewForm.status === 'APPROVED' ? pts : 0,
        reviewForm.comment
      );
      toast.success('Review decision saved successfully!');
      setShowReviewModal(false);
      
      // Refresh statistics & submissions list
      const stats = await fetchStats();
      setStatsData(stats);
      if (selectedTask) {
        handleOpenTaskSubmissions(selectedTask);
      }
    } catch (err: any) {
      console.error(err);
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto font-sans pb-10 select-none">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-[#4F3FF0]" />
            {selectedTask ? (
              <>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="hover:text-[#4F3FF0] transition-colors"
                >
                  Reviewer Workflow
                </button>
                <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                <span className="text-slate-500 font-extrabold text-lg truncate max-w-sm">{selectedTask.title}</span>
              </>
            ) : (
              'Reviewer Workflow'
            )}
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Evaluate student deliverables, award progression points, and view stats.
          </p>
        </div>
      </div>

      {!selectedTask ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Landing: Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Industry Ready Banner */}
            <div className="md:col-span-1 bg-slate-900 border border-slate-850 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -right-6 -bottom-6 opacity-5">
                <Trophy className="h-32 w-32" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                  Industry Readiness
                </span>
                <h2 className="text-3xl font-black font-mono">
                  {statsData?.industryReadyCount || 0}
                </h2>
                <p className="text-xs text-slate-400 font-bold">
                  Students cleared at final career stage level.
                </p>
              </div>
              <div className="pt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-400 select-none">
                  <CheckCircle className="h-3.5 w-3.5" /> Industry Ready
                </span>
              </div>
            </div>

            {/* Level stats mapping list */}
            <div className="md:col-span-2 bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-455 flex items-center gap-1.5 select-none">
                <Activity className="h-4 w-4 text-[#4F3FF0]" /> Student Progression Stages
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {statsData?.levelStats && statsData.levelStats.length > 0 ? (
                  statsData.levelStats.map(lvl => (
                    <div key={lvl.levelId} className="p-4 border border-[#E9EDF5] rounded-2xl hover:border-slate-350 transition-all bg-slate-50/50 space-y-2">
                      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[9px] font-black text-[#4F3FF0]">
                        Level L{lvl.levelNumber}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-slate-900 truncate" title={lvl.title}>{lvl.title}</p>
                        <p className="text-[10px] text-slate-450 font-bold">{lvl.completedCount} Active / Cleared</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 py-8 text-center text-slate-400 font-bold text-xs uppercase">
                    Configure Levels to display completion statistics.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selector filters bar */}
          <div className="bg-white border border-[#E9EDF5] rounded-3xl p-4.5 shadow-sm flex flex-col sm:flex-row items-center gap-4 select-none">
            <div className="flex items-center gap-2 font-bold text-slate-700 text-xs w-full sm:w-auto">
              <span className="text-[10px] font-black text-slate-455 uppercase tracking-wider">Select Batch:</span>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#4F3FF0] cursor-pointer w-full sm:w-48"
              >
                {batches.map(b => (
                  <option key={b.batchId} value={b.batchId}>{b.batchName}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 font-bold text-slate-700 text-xs w-full sm:w-auto">
              <span className="text-[10px] font-black text-slate-455 uppercase tracking-wider">Select Level:</span>
              <select
                value={selectedLevelId}
                onChange={(e) => setSelectedLevelId(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#4F3FF0] cursor-pointer w-full sm:w-48"
              >
                {levels.map(l => (
                  <option key={l.id} value={l.id}>L{l.levelNumber} - {l.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm font-heading">Tasks queue</h3>
              <p className="text-slate-455 text-[10px] font-semibold mt-0.5">Click a task to grade batch student submissions.</p>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-205 rounded-3xl">
                <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">No active tasks defined for this level</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map(task => (
                  <div 
                    key={task.id} 
                    className="bg-white border border-[#E9EDF5] hover:border-[#4F3FF0]/60 p-6 rounded-3xl shadow-xs transition-all relative flex flex-col justify-between h-48 hover:shadow-md cursor-pointer select-none"
                    onClick={() => handleOpenTaskSubmissions(task)}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-black text-[#4F3FF0]">
                          +{task.pointsValue} PTS
                        </span>
                        <span className="text-[9px] font-black uppercase text-slate-400">
                          {task.submissionType}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">{task.title}</h4>
                      <p className="text-[10px] text-slate-450 font-medium leading-relaxed line-clamp-3">
                        {task.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#4F3FF0] hover:text-[#3D2ED0] font-black text-[10px] uppercase tracking-wider pt-2 border-t border-slate-50 select-none">
                      Review Deliverables <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Back button */}
          <div>
            <button
              onClick={() => setSelectedTask(null)}
              className="px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-650 hover:text-slate-900 text-xs font-black rounded-xl transition-all cursor-pointer bg-white flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>
          </div>

          {/* Submissions list table for task */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-3xl">
              <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Syncing submissions queue...</p>
            </div>
          ) : (
            <SubmissionsTable
              title="Career Task Review"
              subtitle={`Task: ${selectedTask.title} (Max: ${selectedTask.pointsValue} pts)`}
              students={batchStudents}
              submissions={taskSubmissions}
              isCareerScale={true}
              onReview={(student, sub) => handleOpenReview(student, sub)}
            />
          )}
        </div>
      )}

      {/* Review Assess dialog Modal */}
      {showReviewModal && activeStudent && activeSubmission && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl border border-[#E9EDF5] space-y-4 text-left animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Review Deliverable</h3>
                <p className="text-[10px] text-slate-455 font-bold mt-0.5">{activeStudent.fullName}</p>
              </div>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {reviewError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase block">Decision *</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full pl-3 pr-8 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-800 font-bold outline-none focus:bg-white cursor-pointer"
                  required
                >
                  <option value="APPROVED">APPROVE DELIVERABLE</option>
                  <option value="REVISION_REQUESTED">REQUEST REVISION</option>
                  <option value="REJECTED">REJECT SUBMISSION</option>
                </select>
              </div>

              {reviewForm.status === 'APPROVED' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">Points Awarded (Max: {selectedTask.pointsValue}) *</label>
                  <input 
                    type="number"
                    min="0"
                    max={selectedTask.pointsValue}
                    value={reviewForm.points}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, points: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase block">Review Feedback comments</label>
                <textarea
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold"
                  placeholder="Type feedback comment here for student..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
                  disabled={reviewSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-[#4F3FF0]/10 flex items-center justify-center gap-1.5"
                >
                  {reviewSubmitting ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    'Save changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
