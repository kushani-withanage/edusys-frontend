import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, Trash2 } from 'lucide-react';
import { courseService } from '@/services/courseService';
import { toast } from '@/utils/toast';
import { useAuth } from '@/hooks/useAuth';
import type { Course } from './types';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';

export const CourseRegistry: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ courseName: '', credits: 3, durationWeeks: 12, description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourses();
      setCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      toast.error('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => 
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.batchCode && c.batchCode.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [courses, searchQuery]);

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
                    <span className="font-black text-slate-800 text-base group-hover:text-[#4F3FF0] group-hover:underline transition-colors block leading-snug">
                      {course.courseName}
                    </span>
                    {course.batchCode && (
                      <span className="text-[11px] font-extrabold text-slate-500 block mt-1">
                        {course.batchCode}
                      </span>
                    )}
                  </div>
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
                  className="w-full pl-4 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-855 placeholder-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 min-h-[80px]"
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
                    await courseService.deleteCourse(courseId);
                    setCourses(prev => prev.filter(c => c.courseId !== courseId));
                    toast.success('Course deleted successfully!');
                  } catch (err: any) {
                    console.error(err);
                    toast.error(err.message || 'Failed to delete course.');
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

export default CourseRegistry;
