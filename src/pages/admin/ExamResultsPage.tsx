import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, BarChart2 } from 'lucide-react';
import { api } from '@/utils/api';
import { toast } from '@/utils/toast';

export const ExamResultsPage: React.FC = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get<any>(`/api/v1/exams/${examId}/analytics`);
        setData(res);
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to load exam analytics.');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [examId]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 bg-white border border-[#E9EDF5] rounded-3xl p-10 font-sans shadow-xs max-w-xl mx-auto mt-20">
        <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Aggregating secure class metrics...</p>
      </div>
    );
  }

  // Ranges count labels
  const rangeLabels = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
  const maxRangeCount = Math.max(1, ...data.ranges);

  return (
    <div className="space-y-6 font-sans text-left pb-10">
      
      {/* Header Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-600 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Back to List
          </button>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mt-3">{data.title} - Metrics Report</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Aggregated statistics, score distributions, and individual student response sheets.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            data.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            Exam Status: {data.status}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-xs">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Attempts</span>
          <span className="text-2xl font-black text-slate-850 mt-1 block">{data.totalAttempts}</span>
        </div>
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-xs">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Average Grade Score</span>
          <span className="text-2xl font-black text-[#4F3FF0] mt-1 block">{data.averageScore.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ {data.maxMarks}</span></span>
        </div>
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-xs">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Passing Rate</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{data.passRate.toFixed(1)}%</span>
        </div>
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-xs">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Maximum Marks</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{data.maxMarks} Pts</span>
        </div>
      </div>

      {/* Score distribution + Question correct rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Score Distribution Chart */}
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4 text-[#4F3FF0]" /> Grade Score Distribution
          </h3>
          <div className="space-y-3 pt-2">
            {data.ranges.map((count: number, idx: number) => {
              const percentage = (count / maxRangeCount) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-550">
                    <span>{rangeLabels[idx]}</span>
                    <span>{count} attempt{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${percentage}%` }}
                      className="bg-gradient-to-r from-[#4F3FF0] to-[#6366F1] h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question Correct-rate analysis */}
        <div className="bg-white border border-[#E9EDF5] p-5 rounded-3xl shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            💡 Question Success Rates
          </h3>
          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 pt-1.5 text-xs font-semibold text-slate-650">
            {data.questionStats.map((q: any) => (
              <div key={q.questionId} className="flex justify-between items-start gap-4 pb-2.5 border-b border-slate-100">
                <span className="truncate flex-1 font-bold text-slate-800" title={q.questionText}>{q.questionText}</span>
                <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-black ${
                  q.correctRate >= 70.0 ? 'bg-emerald-50 text-emerald-700' :
                  q.correctRate >= 40.0 ? 'bg-amber-50 text-amber-700' :
                  'bg-rose-50 text-rose-700'
                }`}>
                  {q.correctRate.toFixed(0)}% Correct
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Roster table */}
      <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-455">
          Student Attendance & Grades List
        </h3>
        
        <div className="overflow-x-auto border border-[#E9EDF5] rounded-2xl overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-455 text-[9.5px] font-black tracking-wider uppercase">
                <th className="px-6 py-4">STUDENT NAME</th>
                <th className="px-6 py-4">EMAIL ADDRESS</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4">SUBMITTED TIME</th>
                <th className="px-6 py-4">SCORE</th>
                <th className="px-6 py-4 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EDF5] text-slate-850 text-xs font-semibold">
              {data.attempts.map((attempt: any) => (
                <tr key={attempt.attemptId} className="hover:bg-slate-50/20 transition-colors duration-150">
                  <td className="px-6 py-4 font-extrabold text-slate-800">
                    {attempt.studentName}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {attempt.studentEmail}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 border rounded-md text-[8.5px] font-black uppercase ${
                      attempt.status === 'AUTO_SUBMITTED' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-250 text-emerald-800'
                    }`}>
                      {attempt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-450">
                    {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-slate-800">
                    {attempt.score} / {data.maxMarks}
                  </td>
                  <td className="px-6 py-4 text-right select-none">
                    <span 
                      onClick={() => navigate(`../exams/attempts/${attempt.attemptId}/result`)}
                      className={`inline-flex px-2.5 py-1 border rounded-xl text-[8.5px] font-black uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm ${
                        attempt.score >= (data.passMarks || 40)
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-800 hover:bg-emerald-100/60 shadow-emerald-50'
                          : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/60 shadow-rose-50'
                      }`}
                      title="Click to view student sheet"
                    >
                      {attempt.score >= (data.passMarks || 40) ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
              {data.attempts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-450 text-xs font-bold select-none bg-slate-50/30">
                    No submissions or attempts recorded for this exam yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
