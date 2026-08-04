import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Download,
  Lock,
  Play
} from 'lucide-react';
import { examService } from '@/services/examService';
import { materialService } from '@/services/materialService';
import { useAuth } from '@/hooks/useAuth';

export const StudentAcademics: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'exams' | 'materials'>('courses');

  // Load custom granted courses
  const grantedCourses = useMemo(() => {
    if (!user?.email) return [];
    const userKey = user.email.toLowerCase();
    
    const storedGrants = localStorage.getItem('course_access_grants');
    if (!storedGrants) return [];
    
    const allGrants = JSON.parse(storedGrants);
    return allGrants.filter((g: any) => g.userIdentifier.toLowerCase() === userKey);
  }, [user]);

  // Data states
  const [materials, setMaterials] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  // Quiz Modal States
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  // Simulated static lists matching Figure 3.15, 3.16, 3.17
  const enrolledModules = [
    { code: 'ICD110', name: 'Advanced Software Engineering', instructor: 'Mrs. Kushani Withanage' }
  ];


  const staticMaterials = [
    { id: 'mat-1', title: 'Git branching structures roadmap.pdf', batchCode: 'ICD110', type: 'PDF' }
  ];

  const staticExams = [
    { id: 'exam-1', title: 'Git & Version Control Quiz', datetime: 'Available Now', duration: 15, status: 'Available', questions: [
      { id: 'q-1', text: 'Which command merges changes from a branch?', options: ['git merge', 'git pull', 'git checkout', 'git commit'], correct: 'git merge', marks: 10 }
    ]},
    { id: 'exam-2', title: 'Software Design Patterns Term Final', datetime: 'August 20th 09:00 AM', duration: 60, status: 'Upcoming', questions: [] }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsData, examsData] = await Promise.all([
          materialService.getMaterials().catch(() => []),
          examService.getExams().catch(() => [])
        ]);

        setMaterials(materialsData.length > 0 ? materialsData : staticMaterials);
        setExams(examsData.length > 0 ? examsData : staticExams);
      } catch (err) {
        console.error('Simulating sandbox course assets');
        setMaterials(staticMaterials);
        setExams(staticExams);
      }
    };
    fetchData();
  }, []);


  const handleDownloadMaterial = (title: string) => {
    alert(`Initiating download for: ${title}`);
  };

  // --- Quiz handlers ---
  const handleStartQuiz = (exam: any) => {
    setActiveExam(exam);
    setSelectedAnswers({});
    setShowQuizModal(true);
  };

  const handleOptionSelect = (qId: string, option: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: option
    }));
  };

  const handleSubmitQuiz = () => {
    if (!activeExam) return;
    
    let score = 0;
    activeExam.questions.forEach((q: any) => {
      if (selectedAnswers[q.id] === q.correct) {
        score += q.marks;
      }
    });

    alert(`Quiz completed! You scored ${score} marks.`);
    setShowQuizModal(false);
  };

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
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'materials'
              ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-sm font-extrabold'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Course Materials
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
                {enrolledModules.map(mod => (
                  <Link 
                    key={mod.code}
                    to={`/student/courses/${mod.code}`}
                    className="bg-white border border-[#E9EDF5] hover:border-[#4F3FF0]/40 hover:bg-[#4F3FF0]/5 hover:shadow-md p-6 rounded-2xl shadow-sm transition-all block cursor-pointer text-left"
                  >
                    <h4 className="font-extrabold text-slate-800 text-base hover:text-[#4F3FF0] transition-colors">{mod.name}</h4>
                    <span className="text-[10px] font-extrabold text-[#4F3FF0] mt-1.5 block">{mod.code}</span>
                    <p className="text-xs font-semibold text-slate-450 mt-2">Instructor: {mod.instructor}</p>
                  </Link>
                ))}

                {grantedCourses.map((grant: any) => (
                  <Link 
                    key={grant.id}
                    to={`/student/courses/${grant.courseId}`}
                    className="bg-white border border-[#E9EDF5] hover:border-[#4F3FF0]/40 hover:bg-[#4F3FF0]/5 hover:shadow-md p-6 rounded-2xl shadow-sm transition-all block cursor-pointer text-left animate-in fade-in duration-200"
                  >
                    <h4 className="font-extrabold text-slate-800 text-base hover:text-[#4F3FF0] transition-colors">{grant.courseName}</h4>
                    <span className="text-[10px] font-extrabold text-[#4F3FF0] mt-1.5 block">{grant.batchCode}</span>
                    <p className="text-xs font-semibold text-slate-450 mt-2">Instructor: Academic Faculty</p>
                  </Link>
                ))}
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
                  <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                    <th className="px-6 py-4">EXAM MODULE</th>
                    <th className="px-6 py-4">SCHEDULE DATETIME</th>
                    <th className="px-6 py-4">DURATION</th>
                    <th className="px-6 py-4">STATUS</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9EDF5] text-slate-850 text-xs font-semibold">
                  {exams.map(exam => {
                    const isAvailable = exam.status === 'Available' || exam.status === 'ACTIVE';
                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/20 transition-colors duration-150">
                        <td className="px-6 py-4.5 font-extrabold text-slate-800">
                          {exam.title}
                        </td>
                        <td className="px-6 py-4.5 text-slate-450">
                          {exam.datetime || 'Anytime'}
                        </td>
                        <td className="px-6 py-4.5">
                          {exam.duration} Mins
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`inline-flex px-2.5 py-0.5 border rounded-md text-[9px] font-bold tracking-wider uppercase leading-none ${
                            isAvailable
                              ? 'bg-amber-50 border-amber-250 text-amber-700'
                              : 'bg-slate-50 border-slate-200 text-slate-450'
                          }`}>
                            {exam.status}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          {isAvailable ? (
                            <button
                              onClick={() => handleStartQuiz(exam)}
                              className="px-4 py-2 bg-[#4F3FF0] hover:bg-[#4335D6] text-white text-[10px] font-extrabold rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Play className="h-3 w-3 shrink-0" />
                              Start Test
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-2 text-slate-400 bg-slate-50 border border-[#E2E8F0] rounded-xl text-[10px] font-bold select-none cursor-not-allowed">
                              <Lock className="h-3 w-3" />
                              Locked
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COURSE MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 select-none">
              Syllabus & Learning Materials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {materials.map(mat => (
                <div 
                  key={mat.id}
                  className="p-5 border border-[#E9EDF5] rounded-2xl flex items-center justify-between gap-4 hover:border-slate-350 transition-all select-none"
                >
                  <div className="space-y-1.5 truncate">
                    <span className="inline-flex px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[8px] font-extrabold uppercase leading-none">
                      {mat.type || 'PDF'}
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-xs truncate" title={mat.title}>{mat.title}</h4>
                    <span className="text-[8px] font-bold text-slate-400 block tracking-wide uppercase leading-none mt-1">BATCH CODE: {mat.batchCode}</span>
                  </div>
                  <button
                    onClick={() => handleDownloadMaterial(mat.title)}
                    className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl cursor-pointer"
                  >
                    <Download className="h-4.5 w-4.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* QUIZ ATTEMPT MODAL */}
      {showQuizModal && activeExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E9EDF5] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 font-heading">
                {activeExam.title}
              </h3>
              <span className="text-[10px] font-bold text-[#4F3FF0] bg-indigo-50 px-2 py-0.5 rounded">
                {activeExam.duration} MINS
              </span>
            </div>

            <div className="space-y-6 py-2">
              {activeExam.questions.map((q: any) => (
                <div key={q.id} className="space-y-3">
                  <p className="text-sm font-extrabold text-slate-800 leading-relaxed">{q.text}</p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt: string) => {
                      const isSelected = selectedAnswers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleOptionSelect(q.id, opt)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[#4F3FF0]/10 border-[#4F3FF0] text-[#4F3FF0]' 
                              : 'bg-white border-[#E2E8F0] hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowQuizModal(false)}
                className="px-5 py-2.5 border border-[#E2E8F0] text-slate-500 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitQuiz}
                className="px-5 py-2.5 bg-[#4F3FF0] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentAcademics;
