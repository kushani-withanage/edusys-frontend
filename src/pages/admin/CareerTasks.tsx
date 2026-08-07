import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Award,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Layers
} from 'lucide-react';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import { careerTaskService, type CareerTaskData, type CareerLevelBatchAccessData } from '@/services/careerTaskService';
import { pointsLevelService, type CareerLevelData } from '@/services/pointsLevelService';
import { batchService } from '@/services/batchService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/utils/toast';

export const CareerTasks: React.FC = () => {
  // --- States ---
  const [tasks, setTasks] = useState<CareerTaskData[]>([]);
  const [levels, setLevels] = useState<CareerLevelData[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchAccess, setBatchAccess] = useState<CareerLevelBatchAccessData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter states ---
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('All');

  // --- Modals State ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Confirmation Modal State ---
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    taskId: string;
    taskTitle: string;
  }>({
    show: false,
    taskId: '',
    taskTitle: ''
  });

  // --- Form States ---
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    levelId: '',
    pointsValue: '50',
    submissionType: 'LINK' // LINK, IMAGE, PDF, FILE
  });

  // --- Fetch API Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [levelsData, tasksData, batchesData, accessData] = await Promise.all([
        pointsLevelService.getLevels(),
        careerTaskService.getTasks(),
        batchService.getBatches(),
        careerTaskService.getBatchAccess()
      ]);

      setLevels(levelsData || []);
      setTasks(tasksData || []);
      setBatches(batchesData || []);
      setBatchAccess(accessData || []);

      // Pre-select first level in create form if available
      if (levelsData && levelsData.length > 0) {
        setTaskForm(prev => ({
          ...prev,
          levelId: levelsData[0].id || ''
        }));
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to backend server. Ensure the service is active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers ---
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.description.trim() || !taskForm.levelId) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CareerTaskData = {
        title: taskForm.title,
        description: taskForm.description,
        levelId: taskForm.levelId,
        pointsValue: Number(taskForm.pointsValue) || 50,
        submissionType: taskForm.submissionType,
        isActive: true
      };

      await careerTaskService.createTask(payload);
      
      setShowCreateModal(false);
      setTaskForm(prev => ({
        ...prev,
        title: '',
        description: '',
        pointsValue: '50',
        submissionType: 'LINK'
      }));
      toast.success('Career Task created successfully!');
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (task: CareerTaskData) => {
    if (!task.id) return;
    try {
      const updated = {
        ...task,
        isActive: !task.isActive
      };
      await careerTaskService.updateTask(task.id, updated);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isActive: updated.isActive } : t));
      toast.success(`Task "${task.title}" status updated.`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update task status.');
    }
  };

  const triggerDeleteConfirm = (id: string, title: string) => {
    setConfirmModal({
      show: true,
      taskId: id,
      taskTitle: title
    });
  };

  const executeDeleteTask = async () => {
    const { taskId } = confirmModal;
    if (!taskId) return;

    try {
      await careerTaskService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setConfirmModal({ show: false, taskId: '', taskTitle: '' });
      toast.success('Career Task deleted successfully.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete task.');
    }
  };

  // Toggle Batch Access Handler
  const handleToggleAccess = async (levelId: string, batchId: string) => {
    try {
      // Optimistic UI update
      setBatchAccess(prev => {
        const copy = [...prev];
        const index = copy.findIndex(a => a.level.id === levelId && a.batch.batchId === batchId);
        if (index > -1) {
          copy[index] = { ...copy[index], isOpen: !copy[index].isOpen };
        } else {
          // Add temporary mapping
          copy.push({
            id: 'temp',
            level: { id: levelId, levelNumber: 0, title: '' },
            batch: { batchId, batchName: '' },
            isOpen: true,
            openedAt: new Date().toISOString()
          });
        }
        return copy;
      });

      await careerTaskService.toggleBatchAccess(levelId, batchId);
      toast.success('Batch access setting updated.');
      
      // Fetch latest access mappings from server
      const updatedAccess = await careerTaskService.getBatchAccess();
      setBatchAccess(updatedAccess || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to toggle batch level access.');
      // Revert mapping
      fetchData();
    }
  };

  // Check if access is open
  const isLevelOpenForBatch = (levelId: string, batchId: string): boolean => {
    const access = batchAccess.find(a => a.level.id === levelId && a.batch.batchId === batchId);
    return access ? access.isOpen : false;
  };

  // --- Filtered tasks ---
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      return selectedLevelFilter === 'All' || t.levelId === selectedLevelFilter;
    });
  }, [tasks, selectedLevelFilter]);

  // --- Icon mapping for submission type ---
  const getSubmissionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'LINK': return <LinkIcon className="h-4 w-4 text-sky-500" />;
      case 'IMAGE': return <ImageIcon className="h-4 w-4 text-emerald-500" />;
      case 'PDF': return <FileText className="h-4 w-4 text-rose-500" />;
      default: return <BookOpen className="h-4 w-4 text-slate-500" />;
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
            <Award className="h-6 w-6 text-[#4F3FF0]" />
            Career Tasks Configuration
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Define practical deliverables students must submit to meet career level progression criteria.
          </p>
        </div>
      </div>

      {/* Filter by level bar */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-2 font-bold text-slate-700 text-xs">
          <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Filter By Level:</span>
          <select
            value={selectedLevelFilter}
            onChange={(e) => setSelectedLevelFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#4F3FF0] cursor-pointer"
          >
            <option value="All">All Levels</option>
            {levels.map(l => (
              <option key={l.id} value={l.id}>L{l.levelNumber} - {l.title}</option>
            ))}
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

      {/* Main Table section */}
      <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm font-heading">Defined Career Tasks</h3>
          <p className="text-slate-450 text-[10px] font-semibold mt-0.5">List of actionable tasks and expectations per career stage.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading Tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-205">
            <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">No career tasks defined</h3>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#E9EDF5] rounded-2xl">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-455 text-[10px] font-bold tracking-wider uppercase">
                  <th className="px-6 py-4 w-1/2">Task Details</th>
                  <th className="px-6 py-4">Target Level</th>
                  <th className="px-6 py-4">Points</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
                {filteredTasks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/20 transition-colors duration-150 align-middle">
                    <td className="px-6 py-4 space-y-1">
                      <span className="font-extrabold text-slate-800 text-xs block">{t.title}</span>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                        {t.description}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold text-[#4F3FF0] bg-indigo-50/50 border border-indigo-100 rounded-full select-none">
                        L{t.levelNumber} - {t.levelTitle}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-amber-600 font-black text-xs">
                      +{t.pointsValue} PTS
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold uppercase text-[9px] text-slate-600 select-none">
                        {getSubmissionIcon(t.submissionType)}
                        <span>{t.submissionType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(t)}
                        className="p-1 rounded-lg transition-all cursor-pointer text-slate-500 hover:text-slate-800"
                        title={t.isActive ? "Deactivate Task" : "Activate Task"}
                      >
                        {t.isActive ? (
                          <ToggleRight className="h-6 w-6 text-[#4F3FF0]" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-slate-450" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center select-none">
                      <button 
                        onClick={() => triggerDeleteConfirm(t.id!, t.title)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="Delete Task"
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

      {/* Level Batch Access Control Matrix Panel */}
      <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm font-heading flex items-center gap-1.5">
            <Layers className="h-4.5 w-4.5 text-[#4F3FF0]" /> Open Level for Batch
          </h3>
          <p className="text-slate-450 text-[10px] font-semibold mt-0.5">
            Toggle level visibility and tasks access for specific class batches.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-6 w-6 text-[#4F3FF0] animate-spin" />
          </div>
        ) : levels.length === 0 || batches.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-bold">
            Define both levels and batches to configure access.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#E9EDF5] rounded-2xl">
            <table className="w-full border-collapse text-left text-xs font-semibold text-slate-700">
              <thead>
                <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-455 text-[10px] font-bold tracking-wider uppercase select-none">
                  <th className="px-6 py-4 w-1/4">Batch / Intake</th>
                  {levels.map(lvl => (
                    <th key={lvl.id} className="px-6 py-4 text-center">L{lvl.levelNumber}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDF5]">
                {batches.map(batch => (
                  <tr key={batch.batchId} className="hover:bg-slate-50/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#4F3FF0]" />
                        <span className="font-extrabold text-slate-850">{batch.batchName}</span>
                      </div>
                    </td>
                    {levels.map(lvl => {
                      const isOpen = isLevelOpenForBatch(lvl.id!, batch.batchId);
                      return (
                        <td key={lvl.id} className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAccess(lvl.id!, batch.batchId)}
                            className="p-1 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                            title={`Toggle L${lvl.levelNumber} for ${batch.batchName}`}
                          >
                            {isOpen ? (
                              <ToggleRight className="h-6 w-6 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-slate-450" />
                            )}
                          </button>
                        </td>
                      );
                    })}
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
          <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 w-full max-w-lg shadow-2xl relative text-left">
            <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2 select-none">
              <Award className="h-5 w-5 text-[#4F3FF0]" />
              Create New Career Task
            </h3>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4 font-sans">
              <TextField
                label="Task Title *"
                value={taskForm.title}
                onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Deploy React Application"
                required
              />

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold tracking-wider uppercase text-slate-500 select-none">Description *</label>
                <textarea
                  value={taskForm.description}
                  onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Summarize the core task objective and guidelines..."
                  className="w-full pl-4 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-800 placeholder-slate-450 outline-none focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 min-h-[70px] transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold tracking-wider uppercase text-slate-500 select-none">Target Level *</label>
                  <select
                    value={taskForm.levelId}
                    onChange={e => setTaskForm(prev => ({ ...prev, levelId: e.target.value }))}
                    className="w-full pl-3 pr-8 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-800 font-bold outline-none focus:bg-white cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Target Level</option>
                    {levels.map(l => (
                      <option key={l.id} value={l.id}>L{l.levelNumber} - {l.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold tracking-wider uppercase text-slate-500 select-none">Submission Type *</label>
                  <select
                    value={taskForm.submissionType}
                    onChange={e => setTaskForm(prev => ({ ...prev, submissionType: e.target.value }))}
                    className="w-full pl-3 pr-8 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-800 font-bold outline-none focus:bg-white cursor-pointer"
                    required
                  >
                    <option value="LINK">LINK (URL)</option>
                    <option value="IMAGE">IMAGE (PNG/JPG)</option>
                    <option value="PDF">PDF DOCUMENT</option>
                    <option value="FILE">ZIP/SOURCE FILE</option>
                  </select>
                </div>
              </div>

              <div className="w-1/2">
                <TextField
                  label="Reward Points *"
                  type="number"
                  value={taskForm.pointsValue}
                  onChange={e => setTaskForm(prev => ({ ...prev, pointsValue: e.target.value }))}
                  required
                />
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

      {/* --- CUSTOM CONFIRM MODAL OVERLAY --- */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 w-full max-w-sm shadow-2xl relative text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-800">Delete Career Task</h3>
              <p className="text-slate-450 text-[11px] font-semibold leading-relaxed">
                Are you sure you want to delete task <span className="font-extrabold text-slate-700">"{confirmModal.taskTitle}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-center select-none pt-2">
              <button
                onClick={() => setConfirmModal({ show: false, taskId: '', taskTitle: '' })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer bg-white border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteTask}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-100"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerTasks;
