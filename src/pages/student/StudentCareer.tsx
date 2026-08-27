import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  Award,
  Trophy,
  Activity,
  CheckCircle,
  HelpCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { careerMarkingService, type StudentCareerProgressData, type CareerStudentTaskStatusData } from '@/services/careerMarkingService';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const StudentCareer: React.FC = () => {
  const [progress, setProgress] = useState<StudentCareerProgressData | null>(null);
  const [tasks, setTasks] = useState<CareerStudentTaskStatusData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [progressData, tasksData] = await Promise.all([
        careerMarkingService.getMyProgress(),
        careerMarkingService.getMyTasks()
      ]);

      setProgress(progressData);
      setTasks(tasksData || []);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to backend server. Make sure the service is active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full">
            <CheckCircle className="h-3 w-3" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black text-sky-600 bg-sky-50 border border-sky-100 rounded-full">
            <Clock className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-200 rounded-full">
            <HelpCircle className="h-3 w-3" /> Not Started
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading your Career Progression...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto font-sans pb-10 select-none">
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
            <Trophy className="h-6 w-6 text-[#4F3FF0]" />
            Career Scale Progression
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Track your non-academic, industry-readiness scale standing. Points and status are updated manually by staff.
          </p>
        </div>
      </div>

      {progress && (
        <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center gap-4 md:border-r border-[#E9EDF5] pr-6">
            <div className="h-16 w-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-[#4F3FF0]">
              <Award className="h-10 w-10" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block leading-none">Your Level</span>
              <span className="text-xl font-black text-slate-800 mt-1 block leading-none">{progress.currentLevelTitle}</span>
              <span className="text-[10px] font-bold text-slate-400 mt-1.5 block leading-none">Stage L{progress.currentLevelNumber}</span>
            </div>
          </div>

          <div className="col-span-2 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600 flex items-center gap-1">
                <Activity className="h-4 w-4 text-[#4F3FF0]" /> Points accumulated at current level:
              </span>
              <span className="text-slate-800">
                <strong className="text-indigo-600 text-sm font-black">{progress.totalPointsAtLevel}</strong>
                <span className="text-slate-400"> / {progress.levelPointsRequired} PTS</span>
              </span>
            </div>

            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div 
                className="bg-gradient-to-r from-[#4F3FF0] to-[#6366f1] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (progress.totalPointsAtLevel / (progress.levelPointsRequired || 100)) * 100)}%` }}
              />
            </div>

            <p className="text-[10px] text-slate-450 font-bold leading-normal">
              Accumulate points by completing tasks assigned to your batch. Reaching <span className="font-extrabold text-[#4F3FF0]">{progress.levelPointsRequired} points</span> automatically advances you to the next career tier.
            </p>
          </div>
        </div>
      )}

      {/* Classroom Tasks List */}
      <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-heading font-extrabold text-slate-800 text-sm">Assigned Career Tasks</h3>
          <p className="text-slate-450 text-[10px] font-semibold mt-0.5">
            Tasks assigned to your batch. Work on these with your coaches outside the LMS.
          </p>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-205">
            <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">No career tasks assigned</h3>
            <p className="text-slate-400 text-[10px] mt-1 font-semibold">Your class batch currently has no tasks configured.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map(task => {
              const isCompleted = task.status === 'COMPLETED';

              return (
                <div 
                  key={task.taskId} 
                  className={`border rounded-2xl p-5 space-y-3 transition-all ${
                    isCompleted 
                      ? 'bg-emerald-50/10 border-emerald-100/80 shadow-xs' 
                      : 'bg-white border-slate-150'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-slate-800 text-xs tracking-tight">{task.taskTitle}</h4>
                      <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                        {task.taskDescription}
                      </p>
                    </div>
                    <span className={`text-[10px] font-black shrink-0 ${isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {isCompleted ? `+${task.pointsAwarded}` : `+${task.pointsValue}`} PTS
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E9EDF5]">
                    {getStatusBadge(task.status)}
                    
                    {task.markedByName && (
                      <span className="text-[9px] text-slate-400 font-bold block">
                        Marked by: {task.markedByName}
                      </span>
                    )}
                  </div>

                  {task.comment && (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl flex gap-2 items-start text-[10px] text-slate-600 font-semibold leading-relaxed">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-black text-slate-700 block mb-0.5">Reviewer Comment</span>
                        {task.comment}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCareer;
