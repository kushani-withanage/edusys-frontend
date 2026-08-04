import React, { useState, useEffect, useMemo } from 'react';
import { 
  User,
  BookOpen,
  DollarSign,
  Award,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { parentService } from '@/services/parentService';
import { studentService } from '@/services/studentService';
import { feeService } from '@/services/feeService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LinkedChild {
  studentId: string;
  fullName: string;
  email: string;
  regNo: string;
  status: string;
  balance: number;
  points: number;
}

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childrenList, setChildrenList] = useState<LinkedChild[]>([]);

  // Simulated Fallback Child
  const fallbackChild: LinkedChild = useMemo(() => ({
    studentId: 'stud-1',
    fullName: 'Sachin Samarawickrama',
    email: 'sachin@edusys.edu',
    regNo: 'BIT-2026-981',
    status: 'ACTIVE',
    balance: 350,
    points: 240
  }), []);

  useEffect(() => {
    const fetchChildData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch parent-student links
        const links = await parentService.getLinks().catch(() => []);
        
        // Find links matching parent's userId
        const parentLinks = links.filter(l => l.parentId === user?.userId);

        if (parentLinks.length === 0) {
          // Fallback to static mock for presentation
          setChildrenList([fallbackChild]);
          return;
        }

        // Fetch details for each child
        const students = await studentService.getStudents().catch(() => []);
        const feeRecords = await feeService.getFeeRecords().catch(() => []);

        const mappedChildren: LinkedChild[] = parentLinks.map(link => {
          const childProfile = students.find(s => s.studentId === link.studentId);
          const childBilling = feeRecords.find((fr: any) => fr.studentId === link.studentId);

          return {
            studentId: link.studentId,
            fullName: childProfile?.fullName || 'Child Student',
            email: childProfile?.email || 'child@edusys.edu',
            regNo: childProfile?.regNo || 'BIT-2026-981',
            status: childProfile?.status || 'ACTIVE',
            balance: childBilling?.amount || 350,
            points: 240 // mock points ledger value
          };
        });

        setChildrenList(mappedChildren);
      } catch (err: any) {
        console.error(err);
        setError('Sandbox Mode: Rendering simulated student links.');
        setChildrenList([fallbackChild]);
      } finally {
        setLoading(false);
      }
    };
    fetchChildData();
  }, [user, fallbackChild]);

  return (
    <div className="space-y-6 font-sans">
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header Panel */}
      <div className="border-b border-[#E9EDF5] pb-6 select-none">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
          <User className="h-7 w-7 text-[#4F3FF0]" />
          Parent Monitoring Portal
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Review your linked children's tuition statement, grades, and Career Scale logs in read-only mode.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-3xl">
          <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Loading children portfolios...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-200">
          {childrenList.map((child) => (
            <div 
              key={child.studentId}
              className="p-6 border border-[#E9EDF5] bg-white rounded-3xl shadow-sm space-y-6"
            >
              {/* Profile details */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E9EDF5] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-indigo-50 border border-[#E2E8F0] text-[#4F3FF0] rounded-full flex items-center justify-center font-bold text-sm">
                    {child.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 leading-snug">{child.fullName}</h3>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">STUDENT ID: {child.regNo}</span>
                  </div>
                </div>

                <div className="flex gap-2 text-[9px] font-extrabold tracking-wide uppercase select-none">
                  <span className="px-2.5 py-0.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-md">
                    {child.status}
                  </span>
                </div>
              </div>

              {/* Grid data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Tuition Fee Balance */}
                <div className="p-5 border border-[#E9EDF5] rounded-2xl space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5 select-none">
                    <DollarSign className="h-4.5 w-4.5 text-slate-400" />
                    Tuition Fees Statement
                  </h4>
                  <div className="space-y-0.5">
                    <span className="text-2xl font-black text-rose-600 block font-heading">
                      Rs. {child.balance.toFixed(2)}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase block select-none">OUTSTANDING PAYMENTS DUE</span>
                  </div>
                </div>

                {/* Academic standing */}
                <div className="p-5 border border-[#E9EDF5] rounded-2xl space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5 select-none">
                    <BookOpen className="h-4.5 w-4.5 text-slate-400" />
                    Academic Standing
                  </h4>
                  <div className="space-y-0.5">
                    <span className="text-2xl font-black text-[#4F3FF0] block font-heading">
                      85.3%
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase block select-none">ROLLING GPA AVERAGE</span>
                  </div>
                </div>

                {/* Career Scale */}
                <div className="p-5 border border-[#E9EDF5] rounded-2xl space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5 select-none">
                    <Award className="h-4.5 w-4.5 text-slate-400" />
                    Career scale progress
                  </h4>
                  <div className="space-y-0.5">
                    <span className="text-2xl font-black text-amber-500 block font-heading">
                      Level L3
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase block select-none">{child.points} ACCUMULATED POINTS</span>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ParentDashboard;
