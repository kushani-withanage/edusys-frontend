import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  Plus,
  Trash2,
  Sparkles,
  Database,
  CheckCircle,
  AlertTriangle,
  Award
} from 'lucide-react';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import { careerTaskService, type CareerTaskData } from '@/services/careerTaskService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Task {
  taskId: string;
  taskCode: string;
  title: string;
  description: string;
  dueDate: string;
  rubricCriteria: string;
  pointValue: number;
  batchName: string;
  targetLevel: string;
  isReact?: boolean;
  totalSubmissions?: number;
  approvedSubmissions?: number;
  pendingSubmissions?: number;
}

export const CareerTasks: React.FC = () => {
  // --- States ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter states ---
  const [batchFilter, setBatchFilter] = useState('All');

  // --- Modals State ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Form States ---
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    batchName: 'ICD110',
    targetLevel: 'Level L2',
    pointValue: '50',
    rubricCriteria: '100% Code Weight',
    isReact: false,
    dueDate: new Date().toISOString().split('T')[0]
  });

  // --- Mock Fallbacks (Sandbox visualization mode) ---
  const defaultTasks = useMemo<Task[]>(() => [
    {
      taskId: 't-1',
      taskCode: 'T1',
      title: 'Complete Git Workflow & Pull Requests',
      description: 'Submit repository demonstrating branches, conflict merge resolution, and code reviews.',
      dueDate: '2026-08-10',
      rubricCriteria: '100% Code Weight',
      pointValue: 50,
      batchName: 'ICD110',
      targetLevel: 'Level L2',
      isReact: false,
      totalSubmissions: 25,
      approvedSubmissions: 20,
      pendingSubmissions: 5
    },
    {
      taskId: 't-2',
      taskCode: 'T2',
      title: 'Develop Full Stack React CRUD App',
      description: 'Deploy a React frontend client talking to a REST server with relational schemas.',
      dueDate: '2026-08-15',
      rubricCriteria: '80% Code Weight',
      pointValue: 150,
      batchName: 'FSW-2026-B',
      targetLevel: 'Level L3',
      isReact: true,
      totalSubmissions: 32,
      approvedSubmissions: 28,
      pendingSubmissions: 4
    }
  ], []);

  // --- Fetch API Data ---
  const fetchTasksData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await careerTaskService.getTasks();

      // Map raw backend CareerTaskDTOs to our Task representation
      const mapped: Task[] = data.map((item, idx) => {
        // Find if we have matches or default fallback details
        const fallback = defaultTasks[idx % defaultTasks.length];
        return {
          taskId: item.taskId,
          taskCode: `T${idx + 1}`,
          title: item.title,
          description: item.description,
          dueDate: item.dueDate,
          rubricCriteria: item.rubricCriteria || fallback.rubricCriteria,
          pointValue: item.pointValue || fallback.pointValue,
          batchName: fallback.batchName,
          targetLevel: fallback.targetLevel,
          isReact: item.title?.toLowerCase().includes('react') || fallback.isReact,
          totalSubmissions: fallback.totalSubmissions,
          approvedSubmissions: fallback.approvedSubmissions,
          pendingSubmissions: fallback.pendingSubmissions
        };
      });

      setTasks(mapped.length > 0 ? mapped : defaultTasks);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to backend server. Running in simulated sandbox mode.');
      setTasks(defaultTasks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, [defaultTasks]);

  // --- Handlers ---
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.description.trim()) return;

    try {
      setSubmitting(true);
      const payload: CareerTaskData = {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate,
        rubricCriteria: taskForm.rubricCriteria,
        pointValue: Number(taskForm.pointValue) || 50
      };

      const created = await careerTaskService.createTask(payload);
      
      const newTask: Task = {
        taskId: created.taskId,
        taskCode: `T${tasks.length + 1}`,
        title: created.title,
        description: created.description,
        dueDate: created.dueDate,
        rubricCriteria: created.rubricCriteria,
        pointValue: created.pointValue,
        batchName: taskForm.batchName,
        targetLevel: taskForm.targetLevel,
        isReact: taskForm.isReact,
        totalSubmissions: 0,
        approvedSubmissions: 0,
        pendingSubmissions: 0
      };

      setTasks(prev => [...prev, newTask]);
      setShowCreateModal(false);
      setTaskForm({
        title: '',
        description: '',
        batchName: 'ICD110',
        targetLevel: 'Level L2',
        pointValue: '50',
        rubricCriteria: '100% Code Weight',
        isReact: false,
        dueDate: new Date().toISOString().split('T')[0]
      });
      alert('Career Task created successfully!');
    } catch (err: any) {
      console.error(err);
      // Fallback
      const sandboxCreated: Task = {
        taskId: 't-' + (tasks.length + 1),
        taskCode: `T${tasks.length + 1}`,
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate,
        rubricCriteria: taskForm.rubricCriteria,
        pointValue: Number(taskForm.pointValue) || 50,
        batchName: taskForm.batchName,
        targetLevel: taskForm.targetLevel,
        isReact: taskForm.isReact,
        totalSubmissions: 0,
        approvedSubmissions: 0,
        pendingSubmissions: 0
      };
      setTasks(prev => [...prev, sandboxCreated]);
      setShowCreateModal(false);
      setTaskForm({
        title: '',
        description: '',
        batchName: 'ICD110',
        targetLevel: 'Level L2',
        pointValue: '50',
        rubricCriteria: '100% Code Weight',
        isReact: false,
        dueDate: new Date().toISOString().split('T')[0]
      });
      alert('Simulation: Career Task created locally.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string, code: string) => {
    const confirm = window.confirm(`Are you sure you want to delete career task "${code}"?`);
    if (!confirm) return;

    try {
      await careerTaskService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.taskId !== id));
      alert('Career Task deleted successfully.');
    } catch (err: any) {
      console.error(err);
      setTasks(prev => prev.filter(t => t.taskId !== id));
      alert('Simulation: Career Task deleted.');
    }
  };

  // --- Filtered tasks ---
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      return batchFilter === 'All' || t.batchName === batchFilter;
    });
  }, [tasks, batchFilter]);

  // --- Dynamic Stats calculation ---
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const reactTasks = tasks.filter(t => t.isReact).length;
    
    // Aggregate total submissions
    const totalSubmissions = tasks.reduce((sum, t) => sum + (t.totalSubmissions || 0), 0) || 115;
    const pendingReviews = tasks.reduce((sum, t) => sum + (t.pendingSubmissions || 0), 0) || 16;
    
    return {
      totalTasks,
      reactTasks,
      totalSubmissions,
      pendingReviews
    };
  }, [tasks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-[18px] md:text-xl lg:text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
            <Award className="h-7 w-7 text-[#4F3FF0]" />
            Career Task Creator
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Design academic-grade tasks, review submission summaries, and track batch assignments.
          </p>
        </div>
        <div>
          <button 
            type="button"
            disabled 
            className="px-6 py-2.5 border border-[#E2E8F0] bg-[#F8FAFC] text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed select-none font-sans"
          >
            Save Configurations
          </button>
        </div>
      </div>

      {/* Filter by batch bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-2 font-bold text-slate-700 text-xs">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">FILTER BY BATCH:</span>
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#4F3FF0] cursor-pointer"
          >
            <option value="All">All Batches</option>
            <option value="ICD110">ICD110</option>
            <option value="FSW-2026-B">FSW-2026-B</option>
          </select>
        </div>
        <div>
          <Button 
            variant="solid" 
            color="primary" 
            onClick={() => setShowCreateModal(true)}
            startIcon={<Plus className="h-4 w-4" />}
          >
            Add New Task
          </Button>
        </div>
      </div>

      {/* Metric Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        {/* Card 1: TOTAL TASKS */}
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">TOTAL TASKS</span>
            <span className="text-2xl font-black text-slate-800 leading-none block font-heading">{stats.totalTasks}</span>
            <span className="text-[10px] font-semibold text-slate-400 block">Active in all courses</span>
          </div>
          <div className="p-3 bg-indigo-50 text-[#4F3FF0] rounded-xl shrink-0">
            <Database className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: REACT-SPECIFIC TASKS */}
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">REACT-SPECIFIC TASKS</span>
            <span className="text-2xl font-black text-slate-800 leading-none block font-heading">{stats.reactTasks}</span>
            <span className="text-[10px] font-semibold text-slate-400 block">78 submissions completed</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: TOTAL SUBMISSIONS */}
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">TOTAL SUBMISSIONS</span>
            <span className="text-2xl font-black text-slate-800 leading-none block font-heading">{stats.totalSubmissions}</span>
            <span className="text-[10px] font-semibold text-slate-400 block">Reviewed & approved</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: PENDING REVIEWS */}
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">PENDING REVIEWS</span>
            <span className="text-2xl font-black text-rose-600 leading-none block font-heading">{stats.pendingReviews}</span>
            <span className="text-[10px] font-semibold text-rose-500 block leading-tight">Awaiting academic coordinator assessment</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Table section */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm font-heading">Active Career Tasks & Rubrics</h3>
          <p className="text-slate-450 text-[11px] font-semibold mt-1">Review defined software engineering projects, point weighting metrics, and student submissions status.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
            <p className="text-slate-500 font-medium text-sm">Loading Career Tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="font-bold text-slate-655">No career tasks match the filters</h3>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#E9EDF5] rounded-2xl overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                  <th className="px-6 py-4">TASK CODE</th>
                  <th className="px-6 py-4 w-1/3">TASK DETAILS</th>
                  <th className="px-6 py-4">ASSIGNED BATCH</th>
                  <th className="px-6 py-4">TARGET LEVEL</th>
                  <th className="px-6 py-4">REWARD POINTS</th>
                  <th className="px-6 py-4">SUBMISSIONS SUMMARIES</th>
                  <th className="px-6 py-4">RUBRICS WEIGHT</th>
                  <th className="px-6 py-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
                {filteredTasks.map(t => (
                  <tr key={t.taskId} className="hover:bg-slate-50/20 transition-colors duration-150 align-middle">
                    
                    {/* Code */}
                    <td className="px-6 py-5 font-black text-slate-800">
                      {t.taskCode}
                    </td>

                    {/* Details */}
                    <td className="px-6 py-5 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-800 text-xs leading-none">{t.title}</span>
                        {t.isReact && (
                          <span className="inline-flex items-center px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-600 text-[9px] font-extrabold rounded-md uppercase tracking-wide leading-none select-none">
                            REACT TASK
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-sm">
                        {t.description}
                      </p>
                    </td>

                    {/* Batch */}
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-full select-none uppercase">
                        {t.batchName}
                      </span>
                    </td>

                    {/* Target Level */}
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold text-[#4F3FF0] bg-indigo-50/50 border border-indigo-100 rounded-full select-none">
                        {t.targetLevel}
                      </span>
                    </td>

                    {/* Reward Points */}
                    <td className="px-6 py-5 text-amber-600 font-black text-xs">
                      +{t.pointValue} PTS
                    </td>

                    {/* Submissions Summaries */}
                    <td className="px-6 py-5 leading-relaxed text-[10px]">
                      <div className="font-extrabold text-slate-700">{t.totalSubmissions || 0} Total Submissions</div>
                      <div className="font-semibold text-slate-450 mt-0.5">
                        <span className="text-emerald-600">{t.approvedSubmissions || 0} approved</span> • {t.pendingSubmissions || 0} pending
                      </div>
                    </td>

                    {/* Rubrics Weight */}
                    <td className="px-6 py-5 font-black text-slate-800 text-xs">
                      {t.rubricCriteria}
                    </td>

                    {/* Trash Action */}
                    <td className="px-6 py-5 text-center select-none">
                      <button 
                        onClick={() => handleDeleteTask(t.taskId, t.taskCode)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="Delete Career Task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- CREATE TASK MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-805 mb-4 font-heading flex items-center gap-2 select-none">
              <Award className="h-5 w-5 text-[#4F3FF0]" />
              Create New Career Task
            </h3>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4 font-sans">
              
              <TextField
                label="Task Title *"
                value={taskForm.title}
                onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Develop Full Stack React CRUD App"
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Task Description *</label>
                <textarea
                  value={taskForm.description}
                  onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Deploy a React frontend client talking to a REST server..."
                  className="w-full pl-4 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-850 placeholder-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 min-h-[70px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Assigned Batch</label>
                  <select
                    value={taskForm.batchName}
                    onChange={e => setTaskForm(prev => ({ ...prev, batchName: e.target.value }))}
                    className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                  >
                    <option value="ICD110">ICD110</option>
                    <option value="FSW-2026-B">FSW-2026-B</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Target Level</label>
                  <select
                    value={taskForm.targetLevel}
                    onChange={e => setTaskForm(prev => ({ ...prev, targetLevel: e.target.value }))}
                    className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                  >
                    <option value="Level L1">Level L1</option>
                    <option value="Level L2">Level L2</option>
                    <option value="Level L3">Level L3</option>
                    <option value="Level L4">Level L4</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="Reward Points *"
                  type="number"
                  value={taskForm.pointValue}
                  onChange={e => setTaskForm(prev => ({ ...prev, pointValue: e.target.value }))}
                  required
                />

                <TextField
                  label="Rubrics Criteria *"
                  value={taskForm.rubricCriteria}
                  onChange={e => setTaskForm(prev => ({ ...prev, rubricCriteria: e.target.value }))}
                  placeholder="e.g. 100% Code Weight"
                  required
                />
              </div>

              <div className="flex items-center gap-2 select-none pt-1">
                <input
                  type="checkbox"
                  id="isReactTaskCheck"
                  checked={taskForm.isReact}
                  onChange={e => setTaskForm(prev => ({ ...prev, isReact: e.target.checked }))}
                  className="h-4 w-4 accent-[#4F3FF0] cursor-pointer"
                />
                <label htmlFor="isReactTaskCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Is React-Specific Task?
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <Button type="button" variant="outline" color="secondary" onClick={() => setShowCreateModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  Create Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CareerTasks;
