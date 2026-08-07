import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Search, 
  Plus, 
  Trash2, 
  FileQuestion,
  Users,
  Settings,
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '@/utils/api';
import { examService } from '@/services/examService';
import { toast } from '@/utils/toast';

export const ExamBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams();

  // Steps
  const [step, setStep] = useState(1);
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

  // Lists
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [moduleQuestions, setModuleQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  
  // Step 2: Question picking
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');

  // Step 3: Audience targets
  const [targetType, setTargetType] = useState<'BATCH' | 'MODULE'>('BATCH');
  const [targetId, setTargetId] = useState('');
  const [audiences, setAudiences] = useState<any[]>([]);

  // Step 4: Settings
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [startTime, setStartTime] = useState(() => {
    const date = new Date();
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [endTime, setEndTime] = useState(() => {
    const date = new Date(Date.now() + 86400000); // 24 hours later
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [attemptsAllowed, setAttemptsAllowed] = useState('1');

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [coursesData, batchesData] = await Promise.all([
          api.get<any[]>('/api/v1/courses'),
          api.get<any[]>('/api/v1/batches')
        ]);
        
        const validCourses = Array.isArray(coursesData) ? coursesData : [];
        const validBatches = Array.isArray(batchesData) ? batchesData : [];
        
        setCourses(validCourses);
        setBatches(validBatches);

        if (validCourses.length > 0) {
          setCourseId(validCourses[0].courseId);
          setTargetId(validBatches.length > 0 ? validBatches[0].batchId : validCourses[0].courseId);
        }

        if (examId) {
          // Load exam for edit
          const exam = await examService.getById(examId);
          if (exam) {
            setTitle(exam.title || '');
            setDescription(exam.description || '');
            setCourseId(exam.courseId || '');
            setSelectedQuestionIds(exam.questionIds || []);
            setAudiences(exam.audiences || []);
            setDurationMinutes(exam.durationMinutes?.toString() || '60');
            setStartTime(exam.startTime?.substring(0, 16) || '');
            setEndTime(exam.endTime?.substring(0, 16) || '');
            setShuffleQuestions(!!exam.shuffleQuestions);
            setShuffleOptions(!!exam.shuffleOptions);
            setAttemptsAllowed(exam.attemptsAllowed?.toString() || '1');
          }
        }
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to initialize builder data.');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [examId]);

  // Load questions when course changes
  useEffect(() => {
    if (courseId) {
      examService.getQuestions({ courseId })
        .then(data => setModuleQuestions(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error('Failed to fetch questions for course', err);
          setModuleQuestions([]);
        });
    } else {
      setModuleQuestions([]);
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-3xl shadow-xs">
        <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading builder...</p>
      </div>
    );
  }

  const handleAddAudience = () => {
    if (!targetId) {
      toast.error('Please select a valid audience target.');
      return;
    }

    const isDuplicate = audiences.some(
      a => a.targetType === targetType && a.targetId === targetId
    );

    if (isDuplicate) {
      toast.error('This target has already been added.');
      return;
    }

    setAudiences(prev => [
      ...prev,
      { targetType, targetId }
    ]);
  };

  const handleRemoveAudience = (idx: number) => {
    setAudiences(prev => prev.filter((_, i) => i !== idx));
  };

  const handleToggleQuestion = (id: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleSaveDraft = (shouldPublish: boolean = false) => {
    const durationVal = parseInt(durationMinutes);
    const attemptsVal = parseInt(attemptsAllowed);

    if (!title.trim()) {
      toast.error('Exam title is required.');
      return;
    }
    if (isNaN(durationVal) || durationVal <= 0) {
      toast.error('Please enter a valid duration.');
      return;
    }
    if (isNaN(attemptsVal) || attemptsVal <= 0) {
      toast.error('Please specify allowed attempts.');
      return;
    }
    if (!startTime || !endTime) {
      toast.error('Please configure active window dates.');
      return;
    }

    const payload = {
      title,
      description,
      courseId: courseId || null,
      startTime,
      endTime,
      durationMinutes: durationVal,
      shuffleQuestions,
      shuffleOptions,
      attemptsAllowed: attemptsVal,
      audiences,
      questionIds: selectedQuestionIds,
      createdBy: 'usr0007' // Logged in user ID (admin)
    };

    const performSave = async () => {
      setLoading(true);
      try {
        let savedExamId = examId;
        if (examId) {
          await api.put(`/api/v1/exams/${examId}`, payload);
        } else {
          const created = await api.post<any>('/api/v1/exams', payload);
          savedExamId = created.id;
        }

        if (shouldPublish && savedExamId) {
          await api.post(`/api/v1/exams/${savedExamId}/publish`, {});
          toast.success('Exam published successfully!');
          alert('Exam published successfully!');
        } else {
          toast.success(examId ? 'Exam draft updated successfully!' : 'Exam draft created successfully!');
          alert(examId ? 'Exam draft updated successfully!' : 'Exam draft created successfully!');
        }
        navigate('/admin/exams');
      } catch (err: any) {
        console.error(err);
        const errMsg = err.message || 'Failed to save exam.';
        toast.error(errMsg);
        alert(errMsg);
      } finally {
        setLoading(false);
      }
    };

    if (shouldPublish) {
      setConfirmModal({
        isOpen: true,
        title: 'Publish Exam',
        message: 'Are you sure you want to publish this exam? Once published, all attached questions will be LOCKED and cannot be edited. This action cannot be undone.',
        confirmText: 'Publish',
        onConfirm: performSave
      });
    } else {
      performSave();
    }
  };

  const safeModuleQuestions = Array.isArray(moduleQuestions) ? moduleQuestions : [];
  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeBatches = Array.isArray(batches) ? batches : [];

  const selectedQuestions = safeModuleQuestions.filter(q => q && q.id && selectedQuestionIds.includes(q.id));
  const totalMarks = selectedQuestions.reduce((sum, q) => sum + (q.defaultMarks || 0), 0);

  const getTargetName = (type: string, id: string) => {
    if (type === 'BATCH') {
      return safeBatches.find(b => b && b.batchId === id)?.batchName || 'Unknown Batch';
    } else {
      return safeCourses.find(c => c && c.courseId === id)?.courseName || 'Unknown Module';
    }
  };

  // Filtered module questions
  const filteredQuestions = safeModuleQuestions.filter(q => 
    q && q.questionText && (
      !questionSearchQuery.trim() || 
      q.questionText.toLowerCase().includes(questionSearchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 font-sans text-left max-w-4xl mx-auto pb-10">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Exam Builder Wizard</h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">Design customized MCQ exams for batch registrations or module targets.</p>
      </div>

      {/* Steps indicator */}
      <div className="grid grid-cols-5 border border-slate-200/60 bg-slate-50/70 p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-400 text-center gap-2">
        {[
          { icon: Info, title: 'Details' },
          { icon: FileQuestion, title: 'Questions' },
          { icon: Users, title: 'Audience' },
          { icon: Settings, title: 'Settings' },
          { icon: Check, title: 'Review' }
        ].map((s, idx) => (
          <div key={idx} className={`flex flex-col items-center gap-1.5 ${step === idx + 1 ? 'text-[#4F3FF0]' : ''}`}>
            <s.icon className={`h-4.5 w-4.5 ${step === idx + 1 ? 'stroke-2' : ''}`} />
            <span>{s.title}</span>
          </div>
        ))}
      </div>

      {/* Content box */}
      <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-xs">
        
        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Step 1: Exam General Details</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Exam Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter exam title (e.g. MCQ Quiz - Java Fundamentals)"
                className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Description / Instructions</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter instructions for students (e.g. Read questions carefully. Strictly 1 attempt allowed.)"
                className="w-full px-4 py-3 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Syllabus Module Link</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-bold text-slate-700 bg-white"
              >
                {courses.map(c => (
                  <option key={c.courseId} value={c.courseId}>{c.courseName}</option>
                ))}
              </select>
              <span className="text-[9.5px] font-bold text-slate-400">Questions will be filtered based on the linked syllabus module.</span>
            </div>
          </div>
        )}

        {/* Step 2: Question Selection */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in-50 duration-150 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Step 2: Choose MCQ Questions</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions by text..."
                  value={questionSearchQuery}
                  onChange={(e) => setQuestionSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold bg-white text-slate-800"
                />
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase">
                  No questions found in this module. Go to Question Bank to add some.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                  {filteredQuestions.map(q => (
                    <label 
                      key={q.id}
                      className={`flex gap-3.5 p-3.5 border rounded-2xl cursor-pointer select-none transition-all ${
                        selectedQuestionIds.includes(q.id)
                          ? 'bg-[#4F3FF0]/5 border-[#4F3FF0]'
                          : 'bg-white border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.includes(q.id)}
                        onChange={() => handleToggleQuestion(q.id)}
                        className="mt-0.5 h-4 w-4 rounded text-[#4F3FF0] focus:ring-[#4F3FF0]"
                      />
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-slate-800 leading-snug">{q.questionText}</p>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                          <span className={
                            q.difficulty === 'EASY' ? 'text-emerald-600' :
                            q.difficulty === 'MEDIUM' ? 'text-amber-600' :
                            'text-rose-600'
                          }>{q.difficulty}</span>
                          <span>•</span>
                          <span>Marks: {q.defaultMarks}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar selection pane */}
            <div className="w-full md:w-64 bg-slate-50 p-4 border border-slate-200/60 rounded-2xl shrink-0 space-y-4 self-start">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Selection Summary</h4>
              <div className="space-y-2 text-xs font-bold text-slate-650">
                <div className="flex justify-between">
                  <span>Questions:</span>
                  <span className="text-slate-800 font-extrabold">{selectedQuestionIds.length} Selected</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/80 pt-2">
                  <span>Total Marks:</span>
                  <span className="text-[#4F3FF0] font-black">{totalMarks} Points</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Audience Selector */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in-50 duration-150">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Step 3: Target Audiences</h3>
            
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-slate-500 uppercase block">Audience Scope</label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    const newType = e.target.value as 'BATCH' | 'MODULE';
                    setTargetType(newType);
                    setTargetId(newType === 'BATCH' ? (batches[0]?.batchId || '') : (courses[0]?.courseId || ''));
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-bold text-slate-700 bg-white"
                >
                  <option value="BATCH">Batch Audience</option>
                  <option value="MODULE">Module (Course) Access</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-slate-500 uppercase block">Select Target</label>
                {targetType === 'BATCH' ? (
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-bold text-slate-700 bg-white"
                  >
                    {batches.map(b => (
                      <option key={b.batchId} value={b.batchId}>{b.batchName}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-bold text-slate-700 bg-white"
                  >
                    {courses.map(c => (
                      <option key={c.courseId} value={c.courseId}>{c.courseName}</option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddAudience}
                className="px-4 py-2 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Audience Target
              </button>
            </div>

            {/* List of current audiences */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Assigned Targets List</h4>
              {audiences.length === 0 ? (
                <p className="text-slate-400 font-bold text-xs italic">No target audiences assigned yet. Please add at least one.</p>
              ) : (
                <div className="space-y-2 max-w-xl">
                  {audiences.map((aud, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase ${
                          aud.targetType === 'BATCH' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {aud.targetType}
                        </span>
                        <span className="text-xs font-extrabold text-slate-750">
                          {getTargetName(aud.targetType, aud.targetId)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAudience(idx)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Settings */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Step 4: Exam Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Duration (Minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold text-slate-800"
                  placeholder="e.g. 60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Attempts Allowed</label>
                <input
                  type="number"
                  value={attemptsAllowed}
                  onChange={(e) => setAttemptsAllowed(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold text-slate-800"
                  placeholder="e.g. 1"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Opening Time (Active Window)</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Closing Time (Active Window)</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-3.5 p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="h-4 w-4 rounded text-[#4F3FF0] focus:ring-[#4F3FF0]"
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-slate-800">Shuffle Questions</p>
                  <p className="text-[9.5px] font-bold text-slate-400">Questions are rendered in a different random order for each student attempt.</p>
                </div>
              </label>

              <label className="flex items-center gap-3.5 p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="h-4 w-4 rounded text-[#4F3FF0] focus:ring-[#4F3FF0]"
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-slate-800">Shuffle Options</p>
                  <p className="text-[9.5px] font-bold text-slate-400">Option values are randomly shuffled for each student question attempt.</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Final Review */}
        {step === 5 && (
          <div className="space-y-5 animate-in fade-in-50 duration-150 text-left">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Step 5: Review & Save Draft</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold text-slate-650">
              <div className="space-y-3">
                <div>
                  <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block font-black">Exam Title</span>
                  <span className="text-slate-800 text-sm font-extrabold mt-0.5 block">{title}</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block font-black">Description</span>
                  <p className="text-slate-750 mt-0.5 leading-relaxed">{description || 'No description provided.'}</p>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 uppercase tracking-wider block font-black">Active Window</span>
                  <span className="text-slate-850 font-extrabold mt-0.5 block">
                    {new Date(startTime).toLocaleString()} - {new Date(endTime).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 border border-slate-200/60 rounded-2xl">
                <div>
                  <span className="text-[9.5px] text-slate-450 uppercase tracking-wider block font-black">Linked Course</span>
                  <span className="text-slate-800 font-extrabold block mt-0.5">
                    {safeCourses.find(c => c && c.courseId === courseId)?.courseName || 'None'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/80 pt-2.5">
                  <span>Questions selected:</span>
                  <span className="text-slate-800 font-extrabold">{selectedQuestionIds.length}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
                  <span>Total Exam Marks:</span>
                  <span className="text-[#4F3FF0] font-black">{totalMarks} Points</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
                  <span>Duration limit:</span>
                  <span className="text-slate-800 font-extrabold">{durationMinutes} Minutes</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
                  <span>Shuffle enabled:</span>
                  <span className="text-slate-800 font-extrabold">
                    {shuffleQuestions ? 'Questions ' : ''}
                    {shuffleOptions ? 'Options ' : ''}
                    {!shuffleQuestions && !shuffleOptions ? 'None' : ''}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
                  <span>Audience count:</span>
                  <span className="text-slate-850 font-extrabold">{audiences.length} Target scopes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer buttons block */}
        <div className="flex gap-4 border-t border-slate-100 pt-6 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(prev => prev - 1)}
              className="px-4 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}

          <div className="flex-1" />

          {step < 5 ? (
            <button
              onClick={() => {
                if (step === 1 && !title.trim()) {
                  toast.error('Exam title is required.');
                  return;
                }
                if (step === 2 && selectedQuestionIds.length === 0) {
                  toast.error('Please pick at least one question.');
                  return;
                }
                if (step === 3 && audiences.length === 0) {
                  toast.error('Please add at least one audience target.');
                  return;
                }
                setStep(prev => prev + 1);
              }}
              className="px-5 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-[#4F3FF0]/10 flex items-center gap-1"
            >
              Next Step <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSaveDraft(false)}
                className="px-4 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-650 hover:text-slate-800 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveDraft(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-emerald-600/10 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" /> Publish Exam
              </button>
            </div>
          )}
        </div>

      </div>
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
