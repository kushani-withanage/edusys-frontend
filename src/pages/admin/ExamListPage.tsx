import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  FileQuestion, 
  Loader2, 
  BarChart2, 
  Play, 
  XSquare, 
  Trash2, 
  Edit,
  AlertCircle
} from 'lucide-react';
import { api } from '@/utils/api';
import { toast } from '@/utils/toast';

export const ExamListPage: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'DRAFT' | 'PUBLISHED' | 'CLOSED'>('DRAFT');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [examsData, coursesData] = await Promise.all([
        api.get<any[]>('/api/v1/exams'),
        api.get<any[]>('/api/v1/courses')
      ]);
      setExams(examsData);
      setCourses(coursesData);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load exams list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePublish = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Publish Exam',
      message: 'Are you sure you want to publish this exam? Once published, all attached questions will be LOCKED and cannot be edited. This action cannot be undone.',
      confirmText: 'Publish',
      onConfirm: async () => {
        try {
          await api.post(`/api/v1/exams/${id}/publish`, {});
          toast.success('Exam published successfully!');
          alert('Exam published successfully!');
          loadData();
        } catch (err: any) {
          console.error(err);
          const errMsg = err.message || 'Failed to publish exam. Make sure it has questions attached.';
          toast.error(errMsg);
          alert(errMsg);
        }
      }
    });
  };

  const handleClose = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Close Exam',
      message: 'Are you sure you want to close this exam? Students will no longer be able to take it.',
      confirmText: 'Close Exam',
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.post(`/api/v1/exams/${id}/close`, {});
          toast.success('Exam closed successfully!');
          loadData();
        } catch (err: any) {
          console.error(err);
          toast.error('Failed to close exam.');
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Draft',
      message: 'Are you sure you want to delete this draft exam?',
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/api/v1/exams/${id}`);
          toast.success('Draft exam deleted successfully!');
          setExams(prev => prev.filter(e => e.id !== id));
        } catch (err: any) {
          console.error(err);
          toast.error('Failed to delete exam.');
        }
      }
    });
  };

  const filteredExams = exams.filter(e => e.status === activeTab);

  return (
    <div className="space-y-6 font-sans text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Academic Exams</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Build MCQ online tests, specify target audiences, and view grading reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/exams/questions"
            className="px-4 py-2 text-[10.5px] font-black rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            📂 Open Question Bank
          </Link>
          <Link
            to="/admin/exams/new"
            className="px-4 py-2 text-[10.5px] font-black rounded-xl bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#4F3FF0]/10"
          >
            <Plus className="h-3.5 w-3.5" /> Create Exam
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-100 flex gap-6 text-xs font-black uppercase tracking-wider text-slate-400">
        {(['DRAFT', 'PUBLISHED', 'CLOSED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 transition-colors cursor-pointer border-b-2 ${
              activeTab === tab 
                ? 'border-[#4F3FF0] text-[#4F3FF0]' 
                : 'border-transparent hover:text-slate-600'
            }`}
          >
            {tab}s ({exams.filter(e => e.status === tab).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-3xl shadow-xs">
          <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading exams...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-3xl shadow-xs text-center">
          <Calendar className="h-10 w-10 text-slate-300" />
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">No exams found in this status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredExams.map(exam => {
            const course = courses.find(c => c.courseId === exam.courseId);
            return (
              <div 
                key={exam.id}
                className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row justify-between items-start gap-4"
              >
                <div className="space-y-3 flex-1">
                  <div>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9.5px] font-black uppercase tracking-wider">
                      {course?.courseName || 'Module Exam'}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-snug mt-1.5">{exam.title}</h3>
                    {exam.description && <p className="text-xs text-slate-455 mt-0.5 leading-relaxed">{exam.description}</p>}
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>
                        {new Date(exam.startTime).toLocaleDateString()} - {new Date(exam.endTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{exam.durationMinutes} Mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileQuestion className="h-4 w-4 text-slate-400" />
                      <span>{exam.questionIds?.length || 0} Questions ({exam.totalMarks || 0} Marks)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>{exam.audiences?.length || 0} Target Audiences</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap md:flex-col gap-2.5 w-full md:w-auto shrink-0 md:pt-1">
                  {exam.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => handlePublish(exam.id)}
                        className="flex-1 md:w-32 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5" /> Publish
                      </button>
                      <button
                        onClick={() => navigate(`/admin/exams/edit/${exam.id}`)}
                        className="flex-1 md:w-32 px-3.5 py-2 border border-slate-200 hover:border-slate-350 bg-white text-slate-600 text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit Builder
                      </button>
                      <button
                        onClick={() => handleDelete(exam.id)}
                        className="flex-1 md:w-32 px-3.5 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </>
                  )}

                  {exam.status === 'PUBLISHED' && (
                    <>
                      <button
                        onClick={() => handleClose(exam.id)}
                        className="flex-1 md:w-32 px-3.5 py-2 bg-rose-600 hover:bg-rose-750 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <XSquare className="h-3.5 w-3.5" /> Close Exam
                      </button>
                      <button
                        onClick={() => navigate(`/admin/exams/${exam.id}/analytics`)}
                        className="flex-1 md:w-32 px-3.5 py-2 border border-slate-200 hover:border-[#4F3FF0] hover:text-[#4F3FF0] bg-white text-slate-600 text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <BarChart2 className="h-3.5 w-3.5" /> View Analytics
                      </button>
                    </>
                  )}

                  {exam.status === 'CLOSED' && (
                    <button
                      onClick={() => navigate(`/admin/exams/${exam.id}/analytics`)}
                      className="flex-1 md:w-32 px-3.5 py-2 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <BarChart2 className="h-3.5 w-3.5" /> View Results
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl border border-slate-100 flex flex-col gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className={`h-6 w-6 shrink-0 ${confirmModal.isDanger ? 'text-rose-500' : 'text-amber-500'}`} />
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">{confirmModal.title}</h4>
            </div>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex gap-2.5 mt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  confirmModal.onConfirm();
                }}
                className={`flex-1 py-2 text-white text-xs font-black rounded-xl transition-all cursor-pointer ${
                  confirmModal.isDanger 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/10' 
                    : 'bg-[#4F3FF0] hover:bg-[#3D2ED0] shadow-sm shadow-[#4F3FF0]/10'
                }`}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
