import React, { useState, useEffect, useMemo } from 'react';
import { Shield, UserPlus, Trash2, Key, CheckCircle, Search, Users } from 'lucide-react';
import Button from '@/components/common/Button';
import { courseService } from '@/services/courseService';
import { batchService } from '@/services/batchService';
import { studentService } from '@/services/studentService';
import { api } from '@/utils/api';
import type { Course, Batch, Student, Enrollment } from '@/interfaces';

interface AccessGrant {
  id: string;
  courseId: string;
  courseName: string;
  batchCode: string;
  userIdentifier: string; // email
  grantedAt: string;
}

interface CourseAccessProps {
  hideHeader?: boolean;
}

export const CourseAccess: React.FC<CourseAccessProps> = ({ hideHeader = false }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedUserEmails, setSelectedUserEmails] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [accessSearchQuery, setAccessSearchQuery] = useState('');
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch default courses
      const apiCourses = await courseService.getCourses().catch(() => []);
      const apiBatches = await batchService.getBatches().catch(() => []);
      const apiStudents = await studentService.getStudents().catch(() => []);
      const apiEnrollments = await api.get<any[]>('/api/v1/enrollments').catch(() => []);
      
      setCourses(apiCourses);
      setBatches(apiBatches);
      setStudents(apiStudents);
      setEnrollments(apiEnrollments);

      if (apiCourses.length > 0) {
        setSelectedCourseId(apiCourses[0].courseId);
      }
      if (apiBatches.length > 0) {
        setSelectedBatchId(apiBatches[0].batchId);
      }

      // Load existing access grants
      const storedGrants = localStorage.getItem('course_access_grants');
      if (storedGrants) {
        setGrants(JSON.parse(storedGrants));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const batchStudents = useMemo(() => {
    if (!selectedBatchId) return [];
    
    // Find all studentId values enrolled in this batch
    const enrolledStudentIds = new Set(
      enrollments
        .filter((e: any) => e.batchId === selectedBatchId)
        .map((e: any) => e.studentId)
    );

    // Filter students who are in this list
    return students.filter((s: any) => enrolledStudentIds.has(s.studentId));
  }, [selectedBatchId, enrollments, students]);

  const filteredBatchStudents = useMemo(() => {
    return batchStudents.filter(s =>
      s.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (s.regNo && s.regNo.toLowerCase().includes(userSearchQuery.toLowerCase()))
    );
  }, [batchStudents, userSearchQuery]);

  const usersWithAccess = useMemo(() => {
    if (!selectedCourseId || !selectedBatchId) return [];
    
    const targetBatch = batches.find(b => b.batchId === selectedBatchId);
    if (!targetBatch) return [];

    return students.map(student => {
      // Check if student is enrolled in this course for this batch
      const hasEnrollment = enrollments.some(
        (e: any) => e.studentId === student.studentId && 
                    e.courseId === selectedCourseId && 
                    e.batchId === selectedBatchId
      );

      // Check if student has a custom grant for this course and batch
      const grant = grants.find(
        (g: any) => g.courseId === selectedCourseId && 
                    g.batchCode === targetBatch.batchName && 
                    g.userIdentifier.toLowerCase() === student.email.toLowerCase()
      );

      if (hasEnrollment || grant) {
        return {
          ...student,
          accessType: hasEnrollment ? 'Enrolled (Standard)' : 'Custom Grant',
          grantId: grant?.id || null
        };
      }
      return null;
    }).filter(Boolean) as Array<Student & { accessType: string; grantId: string | null }>;
  }, [selectedCourseId, selectedBatchId, batches, students, enrollments, grants]);

  const filteredUsersWithAccess = useMemo(() => {
    return usersWithAccess.filter(user =>
      user.fullName.toLowerCase().includes(accessSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(accessSearchQuery.toLowerCase()) ||
      (user.regNo && user.regNo.toLowerCase().includes(accessSearchQuery.toLowerCase()))
    );
  }, [usersWithAccess, accessSearchQuery]);

  const handleToggleUser = (email: string) => {
    setSelectedUserEmails(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserEmails(batchStudents.map(s => s.email));
    } else {
      setSelectedUserEmails([]);
    }
  };

  const handleGrantAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedBatchId) {
      alert('Please select both a course and a batch.');
      return;
    }
    if (selectedUserEmails.length === 0) {
      alert('Please select at least one user.');
      return;
    }

    const targetCourse = courses.find(c => c.courseId === selectedCourseId);
    const targetBatch = batches.find(b => b.batchId === selectedBatchId);
    if (!targetCourse || !targetBatch) return;

    const newGrantsToAdd: AccessGrant[] = [];
    const duplicateEmails: string[] = [];

    selectedUserEmails.forEach(email => {
      // Check duplicate grant
      const exists = grants.some(
        g => g.courseId === selectedCourseId && 
             g.batchCode === targetBatch.batchName &&
             g.userIdentifier.toLowerCase() === email.toLowerCase()
      );

      if (exists) {
        duplicateEmails.push(email);
      } else {
        newGrantsToAdd.push({
          id: 'grant-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          courseId: selectedCourseId,
          courseName: targetCourse.courseName,
          batchCode: targetBatch.batchName,
          userIdentifier: email.toLowerCase(),
          grantedAt: new Date().toISOString().split('T')[0]
        });
      }
    });

    if (newGrantsToAdd.length === 0) {
      alert('All selected users already have access to this course in this batch.');
      return;
    }

    const updated = [...newGrantsToAdd, ...grants];
    setGrants(updated);
    localStorage.setItem('course_access_grants', JSON.stringify(updated));
    setSelectedUserEmails([]);
    
    let msg = `Access granted successfully to ${newGrantsToAdd.length} user(s).`;
    if (duplicateEmails.length > 0) {
      msg += ` (${duplicateEmails.length} already had access)`;
    }
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleRevokeAccess = (id: string, user: string) => {
    if (confirm(`Are you sure you want to revoke course access for ${user}?`)) {
      const updated = grants.filter(g => g.id !== id);
      setGrants(updated);
      localStorage.setItem('course_access_grants', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title block */}
      {!hideHeader && (
        <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">Course Access Control</h2>
            <p className="text-slate-500 text-xs mt-1">Assign custom course templates and batches to registered students, teachers, and reviewers.</p>
          </div>
          <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-[#4F3FF0]">
            <Shield className="h-5 w-5" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Grant Access Form */}
        <div className="lg:col-span-2 bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-5 text-left">
          <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4 text-[#4F3FF0]" />
            Grant Access Panel
          </h3>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-700 p-3 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleGrantAccess} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Select Course Module</label>
              <select
                value={selectedCourseId}
                onChange={e => {
                  setSelectedCourseId(e.target.value);
                  setAccessSearchQuery('');
                }}
                className="w-full pl-4 pr-10 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-800 font-bold outline-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10"
              >
                {courses.map(c => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.courseName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Select Batch</label>
              <select
                value={selectedBatchId}
                onChange={e => {
                  setSelectedBatchId(e.target.value);
                  setSelectedUserEmails([]);
                  setUserSearchQuery('');
                  setAccessSearchQuery('');
                }}
                className="w-full pl-4 pr-10 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-800 font-bold outline-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10"
              >
                {batches.map(b => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.batchName}
                  </option>
                ))}
              </select>
            </div>

            {/* User Selection List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">
                  Select Users ({selectedUserEmails.length} selected)
                </label>
                {batchStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectAll(selectedUserEmails.length < batchStudents.length)}
                    className="text-[10px] font-black text-[#4F3FF0] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    {selectedUserEmails.length === batchStudents.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {/* Search user inside batch */}
              {batchStudents.length > 0 && (
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-850 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10"
                  />
                </div>
              )}

              {/* Scrollable list */}
              <div className="border border-[#E9EDF5] rounded-2xl p-2 max-h-60 overflow-y-auto bg-slate-50/30 divide-y divide-slate-100">
                {filteredBatchStudents.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-semibold select-none">
                    {batchStudents.length === 0 ? 'No users enrolled in this batch.' : 'No users match search.'}
                  </div>
                ) : (
                  filteredBatchStudents.map(student => {
                    const isChecked = selectedUserEmails.includes(student.email);
                    return (
                      <div
                        key={student.studentId}
                        onClick={() => handleToggleUser(student.email)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors ${isChecked ? 'bg-indigo-50/30' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // toggled by parent div click
                          className="h-4 w-4 rounded border-slate-350 text-[#4F3FF0] focus:ring-[#4F3FF0] cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate leading-tight">{student.fullName}</p>
                          <span className="text-[10px] font-medium text-slate-450 truncate block mt-0.5">{student.email}</span>
                        </div>
                        {student.regNo && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 font-mono text-[9px] font-bold rounded shrink-0">
                            {student.regNo}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="solid"
              color="primary"
              className="w-full justify-center shadow-lg shadow-[#4F3FF0]/15"
              startIcon={<UserPlus className="h-4 w-4" />}
            >
              Grant Course Access
            </Button>
          </form>
        </div>

        {/* Module Access List */}
        <div className="lg:col-span-3 bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm text-left space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                Module Access List
              </h3>
              <p className="text-slate-500 text-[10px] font-medium mt-0.5">
                Showing users who can access {courses.find(c => c.courseId === selectedCourseId)?.courseName || 'this module'} ({batches.find(b => b.batchId === selectedBatchId)?.batchName || ''}).
              </p>
            </div>
            <span className="text-slate-450 text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-lg shrink-0">
              {usersWithAccess.length} Users
            </span>
          </div>

          {/* Search bar for access list */}
          {usersWithAccess.length > 0 && (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Filter users with access..."
                value={accessSearchQuery}
                onChange={e => setAccessSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-850 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10"
              />
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 font-bold text-slate-400 text-sm">
              Loading access database...
            </div>
          ) : filteredUsersWithAccess.length === 0 ? (
            <div className="text-center py-12 space-y-2 select-none">
              <Key className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-slate-400 font-extrabold text-xs">No users have access to this module.</p>
              <p className="text-slate-400 font-medium text-[10px]">Standard enrollments or custom grants will show here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsersWithAccess.map(user => (
                <div
                  key={`${user.studentId}-${user.accessType}`}
                  className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md hover:border-slate-350 transition-all"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-black text-slate-850 text-xs truncate max-w-[150px]" title={user.fullName}>
                        {user.fullName}
                      </span>
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded shrink-0 ${
                        user.accessType === 'Enrolled (Standard)' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-indigo-50 text-[#4F3FF0]'
                      }`}>
                        {user.accessType}
                      </span>
                    </div>

                    <div className="space-y-1 mt-3 text-[10.5px] font-bold text-slate-500">
                      <div className="truncate" title={user.email}>
                        Email: <span className="text-slate-850 font-black">{user.email}</span>
                      </div>
                      {user.regNo && (
                        <div>
                          Reg No: <span className="text-slate-700 font-mono">{user.regNo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {user.accessType === 'Custom Grant' && user.grantId && (
                    <div className="flex justify-end pt-3 border-t border-slate-100/60 mt-4">
                      <button
                        onClick={() => handleRevokeAccess(user.grantId!, user.fullName)}
                        className="p-1.5 hover:bg-rose-50 text-slate-450 hover:text-rose-600 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1 text-[10px] font-black"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Revoke Access
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default CourseAccess;
