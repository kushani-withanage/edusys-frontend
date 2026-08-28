import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  FileText, 
  XCircle, 
  Loader2, 
  TrendingUp, 
  Users, 
  FileSpreadsheet, 
  Search,
  ChevronDown,
  Info
} from 'lucide-react';
import { api } from '@/utils/api';

interface Batch {
  batchId: string;
  batchName: string;
  courses?: any[];
}

interface Student {
  studentId: string;
  fullName: string;
  email: string;
  regNo: string;
  currentBatchId: string;
}

interface Assignment {
  assignmentId: string;
  title: string;
  courseId?: string;
}

interface Exam {
  id: string;
  title: string;
  courseId: string;
  passMarks?: number;
  totalMarks?: number;
  audiences?: any[];
}

interface AssignmentSubmission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  marks?: number;
  feedback?: string;
}

interface ExamAttempt {
  attemptId: string;
  examId: string;
  studentId: string;
  score?: number;
  status: string;
}

interface StudentPerformance {
  studentId: string;
  fullName: string;
  email: string;
  regNo: string;
  
  obtainedAssignments: number;
  fullAssignments: number;
  assignmentPercentage: number;
  
  obtainedExams: number;
  fullExams: number;
  examPercentage: number;
  
  overallPercentage: number;
  rank: number;
}

export const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [batchesData, studentsData, assignmentsData, examsData, subsData, attsData, coursesData] = await Promise.all([
          api.get<Batch[]>('/api/v1/batches').catch(() => []),
          api.get<Student[]>('/api/v1/students').catch(() => []),
          api.get<Assignment[]>('/api/v1/assignments').catch(() => []),
          api.get<Exam[]>('/api/v1/exams').catch(() => []),
          api.get<AssignmentSubmission[]>('/api/v1/assignment-submissions').catch(() => []),
          api.get<ExamAttempt[]>('/api/v1/exam-attempts').catch(() => []),
          api.get<any[]>('/api/v1/courses').catch(() => [])
        ]);

        const validBatches = Array.isArray(batchesData) ? batchesData : [];
        setBatches(validBatches);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        setExams(Array.isArray(examsData) ? examsData : []);
        setSubmissions(Array.isArray(subsData) ? subsData : []);
        setAttempts(Array.isArray(attsData) ? attsData : []);
        setCourses(Array.isArray(coursesData) ? coursesData : []);

        if (validBatches.length > 0) {
          setSelectedBatchId(validBatches[0].batchId);
        }
      } catch (err) {
        console.error('Failed to load performance metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedBatch = useMemo(() => {
    return batches.find(b => b.batchId === selectedBatchId);
  }, [batches, selectedBatchId]);

  // Resolve courses in selected batch
  const batchCourseIds = useMemo(() => {
    if (!selectedBatch) return new Set<string>();
    const courses = selectedBatch.courses || [];
    return new Set(courses.map(c => c.courseId.toLowerCase()));
  }, [selectedBatch]);

  // Create a mapping from assignmentId -> courseId by parsing course sections JSON outline
  const assignmentCourseMap = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach(course => {
      if (!course.sections) return;
      try {
        const sectionsList = JSON.parse(course.sections);
        if (Array.isArray(sectionsList)) {
          sectionsList.forEach((section: any) => {
            if (section.items && Array.isArray(section.items)) {
              section.items.forEach((item: any) => {
                if (item.type === 'assignment' && item.id) {
                  map.set(item.id.toLowerCase(), course.courseId.toLowerCase());
                }
              });
            }
          });
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });
    return map;
  }, [courses]);

  // Filter assignments and exams mapped to this batch's courses
  const batchAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (!a.assignmentId) return false;
      const cId = assignmentCourseMap.get(a.assignmentId.toLowerCase());
      return cId ? batchCourseIds.has(cId) : false;
    });
  }, [assignments, batchCourseIds, assignmentCourseMap]);

  const batchExams = useMemo(() => {
    if (!selectedBatchId) return [];
    return exams.filter(e => {
      const matchesAudience = e.audiences && e.audiences.some(
        (aud: any) => aud.targetType === 'BATCH' && aud.targetId === selectedBatchId
      );
      if (matchesAudience) return true;

      const matchesModule = e.audiences && e.audiences.some(
        (aud: any) => aud.targetType === 'MODULE' && batchCourseIds.has(aud.targetId.toLowerCase())
      );
      if (matchesModule) return true;

      return e.courseId && batchCourseIds.has(e.courseId.toLowerCase());
    });
  }, [exams, selectedBatchId, batchCourseIds]);

  // Compute performance list for students in selected batch
  const studentPerformances = useMemo(() => {
    if (!selectedBatchId) return [];
    
    const batchStudents = students.filter(s => s.currentBatchId === selectedBatchId);
    
    const list: StudentPerformance[] = batchStudents.map(student => {
      // 1. Calculate Assignment Marks
      let obtainedAssignments = 0;
      let fullAssignments = batchAssignments.length * 100;
      
      batchAssignments.forEach(asg => {
        const sub = submissions.find(s => 
          s.studentId.toLowerCase() === student.studentId.toLowerCase() && 
          s.assignmentId.toLowerCase() === asg.assignmentId.toLowerCase()
        );
        if (sub && sub.marks !== undefined && sub.marks !== null) {
          obtainedAssignments += sub.marks;
        }
      });
      
      const assignmentPercentage = fullAssignments > 0 
        ? Math.round((obtainedAssignments / fullAssignments) * 100) 
        : 0;

      // 2. Calculate Exam Marks
      let obtainedExams = 0;
      let fullExams = 0;
      
      batchExams.forEach(exam => {
        const examMax = exam.totalMarks || 100;
        fullExams += examMax;
        
        // Find best attempt for this student and exam
        const studentAttempts = attempts.filter(a => 
          a.studentId.toLowerCase() === student.studentId.toLowerCase() && 
          a.examId.toLowerCase() === exam.id.toLowerCase()
        );
        if (studentAttempts.length > 0) {
          const maxScore = Math.max(...studentAttempts.map(a => a.score || 0));
          // Obtained is percentage of score, convert to actual marks
          obtainedExams += (maxScore / 100) * examMax;
        }
      });

      const examPercentage = fullExams > 0 
        ? Math.round((obtainedExams / fullExams) * 100) 
        : 0;

      // 3. Overall calculation (average of both coursework streams)
      let overallPercentage = 0;
      if (fullAssignments > 0 && fullExams > 0) {
        overallPercentage = Math.round((assignmentPercentage + examPercentage) / 2);
      } else if (fullAssignments > 0) {
        overallPercentage = assignmentPercentage;
      } else if (fullExams > 0) {
        overallPercentage = examPercentage;
      }

      return {
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        regNo: student.regNo || 'N/A',
        obtainedAssignments,
        fullAssignments,
        assignmentPercentage,
        obtainedExams: Math.round(obtainedExams),
        fullExams,
        examPercentage,
        overallPercentage,
        rank: 0
      };
    });

    // Sort by overall percentage descending to assign ranks
    const sorted = [...list].sort((a, b) => b.overallPercentage - a.overallPercentage);
    sorted.forEach((item, index) => {
      item.rank = index + 1;
    });

    return sorted;
  }, [selectedBatchId, students, batchAssignments, batchExams, submissions, attempts]);

  // Filter list by search query
  const filteredPerformances = useMemo(() => {
    return studentPerformances.filter(sp => 
      sp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sp.regNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [studentPerformances, searchQuery]);

  // Batch analytics averages
  const batchMetrics = useMemo(() => {
    if (studentPerformances.length === 0) return { avg: 0, top: 'N/A', count: 0 };
    const total = studentPerformances.reduce((sum, sp) => sum + sp.overallPercentage, 0);
    return {
      avg: Math.round(total / studentPerformances.length),
      top: studentPerformances[0]?.fullName || 'N/A',
      count: studentPerformances.length
    };
  }, [studentPerformances]);

  return (
    <div className="space-y-6 text-left">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-heading select-none">
            <FileSpreadsheet className="h-7 w-7 text-[#4F3FF0]" />
            Academic Performance Reports
          </h1>
          <p className="text-slate-500 text-sm mt-1 select-none">
            Track student coursework and assessment grades. Retrieve maximum marks, obtained scores, and averages grouped by batch.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
          <p className="text-xs text-slate-550 font-bold select-none">Loading metrics engine...</p>
        </div>
      ) : (
        <>
          {/* Top Filter and Select Bar */}
          <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
            
            <div className="space-y-1 text-left flex-1 max-w-sm">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Select Batch Report</label>
              <div className="relative">
                <select
                  value={selectedBatchId}
                  onChange={e => {
                    setSelectedBatchId(e.target.value);
                    setSelectedStudent(null);
                  }}
                  className="w-full pl-4 pr-10 py-3 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-300 focus:border-[#4F3FF0] rounded-xl text-xs text-slate-800 font-extrabold outline-none cursor-pointer focus:bg-white transition-all appearance-none"
                >
                  {batches.map(b => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchName}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search student or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] focus:bg-white rounded-xl text-xs text-slate-800 font-bold outline-none transition-all placeholder-slate-400"
              />
            </div>

          </div>

          {/* Batch Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
            
            <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-[#4F3FF0]/5 text-[#4F3FF0] rounded-2xl">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Students Enrolled</p>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                  {batchMetrics.count} student{batchMetrics.count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Batch Average Grade</p>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                  {batchMetrics.avg}%
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Top Performer</p>
                <p className="text-lg font-extrabold text-slate-800 truncate max-w-[200px] mt-0.5" title={batchMetrics.top}>
                  {batchMetrics.top}
                </p>
              </div>
            </div>

          </div>

          {/* Student Standing Performance Table */}
          <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center select-none">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-450">
                Coursework Stream & Exam Total Summary List
              </h3>
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                All scores are aggregated from individual database submissions
              </span>
            </div>

            <div className="overflow-x-auto border border-[#E9EDF5] rounded-2xl overflow-hidden font-sans">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-455 text-[9.5px] font-black tracking-wider uppercase select-none">
                    <th className="px-6 py-4 w-16">RANK</th>
                    <th className="px-6 py-4">STUDENT NAME</th>
                    <th className="px-6 py-4">ASSIGNMENTS TOTAL</th>
                    <th className="px-6 py-4">EXAMS TOTAL</th>
                    <th className="px-6 py-4 text-right">OVERALL AVERAGE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-bold">
                  {filteredPerformances.map((sp) => (
                    <tr 
                      key={sp.studentId} 
                      onClick={() => setSelectedStudent(sp)}
                      className="hover:bg-[#4F3FF0]/5 cursor-pointer transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full font-black text-xs select-none ${
                          sp.rank === 1
                            ? 'bg-amber-50 border border-amber-300 text-amber-600'
                            : sp.rank === 2
                            ? 'bg-slate-50 border border-slate-350 text-slate-500'
                            : sp.rank === 3
                            ? 'bg-amber-50/30 border border-amber-600/30 text-amber-800'
                            : 'text-slate-450 font-semibold'
                        }`}>
                          {sp.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-900 text-sm">{sp.fullName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Reg: {sp.regNo} | {sp.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700">{sp.obtainedAssignments} / {sp.fullAssignments}</span>
                          <span className="text-[10px] text-slate-400 font-bold font-sans">({sp.assignmentPercentage}%)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700">{sp.obtainedExams} / {sp.fullExams}</span>
                          <span className="text-[10px] text-slate-400 font-bold font-sans">({sp.examPercentage}%)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right select-none">
                        <span className={`inline-flex px-3 py-1 border rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          sp.overallPercentage >= 75
                            ? 'bg-emerald-50 border-emerald-250 text-emerald-800 shadow-sm shadow-emerald-50'
                            : sp.overallPercentage >= 40
                            ? 'bg-amber-50 border-amber-250 text-amber-800 shadow-sm shadow-amber-50'
                            : 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm shadow-rose-50'
                        }`}>
                          {sp.overallPercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredPerformances.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-450 text-xs font-semibold bg-slate-50/30 select-none">
                        No student performance records found for this batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Student Performance Modal Popup */}
          {selectedStudent && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-200">
              <div 
                className="bg-white border border-[#E9EDF5] rounded-3xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-left"
                onClick={e => e.stopPropagation()}
              >
                
                {/* Modal Header */}
                <div className="p-6 border-b border-[#E9EDF5] flex justify-between items-start gap-4">
                  <div>
                    <span className="px-2 py-0.5 bg-[#4F3FF0]/5 text-[#4F3FF0] rounded text-[9px] font-black uppercase tracking-wider">
                      Student Grade Sheet
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1">
                      {selectedStudent.fullName}
                    </h3>
                    <p className="text-xs text-slate-450 mt-0.5">
                      Reg No: {selectedStudent.regNo} | Email: {selectedStudent.email}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-100"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
                  
                  {/* Performance Streams Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1">
                      <p className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Assignments Marks Ratio</p>
                      <p className="text-lg font-extrabold text-slate-800">
                        {selectedStudent.obtainedAssignments} <span className="text-xs text-slate-400 font-bold">/ {selectedStudent.fullAssignments} marks</span>
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#4F3FF0] h-full rounded-full" style={{ width: `${selectedStudent.assignmentPercentage}%` }} />
                        </div>
                        <span className="font-extrabold text-slate-650">{selectedStudent.assignmentPercentage}%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1">
                      <p className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Exams Marks Ratio</p>
                      <p className="text-lg font-extrabold text-slate-800">
                        {selectedStudent.obtainedExams} <span className="text-xs text-slate-400 font-bold">/ {selectedStudent.fullExams} marks</span>
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#4F3FF0] h-full rounded-full" style={{ width: `${selectedStudent.examPercentage}%` }} />
                        </div>
                        <span className="font-extrabold text-slate-650">{selectedStudent.examPercentage}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Assignments Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-black uppercase tracking-wider text-slate-450 text-[10px] flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-[#4F3FF0]" />
                      Assignments List Details
                    </h4>
                    
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {batchAssignments.map(asg => {
                        const sub = submissions.find(s => 
                          s.studentId.toLowerCase() === selectedStudent.studentId.toLowerCase() && 
                          s.assignmentId.toLowerCase() === asg.assignmentId.toLowerCase()
                        );
                        const isGraded = sub && sub.marks !== undefined && sub.marks !== null;

                        return (
                          <div key={asg.assignmentId} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
                            <span className="font-bold text-slate-800 truncate pr-4">{asg.title}</span>
                            <span className={`shrink-0 font-extrabold ${isGraded ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                              {isGraded ? `${sub.marks} / 100` : 'Not Graded'}
                            </span>
                          </div>
                        );
                      })}
                      {batchAssignments.length === 0 && (
                        <p className="text-xs font-semibold text-slate-400 italic py-2 text-center">No assignments mapped to courses of this batch.</p>
                      )}
                    </div>
                  </div>

                  {/* Detailed Exams Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-black uppercase tracking-wider text-slate-455 text-[10px] flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-emerald-600" />
                      Exam Attempts Details
                    </h4>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {batchExams.map(exam => {
                        const examMax = exam.totalMarks || 100;
                        const studentAttempts = attempts.filter(a => 
                          a.studentId.toLowerCase() === selectedStudent.studentId.toLowerCase() && 
                          a.examId.toLowerCase() === exam.id.toLowerCase()
                        );
                        const hasAttempt = studentAttempts.length > 0;
                        const bestScore = hasAttempt ? Math.max(...studentAttempts.map(a => a.score || 0)) : 0;
                        const obtainedMarks = Math.round((bestScore / 100) * examMax);

                        return (
                          <div key={exam.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
                            <span className="font-bold text-slate-800 truncate pr-4">{exam.title}</span>
                            <span className={`shrink-0 font-extrabold ${hasAttempt ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                              {hasAttempt ? `${obtainedMarks} / ${examMax} (${bestScore}%)` : 'No attempts'}
                            </span>
                          </div>
                        );
                      })}
                      {batchExams.length === 0 && (
                        <p className="text-xs font-semibold text-slate-400 italic py-2 text-center">No exams mapped to courses of this batch.</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-[#F8FAFC] border-t border-[#E9EDF5] flex justify-end">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Close Sheet
                  </button>
                </div>

              </div>
            </div>
          )}

        </>
      )}

    </div>
  );
};

export default Reports;
