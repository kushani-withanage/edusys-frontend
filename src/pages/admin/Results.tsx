import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  Edit3,
  Award
} from 'lucide-react';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import { gradeService, type GradeData } from '@/services/gradeService';
import { studentService } from '@/services/studentService';
import type { Student } from '@/interfaces';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GradeRecord {
  gradeId?: string;
  studentId: string;
  courseId: string;
  assignmentScore: number;
  examScore: number;
  totalAverage: number;
}

export const Results: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'grades' | 'roster'>('grades');

  // --- States ---
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [rawGrades, setRawGrades] = useState<any[]>([]); // holds raw GradeDTOs from backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Modals State ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Form States ---
  const [gradeForm, setGradeForm] = useState({
    assignmentScore: '0',
    examScore: '0'
  });

  // --- Mock Fallbacks (Sandbox visualization mode) ---
  const defaultStudents = useMemo<Student[]>(() => [
    { studentId: 'stu-1', fullName: 'Sachin Samarawickrama', email: 'sachin@gmail.com', phone: '+94771112222', status: 'ACTIVE', regNo: 'pr268924021' },
    { studentId: 'stu-2', fullName: 'Pawara Minimuthu', email: 'pawara@gmail.com', phone: '+94773334444', status: 'ACTIVE', regNo: 'pr268924022' },
    { studentId: 'stu-3', fullName: 'Sharadha Madusinghe', email: 'sharadha@gmail.com', phone: '+94775556666', status: 'ACTIVE', regNo: 'pr268924023' }
  ], []);

  const defaultGrades = useMemo<GradeRecord[]>(() => [
    { studentId: 'stu-1', courseId: 'course-general', assignmentScore: 88, examScore: 90, totalAverage: 89.0 },
    { studentId: 'stu-2', courseId: 'course-general', assignmentScore: 95, examScore: 92, totalAverage: 93.5 },
    { studentId: 'stu-3', courseId: 'course-general', assignmentScore: 78, examScore: 80, totalAverage: 79.0 }
  ], []);

  // Map pending deliverables to students for roster display
  const pendingDeliverables = useMemo(() => {
    return {
      'stu-1': { countText: '1 delay tests', hasDelay: true },
      'stu-2': { countText: 'All submitted', hasDelay: false },
      'stu-3': { countText: '2 delay tests', hasDelay: true }
    } as Record<string, { countText: string, hasDelay: boolean }>;
  }, []);

  // --- Fetch API Data ---
  const fetchResultsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [studentsData, gradesData] = await Promise.all([
        studentService.getStudents(),
        gradeService.getGrades()
      ]);

      // If backend succeeds, set state
      setStudents(studentsData.length > 0 ? studentsData : defaultStudents);
      setRawGrades(gradesData);

      // Parse gradeValue ("assignmentScore,examScore")
      const parsedGrades: GradeRecord[] = gradesData.map(g => {
        let assignmentScore = 0;
        let examScore = 0;
        try {
          if (g.gradeValue && g.gradeValue.includes(',')) {
            const parts = g.gradeValue.split(',');
            assignmentScore = Number(parts[0]) || 0;
            examScore = Number(parts[1]) || 0;
          } else {
            assignmentScore = Number(g.gradeValue) || 0;
            examScore = assignmentScore; // fallback
          }
        } catch {
          // ignore
        }
        return {
          gradeId: g.gradeId,
          studentId: g.studentId,
          courseId: g.courseId,
          assignmentScore,
          examScore,
          totalAverage: Math.round(((assignmentScore + examScore) / 2) * 10) / 10
        };
      });

      // If parsed list is empty, merge with defaultGrades for visual feedback
      setGrades(parsedGrades.length > 0 ? parsedGrades : defaultGrades);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to backend server. Running in simulated sandbox mode.');
      setStudents(defaultStudents);
      setGrades(defaultGrades);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResultsData();
  }, [defaultStudents, defaultGrades]);

  // --- Handle Edit Click ---
  const handleEditGradeClick = (student: Student) => {
    setSelectedStudent(student);
    
    // Find existing scores
    const existing = grades.find(g => g.studentId === student.studentId);
    setGradeForm({
      assignmentScore: existing ? String(existing.assignmentScore) : '0',
      examScore: existing ? String(existing.examScore) : '0'
    });
    
    setShowEditModal(true);
  };

  // --- Submit Grade updates ---
  const handleSaveGradesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const assignment = Number(gradeForm.assignmentScore) || 0;
    const exam = Number(gradeForm.examScore) || 0;
    const computedAverage = Math.round(((assignment + exam) / 2) * 10) / 10;
    const encodedValue = `${assignment},${exam}`;

    try {
      setSubmitting(true);
      
      // Find if we already have a raw grade ID on the backend
      const existingRaw = rawGrades.find(rg => rg.studentId === selectedStudent.studentId);
      
      const payload: GradeData = {
        studentId: selectedStudent.studentId,
        courseId: 'course-general',
        gradeValue: encodedValue,
        publishedDate: new Date().toISOString().split('T')[0]
      };

      if (existingRaw && existingRaw.gradeId) {
        // Update
        const updated = await gradeService.updateGrade(existingRaw.gradeId, payload);
        setRawGrades(prev => prev.map(item => item.gradeId === existingRaw.gradeId ? updated : item));
      } else {
        // Create
        const created = await gradeService.createGrade(payload);
        setRawGrades(prev => [...prev, created]);
        payload.gradeId = created.gradeId;
      }

      // Sync UI state list
      const updatedGrades = grades.some(g => g.studentId === selectedStudent.studentId)
        ? grades.map(g => g.studentId === selectedStudent.studentId ? {
            ...g,
            assignmentScore: assignment,
            examScore: exam,
            totalAverage: computedAverage
          } : g)
        : [...grades, {
            studentId: selectedStudent.studentId,
            courseId: 'course-general',
            assignmentScore: assignment,
            examScore: exam,
            totalAverage: computedAverage
          }];

      setGrades(updatedGrades);
      setShowEditModal(false);
      alert('Grades published successfully!');
    } catch (err: any) {
      console.error(err);
      // Fallback
      const updatedGrades = grades.some(g => g.studentId === selectedStudent.studentId)
        ? grades.map(g => g.studentId === selectedStudent.studentId ? {
            ...g,
            assignmentScore: assignment,
            examScore: exam,
            totalAverage: computedAverage
          } : g)
        : [...grades, {
            studentId: selectedStudent.studentId,
            courseId: 'course-general',
            assignmentScore: assignment,
            examScore: exam,
            totalAverage: computedAverage
          }];

      setGrades(updatedGrades);
      setShowEditModal(false);
      alert('Simulation: Grades saved locally.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSubmissionsAlert = (studentName: string) => {
    alert(`${studentName}'s Classroom Submissions Log:
- Programming Quiz 1: Grading Complete (Score: 85)
- Object Oriented Programming Labs: Submitted & Evaluated
- Standalone Client Project: Pending Review`);
  };

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
            Academic Panel Desk
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure academic records, grading, class rosters, materials, and testing schedules.
          </p>
        </div>
      </div>

      {/* Tabs Selector Bar */}
      <div className="flex border-b border-[#E2E8F0] gap-8 select-none">
        <button
          onClick={() => setActiveTab('grades')}
          className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
            activeTab === 'grades' 
              ? 'text-[#4F3FF0] font-extrabold' 
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Enter Grades
          {activeTab === 'grades' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
            activeTab === 'roster' 
              ? 'text-[#4F3FF0] font-extrabold' 
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Student Roster
          {activeTab === 'roster' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* --- TAB 1: ENTER GRADES --- */}
        {activeTab === 'grades' && (
          <div className="bg-white border border-[#E9EDF5] rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
                <p className="text-slate-500 font-medium text-sm">Loading classroom grades...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="font-bold text-slate-655">No classroom students found</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                      <th className="px-6 py-4">STUDENT NAME</th>
                      <th className="px-6 py-4">ASSIGNMENT (100)</th>
                      <th className="px-6 py-4">EXAM SCORE (100)</th>
                      <th className="px-6 py-4">TOTAL AVERAGE</th>
                      <th className="px-6 py-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
                    {students.map(stu => {
                      // Find student's grade records
                      const score = grades.find(g => g.studentId === stu.studentId) || {
                        assignmentScore: 0,
                        examScore: 0,
                        totalAverage: 0
                      };

                      return (
                        <tr key={stu.studentId} className="hover:bg-slate-50/30 transition-colors duration-150">
                          <td className="px-6 py-4.5 font-extrabold text-slate-800 text-sm">
                            {stu.fullName}
                          </td>
                          <td className="px-6 py-4.5 text-slate-600">
                            {score.assignmentScore > 0 ? `${score.assignmentScore} pts` : '-'}
                          </td>
                          <td className="px-6 py-4.5 text-slate-600">
                            {score.examScore > 0 ? `${score.examScore} pts` : '-'}
                          </td>
                          <td className="px-6 py-4.5 text-[#4F3FF0] font-black text-sm">
                            {score.totalAverage > 0 ? `${score.totalAverage.toFixed(1)}%` : '0.0%'}
                          </td>
                          <td className="px-6 py-4.5 text-right">
                            <button 
                              onClick={() => handleEditGradeClick(stu)}
                              className="px-3.5 py-1.5 border border-slate-200 hover:border-[#4F3FF0] hover:bg-[#4F3FF0] hover:text-white rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
                            >
                              Edit
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
        )}

        {/* --- TAB 2: STUDENT ROSTER --- */}
        {activeTab === 'roster' && (
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm font-heading">Active Student Classroom Roster</h3>
              <p className="text-slate-450 text-[11px] font-semibold mt-1">Monitor grade performance and submission details.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <p className="text-slate-400 text-xs py-6 text-center">No students registered in this class.</p>
            ) : (
              <div className="overflow-x-auto border border-[#E9EDF5] rounded-2xl overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                      <th className="px-6 py-4">STUDENT NAME</th>
                      <th className="px-6 py-4">STATUS</th>
                      <th className="px-6 py-4">PENDING DELIVERABLES</th>
                      <th className="px-6 py-4 text-right">SUBMISSION PREVIEW</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
                    {students.map(stu => {
                      const deliverable = pendingDeliverables[stu.studentId] || { countText: 'All submitted', hasDelay: false };
                      return (
                        <tr key={stu.studentId} className="hover:bg-slate-50/30 transition-colors duration-150">
                          <td className="px-6 py-4.5 font-extrabold text-slate-800 text-sm">
                            {stu.fullName}
                          </td>
                          <td className="px-6 py-4.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 border border-emerald-250 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full select-none leading-none">
                              Active
                            </span>
                          </td>
                          <td className={`px-6 py-4.5 font-bold ${deliverable.hasDelay ? 'text-rose-600' : 'text-slate-400'}`}>
                            {deliverable.countText}
                          </td>
                          <td className="px-6 py-4.5 text-right">
                            <button
                              onClick={() => handleViewSubmissionsAlert(stu.fullName)}
                              className="text-[#4F3FF0] hover:underline font-extrabold text-xs cursor-pointer bg-transparent border-none outline-none"
                            >
                              View Submission
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
        )}

      </div>

      {/* --- EDIT GRADE MODAL --- */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-805 mb-1 font-heading flex items-center gap-2 select-none">
              <Edit3 className="h-5 w-5 text-[#4F3FF0]" />
              Enter Grade Records
            </h3>
            <p className="text-slate-450 text-xs font-semibold mb-4 select-none">Configure evaluation marks for {selectedStudent.fullName}.</p>
            
            <form onSubmit={handleSaveGradesSubmit} className="space-y-4 font-sans">
              
              <TextField
                label="Assignment Marks (out of 100) *"
                type="number"
                min="0"
                max="100"
                value={gradeForm.assignmentScore}
                onChange={e => setGradeForm(prev => ({ ...prev, assignmentScore: e.target.value }))}
                required
              />

              <TextField
                label="Exam Score (out of 100) *"
                type="number"
                min="0"
                max="100"
                value={gradeForm.examScore}
                onChange={e => setGradeForm(prev => ({ ...prev, examScore: e.target.value }))}
                required
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <Button type="button" variant="outline" color="secondary" onClick={() => setShowEditModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  Publish Grade
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Results;
