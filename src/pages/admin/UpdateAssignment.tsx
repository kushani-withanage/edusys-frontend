import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Loader2, 
  Calendar, 
  FileText, 
  Clock, 
  Save
} from 'lucide-react';
import { api } from '@/utils/api';
import { courseService } from '@/services/courseService';
import { toast } from '@/utils/toast';

const safeParseJson = (data: any, defaultValue: any = []) => {
  if (!data) return defaultValue;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return defaultValue;
  }
};

export const UpdateAssignment: React.FC = () => {
  const { courseId, sectionIdx, assignmentId } = useParams<{ 
    courseId: string; 
    sectionIdx: string; 
    assignmentId?: string; 
  }>();
  
  const navigate = useNavigate();
  const isEditMode = !!assignmentId;

  // --- Core States ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<any | null>(null);

  // --- Form Fields ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [displayDescription, setDisplayDescription] = useState(false);
  const [activityInstructions, setActivityInstructions] = useState('');
  
  // Files
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [onlyShowFiles, setOnlyShowFiles] = useState(false);

  // Availability
  const [allowFromDate, setAllowFromDate] = useState('2026-08-01');
  const [allowFromTime, setAllowFromTime] = useState('09:00');
  
  const [dueDate, setDueDate] = useState('2026-08-15');
  const [dueTime, setDueTime] = useState('23:59');

  const [cutoffDate, setCutoffDate] = useState('');
  const [cutoffTime, setCutoffTime] = useState('23:59');
  const [enableCutoff, setEnableCutoff] = useState(false);

  const [remindDate, setRemindDate] = useState('');
  const [remindTime, setRemindTime] = useState('09:00');
  const [enableRemind, setEnableRemind] = useState(false);

  const [alwaysShowDescription, setAlwaysShowDescription] = useState(false);

  // Submission types
  const [subTypeOnlineText, setSubTypeOnlineText] = useState(false);
  const [subTypeFile, setSubTypeFile] = useState(true);
  const [maxFiles, setMaxFiles] = useState(1);
  const [maxSize, setMaxSize] = useState('250MB');

  // Load Course and Assignment
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (!courseId) return;
        
        // 1. Fetch course details
        const dbCourse = await courseService.getCourse(courseId);
        if (dbCourse) {
          setCourse(dbCourse);
        } else {
          toast.error('Course not found');
          navigate(`/admin/courses/${courseId}`);
          return;
        }

        // 2. Fetch assignment if editing
        if (isEditMode && assignmentId) {
          const assign = await api.get<any>(`/api/v1/assignments/${assignmentId}`);
          if (assign) {
            setTitle(assign.title || '');
            setDescription(assign.description || '');
            setDisplayDescription(!!assign.displayDescription);
            setActivityInstructions(assign.activityInstructions || '');
            if (assign.additionalFileName && assign.additionalFileUrl) {
              setUploadedFile({
                name: assign.additionalFileName,
                url: assign.additionalFileUrl
              });
            }
            setOnlyShowFiles(!!assign.onlyShowFiles);

            // Allow submissions from
            if (assign.allowSubmissionsFrom) {
              const [d, t] = assign.allowSubmissionsFrom.split('T');
              setAllowFromDate(d || '');
              setAllowFromTime(t ? t.substring(0, 5) : '09:00');
            }

            // Due Date
            if (assign.dueDate) {
              const [d, t] = assign.dueDate.split('T');
              setDueDate(d || '');
              setDueTime(t ? t.substring(0, 5) : '23:59');
            }

            // Cut-off Date
            if (assign.cutOffDate) {
              const [d, t] = assign.cutOffDate.split('T');
              setCutoffDate(d || '');
              setCutoffTime(t ? t.substring(0, 5) : '23:59');
              setEnableCutoff(true);
            }

            // Remind Date
            if (assign.remindGradeBy) {
              const [d, t] = assign.remindGradeBy.split('T');
              setRemindDate(d || '');
              setRemindTime(t ? t.substring(0, 5) : '09:00');
              setEnableRemind(true);
            }

            setAlwaysShowDescription(!!assign.alwaysShowDescription);
            setSubTypeOnlineText(!!assign.submissionTypeOnlineText);
            setSubTypeFile(!!assign.submissionTypeFile);
            setMaxFiles(assign.maxFiles || 1);
            setMaxSize(assign.maxSize || '250MB');
          }
        }
      } catch (err) {
        console.error('Error loading assignment/course data:', err);
        toast.error('Failed to load assignment detail.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, assignmentId, isEditMode, navigate]);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      // Upload via backend endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/assignments/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('edusys_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const data = await response.json();
      setUploadedFile({
        name: file.name,
        url: data.fileUrl
      });
      toast.success('File uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload file.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Remove File
  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  // Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Assignment title is required.');
      return;
    }

    if (!subTypeOnlineText && !subTypeFile) {
      toast.error('You must enable at least one submission type.');
      return;
    }

    try {
      setSaving(true);

      // Construct LocalDateTime strings
      const allowFromStr = allowFromDate ? `${allowFromDate}T${allowFromTime}:00` : null;
      const dueStr = dueDate ? `${dueDate}T${dueTime}:00` : null;
      const cutoffStr = enableCutoff && cutoffDate ? `${cutoffDate}T${cutoffTime}:00` : null;
      const remindStr = enableRemind && remindDate ? `${remindDate}T${remindTime}:00` : null;

      const assignmentPayload = {
        title,
        description,
        displayDescription,
        activityInstructions,
        additionalFileName: uploadedFile?.name || null,
        additionalFileUrl: uploadedFile?.url || null,
        onlyShowFiles,
        allowSubmissionsFrom: allowFromStr,
        dueDate: dueStr,
        cutOffDate: cutoffStr,
        remindGradeBy: remindStr,
        alwaysShowDescription,
        submissionTypeOnlineText: subTypeOnlineText,
        submissionTypeFile: subTypeFile,
        maxFiles,
        maxSize
      };

      let savedAssignment: any;

      if (isEditMode && assignmentId) {
        // Update existing assignment
        savedAssignment = await api.put<any>(`/api/v1/assignments/${assignmentId}`, assignmentPayload);
      } else {
        // Create new assignment
        savedAssignment = await api.post<any>('/api/v1/assignments', assignmentPayload);
      }

      if (!savedAssignment) {
        throw new Error('Failed to save assignment to database.');
      }

      // 3. Update course sections with the syllabus item representing this assignment
      const originalSections = safeParseJson(course.sections);
      const targetSectIdx = Number(sectionIdx);

      if (isNaN(targetSectIdx) || !originalSections[targetSectIdx]) {
        throw new Error('Invalid section index.');
      }

      const section = originalSections[targetSectIdx];
      const items = section.items ? [...section.items] : [];

      const targetSyllabusItem = {
        id: savedAssignment.assignmentId,
        type: 'assignment' as const,
        title: savedAssignment.title,
        pdfName: savedAssignment.additionalFileName || undefined,
        pdfUrl: savedAssignment.additionalFileUrl || undefined,
        startDate: savedAssignment.allowSubmissionsFrom ? savedAssignment.allowSubmissionsFrom.split('T')[0] : undefined,
        deadline: savedAssignment.dueDate ? savedAssignment.dueDate.split('T')[0] : undefined,
        deadlineTime: savedAssignment.dueDate ? savedAssignment.dueDate.split('T')[1]?.substring(0, 5) : undefined
      };

      if (isEditMode) {
        // Replace existing item
        const itemIndex = items.findIndex((i: any) => i.id === assignmentId);
        if (itemIndex > -1) {
          items[itemIndex] = targetSyllabusItem;
        } else {
          items.push(targetSyllabusItem);
        }
      } else {
        // Add new item
        items.push(targetSyllabusItem);
      }

      originalSections[targetSectIdx] = {
        ...section,
        items
      };

      // 4. Update the course outline back to backend
      const coursePayload = {
        courseId: course.courseId,
        courseName: course.courseName,
        description: course.description,
        credits: course.credits,
        durationWeeks: course.durationWeeks,
        batchCode: course.batchCode,
        certReqs: typeof course.certReqs === 'string' ? course.certReqs : JSON.stringify(course.certReqs || []),
        qualifyIntro: course.qualifyIntro,
        qualifyReqs: typeof course.qualifyReqs === 'string' ? course.qualifyReqs : JSON.stringify(course.qualifyReqs || []),
        sections: JSON.stringify(originalSections),
        level: course.level,
        isCompulsory: course.isCompulsory
      };

      await courseService.createCourse(coursePayload);

      toast.success(isEditMode ? 'Assignment updated successfully!' : 'Assignment created successfully!');
      navigate(`/admin/courses/${courseId}`);
    } catch (err: any) {
      console.error('Error saving assignment:', err);
      toast.error(err.message || 'Failed to save assignment details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-2.5">
          <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
          <span className="text-xs font-bold text-slate-500">Loading assignment editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans select-none text-left">
      {/* Header Banner */}
      <div className="bg-white border-b border-[#E9EDF5] sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to={`/admin/courses/${courseId}`} 
              className="p-2 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div>
              <span className="text-[10px] font-black text-[#4F3FF0] uppercase tracking-widest block">
                {course?.courseName || 'Course'} &gt; Section {Number(sectionIdx) + 1}
              </span>
              <h1 className="text-lg font-black text-slate-800 tracking-tight mt-0.5">
                {isEditMode ? 'Updating Assignment in Course' : 'Add New Assignment'}
              </h1>
            </div>
          </div>

          <button
            type="submit"
            form="assignment-form"
            disabled={saving}
            className="px-5 py-2 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md shadow-[#4F3FF0]/10 flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditMode ? 'Save Changes' : 'Create Assignment'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-6 px-4">
        <form id="assignment-form" onSubmit={handleSave} className="space-y-6">
          
          {/* GENERAL SECTION */}
          <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#4F3FF0] rounded-full block"></span>
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">General settings</h3>
            </div>

            {/* Assignment Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Assignment name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Updating Assignment in ER diagrams"
                className="w-full px-4 py-2.5 bg-slate-50 border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief summary introducing the assignment..."
                className="w-full px-4 py-3 bg-slate-50 border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none min-h-[100px] resize-none"
              />
              <div className="flex items-center gap-2 pt-1 select-none">
                <input
                  type="checkbox"
                  id="displayDesc"
                  checked={displayDescription}
                  onChange={e => setDisplayDescription(e.target.checked)}
                  className="rounded border-slate-300 text-[#4F3FF0] focus:ring-[#4F3FF0] cursor-pointer"
                />
                <label htmlFor="displayDesc" className="text-[10.5px] font-bold text-slate-500 cursor-pointer">
                  Display description on course page
                </label>
              </div>
            </div>

            {/* Activity Instructions */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Activity instructions</label>
              <textarea
                value={activityInstructions}
                onChange={e => setActivityInstructions(e.target.value)}
                placeholder="Detailed instructions that students will see when submitting..."
                className="w-full px-4 py-3 bg-slate-50 border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none min-h-[120px] resize-none"
              />
            </div>

            {/* Additional Files Zone */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block font-heading">
                Additional files
              </label>

              {uploadedFile ? (
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-750 truncate max-w-[250px]" title={uploadedFile.name}>
                        {uploadedFile.name}
                      </p>
                      <a 
                        href={uploadedFile.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[10px] font-bold text-[#4F3FF0] hover:underline"
                      >
                        Preview uploaded file
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-[#E2E8F0] hover:border-[#4F3FF0] rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center bg-slate-50/50">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.zip,.png,.jpg"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploadingFile}
                  />
                  {uploadingFile ? (
                    <div className="space-y-1">
                      <Loader2 className="h-7 w-7 text-[#4F3FF0] animate-spin mx-auto" />
                      <p className="text-[10px] font-black text-slate-500">Uploading file...</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-7 w-7 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Drag & drop files or click to upload</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Max size: 250MB (PDF, DOC, ZIP)</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1.5 select-none">
                <input
                  type="checkbox"
                  id="onlyShowFiles"
                  checked={onlyShowFiles}
                  onChange={e => setOnlyShowFiles(e.target.checked)}
                  className="rounded border-slate-300 text-[#4F3FF0] focus:ring-[#4F3FF0] cursor-pointer"
                />
                <label htmlFor="onlyShowFiles" className="text-[10.5px] font-bold text-slate-500 cursor-pointer">
                  Only show files during submission
                </label>
              </div>
            </div>
          </div>

          {/* AVAILABILITY SECTION */}
          <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#4F3FF0] rounded-full block"></span>
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Availability</h3>
            </div>

            {/* Grid of Dates */}
            <div className="space-y-4">
              {/* Allow submissions from */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#4F3FF0]" /> Allow submissions from
                </label>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={allowFromDate}
                    onChange={e => setAllowFromDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                  />
                  <input
                    type="time"
                    value={allowFromTime}
                    onChange={e => setAllowFromTime(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Due date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-amber-500" /> Due date
                </label>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                  />
                  <input
                    type="time"
                    value={dueTime}
                    onChange={e => setDueTime(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Cut-off date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableCutoff"
                    checked={enableCutoff}
                    onChange={e => setEnableCutoff(e.target.checked)}
                    className="rounded border-slate-300 text-[#4F3FF0] focus:ring-[#4F3FF0] cursor-pointer"
                  />
                  <label htmlFor="enableCutoff" className="text-[10px] font-black text-slate-600 uppercase tracking-wide cursor-pointer flex items-center gap-1">
                    Cut-off date
                  </label>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    disabled={!enableCutoff}
                    value={cutoffDate}
                    onChange={e => setCutoffDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  />
                  <input
                    type="time"
                    disabled={!enableCutoff}
                    value={cutoffTime}
                    onChange={e => setCutoffTime(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  />
                </div>
              </div>

              {/* Remind me to grade by */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableRemind"
                    checked={enableRemind}
                    onChange={e => setEnableRemind(e.target.checked)}
                    className="rounded border-slate-300 text-[#4F3FF0] focus:ring-[#4F3FF0] cursor-pointer"
                  />
                  <label htmlFor="enableRemind" className="text-[10px] font-black text-slate-600 uppercase tracking-wide cursor-pointer flex items-center gap-1">
                    Remind me to grade by
                  </label>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    disabled={!enableRemind}
                    value={remindDate}
                    onChange={e => setRemindDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  />
                  <input
                    type="time"
                    disabled={!enableRemind}
                    value={remindTime}
                    onChange={e => setRemindTime(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  />
                </div>
              </div>

              {/* Always show description */}
              <div className="flex items-center gap-2 pt-2 select-none border-t border-slate-100">
                <input
                  type="checkbox"
                  id="alwaysShowDesc"
                  checked={alwaysShowDescription}
                  onChange={e => setAlwaysShowDescription(e.target.checked)}
                  className="rounded border-slate-300 text-[#4F3FF0] focus:ring-[#4F3FF0] cursor-pointer"
                />
                <label htmlFor="alwaysShowDesc" className="text-[10.5px] font-bold text-slate-500 cursor-pointer">
                  Always show description (otherwise only shown from start date)
                </label>
              </div>
            </div>
          </div>

          {/* SUBMISSION TYPES */}
          <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#4F3FF0] rounded-full block"></span>
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Submission types</h3>
            </div>

            <div className="space-y-4">
              {/* Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide block">
                  Submission types
                </span>
                <div className="col-span-2 flex flex-col gap-2.5 select-none">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="onlineText"
                      checked={subTypeOnlineText}
                      onChange={e => setSubTypeOnlineText(e.target.checked)}
                      className="rounded border-slate-300 text-[#4F3FF0] focus:ring-[#4F3FF0] cursor-pointer"
                    />
                    <label htmlFor="onlineText" className="text-[11px] font-bold text-slate-650 cursor-pointer">
                      Online text
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fileSub"
                      checked={subTypeFile}
                      onChange={e => setSubTypeFile(e.target.checked)}
                      className="rounded border-slate-300 text-[#4F3FF0] focus:ring-[#4F3FF0] cursor-pointer"
                    />
                    <label htmlFor="fileSub" className="text-[11px] font-bold text-slate-650 cursor-pointer">
                      File submissions
                    </label>
                  </div>
                </div>
              </div>

              {/* Max uploaded files */}
              {subTypeFile && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-3 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
                      Maximum number of uploaded files
                    </label>
                    <select
                      value={maxFiles}
                      onChange={e => setMaxFiles(Number(e.target.value))}
                      className="w-full sm:w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer text-slate-700"
                    >
                      {[1, 2, 3, 4, 5, 10, 20].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  {/* Max size */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
                      Maximum submission size
                    </label>
                    <select
                      value={maxSize}
                      onChange={e => setMaxSize(e.target.value)}
                      className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer text-slate-700"
                    >
                      {['10KB', '50KB', '1MB', '2MB', '5MB', '10MB', '50MB', '100MB', '250MB'].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateAssignment;
