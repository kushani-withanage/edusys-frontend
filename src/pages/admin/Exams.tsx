import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Calendar,
  Clock,
  MapPin,
  Users,
  FileQuestion,
  BookOpen,
  User,
  GraduationCap
} from 'lucide-react';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import { examService, type QuestionData, type ExamData } from '@/services/examService';

interface Question {
  questionId: string;
  questionType: string;
  questionText: string;
  options?: string[];
  marks: number;
  correctAnswers: string[];
  createdBy: string;
  // Dynamic course module tracking for UI matching
  courseModule?: string;
}

interface Exam {
  examId: string;
  title: string;
  startTime: string;
  durationMinutes: number;
  totalMarks: number;
  questionIds: string[];
  createdBy: string;
  batchName?: string;
  venue?: string;
  enrolledCount?: number;
  status?: string; // Upcoming, Live, Completed
}

export const Exams: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'bank' | 'schedule'>('calendar');

  // --- Lists State ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Filter states ---
  const [moduleFilter, setModuleFilter] = useState('All');
  const [teacherFilter, setTeacherFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // --- Modal state ---
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // --- Form states for Add Question ---
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'MCQ',
    courseModule: 'Programming Fundamentals',
    createdBy: 'Mr. Kasun Jayasuriya',
    marks: '5',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correctAnswerOption: '1', // Selected index for MCQ
    correctAnswerText: ''     // Text value for Short Answer
  });

  // --- Form states for Schedule Exam ---
  const [examForm, setExamForm] = useState({
    title: '',
    durationMinutes: '60',
    startTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // tomorrow
    batchName: 'iCD110 (Programming Fundamentals)',
    venue: 'Lab 03 (Panadura Block)',
    courseModule: 'Programming Fundamentals'
  });
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // --- Mock Fallbacks (Sandbox visualization mode) ---
  const defaultQuestions = useMemo<Question[]>(() => [
    {
      questionId: 'q-1',
      questionType: 'SHORT_ANSWER',
      questionText: 'Explain the difference between SQL and NoSQL databases.',
      courseModule: 'Database Management System',
      createdBy: 'Mrs. Kushani Withanage',
      marks: 10,
      correctAnswers: ['SQL is relational, NoSQL is non-relational.']
    },
    {
      questionId: 'q-2',
      questionType: 'MCQ',
      questionText: 'Which of the following is NOT a fundamental pillar of OOP?',
      courseModule: 'Object Oriented Programming',
      createdBy: 'Mr. Kasun Jayasuriya',
      marks: 5,
      options: ['Inheritance', 'Polymorphism', 'Compilation', 'Encapsulation'],
      correctAnswers: ['Compilation']
    },
    {
      questionId: 'q-3',
      questionType: 'MCQ',
      questionText: 'What is the worst-case time complexity of Quick Sort?',
      courseModule: 'Programming Fundamentals',
      createdBy: 'Mr. Kasun Jayasuriya',
      marks: 5,
      options: ['O(N log N)', 'O(N)', 'O(N^2)', 'O(1)'],
      correctAnswers: ['O(N^2)']
    },
    {
      questionId: 'q-4',
      questionType: 'SHORT_ANSWER',
      questionText: 'Explain normalized design patterns up to 3NF.',
      courseModule: 'Database Management System',
      createdBy: 'Mrs. Kushani Withanage',
      marks: 10,
      correctAnswers: ['1NF flat, 2NF partial key dependencies removed, 3NF transitive dependencies resolved.']
    }
  ], []);

  const defaultExams = useMemo<Exam[]>(() => [
    {
      examId: 'ex-1',
      title: 'Software Design Patterns Final Exam',
      startTime: '2026-07-20T10:00:00',
      durationMinutes: 120,
      totalMarks: 100,
      questionIds: ['q-2'],
      createdBy: 'Mr. Kasun Jayasuriya',
      batchName: 'BATCH iCD110',
      venue: 'Lab 03 (Panadura Block)',
      enrolledCount: 34,
      status: 'Upcoming'
    },
    {
      examId: 'ex-2',
      title: 'HTML & CSS Core Quiz',
      startTime: '2026-07-12T14:00:00',
      durationMinutes: 45,
      totalMarks: 50,
      questionIds: ['q-3'],
      createdBy: 'Mrs. Kushani Withanage',
      batchName: 'BATCH iCM111',
      venue: 'Online (LMS Portal)',
      enrolledCount: 42,
      status: 'Live'
    },
    {
      examId: 'ex-3',
      title: 'Intro to Database normalization',
      startTime: '2026-06-30T09:00:00',
      durationMinutes: 60,
      totalMarks: 75,
      questionIds: ['q-1', 'q-4'],
      createdBy: 'Mrs. Kushani Withanage',
      batchName: 'BATCH iCD112',
      venue: 'Lab 01 (Engineering Block)',
      enrolledCount: 28,
      status: 'Completed'
    }
  ], []);

  // --- Fetch API data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [questionsData, examsData] = await Promise.all([
        examService.getQuestions(),
        examService.getExams()
      ]);

      // Resolve course modules on fetched backend questions if absent
      const resolvedQuestions = questionsData.map((q, idx) => ({
        ...q,
        courseModule: q.courseModule || defaultQuestions[idx % defaultQuestions.length]?.courseModule || 'General'
      }));

      // Resolve attributes on fetched backend exams if absent
      const resolvedExams = examsData.map((e, idx) => {
        const fallback = defaultExams[idx % defaultExams.length];
        return {
          ...e,
          batchName: e.batchName || fallback.batchName,
          venue: e.venue || fallback.venue,
          enrolledCount: e.enrolledCount || fallback.enrolledCount,
          status: e.status || fallback.status || 'Upcoming'
        };
      });

      setQuestions(resolvedQuestions.length > 0 ? resolvedQuestions : defaultQuestions);
      setExams(resolvedExams.length > 0 ? resolvedExams : defaultExams);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to backend server. Running in simulated sandbox mode.');
      setQuestions(defaultQuestions);
      setExams(defaultExams);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [defaultQuestions, defaultExams]);

  // --- Filtered lists ---
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesModule = moduleFilter === 'All' || q.courseModule === moduleFilter;
      const matchesTeacher = teacherFilter === 'All' || q.createdBy === teacherFilter;
      const matchesType = typeFilter === 'All' || q.questionType === typeFilter;
      return matchesModule && matchesTeacher && matchesType;
    });
  }, [questions, moduleFilter, teacherFilter, typeFilter]);

  // Filter questions for the Schedule Exam picker based on the form's target course module
  const eligibleQuestions = useMemo(() => {
    return questions.filter(q => q.courseModule === examForm.courseModule);
  }, [questions, examForm.courseModule]);

  // --- Create Question Submit ---
  const handleCreateQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.questionText.trim()) return;

    try {
      setSubmitting(true);
      const isMCQ = questionForm.questionType === 'MCQ';
      const options = isMCQ 
        ? [questionForm.option1, questionForm.option2, questionForm.option3, questionForm.option4].filter(Boolean)
        : [];
      
      const correctAnswers = isMCQ
        ? [options[Number(questionForm.correctAnswerOption) - 1]].filter(Boolean)
        : [questionForm.correctAnswerText];

      const payload: QuestionData = {
        questionType: questionForm.questionType,
        questionText: questionForm.questionText,
        options,
        marks: Number(questionForm.marks),
        correctAnswers,
        createdBy: questionForm.createdBy
      };

      const created = await examService.createQuestion(payload);
      
      // Merge extra local field
      const newQuestion: Question = {
        ...created,
        courseModule: questionForm.courseModule
      };

      setQuestions(prev => [...prev, newQuestion]);
      setShowQuestionModal(false);
      
      alert('Question added to Question Bank successfully!');
    } catch (err: any) {
      console.error(err);
      // Fallback
      const isMCQ = questionForm.questionType === 'MCQ';
      const options = isMCQ 
        ? [questionForm.option1, questionForm.option2, questionForm.option3, questionForm.option4].filter(Boolean)
        : [];
      
      const correctAnswers = isMCQ
        ? [options[Number(questionForm.correctAnswerOption) - 1]].filter(Boolean)
        : [questionForm.correctAnswerText];

      const sandboxCreated: Question = {
        questionId: 'q-' + (questions.length + 1),
        questionType: questionForm.questionType,
        questionText: questionForm.questionText,
        options,
        marks: Number(questionForm.marks),
        correctAnswers,
        createdBy: questionForm.createdBy,
        courseModule: questionForm.courseModule
      };
      setQuestions(prev => [...prev, sandboxCreated]);
      setShowQuestionModal(false);
      alert('Simulation: Question added locally.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id: string, text: string) => {
    const confirm = window.confirm(`Delete question "${text.substring(0, 40)}..."?`);
    if (!confirm) return;

    try {
      await examService.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.questionId !== id));
      alert('Question deleted successfully.');
    } catch (err: any) {
      console.error(err);
      setQuestions(prev => prev.filter(q => q.questionId !== id));
      alert('Simulation: Question deleted.');
    }
  };

  // --- Schedule Exam Submit ---
  const handleScheduleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.title.trim()) return;
    if (selectedQuestionIds.length === 0) {
      alert('Please select at least one question to schedule the exam.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Sum up selected question marks
      const totalMarks = questions
        .filter(q => selectedQuestionIds.includes(q.questionId))
        .reduce((sum, q) => sum + q.marks, 0);

      const payload: ExamData = {
        title: examForm.title,
        startTime: new Date(examForm.startTime).toISOString(),
        durationMinutes: Number(examForm.durationMinutes),
        totalMarks: totalMarks,
        questionIds: selectedQuestionIds,
        createdBy: 'Mrs. Kushani Withanage'
      };

      const created = await examService.createExam(payload);

      const newExam: Exam = {
        ...created,
        batchName: 'BATCH ' + examForm.batchName.split(' ')[0],
        venue: examForm.venue,
        enrolledCount: Math.floor(15 + Math.random() * 30),
        status: 'Upcoming'
      };

      setExams(prev => [newExam, ...prev]);
      alert('Exam published and scheduled successfully!');
      
      // Reset form
      setExamForm({
        title: '',
        durationMinutes: '60',
        startTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        batchName: 'iCD110 (Programming Fundamentals)',
        venue: 'Lab 03 (Panadura Block)',
        courseModule: 'Programming Fundamentals'
      });
      setSelectedQuestionIds([]);
      setActiveTab('calendar');

    } catch (err: any) {
      console.error(err);
      // Fallback
      const totalMarks = questions
        .filter(q => selectedQuestionIds.includes(q.questionId))
        .reduce((sum, q) => sum + q.marks, 0);

      const sandboxCreated: Exam = {
        examId: 'ex-' + (exams.length + 1),
        title: examForm.title,
        startTime: examForm.startTime,
        durationMinutes: Number(examForm.durationMinutes),
        totalMarks: totalMarks,
        questionIds: selectedQuestionIds,
        createdBy: 'Mrs. Kushani Withanage',
        batchName: 'BATCH ' + examForm.batchName.split(' ')[0],
        venue: examForm.venue,
        enrolledCount: 30,
        status: 'Upcoming'
      };

      setExams(prev => [sandboxCreated, ...prev]);
      alert('Simulation: Exam scheduled locally.');
      
      setExamForm({
        title: '',
        durationMinutes: '60',
        startTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        batchName: 'iCD110 (Programming Fundamentals)',
        venue: 'Lab 03 (Panadura Block)',
        courseModule: 'Programming Fundamentals'
      });
      setSelectedQuestionIds([]);
      setActiveTab('calendar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async (id: string, title: string) => {
    const confirm = window.confirm(`Are you sure you want to cancel and delete scheduled exam "${title}"?`);
    if (!confirm) return;

    try {
      await examService.deleteExam(id);
      setExams(prev => prev.filter(e => e.examId !== id));
      alert('Exam cancelled successfully.');
    } catch (err: any) {
      console.error(err);
      setExams(prev => prev.filter(e => e.examId !== id));
      alert('Simulation: Exam cancelled.');
    }
  };

  const handleToggleQuestionSelect = (id: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Helper to format Date string
  const formatExamDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      const formattedHours = String(hours).padStart(2, '0');

      return `${year}-${month}-${day} ${formattedHours}:${minutes} ${ampm}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-250 rounded-2xl text-rose-800 text-sm animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
            <GraduationCap className="h-7 w-7 text-[#4F3FF0]" />
            Academic Panel Desk
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure academic records, grading, class rosters, materials, and testing schedules.
          </p>
        </div>
        <div>
          {activeTab === 'bank' && (
            <Button 
              variant="solid" 
              color="primary" 
              onClick={() => {
                setQuestionForm({
                  questionText: '',
                  questionType: 'MCQ',
                  courseModule: 'Programming Fundamentals',
                  createdBy: 'Mr. Kasun Jayasuriya',
                  marks: '5',
                  option1: '',
                  option2: '',
                  option3: '',
                  option4: '',
                  correctAnswerOption: '1',
                  correctAnswerText: ''
                });
                setShowQuestionModal(true);
              }}
              startIcon={<Plus className="h-4.5 w-4.5" />}
            >
              Add New Question
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Selector Bar */}
      <div className="flex border-b border-[#E2E8F0] gap-8 select-none">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
            activeTab === 'calendar' 
              ? 'text-[#4F3FF0] font-extrabold' 
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Academic Calendar
          {activeTab === 'calendar' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
            activeTab === 'bank' 
              ? 'text-[#4F3FF0] font-extrabold' 
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Question Bank
          {activeTab === 'bank' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
            activeTab === 'schedule' 
              ? 'text-[#4F3FF0] font-extrabold' 
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Schedule New Test
          {activeTab === 'schedule' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        
        {/* --- TAB 1: ACADEMIC CALENDAR --- */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-200">
            
            {/* Upcoming Exam Schedules */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-5 flex items-center gap-2 select-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  UPCOMING EXAM SCHEDULES
                </h3>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
                  </div>
                ) : exams.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-10">No examinations scheduled.</p>
                ) : (
                  <div className="space-y-4">
                    {exams.map(ex => (
                      <div key={ex.examId} className="p-5 border border-[#E9EDF5] hover:border-slate-300 rounded-2xl transition-all relative">
                        {/* Cancel button */}
                        <button 
                          onClick={() => handleDeleteExam(ex.examId, ex.title)}
                          className="absolute top-4 right-4 p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Cancel Exam Schedule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <span className="text-[10px] font-extrabold text-[#4F3FF0] bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase">
                            {ex.batchName}
                          </span>
                          
                          <span className={`inline-flex items-center px-3 py-0.5 border text-xs font-semibold rounded-full select-none ${
                            ex.status === 'Live'
                              ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : ex.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                              : 'bg-amber-50 text-amber-600 border-amber-250'
                          }`}>
                            {ex.status || 'Upcoming'}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-800 text-base mt-3 font-sans leading-snug">{ex.title}</h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-slate-500 font-semibold text-xs leading-none">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-slate-400" />
                            {ex.durationMinutes} Minutes
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            {ex.venue || 'Online (LMS)'}
                          </div>
                          <div className="flex items-center gap-1.5 col-span-2 md:col-span-1">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {formatExamDate(ex.startTime)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-slate-400" />
                            {ex.enrolledCount || 20} Enrolled
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Planned Exam Overview */}
            <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2 select-none">
                <FileQuestion className="h-4 w-4 text-slate-400" />
                PLANNED EXAM OVERVIEW
              </h3>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 text-[#4F3FF0] animate-spin" />
                </div>
              ) : exams.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-6">No records.</p>
              ) : (
                <div className="space-y-3">
                  {exams.map(ex => (
                    <div key={ex.examId + '-side'} className="p-4 border border-[#E9EDF5] rounded-2xl">
                      <div className="flex justify-between items-center gap-2">
                        <h4 className="font-extrabold text-slate-800 text-xs truncate max-w-[70%]">{ex.title}</h4>
                        <span className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-full select-none leading-none ${
                          ex.status === 'Live'
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : ex.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                            : 'bg-amber-50 text-amber-600 border-amber-250'
                        }`}>
                          {ex.status || 'Upcoming'}
                        </span>
                      </div>
                      
                      <div className="mt-3 space-y-1.5 text-[10px] font-bold text-slate-500">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Venue:</span>
                          <span className="text-slate-700">{ex.venue || 'Online'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Duration / Size:</span>
                          <span className="text-slate-700">{ex.durationMinutes}m ({ex.enrolledCount || 20} students)</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-50 pt-1.5 mt-1.5">
                          <span className="text-slate-400">Total Weight:</span>
                          <span className="text-[#4F3FF0]">{ex.totalMarks || 100} Marks</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- TAB 2: QUESTION BANK --- */}
        {activeTab === 'bank' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter Bar */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 font-bold text-slate-700 text-xs">
                  <Search className="h-4 w-4 text-slate-400" />
                  Question Search Filters
                </div>

                <div className="flex items-center flex-wrap gap-4 select-none">
                  {/* Module Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">MODULE:</span>
                    <select
                      value={moduleFilter}
                      onChange={(e) => setModuleFilter(e.target.value)}
                      className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#4F3FF0] cursor-pointer"
                    >
                      <option value="All">All Modules</option>
                      <option value="Database Management System">Database Management System</option>
                      <option value="Object Oriented Programming">Object Oriented Programming</option>
                      <option value="Programming Fundamentals">Programming Fundamentals</option>
                    </select>
                  </div>

                  {/* Teacher Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">TEACHER:</span>
                    <select
                      value={teacherFilter}
                      onChange={(e) => setTeacherFilter(e.target.value)}
                      className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#4F3FF0] cursor-pointer"
                    >
                      <option value="All">All Teachers</option>
                      <option value="Mrs. Kushani Withanage">Mrs. Kushani Withanage</option>
                      <option value="Mr. Kasun Jayasuriya">Mr. Kasun Jayasuriya</option>
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">TYPE:</span>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#4F3FF0] cursor-pointer"
                    >
                      <option value="All">All Types</option>
                      <option value="MCQ">MCQ</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Table */}
            <div className="bg-white border border-[#E9EDF5] rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
                  <p className="text-slate-500 font-medium text-sm">Loading Question Bank...</p>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-20">
                  <h3 className="font-bold text-slate-655">No questions match the filters</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                        <th className="px-6 py-4 w-1/3">QUESTION PROMPT</th>
                        <th className="px-6 py-4">COURSE MODULE</th>
                        <th className="px-6 py-4">RESPONSIBLE TEACHER</th>
                        <th className="px-6 py-4">TYPE</th>
                        <th className="px-6 py-4">MARKS</th>
                        <th className="px-6 py-4">CORRECT ANSWER</th>
                        <th className="px-6 py-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
                      {filteredQuestions.map(q => (
                        <tr key={q.questionId} className="hover:bg-slate-55/20 transition-colors duration-150 align-top">
                          
                          {/* Prompt & Options */}
                          <td className="px-6 py-5 space-y-3">
                            <p className="font-extrabold text-slate-800 text-xs max-w-sm leading-relaxed">{q.questionText}</p>
                            
                            {/* Render MCQ Option tags if options exist */}
                            {q.questionType === 'MCQ' && q.options && q.options.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1 select-none">
                                {q.options.map((opt, oIdx) => {
                                  const isCorrect = q.correctAnswers.includes(opt);
                                  return (
                                    <span 
                                      key={oIdx} 
                                      className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-xl border ${
                                        isCorrect 
                                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 font-extrabold'
                                          : 'border-slate-200 bg-slate-50 text-slate-500'
                                      }`}
                                    >
                                      {opt}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          
                          {/* Course Module */}
                          <td className="px-6 py-5 text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {q.courseModule || 'General'}
                            </span>
                          </td>

                          {/* Teacher */}
                          <td className="px-6 py-5 text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {q.createdBy}
                            </span>
                          </td>

                          {/* Type */}
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-2 py-0.5 border text-[10px] font-bold rounded-md select-none leading-none ${
                              q.questionType === 'MCQ' 
                                ? 'bg-indigo-50 text-[#4F3FF0] border-indigo-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {q.questionType === 'MCQ' ? 'MCQ' : 'Short Answer'}
                            </span>
                          </td>

                          {/* Marks */}
                          <td className="px-6 py-5 font-extrabold text-slate-800">
                            {q.marks} pts
                          </td>

                          {/* Correct Answer */}
                          <td className="px-6 py-5 text-emerald-600 font-bold max-w-[200px] leading-relaxed">
                            {q.correctAnswers.join(', ')}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-5 text-right">
                            <button 
                              onClick={() => handleDeleteQuestion(q.questionId, q.questionText)}
                              className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                              title="Delete Question"
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
          </div>
        )}

        {/* --- TAB 3: SCHEDULE NEW TEST --- */}
        {activeTab === 'schedule' && (
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm animate-in fade-in duration-200">
            <h3 className="text-sm font-extrabold tracking-wider text-slate-800 mb-2 select-none font-heading uppercase">
              SCHEDULE TEST CONFIGURATOR
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-6 select-none leading-none">
              Construct quizzes, configure timer limits, and map student attempts.
            </p>

            <form onSubmit={handleScheduleExamSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  label="Test Title Name *"
                  value={examForm.title}
                  onChange={e => setExamForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Database Systems Mid-Term"
                  required
                />

                <TextField
                  label="Duration Limit (Minutes) *"
                  type="number"
                  value={examForm.durationMinutes}
                  onChange={e => setExamForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                  placeholder="60"
                  required
                />

                <TextField
                  label="Start Datetime Window *"
                  type="datetime-local"
                  value={examForm.startTime}
                  onChange={e => setExamForm(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Target Batch Program</label>
                  <select
                    value={examForm.batchName}
                    onChange={e => setExamForm(prev => ({ ...prev, batchName: e.target.value }))}
                    className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                  >
                    <option value="iCD110 (Programming Fundamentals)">iCD110 (Programming Fundamentals)</option>
                    <option value="iCM111 (Database Management System)">iCM111 (Database Management System)</option>
                    <option value="iCD112 (Object Oriented Programming)">iCD112 (Object Oriented Programming)</option>
                    <option value="iCM113 (Internet Technologies)">iCM113 (Internet Technologies)</option>
                  </select>
                </div>

                <TextField
                  label="Test Venue *"
                  value={examForm.venue}
                  onChange={e => setExamForm(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="e.g. Lab 03 (Panadura Block)"
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Target Course Module (Filters Questions)</label>
                  <select
                    value={examForm.courseModule}
                    onChange={e => {
                      setExamForm(prev => ({ ...prev, courseModule: e.target.value }));
                      setSelectedQuestionIds([]); // clear selected questions when module changes
                    }}
                    className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                  >
                    <option value="Programming Fundamentals">Programming Fundamentals</option>
                    <option value="Database Management System">Database Management System</option>
                    <option value="Object Oriented Programming">Object Oriented Programming</option>
                  </select>
                </div>
              </div>

              {/* Questions selector based on module */}
              <div className="space-y-3">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700 select-none">
                  Select Questions from "{examForm.courseModule}" Module ({selectedQuestionIds.length} Selected)
                </label>

                {eligibleQuestions.length === 0 ? (
                  <p className="text-slate-450 text-xs italic bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    No questions available for this module in the Question Bank. Add questions first in the Question Bank tab.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {eligibleQuestions.map(q => {
                      const isChecked = selectedQuestionIds.includes(q.questionId);
                      return (
                        <div 
                          key={q.questionId}
                          onClick={() => handleToggleQuestionSelect(q.questionId)}
                          className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer select-none transition-all duration-150 ${
                            isChecked 
                              ? 'border-[#4F3FF0] bg-indigo-50/20' 
                              : 'border-[#E9EDF5] hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by div click
                            className="mt-1 h-4 w-4 accent-[#4F3FF0] cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="text-slate-800 font-bold text-xs leading-relaxed">{q.questionText}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">
                              MARKS: {q.marks} PTS | TEACHER: {q.createdBy}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  color="secondary" 
                  onClick={() => {
                    setSelectedQuestionIds([]);
                    setActiveTab('calendar');
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="solid" 
                  color="primary" 
                  isLoading={submitting}
                  disabled={selectedQuestionIds.length === 0}
                >
                  Publish & Schedule Test
                </Button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* --- ADD NEW QUESTION MODAL --- */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-slate-855 mb-4 font-heading">Add New Question</h3>
            
            <form onSubmit={handleCreateQuestionSubmit} className="space-y-4 font-sans">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Course Module Target</label>
                <select
                  value={questionForm.courseModule}
                  onChange={e => setQuestionForm(prev => ({ ...prev, courseModule: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                >
                  <option value="Programming Fundamentals">Programming Fundamentals</option>
                  <option value="Database Management System">Database Management System</option>
                  <option value="Object Oriented Programming">Object Oriented Programming</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Question Type</label>
                  <select
                    value={questionForm.questionType}
                    onChange={e => setQuestionForm(prev => ({ ...prev, questionType: e.target.value }))}
                    className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                  >
                    <option value="MCQ">MCQ (Multiple Choice)</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                  </select>
                </div>

                <TextField
                  label="Marks (Pts) *"
                  type="number"
                  value={questionForm.marks}
                  onChange={e => setQuestionForm(prev => ({ ...prev, marks: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Question Prompt *</label>
                <textarea
                  value={questionForm.questionText}
                  onChange={e => setQuestionForm(prev => ({ ...prev, questionText: e.target.value }))}
                  placeholder="Type the question content here..."
                  className="w-full pl-4 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-850 placeholder-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 min-h-[70px]"
                  required
                />
              </div>

              {/* Conditional options rendering for MCQ */}
              {questionForm.questionType === 'MCQ' ? (
                <div className="space-y-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider select-none">MCQ Choices Configurator</span>
                  
                  <TextField
                    label="Choice A *"
                    value={questionForm.option1}
                    onChange={e => setQuestionForm(prev => ({ ...prev, option1: e.target.value }))}
                    placeholder="Choice option A"
                    required={questionForm.questionType === 'MCQ'}
                  />
                  <TextField
                    label="Choice B *"
                    value={questionForm.option2}
                    onChange={e => setQuestionForm(prev => ({ ...prev, option2: e.target.value }))}
                    placeholder="Choice option B"
                    required={questionForm.questionType === 'MCQ'}
                  />
                  <TextField
                    label="Choice C"
                    value={questionForm.option3}
                    onChange={e => setQuestionForm(prev => ({ ...prev, option3: e.target.value }))}
                    placeholder="Choice option C (Optional)"
                  />
                  <TextField
                    label="Choice D"
                    value={questionForm.option4}
                    onChange={e => setQuestionForm(prev => ({ ...prev, option4: e.target.value }))}
                    placeholder="Choice option D (Optional)"
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Correct Choice Option</label>
                    <select
                      value={questionForm.correctAnswerOption}
                      onChange={e => setQuestionForm(prev => ({ ...prev, correctAnswerOption: e.target.value }))}
                      className="w-full pl-4 pr-10 py-3.5 bg-white border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                    >
                      <option value="1">Choice A</option>
                      <option value="2">Choice B</option>
                      {questionForm.option3 && <option value="3">Choice C</option>}
                      {questionForm.option4 && <option value="4">Choice D</option>}
                    </select>
                  </div>
                </div>
              ) : (
                <TextField
                  label="Correct Answer Prompt *"
                  value={questionForm.correctAnswerText}
                  onChange={e => setQuestionForm(prev => ({ ...prev, correctAnswerText: e.target.value }))}
                  placeholder="e.g. SQL is relational, NoSQL is non-relational."
                  required={questionForm.questionType === 'SHORT_ANSWER'}
                />
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Responsible Teacher</label>
                <select
                  value={questionForm.createdBy}
                  onChange={e => setQuestionForm(prev => ({ ...prev, createdBy: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                >
                  <option value="Mr. Kasun Jayasuriya">Mr. Kasun Jayasuriya</option>
                  <option value="Mrs. Kushani Withanage">Mrs. Kushani Withanage</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <Button type="button" variant="outline" color="secondary" onClick={() => setShowQuestionModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  Save Question
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Exams;
