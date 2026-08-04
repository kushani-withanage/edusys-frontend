import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award,
  CheckCircle,
  Briefcase,
  Lock,
  Loader2,
  Send
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { careerTaskService } from '@/services/careerTaskService';
import { reviewService } from '@/services/reviewService';

interface ScaleLevel {
  code: string;
  name: string;
  points: number;
  description: string;
  status: 'completed' | 'current' | 'locked';
}

export const StudentCareer: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ladder' | 'tasks'>('ladder');

  // --- States ---
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [tasks, setTasks] = useState<any[]>([]);
  const points = 240;

  // Submit Modal States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [portfolioLink, setPortfolioLink] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Define static levels matching Figure 3.18
  const careerLevels = useMemo<ScaleLevel[]>(() => [
    { code: 'L1', name: 'Explorer', points: 0, description: 'Initial level, understanding fundamental programming and syntax.', status: 'completed' },
    { code: 'L2', name: 'Builder', points: 100, description: 'Created static layouts and basic responsive web pages.', status: 'completed' },
    { code: 'L3', name: 'Developer', points: 300, description: 'Familiarity with REST APIs, databases, and state handling.', status: 'current' },
    { code: 'L4', name: 'Engineer', points: 400, description: 'Capable of creating dynamic, secured full-stack applications.', status: 'locked' },
    { code: 'L5', name: 'Architect', points: 1000, description: 'Designs scalable systems, caching, and clean architectures.', status: 'locked' },
    { code: 'L6', name: 'Lead', points: 1500, description: 'Leads team projects, reviews code, and conducts peer support.', status: 'locked' },
    { code: 'L7', name: 'Master', points: 3100, description: 'Production ready. Validated portfolio, ready for industrial hire.', status: 'locked' }
  ], []);

  // Fetch Career Tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const data = await careerTaskService.getTasks();
        setTasks(data);
      } catch (err) {
        console.error('Simulating sandbox tasks data feed');
        // Seed some mock career tasks matching Figure 3.31
        setTasks([
          { taskId: 't-1', taskCode: 'T1', title: 'Complete Git Workflow & Pull Requests', description: 'Submit repository demonstrating branches, conflict merge resolution, and code reviews.', rewardPoints: 50, assignedBatch: 'ICD110', targetLevel: 'Level L2' },
          { taskId: 't-2', taskCode: 'T2', title: 'Develop Full Stack React CRUD App', description: 'Deploy a React frontend client talking to a REST server with relational schemas.', rewardPoints: 150, assignedBatch: 'FSW-2026-B', targetLevel: 'Level L3' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  const handleOpenSubmit = (task: any) => {
    setSelectedTask(task);
    setPortfolioLink('');
    setComments('');
    setShowSubmitModal(true);
  };

  const handleSubmitWork = async () => {
    if (!selectedTask || !portfolioLink) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        taskId: selectedTask.taskId,
        studentId: user?.userId || 'student-1',
        status: 'PENDING',
        submittedFile: portfolioLink,
        submitDate: new Date().toISOString().split('T')[0]
      };

      await reviewService.createSubmission(payload);
      alert('Career portfolio submitted successfully to evaluation queue!');
      setShowSubmitModal(false);
    } catch (err) {
      console.error(err);
      alert('Simulation: Portfolio submission registered.');
      setShowSubmitModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
            <Award className="h-7 w-7 text-[#4F3FF0]" />
            Career Scale Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Build your professional readiness portfolio and earn badges.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-2xl flex items-center gap-4 flex-wrap max-w-max select-none font-sans font-bold text-xs">
        <button
          onClick={() => setActiveTab('ladder')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'ladder'
              ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-sm font-extrabold'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          My Career Scale
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-sm font-extrabold'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Career Scale Tasks
        </button>
      </div>

      {/* Panels */}
      <div>
        
        {/* LADDER TAB */}
        {activeTab === 'ladder' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-sans animate-in fade-in duration-200">
            
            {/* Stepped Ladder status list */}
            <div className="lg:col-span-2 bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 select-none">
                LADDER STATUS (L1-L7)
              </h3>

              <div className="space-y-4">
                {careerLevels.map(lvl => {
                  const isCompleted = lvl.status === 'completed';
                  const isCurrent = lvl.status === 'current';
                  
                  return (
                    <div 
                      key={lvl.code}
                      className={`p-4 border rounded-2xl flex items-start gap-4 transition-all ${
                        isCurrent 
                          ? 'border-amber-400 bg-amber-50/20 shadow-sm' 
                          : 'border-[#E9EDF5]'
                      } ${!isCompleted && !isCurrent ? 'opacity-50' : ''}`}
                    >
                      <div className="shrink-0 mt-0.5 select-none">
                        {isCompleted ? (
                          <span className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
                            <CheckCircle className="h-5 w-5" />
                          </span>
                        ) : isCurrent ? (
                          <span className="h-8 w-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center border border-amber-300">
                            <Briefcase className="h-4.5 w-4.5" />
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
                            {lvl.code}: {lvl.name}
                          </h4>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                            {lvl.points} pts
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          {lvl.description}
                        </p>

                        {isCurrent && (
                          <div className="space-y-1.5 pt-1.5 select-none">
                            <div className="flex justify-between text-[9px] font-bold text-amber-700 tracking-wide uppercase">
                              <span>PROGRESS TO L4</span>
                              <span>{points} / 300 PTS</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                                style={{ width: `${(points / 300) * 100}%` }}
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

            {/* Category Point Breakdown */}
            <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm space-y-5 select-none">
              <h3 className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                POINTS BY CATEGORY
              </h3>
              
              <div className="space-y-4 font-sans text-xs font-bold text-slate-700">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                    <span>Technical</span>
                    <span>180 pts</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4F3FF0] rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                    <span>Committed</span>
                    <span>60 pts</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-3xl">
                <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
                <p className="text-slate-500 font-medium text-sm">Loading career tasks...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tasks.map(task => (
                  <div 
                    key={task.taskId}
                    className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4 select-none">
                        <span className="inline-flex px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-[#4F3FF0] rounded-md text-[9px] font-extrabold uppercase leading-none">
                          {task.taskCode}
                        </span>
                        <span className="text-amber-500 font-black text-xs">
                          +{task.rewardPoints} PTS
                        </span>
                      </div>
                      
                      <h4 className="font-extrabold text-slate-800 text-sm leading-snug">
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        {task.description}
                      </p>
                      
                      <div className="flex gap-2 flex-wrap pt-1 select-none">
                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                          {task.assignedBatch || 'All Batches'}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                          {task.targetLevel || 'Level L1'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenSubmit(task)}
                      className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer leading-none flex items-center justify-center gap-1.5"
                    >
                      <Send className="h-3 w-3 shrink-0" />
                      Submit Work
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* PORTFOLIO SUBMISSION MODAL */}
      {showSubmitModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E9EDF5] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 font-heading">
                Submit Portfolio work
              </h3>
              <p className="text-xs text-slate-450 mt-1">{selectedTask.title}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Portfolio Repository Link / URL</label>
                <input
                  type="text"
                  required
                  value={portfolioLink}
                  onChange={e => setPortfolioLink(e.target.value)}
                  placeholder="https://github.com/user/project"
                  className="w-full px-3 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-700 placeholder-slate-450 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Submission Comments</label>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  placeholder="Explain your approach..."
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-700 placeholder-slate-455 outline-none min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-5 py-2.5 border border-[#E2E8F0] text-slate-500 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWork}
                disabled={submitting}
                className="px-5 py-2.5 bg-[#4F3FF0] text-white text-xs font-bold rounded-xl cursor-pointer disabled:bg-indigo-300"
              >
                {submitting ? 'Submitting...' : 'Submit Portfolio'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentCareer;
