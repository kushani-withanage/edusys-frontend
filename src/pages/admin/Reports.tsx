import React, { useState, useEffect } from 'react';
import { 
  Download,
  Award,
  Activity,
  Loader2
} from 'lucide-react';
import { api } from '@/utils/api';

interface MeritStudent {
  rank: number;
  fullName: string;
  batchCode: string;
  gpa: number;
  points: number;
}

interface AuditLog {
  time: string;
  user: string;
  action: string;
  module: string;
}

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'merit' | 'logs'>('merit');
  const [meritList, setMeritList] = useState<MeritStudent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [meritData, logsData] = await Promise.all([
          api.get<MeritStudent[]>('/api/v1/reports/merit-list'),
          api.get<AuditLog[]>('/api/v1/reports/audit-logs')
        ]);
        setMeritList(meritData || []);
        setAuditLogs(logsData || []);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportPDF = () => {
    alert('Generating institution performance PDF summary report. Download started!');
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-[18px] md:text-xl lg:text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
            Reports & Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Generate, evaluate, and export institution performance summaries.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={handleExportPDF}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm outline-none transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4 shrink-0" />
            Export PDF
          </button>
          <button 
            type="button"
            disabled 
            className="px-5 py-2.5 border border-[#E2E8F0] bg-[#F8FAFC] text-slate-450 text-xs font-bold rounded-xl cursor-not-allowed select-none font-sans flex items-center gap-2"
          >
            <Download className="h-4 w-4 shrink-0" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-2xl flex items-center gap-4 flex-wrap max-w-max select-none font-sans font-bold text-xs">
        <button
          onClick={() => setActiveTab('merit')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'merit'
              ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-sm font-extrabold'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Academic Merit List
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-white border border-[#E2E8F0] text-slate-800 shadow-sm font-extrabold'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Operations Log
        </button>
      </div>

      {/* Main Tab Content */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-3xl min-h-[300px]">
            <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
            <p className="text-slate-500 font-medium text-sm">Generating reports analytics...</p>
          </div>
        ) : (
          <>
            {/* --- TAB 1: ACADEMIC MERIT LIST --- */}
            {activeTab === 'merit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-200">
            
            {/* Standing merit list table */}
            <div className="lg:col-span-2 bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-4 select-none">
                <h3 className="text-sm font-extrabold text-slate-800 font-heading">
                  Academic Standing Merit List
                </h3>
                <Award className="h-5 w-5 text-amber-500" />
              </div>

              <div className="overflow-x-auto border border-[#E9EDF5] rounded-2xl overflow-hidden font-sans">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                      <th className="px-6 py-4">RANK</th>
                      <th className="px-6 py-4">STUDENT NAME</th>
                      <th className="px-6 py-4">BATCH CODE</th>
                      <th className="px-6 py-4">GPA MARK</th>
                      <th className="px-6 py-4">CAREER SCALE PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
                    {meritList.map(stu => (
                      <tr key={stu.rank} className="hover:bg-slate-50/20 transition-colors duration-150">
                        {/* Rank Badge */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full font-extrabold text-xs select-none ${
                            stu.rank === 1
                              ? 'bg-amber-50 border border-amber-300 text-amber-600'
                              : stu.rank === 2
                              ? 'bg-slate-50 border border-slate-300 text-slate-500'
                              : stu.rank === 3
                              ? 'bg-amber-50/30 border border-amber-600/30 text-amber-800'
                              : 'text-slate-400 font-semibold'
                          }`}>
                            {stu.rank}
                          </span>
                        </td>
                        
                        {/* Student Name */}
                        <td className="px-6 py-4 font-extrabold text-slate-800 text-sm">
                          {stu.fullName}
                        </td>
                        
                        {/* Batch Code */}
                        <td className="px-6 py-4 text-slate-400">
                          {stu.batchCode}
                        </td>
                        
                        {/* GPA */}
                        <td className="px-6 py-4 font-extrabold text-slate-850">
                          {stu.gpa.toFixed(2)}
                        </td>
                        
                        {/* Career scale pts */}
                        <td className="px-6 py-4 text-slate-800 font-extrabold">
                          +{stu.points} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GPA Graph side panel */}
            <div className="bg-white border border-[#E9EDF5] p-6 rounded-2xl shadow-sm space-y-5 select-none">
              <h3 className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                TOP RANK GPA GRAPH
              </h3>

              <div className="border border-[#E2E8F0] p-5 rounded-2xl space-y-4 font-sans text-xs font-extrabold">
                {meritList.map((stu, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-3">
                    <span className="w-16 text-slate-700 truncate">{stu.fullName.split(' ')[0]}</span>
                    
                    {/* Visual Progress bar */}
                    <div className="flex-1 h-6 bg-[#FAFAFA] rounded-md overflow-hidden relative border border-[#E2E8F0]">
                      <div 
                        className="h-full bg-[#4F3FF0] rounded-r-md transition-all duration-500"
                        style={{ width: `${(stu.gpa / 4.0) * 100}%` }}
                      />
                    </div>

                    <span className="w-8 text-slate-800 text-right">{stu.gpa.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* --- TAB 2: OPERATIONS LOG --- */}
        {activeTab === 'logs' && (
          <div className="bg-white border border-[#E9EDF5] p-6 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-4 select-none">
              <h3 className="text-sm font-extrabold text-slate-800 font-heading">
                Institution Audit Trail Log
              </h3>
              <Activity className="h-5 w-5 text-[#4F3FF0]" />
            </div>

            <div className="overflow-x-auto border border-[#E9EDF5] rounded-2xl overflow-hidden font-sans text-xs">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                    <th className="px-6 py-4">TIME</th>
                    <th className="px-6 py-4">USER</th>
                    <th className="px-6 py-4">ACTION DETAILS</th>
                    <th className="px-6 py-4 text-right">MODULE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9EDF5] text-slate-800 font-semibold">
                  {auditLogs.map((log, lIdx) => (
                    <tr key={lIdx} className="hover:bg-slate-50/20 transition-colors duration-150">
                      <td className="px-6 py-4.5 text-slate-400">
                        {log.time}
                      </td>
                      <td className="px-6 py-4.5 font-extrabold text-slate-800">
                        {log.user}
                      </td>
                      <td className="px-6 py-4.5 text-slate-655">
                        {log.action}
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 border border-slate-200 bg-slate-50 text-slate-500 font-bold rounded-md uppercase text-[9px] tracking-wide select-none leading-none">
                          {log.module}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </>
        )}
      </div>

    </div>
  );
};

export default Reports;
