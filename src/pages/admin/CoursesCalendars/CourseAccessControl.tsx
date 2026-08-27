import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Shield, UserPlus, Trash2, Key, Search, ChevronDown, Check } from 'lucide-react';
import Button from '@/components/common/Button';
import { courseService } from '@/services/courseService';
import { batchService } from '@/services/batchService';
import { studentService } from '@/services/studentService';
import { courseAccessService } from '@/services/courseAccessService';
import { api } from '@/utils/api';
import { toast } from '@/utils/toast';
import { BatchModulePermissionsTable } from './BatchModulePermissionsTable';
import Swal from 'sweetalert2';

interface Course {
  courseId: string;
  courseName: string;
}

interface Batch {
  batchId: string;
  batchName: string;
  startDate?: string;
  courses?: Course[];
}

interface Student {
  studentId: string;
  fullName: string;
  email: string;
  regNo?: string;
  currentBatchId?: string;
}

interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  batchId: string;
  enrollmentDate?: string;
}

interface AccessGrant {
  id: string;
  courseId: string;
  courseName: string;
  batchCode: string; // holds batchId/batchName or 'TEACHER'/'REVIEWER'
  userIdentifier: string; // email
  grantedAt: string;
}

export const CourseAccessControl: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batchCoursesMap, setBatchCoursesMap] = useState<{ [batchId: string]: Course[] }>({});
  
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [reviewers, setReviewers] = useState<any[]>([]);
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  
  const [selectedUserEmails, setSelectedUserEmails] = useState<string[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [accessSearchQuery, setAccessSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [targetRole, setTargetRole] = useState<'STUDENT' | 'TEACHER' | 'REVIEWER'>('STUDENT');

  const courseDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    fetchData();
    
    // Setup click listener to close searchable course dropdown
    const handleOutsideClick = (e: MouseEvent) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(e.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        apiCourses, 
        apiBatches, 
        apiStudents, 
        apiEnrollments, 
        apiGrants,
        apiTeachers,
        apiReviewers
      ] = await Promise.all([
        courseService.getCourses().catch(() => []),
        batchService.getBatches().catch(() => []),
        studentService.getStudents().catch(() => []),
        api.get<Enrollment[]>('/api/v1/enrollments').catch(() => []),
        courseAccessService.getGrants().catch(() => []),
        api.get<any[]>('/api/v1/teachers').catch(() => []),
        api.get<any[]>('/api/v1/reviewers').catch(() => [])
      ]);

      setCourses(apiCourses || []);
      setBatches(apiBatches || []);
      setStudents(apiStudents || []);
      setEnrollments(apiEnrollments || []);
      setGrants(apiGrants as AccessGrant[] || []);
      setTeachers(apiTeachers || []);
      setReviewers(apiReviewers || []);

      // Fetch courses for each batch
      const coursesMap: { [batchId: string]: Course[] } = {};
      if (apiBatches && apiBatches.length > 0) {
        await Promise.all(
          apiBatches.map(async (b: any) => {
            try {
              const batchCourses = await batchService.getBatchCourses(b.batchId);
              coursesMap[b.batchId] = batchCourses || [];
            } catch (e) {
              console.error(`Failed to load courses for batch ${b.batchId}:`, e);
            }
          })
        );
      }
      setBatchCoursesMap(coursesMap);

      if (apiCourses && apiCourses.length > 0) {
        setSelectedCourseId(apiCourses[0].courseId);
        triggerBatchAutoSelect(apiCourses[0].courseId, apiBatches || [], coursesMap);
      }
    } catch (err) {
      console.error('Failed to load access control database:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-select batch based on standard module curriculum assignment
  const triggerBatchAutoSelect = (courseId: string, allBatches: Batch[], currentMap = batchCoursesMap) => {
    const assignedBatches = allBatches.filter(b => {
      const bCourses = currentMap[b.batchId] || [];
      return bCourses.some(c => c.courseId.toLowerCase() === courseId.toLowerCase());
    });

    if (assignedBatches.length > 0) {
      setSelectedBatchId(assignedBatches[0].batchId);
      return;
    }

    const assignedBatchesFallback = allBatches.filter(b => 
      b.courses && b.courses.some(c => c.courseId.toLowerCase() === courseId.toLowerCase())
    );

    if (assignedBatchesFallback.length > 0) {
      setSelectedBatchId(assignedBatchesFallback[0].batchId);
      return;
    }

    const enrolledBatchIds = new Set(
      enrollments.filter(e => e.courseId.toLowerCase() === courseId.toLowerCase()).map(e => e.batchId)
    );
    const assignedByEnrollment = allBatches.filter(b => enrolledBatchIds.has(b.batchId));
    if (assignedByEnrollment.length > 0) {
      setSelectedBatchId(assignedByEnrollment[0].batchId);
      return;
    }

    const grantedBatchCodes = new Set(
      grants.filter(g => g.courseId.toLowerCase() === courseId.toLowerCase()).map(g => g.batchCode.toLowerCase())
    );
    const assignedByGrant = allBatches.filter(b => 
      grantedBatchCodes.has(b.batchId.toLowerCase()) || grantedBatchCodes.has(b.batchName.toLowerCase())
    );
    if (assignedByGrant.length > 0) {
      setSelectedBatchId(assignedByGrant[0].batchId);
      return;
    }

    if (allBatches.length > 0) {
      setSelectedBatchId(allBatches[0].batchId);
    }
  };

  // Generate list of course options paired with related batches
  const courseOptions = useMemo(() => {
    const options: Array<{
      key: string;
      courseId: string;
      courseName: string;
      batchId: string | null;
      batchName: string | null;
      displayName: string;
    }> = [];

    courses.forEach(course => {
      const assignedBatches: Batch[] = [];
      batches.forEach(batch => {
        const batchCourses = batchCoursesMap[batch.batchId] || batch.courses || [];
        const isStandard = batchCourses.some(c => c.courseId.toLowerCase() === course.courseId.toLowerCase());
        
        const isEnrolled = enrollments.some(
          e => e.courseId.toLowerCase() === course.courseId.toLowerCase() && 
               e.batchId.toLowerCase() === batch.batchId.toLowerCase()
        );

        const isGranted = grants.some(
          g => g.courseId.toLowerCase() === course.courseId.toLowerCase() && 
               (g.batchCode.toLowerCase() === batch.batchId.toLowerCase() || 
                g.batchCode.toLowerCase() === batch.batchName.toLowerCase())
        );

        if (isStandard || isEnrolled || isGranted) {
          assignedBatches.push(batch);
        }
      });

      if (assignedBatches.length > 0) {
        const uniqueBatches = assignedBatches.filter((b, index, self) =>
          self.findIndex(tb => tb.batchId === b.batchId) === index
        );

        uniqueBatches.forEach(batch => {
          options.push({
            key: `${course.courseId}-${batch.batchId}`,
            courseId: course.courseId,
            courseName: course.courseName,
            batchId: batch.batchId,
            batchName: batch.batchName,
            displayName: `${course.courseName} - ${batch.batchName}`
          });
        });
      } else {
        options.push({
          key: `${course.courseId}-nobatch`,
          courseId: course.courseId,
          courseName: course.courseName,
          batchId: null,
          batchName: null,
          displayName: course.courseName
        });
      }
    });

    return options;
  }, [courses, batches, batchCoursesMap, enrollments, grants]);

  const filteredCourseOptions = useMemo(() => {
    return courseOptions.filter(opt =>
      opt.displayName.toLowerCase().includes(courseSearchQuery.toLowerCase())
    );
  }, [courseOptions, courseSearchQuery]);

  const selectedCourseName = useMemo(() => {
    const matchedCourse = courses.find(c => c.courseId === selectedCourseId);
    if (!matchedCourse) return 'Select Course Module';
    const matchedBatch = batches.find(b => b.batchId === selectedBatchId);
    if (matchedBatch && targetRole === 'STUDENT') {
      return `${matchedCourse.courseName} - ${matchedBatch.batchName}`;
    }
    return matchedCourse.courseName;
  }, [courses, selectedCourseId, batches, selectedBatchId, targetRole]);

  // Students enrolled in standard batch
  const batchStudents = useMemo(() => {
    if (!selectedBatchId) return [];
    
    const directStudents = students.filter(s => s.currentBatchId?.toLowerCase() === selectedBatchId.toLowerCase());
    
    const enrolledIds = new Set(
      enrollments.filter(e => e.batchId === selectedBatchId).map(e => e.studentId)
    );
    const enrolledStudents = students.filter(s => enrolledIds.has(s.studentId));
    
    const combined = [...directStudents];
    enrolledStudents.forEach(es => {
      if (!combined.some(ds => ds.studentId === es.studentId)) {
        combined.push(es);
      }
    });
    
    return combined;
  }, [selectedBatchId, enrollments, students]);

  // Users who have access
  const usersWithAccess = useMemo(() => {
    if (!selectedCourseId) return [];
    const targetBatch = batches.find(b => b.batchId === selectedBatchId);

    // 1. Students access
    const studentAccessList = students.map(student => {
      const hasEnrollment = selectedBatchId ? enrollments.some(
        e => e.studentId === student.studentId && 
             e.courseId === selectedCourseId && 
             e.batchId === selectedBatchId
      ) : false;

      const grant = grants.find(
        g => g.courseId === selectedCourseId && 
             g.userIdentifier.toLowerCase() === student.email.toLowerCase() &&
             (targetBatch ? (g.batchCode.toLowerCase() === targetBatch.batchName.toLowerCase() || g.batchCode.toLowerCase() === targetBatch.batchId.toLowerCase()) : true)
      );

      if (hasEnrollment || grant) {
        return {
          id: student.studentId,
          fullName: student.fullName,
          email: student.email,
          role: 'Student',
          accessType: hasEnrollment ? 'Enrolled (Standard)' : 'Custom Grant',
          grantId: grant?.id || null
        };
      }
      return null;
    }).filter(Boolean);

    // 2. Teachers access
    const teacherAccessList = teachers.map(teacher => {
      const grant = grants.find(
        g => g.courseId === selectedCourseId && 
             g.userIdentifier.toLowerCase() === teacher.email.toLowerCase()
      );

      if (grant) {
        return {
          id: teacher.teacherId,
          fullName: teacher.fullName,
          email: teacher.email,
          role: 'Teacher',
          accessType: 'Custom Grant',
          grantId: grant.id
        };
      }
      return null;
    }).filter(Boolean);

    // 3. Reviewers access
    const reviewerAccessList = reviewers.map(reviewer => {
      const grant = grants.find(
        g => g.courseId === selectedCourseId && 
             g.userIdentifier.toLowerCase() === reviewer.email.toLowerCase()
      );

      if (grant) {
        return {
          id: reviewer.reviewerId,
          fullName: reviewer.fullName,
          email: reviewer.email,
          role: 'Reviewer',
          accessType: 'Custom Grant',
          grantId: grant.id
        };
      }
      return null;
    }).filter(Boolean);

    return [...studentAccessList, ...teacherAccessList, ...reviewerAccessList] as any[];
  }, [selectedCourseId, selectedBatchId, batches, students, teachers, reviewers, enrollments, grants]);

  const emailsWithAccess = useMemo(() => {
    return new Set(usersWithAccess.map(u => u.email.toLowerCase()));
  }, [usersWithAccess]);

  // Users eligible for custom grant assignment based on selected target tab
  const eligibleUsers = useMemo(() => {
    if (targetRole === 'STUDENT') {
      return batchStudents.filter(s => !emailsWithAccess.has(s.email.toLowerCase()));
    } else if (targetRole === 'TEACHER') {
      return teachers.filter(t => !emailsWithAccess.has(t.email.toLowerCase()));
    } else {
      return reviewers.filter(r => !emailsWithAccess.has(r.email.toLowerCase()));
    }
  }, [targetRole, batchStudents, teachers, reviewers, emailsWithAccess]);

  const filteredEligibleUsers = useMemo(() => {
    return eligibleUsers.filter(u =>
      u.fullName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );
  }, [eligibleUsers, studentSearchQuery]);

  const filteredUsersWithAccess = useMemo(() => {
    return usersWithAccess.filter(user =>
      user.fullName.toLowerCase().includes(accessSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(accessSearchQuery.toLowerCase())
    );
  }, [usersWithAccess, accessSearchQuery]);

  // Permissions Table Matrix Builder
  const permissionsMatrix = useMemo(() => {
    const matrix: any[] = [];
    const processedKeys = new Set<string>();

    batches.forEach(batch => {
      if (batch.courses) {
        batch.courses.forEach(course => {
          const key = `${course.courseId}-${batch.batchId}-Standard`;
          if (!processedKeys.has(key)) {
            processedKeys.add(key);
            const stdCount = students.filter(s => s.currentBatchId?.toLowerCase() === batch.batchId.toLowerCase()).length;
            matrix.push({
              courseId: course.courseId,
              courseName: course.courseName,
              batchId: batch.batchId,
              batchName: batch.batchName,
              accessType: 'Standard',
              studentCount: stdCount,
              grantedAt: batch.startDate || ''
            });
          }
        });
      }
    });

    grants.forEach(grant => {
      const targetBatch = batches.find(b => b.batchName.toLowerCase() === grant.batchCode.toLowerCase() || b.batchId.toLowerCase() === grant.batchCode.toLowerCase());
      if (targetBatch) {
        const key = `${grant.courseId}-${targetBatch.batchId}-Custom`;
        if (!processedKeys.has(key)) {
          processedKeys.add(key);
          const customCount = grants.filter(g => 
            g.courseId === grant.courseId && 
            (g.batchCode.toLowerCase() === targetBatch.batchName.toLowerCase() || g.batchCode.toLowerCase() === targetBatch.batchId.toLowerCase())
          ).length;

          matrix.push({
            courseId: grant.courseId,
            courseName: grant.courseName,
            batchId: targetBatch.batchId,
            batchName: targetBatch.batchName,
            accessType: 'Custom',
            studentCount: customCount,
            grantedAt: grant.grantedAt
          });
        }
      } else {
        if (grant.batchCode === 'TEACHER' || grant.batchCode === 'REVIEWER') {
          const key = `${grant.courseId}-${grant.batchCode}-Staff`;
          if (!processedKeys.has(key)) {
            processedKeys.add(key);
            const staffCount = grants.filter(g => g.courseId === grant.courseId && g.batchCode === grant.batchCode).length;
            matrix.push({
              courseId: grant.courseId,
              courseName: grant.courseName,
              batchId: grant.batchCode,
              batchName: grant.batchCode === 'TEACHER' ? 'Teaching Staff' : 'Reviewer Staff',
              accessType: 'Custom',
              studentCount: staffCount,
              grantedAt: grant.grantedAt
            });
          }
        }
      }
    });

    return matrix;
  }, [batches, grants, students]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserEmails(filteredEligibleUsers.map(u => u.email));
    } else {
      setSelectedUserEmails([]);
    }
  };

  // Grant access implementation
  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert('Please select a course module.');
      return;
    }
    if (targetRole === 'STUDENT' && !selectedBatchId) {
      alert('Please select a batch for students.');
      return;
    }
    if (selectedUserEmails.length === 0) {
      alert('Please select at least one user.');
      return;
    }

    const targetCourse = courses.find(c => c.courseId === selectedCourseId);
    const targetBatch = batches.find(b => b.batchId === selectedBatchId);
    if (!targetCourse) return;

    const newGrantsToCreate = selectedUserEmails.map(email => ({
      courseId: selectedCourseId,
      courseName: targetCourse.courseName,
      batchCode: targetRole === 'STUDENT' ? (targetBatch?.batchId || 'default') : targetRole,
      userIdentifier: email.toLowerCase()
    }));

    try {
      setLoading(true);
      const apiGrants = await Promise.all(
        newGrantsToCreate.map(payload => courseAccessService.grantAccess(payload))
      );
      
      setGrants(prev => [...(apiGrants as AccessGrant[]), ...prev]);
      setSelectedUserEmails([]);
      toast.success(`Access granted successfully to ${apiGrants.length} user(s).`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to grant course access.');
    } finally {
      setLoading(false);
    }
  };

  // Revoke Custom Link
  const handleRevokeCustom = async (grantId: string, studentName: string) => {
    Swal.fire({
      title: 'Revoke Custom Grant?',
      html: `<div class="text-left text-xs font-semibold text-slate-500 leading-relaxed mt-2">Are you sure you want to revoke custom course access for user "${studentName}"?</div>`,
      showCancelButton: true,
      confirmButtonText: 'Yes, revoke it',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-3xl border border-[#E9EDF5] bg-white shadow-2xl p-6 font-sans w-full max-w-md relative text-left',
        title: 'text-left font-black text-slate-805 text-sm tracking-tight border-b border-slate-100 pb-3 block w-full',
        htmlContainer: 'block text-left mb-0',
        actions: 'flex gap-3 justify-end pt-3 mt-4 border-t border-slate-100 w-full',
        confirmButton: 'py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/10',
        cancelButton: 'py-2 px-4 border border-[#E2E8F0] hover:bg-slate-50 text-slate-750 font-extrabold text-xs rounded-xl cursor-pointer transition-all'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await courseAccessService.revokeAccess(grantId);
          setGrants(prev => prev.filter(g => g.id !== grantId));
          toast.success('Access has been successfully revoked.');
        } catch (err) {
          console.error(err);
          toast.error('Failed to revoke access.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Revoke matrix row access (Standard curriculum vs Custom grants)
  const handleRevokeMatrix = async (row: any) => {
    if (row.accessType === 'Standard') {
      const confirmText = `Are you sure you want to revoke standard curriculum access for course "${row.courseName}" from batch "${row.batchName}"? This affects every student enrolled in this batch and removes the module assignment.`;
      
      Swal.fire({
        title: 'Revoke Standard Curriculum?',
        html: `<div class="text-left text-xs font-semibold text-slate-500 leading-relaxed mt-2">${confirmText}</div>`,
        showCancelButton: true,
        confirmButtonText: 'Yes, revoke standard access',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: {
          popup: 'rounded-3xl border border-[#E9EDF5] bg-white shadow-2xl p-6 font-sans w-full max-w-md relative text-left',
          title: 'text-left font-black text-slate-805 text-sm tracking-tight border-b border-slate-100 pb-3 block w-full',
          htmlContainer: 'block text-left mb-0',
          actions: 'flex gap-3 justify-end pt-3 mt-4 border-t border-slate-100 w-full',
          confirmButton: 'py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/10',
          cancelButton: 'py-2 px-4 border border-[#E2E8F0] hover:bg-slate-50 text-slate-750 font-extrabold text-xs rounded-xl cursor-pointer transition-all'
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            setLoading(true);
            const batchData = await api.get<any>(`/api/v1/batches/${row.batchId}`);
            if (batchData) {
              batchData.courses = (batchData.courses || []).filter((c: any) => c.courseId.toLowerCase() !== row.courseId.toLowerCase());
              await batchService.updateBatch(row.batchId, batchData);
              setBatches(prev => prev.map(b => b.batchId === row.batchId ? { ...b, courses: batchData.courses } : b));
              toast.success(`Standard curriculum access successfully revoked for batch "${row.batchName}".`);
            }
          } catch (err) {
            console.error(err);
            toast.error('Failed to revoke standard batch course access.');
          } finally {
            setLoading(false);
          }
        }
      });
    } else {
      const confirmText = `Are you sure you want to revoke all custom grants for course "${row.courseName}" from ${row.batchName}?`;
      
      Swal.fire({
        title: 'Revoke Custom Grants?',
        html: `<div class="text-left text-xs font-semibold text-slate-500 leading-relaxed mt-2">${confirmText}</div>`,
        showCancelButton: true,
        confirmButtonText: 'Yes, revoke all grants',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: {
          popup: 'rounded-3xl border border-[#E9EDF5] bg-white shadow-2xl p-6 font-sans w-full max-w-md relative text-left',
          title: 'text-left font-black text-slate-805 text-sm tracking-tight border-b border-slate-100 pb-3 block w-full',
          htmlContainer: 'block text-left mb-0',
          actions: 'flex gap-3 justify-end pt-3 mt-4 border-t border-slate-100 w-full',
          confirmButton: 'py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/10',
          cancelButton: 'py-2 px-4 border border-[#E2E8F0] hover:bg-slate-50 text-slate-750 font-extrabold text-xs rounded-xl cursor-pointer transition-all'
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            setLoading(true);
            const targetGrants = grants.filter(g => 
              g.courseId === row.courseId && 
              (g.batchCode.toLowerCase() === row.batchId.toLowerCase() || g.batchCode.toLowerCase() === row.batchName.toLowerCase())
            );
            
            await Promise.all(targetGrants.map(g => courseAccessService.revokeAccess(g.id)));
            setGrants(prev => prev.filter(g => !targetGrants.some(tg => tg.id === g.id)));
            toast.success(`Custom grants successfully revoked for "${row.batchName}".`);
          } catch (err) {
            console.error(err);
            toast.error('Failed to revoke custom grants.');
          } finally {
            setLoading(false);
          }
        }
      });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Access Control Workspaces Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Left Column - Large Grant Access Panel */}
        <div className="lg:col-span-3 bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-5 text-left flex flex-col min-h-[500px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2 select-none">
                <Shield className="h-4.5 w-4.5 text-[#4F3FF0]" />
                Grant Access Controller
              </h3>
              <p className="text-slate-505 text-[10px] font-medium mt-0.5">Assign customized modules and auto-resolve student/staff access grants.</p>
            </div>

            {/* Target Role Selector Tabs */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-1 rounded-2xl flex items-center gap-1.5 select-none font-bold text-[9px] uppercase tracking-wider">
              <button
                type="button"
                onClick={() => {
                  setTargetRole('STUDENT');
                  setSelectedUserEmails([]);
                  setStudentSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  targetRole === 'STUDENT'
                    ? 'bg-white border border-[#E2E8F0] text-slate-850 shadow-xs font-black'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Students
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetRole('TEACHER');
                  setSelectedUserEmails([]);
                  setStudentSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  targetRole === 'TEACHER'
                    ? 'bg-white border border-[#E2E8F0] text-slate-850 shadow-xs font-black'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Teachers
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetRole('REVIEWER');
                  setSelectedUserEmails([]);
                  setStudentSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  targetRole === 'REVIEWER'
                    ? 'bg-white border border-[#E2E8F0] text-slate-850 shadow-xs font-black'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Reviewers
              </button>
            </div>
          </div>

          <form onSubmit={handleGrantAccess} className="space-y-5 flex-1 flex flex-col">
            
            {/* Top selectors grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Searchable Module Combobox */}
              <div className="space-y-1.5 text-left relative" ref={courseDropdownRef}>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block select-none">Course Module</label>
                <div 
                  onClick={() => setIsCourseDropdownOpen(prev => !prev)}
                  className="w-full flex items-center justify-between pl-4 pr-3.5 py-3 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-350 focus-within:border-[#4F3FF0] rounded-xl text-xs text-slate-800 font-bold outline-none cursor-pointer select-none transition-all"
                >
                  <span className="truncate">{selectedCourseName}</span>
                  <ChevronDown className={`h-4.5 w-4.5 text-slate-455 transition-transform ${isCourseDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isCourseDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-60">
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-455" />
                        <input
                          type="text"
                          value={courseSearchQuery}
                          onChange={(e) => setCourseSearchQuery(e.target.value)}
                          placeholder="Search modules..."
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-8.5 pr-3 py-2 bg-white border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-lg text-xs font-bold text-slate-700 placeholder-slate-400 outline-none"
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto divide-y divide-slate-50 flex-1">
                      {filteredCourseOptions.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs font-semibold select-none">No modules found</div>
                      ) : (
                        filteredCourseOptions.map(opt => {
                          const isSelected = opt.courseId === selectedCourseId && opt.batchId === selectedBatchId;
                          return (
                            <div
                              key={opt.key}
                              onClick={() => {
                                setSelectedCourseId(opt.courseId);
                                if (opt.batchId) {
                                  setSelectedBatchId(opt.batchId);
                                }
                                setSelectedUserEmails([]);
                                setCourseSearchQuery('');
                                setIsCourseDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-[#4F3FF0]/5 text-[#4F3FF0] font-black' : 'text-slate-700 font-bold'}`}
                            >
                              <span className="truncate pr-4 text-xs">{opt.displayName}</span>
                              {isSelected && <Check className="h-4 w-4 shrink-0" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Batch Dropdown Selector */}
              {targetRole === 'STUDENT' ? (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block select-none">Select Batch</label>
                  <select
                    value={selectedBatchId}
                    onChange={e => {
                      setSelectedBatchId(e.target.value);
                      setSelectedUserEmails([]);
                      setStudentSearchQuery('');
                      setAccessSearchQuery('');
                    }}
                    className="w-full pl-4 pr-10 py-3 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-350 focus:border-[#4F3FF0] rounded-xl text-xs text-slate-800 font-bold outline-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 transition-all"
                  >
                    {batches.map(b => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.batchName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5 text-left select-none">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Granted Context</label>
                  <div className="w-full pl-4 pr-4 py-3.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs text-slate-500 font-extrabold">
                    {targetRole === 'TEACHER' ? 'Teacher Staff Permissions (Full Editing Access)' : 'Reviewer Staff Permissions (Full Evaluation Access)'}
                  </div>
                </div>
              )}

            </div>

            {/* Redesigned User selection Area */}
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selectAllCheckbox"
                    checked={eligibleUsers.length > 0 && selectedUserEmails.length === eligibleUsers.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={eligibleUsers.length === 0}
                    className="h-4.5 w-4.5 rounded border-slate-350 text-[#4F3FF0] focus:ring-[#4F3FF0] cursor-pointer disabled:cursor-not-allowed shrink-0"
                  />
                  <label htmlFor="selectAllCheckbox" className="text-xs font-black text-slate-700 cursor-pointer select-none">
                    Select All ({selectedUserEmails.length} selected)
                  </label>
                </div>
                
                {/* Search box inside selection checklist */}
                <div className="relative w-full sm:max-w-xs">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={studentSearchQuery}
                    onChange={e => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] focus:bg-white rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Grid Roster scrollable list */}
              <div className="border border-[#E9EDF5] rounded-2xl p-3 bg-slate-50/30 overflow-y-auto max-h-[300px] flex-1 divide-y divide-slate-100 animate-in fade-in duration-150">
                {filteredEligibleUsers.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs font-semibold select-none">
                    No selectable {targetRole === 'STUDENT' ? 'students' : targetRole === 'TEACHER' ? 'teachers' : 'reviewers'} available.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 py-1">
                    {filteredEligibleUsers.map(user => {
                      const isChecked = selectedUserEmails.includes(user.email);
                      const hasAccess = emailsWithAccess.has(user.email.toLowerCase());
                      const userId = user.studentId || user.teacherId || user.reviewerId;
                      return (
                        <div
                          key={userId}
                          onClick={() => {
                            if (!hasAccess) {
                              setSelectedUserEmails(prev =>
                                prev.includes(user.email)
                                  ? prev.filter(e => e !== user.email)
                                  : [...prev, user.email]
                              );
                            }
                          }}
                          className={`flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#E9EDF5] transition-all duration-150 ${
                            hasAccess 
                              ? 'opacity-65 bg-slate-50/50 cursor-not-allowed select-none' 
                              : 'hover:border-slate-350 cursor-pointer'
                          } ${isChecked ? 'bg-indigo-50/10 border-[#4F3FF0] shadow-sm' : ''}`}
                        >
                          <input
                             type="checkbox"
                             checked={isChecked || hasAccess}
                             disabled={hasAccess}
                             onChange={() => {}} // toggled by container click
                             className="h-4.5 w-4.5 mt-0.5 rounded border-slate-350 text-[#4F3FF0] focus:ring-[#4F3FF0] cursor-pointer shrink-0 disabled:cursor-not-allowed"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-xs font-black text-slate-800 truncate leading-snug">{user.fullName}</p>
                              {hasAccess && (
                                <span className="text-[8px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 select-none">
                                  Has Access
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-450 font-medium truncate mt-0.5">{user.email}</p>
                            {user.specialization && (
                              <span className="inline-block mt-1.5 px-2 py-0.5 bg-indigo-50 text-[#4F3FF0] text-[8px] font-extrabold rounded select-none">
                                {user.specialization}
                              </span>
                            )}
                            {user.expertiseArea && (
                              <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-extrabold rounded select-none">
                                {user.expertiseArea}
                              </span>
                            )}
                            {user.regNo && (
                              <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-100 text-slate-505 font-mono text-[8px] font-bold rounded select-none">
                                {user.regNo}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Grant Button */}
            <div className="pt-2 select-none text-right">
              <Button
                type="submit"
                variant="solid"
                color="primary"
                className="shadow-lg shadow-[#4F3FF0]/15 px-6 py-3 cursor-pointer"
                disabled={selectedUserEmails.length === 0}
                startIcon={<UserPlus className="h-4.5 w-4.5" />}
              >
                Grant Access
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column - Secondary Module Access List */}
        <div className="lg:col-span-2 bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm text-left flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                Module Access Roster
              </h3>
              <p className="text-slate-505 text-[10px] font-medium mt-0.5">
                Active students, teachers, and reviewers holding course permissions.
              </p>
            </div>
            <span className="text-[#4F3FF0] text-[10px] font-black px-2.5 py-1 bg-[#4F3FF0]/10 rounded-xl shrink-0 select-none">
              {usersWithAccess.length} Users
            </span>
          </div>

          {/* Search bar for access list */}
          {usersWithAccess.length > 0 && (
            <div className="relative mt-4 mb-3">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search active users..."
                value={accessSearchQuery}
                onChange={e => setAccessSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 outline-none transition-colors"
              />
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex items-center justify-center font-bold text-slate-400 text-xs uppercase tracking-wider">
              Loading access database...
            </div>
          ) : filteredUsersWithAccess.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-2.5 select-none">
              <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-400 font-extrabold text-xs">No active access records</p>
                <p className="text-slate-400 font-medium text-[9px] mt-0.5 leading-relaxed max-w-[200px]">Enrolled curriculum defaults and custom access grants will show here.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[360px] flex-1 space-y-3.5 pr-1 py-1">
              {filteredUsersWithAccess.map(user => (
                <div
                  key={`${user.id}-${user.role}-${user.accessType}`}
                  className="bg-white border border-[#E9EDF5] hover:border-slate-350 rounded-2xl p-4 flex flex-col justify-between transition-colors shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2.5">
                    <div className="min-w-0">
                      <span className="font-extrabold text-slate-800 text-xs block truncate" title={user.fullName}>
                        {user.fullName}
                      </span>
                      <span className="text-[10px] font-medium text-slate-455 block truncate mt-0.5">{user.email}</span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full tracking-wider border ${
                        user.accessType === 'Enrolled (Standard)' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                          : 'bg-indigo-50 text-[#4F3FF0] border-indigo-150'
                      }`}>
                        {user.accessType === 'Enrolled (Standard)' ? 'Standard' : 'Custom'}
                      </span>
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full tracking-wider border ${
                        user.role === 'Teacher'
                          ? 'bg-purple-50 text-purple-700 border-purple-150'
                          : user.role === 'Reviewer'
                          ? 'bg-amber-50 text-amber-700 border-amber-150'
                          : 'bg-blue-50 text-blue-700 border-blue-150'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {user.accessType === 'Custom Grant' && user.grantId && (
                    <div className="flex justify-end pt-3 border-t border-slate-100/60 mt-3.5">
                      <button
                        type="button"
                        onClick={() => handleRevokeCustom(user.grantId!, user.fullName)}
                        className="p-1.5 hover:bg-rose-50 text-slate-455 hover:text-rose-600 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1 text-[10px] font-black"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Revoke Custom Grant
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Section - Matrix Permissions Table */}
      <div className="pt-2">
        <BatchModulePermissionsTable 
          permissions={permissionsMatrix} 
          courses={courses}
          onRevoke={handleRevokeMatrix}
        />
      </div>

    </div>
  );
};

export default CourseAccessControl;
