import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Loader2, Trash2, X, AlertCircle } from 'lucide-react';
import { batchService } from '@/services/batchService';
import { api } from '@/utils/api';
import { toast } from '@/utils/toast';
import type { Batch } from './types';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';

interface BatchesPlannerProps {
  addTrigger?: number;
}

export const BatchesPlanner: React.FC<BatchesPlannerProps> = ({ addTrigger = 0 }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [batchForm, setBatchForm] = useState({ batchName: '', startDate: '', endDate: '', status: 'Active' });
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState('');
  const checkTimeoutRef = useRef<any>(null);

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // Batch Detail modal state
  const [selectedDetailBatch, setSelectedDetailBatch] = useState<Batch | null>(null);
  const [detailCourses, setDetailCourses] = useState<any[]>([]);
  const [detailStudents, setDetailStudents] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  const fetchBatchesAndCourses = async () => {
    try {
      setLoading(true);
      const batchesData = await batchService.getBatches();
      setBatches(batchesData || []);
    } catch (err) {
      console.error('Error fetching batches:', err);
      toast.error('Failed to load batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchesAndCourses();
  }, []);

  // Listen to parent add action trigger
  useEffect(() => {
    if (addTrigger > 0) {
      setBatchForm({ batchName: '', startDate: '', endDate: '', status: 'Active' });
      setEditingBatchId(null);
      setInlineError('');
      setSelectedCourseIds([]);
      setShowBatchModal(true);
    }
  }, [addTrigger]);

  const filteredBatches = useMemo(() => {
    return batches.filter(b => 
      b.batchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.courses && b.courses.some(c => c.courseName.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  }, [batches, searchQuery]);

  const handleBatchNameChange = (val: string) => {
    setBatchForm(prev => ({ ...prev, batchName: val }));
    setInlineError('');

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (!val.trim()) return;

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const isTaken = await batchService.checkBatchCode(val.trim(), editingBatchId || undefined);
        if (isTaken) {
          setInlineError(`Batch code '${val.trim()}' is already taken.`);
        }
      } catch (err) {
        console.error('Error checking batch code:', err);
      }
    }, 500);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.batchName.trim()) return;

    const trimmedName = batchForm.batchName.trim().toLowerCase();
    const nameExists = batches.some(b => 
      (editingBatchId ? b.batchId !== editingBatchId : true) && 
      b.batchName.trim().toLowerCase() === trimmedName
    );

    if (nameExists) {
      toast.error("Batch already exists!");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        batchName: batchForm.batchName.trim(),
        startDate: batchForm.startDate,
        endDate: batchForm.endDate,
        status: batchForm.status || 'Active',
        courses: selectedCourseIds.map(id => ({ courseId: id }))
      };
      
      if (editingBatchId) {
        const updated = await batchService.updateBatch(editingBatchId, payload);
        setBatches(prev => prev.map(b => b.batchId === editingBatchId ? updated : b));
        toast.success('Batch details updated successfully!');
      } else {
        const created = await batchService.createBatch(payload);
        setBatches(prev => [...prev, created]);
        toast.success('Batch created successfully!');
      }
      setShowBatchModal(false);
      setBatchForm({ batchName: '', startDate: '', endDate: '', status: 'Active' });
      setEditingBatchId(null);
      setSelectedCourseIds([]);
      setInlineError('');
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Failed to save batch planner.';
      if (err.status === 409) {
        errMsg = err.message || `Batch code '${batchForm.batchName.trim()}' already exists.`;
      } else if (err.message) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.message) errMsg = parsed.message;
        } catch {
          errMsg = err.message;
        }
      }
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBatchClick = async (batch: Batch) => {
    setEditingBatchId(batch.batchId);
    setBatchForm({
      batchName: batch.batchName,
      startDate: batch.startDate || '',
      endDate: batch.endDate || '',
      status: batch.status || 'Active'
    });
    setInlineError('');
    
    try {
      const coursesData = await batchService.getBatchCourses(batch.batchId).catch(() => []);
      setSelectedCourseIds(coursesData.map((c: any) => c.courseId));
    } catch (e) {
      console.error(e);
      setSelectedCourseIds([]);
    }
    
    setShowBatchModal(true);
  };

  const handleViewBatchDetail = async (batch: Batch) => {
    setSelectedDetailBatch(batch);
    setLoadingDetail(true);
    try {
      const [coursesData, studentsData] = await Promise.all([
        batchService.getBatchCourses(batch.batchId).catch(() => []),
        api.get<any[]>(`/api/v1/batches/${batch.batchId}/students`).catch(() => [])
      ]);
      setDetailCourses(coursesData);
      setDetailStudents(studentsData);
    } catch (err) {
      console.error("Error loading batch details:", err);
      setDetailCourses([]);
      setDetailStudents([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
        <div className="relative w-full max-w-xl">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search batch code..."
            className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0]/60 focus:bg-white rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 font-medium"
          />
        </div>
      </div>

      {/* Batches Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-2xl shadow-sm">
          <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Loading batch schedule...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E9EDF5] rounded-2xl shadow-sm">
          <h3 className="font-bold text-slate-700">No batches found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map(batch => (
            <div 
              key={batch.batchId} 
              onClick={() => handleViewBatchDetail(batch)}
              className="bg-white border border-[#E9EDF5] rounded-2xl p-5 hover:shadow-md hover:border-slate-350 transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100/60">
                  <span className="font-black text-slate-800 text-base">
                    {batch.batchName}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-full ${
                    batch.status === 'Finished' 
                      ? 'bg-slate-50 text-slate-500 border-slate-200'
                      : batch.status === 'Pending'
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {batch.status}
                  </span>
                </div>

                <div className="space-y-2.5 mt-4 text-xs font-bold text-slate-650">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-100/60">
                    <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">Student Count</span>
                    <span className="text-slate-850 font-black text-xs">{batch.studentCount} students</span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b border-slate-100/60">
                    <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">Start Date</span>
                    <span className="text-slate-700">{batch.startDate}</span>
                  </div>
                  {batch.status === 'Finished' && (
                    <div className="flex justify-between items-center pb-1 border-b border-slate-100/60">
                      <span className="text-slate-450 font-extrabold text-[9px] uppercase tracking-wider">End Date</span>
                      <span className="text-slate-700">{batch.endDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100">
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditBatchClick(batch);
                  }}
                  className="text-[10px] font-black text-[#4F3FF0] hover:underline cursor-pointer select-none uppercase tracking-wider"
                >
                  Edit Details
                </span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingBatch(batch);
                    }}
                    className="p-1.5 hover:bg-rose-50 text-slate-450 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                    title="Delete Batch"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD/EDIT BATCH MODAL --- */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">
              {editingBatchId ? 'Edit Batch Planner' : 'Add Batch Planner'}
            </h3>
            <form onSubmit={handleSaveBatch} className="space-y-4 text-left font-sans">
              <div className="space-y-1">
                
                <TextField
                  label="Batch Code Name"
                  value={batchForm.batchName}
                  onChange={e => handleBatchNameChange(e.target.value)}
                  placeholder="iCD116"
                  required
                />
      
                {inlineError && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1 pl-1 flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="h-3 w-3 shrink-0" /> {inlineError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="Start Date"
                  type="date"
                  value={batchForm.startDate}
                  onChange={e => setBatchForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={batchForm.endDate}
                  onChange={e => setBatchForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Batch Status</label>
                <select
                  value={batchForm.status}
                  onChange={e => setBatchForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Finished">Finished</option>
                </select>
              </div>



              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  color="secondary" 
                  onClick={() => {
                    setShowBatchModal(false);
                    setEditingBatchId(null);
                    setInlineError('');
                  }} 
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  {editingBatchId ? 'Update Batch' : 'Save Batch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Batch Confirm Modal */}
      {deletingBatch && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 text-base">Delete Batch Planner</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Are you sure you want to delete batch <strong className="text-slate-700">"{deletingBatch.batchName}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBatch(null)}
                className="flex-1 px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const batchId = deletingBatch.batchId;
                  setDeletingBatch(null);
                  try {
                    setSubmitting(true);
                    await batchService.deleteBatch(batchId);
                    setBatches(prev => prev.filter(b => b.batchId !== batchId));
                    toast.success('Batch planner deleted successfully!');
                  } catch (err: any) {
                    console.error(err);
                    toast.error(err.message || 'Failed to delete batch planner.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-100"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BATCH DETAIL MODAL --- */}
      {selectedDetailBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 md:p-8 w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 text-left font-sans">
            <button
              onClick={() => setSelectedDetailBatch(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-full ${
                    selectedDetailBatch.status === 'Finished' 
                      ? 'bg-slate-50 text-slate-500 border-slate-200'
                      : selectedDetailBatch.status === 'Pending'
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {selectedDetailBatch.status}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  Batch Code: {selectedDetailBatch.batchName}
                </h3>
                <p className="text-slate-455 text-[11px] font-semibold">
                  Detailed profile planner, assigned modules, and student classroom roster.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/60 border border-slate-100 p-4 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Calendar Schedule</span>
                  <span className="text-xs font-bold text-slate-700 block">
                    Start: {selectedDetailBatch.startDate || 'N/A'}
                  </span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">
                    End: {selectedDetailBatch.endDate || 'Ongoing'}
                  </span>
                </div>
                <div className="bg-slate-50/60 border border-slate-100 p-4 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Current Roster</span>
                  <span className="text-sm font-black text-slate-800 block mt-1">
                    {selectedDetailBatch.studentCount || 0} <span className="text-xs font-extrabold text-slate-400">Students</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="block text-[10px] font-black tracking-wider uppercase text-slate-400">Assigned Courses & Modules</span>
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 text-[#4F3FF0] animate-spin" />
                  </div>
                ) : detailCourses.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4.5 text-center text-slate-450 text-xs font-bold">
                    No courses assigned yet
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {detailCourses.map((c: any) => (
                      <span
                        key={c.courseId}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50/60 text-[#4F3FF0] text-[10px] font-black uppercase tracking-wider rounded-full border border-indigo-100/50"
                      >
                        {c.courseName}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <span className="block text-[10px] font-black tracking-wider uppercase text-slate-400">Student Classroom Roster</span>
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 text-[#4F3FF0] animate-spin" />
                  </div>
                ) : detailStudents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-semibold bg-slate-50 border border-[#E9EDF5] rounded-2xl">
                    No students enrolled in this batch yet.
                  </div>
                ) : (
                  <div className="overflow-hidden border border-[#E9EDF5] rounded-2xl max-h-[180px] overflow-y-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[9px] font-extrabold tracking-wider uppercase">
                          <th className="px-4.5 py-3">Student Name</th>
                          <th className="px-4.5 py-3">Email Address</th>
                          <th className="px-4.5 py-3 text-right">Roster Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
                        {detailStudents.map((stu: any) => (
                          <tr key={stu.studentId} className="hover:bg-slate-50/30 transition-colors duration-150">
                            <td className="px-4.5 py-3 font-extrabold text-slate-800">{stu.fullName}</td>
                            <td className="px-4.5 py-3 text-slate-500 font-medium">{stu.email}</td>
                            <td className="px-4.5 py-3 text-right">
                              <span className="inline-flex items-center px-2 py-0.5 border border-emerald-250 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full select-none leading-none">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchesPlanner;
