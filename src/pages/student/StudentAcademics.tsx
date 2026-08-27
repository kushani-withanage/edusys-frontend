import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Play,
  AlertTriangle
} from 'lucide-react';
import { examService } from '@/services/examService';
import { api } from '@/utils/api';

export const StudentAcademics: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'courses' | 'exams'>('courses');
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [confirmStartExam, setConfirmStartExam] = useState<any | null>(null);

  useEffect(() => {
    api.get<any[]>('/api/v1/courses/my-courses')
      .then(data => setMyCourses(data))
      .catch(err => console.error('Error fetching my courses:', err));
  }, []);

  // Data states
  const [exams, setExams] = useState<any[]>([]);





  useEffect(() => {
    const fetchData = async () => {
      try {
        const examsData = await examService.getAvailableStudentExams().catch(() => []);
        setExams(examsData);
      } catch (err) {
        console.error('Error fetching course assets:', err);
        setExams([]);
      }
    };
    fetchData();
  }, []);






  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
            <BookOpen className="h-7 w-7 text-[#4F3FF0]" />
            Student Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track dual-performance grades, downloads, and Career Scale level tasks.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-2xl flex items-center gap-4 flex-wrap max-w-max select-none font-sans font-bold text-xs">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-sm font-extrabold'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          My Courses
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'exams'
              ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-sm font-extrabold'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Exams & Assessments
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        
        {/* MY COURSES TAB */}
        {activeTab === 'courses' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Enrolled Modules */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 select-none">
                MY ENROLLED MODULES (CLICK TO OPEN SYLLABUS & ASSIGNMENTS)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 select-none">
                {myCourses.map(c => (
                  <Link 
                    key={c.courseId}
                    to={`/student/courses/${c.courseId}`}
                    className="bg-white border border-[#E9EDF5] hover:border-[#4F3FF0]/40 hover:bg-[#4F3FF0]/5 hover:shadow-md p-6 rounded-2xl shadow-sm transition-all block cursor-pointer text-left animate-in fade-in duration-200"
                  >
                    <h4 className="font-extrabold text-slate-800 text-base hover:text-[#4F3FF0] transition-colors">{c.courseName}</h4>
                    <div className="flex flex-col gap-0.5 mt-3 text-xs font-bold text-slate-500">
                      {c.batchCode && (
                        <div>
                          Batch: <span className="text-slate-850 font-black">{c.batchCode}</span>
                        </div>
                      )}
                      <div>
                        Instructor: <span className="text-slate-800 font-semibold">{c.instructor || 'Academic Faculty'}</span>
                      </div>
                    </div>
                  </Link>
                ))}

                {myCourses.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-slate-450 text-xs font-semibold bg-white border border-[#E9EDF5] rounded-2xl">
                    No enrolled or custom granted courses found.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* EXAMS & ASSESSMENTS TAB */}
        {activeTab === 'exams' && (
          <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 select-none">
              Online Assessments & Tests
            </h3>
            
            <div className="overflow-x-auto border border-[#E9EDF5] rounded-2xl overflow-hidden font-sans">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-455 text-[9.5px] font-black tracking-wider uppercase">
                    <th className="px-6 py-4">EXAM TITLE</th>
                    <th className="px-6 py-4">ACTIVE WINDOW</th>
                    <th className="px-6 py-4">DURATION</th>
                    <th className="px-6 py-4">ATTEMPTS</th>
                    <th className="px-6 py-4">STATUS</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9EDF5] text-slate-850 text-xs font-semibold">
                  {exams.map(exam => {
                    const status = exam.studentStatus || 'AVAILABLE';
                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/20 transition-colors duration-150">
                        <td className="px-6 py-4.5 font-extrabold text-slate-800">
                          {exam.title}
                        </td>
                        <td className="px-6 py-4.5 text-slate-455">
                          {new Date(exam.startTime).toLocaleDateString()} - {new Date(exam.endTime).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4.5">
                          {exam.durationMinutes} Mins
                        </td>
                        <td className="px-6 py-4.5">
                          {exam.attemptsTaken} / {exam.attemptsAllowed}
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`inline-flex px-2.5 py-0.5 border rounded-md text-[9px] font-bold tracking-wider uppercase leading-none ${
                            status === 'IN_PROGRESS' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            status === 'OVERDUE' ? 'bg-rose-50 border-rose-250 text-rose-700' :
                            'bg-[#EBF7EE] border-emerald-100 text-emerald-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          {status === 'AVAILABLE' && (
                            <button
                              onClick={() => setConfirmStartExam(exam)}
                              className="px-4 py-2 bg-[#4F3FF0] hover:bg-[#4335D6] text-white text-[10px] font-black rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5 transition-all"
                            >
                              <Play className="h-3.5 w-3.5 shrink-0" /> Start Test
                            </button>
                          )}
                          {status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => navigate(`/student/exams/${exam.id}/take`)}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5 transition-all"
                            >
                              <Play className="h-3.5 w-3.5 shrink-0" /> Resume Test
                            </button>
                          )}
                          {status === 'COMPLETED' && (
                            <button
                              onClick={() => navigate(`/student/exams/attempts/${exam.activeAttemptId}/result`)}
                              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-black rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5 transition-all"
                            >
                              🎓 View Results
                            </button>
                          )}
                          {status === 'OVERDUE' && (
                            exam.activeAttemptId ? (
                              <button
                                onClick={() => navigate(`/student/exams/attempts/${exam.activeAttemptId}/result`)}
                                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-black rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5 transition-all"
                              >
                                🎓 View Results
                              </button>
                            ) : (
                              <button
                                disabled
                                className="px-4 py-2 border border-slate-200 bg-slate-55 border-slate-200 text-slate-400 text-[10px] font-black rounded-xl shadow-sm inline-flex items-center gap-1.5 select-none cursor-not-allowed"
                              >
                                🔒 Overdue / Closed
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {exams.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-450 text-xs font-semibold select-none">
                        No active exams or assessments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}



      </div>



      {confirmStartExam && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[60] animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-4 text-left animate-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-500" />
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Confirm Start Exam</h4>
            </div>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              Are you sure you want to start the exam <span className="font-bold text-slate-850">"{confirmStartExam.title}"</span>? The timer of <span className="font-bold text-[#4F3FF0]">{confirmStartExam.durationMinutes} minutes</span> will begin immediately and cannot be paused.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmStartExam(null)}
                className="flex-1 px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const examId = confirmStartExam.id;
                  setConfirmStartExam(null);
                  navigate(`/student/exams/${examId}/take`);
                }}
                className="flex-1 px-4 py-2 bg-[#4F3FF0] hover:bg-[#4335D6] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-[#4F3FF0]/10"
              >
                Start Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentAcademics;
