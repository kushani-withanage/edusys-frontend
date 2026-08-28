import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  Upload, 
  X, 
  Edit2, 
  FileQuestion
} from 'lucide-react';
import { examService } from '@/services/examService';
import { api } from '@/utils/api';
import { toast } from '@/utils/toast';
import { QuestionForm } from './QuestionForm';

export const QuestionBankPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters state
  const [selectedCourseId, setSelectedCourseId] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const selectedStatus = 'ALL';
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesData, questionsData] = await Promise.all([
        api.get<any[]>('/api/v1/exam-courses'),
        examService.getQuestions()
      ]);
      setCourses(coursesData);
      setQuestions(questionsData);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load question bank data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrUpdate = async (payload: any) => {
    try {
      if (editingQuestion) {
        // Update question
        const res = await examService.updateQuestion(editingQuestion.id, payload);
        toast.success('Question updated successfully!');
        setQuestions(prev => prev.map(q => q.id === res.id ? res : q));
      } else {
        // Create question
        const res = await examService.createQuestion(payload);
        toast.success('Question added to bank successfully!');
        setQuestions(prev => [res, ...prev]);
      }
      setShowAddEditModal(false);
      setEditingQuestion(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save question.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }
    try {
      await examService.deleteQuestion(id);
      toast.success('Question deleted from bank successfully!');
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err: any) {
      console.error(err);
      toast.error('Cannot delete this question. It may be locked because it is attached to a published or completed exam.');
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      toast.error('CSV content cannot be empty.');
      return;
    }
    if (selectedCourseId === 'ALL') {
      toast.error('Please select a specific course module for this import.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await examService.importQuestions(selectedCourseId, 'usr0007', csvContent);
      toast.success(`Imported ${res.length} questions successfully!`);
      setQuestions(prev => [...res, ...prev]);
      setShowImportModal(false);
      setCsvContent('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to import CSV.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering questions
  const filteredQuestions = questions.filter(q => {
    const matchesCourse = selectedCourseId === 'ALL' || q.courseId === selectedCourseId;
    const matchesDifficulty = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;
    const matchesStatus = selectedStatus === 'ALL' || q.status === selectedStatus;
    const matchesSearch = !searchQuery.trim() || q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesDifficulty && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">MCQ Question Bank</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage and import questions grouped by syllabus modules.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 text-[10.5px] font-black rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Upload className="h-3.5 w-3.5" /> Bulk Import (CSV)
          </button>
          <button
            onClick={() => {
              setEditingQuestion(null);
              setShowAddEditModal(true);
            }}
            className="px-4 py-2 text-[10.5px] font-black rounded-xl bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#4F3FF0]/10"
          >
            <Plus className="h-3.5 w-3.5" /> Add Question
          </button>
        </div>
      </div>

      {/* Filters block */}
      <div className="bg-slate-50 p-4 border border-slate-200/60 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end shadow-xs">
        <div className="space-y-1">
          <span className="text-[9.5px] font-black text-slate-450 uppercase block">Search</span>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search question text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold bg-white text-slate-800"
            />
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[9.5px] font-black text-slate-450 uppercase block">Module</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-bold text-slate-700 bg-white"
          >
            <option value="ALL">All Modules</option>
            {courses.map(c => (
              <option key={c.courseId} value={c.courseId}>{c.courseName}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <span className="text-[9.5px] font-black text-slate-450 uppercase block">Difficulty</span>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-bold text-slate-700 bg-white"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>
        </div>
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-3xl shadow-xs">
          <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading question bank...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-3xl shadow-xs">
          <FileQuestion className="h-10 w-10 text-slate-300" />
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">No matching questions found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuestions.map((q) => {
            const course = courses.find(c => c.courseId === q.courseId);
            return (
              <div 
                key={q.id} 
                className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-xs hover:shadow-sm transition-all text-left flex flex-col md:flex-row justify-between items-start gap-4"
              >
                <div className="space-y-3.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9.5px] font-black uppercase tracking-wider">
                      {course?.courseName || 'General'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase ${
                      q.difficulty === 'EASY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      q.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {q.difficulty}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase ${
                      q.status === 'LOCKED' ? 'bg-slate-100 text-slate-600' : 'bg-[#EBF7EE] text-emerald-800'
                    }`}>
                      {q.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-extrabold">
                      Marks: {q.defaultMarks}
                    </span>
                  </div>

                  <p className="text-sm font-extrabold text-slate-800 tracking-tight leading-snug">{q.questionText}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold text-slate-650 pl-2 border-l-2 border-slate-200">
                    {q.options?.map((opt: any, oidx: number) => (
                      <div key={oidx} className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${opt.isCorrect ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={opt.isCorrect ? 'text-emerald-700 font-black' : ''}>
                          {opt.optionText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex md:flex-col items-center justify-end gap-2.5 w-full md:w-auto shrink-0 md:pt-1">
                  <button
                    onClick={() => {
                      setEditingQuestion(q);
                      setShowAddEditModal(true);
                    }}
                    className="flex-1 md:w-28 px-3.5 py-2 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-850 text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit Settings
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="flex-1 md:w-28 px-3.5 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-auto overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-6 text-left my-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  {editingQuestion ? 'Edit Question Bank Entry' : 'Add New Question to Bank'}
                </h3>
                <p className="text-[10px] text-slate-455 font-bold mt-0.5">Define MCQ question details and correct answers.</p>
              </div>
              <button 
                onClick={() => {
                  setShowAddEditModal(false);
                  setEditingQuestion(null);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <QuestionForm
              question={editingQuestion}
              onSave={handleCreateOrUpdate}
              onCancel={() => {
                setShowAddEditModal(false);
                setEditingQuestion(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Bulk Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-5 text-left animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">CSV Bulk Question Import</h3>
                <p className="text-[10px] text-slate-455 font-bold mt-0.5">Upload multiple MCQ questions in a single operation.</p>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setCsvContent('');
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleImportCsv} className="space-y-4">
              <div className="space-y-1">
                <span className="text-[9.5px] font-black text-slate-455 uppercase block">Target Syllabus Module</span>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-bold text-slate-700 bg-white"
                >
                  <option value="ALL">-- Select Module --</option>
                  {courses.map(c => (
                    <option key={c.courseId} value={c.courseId}>{c.courseName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">CSV Raw Data</label>
                  <span className="text-[9px] text-[#4F3FF0] font-black cursor-help" title="Format: question_text, question_type (SINGLE_CHOICE/MULTI_CHOICE), difficulty (EASY/MEDIUM/HARD), default_marks, options (pipe separated), correct_indices (comma/pipe separated 0-indexed)">
                    ❓ Check format guide
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder={`"What is Java?",SINGLE_CHOICE,EASY,5,"A language|An OS|A database",0\n"Which are JVM languages?",MULTI_CHOICE,MEDIUM,10,"Java|Kotlin|C++|Python","0|1"`}
                  className="w-full px-4 py-3 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold text-slate-800 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvContent('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-[#4F3FF0]/10 flex items-center justify-center gap-1.5"
                >
                  {submitting ? 'Importing...' : 'Perform Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
