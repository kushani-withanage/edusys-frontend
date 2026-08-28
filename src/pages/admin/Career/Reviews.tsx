import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft,
  ClipboardCheck,
  Users,
  CheckCircle,
  HelpCircle,
  Save,
  MessageSquare
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { careerTaskService, type CareerTaskData } from '@/services/careerTaskService';
import { pointsLevelService, type CareerLevelData } from '@/services/pointsLevelService';
import { careerMarkingService, type CareerStudentTaskStatusData } from '@/services/careerMarkingService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/utils/toast';
import { useAuth } from '@/hooks/useAuth';

export const Reviews: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const taskIdParam = searchParams.get('taskId');

  // --- States ---
  const [levels, setLevels] = useState<CareerLevelData[]>([]);
  const [tasks, setTasks] = useState<CareerTaskData[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(taskIdParam || '');
  const [students, setStudents] = useState<CareerStudentTaskStatusData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-student row edit/save status
  const [rowStates, setRowStates] = useState<Record<string, {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    pointsAwarded: number;
    comment: string;
    submitting: boolean;
  }>>({});

  // Fetch initial levels and all tasks
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [levelsData, tasksData] = await Promise.all([
          pointsLevelService.getLevels(),
          careerTaskService.getTasks()
        ]);
        setLevels(levelsData || []);
        setTasks(tasksData || []);

        if (taskIdParam) {
          const matchedTask = tasksData.find(t => t.id === taskIdParam);
          if (matchedTask) {
            setSelectedLevelId(matchedTask.levelId);
            loadStudents(taskIdParam);
          }
        } else if (levelsData && levelsData.length > 0) {
          setSelectedLevelId(levelsData[0].id || '');
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch configuration. Ensure server is online.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [taskIdParam]);

  // Load tasks based on selected level
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.levelId === selectedLevelId && t.isActive);
  }, [tasks, selectedLevelId]);

  // Auto-select first task when level changes (only if no taskIdParam)
  useEffect(() => {
    if (taskIdParam) return;
    if (filteredTasks.length > 0) {
      setSelectedTaskId(filteredTasks[0].id || '');
      loadStudents(filteredTasks[0].id || '');
    } else {
      setSelectedTaskId('');
      setStudents([]);
    }
  }, [selectedLevelId, filteredTasks, taskIdParam]);

  const loadStudents = async (taskId: string) => {
    if (!taskId) return;
    try {
      setStudentsLoading(true);
      const data = await careerMarkingService.getStudentsForTask(taskId);
      setStudents(data || []);
      
      // Initialize edit states for each student
      const initialRowStates: typeof rowStates = {};
      data.forEach(s => {
        initialRowStates[s.studentId] = {
          status: s.status,
          pointsAwarded: s.pointsAwarded || 0,
          comment: s.comment || '',
          submitting: false
        };
      });
      setRowStates(initialRowStates);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load students assigned to this task.');
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const taskId = e.target.value;
    setSelectedTaskId(taskId);
    setSearchParams(taskId ? { taskId } : {});
    loadStudents(taskId);
  };

  const handleRowStatusChange = (studentId: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') => {
    const task = tasks.find(t => t.id === selectedTaskId);
    const maxPoints = task?.pointsValue || 50;
    
    setRowStates(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        pointsAwarded: status === 'COMPLETED' ? maxPoints : 0
      }
    }));
  };

  const handleRowPointsChange = (studentId: string, points: number) => {
    setRowStates(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        pointsAwarded: points
      }
    }));
  };

  const handleRowCommentChange = (studentId: string, comment: string) => {
    setRowStates(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comment
      }
    }));
  };

  const handleSaveStudentMark = async (studentId: string) => {
    const row = rowStates[studentId];
    if (!row) return;

    const task = tasks.find(t => t.id === selectedTaskId);
    const maxPoints = task?.pointsValue || 50;

    if (row.status === 'COMPLETED' && (row.pointsAwarded < 0 || row.pointsAwarded > maxPoints)) {
      toast.error(`Points must be between 0 and ${maxPoints}.`);
      return;
    }

    try {
      setRowStates(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], submitting: true }
      }));

      const payload = {
        status: row.status,
        pointsAwarded: row.status === 'COMPLETED' ? row.pointsAwarded : null,
        comment: row.comment
      };

      await careerMarkingService.markStudentTask(selectedTaskId, studentId, payload);
      toast.success('Student progress updated successfully.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update student progress.');
    } finally {
      setRowStates(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], submitting: false }
      }));
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = students.length;
    const completed = students.filter(s => rowStates[s.studentId]?.status === 'COMPLETED').length;
    const inProgress = students.filter(s => rowStates[s.studentId]?.status === 'IN_PROGRESS').length;
    const notStarted = students.filter(s => rowStates[s.studentId]?.status === 'NOT_STARTED').length;

    return { total, completed, inProgress, notStarted };
  }, [students, rowStates]);

  const activeTask = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId);
  }, [tasks, selectedTaskId]);

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
          {user?.role?.toUpperCase() === 'ADMIN' && (
            <button 
              onClick={() => navigate('/admin/task-creator')}
              className="flex items-center gap-1 text-[10px] font-black uppercase text-[#4F3FF0] hover:text-[#3D2ED0] transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Tasks List
            </button>
          )}
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-[#4F3FF0]" />
            Student Task Marking & Review
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Select a career task to grade students from assigned batches based on their offline/real-world deliverables.
          </p>
        </div>
      </div>

      {/* Selector Panels */}
      <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">1. Select Career Level</label>
          {loading ? (
            <div className="h-9 bg-slate-50 rounded-xl animate-pulse" />
          ) : (
            <select
              value={selectedLevelId}
              onChange={(e) => {
                setSelectedLevelId(e.target.value);
                setSearchParams({});
              }}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#4F3FF0] rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white cursor-pointer"
            >
              {levels.map(l => (
                <option key={l.id} value={l.id}>L{l.levelNumber} - {l.title}</option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">2. Select Active Task</label>
          {loading ? (
            <div className="h-9 bg-slate-50 rounded-xl animate-pulse" />
          ) : (
            <select
              value={selectedTaskId}
              onChange={handleTaskChange}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#4F3FF0] rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white cursor-pointer"
              disabled={filteredTasks.length === 0}
            >
              {filteredTasks.length === 0 ? (
                <option value="">No Active Tasks under this Level</option>
              ) : (
                filteredTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.pointsValue} pts)</option>
                ))
              )}
            </select>
          )}
        </div>
      </div>

      {selectedTaskId && activeTask && (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E9EDF5] p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-[#4F3FF0] rounded-xl">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase block leading-none">Total Enrolled</span>
                <span className="text-base font-black text-slate-800 mt-1 block leading-none">{stats.total}</span>
              </div>
            </div>

            <div className="bg-white border border-[#E9EDF5] p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                <CheckCircle className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase block leading-none">Completed</span>
                <span className="text-base font-black text-slate-800 mt-1 block leading-none">{stats.completed}</span>
              </div>
            </div>

            <div className="bg-white border border-[#E9EDF5] p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-sky-50 text-sky-500 rounded-xl">
                <Loader2 className="h-4.5 w-4.5 text-sky-500" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase block leading-none">In Progress</span>
                <span className="text-base font-black text-slate-800 mt-1 block leading-none">{stats.inProgress}</span>
              </div>
            </div>

            <div className="bg-white border border-[#E9EDF5] p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                <HelpCircle className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase block leading-none">Not Started</span>
                <span className="text-base font-black text-slate-800 mt-1 block leading-none">{stats.notStarted}</span>
              </div>
            </div>
          </div>

          {/* Student List Table */}
          <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-heading font-extrabold text-slate-800 text-sm">Classroom Progress Sheet</h3>
              <p className="text-slate-450 text-[10px] font-semibold mt-0.5">
                Real-time review sheet. Change a student's status, enter score & comments, and hit save to award points.
              </p>
            </div>

            {studentsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading classroom status...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-205">
                <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">No students assigned to this task</h3>
                <p className="text-slate-400 text-[10px] mt-1 font-semibold">Assign this task to batches containing active students.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#E9EDF5] rounded-2xl">
                <table className="w-full border-collapse text-left text-xs font-semibold text-slate-700">
                  <thead>
                    <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-455 text-[10px] font-bold tracking-wider uppercase select-none">
                      <th className="px-6 py-4 w-1/4">Student Name</th>
                      <th className="px-6 py-4 w-1/5">Status</th>
                      <th className="px-6 py-4 w-1/6">Points Awarded</th>
                      <th className="px-6 py-4">Comment / Feedback</th>
                      <th className="px-6 py-4 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9EDF5] align-middle">
                    {students.map(student => {
                      const row = rowStates[student.studentId];
                      if (!row) return null;

                      return (
                        <tr key={student.studentId} className="hover:bg-slate-50/20">
                          <td className="px-6 py-4">
                            <span className="font-extrabold text-slate-800 text-xs block">{student.studentName}</span>
                            <span className="text-[9px] text-slate-400 block font-bold mt-0.5">{student.regNo || student.studentId}</span>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={row.status}
                              onChange={(e) => handleRowStatusChange(student.studentId, e.target.value as any)}
                              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#4F3FF0] cursor-pointer w-full"
                            >
                              <option value="NOT_STARTED">Not Started</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={row.status === 'COMPLETED' ? row.pointsAwarded : ''}
                                onChange={(e) => handleRowPointsChange(student.studentId, Number(e.target.value) || 0)}
                                disabled={row.status !== 'COMPLETED'}
                                className="w-16 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:border-[#4F3FF0] text-center disabled:bg-slate-50 disabled:text-slate-350"
                                min={0}
                                max={activeTask.pointsValue}
                              />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">/ {activeTask.pointsValue}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-xl">
                              <MessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <input
                                type="text"
                                value={row.comment}
                                onChange={(e) => handleRowCommentChange(student.studentId, e.target.value)}
                                placeholder="Add marking remarks..."
                                className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-450 outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleSaveStudentMark(student.studentId)}
                              disabled={row.submitting}
                              className="px-3 py-2 bg-[#4F3FF0] hover:bg-[#3D2ED0] disabled:bg-slate-200 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm select-none"
                            >
                              {row.submitting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Save className="h-3.5 w-3.5" /> Save
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reviews;
