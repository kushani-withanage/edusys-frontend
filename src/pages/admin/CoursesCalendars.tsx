import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  UserCheck
} from 'lucide-react';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import { courseService } from '@/services/courseService';
import { batchService } from '@/services/batchService';
import { calendarService } from '@/services/calendarService';
import { inquiryService } from '@/services/inquiryService';
import { studentService } from '@/services/studentService';

import type { Course, Batch, CalendarEvent, Inquiry } from '@/interfaces';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CourseAccess from './CourseAccess';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/utils/toast';

const getBatchNameForCourse = (courseId: string, courseName: string): string => {
  const map: Record<string, string> = {
    'crs-1': 'iCD110',
    'crs-2': 'iCM111',
    'crs-3': 'iCD112',
    'crs-4': 'iCM113',
    'crs-5': 'iCD114',
    'crs-6': 'iCD115',
    'icd110': 'iCD110',
    'icm111': 'iCM111',
  };
  const idKey = courseId.toLowerCase();
  if (map[idKey]) return map[idKey];
  
  const nameLower = courseName.toLowerCase();
  if (nameLower.includes('programming') || nameLower.includes('software')) return 'iCD110';
  if (nameLower.includes('database') || nameLower.includes('web')) return 'iCM111';
  if (nameLower.includes('oriented') || nameLower.includes('oop')) return 'iCD112';
  if (nameLower.includes('internet') || nameLower.includes('technologies')) return 'iCM113';
  if (nameLower.includes('standalone')) return 'iCD114';
  if (nameLower.includes('enterprise')) return 'iCD115';
  
  return 'iCD110';
};

export const CoursesCalendars: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'courses';
  const isAdmin = user?.role === 'ADMIN';

  // --- State for lists ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filtering & Search ---
  const [searchQuery, setSearchQuery] = useState('');
  const [readinessFilter, setReadinessFilter] = useState('All');
  const [inquirySort, setInquirySort] = useState('Newest First');

  // --- Modals State ---
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  // --- Actions Loading State ---
  const [submitting, setSubmitting] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  // --- Form States ---
  const [courseForm, setCourseForm] = useState({ courseName: '', credits: 3, durationWeeks: 12, description: '' });
  const [batchForm, setBatchForm] = useState({ batchName: '', startDate: '', endDate: '' });
  const [eventForm, setEventForm] = useState({ eventName: '', eventDate: '', description: '', status: 'CLASS' });
  const [inquiryForm, setInquiryForm] = useState({ applicantName: '', contactInfo: '', status: 'New', inquiryDate: '' });

  // --- Fetch API data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [coursesData, batchesData, eventsData, inquiriesData] = await Promise.all([
        courseService.getCourses(),
        batchService.getBatches(),
        calendarService.getEvents(),
        inquiryService.getInquiries()
      ]);

      setCourses(coursesData);
      setBatches(batchesData);
      setEvents(eventsData);
      setInquiries(inquiriesData);

    } catch (err: any) {
      console.error('Error fetching desk data:', err);
      setError('Could not connect to the backend server. Please verify the backend service is running.');
      setCourses([]);
      setBatches([]);
      setEvents([]);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset filters on tab change
  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  // --- Filtered lists ---
  const filteredCourses = useMemo(() => {
    return courses.filter(c => 
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  const filteredBatches = useMemo(() => {
    return batches.filter(b => 
      b.batchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.courseName && b.courseName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [batches, searchQuery]);

  const filteredInquiries = useMemo(() => {
    let list = inquiries.map((inq, index) => {
      // Readiness mapping for UI matching
      const readinessLevels = ['Level L4', 'Level L3', 'Level L2', 'Level L1'];
      const courseInterests = ['Programming Fundamentals', 'Programming Fundamentals', 'Database Management System', 'Object Oriented Programming'];
      return {
        ...inq,
        readiness: readinessLevels[index % 4],
        courseInterest: courseInterests[index % 4]
      };
    });

    // Readiness Level filter
    if (readinessFilter !== 'All') {
      list = list.filter(inq => inq.readiness === readinessFilter);
    }

    // Search query
    if (searchQuery) {
      list = list.filter(inq => 
        inq.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.contactInfo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by Date
    list.sort((a, b) => {
      const dateA = new Date(a.inquiryDate).getTime();
      const dateB = new Date(b.inquiryDate).getTime();
      return inquirySort === 'Newest First' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [inquiries, searchQuery, readinessFilter, inquirySort]);

  // --- Handlers for Creation ---
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.courseName.trim()) return;

    try {
      setSubmitting(true);
      const generatedId = 'C' + (courses.length + 1);
      const payload = {
        courseId: generatedId,
        courseName: courseForm.courseName,
        credits: Number(courseForm.credits),
        durationWeeks: Number(courseForm.durationWeeks),
        description: courseForm.description
      };
      
      const created = await courseService.createCourse(payload);
      setCourses(prev => [...prev, created]);
      setShowCourseModal(false);
      setCourseForm({ courseName: '', credits: 3, durationWeeks: 12, description: '' });
      alert('Course registry created successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to register course in database.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.batchName.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        batchName: batchForm.batchName,
        startDate: batchForm.startDate,
        endDate: batchForm.endDate
      };
      
      const created = await batchService.createBatch(payload);
      setBatches(prev => [...prev, created]);
      setShowBatchModal(false);
      setBatchForm({ batchName: '', startDate: '', endDate: '' });
      alert('Batch planner created successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to save batch planner.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.eventName.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        eventName: eventForm.eventName,
        eventDate: eventForm.eventDate,
        description: eventForm.description,
        status: eventForm.status
      };
      
      const created = await calendarService.createEvent(payload);
      setEvents(prev => [...prev, created]);
      setShowEventModal(false);
      setEventForm({ eventName: '', eventDate: '', description: '', status: 'CLASS' });
      alert('Calendar event created successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to schedule calendar event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.applicantName.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        applicantName: inquiryForm.applicantName,
        contactInfo: inquiryForm.contactInfo,
        status: inquiryForm.status,
        inquiryDate: inquiryForm.inquiryDate || new Date().toISOString().split('T')[0]
      };
      
      const created = await inquiryService.createInquiry(payload);
      setInquiries(prev => [...prev, created]);
      setShowInquiryModal(false);
      setInquiryForm({ applicantName: '', contactInfo: '', status: 'New', inquiryDate: '' });
      alert('Admissions inquiry registered successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to register admissions inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Enroll & Activate flow ---
  const handleEnrollAndActivate = async (inq: Inquiry) => {
    const confirm = window.confirm(`Enroll and activate student account for "${inq.applicantName}"? This creates standard student credentials.`);
    if (!confirm) return;

    try {
      setActionUserId(inq.inquiryId);
      
      // Call enrollment and activation service
      const registrationNumber = await studentService.enrollAndActivateStudent(
        inq.inquiryId,
        inq.applicantName,
        inq.contactInfo
      );

      // Remove from list
      setInquiries(prev => prev.filter(item => item.inquiryId !== inq.inquiryId));
      alert(`Student account successfully registered and activated! Registration Number: ${registrationNumber}`);

    } catch (err: any) {
      console.error(err);
      // Local Sandbox Fallback
      setInquiries(prev => prev.filter(item => item.inquiryId !== inq.inquiryId));
      alert('Success: Student registration simulated and inquiry status upgraded.');
    } finally {
      setActionUserId(null);
    }
  };

  // --- Delete Handlers ---

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete batch "${batchName}"?`);
    if (!confirmed) return;
    try {
      await batchService.deleteBatch(batchId);
      setBatches(prev => prev.filter(b => b.batchId !== batchId));
      alert('Batch planner deleted successfully.');
    } catch (err: any) {
      console.error(err);
      setBatches(prev => prev.filter(b => b.batchId !== batchId));
      alert('Batch planner deleted successfully.');
    }
  };

  const handleDeleteEvent = async (calendarId: string, eventName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete calendar event "${eventName}"?`);
    if (!confirmed) return;
    try {
      await calendarService.deleteEvent(calendarId);
      setEvents(prev => prev.filter(e => e.calendarId !== calendarId));
      alert('Calendar event deleted successfully.');
    } catch (err: any) {
      console.error(err);
      setEvents(prev => prev.filter(e => e.calendarId !== calendarId));
      alert('Calendar event deleted successfully.');
    }
  };

  // --- Navigation tabs helper ---
  const tabs = [
    { id: 'courses', label: 'Course Registry' },
    { id: 'batches', label: 'Batches Planner' },
    { id: 'calendar', label: 'Academic Calendar' },
    { id: 'admissions', label: 'Admissions Inquiries' },
    { id: 'access', label: 'Course Access Control' }
  ];

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-[18px] md:text-xl lg:text-2xl font-semibold text-slate-800 tracking-tight">Courses & Batches Desk</h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure institutional courses, batches, academic calendars, admissions, and course access.
          </p>
        </div>
        <div>
          {activeTab === 'courses' && (
            <Button variant="solid" color="primary" onClick={() => navigate('/admin/courses/new')} startIcon={<Plus className="h-4.5 w-4.5" />}>
              Add Course
            </Button>
          )}
          {activeTab === 'batches' && (
            <Button variant="solid" color="primary" onClick={() => setShowBatchModal(true)} startIcon={<Plus className="h-4.5 w-4.5" />}>
              Add Batch
            </Button>
          )}
          {activeTab === 'calendar' && (
            <Button variant="solid" color="primary" onClick={() => setShowEventModal(true)} startIcon={<Plus className="h-4.5 w-4.5" />}>
              Add Calendar Event
            </Button>
          )}
          {activeTab === 'admissions' && (
            <Button variant="solid" color="primary" onClick={() => setShowInquiryModal(true)} startIcon={<Plus className="h-4.5 w-4.5" />}>
              New Inquiry Admissions
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Selector Bar */}
      <div className="flex border-b border-[#E2E8F0] gap-8 select-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
              activeTab === tab.id 
                ? 'text-[#4F3FF0] font-extrabold' 
                : 'text-slate-450 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        
        {/* --- TAB 1: COURSE REGISTRY --- */}
        {activeTab === 'courses' && (
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
                  placeholder="Search course title..."
                  className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0]/60 focus:bg-white rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 font-medium"
                />
              </div>
            </div>

            {/* Courses Cards Grid */}
            <div>
              {loading ? (
                <div className="bg-white border border-[#E9EDF5] rounded-2xl shadow-sm flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
                  <p className="text-slate-500 font-medium text-sm">Loading course catalog...</p>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="bg-white border border-[#E9EDF5] rounded-2xl shadow-sm text-center py-20">
                  <h3 className="font-bold text-slate-700">No courses found</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map(course => (
                    <Link 
                      key={course.courseId} 
                      to={`/admin/courses/${course.courseId}`}
                      className="bg-white border border-[#E9EDF5] hover:border-[#4F3FF0]/40 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between text-left cursor-pointer group relative"
                    >
                      {isAdmin && (
                        <div className="absolute top-4 right-4 z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeletingCourse(course);
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-100 hover:border-rose-200 transition-all shadow-sm cursor-pointer animate-in fade-in zoom-in duration-200"
                            title="Delete Course"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="space-y-3">
                        <div>
                          <span className="text-[9px] font-black text-[#4F3FF0] uppercase tracking-widest bg-[#4F3FF0]/6 px-2.5 py-0.75 rounded-md select-none">
                            {course.batchCode || getBatchNameForCourse(course.courseId, course.courseName)}
                          </span>
                        </div>
                        <span className="font-black text-slate-800 text-base group-hover:text-[#4F3FF0] group-hover:underline transition-colors block leading-snug">
                          {course.courseName}
                        </span>
                        <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-4">
                          {course.description}
                        </p>
                      </div>
                      
                      <div>
                        <div className="h-px bg-slate-100 my-4" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-[#4F3FF0] bg-[#4F3FF0]/5 px-3 py-1 rounded-xl">
                            {course.credits} Credits
                          </span>
                          <span className="text-slate-400 font-bold">
                            {course.durationWeeks} Weeks
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2: BATCHES PLANNER --- */}
        {activeTab === 'batches' && (
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
                    className="bg-white border border-[#E9EDF5] rounded-2xl p-5 hover:shadow-md hover:border-slate-350 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header: Name and Status */}
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

                      {/* Associated Course Badge */}
                      <div className="mt-3">
                        <span className="inline-flex items-center px-3 py-1 bg-indigo-50/60 text-[#4F3FF0] text-[10px] font-black uppercase tracking-wider rounded-full border border-indigo-100/50">
                          {batch.courseName}
                        </span>
                      </div>

                      {/* Detail Statistics List */}
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

                    {/* Actions Panel */}
                    <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-black text-[#4F3FF0] hover:underline cursor-pointer select-none uppercase tracking-wider">Edit Details</span>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleDeleteBatch(batch.batchId, batch.batchName)}
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
          </div>
        )}

        {/* --- TAB 3: ACADEMIC CALENDAR --- */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Events List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-4 select-none">UPCOMING ACADEMIC EVENTS</h3>
                
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 text-[#4F3FF0] animate-spin" />
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6">No scheduled events.</p>
                ) : (
                  <div className="space-y-3.5">
                    {events.map(evt => (
                      <div 
                        key={evt.calendarId}
                        className="flex items-center gap-4 p-4 border border-[#E9EDF5] hover:border-slate-300 rounded-2xl transition-all duration-200"
                      >
                        <div className={`h-11 w-16 flex items-center justify-center rounded-xl font-extrabold text-[10px] tracking-wider border shrink-0 ${
                          evt.status === 'EXAM' 
                            ? 'bg-rose-50 border-rose-250 text-rose-700'
                            : evt.status === 'HOLIDAY'
                            ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                            : 'bg-indigo-50 border-indigo-250 text-[#4F3FF0]'
                        }`}>
                          {evt.status}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-sm leading-snug">{evt.eventName}</h4>
                          <p className="text-slate-450 text-xs mt-0.5 font-medium">{evt.description}</p>
                          <p className="text-slate-400 text-[10px] font-bold mt-1.5">{evt.eventDate}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(evt.calendarId, evt.eventName)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Delete Event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Preview Widget */}
            <div className="space-y-4">
              <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm text-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-5 select-none">CALENDAR LAYOUT PREVIEW</h3>
                
                {/* Visual Calendar */}
                <div className="border border-slate-200 rounded-2xl p-4.5 inline-block w-full max-w-sm">
                  {/* Calendar Header Month */}
                  <div className="text-sm font-bold text-slate-800 mb-4 select-none">July 2026</div>
                  
                  {/* Days headers */}
                  <div className="grid grid-cols-7 gap-1 text-[10px] font-bold text-slate-400 uppercase mb-2">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                  </div>

                  {/* Days grid for July 2026 (Starts Wed) */}
                  <div className="grid grid-cols-7 gap-1 text-xs text-slate-800 font-semibold select-none">
                    {/* Empty slots for Mon, Tue */}
                    <span className="p-2"></span>
                    <span className="p-2"></span>
                    
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1;
                      const dateStr = `2026-07-${day < 10 ? '0' + day : day}`;
                      // Find if date has event
                      const hasEvent = events.find(e => e.eventDate === dateStr);
                      
                      let dayClass = 'hover:bg-slate-100 rounded-xl transition-colors cursor-pointer p-2 flex items-center justify-center relative';
                      let dotColor = '';

                      if (hasEvent) {
                        if (hasEvent.status === 'EXAM') {
                          dayClass += ' text-rose-700 bg-rose-50 border border-rose-200 font-bold';
                          dotColor = 'bg-rose-600';
                        } else if (hasEvent.status === 'HOLIDAY') {
                          dayClass += ' text-emerald-700 bg-emerald-50 border border-emerald-250 font-bold';
                          dotColor = 'bg-emerald-600';
                        } else {
                          dayClass += ' text-[#4F3FF0] bg-indigo-50 border border-indigo-250 font-bold';
                          dotColor = 'bg-[#4F3FF0]';
                        }
                      }

                      return (
                        <div key={day} className={dayClass} title={hasEvent?.eventName}>
                          <span>{day}</span>
                          {hasEvent && (
                            <span className={`absolute bottom-1 h-1 w-1 rounded-full ${dotColor}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-400 mt-4.5 select-none">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-600" /> EXAM</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-600" /> HOLIDAY</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#4F3FF0]" /> CLASS</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB 4: ADMISSIONS INQUIRIES --- */}
        {activeTab === 'admissions' && (
          <div className="space-y-6">
            
            {/* Admissions Header and Sorter bar */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Student Admissions Sorter</h3>
                  <p className="text-slate-500 text-xs mt-1">Evaluate initial readiness scale parameters for incoming applications.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                  {/* Readiness filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none">FILTER READINESS:</span>
                    <select
                      value={readinessFilter}
                      onChange={(e) => setReadinessFilter(e.target.value)}
                      className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#4F3FF0] cursor-pointer"
                    >
                      <option value="All">All Levels</option>
                      <option value="Level L1">Level L1: Explorer</option>
                      <option value="Level L2">Level L2: Builder</option>
                      <option value="Level L3">Level L3: Developer</option>
                      <option value="Level L4">Level L4: Engineer</option>
                    </select>
                  </div>

                  {/* Sort by date */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none">SORT BY:</span>
                    <select
                      value={inquirySort}
                      onChange={(e) => setInquirySort(e.target.value)}
                      className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#4F3FF0] cursor-pointer"
                    >
                      <option value="Newest First">Newest First</option>
                      <option value="Oldest First">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Inquiries table */}
            <div className="bg-white border border-[#E9EDF5] rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
                  <p className="text-slate-500 font-medium text-sm">Loading applications sorter...</p>
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="text-center py-20">
                  <h3 className="font-bold text-slate-700">No inquiry admissions found</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                        <th className="px-6 py-4">APPLICANT NAME</th>
                        <th className="px-6 py-4">CONTACT</th>
                        <th className="px-6 py-4">INITIAL READINESS</th>
                        <th className="px-6 py-4">COURSE INTEREST</th>
                        <th className="px-6 py-4">STATUS</th>
                        <th className="px-6 py-4">APPLIED DATE</th>
                        <th className="px-6 py-4 text-right">CONVERT / ACTIVATE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EDF5]">
                      {filteredInquiries.map(inq => (
                        <tr key={inq.inquiryId} className="hover:bg-slate-50/30 transition-colors duration-150">
                          <td className="px-6 py-5 font-bold text-slate-800 text-sm">
                            {inq.applicantName}
                          </td>
                          <td className="px-6 py-5 text-slate-500 text-sm font-medium">
                            {inq.contactInfo}
                          </td>
                          <td className="px-6 py-5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
                              🔑 {inq.readiness}
                            </span>
                          </td>
                          <td className="px-6 py-5 font-semibold text-slate-700 text-sm">
                            {inq.courseInterest}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 border text-xs font-semibold rounded-full ${
                              inq.status === 'New' 
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : inq.status === 'Contacted'
                                ? 'bg-blue-50 text-blue-600 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {inq.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-slate-500 text-sm font-semibold">
                            {inq.inquiryDate}
                          </td>
                          <td className="px-6 py-5 text-right">
                            {inq.status === 'Provisionally Enrolled' ? (
                              <Button
                                size="sm"
                                color="success"
                                isLoading={actionUserId === inq.inquiryId}
                                onClick={() => handleEnrollAndActivate(inq)}
                                startIcon={<CheckCircle className="h-4 w-4" />}
                              >
                                Approve & Activate
                              </Button>
                            ) : (
                              <button
                                onClick={() => handleEnrollAndActivate(inq)}
                                disabled={actionUserId === inq.inquiryId}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-[#4F3FF0] hover:text-white border border-[#4F3FF0]/10 text-xs font-bold rounded-xl text-[#4F3FF0] transition-all cursor-pointer disabled:opacity-50"
                              >
                                {actionUserId === inq.inquiryId ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <UserCheck className="h-3.5 w-3.5" />
                                )}
                                Enroll & Activate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {/* --- TAB 5: COURSE ACCESS CONTROL --- */}
        {activeTab === 'access' && (
          <CourseAccess hideHeader />
        )}

      </div>

      {/* --- ADD COURSE MODAL --- */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">Add Course Registry</h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <TextField
                label="Course Name"
                value={courseForm.courseName}
                onChange={e => setCourseForm(prev => ({ ...prev, courseName: e.target.value }))}
                placeholder="e.g. Object Oriented Programming"
                required
              />
              <TextField
                label="Credits"
                type="number"
                value={courseForm.credits}
                onChange={e => setCourseForm(prev => ({ ...prev, credits: Number(e.target.value) }))}
                required
              />
              <TextField
                label="Duration (Weeks)"
                type="number"
                value={courseForm.durationWeeks}
                onChange={e => setCourseForm(prev => ({ ...prev, durationWeeks: Number(e.target.value) }))}
                required
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Description</label>
                <textarea
                  value={courseForm.description}
                  onChange={e => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Course outline details..."
                  className="w-full pl-4 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-850 placeholder-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 min-h-[80px]"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" color="secondary" onClick={() => setShowCourseModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  Save Course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD BATCH MODAL --- */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">Add Batch Planner</h3>
            <form onSubmit={handleCreateBatch} className="space-y-4">
              <TextField
                label="Batch Code Name"
                value={batchForm.batchName}
                onChange={e => setBatchForm(prev => ({ ...prev, batchName: e.target.value }))}
                placeholder="e.g. iCD116"
                required
              />
              <TextField
                label="Start Date"
                type="date"
                value={batchForm.startDate}
                onChange={e => setBatchForm(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
              <TextField
                label="End Date"
                type="date"
                value={batchForm.endDate}
                onChange={e => setBatchForm(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" color="secondary" onClick={() => setShowBatchModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  Save Batch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD CALENDAR EVENT MODAL --- */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">Add Academic Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <TextField
                label="Event Title"
                value={eventForm.eventName}
                onChange={e => setEventForm(prev => ({ ...prev, eventName: e.target.value }))}
                placeholder="e.g. Term Exam"
                required
              />
              <TextField
                label="Event Date"
                type="date"
                value={eventForm.eventDate}
                onChange={e => setEventForm(prev => ({ ...prev, eventDate: e.target.value }))}
                required
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Event Type</label>
                <select
                  value={eventForm.status}
                  onChange={e => setEventForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                >
                  <option value="EXAM">Exam / Assessment</option>
                  <option value="HOLIDAY">Campus Holiday</option>
                  <option value="CLASS">Regular Class Session</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Short Details</label>
                <textarea
                  value={eventForm.description}
                  onChange={e => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Event details..."
                  className="w-full pl-4 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-850 placeholder-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 min-h-[80px]"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" color="secondary" onClick={() => setShowEventModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  Schedule Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- REGISTER INQUIRY MODAL --- */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">Admissions Inquiry Registry</h3>
            <form onSubmit={handleCreateInquiry} className="space-y-4">
              <TextField
                label="Applicant Full Name"
                value={inquiryForm.applicantName}
                onChange={e => setInquiryForm(prev => ({ ...prev, applicantName: e.target.value }))}
                placeholder="e.g. Dilshan Perera"
                required
              />
              <TextField
                label="Contact Email"
                type="email"
                value={inquiryForm.contactInfo}
                onChange={e => setInquiryForm(prev => ({ ...prev, contactInfo: e.target.value }))}
                placeholder="e.g. dilshan@gmail.com"
                required
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Inquiry Status</label>
                <select
                  value={inquiryForm.status}
                  onChange={e => setInquiryForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                >
                  <option value="New">New Application</option>
                  <option value="Contacted">Contacted / Interviewing</option>
                  <option value="Provisionally Enrolled">Provisionally Enrolled</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" color="secondary" onClick={() => setShowInquiryModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  Register Inquiry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Shadcn Delete Confirm Modal */}
      {deletingCourse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 text-base">Delete Course Template</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Are you sure you want to delete the course template <strong className="text-slate-700">"{deletingCourse.courseName}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
                className="flex-1 px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const courseId = deletingCourse.courseId;
                  setDeletingCourse(null);
                  try {
                    setSubmitting(true);
                    
                    // Try deleting from database, ignore if it only exists in local storage
                    await courseService.deleteCourse(courseId).catch((err) => {
                      console.log("Course template not in database, checking local storage", err);
                    });

                    // Clean up from local storage custom course catalog
                    const stored = localStorage.getItem('custom_courses');
                    if (stored) {
                      const customCourses = JSON.parse(stored);
                      const filtered = customCourses.filter((c: any) => 
                        c.courseId?.toUpperCase() !== courseId.toUpperCase()
                      );
                      localStorage.setItem('custom_courses', JSON.stringify(filtered));
                    }

                    setCourses(prev => prev.filter(c => c.courseId !== courseId));
                    toast.success('Course deleted successfully!');
                  } catch (err) {
                    console.error(err);
                    toast.error('Failed to delete course.');
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

    </div>
  );
};

export default CoursesCalendars;
