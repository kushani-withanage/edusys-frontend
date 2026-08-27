import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronDown, 
  Check, 
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  FileText,
  ClipboardList,
  HelpCircle,
  Upload,
  Loader2,
  X,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { courseService } from '@/services/courseService';
import { toast } from '@/utils/toast';
import { api } from '@/utils/api';
import { submissionService } from '@/services/submissionService';
import { SubmissionsTable } from '@/components/common/SubmissionsTable';

export interface SyllabusItem {
  id: string;
  type: 'resource' | 'assignment' | 'quiz';
  title: string;
  pdfName?: string;
  pdfUrl?: string;
  startDate?: string;
  deadline?: string;
  deadlineTime?: string;
  questionsCount?: number;
  hidden?: boolean;
}



const safeParseJson = (data: any, defaultValue: any = []) => {
  if (!data) return defaultValue;
  if (typeof data === 'object') return data; // already parsed as array/object
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return defaultValue;
  }
};

const filterNonQuiz = (sectionsJson: any) => {
  const parsed = safeParseJson(sectionsJson);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((sect: any) => ({
    ...sect,
    items: Array.isArray(sect.items) 
      ? sect.items.filter((item: any) => item && item.type === 'quiz') 
      : []
  }));
};

const formatDatetimeLocal = (val?: string) => {
  if (!val) return '';
  let formatted = val.replace(' ', 'T');
  if (formatted.length === 10) {
    formatted += 'T00:00';
  }
  return formatted.substring(0, 16);
};

export const StudentCourseDetail: React.FC = () => {
  const { user } = useAuth();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'TEACHER' || user?.role?.toUpperCase() === 'REVIEWER';
  const pathPrefix = user?.role?.toUpperCase() === 'TEACHER' ? '/teacher' : user?.role?.toUpperCase() === 'REVIEWER' ? '/reviewer' : '/admin';

  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [submissionDetailModalOpen, setSubmissionDetailModalOpen] = useState(false);
  const [activeAssignmentDetails, setActiveAssignmentDetails] = useState<any | null>(null);
  const [editAssignmentModalOpen, setEditAssignmentModalOpen] = useState(false);
  const [editingAssignmentData, setEditingAssignmentData] = useState<any | null>(null);
  const [savingAssignmentSettings, setSavingAssignmentSettings] = useState(false);

  const [adminAssignmentDetailsModalOpen, setAdminAssignmentDetailsModalOpen] = useState(false);
  const [adminViewSubmissionsModalOpen, setAdminViewSubmissionsModalOpen] = useState(false);
  const [adminGradeStudentModalOpen, setAdminGradeStudentModalOpen] = useState(false);
  const [adminActiveItem, setAdminActiveItem] = useState<any | null>(null);
  const [adminActiveItemDetails, setAdminActiveItemDetails] = useState<any | null>(null);
  const [adminSubmissions, setAdminSubmissions] = useState<any[]>([]);
  const [adminStudents, setAdminStudents] = useState<any[]>([]);
  const [adminActiveStudent, setAdminActiveStudent] = useState<any | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: false
  });
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; url: string }[]>([]);
  const [isUploadingStudentFiles, setIsUploadingStudentFiles] = useState(false);
  const [isOwnWorkChecked, setIsOwnWorkChecked] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (!isAdmin && user?.userId && course?.sections) {
      const loadSubmissions = async () => {
        const submissionMap: Record<string, any> = {};
        for (const sect of course.sections) {
          if (sect.items) {
            for (const item of sect.items) {
              if (item.type === 'assignment') {
                try {
                  const sub = await submissionService.getSubmission(item.id, user.userId);
                  if (sub) {
                    submissionMap[item.id] = sub;
                  }
                } catch (e) {
                  console.error(`Failed to load submission for assignment ${item.id}`, e);
                }
              }
            }
          }
        }
        setSubmissions(submissionMap);
      };
      loadSubmissions();
    }
  }, [course, user, isAdmin]);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        const rawKey = courseId || 'crs0001';
        
        // 1. Fetch from backend API
        const dbCourse = await courseService.getCourse(rawKey).catch(() => null);
        if (dbCourse) {
          setCourse({
            code: dbCourse.batchCode || 'crs0001',
            name: dbCourse.courseName,
            program: 'iCD Program',
            level: dbCourse.level || 'Level 1',
            certReqs: safeParseJson(dbCourse.certReqs),
            qualifyIntro: dbCourse.qualifyIntro || '',
            qualifyReqs: safeParseJson(dbCourse.qualifyReqs),
            sections: filterNonQuiz(dbCourse.sections),
            isCompulsory: dbCourse.isCompulsory !== false,
            description: dbCourse.description || '',
            credits: dbCourse.credits,
            durationWeeks: dbCourse.durationWeeks,
            status: dbCourse.status || 'ongoing'
          });
          return;
        }

        // 2. Fall back to local storage custom courses
        const stored = localStorage.getItem('custom_courses');
        if (stored) {
          const customCourses = JSON.parse(stored);
          const found = customCourses.find((c: any) => 
            c.courseId?.toUpperCase() === rawKey.toUpperCase() || 
            c.batchCode?.toUpperCase() === rawKey.toUpperCase()
          );
          if (found) {
            setCourse({
              code: found.batchCode,
              name: found.courseName,
              program: 'iCD Program',
              level: found.level || 'Level 1',
              certReqs: safeParseJson(found.certReqs),
              qualifyIntro: found.qualifyIntro || '',
              qualifyReqs: safeParseJson(found.qualifyReqs),
              sections: filterNonQuiz(found.sections),
              isCompulsory: found.isCompulsory !== undefined ? found.isCompulsory : true,
              description: found.description || ''
            });
            return;
          }
        }

        toast.error('Failed to load course details.');
      } catch (err) {
        console.error(err);
        toast.error('Failed to load course details.');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  // Section expansion states (normal view)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    introduction: false,
    extra: false
  });

  const [markedDone, setMarkedDone] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = {
        ...prev,
        [section]: !prev[section]
      };
      if (courseId) {
        localStorage.setItem(`expanded_sections_${user?.userId || 'guest'}_${courseId}`, JSON.stringify(next));
      }
      return next;
    });
  };

  useEffect(() => {
    if (courseId) {
      const saved = localStorage.getItem(`expanded_sections_${user?.userId || 'guest'}_${courseId}`);
      if (saved) {
        try {
          setExpandedSections(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing expanded sections from localStorage:', e);
        }
      } else {
        setExpandedSections({
          general: true,
          introduction: false,
          extra: false
        });
      }
    }
  }, [courseId, user]);

  const calculateTimeRemaining = (submitDateStr?: string, dueDateStr?: string, dueTimeStr?: string) => {
    if (!submitDateStr || !dueDateStr) return { isEarly: true, text: '' };
    const submitDate = new Date(submitDateStr);
    const dueDateTimeStr = dueTimeStr ? `${dueDateStr}T${dueTimeStr}:00` : `${dueDateStr}T23:59:59`;
    const dueDate = new Date(dueDateTimeStr);

    const diffMs = dueDate.getTime() - submitDate.getTime();
    const isEarly = diffMs >= 0;
    const absDiffMs = Math.abs(diffMs);

    const mins = Math.floor(absDiffMs / (1000 * 60)) % 60;
    const hours = Math.floor(absDiffMs / (1000 * 60 * 60)) % 24;
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));

    let diffText = '';
    if (days > 0) diffText += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) diffText += `${hours} hour${hours > 1 ? 's' : ''} `;
    diffText += `${mins} min${mins > 1 ? 's' : ''} `;

    return {
      isEarly,
      text: isEarly ? `Assignment was submitted ${diffText}early` : `Assignment was submitted ${diffText}late`
    };
  };

  const calculateTimeRemainingBeforeSubmit = (dueDateStr?: string, dueTimeStr?: string) => {
    if (!dueDateStr) return { isOverdue: false, text: '' };
    const dueDateTimeStr = dueTimeStr ? `${dueDateStr}T${dueTimeStr}:00` : `${dueDateStr}T23:59:59`;
    const dueDate = new Date(dueDateTimeStr);
    const now = new Date();

    const diffMs = dueDate.getTime() - now.getTime();
    const isOverdue = diffMs < 0;
    const absDiffMs = Math.abs(diffMs);

    const mins = Math.floor(absDiffMs / (1000 * 60)) % 60;
    const hours = Math.floor(absDiffMs / (1000 * 60 * 60)) % 24;
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));

    let diffText = '';
    if (days > 0) diffText += `${days}d `;
    if (hours > 0) diffText += `${hours}h `;
    diffText += `${mins}m`;

    return {
      isOverdue,
      text: isOverdue ? `${diffText} overdue` : `${diffText} remaining`
    };
  };

  const handleOpenSubmissionModal = async (item: any) => {
    setActiveAssignment(item);
    setActiveAssignmentDetails(null);
    setSubmissionModalOpen(true);
    try {
      const details = await api.get<any>(`/api/v1/assignments/${item.id}`);
      setActiveAssignmentDetails(details);
    } catch (e) {
      console.error('Failed to load assignment details', e);
    }
  };

  const handleOpenDetailModal = async (item: any) => {
    setActiveAssignment(item);
    setActiveAssignmentDetails(null);
    setSubmissionDetailModalOpen(true);
    try {
      const details = await api.get<any>(`/api/v1/assignments/${item.id}`);
      setActiveAssignmentDetails(details);
    } catch (e) {
      console.error('Failed to load assignment details', e);
    }
  };

  const handleOpenEditAssignmentModal = async (item: SyllabusItem, sectionIdx: number, itemIdx: number) => {
    setEditingAssignmentData(null);
    setEditAssignmentModalOpen(true);
    try {
      const details = await api.get<any>(`/api/v1/assignments/${item.id}`);
      
      let submissionTypes = 'FILE_UPLOAD';
      if (details.submissionTypeFile && details.submissionTypeOnlineText) {
        submissionTypes = 'BOTH';
      } else if (details.submissionTypeOnlineText) {
        submissionTypes = 'ONLINE_TEXT';
      }

      const maxFileSize = details.maxSize ? parseInt(details.maxSize) || 50 : 50;

      let files: any[] = [];
      if (details.additionalFileUrl) {
        if (details.additionalFileUrl.startsWith('[')) {
          try {
            files = JSON.parse(details.additionalFileUrl);
          } catch (e) {
            files = [{ name: details.additionalFileName || 'Attachment', url: details.additionalFileUrl }];
          }
        } else {
          files = [{ name: details.additionalFileName || 'Attachment', url: details.additionalFileUrl }];
        }
      }

      setEditingAssignmentData({
        ...details,
        allowSubmissionsFrom: details.allowSubmissionsFrom || (item.startDate ? `${item.startDate}T00:00` : ''),
        dueDate: details.dueDate || (item.deadline ? `${item.deadline}T${item.deadlineTime || '23:59'}` : ''),
        enableCutoff: !!details.cutOffDate,
        submissionTypes,
        maxFileSize,
        files,
        sectionIdx,
        itemIdx
      });
    } catch (e) {
      console.error('Failed to load assignment details', e);
      let files: any[] = [];
      if (item.pdfUrl) {
        if (item.pdfUrl.startsWith('[')) {
          try {
            files = JSON.parse(item.pdfUrl);
          } catch (e) {
            files = [{ name: item.pdfName || 'Attachment', url: item.pdfUrl }];
          }
        } else {
          files = [{ name: item.pdfName || 'Attachment', url: item.pdfUrl }];
        }
      }
      setEditingAssignmentData({
        assignmentId: item.id,
        title: item.title,
        allowSubmissionsFrom: item.startDate ? `${item.startDate}T00:00` : '',
        dueDate: item.deadline ? `${item.deadline}T${item.deadlineTime || '23:59'}` : '',
        cutOffDate: '',
        enableCutoff: false,
        submissionTypes: 'FILE_UPLOAD',
        maxFileSize: 50,
        files,
        sectionIdx,
        itemIdx
      });
    }
  };

  const handleSaveSubmission = async () => {
    if (!activeAssignment || !user?.userId) return;
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to submit.');
      return;
    }
    if (!isOwnWorkChecked) {
      toast.error('You must check the own work declaration checkbox.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submissionPayload: any = {
        submissionId: submissions[activeAssignment.id]?.submissionId || undefined,
        assignmentId: activeAssignment.id,
        studentId: user.userId,
        submittedFile: JSON.stringify(selectedFiles)
      };
      const createdSubmission = await submissionService.submitAssignment(submissionPayload);

      setSubmissions(prev => ({
        ...prev,
        [activeAssignment.id]: createdSubmission
      }));

      setSubmissionModalOpen(false);
      setSelectedFiles([]);
      setIsOwnWorkChecked(false);
      toast.success('Assignment submitted successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdminSubmissions = async (item: SyllabusItem) => {
    setAdminActiveItem(item);
    setAdminActiveItemDetails(null);
    setAdminSubmissions([]);
    setAdminStudents([]);
    setAdminAssignmentDetailsModalOpen(true);

    try {
      const details = await api.get<any>(`/api/v1/assignments/${item.id}`);
      setAdminActiveItemDetails(details);

      const allUsers = await api.get<any[]>('/api/v1/users');
      const students = allUsers.filter((u: any) => u.role === 'STUDENT');
      setAdminStudents(students);

      const subs = await api.get<any[]>(`/api/v1/assignment-submissions/assignment/${item.id}`);
      setAdminSubmissions(subs);
    } catch (e) {
      console.error('Failed to load admin submissions', e);
      setAdminActiveItemDetails({
        assignmentId: item.id,
        title: item.title,
        allowSubmissionsFrom: item.startDate ? `${item.startDate}T00:00` : '',
        dueDate: item.deadline ? `${item.deadline}T${item.deadlineTime || '23:59'}` : '',
        cutOffDate: ''
      });
    }
  };

  const handleSaveGrade = async () => {
    if (!adminActiveItem || !adminActiveStudent) return;
    const grade = parseFloat(gradeInput);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error('Please enter a valid grade between 0 and 100.');
      return;
    }

    try {
      setIsSubmitting(true);
      const existingSub = adminSubmissions.find(s => s.studentId === adminActiveStudent.userId);
      const payload = {
        submissionId: existingSub?.submissionId || undefined,
        assignmentId: adminActiveItem.id,
        studentId: adminActiveStudent.userId,
        submittedFile: existingSub?.submittedFile || '[]',
        submitDate: existingSub?.submitDate || null,
        marks: grade,
        feedback: feedbackInput,
        gradedBy: user?.userId || 'usr0007'
      };

      const res = await api.post<any>('/api/v1/assignment-submissions', payload);
      
      setAdminSubmissions(prev => {
        const index = prev.findIndex(s => s.studentId === adminActiveStudent.userId);
        if (index > -1) {
          const copy = [...prev];
          copy[index] = res;
          return copy;
        } else {
          return [...prev, res];
        }
      });

      toast.success('Grade and feedback saved successfully!');
      setAdminGradeStudentModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save grade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoodleDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    try {
      const cleaned = dateStr.replace(' ', 'T');
      const date = new Date(cleaned);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleToggleStatus = async () => {
    if (!course) return;
    const nextStatus = course.status?.toLowerCase() === 'done' ? 'ongoing' : 'done';
    try {
      const rawKey = courseId || 'ICD110';
      await api.post(`/api/v1/courses/${rawKey}/status?status=${nextStatus}`, {});
      setCourse((prev: any) => ({
        ...prev,
        status: nextStatus
      }));
      toast.success(`Course marked as ${nextStatus === 'done' ? 'completed' : 'ongoing'} successfully!`);
    } catch (err) {
      console.error('Error toggling course status:', err);
      toast.error('Failed to update course status. Please try again.');
    }
  };

  // --- Live Inline Editor States ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState('Level 1');
  const [editIsCompulsory, setEditIsCompulsory] = useState(true);
  const [editCertReqs, setEditCertReqs] = useState<string[]>([]);
  const [editQualifyIntro, setEditQualifyIntro] = useState('');
  const [editQualifyReqs, setEditQualifyReqs] = useState<string[]>([]);
  const [editSections, setEditSections] = useState<{ title: string; content: string; items?: SyllabusItem[]; hidden?: boolean }[]>([]);
  const [editDescription, setEditDescription] = useState('');

  // Initialize editor inputs
  const initEditorState = () => {
    setEditName(course.name);
    setEditLevel(course.level || 'Level 1');
    setEditIsCompulsory(course.isCompulsory !== undefined ? course.isCompulsory : true);
    setEditCertReqs([...course.certReqs]);
    setEditQualifyIntro(course.qualifyIntro || '');
    setEditQualifyReqs([...course.qualifyReqs]);
    setEditSections(course.sections.map((s: { title: string; content: string; items?: SyllabusItem[]; hidden?: boolean }) => ({
      title: s.title,
      content: s.content,
      hidden: !!s.hidden,
      items: s.items ? [...s.items.map((i: SyllabusItem) => ({ ...i }))] : []
    })));
    setEditDescription(course.description || '');
  };

  // Turn edit mode on/off
  const toggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
    } else {
      initEditorState();
      setIsEditMode(true);
    }
  };

  // Edit action operations
  const handleAddCertReq = () => setEditCertReqs(prev => [...prev, '']);
  const handleUpdateCertReq = (index: number, val: string) => {
    setEditCertReqs(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };
  const handleRemoveCertReq = (index: number) => setEditCertReqs(prev => prev.filter((_, i) => i !== index));

  const handleAddQualifyReq = () => setEditQualifyReqs(prev => [...prev, '']);
  const handleUpdateQualifyReq = (index: number, val: string) => {
    setEditQualifyReqs(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };
  const handleRemoveQualifyReq = (index: number) => setEditQualifyReqs(prev => prev.filter((_, i) => i !== index));

  const handleAddSection = () => setEditSections(prev => [...prev, { title: '', content: '', items: [], hidden: false }]);
  const handleUpdateSection = (index: number, field: 'title' | 'content', val: string) => {
    setEditSections(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: val
      };
      return copy;
    });
  };
  const handleRemoveSection = (index: number) => setEditSections(prev => prev.filter((_, i) => i !== index));

  // Syllabus resource/activity item management helpers
  const handleAddSyllabusItem = (sectionIdx: number, type: 'resource' | 'assignment' | 'quiz') => {
    setEditSections(prev => {
      const copy = [...prev];
      const section = copy[sectionIdx];
      const items = section.items ? [...section.items] : [];
      
      const newItem: SyllabusItem = {
        id: `item-${Date.now()}`,
        type,
        title: type === 'resource' ? 'Lecture Slide Ch 1' : type === 'assignment' ? 'Lab Assignment Ch 1' : 'Basics Checkpoint Quiz',
        pdfName: type !== 'quiz' ? 'document.pdf' : undefined,
        startDate: type === 'assignment' ? '2026-08-01' : undefined,
        deadline: type === 'assignment' ? '2026-08-15' : undefined,
        deadlineTime: type === 'assignment' ? '23:59' : undefined,
        questionsCount: type === 'quiz' ? 10 : undefined
      };
      
      copy[sectionIdx] = {
        ...section,
        items: [...items, newItem]
      };
      return copy;
    });
  };

  const handleUpdateSyllabusItem = (sectionIdx: number, itemIdx: number, field: keyof SyllabusItem, val: any) => {
    setEditSections(prev => {
      const copy = [...prev];
      const section = copy[sectionIdx];
      const items = section.items ? [...section.items] : [];
      
      items[itemIdx] = {
        ...items[itemIdx],
        [field]: val
      };
      
      copy[sectionIdx] = {
        ...section,
        items
      };
      return copy;
    });
  };

  const handleRemoveSyllabusItem = (sectionIdx: number, itemIdx: number) => {
    setEditSections(prev => {
      const copy = [...prev];
      const section = copy[sectionIdx];
      const items = section.items ? [...section.items] : [];
      
      copy[sectionIdx] = {
        ...section,
        items: items.filter((_, i) => i !== itemIdx)
      };
      return copy;
    });
  };

  // Save changes to localStorage / database
  const handleSaveEdits = async () => {
    if (!editName.trim()) {
      alert('Course name cannot be empty.');
      return;
    }

    const cleanCertReqs = editCertReqs.filter(r => r.trim() !== '');
    const cleanQualifyReqs = editQualifyReqs.filter(q => q.trim() !== '');
    const cleanSections = editSections.filter(s => s.title.trim() !== '');

    const rawKey = courseId || 'ICD110';
    const originalBatchCode = course.code;

    const payload = {
      courseId: rawKey,
      courseName: editName,
      description: editDescription,
      credits: course.credits || 3,
      durationWeeks: course.durationWeeks || 12,
      batchCode: originalBatchCode,
      certReqs: JSON.stringify(cleanCertReqs),
      qualifyIntro: editQualifyIntro,
      qualifyReqs: JSON.stringify(cleanQualifyReqs),
      sections: JSON.stringify(cleanSections),
      level: editLevel,
      isCompulsory: editIsCompulsory
    };

    try {
      setLoading(true);
      await courseService.createCourse(payload);
      alert('Course outline saved successfully!');
      setIsEditMode(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      // Fallback
      const stored = localStorage.getItem('custom_courses');
      const existing: any[] = stored ? JSON.parse(stored) : [];
      const existingIndex = existing.findIndex((c: any) => 
        c.courseId.toUpperCase() === rawKey.toUpperCase() || 
        c.batchCode.toUpperCase() === rawKey.toUpperCase()
      );
      const updatedCourse = {
        ...payload,
        certReqs: cleanCertReqs,
        qualifyReqs: cleanQualifyReqs,
        sections: cleanSections
      };
      if (existingIndex > -1) {
        existing[existingIndex] = updatedCourse;
      } else {
        existing.push(updatedCourse);
      }
      localStorage.setItem('custom_courses', JSON.stringify(existing));
      alert('Course outline saved successfully (simulated fallback)!');
      setIsEditMode(false);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };
  if (loading || !course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-[#E9EDF5] rounded-2xl shadow-sm">
        <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Loading course outline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Dynamic Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-1.5 text-[10px] font-black rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Course
              </button>
              <button
                onClick={toggleEditMode}
                className={`px-4 py-1.5 text-[10px] font-black rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isEditMode
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-[#4F3FF0]/30 hover:bg-[#4F3FF0]/5 text-slate-600 hover:text-[#4F3FF0]'
                }`}
              >
                <Edit2 className="h-3.5 w-3.5" />
                {isEditMode ? 'Cancel Edit' : 'Edit Mode'}
              </button>
            </>
          )}
          <Link 
            to={user?.role?.toUpperCase() === 'ADMIN' 
              ? "/admin/courses-calendars?tab=courses" 
              : user?.role?.toUpperCase() === 'TEACHER' 
                ? "/teacher/courses" 
                : user?.role?.toUpperCase() === 'REVIEWER'
                  ? "/reviewer/courses"
                  : "/student/academics"} 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-650 hover:text-[#4F3FF0] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {user?.role?.toUpperCase() === 'ADMIN' 
              ? "Back to Courses Desk" 
              : user?.role?.toUpperCase() === 'TEACHER' 
                ? "Back to Courses" 
                : user?.role?.toUpperCase() === 'REVIEWER'
                  ? "Back to Courses"
                  : "Back to Academics"}
          </Link>
        </div>
      </div>

      {/* Accordions / Edit panel Container */}
      <div className="space-y-4">
        
        {/* Accordion 1: General */}
        <div className="bg-white border border-[#E9EDF5] rounded-3xl shadow-sm overflow-hidden transition-all duration-200">
          <button
            onClick={() => !isEditMode && toggleSection('general')}
            disabled={isEditMode}
            className={`w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 border-b border-transparent focus:outline-none ${isEditMode ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-2">
              {expandedSections.general || isEditMode ? (
                <ChevronDown className="h-4.5 w-4.5 text-slate-500" />
              ) : (
                <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
              )}
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                General {isEditMode && <span className="text-amber-500 font-bold text-[9px] lowercase tracking-normal bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded ml-2">(Edit mode)</span>}
              </span>
            </div>
          </button>

          {(expandedSections.general || isEditMode) && (
            <div className="p-6 border-t border-[#E9EDF5] space-y-6">
              
              {/* Blue Banner: Edit Mode vs Normal Mode */}
              {isEditMode ? (
                <div className="bg-gradient-to-r from-[#4F3FF0] to-[#6E5DF5] rounded-2xl p-6 text-white relative overflow-hidden flex flex-col gap-4 text-center items-center shadow-lg shadow-[#4F3FF0]/10 select-none">
                  <div className="w-full max-w-xl space-y-1">
                    <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider block text-left">Edit Banner Course Title</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full bg-white/10 text-white font-black text-2xl border border-white/20 px-4 py-2.5 rounded-xl focus:bg-white/20 focus:outline-none text-center outline-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg items-center justify-center">
                    <div className="flex-1 space-y-1 text-left w-full">
                      <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider block">Course Level</label>
                      <select
                        value={editLevel}
                        onChange={e => setEditLevel(e.target.value)}
                        className="w-full bg-white/10 text-white font-bold text-xs border border-white/20 px-3 py-2 rounded-xl focus:bg-white/20 outline-none cursor-pointer"
                      >
                        <option value="Level 1" className="text-slate-800">Level 1</option>
                        <option value="Level 2" className="text-slate-800">Level 2</option>
                        <option value="Level 3" className="text-slate-800">Level 3</option>
                      </select>
                    </div>

                    <div className="flex-1 space-y-1 text-left w-full">
                      <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider block">Course Status</label>
                      <select
                        value={editIsCompulsory ? 'Compulsory' : 'Optional'}
                        onChange={e => setEditIsCompulsory(e.target.value === 'Compulsory')}
                        className="w-full bg-white/10 text-white font-bold text-xs border border-white/20 px-3 py-2 rounded-xl focus:bg-white/20 outline-none cursor-pointer"
                      >
                        <option value="Compulsory" className="text-slate-800">Compulsory</option>
                        <option value="Optional" className="text-slate-800">Optional</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-[#4F3FF0] to-[#6E5DF5] rounded-2xl p-8 text-white relative overflow-hidden flex flex-col items-center justify-center text-center shadow-lg shadow-[#4F3FF0]/10 select-none">
                  <h1 className="text-2xl font-black font-heading tracking-tight max-w-xl leading-tight">
                    {course.name}
                  </h1>
                  <p className="text-white/80 text-[10px] font-extrabold uppercase tracking-widest mt-2">
                    {course.program} | {course.level || 'Level 1'} | {course.isCompulsory ? 'Compulsory Courses' : 'Optional Courses'}
                  </p>
                  {!isAdmin && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                        course.status?.toLowerCase() === 'done'
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                          : 'bg-white/10 border-white/20 text-white/95'
                      }`}>
                        Status: {course.status || 'Ongoing'}
                      </span>
                      <button
                        onClick={handleToggleStatus}
                        className="px-4 py-1.5 bg-white text-[#4F3FF0] font-black text-[10px] rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-md cursor-pointer uppercase tracking-wider"
                      >
                        {course.status?.toLowerCase() === 'done' ? 'Mark as Ongoing' : 'Mark as Done'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Course Description Section */}
              {isEditMode ? (
                <div className="bg-[#F8FAFC] border border-[#E9EDF5] rounded-2xl p-5 space-y-2 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Course Description</label>
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none resize-none min-h-[90px]"
                    placeholder="Enter course description here..."
                  />
                </div>
              ) : (
                course.description && (
                  <div className="bg-[#F8FAFC] border border-[#E9EDF5] rounded-2xl p-5 text-left space-y-1.5 select-none">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Course Description
                    </h4>
                    <p className="text-xs font-semibold text-slate-650 leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                )
              )}

              {/* Requirement Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Certificate Requirements Card */}
                <div className="border border-[#E9EDF5] rounded-2xl p-5 bg-white text-left space-y-4 hover:shadow-md hover:border-slate-350 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-extrabold text-[#4F3FF0] text-[11px] uppercase tracking-wider select-none">
                        Certificate Requirements
                      </h4>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={handleAddCertReq}
                          className="px-2.5 py-1 border border-[#4F3FF0]/25 hover:border-[#4F3FF0]/50 text-[#4F3FF0] hover:bg-[#4F3FF0]/5 text-[9px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </button>
                      )}
                    </div>
                    
                    <ul className="space-y-3.5 text-[11px] font-bold text-slate-700 mt-3">
                      {(isEditMode ? editCertReqs : course.certReqs).map((req: string, idx: number) => (
                        <li key={idx} className="flex gap-2.5 items-start">
                          <Check className="h-4 w-4 text-[#4F3FF0] shrink-0 mt-0.5" />
                          {isEditMode ? (
                            <div className="flex-1 flex gap-1.5 items-center">
                              <input
                                type="text"
                                required
                                value={req}
                                onChange={e => handleUpdateCertReq(idx, e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveCertReq(idx)}
                                className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="leading-relaxed">{req}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Selection Test Requirements Card */}
                <div className="border border-[#E9EDF5] rounded-2xl p-5 bg-white text-left space-y-4 hover:shadow-md hover:border-slate-350 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-extrabold text-[#4F3FF0] text-[11px] uppercase tracking-wider select-none">
                        Requirements to Qualify for Industry Training Selection Test
                      </h4>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={handleAddQualifyReq}
                          className="px-2.5 py-1 border border-[#4F3FF0]/25 hover:border-[#4F3FF0]/50 text-[#4F3FF0] hover:bg-[#4F3FF0]/5 text-[9px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </button>
                      )}
                    </div>

                    <div className="space-y-3.5 mt-3">
                      {isEditMode ? (
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Eligibility Intro</label>
                          <textarea
                            value={editQualifyIntro}
                            onChange={e => setEditQualifyIntro(e.target.value)}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none resize-none h-[60px]"
                          />
                        </div>
                      ) : (
                        <p className="text-[11px] font-semibold text-slate-450 leading-relaxed">
                          {course.qualifyIntro}
                        </p>
                      )}

                      <ul className="space-y-3.5 text-[11px] font-bold text-slate-700">
                        {(isEditMode ? editQualifyReqs : course.qualifyReqs).map((req: string, idx: number) => (
                          <li key={idx} className="flex gap-2.5 items-start">
                            <Check className="h-4 w-4 text-[#4F3FF0] shrink-0 mt-0.5" />
                            {isEditMode ? (
                              <div className="flex-1 flex gap-1.5 items-center">
                                <input
                                  type="text"
                                  required
                                  value={req}
                                  onChange={e => handleUpdateQualifyReq(idx, e.target.value)}
                                  className="flex-1 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveQualifyReq(idx)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="leading-relaxed">{req}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action buttons under general panel */}
              {!isEditMode && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setMarkedDone(prev => !prev)}
                    className={`px-4 py-2 text-[10px] font-extrabold rounded-xl border transition-all cursor-pointer ${
                      markedDone 
                        ? 'bg-[#4F3FF0] text-white border-[#4F3FF0] hover:bg-[#3D2ED0]' 
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {markedDone ? '✓ Marked as done' : 'Mark as done'}
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Dynamic Accordions list block */}
        {isEditMode ? (
          /* Editable Accordion Block list in Edit Mode */
          <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider select-none">
                  Syllabus Dropdown Sections
                </h4>
                <p className="text-slate-450 text-[9px] font-semibold mt-0.5">
                  Configure assignment accordions or course syllabus drop contents.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSection}
                className="px-3 py-1.5 bg-[#4F3FF0] text-white hover:bg-[#3D2ED0] text-[10px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shadow-md shadow-[#4F3FF0]/10"
              >
                <Plus className="h-3 w-3" />
                Add Dropdown Section
              </button>
            </div>

            <div className="space-y-4">
              {editSections.map((sect, idx) => (
                <div key={idx} className={`border rounded-2xl p-5 space-y-4 relative transition-all ${sect.hidden ? 'border-rose-200 bg-rose-50/10 opacity-70' : 'border-slate-150 bg-slate-50/20'}`}>
                  <div className="absolute right-3 top-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditSections(prev => {
                          const copy = [...prev];
                          copy[idx] = { ...copy[idx], hidden: !copy[idx].hidden };
                          return copy;
                        });
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-slate-450 hover:text-slate-700"
                      title={sect.hidden ? "Unhide Section" : "Hide Section"}
                    >
                      {sect.hidden ? <EyeOff className="h-4 w-4 text-rose-500" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(idx)}
                      className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-xl transition-all cursor-pointer"
                      title="Remove Section"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 pr-8 text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Dropdown Title</label>
                      <input
                        type="text"
                        required
                        value={sect.title}
                        onChange={e => handleUpdateSection(idx, 'title', e.target.value)}
                        placeholder="e.g. Assignments / Chapter Details"
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Section Contents</label>
                      <textarea
                        required
                        value={sect.content}
                        onChange={e => handleUpdateSection(idx, 'content', e.target.value)}
                        placeholder="Detail content notes..."
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none min-h-[60px] resize-none"
                      />
                    </div>
                  </div>

                  {/* Syllabus Items List (Resources/Activities) inside Edit Mode */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 text-left">
                    <h5 className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Resources & Activities Planner</h5>
                    
                    {sect.items && sect.items.length > 0 && (
                      <div className="space-y-3 pl-4 border-l-2 border-slate-200">
                        {sect.items.map((item, itemIdx) => (
                          <div key={item.id} className={`bg-white border rounded-xl p-3 flex flex-col gap-2.5 relative shadow-sm transition-all ${item.hidden ? 'border-rose-200 bg-rose-50/5 opacity-70' : 'border-slate-200'}`}>
                            <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateSyllabusItem(idx, itemIdx, 'hidden' as any, !item.hidden)}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-slate-450 hover:text-slate-700"
                                title={item.hidden ? "Unhide Item" : "Hide Item"}
                              >
                                {item.hidden ? <EyeOff className="h-3.5 w-3.5 text-rose-500" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSyllabusItem(idx, itemIdx)}
                                className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pr-8">
                              <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                                item.type === 'resource' 
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200/50' 
                                  : item.type === 'assignment'
                                  ? 'bg-indigo-50 text-[#4F3FF0] border border-indigo-200/50'
                                  : 'bg-amber-50 text-amber-600 border border-amber-250/50'
                              }`}>
                                {item.type}
                              </span>
                              <input
                                type="text"
                                required
                                value={item.title}
                                onChange={e => handleUpdateSyllabusItem(idx, itemIdx, 'title', e.target.value)}
                                placeholder="Item Title"
                                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-[#4F3FF0] rounded-xl text-xs font-bold outline-none"
                              />
                            </div>

                            {/* Conditional fields based on type */}
                            {item.type === 'resource' && (
                              <div className="flex flex-col gap-1.5 text-left">
                                <label className="text-[8px] font-bold text-slate-450 uppercase block">Upload Resource (PDF or Photo)</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    accept=".pdf, image/*"
                                    id={`upload-res-${idx}-${itemIdx}`}
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        const file = e.target.files[0];
                                        handleUpdateSyllabusItem(idx, itemIdx, 'pdfName', file.name);
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          if (event.target?.result) {
                                            handleUpdateSyllabusItem(idx, itemIdx, 'pdfUrl', event.target.result as string);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`upload-res-${idx}-${itemIdx}`}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[10px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                                  >
                                    <Upload className="h-3.5 w-3.5" /> Select File
                                  </label>
                                  {item.pdfName ? (
                                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]" title={item.pdfName}>
                                      📎 {item.pdfName}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-slate-400 italic">No file selected</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {item.type === 'assignment' && (
                              <div className="flex flex-wrap gap-2 text-left pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAssignmentModal(item, idx, itemIdx)}
                                  className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-750 text-[10.5px] font-black rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                                >
                                  ⚙️ Edit settings (modal)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(`${pathPrefix}/courses/${courseId || 'crs0001'}/sections/${idx}/assignments/${item.id}/edit`)}
                                  className="px-3.5 py-1.5 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-[#4F3FF0] hover:text-[#3D2ED0] text-[10.5px] font-black rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                                >
                                  📄 Go to page
                                </button>
                                {item.deadline && (
                                  <div className="w-full text-[9.5px] font-bold text-indigo-500 mt-1">
                                    Current timeline: {item.startDate} &mdash; {item.deadline} {item.deadlineTime ? `| ${item.deadlineTime}` : ''}
                                  </div>
                                )}
                              </div>
                            )}

                            {item.type === 'quiz' && (
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-slate-400 uppercase">Questions Count</label>
                                <input
                                  type="number"
                                  required
                                  value={item.questionsCount || 10}
                                  onChange={e => handleUpdateSyllabusItem(idx, itemIdx, 'questionsCount', Number(e.target.value))}
                                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Add Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleAddSyllabusItem(idx, 'quiz')}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-250/50 text-[9px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" /> Add Quiz
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Normal Collapsed/Expanded Accordion lists */
          course.sections
            .filter((sect: any) => !sect.hidden || isAdmin)
            .map((sect: { title: string; content: string; items?: SyllabusItem[]; hidden?: boolean }, idx: number) => {
            const key = `sect-${idx}`;
            const isExpanded = !!expandedSections[key];
            return (
              <div key={key} className={`bg-white border rounded-3xl shadow-sm overflow-hidden transition-all duration-200 ${sect.hidden ? 'border-rose-200 bg-rose-50/5 opacity-85' : 'border-[#E9EDF5]'}`}>
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer border-b border-transparent focus:outline-none"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4.5 w-4.5 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    )}
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">{sect.title}</span>
                    {sect.hidden && (
                      <span className="text-rose-500 font-extrabold text-[8px] uppercase tracking-normal bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded ml-2">
                        Hidden from students
                      </span>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-6 border-t border-[#E9EDF5] text-left space-y-4">
                    <p className="text-xs text-slate-650 leading-relaxed font-medium">
                      {sect.content}
                    </p>

                    {/* Resources & Activities List View */}
                    {sect.items && sect.items.length > 0 && (
                      <div className="mt-5 space-y-3.5 border-t border-slate-100 pt-5 text-left">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 select-none">
                          Resources & Activities
                        </h5>
                        <div className="grid grid-cols-1 gap-3">
                          {sect.items
                            .filter((item: any) => !item.hidden || isAdmin)
                            .map((item) => (
                            <div key={item.id} className={`border rounded-2xl p-4.5 transition-all duration-200 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center ${item.hidden ? 'border-rose-200/50 bg-rose-50/5 opacity-80' : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/60 hover:border-slate-350'}`}>
                              <div className="flex gap-3 items-start">
                                <div className="mt-0.5 shrink-0">
                                  {item.type === 'resource' ? (
                                    <div className="h-9 w-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
                                      <FileText className="h-4.5 w-4.5" />
                                    </div>
                                  ) : item.type === 'assignment' ? (
                                    <div className="h-9 w-9 bg-indigo-50 text-[#4F3FF0] rounded-xl flex items-center justify-center border border-indigo-100">
                                      <ClipboardList className="h-4.5 w-4.5" />
                                    </div>
                                  ) : (
                                    <div className="h-9 w-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-200">
                                      <HelpCircle className="h-4.5 w-4.5" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-0.5">
                                  <h6 className="font-extrabold text-slate-850 text-xs leading-snug flex items-center gap-1.5">
                                    {item.type === 'resource' ? 'Resource: ' : item.type === 'assignment' ? 'Assignment: ' : 'Quiz: '}
                                    {item.title}
                                    {item.hidden && (
                                      <span className="text-rose-500 font-extrabold text-[7.5px] uppercase tracking-normal bg-rose-50 border border-rose-200/50 px-1.5 py-0.25 rounded">
                                        Hidden
                                      </span>
                                    )}
                                  </h6>
                                  {item.type === 'resource' && (
                                    <div className="space-y-1">
                                      {item.pdfName && <p className="text-[10px] font-bold text-slate-450 uppercase">{item.pdfName}</p>}
                                      {item.pdfUrl && item.pdfUrl.startsWith('data:image/') && (
                                        <div className="mt-2 border border-slate-250 rounded-xl overflow-hidden max-w-sm shadow-sm">
                                          <img src={item.pdfUrl} alt={item.title} className="w-full h-auto object-cover max-h-40" />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {item.type === 'assignment' && (
                                    <div className="space-y-1">
                                      {item.pdfName && <p className="text-[10px] font-bold text-slate-450 uppercase">{item.pdfName}</p>}
                                      <p className="text-[9.5px] font-bold text-indigo-600">
                                        🗓️ Opens: {item.startDate} | ⏳ Deadline: {item.deadline}{item.deadlineTime ? ` | ${item.deadlineTime}` : ''}
                                      </p>
                                      {item.pdfUrl && item.pdfUrl.startsWith('data:image/') && (
                                        <div className="mt-2 border border-slate-250 rounded-xl overflow-hidden max-w-sm shadow-sm">
                                          <img src={item.pdfUrl} alt={item.title} className="w-full h-auto object-cover max-h-40" />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {item.type === 'quiz' && (
                                    <p className="text-[10px] font-bold text-slate-450 uppercase">Questions: {item.questionsCount || 10}</p>
                                  )}
                                </div>
                              </div>

                              <div className="w-full md:w-auto shrink-0 flex flex-col items-end gap-2">
                                {item.type === 'resource' && item.pdfUrl && (
                                  <a
                                    href={item.pdfUrl.startsWith('data:') ? item.pdfUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${item.pdfUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full md:w-auto px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 text-slate-650 text-[10px] font-black rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-slate-500" /> View PDF
                                  </a>
                                )}

                                {item.type === 'quiz' && (
                                  <button
                                    onClick={() => alert(`Starting ${item.title}... Redirecting to quiz engine.`)}
                                    className="w-full md:w-auto px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-700 text-[10px] font-black rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    Start Quiz
                                  </button>
                                )}

                                {item.type === 'assignment' && (
                                  <div className="space-y-2 w-full md:w-auto">
                                    {item.pdfUrl && (
                                      <div className="flex flex-wrap items-center justify-end gap-2">
                                        {(() => {
                                          if (item.pdfUrl.startsWith('[')) {
                                            try {
                                              const files = JSON.parse(item.pdfUrl);
                                              return files.map((file: any, fidx: number) => (
                                                <a
                                                  key={fidx}
                                                  href={file.url.startsWith('data:') ? file.url : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${file.url}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="px-3 py-1 border border-slate-200 hover:border-[#4F3FF0]/20 hover:bg-[#4F3FF0]/5 text-slate-650 hover:text-[#4F3FF0] text-[9.5px] font-black rounded-lg transition-all inline-flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                                  title={`View ${file.name}`}
                                                >
                                                  <Eye className="h-3 w-3" /> {file.name.length > 20 ? `${file.name.substring(0, 18)}...` : file.name}
                                                </a>
                                              ));
                                            } catch (e) {
                                              console.error(e);
                                            }
                                          }
                                          return (
                                            <a
                                              href={item.pdfUrl.startsWith('data:') ? item.pdfUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${item.pdfUrl}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 text-slate-650 text-[10px] font-black rounded-xl transition-all inline-flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                              <Eye className="h-3.5 w-3.5 text-slate-500" /> View PDF
                                            </a>
                                          );
                                        })()}
                                      </div>
                                    )}
                                    
                                    {isAdmin && (
                                       <div className="w-full min-w-[220px]">
                                         <button
                                           onClick={() => handleOpenAdminSubmissions(item)}
                                           className="px-4 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-[9.5px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs w-full"
                                         >
                                           📊 View Submissions & Grade
                                         </button>
                                       </div>
                                     )}

                                    {!isAdmin && (
                                       <div className="w-full min-w-[220px]">
                                         {submissions[item.id] ? (
                                           (() => {
                                             const timeInfo = calculateTimeRemaining(
                                               submissions[item.id].submitDate,
                                               item.deadline,
                                               item.deadlineTime
                                             );
                                             const isLate = !timeInfo.isEarly;
                                             return (
                                               <div 
                                                 onClick={() => handleOpenDetailModal(item)}
                                                 className={`border rounded-xl p-3.5 space-y-2 text-xs font-semibold text-slate-700 text-left cursor-pointer transition-all hover:shadow-sm ${
                                                   isLate 
                                                     ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-100/50' 
                                                     : 'bg-emerald-50/50 border border-emerald-200 hover:bg-emerald-100/60'
                                                 }`}
                                                 title="Click to view submission status details"
                                               >
                                                 <div className="flex justify-between items-center border-b pb-1.5 mb-2 border-slate-100/60">
                                                   <span className={`text-[10px] font-black uppercase ${isLate ? 'text-rose-700' : 'text-emerald-700'}`}>Submission Status</span>
                                                   <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${isLate ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                     {isLate ? 'Submitted Late' : 'Submitted'}
                                                   </span>
                                                 </div>
                                                 <div className="space-y-1 mt-1 text-[11px]">
                                                   <div className="truncate">
                                                     File: {(() => {
                                                       const fileStr = submissions[item.id].submittedFile;
                                                       let fileList: { name: string; url: string }[] = [];
                                                       if (fileStr) {
                                                         if (fileStr.startsWith('[')) {
                                                           try {
                                                             fileList = JSON.parse(fileStr);
                                                           } catch (e) {
                                                             console.error('Error parsing submittedFile JSON:', e);
                                                           }
                                                         } else {
                                                           const name = fileStr.substring(fileStr.indexOf('_') + 1) || 'File';
                                                           fileList = [{ name, url: fileStr }];
                                                         }
                                                       }
                                                       
                                                       if (fileList.length === 0) return <span className="text-slate-400 font-medium">No file</span>;
                                                       
                                                       return fileList.map((f, fIdx) => (
                                                         <a
                                                           key={fIdx}
                                                           href={f.url.startsWith('http') ? f.url : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${f.url}`}
                                                           target="_blank"
                                                           rel="noopener noreferrer"
                                                           onClick={(e) => e.stopPropagation()}
                                                           className="text-[#4F3FF0] hover:underline font-extrabold mr-2 inline-flex items-center gap-0.5"
                                                         >
                                                           📎 {f.name}
                                                         </a>
                                                       ));
                                                     })()}
                                                   </div>
                                                   <div>
                                                     Submitted: <span className="text-slate-850 font-extrabold">{new Date(submissions[item.id].submitDate).toLocaleString()}</span>
                                                   </div>
                                                   {submissions[item.id].marks !== null && (
                                                     <div className="border-t border-slate-100 pt-1.5 mt-1.5">
                                                       Grade: <span className={`${isLate ? 'text-rose-705' : 'text-emerald-750'} font-extrabold`}>{submissions[item.id].marks} / 100</span>
                                                     </div>
                                                   )}
                                                 </div>
                                               </div>
                                             );
                                           })()
                                         ) : (
                                           <div className="flex flex-col gap-2">
                                             <button
                                               onClick={() => handleOpenSubmissionModal(item)}
                                               className="px-4 py-2 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-[9.5px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-sm shadow-[#4F3FF0]/10 w-full"
                                             >
                                               <Upload className="h-3.5 w-3.5" /> Add submission
                                             </button>
                                             {(() => {
                                               const timeInfo = calculateTimeRemainingBeforeSubmit(item.deadline, item.deadlineTime);
                                               if (!timeInfo.text) return null;
                                               return (
                                                 <div className={`text-[9.5px] font-bold text-center mt-1 py-1 rounded-lg ${timeInfo.isOverdue ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                                   ⏳ {timeInfo.text}
                                                 </div>
                                               );
                                             })()}
                                           </div>
                                         )}
                                       </div>
                                     )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}

      </div>

      {/* Edit Mode Save / Cancel bottom bar */}
      {isEditMode && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex items-center justify-between shadow-inner select-none animate-in slide-in-from-bottom duration-250">
          <p className="text-xs font-bold text-slate-500">
            You are editing <span className="text-slate-800 font-extrabold">{course.name}</span>. Save changes to update the module template.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditMode(false)}
              className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleSaveEdits}
              className="px-6 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-lg shadow-[#4F3FF0]/15"
            >
              Save Template Changes
            </button>
          </div>
        </div>
      )}
      {/* Custom Shadcn Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 text-base">Delete Course Template</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Are you sure you want to delete the course template <strong className="text-slate-700">"{course.name}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  try {
                    setLoading(true);
                    
                    // Try deleting from database, ignore if it only exists in local storage
                    await courseService.deleteCourse(courseId || 'ICD110').catch((err) => {
                      console.log("Course template not in database, checking local storage", err);
                    });

                    // Clean up from local storage custom course catalog
                    const stored = localStorage.getItem('custom_courses');
                    if (stored) {
                      const customCourses = JSON.parse(stored);
                      const filtered = customCourses.filter((c: any) => 
                        c.courseId?.toUpperCase() !== courseId?.toUpperCase()
                      );
                      localStorage.setItem('custom_courses', JSON.stringify(filtered));
                    }

                    toast.success('Course deleted successfully!');
                    navigate(
                      user?.role?.toUpperCase() === 'TEACHER' 
                        ? '/teacher/courses' 
                        : user?.role?.toUpperCase() === 'REVIEWER' 
                        ? '/reviewer/courses' 
                        : '/admin/courses-calendars?tab=courses'
                    );
                  } catch (err) {
                    console.error(err);
                    toast.error('Failed to delete course.');
                  } finally {
                    setLoading(false);
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

       {/* Student Assignment Submission Modal */}
      {submissionModalOpen && activeAssignment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-5 text-left animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Add Submission</h3>
                <p className="text-[10px] text-slate-455 font-bold mt-0.5">{activeAssignment.title}</p>
              </div>
              <button 
                onClick={() => {
                  setSubmissionModalOpen(false);
                  setSelectedFiles([]);
                  setIsOwnWorkChecked(false);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* List of currently uploaded submission files */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-455 uppercase block">Your Uploaded Files</label>
                {selectedFiles.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedFiles.map((file, fidx) => (
                      <div key={fidx} className="flex justify-between items-center bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 text-xs font-semibold">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-[#4F3FF0] shrink-0" />
                          <span className="truncate text-slate-700 font-extrabold" title={file.name}>{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFiles(prev => prev.filter((_, i) => i !== fidx));
                          }}
                          className="text-rose-500 hover:text-rose-700 font-black text-[10px] hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10.5px] text-slate-400 italic">No files selected for submission yet.</p>
                )}
              </div>

              {/* Drag and Drop Upload block */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDragOver 
                    ? 'border-[#4F3FF0] bg-[#4F3FF0]/5' 
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const filesArray = Array.from(e.dataTransfer.files);
                    setIsUploadingStudentFiles(true);
                    for (const file of filesArray) {
                      try {
                        const res = await submissionService.uploadFile(file);
                        setSelectedFiles(prev => [...prev, { name: file.name, url: res.fileUrl }]);
                      } catch (err) {
                        console.error('File upload failed', file.name, err);
                        toast.error(`Failed to upload ${file.name}`);
                      }
                    }
                    setIsUploadingStudentFiles(false);
                  }
                }}
              >
                <input 
                  type="file" 
                  multiple
                  id="assignment-file-upload" 
                  className="hidden" 
                  onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const filesArray = Array.from(e.target.files);
                      setIsUploadingStudentFiles(true);
                      for (const file of filesArray) {
                        try {
                          const res = await submissionService.uploadFile(file);
                          setSelectedFiles(prev => [...prev, { name: file.name, url: res.fileUrl }]);
                        } catch (err) {
                          console.error('File upload failed', file.name, err);
                          toast.error(`Failed to upload ${file.name}`);
                        }
                      }
                      setIsUploadingStudentFiles(false);
                    }
                  }}
                />
                
                {isUploadingStudentFiles ? (
                  <div className="space-y-2 py-4">
                    <Loader2 className="h-6 w-6 text-[#4F3FF0] animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Uploading selected files...</p>
                  </div>
                ) : (
                  <label htmlFor="assignment-file-upload" className="cursor-pointer block space-y-3">
                    <div className="mx-auto w-12 h-12 bg-slate-100 border border-slate-200/60 text-slate-455 rounded-full flex items-center justify-center">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-slate-700">Click to select or drag and drop files here</p>
                      <p className="text-[9px] font-bold text-slate-400">Add multiple files up to 100MB each</p>
                    </div>
                  </label>
                )}
              </div>

              <label className="flex items-start gap-2.5 p-3 bg-amber-50/40 border border-amber-200/50 rounded-2xl cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isOwnWorkChecked}
                  onChange={(e) => setIsOwnWorkChecked(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded text-[#4F3FF0] border-slate-300 focus:ring-[#4F3FF0]"
                />
                <span className="text-[10px] leading-tight font-bold text-slate-650">
                  This assignment is my own work, except where I have acknowledged the use of the works of other people. <span className="text-rose-500">*</span>
                </span>
              </label>

            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting || isUploadingStudentFiles}
                onClick={() => {
                  setSubmissionModalOpen(false);
                  setSelectedFiles([]);
                  setIsOwnWorkChecked(false);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || isUploadingStudentFiles || selectedFiles.length === 0 || !isOwnWorkChecked}
                onClick={handleSaveSubmission}
                className="flex-1 px-4 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-[#4F3FF0]/10 flex items-center justify-center gap-1.5 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>

          </div>
        </div>
      )}
      {submissionDetailModalOpen && activeAssignment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-5 text-left animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Submission status</h3>
                <p className="text-[10px] text-slate-450 font-bold mt-0.5">{activeAssignment.title}</p>
              </div>
              <button 
                onClick={() => {
                  setSubmissionDetailModalOpen(false);
                  setActiveAssignmentDetails(null);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-2xl">
              <table className="w-full text-xs font-semibold text-slate-700 border-collapse">
                <tbody>
                  {(() => {
                    const info = calculateTimeRemaining(
                      submissions[activeAssignment.id]?.submitDate, 
                      activeAssignment.deadline, 
                      activeAssignment.deadlineTime
                    );
                    const isLate = !info.isEarly;
                    return (
                      <>
                        <tr className="border-b border-slate-100">
                          <td className="w-1/3 bg-slate-50/70 p-3 border-r border-slate-100 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Submission status</td>
                          <td className={`p-3 font-extrabold ${isLate ? 'bg-rose-50 text-rose-800' : 'bg-[#EBF7EE] text-emerald-800'}`}>
                            {submissions[activeAssignment.id]?.marks !== null ? 'Graded' : (isLate ? 'Submitted for grading (Late)' : 'Submitted for grading')}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="w-1/3 bg-slate-50/70 p-3 border-r border-slate-100 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Grading status</td>
                          <td className="p-3">
                            {submissions[activeAssignment.id]?.marks !== null ? (
                              <span className="text-emerald-700 font-extrabold">Graded ({submissions[activeAssignment.id]?.marks} / 100)</span>
                            ) : (
                              <span className="text-slate-500">Not graded</span>
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="w-1/3 bg-slate-50/70 p-3 border-r border-slate-100 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Time remaining</td>
                          <td className={`p-3 font-semibold ${isLate ? 'bg-rose-50 text-rose-800' : 'bg-[#EBF7EE] text-emerald-800'}`}>
                            {info.text}
                          </td>
                        </tr>
                      </>
                    );
                  })()}
                  <tr className="border-b border-slate-100">
                    <td className="w-1/3 bg-slate-50/70 p-3 border-r border-slate-100 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Last modified</td>
                    <td className="p-3">
                      {submissions[activeAssignment.id]?.submitDate && 
                        new Date(submissions[activeAssignment.id].submitDate).toLocaleString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      }
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/3 bg-slate-50/70 p-3 border-r border-slate-100 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">File submissions</td>
                    <td className="p-3">
                      {(() => {
                        const fileVal = submissions[activeAssignment.id]?.submittedFile;
                        if (fileVal && fileVal.startsWith('[')) {
                          try {
                            const files = JSON.parse(fileVal);
                            return (
                              <div className="space-y-2">
                                {files.map((file: any, fidx: number) => (
                                  <div key={fidx} className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                                    <a 
                                      href={file.url.startsWith('data:') ? file.url : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${file.url}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-[#4F3FF0] hover:underline font-extrabold truncate max-w-xs"
                                      title={file.name}
                                    >
                                      {file.name}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            );
                          } catch (e) {
                            console.error(e);
                          }
                        }
                        return (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-rose-500" />
                            <a 
                              href={fileVal && fileVal.startsWith('data:') ? fileVal : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${fileVal}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[#4F3FF0] hover:underline font-extrabold truncate max-w-xs"
                            >
                              {fileVal?.substring(fileVal.indexOf('_') + 1)}
                            </a>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td className="w-1/3 bg-slate-50/70 p-3 border-r border-slate-100 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Submission comments</td>
                    <td className="p-3 font-semibold text-slate-700">
                      {submissions[activeAssignment.id]?.feedback ? (
                        <span>{submissions[activeAssignment.id].feedback}</span>
                      ) : (
                        <span className="text-slate-400 italic">No feedback comments yet.</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmissionDetailModalOpen(false);
                  setActiveAssignmentDetails(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
              >
                Close
              </button>

              {(() => {
                const isRestricted = activeAssignmentDetails?.cutOffDate && new Date() > new Date(activeAssignmentDetails.cutOffDate);
                
                if (isRestricted) {
                  return (
                    <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 border border-rose-200/50 px-3 py-2 rounded-xl text-[10.5px] font-black">
                      <AlertCircle className="h-4 w-4" /> Editing restricted (cutoff date passed)
                    </div>
                  );
                }

                return (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Delete Submission',
                          message: 'Are you sure you want to delete your submission? This action cannot be undone.',
                          confirmText: 'Delete',
                          cancelText: 'Cancel',
                          isDanger: true,
                          onConfirm: async () => {
                            try {
                              const submissionId = submissions[activeAssignment.id]?.submissionId;
                              if (submissionId) {
                                await api.delete(`/api/v1/assignment-submissions/${submissionId}`);
                                setSubmissions(prev => {
                                  const copy = { ...prev };
                                  delete copy[activeAssignment.id];
                                  return copy;
                                });
                                toast.success("Submission deleted successfully!");
                                setSubmissionDetailModalOpen(false);
                                setActiveAssignmentDetails(null);
                              }
                            } catch (e: any) {
                              console.error("Failed to delete submission", e);
                              toast.error(e.message || "Failed to delete submission.");
                            }
                          }
                        });
                      }}
                      className="px-4 py-2.5 border border-rose-250 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm inline-flex items-center justify-center gap-1"
                    >
                      Remove submission
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Update Submission Time',
                          message: 'If you modify your submission, your submission date/time will be updated to the current time. Do you want to proceed?',
                          confirmText: 'Yes, proceed',
                          cancelText: 'Cancel',
                          isDanger: false,
                          onConfirm: () => {
                            setSubmissionDetailModalOpen(false);
                            
                            let currentFiles: any[] = [];
                            const sub = submissions[activeAssignment.id];
                            if (sub && sub.submittedFile) {
                              if (sub.submittedFile.startsWith('[')) {
                                try {
                                  currentFiles = JSON.parse(sub.submittedFile);
                                } catch (e) {
                                  currentFiles = [{ name: sub.submittedFile.substring(sub.submittedFile.indexOf('_') + 1) || 'File', url: sub.submittedFile }];
                                }
                              } else {
                                currentFiles = [{ name: sub.submittedFile.substring(sub.submittedFile.indexOf('_') + 1) || 'File', url: sub.submittedFile }];
                              }
                            }
                            setSelectedFiles(currentFiles);
                            setIsOwnWorkChecked(false);
                            setSubmissionModalOpen(true);
                          }
                        });
                      }}
                      className="px-5 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-[#4F3FF0]/10 flex items-center gap-1.5"
                    >
                      Change submission
                    </button>
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[60] animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-4 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-6 w-6 shrink-0 ${confirmModal.isDanger ? 'text-rose-500' : 'text-amber-500'}`} />
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">{confirmModal.title}</h4>
            </div>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  confirmModal.onConfirm();
                }}
                className={`flex-1 px-4 py-2 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm ${
                  confirmModal.isDanger 
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-100' 
                    : 'bg-[#4F3FF0] hover:bg-[#3D2ED0] shadow-[#4F3FF0]/10'
                }`}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Settings Modal */}
      {editAssignmentModalOpen && editingAssignmentData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-5 text-left animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Assignment Settings</h3>
                <p className="text-[10px] text-slate-450 font-bold mt-0.5">{editingAssignmentData.title}</p>
              </div>
              <button 
                onClick={() => {
                  setEditAssignmentModalOpen(false);
                  setEditingAssignmentData(null);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-455 uppercase block">Allow submissions from</label>
                <input 
                  type="datetime-local" 
                  value={formatDatetimeLocal(editingAssignmentData.allowSubmissionsFrom)}
                  onChange={(e) => setEditingAssignmentData((prev: any) => ({ ...prev, allowSubmissionsFrom: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-455 uppercase block">Due date</label>
                <input 
                  type="datetime-local" 
                  value={formatDatetimeLocal(editingAssignmentData.dueDate)}
                  onChange={(e) => setEditingAssignmentData((prev: any) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-455 uppercase block">Cut-off date</label>
                <input 
                  type="datetime-local" 
                  disabled={!editingAssignmentData.enableCutoff}
                  value={formatDatetimeLocal(editingAssignmentData.cutOffDate)}
                  onChange={(e) => setEditingAssignmentData((prev: any) => ({ ...prev, cutOffDate: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input 
                  type="checkbox" 
                  id="enable-cutoff"
                  checked={!!editingAssignmentData.enableCutoff}
                  onChange={(e) => setEditingAssignmentData((prev: any) => ({ ...prev, enableCutoff: e.target.checked }))}
                  className="h-4 w-4 text-[#4F3FF0] border-slate-300 rounded focus:ring-[#4F3FF0]"
                />
                <label htmlFor="enable-cutoff" className="text-[10px] font-bold text-slate-600 uppercase cursor-pointer select-none">Enable cut-off date</label>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-455 uppercase block">Max file size (MB)</label>
                <input 
                  type="number" 
                  value={editingAssignmentData.maxFileSize || 50}
                  onChange={(e) => setEditingAssignmentData((prev: any) => ({ ...prev, maxFileSize: parseInt(e.target.value) || 50 }))}
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-455 uppercase block">Submission types</label>
                <select 
                  value={editingAssignmentData.submissionTypes || 'FILE_UPLOAD'}
                  onChange={(e) => setEditingAssignmentData((prev: any) => ({ ...prev, submissionTypes: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none"
                >
                  <option value="FILE_UPLOAD">File submission</option>
                  <option value="ONLINE_TEXT">Online text</option>
                  <option value="BOTH">File & Online text</option>
                </select>
              </div>

            </div>

            {/* Additional Files Section */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <label className="text-[9px] font-bold text-slate-455 uppercase block">Additional Files</label>
              
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {editingAssignmentData.files && editingAssignmentData.files.length > 0 ? (
                  editingAssignmentData.files.map((file: any, fidx: number) => (
                    <div key={fidx} className="flex justify-between items-center bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-3.5 w-3.5 text-rose-505 shrink-0" />
                        <span className="font-extrabold text-slate-700 truncate" title={file.name}>{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAssignmentData((prev: any) => ({
                            ...prev,
                            files: prev.files.filter((_: any, i: number) => i !== fidx)
                          }));
                        }}
                        className="text-rose-500 hover:text-rose-700 font-black text-[10px] hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-450 italic">No files uploaded yet.</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="file"
                  multiple
                  id="modal-assignment-files"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const filesArray = Array.from(e.target.files);
                      const uploadedFilesList = [...(editingAssignmentData.files || [])];
                      
                      for (const file of filesArray) {
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          
                          const uploadRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/assignments/upload-file`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('edusys_token')}`
                            },
                            body: formData
                          });
                          if (!uploadRes.ok) {
                            throw new Error('Upload failed');
                          }
                          const res = await uploadRes.json();
                          if (res && res.fileUrl) {
                            uploadedFilesList.push({
                              name: file.name,
                              url: res.fileUrl
                            });
                          }
                        } catch (err) {
                          console.error('Failed to upload file:', file.name, err);
                          toast.error(`Failed to upload ${file.name}`);
                        }
                      }
                      
                      setEditingAssignmentData((prev: any) => ({
                        ...prev,
                        files: uploadedFilesList
                      }));
                    }
                  }}
                />
                <label 
                  htmlFor="modal-assignment-files"
                  className="px-3.5 py-1.5 border border-dashed border-[#4F3FF0]/30 hover:border-[#4F3FF0] hover:bg-[#4F3FF0]/5 text-[#4F3FF0] text-[10.5px] font-black rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  ➕ Add Files (Multiple)
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={savingAssignmentSettings}
                onClick={() => {
                  setEditAssignmentModalOpen(false);
                  setEditingAssignmentData(null);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingAssignmentSettings}
                onClick={async () => {
                  try {
                    setSavingAssignmentSettings(true);
                    
                    const submissionTypeFile = editingAssignmentData.submissionTypes === 'FILE_UPLOAD' || editingAssignmentData.submissionTypes === 'BOTH';
                    const submissionTypeOnlineText = editingAssignmentData.submissionTypes === 'ONLINE_TEXT' || editingAssignmentData.submissionTypes === 'BOTH';
                    const filesList = editingAssignmentData.files || [];

                    const payload = {
                      assignmentId: editingAssignmentData.assignmentId,
                      title: editingAssignmentData.title,
                      description: editingAssignmentData.description || '',
                      allowSubmissionsFrom: editingAssignmentData.allowSubmissionsFrom || null,
                      dueDate: editingAssignmentData.dueDate || null,
                      cutOffDate: editingAssignmentData.enableCutoff ? (editingAssignmentData.cutOffDate || null) : null,
                      submissionTypeFile,
                      submissionTypeOnlineText,
                      maxSize: `${editingAssignmentData.maxFileSize || 50}MB`,
                      displayDescription: !!editingAssignmentData.displayDescription,
                      alwaysShowDescription: !!editingAssignmentData.alwaysShowDescription,
                      onlyShowFiles: !!editingAssignmentData.onlyShowFiles,
                      activityInstructions: editingAssignmentData.activityInstructions || '',
                      maxFiles: editingAssignmentData.maxFiles || 1,
                      additionalFileName: filesList.length > 0 ? filesList[0].name : '',
                      additionalFileUrl: JSON.stringify(filesList)
                    };

                    await api.post('/api/v1/assignments', payload);

                    setEditSections(prev => {
                      const copy = [...prev];
                      const section = copy[editingAssignmentData.sectionIdx];
                      const items = section.items ? [...section.items] : [];
                      
                      const startDateVal = payload.allowSubmissionsFrom ? payload.allowSubmissionsFrom.split('T')[0] : undefined;
                      const deadlineVal = payload.dueDate ? payload.dueDate.split('T')[0] : undefined;
                      const deadlineTimeVal = payload.dueDate ? payload.dueDate.split('T')[1]?.substring(0, 5) : undefined;

                      items[editingAssignmentData.itemIdx] = {
                        ...items[editingAssignmentData.itemIdx],
                        startDate: startDateVal,
                        deadline: deadlineVal,
                        deadlineTime: deadlineTimeVal,
                        pdfName: payload.additionalFileName,
                        pdfUrl: payload.additionalFileUrl
                      };

                      copy[editingAssignmentData.sectionIdx] = {
                        ...section,
                        items
                      };
                      return copy;
                    });

                    toast.success('Assignment settings saved successfully!');
                    setEditAssignmentModalOpen(false);
                    setEditingAssignmentData(null);
                  } catch (err: any) {
                    console.error(err);
                    toast.error(err.message || 'Failed to save assignment settings.');
                  } finally {
                    setSavingAssignmentSettings(false);
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-[#4F3FF0]/10 flex items-center justify-center gap-1.5"
              >
                {savingAssignmentSettings ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Admin Assignment Submission Details Page/Modal */}
      {adminAssignmentDetailsModalOpen && adminActiveItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-auto overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-6 text-left my-8 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{course?.name || 'Course'}</h2>
                <h3 className="text-sm font-bold text-slate-500 mt-1">{adminActiveItem.title}</h3>
              </div>
              <button 
                onClick={() => setAdminAssignmentDetailsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dates & File Attachments Box */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-2 text-xs font-semibold text-slate-655">
              <div>
                <span className="font-extrabold text-slate-800">Opened:</span> {formatMoodleDate(adminActiveItemDetails?.allowSubmissionsFrom || adminActiveItem.startDate)}
              </div>
              <div>
                <span className="font-extrabold text-slate-800">Due:</span> {formatMoodleDate(adminActiveItemDetails?.dueDate || adminActiveItem.deadline)}
              </div>
              
              {adminActiveItem.pdfUrl && (
                <div className="pt-2 border-t border-slate-200/50 mt-2 flex flex-wrap gap-2">
                  {(() => {
                    const pdfUrl = adminActiveItem.pdfUrl;
                    if (pdfUrl.startsWith('[')) {
                      try {
                        const files = JSON.parse(pdfUrl);
                        return files.map((file: any, fidx: number) => (
                          <a 
                            key={fidx}
                            href={file.url.startsWith('data:') ? file.url : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${file.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:border-[#4F3FF0] hover:text-[#4F3FF0] px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-colors"
                          >
                            <FileText className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                            {file.name}
                          </a>
                        ));
                      } catch (e) {}
                    }
                    return (
                      <a 
                        href={pdfUrl.startsWith('data:') ? pdfUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${pdfUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:border-[#4F3FF0] hover:text-[#4F3FF0] px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-rose-505 shrink-0" />
                        {adminActiveItem.pdfName || 'Assignment PDF'}
                      </a>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAdminViewSubmissionsModalOpen(true);
                }}
                className="px-5 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-[#4F3FF0]/10"
              >
                View all submissions
              </button>
              <button
                onClick={() => {
                  if (adminStudents.length > 0) {
                    const firstStudent = adminStudents[0];
                    setAdminActiveStudent(firstStudent);
                    const sub = adminSubmissions.find(s => s.studentId === firstStudent.userId);
                    setGradeInput(sub?.marks !== undefined && sub?.marks !== null ? sub.marks.toString() : '');
                    setFeedbackInput(sub?.feedback || '');
                    setAdminGradeStudentModalOpen(true);
                  } else {
                    toast.error('No students enrolled in this course.');
                  }
                }}
                className="px-5 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-[#4F3FF0]/10"
              >
                Grade
              </button>
            </div>

            {/* Grading Summary Table */}
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Grading summary</h3>
              <div className="overflow-hidden border border-slate-200 rounded-2xl">
                <table className="w-full text-xs font-semibold text-slate-700 border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="w-1/3 bg-slate-50/70 p-3 border-r border-slate-100 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Hidden from students</td>
                      <td className="p-3">{adminActiveItem.hidden ? 'Yes' : 'No'}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="w-1/3 bg-slate-50/70 p-3 border-r border-slate-100 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Participants</td>
                      <td className="p-3">{adminStudents.length}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="w-1/3 bg-slate-50/70 p-3 border-r border-slate-100 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Submitted</td>
                      <td className="p-3">{adminSubmissions.filter(s => s.submittedFile && s.submittedFile !== '[]').length}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="w-1/3 bg-slate-50/70 p-3 border-r border-slate-100 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Needs grading</td>
                      <td className="p-3">{adminSubmissions.filter(s => s.marks === null || s.marks === undefined).length}</td>
                    </tr>
                    <tr>
                      <td className="w-1/3 bg-slate-50/70 p-3 border-r border-slate-100 font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Time remaining</td>
                      <td className="p-3">
                        {(() => {
                          const info = calculateTimeRemainingBeforeSubmit(adminActiveItemDetails?.dueDate || adminActiveItem.deadline, adminActiveItemDetails?.dueDate ? undefined : adminActiveItem.deadlineTime);
                          return info.isOverdue ? 'Assignment is due' : info.text;
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Close */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAdminAssignmentDetailsModalOpen(false)}
                className="px-5 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* View All Submissions Modal */}
      {adminViewSubmissionsModalOpen && adminActiveItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-auto overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-6xl w-full mx-4 shadow-xl border border-[#E9EDF5] text-left my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] relative">
            <button 
              onClick={() => setAdminViewSubmissionsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer z-50"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            
            <SubmissionsTable
              title="Submissions"
              subtitle={adminActiveItem.title}
              students={adminStudents}
              submissions={adminSubmissions}
              isCareerScale={false}
              onReview={(student, sub) => {
                setAdminActiveStudent(student);
                setGradeInput(sub?.marks !== undefined && sub?.marks !== null ? sub.marks.toString() : '');
                setFeedbackInput(sub?.feedback || '');
                setAdminGradeStudentModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Grade student popup modal */}
      {adminGradeStudentModalOpen && adminActiveItem && adminActiveStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[60] animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full mx-4 shadow-2xl border border-[#E9EDF5] space-y-5 text-left animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Grade</h3>
                <p className="text-[10px] text-slate-455 font-bold mt-0.5">{adminActiveStudent.fullName}</p>
              </div>
              <button 
                onClick={() => setAdminGradeStudentModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Grade Out of 100 */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase block">Grade out of 100</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold"
                  placeholder="Enter grade (e.g. 85.00)"
                />
              </div>

              {/* Current grade in gradebook */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-455 uppercase block text-[10px]">Current grade in gradebook</span>
                <p className="font-black text-[#4F3FF0]">
                  {(() => {
                    const sub = adminSubmissions.find(s => s.studentId === adminActiveStudent.userId);
                    return sub?.marks !== undefined && sub?.marks !== null ? `Graded (${sub.marks} / 100)` : 'Not graded';
                  })()}
                </p>
              </div>

              {/* Feedback Comments */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase block">Feedback comments</label>
                <textarea
                  rows={4}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-[#4F3FF0] rounded-xl outline-none text-xs font-semibold"
                  placeholder="Type feedback comment here..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdminGradeStudentModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveGrade}
                className="flex-1 px-4 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-[#4F3FF0]/10 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default StudentCourseDetail;
