import React, { useState, useEffect, useRef } from 'react';
import { 
  Award,
  CheckCircle,
  Briefcase,
  Lock,
  Loader2,
  Send,
  Link as LinkIcon,
  Image as ImageIcon,
  FileText,
  FileCode,
  Clock,
  History,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { careerSubmissionService, type CareerSubmissionData, type StudentCareerProgressData } from '@/services/careerSubmissionService';
import { careerTaskService, type CareerTaskData } from '@/services/careerTaskService';
import { pointsLevelService, type CareerLevelData } from '@/services/pointsLevelService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Button from '@/components/common/Button';

export const StudentCareer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ladder' | 'tasks' | 'history'>('ladder');

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [progress, setProgress] = useState<StudentCareerProgressData | null>(null);
  const [levels, setLevels] = useState<CareerLevelData[]>([]);
  const [tasks, setTasks] = useState<CareerTaskData[]>([]);
  const [mySubmissions, setMySubmissions] = useState<CareerSubmissionData[]>([]);

  // Submit Modal States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CareerTaskData | null>(null);
  const [isResubmission, setIsResubmission] = useState(false);

  // Form Fields
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [progressData, levelsData, tasksData, submissionsData] = await Promise.all([
        careerSubmissionService.getStudentProgress(),
        pointsLevelService.getLevels(),
        careerTaskService.getTasks(),
        careerSubmissionService.getMySubmissions()
      ]);

      setProgress(progressData);
      setLevels(levelsData);
      setTasks(tasksData);
      setMySubmissions(submissionsData);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to backend server. Make sure the server is online.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenSubmit = (task: CareerTaskData, resubmissionId: string | null = null) => {
    setSelectedTask(task);
    setIsResubmission(!!resubmissionId);
    setSubmissionUrl('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowSubmitModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Capped at 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds the maximum limit of 10MB.');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !selectedTask.id) return;

    const type = selectedTask.submissionType.toUpperCase();
    if (type === 'LINK' && !submissionUrl.trim()) {
      alert('Please provide a valid URL.');
      return;
    }
    if ((type === 'IMAGE' || type === 'PDF' || type === 'FILE') && !selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

    try {
      setSubmitting(true);
      await careerSubmissionService.submitWork(
        selectedTask.id,
        type,
        type === 'LINK' ? submissionUrl : undefined,
        selectedFile || undefined
      );
      alert('Deliverable submitted successfully!');
      setShowSubmitModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to submit deliverable.');
    } finally {
      setSubmitting(false);
    }
  };

  // Check the status of a specific task
  const getTaskStatusInfo = (taskId: string) => {
    const taskSubs = mySubmissions.filter(s => s.taskId === taskId);
    if (taskSubs.length === 0) {
      return { status: 'NOT_SUBMITTED', label: 'Not Submitted', color: 'text-slate-450 bg-slate-50 border-slate-100' };
    }

    // Sort to get latest submission
    const latest = taskSubs[0]; // mySubmissions is sorted desc by submittedAt
    if (latest.status === 'APPROVED') {
      return { status: 'APPROVED', label: 'Approved', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', points: latest.pointsAwarded, submission: latest };
    }
    if (latest.status === 'REVISION_REQUESTED') {
      return { status: 'REVISION_REQUESTED', label: 'Revision Requested', color: 'text-amber-700 bg-amber-50 border-amber-200', feedback: latest.reviewerComment, submission: latest };
    }
    if (latest.status === 'REJECTED') {
      return { status: 'REJECTED', label: 'Rejected', color: 'text-rose-700 bg-rose-50 border-rose-200', feedback: latest.reviewerComment, submission: latest };
    }
    return { status: 'PENDING', label: 'Pending Review', color: 'text-sky-700 bg-sky-50 border-sky-200', submission: latest };
  };

  // Icon mapping for submission type
  const getSubmissionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'LINK': return <LinkIcon className="h-4 w-4 text-sky-500" />;
      case 'IMAGE': return <ImageIcon className="h-4 w-4 text-emerald-500" />;
      case 'PDF': return <FileText className="h-4 w-4 text-rose-500" />;
      case 'TEXT': return <FileCode className="h-4 w-4 text-amber-500" />;
      default: return <HelpCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const currentLevelNumber = progress?.currentLevelNumber || 1;
  const progressPercent = progress ? Math.min(100, Math.round((progress.totalPointsAtLevel / progress.levelPointsRequired) * 100)) : 0;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto font-sans pb-10">
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
            <Award className="h-6 w-6 text-[#4F3FF0]" />
            Student Career Ladder
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Track your professional skills progress, complete practical milestones, and advance to higher levels.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-1.5 rounded-2xl flex items-center gap-4 flex-wrap max-w-max select-none font-bold text-[10px] uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('ladder')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'ladder'
              ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-sm font-black'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          My Ladder
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-sm font-black'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Tasks List
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-sm font-black'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Submission History
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-3xl">
          <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Syncing Career Ladder details...</p>
        </div>
      ) : (
        <div>
          {/* LADDER TAB */}
          {activeTab === 'ladder' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-200">
              
              {/* Stepped Ladder status list */}
              <div className="lg:col-span-2 bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 select-none">
                  LADDER STAGES (L1-L7)
                </h3>

                <div className="space-y-4">
                  {levels.map(lvl => {
                    const isCompleted = lvl.levelNumber < currentLevelNumber;
                    const isCurrent = lvl.levelNumber === currentLevelNumber;
                    const isLocked = lvl.levelNumber > currentLevelNumber;
                    
                    return (
                      <div 
                        key={lvl.id}
                        className={`p-4 border rounded-2xl flex items-start gap-4 transition-all ${
                          isCurrent 
                            ? 'border-amber-400 bg-amber-50/10 shadow-sm' 
                            : 'border-[#E9EDF5]'
                        } ${isLocked ? 'opacity-50' : ''}`}
                      >
                        <div className="shrink-0 mt-0.5 select-none">
                          {isCompleted ? (
                            <span className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
                              <CheckCircle className="h-5 w-5" />
                            </span>
                          ) : isCurrent ? (
                            <span className="h-8 w-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center border border-amber-300 animate-pulse">
                              <Briefcase className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="h-8 w-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center border border-slate-200">
                              <Lock className="h-4 w-4" />
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="font-extrabold text-slate-800 text-sm">
                              L{lvl.levelNumber}: {lvl.title}
                            </h4>
                            <span className="text-[9px] font-extrabold text-slate-450 uppercase">
                              Requires {lvl.pointsRequired} pts
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            {lvl.description}
                          </p>

                          {isCurrent && progress && (
                            <div className="space-y-1.5 pt-2 select-none">
                              <div className="flex justify-between text-[9px] font-black text-amber-700 tracking-wider uppercase">
                                <span>STAGE EXPERIENCE</span>
                                <span>{progress.totalPointsAtLevel} / {progress.levelPointsRequired} PTS ({progressPercent}%)</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar badge summary */}
              <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm space-y-4 text-center">
                <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase block select-none">CURRENT BADGE STATUS</span>
                
                <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-[#4F3FF0] shadow-inner select-none relative">
                  <Award className="h-12 w-12" />
                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full border-2 border-white shadow-sm uppercase">
                    L{currentLevelNumber}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-slate-800 text-sm">{progress?.currentLevelTitle || 'Explorer'} Stage</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Ready for industrial tasks</p>
                </div>
              </div>

            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tasks.map(task => {
                  const isLocked = (task.levelNumber || 1) > currentLevelNumber;
                  const statusInfo = getTaskStatusInfo(task.id!);
                  
                  return (
                    <div 
                      key={task.id}
                      className={`bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm flex flex-col justify-between relative ${
                        isLocked ? 'opacity-60 bg-slate-50/50' : ''
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4 select-none">
                          <span className="inline-flex px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-[#4F3FF0] rounded-md text-[9px] font-extrabold uppercase leading-none">
                            L{task.levelNumber} - {task.levelTitle}
                          </span>
                          <span className="text-amber-500 font-black text-xs">
                            +{task.pointsValue} PTS
                          </span>
                        </div>
                        
                        <h4 className="font-extrabold text-slate-800 text-sm leading-snug flex items-center gap-1.5">
                          {task.title}
                          {isLocked && <Lock className="h-3.5 w-3.5 text-slate-450 shrink-0" />}
                        </h4>
                        
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          {task.description}
                        </p>


                        
                        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 select-none">
                          <div className="flex items-center gap-1.5 font-bold uppercase text-[9px] text-slate-500">
                            {getSubmissionIcon(task.submissionType)}
                            <span>{task.submissionType}</span>
                          </div>

                          <span className={`inline-flex items-center gap-1 px-3 py-1 border text-[9px] font-black rounded-full select-none leading-none uppercase ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        {statusInfo.feedback && (
                          <div className="p-3 bg-amber-50/50 border border-amber-100 text-[10px] text-amber-700 font-semibold rounded-xl leading-relaxed">
                            <span className="font-black block uppercase text-[8px] text-amber-600 mb-0.5">Reviewer Feedback:</span>
                            {statusInfo.feedback}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 select-none">
                        {isLocked ? (
                          <button
                            disabled
                            className="w-full py-2.5 bg-slate-100 text-slate-400 text-xs font-black rounded-xl cursor-not-allowed leading-none flex items-center justify-center gap-1.5 border border-slate-200"
                          >
                            <Lock className="h-3 w-3 shrink-0" /> Locked (Requires L{task.levelNumber})
                          </button>
                        ) : statusInfo.status === 'APPROVED' ? (
                          <button
                            disabled
                            className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-xl cursor-not-allowed leading-none flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="h-3.5 w-3.5 shrink-0" /> Completed (+{statusInfo.points} pts earned)
                          </button>
                        ) : statusInfo.status === 'PENDING' ? (
                          <button
                            disabled
                            className="w-full py-2.5 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-black rounded-xl cursor-not-allowed leading-none flex items-center justify-center gap-1.5"
                          >
                            <Clock className="h-3.5 w-3.5 shrink-0" /> Awaiting Evaluation
                          </button>
                        ) : statusInfo.status === 'REVISION_REQUESTED' ? (
                          <button
                            onClick={() => handleOpenSubmit(task, statusInfo.submission?.id)}
                            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer leading-none flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Send className="h-3 w-3 shrink-0" /> Resubmit Revision
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSubmit(task)}
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all cursor-pointer leading-none flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Send className="h-3 w-3 shrink-0" /> Submit Deliverable
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="font-extrabold text-slate-805 text-sm flex items-center gap-1.5 select-none">
                  <History className="h-4.5 w-4.5 text-[#4F3FF0]" />
                  Submission History Logs
                </h3>
                <p className="text-slate-450 text-[10px] font-bold uppercase tracking-wider mt-0.5">Logs of all portfolio submissions and status modifications.</p>
              </div>

              {mySubmissions.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs font-semibold">
                  No submissions have been recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#E9EDF5] rounded-2xl">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-bold tracking-wider uppercase">
                        <th className="px-6 py-4">Task Deliverable</th>
                        <th className="px-6 py-4">Submission Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Points Awarded</th>
                        <th className="px-6 py-4">Reviewer Comments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
                      {mySubmissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50/20 transition-colors duration-150">
                          <td className="px-6 py-4 text-slate-800 font-extrabold">{sub.taskTitle}</td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 border text-[9px] font-black rounded-full select-none leading-none uppercase ${
                              sub.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : sub.status === 'REVISION_REQUESTED'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : sub.status === 'PENDING'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-amber-600 font-black text-xs">
                            {sub.pointsAwarded !== null && sub.pointsAwarded !== undefined ? `+${sub.pointsAwarded} PTS` : '—'}
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-bold leading-relaxed max-w-xs truncate">
                            {sub.reviewerComment || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PORTFOLIO SUBMISSION MODAL */}
      {showSubmitModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E9EDF5] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-left">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 font-heading">
                {isResubmission ? 'Resubmit Task Revision' : 'Submit Deliverable work'}
              </h3>
              <p className="text-xs text-slate-450 mt-1">{selectedTask.title}</p>
            </div>

            <form onSubmit={handleSubmitWork} className="space-y-4 font-sans">
              {/* Conditional Inputs based on submissionType */}
              {selectedTask.submissionType === 'LINK' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-450 uppercase block select-none">Portfolio Repository URL *</label>
                  <input
                    type="url"
                    required
                    value={submissionUrl}
                    onChange={e => setSubmissionUrl(e.target.value)}
                    placeholder="e.g. https://github.com/my-profile/my-repo"
                    className="w-full px-3 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-700 placeholder-slate-450 outline-none transition-all"
                  />
                </div>
              )}

              {(selectedTask.submissionType === 'IMAGE' || selectedTask.submissionType === 'PDF' || selectedTask.submissionType === 'FILE') && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-450 uppercase block select-none">
                    Upload Deliverable File ({selectedTask.submissionType}) *
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    required
                    onChange={handleFileChange}
                    accept={
                      selectedTask.submissionType === 'IMAGE' ? 'image/*' :
                      selectedTask.submissionType === 'PDF' ? 'application/pdf' :
                      '*'
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-700 cursor-pointer"
                  />
                  <span className="block text-[8px] font-bold text-slate-400 mt-1 select-none">Capped at maximum file size of 10MB</span>
                </div>
              )}



              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-sans select-none">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-5 py-2.5 border border-[#E2E8F0] text-slate-500 text-xs font-bold rounded-xl cursor-pointer"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="solid"
                  color="primary"
                  isLoading={submitting}
                >
                  Submit Deliverable
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCareer;
