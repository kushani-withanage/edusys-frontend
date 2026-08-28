import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Percent, 
  MessageSquare,
  BookmarkCheck,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/utils/api';

interface Assignment {
  assignmentId: string;
  title: string;
  courseId: string;
  deadline?: string;
}

interface Exam {
  id: string;
  title: string;
  courseId: string;
  passMarks?: number;
}

interface AssignmentSubmission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  submitDate: string;
  submittedFile: string;
  marks?: number;
  gradedBy?: string;
  feedback?: string;
}

interface ExamAttempt {
  attemptId: string;
  examId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  status: string;
  score?: number;
}

interface Course {
  courseId: string;
  courseName: string;
}

export const StudentGradesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exams' | 'assignments'>('exams');

  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!user?.userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [subData, attData, asgData, exmData, crsData] = await Promise.all([
          api.get<AssignmentSubmission[]>(`/api/v1/assignment-submissions/student/${user.userId}`).catch(() => []),
          api.get<ExamAttempt[]>(`/api/v1/exam-attempts/student/${user.userId}`).catch(() => []),
          api.get<Assignment[]>(`/api/v1/assignments`).catch(() => []),
          api.get<Exam[]>(`/api/v1/exams`).catch(() => []),
          api.get<Course[]>(`/api/v1/courses`).catch(() => [])
        ]);

        setSubmissions(subData || []);
        setAttempts(attData || []);
        setAssignments(asgData || []);
        setExams(exmData || []);
        setCourses(crsData || []);
      } catch (err) {
        console.error('Failed to load grades data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Helper Maps
  const coursesMap = useMemo(() => {
    return new Map(courses.map(c => [c.courseId.toLowerCase(), c.courseName]));
  }, [courses]);

  const assignmentsMap = useMemo(() => {
    return new Map(assignments.map(a => [a.assignmentId.toLowerCase(), a]));
  }, [assignments]);

  const examsMap = useMemo(() => {
    return new Map(exams.map(e => [e.id.toLowerCase(), e]));
  }, [exams]);

  // Analytics Metrics
  const examStats = useMemo(() => {
    if (attempts.length === 0) return { avg: 0, passed: 0, total: 0 };
    
    let totalScore = 0;
    let passed = 0;
    attempts.forEach(att => {
      const score = att.score || 0;
      totalScore += score;
      
      const examDetail = examsMap.get(att.examId.toLowerCase());
      const passMarks = examDetail?.passMarks || 40;
      if (score >= passMarks) {
        passed++;
      }
    });

    return {
      avg: Math.round(totalScore / attempts.length),
      passed,
      total: attempts.length
    };
  }, [attempts, examsMap]);

  const assignmentStats = useMemo(() => {
    const gradedSubmissions = submissions.filter(s => s.marks !== undefined && s.marks !== null);
    if (gradedSubmissions.length === 0) return { avg: 0, gradedCount: 0 };

    const total = gradedSubmissions.reduce((sum, s) => sum + (s.marks || 0), 0);
    return {
      avg: Math.round(total / gradedSubmissions.length),
      gradedCount: gradedSubmissions.length
    };
  }, [submissions]);

  return (
    <div className="space-y-6 text-left">
      
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-heading select-none">
            <Award className="h-7 w-7 text-[#4F3FF0]" />
            My Grades & Performance
          </h1>
          <p className="text-slate-500 text-sm mt-1 select-none">
            Review detailed marks, pass-fail status, and feedback for assignments and examinations.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4F3FF0] border-t-transparent" />
          <p className="text-xs text-slate-550 font-bold">Loading performance sheet...</p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none animate-in fade-in slide-in-from-top-4 duration-300">
            
            <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-[#4F3FF0]/5 text-[#4F3FF0] rounded-2xl">
                <BookmarkCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-455 tracking-wider">Exams Passed</p>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                  {examStats.passed} <span className="text-xs text-slate-400 font-bold">/ {examStats.total} attempts</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-455 tracking-wider">Avg Exam Score</p>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                  {examStats.avg}%
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-455 tracking-wider">Assignments Graded</p>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                  {assignmentStats.gradedCount} <span className="text-xs text-slate-400 font-bold">/ {submissions.length} submitted</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-455 tracking-wider">Avg Assignment Mark</p>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                  {assignmentStats.avg}%
                </p>
              </div>
            </div>

          </div>

          {/* Segment Tabs Selector */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-1.5 rounded-2xl flex items-center gap-2 max-w-max select-none font-bold text-xs">
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'exams'
                  ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-xs font-black'
                  : 'text-slate-455 hover:text-slate-700'
              }`}
            >
              <Award className="h-4 w-4" />
              Exam Attempts
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'assignments'
                  ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-xs font-black'
                  : 'text-slate-455 hover:text-slate-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              Assignment Submissions
            </button>
          </div>

          {/* TAB PANELS */}
          <div className="animate-in fade-in duration-200">
            
            {activeTab === 'exams' ? (
              <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 select-none">
                  LMS Online Exam Grades & Attempt Summary
                </h3>
                
                <div className="overflow-x-auto border border-[#E9EDF5] rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-455 text-[9.5px] font-black tracking-wider uppercase select-none">
                        <th className="px-6 py-4">EXAM SESSION</th>
                        <th className="px-6 py-4">COURSE MODULE</th>
                        <th className="px-6 py-4">SUBMITTED TIME</th>
                        <th className="px-6 py-4">SCORE</th>
                        <th className="px-6 py-4 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
                      {attempts.map((attempt) => {
                        const examDetail = examsMap.get(attempt.examId.toLowerCase());
                        const courseName = examDetail?.courseId ? (coursesMap.get(examDetail.courseId.toLowerCase()) || '-') : '-';
                        const passMarks = examDetail?.passMarks || 40;
                        const isPass = (attempt.score || 0) >= passMarks;

                        return (
                          <tr key={attempt.attemptId} className="hover:bg-slate-50/20 transition-colors duration-150">
                            <td className="px-6 py-4 font-extrabold text-slate-900">
                              {examDetail?.title || 'Unknown Exam'}
                            </td>
                            <td className="px-6 py-4 text-slate-550">
                              {courseName}
                            </td>
                            <td className="px-6 py-4 text-slate-450">
                              {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 font-extrabold text-slate-800">
                              {attempt.score || 0}% <span className="text-[10px] text-slate-400 font-bold font-sans"> (Pass Mark: {passMarks}%)</span>
                            </td>
                            <td className="px-6 py-4 text-right select-none">
                              <span 
                                onClick={() => navigate(`/student/exams/attempts/${attempt.attemptId}/result`)}
                                className={`inline-flex px-2.5 py-1 border rounded-xl text-[8.5px] font-black uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm gap-1 items-center ${
                                  isPass 
                                    ? 'bg-emerald-50 border-emerald-250 text-emerald-800 hover:bg-emerald-100/60 shadow-emerald-50' 
                                    : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/60 shadow-rose-50'
                                }`}
                                title="Click to view full answer sheet"
                              >
                                {isPass ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {isPass ? 'PASS' : 'FAIL'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      
                      {attempts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-semibold bg-slate-50/30 select-none">
                            No exam attempt records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-455 select-none">
                  Assignment Submissions & Teacher Feedback
                </h3>

                <div className="space-y-4">
                  {submissions.map((sub) => {
                    const assignmentDetail = assignmentsMap.get(sub.assignmentId.toLowerCase());
                    const courseName = assignmentDetail?.courseId ? (coursesMap.get(assignmentDetail.courseId.toLowerCase()) || '-') : '-';
                    const isGraded = sub.marks !== undefined && sub.marks !== null;

                    return (
                      <div 
                        key={sub.submissionId} 
                        className="border border-[#E9EDF5] p-5 rounded-2xl hover:shadow-xs transition-all flex flex-col md:flex-row md:items-start justify-between gap-6"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 bg-[#4F3FF0]/5 text-[#4F3FF0] rounded text-[9px] font-black uppercase tracking-wide">
                              {courseName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Submitted: {sub.submitDate ? new Date(sub.submitDate).toLocaleString() : '-'}
                            </span>
                          </div>
                          
                          <h4 className="font-extrabold text-slate-800 text-sm">
                            {assignmentDetail?.title || 'Unknown Assignment'}
                          </h4>

                          {sub.feedback ? (
                            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start gap-2.5 mt-2">
                              <MessageSquare className="h-4 w-4 text-slate-450 shrink-0 mt-0.5" />
                              <div className="text-[11px] leading-relaxed text-slate-600 font-bold">
                                <span className="text-slate-800 font-extrabold block mb-0.5">Faculty Feedback:</span>
                                "{sub.feedback}"
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-bold italic mt-2">
                              Pending feedback from marking faculty.
                            </p>
                          )}
                        </div>

                        {/* Grading Badge */}
                        <div className="shrink-0 flex flex-col items-start md:items-end justify-center gap-1.5">
                          <p className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider select-none">Marks Awarded</p>
                          {isGraded ? (
                            <div className="text-left md:text-right">
                              <div className="text-2xl font-black text-slate-800 flex items-baseline gap-0.5">
                                {sub.marks}
                                <span className="text-xs text-slate-400 font-bold">/ 100</span>
                              </div>
                              <span className="inline-flex px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-[9px] font-black uppercase mt-1 select-none">
                                GRADED
                              </span>
                            </div>
                          ) : (
                            <div className="text-left md:text-right">
                              <div className="text-base font-extrabold text-slate-400 italic">
                                Pending
                              </div>
                              <span className="inline-flex px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-[9px] font-black uppercase mt-1 select-none">
                                UNDER REVIEW
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {submissions.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-xs font-semibold bg-slate-50/30 border border-[#E9EDF5] rounded-3xl select-none">
                      No assignment submissions found.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
};
