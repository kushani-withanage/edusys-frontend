import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Clock, CheckCircle2, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { api } from '@/utils/api';
import { toast } from '@/utils/toast';

export const ExamTakingPage: React.FC = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [examState, setExamState] = useState<any | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timerRef = useRef<any>(null);
  const autosaveTimerRef = useRef<Record<string, any>>({});
  const lastInitExamId = useRef<string | null>(null);

  const initAttempt = async () => {
    if (lastInitExamId.current === examId) return;
    lastInitExamId.current = examId || null;
    try {
      setLoading(true);
      const res = await api.post<any>(`/api/v1/student-exams/${examId}/start`, {});
      setExamState(res);

      // Populate already saved answers
      const initialAnswers: Record<string, string[]> = {};
      res.questions.forEach((q: any) => {
        initialAnswers[q.id] = q.selectedOptionIds || [];
      });
      setAnswers(initialAnswers);

      // Calculate time left using server calculated remainingSeconds if available
      const deadline = new Date(res.deadline).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((deadline - now) / 1000));
      setTimeLeft(res.remainingSeconds !== undefined ? res.remainingSeconds : diff);
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Failed to start or resume exam attempt.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.message) errMsg = parsed.message;
      } catch {
        if (err.message) errMsg = err.message;
      }
      toast.error(errMsg);
      navigate('/student/academics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAttempt();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Clean up autosave timeouts on unmount
      Object.values(autosaveTimerRef.current).forEach(clearTimeout);
    };
  }, [examId]);

  // Prompt before leaving the page as a courtesy warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Your progress is saved — you can continue later.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (examState && timeLeft === 0) {
      handleAutoSubmit();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, examState]);

  const handleOptionSelect = (questionId: string, optionId: string, type: string) => {
    let newSelections: string[] = [];
    if (type === 'SINGLE_CHOICE') {
      newSelections = [optionId];
    } else {
      const current = answers[questionId] || [];
      newSelections = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
    }

    // Update local state instantly
    setAnswers(prev => ({
      ...prev,
      [questionId]: newSelections
    }));

    // Trigger saving feedback state
    setSavingStatus('saving');

    // Debounce autosave API call (600ms delay)
    if (autosaveTimerRef.current[questionId]) {
      clearTimeout(autosaveTimerRef.current[questionId]);
    }

    autosaveTimerRef.current[questionId] = setTimeout(async () => {
      try {
        await api.post(`/api/v1/student-exams/attempts/${examState.attemptId}/answer`, {
          questionId,
          selectedOptionIds: newSelections
        });
        setSavingStatus('saved');
      } catch (err) {
        console.error('Failed to autosave response', err);
        setSavingStatus('idle');
      }
    }, 600);
  };

  const handleAutoSubmit = async () => {
    if (!examState) return;
    toast.info('Time limit reached. Auto-submitting your attempt now...');
    try {
      await api.post<any>(`/api/v1/student-exams/attempts/${examState.attemptId}/submit`, {});
      toast.success('Exam submitted successfully!');
      navigate(`/student/exams/attempts/${examState.attemptId}/result`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to submit exam attempt.');
      navigate('/student/academics');
    }
  };

  const handleManualSubmit = () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = async () => {
    setShowSubmitModal(false);
    try {
      setLoading(true);
      await api.post<any>(`/api/v1/student-exams/attempts/${examState.attemptId}/submit`, {});
      toast.success('Exam submitted and graded successfully!');
      navigate(`/student/exams/attempts/${examState.attemptId}/result`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to submit exam attempt.');
      setLoading(false);
    }
  };

  // Format time remaining
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  if (loading || !examState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 bg-white border border-[#E9EDF5] rounded-3xl p-10 font-sans shadow-xs max-w-xl mx-auto mt-20">
        <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Syncing secure test session...</p>
      </div>
    );
  }

  const currentQuestion = examState.questions[activeQuestionIdx];
  const selectedOpts = answers[currentQuestion.id] || [];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 font-sans text-left flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">
      
      {/* Question container */}
      <div className="flex-1 space-y-5">
        
        {/* Resumed Attempt Banner */}
        {examState.resumed && (
          <div className="bg-amber-50 border border-amber-250 text-amber-850 p-4 rounded-3xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 select-none">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 animate-bounce" />
            <div>
              <p className="text-xs font-black text-amber-900 leading-none">Resuming Your Attempt</p>
              <p className="text-[10px] text-amber-700 font-bold mt-1">Your saved progress has been loaded. The timer continues from where you left off.</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-xs flex justify-between items-center">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 tracking-tight">{examState.title}</h2>
            <p className="text-[10px] text-slate-455 font-bold mt-0.5">Secure timed student test attempt</p>
          </div>
          
          <div className="flex items-center gap-3">
            {savingStatus === 'saving' && (
              <span className="text-[9.5px] font-bold text-amber-600 animate-pulse bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-100 flex items-center gap-1.5 select-none">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
            {savingStatus === 'saved' && (
              <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 flex items-center gap-1 select-none">
                ✓ Saved
              </span>
            )}
            
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl font-black text-sm select-none">
              <Clock className="h-4 w-4 animate-pulse" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-xs min-h-[300px] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black text-[#4F3FF0] uppercase tracking-wider">
                Question {activeQuestionIdx + 1} of {examState.questions.length}
              </span>
              <span className="text-[10px] font-bold text-slate-450 bg-slate-100 px-2.5 py-0.5 rounded uppercase">
                {currentQuestion.questionType === 'SINGLE_CHOICE' ? 'Single Choice' : 'Multiple Choice'}
              </span>
            </div>

            <p className="text-sm font-extrabold text-slate-800 tracking-tight leading-relaxed">
              {currentQuestion.questionText}
            </p>

            <div className="space-y-3">
              {currentQuestion.options.map((opt: any) => {
                const isSelected = selectedOpts.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3.5 p-3.5 border rounded-2xl cursor-pointer select-none transition-all ${
                      isSelected
                        ? 'bg-[#4F3FF0]/5 border-[#4F3FF0]'
                        : 'bg-white border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    <input
                      type={currentQuestion.questionType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                      name="taking-option"
                      checked={isSelected}
                      onChange={() => handleOptionSelect(currentQuestion.id, opt.id, currentQuestion.questionType)}
                      className="h-4.5 w-4.5 text-[#4F3FF0] focus:ring-[#4F3FF0]"
                    />
                    <span className="text-xs font-semibold text-slate-750">
                      {opt.optionText}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-8">
            <button
              onClick={() => setActiveQuestionIdx(prev => Math.max(0, prev - 1))}
              disabled={activeQuestionIdx === 0}
              className="px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            {activeQuestionIdx < examState.questions.length - 1 ? (
              <button
                onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1"
              >
                Next Question <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleManualSubmit}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-emerald-600/10 flex items-center gap-1.5 animate-pulse"
              >
                <CheckCircle2 className="h-4 w-4" /> Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar navigation */}
      <div className="w-full md:w-64 bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-xs shrink-0 self-start space-y-5">
        <div>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Question Navigator</h4>
          <p className="text-[9px] text-slate-400 font-bold mt-0.5">Click number to navigate quickly.</p>
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {examState.questions.map((q: any, idx: number) => {
            const isAnswered = (answers[q.id] || []).length > 0;
            const isActive = idx === activeQuestionIdx;
            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestionIdx(idx)}
                className={`h-9 w-9 text-xs font-black rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-[#4F3FF0] text-white ring-2 ring-[#4F3FF0]/20'
                    : isAnswered
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-slate-50 border border-slate-200/60 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2 text-[9.5px] font-bold text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 bg-[#4F3FF0] rounded-lg" />
            <span>Active Question</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 bg-emerald-50 border border-emerald-250 rounded-lg" />
            <span>Answered Question</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 bg-slate-50 border border-slate-200 rounded-lg" />
            <span>Unanswered Question</span>
          </div>
        </div>

        <button
          onClick={handleManualSubmit}
          className="w-full py-2.5 border border-dashed border-rose-350 hover:border-rose-500 hover:bg-rose-50/50 text-rose-600 hover:text-rose-700 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <AlertTriangle className="h-3.5 w-3.5" /> Early Finish
        </button>
      </div>

      {/* Custom Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E9EDF5] w-full max-w-md rounded-3xl shadow-xl p-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto h-12 w-12 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-amber-550">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                Finish & Submit Attempt?
              </h3>
              
              {(() => {
                const unansweredCount = examState.questions.filter((q: any) => (answers[q.id] || []).length === 0).length;
                return (
                  <div className="space-y-3">
                    {unansweredCount > 0 && (
                      <div className="bg-rose-50 border border-rose-250 rounded-2xl p-3 text-rose-700 text-xs font-bold leading-relaxed text-left flex gap-2.5 items-start">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          Warning: You have <strong className="font-extrabold">{unansweredCount}</strong> unanswered {unansweredCount === 1 ? 'question' : 'questions'}.
                        </span>
                      </div>
                    )}
                    <p className="text-slate-500 font-semibold text-xs leading-relaxed">
                      Are you sure you want to finish and submit your attempt? You cannot change your answers after submission.
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4.5 py-2.5 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-650 hover:text-slate-800 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
              >
                Cancel & Resume
              </button>
              <button
                onClick={confirmSubmit}
                className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
              >
                Yes, Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
