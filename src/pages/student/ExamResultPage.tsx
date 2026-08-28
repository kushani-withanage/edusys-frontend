import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Check, X } from 'lucide-react';
import { api } from '@/utils/api';
import { toast } from '@/utils/toast';

export const ExamResultPage: React.FC = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await api.get<any>(`/api/v1/student-exams/attempts/${attemptId}/result`);
        setResult(res);
        if (res && res.examTitle && attemptId) {
          localStorage.setItem(`exam_title_${attemptId.toLowerCase()}`, res.examTitle);
          window.dispatchEvent(new Event('update-breadcrumbs'));
        }
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to retrieve exam attempt results.');
        navigate('/student/academics');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 bg-white border border-[#E9EDF5] rounded-3xl p-10 font-sans shadow-xs max-w-xl mx-auto mt-20">
        <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Retrieving graded exam sheet...</p>
      </div>
    );
  }

  const scorePct = result.maxMarks > 0 ? (result.score / result.maxMarks) * 100 : 0;
  const passed = scorePct >= 50.0;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 font-sans text-left max-w-4xl mx-auto pb-10 space-y-6">
      
      {/* Header Back Button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-600 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>

      {/* Score overview card */}
      <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-xs flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-3.5 flex-1 text-center md:text-left">
          <div>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9.5px] font-black uppercase tracking-wider">
              Graded Sheet Summary
            </span>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mt-1.5">{result.examTitle}</h2>
            {result.description && <p className="text-xs text-slate-455 mt-0.5 leading-relaxed">{result.description}</p>}
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-semibold text-slate-500 pt-1">
            <div>
              Started: <span className="text-slate-750 font-extrabold">{new Date(result.startedAt).toLocaleString()}</span>
            </div>
            <div>
              Completed: <span className="text-slate-750 font-extrabold">{new Date(result.submittedAt).toLocaleString()}</span>
            </div>
            <div>
              Status: <span className="text-slate-750 font-extrabold uppercase">{result.status}</span>
            </div>
          </div>
        </div>

        {/* Circular/Square grade highlight */}
        <div className="w-full md:w-56 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl shrink-0 flex flex-col items-center justify-center text-center space-y-3 self-stretch">
          <div>
            <span className="text-[9px] font-black text-slate-455 uppercase tracking-wider block">Awarded Score</span>
            <div className="text-3xl font-black text-[#4F3FF0] mt-0.5">
              {result.score} <span className="text-xs text-slate-400 font-bold">/ {result.maxMarks}</span>
            </div>
          </div>

          <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
            passed 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
              : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}>
            {passed ? 'Passed (Satisfactory)' : 'Failed (Needs Work)'}
          </span>
        </div>
      </div>

      {/* Student Attempt Summary Card */}
      <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-xs space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-2 select-none border-b border-slate-100 pb-3">
          Candidate & Performance Summary
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-left">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block select-none">Student Name</span>
            <span className="text-sm font-extrabold text-slate-800">{result.studentName || 'Unknown'}</span>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block select-none">Registration No</span>
            <span className="text-sm font-extrabold text-slate-800">{result.studentRegNo || 'N/A'}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block select-none">Time Spent</span>
            <span className="text-sm font-extrabold text-[#4F3FF0]">{result.spendTime || 'N/A'}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-455 uppercase block select-none">Correct Answers</span>
            <span className="inline-flex items-center gap-1 text-sm font-extrabold text-emerald-600">
              <Check className="h-4 w-4" /> {result.correctAnswersCount}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-455 uppercase block select-none">Wrong Answers</span>
            <span className="inline-flex items-center gap-1 text-sm font-extrabold text-rose-600">
              <X className="h-4 w-4" /> {result.wrongAnswersCount}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-455 uppercase block select-none">Total Questions</span>
            <span className="text-sm font-extrabold text-slate-700">{result.totalQuestionsCount}</span>
          </div>
        </div>
      </div>

      {/* Review details */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Detailed Response Analysis</h3>

        <div className="space-y-4">
          {result.questions.map((q: any, idx: number) => {
            return (
              <div 
                key={q.questionId}
                className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-xs space-y-4"
              >
                <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-[#4F3FF0] uppercase block">
                      Question {idx + 1}
                    </span>
                    <p className="text-sm font-extrabold text-slate-800 tracking-tight leading-snug">
                      {q.questionText}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                      q.isCorrect 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {q.isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {q.marksAwarded} / {q.marks} Pts
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {q.options.map((opt: any) => {
                    const isCorrectOption = !!opt.isCorrect;
                    const isStudentSelected = !!opt.isSelected;

                    let bgClass = 'bg-white border-slate-200';
                    let label = null;

                    if (isStudentSelected && isCorrectOption) {
                      bgClass = 'bg-emerald-50/60 border-emerald-300 text-emerald-800';
                      label = 'Correct & Selected';
                    } else if (isStudentSelected && !isCorrectOption) {
                      bgClass = 'bg-rose-50/60 border-rose-300 text-rose-800';
                      label = 'Incorrect Selection';
                    } else if (!isStudentSelected && isCorrectOption) {
                      bgClass = 'bg-white border-emerald-400 ring-2 ring-emerald-100 text-emerald-850';
                      label = 'Correct Option';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`flex justify-between items-center p-3 border rounded-xl text-xs font-semibold transition-all ${bgClass}`}
                      >
                        <span>{opt.optionText}</span>
                        {label && (
                          <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${
                            label.includes('Correct') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
