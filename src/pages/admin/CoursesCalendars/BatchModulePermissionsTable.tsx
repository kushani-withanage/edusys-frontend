import React, { useState, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import type { BatchModulePermissionsTableProps } from './types';

export const BatchModulePermissionsTable: React.FC<BatchModulePermissionsTableProps> = ({
  permissions,
  courses,
  onRevoke
}) => {
  const [filterCourseId, setFilterCourseId] = useState('All');

  const filteredPermissions = useMemo(() => {
    if (filterCourseId === 'All') return permissions;
    return permissions.filter(p => p.courseId === filterCourseId);
  }, [permissions, filterCourseId]);

  return (
    <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
            Batch-wise Permissions Matrix
          </h3>
          <p className="text-slate-500 text-[10px] font-medium mt-0.5">
            Active permissions mapped by batch and course module.
          </p>
        </div>
        
        {/* Course Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase select-none">Filter Module:</span>
          <select
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#4F3FF0] cursor-pointer"
          >
            <option value="All">All Modules</option>
            {courses.map(c => (
              <option key={c.courseId} value={c.courseId}>{c.courseName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-bold tracking-wider uppercase">
              <th className="px-6 py-4">Course Module</th>
              <th className="px-6 py-4">Batch</th>
              <th className="px-6 py-4">Access Type</th>
              <th className="px-6 py-4">Students Linked</th>
              <th className="px-6 py-4">Date Granted</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
            {filteredPermissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400 font-bold uppercase tracking-wider">
                  No active permissions found
                </td>
              </tr>
            ) : (
              filteredPermissions.map((row, idx) => (
                <tr key={`${row.courseId}-${row.batchId}-${row.accessType}-${idx}`} className="hover:bg-slate-50/40 transition-colors duration-150">
                  <td className="px-6 py-4 font-extrabold text-slate-800">
                    {row.courseName}
                  </td>
                  <td className="px-6 py-4 text-slate-650">
                    {row.batchName}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-full ${
                      row.accessType === 'Standard' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-indigo-50 text-[#4F3FF0] border-indigo-200'
                    }`}>
                      {row.accessType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {row.studentCount} student(s)
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {row.grantedAt ? new Date(row.grantedAt).toLocaleDateString() : 'Curriculum default'}
                  </td>
                  <td className="px-6 py-4 text-right select-none">
                    <button
                      onClick={() => onRevoke(row)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-rose-50 text-slate-455 hover:text-rose-600 rounded-xl transition-colors cursor-pointer text-[10px] font-black"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Revoke Access
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
