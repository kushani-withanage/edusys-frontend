import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, ChevronRight, Calendar, Bookmark, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { courseService } from '@/services/courseService';
import { api } from '@/utils/api';

export const AssignedCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedCourses = async () => {
      try {
        setLoading(true);
        if (!user?.email) return;

        // Fetch all user grants
        const grants = await api.get<any[]>(`/api/v1/course-access-grants?email=${user.email}`).catch(() => []);
        
        // Fetch all course database templates to enrich card details
        const allCourses = await courseService.getCourses().catch(() => []);
        
        // Filter courses having active grant access
        const assigned = allCourses.filter((c: any) => 
          grants.some((g: any) => g.courseId.toLowerCase() === c.courseId.toLowerCase())
        );

        setCourses(assigned);
      } catch (err) {
        console.error('Failed to load assigned courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedCourses();
  }, [user]);

  const handleOpenCourse = (courseId: string) => {
    const rolePrefix = user?.role?.toLowerCase() === 'teacher' ? '/teacher' : '/reviewer';
    navigate(`${rolePrefix}/courses/${courseId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white border border-[#E9EDF5] rounded-3xl min-h-[400px]">
        <Loader2 className="h-10 w-10 text-[#4F3FF0] animate-spin" />
        <p className="text-slate-500 font-bold text-sm tracking-wide">Loading assigned modules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none text-left">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-805 tracking-tight flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-[#4F3FF0]" />
            Assigned Course Modules
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Access curriculum outlines, assignments, exams, and grade reviews for your permitted modules.
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#E9EDF5] rounded-3xl space-y-3.5 shadow-xs">
          <div className="h-12 w-12 bg-indigo-50 text-[#4F3FF0] rounded-full flex items-center justify-center">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-slate-800 font-black text-sm">No course access granted</p>
            <p className="text-slate-450 font-medium text-xs mt-1 leading-relaxed max-w-sm">
              Please contact the system administrator to request permission grants for your designated course modules.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div 
              key={course.courseId}
              onClick={() => handleOpenCourse(course.courseId)}
              className="bg-white border border-[#E9EDF5] hover:border-slate-350 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {course.level || 'LEVEL 1'}
                  </span>
                  {course.isCompulsory !== false && (
                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Compulsory
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-805 leading-snug group-hover:text-[#4F3FF0] transition-colors">
                    {course.courseName}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{course.courseId || 'crs0001'}</p>
                </div>

                <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-2">
                  {course.description || 'No course overview description provided.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-450">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {course.durationWeeks || '12'} Weeks
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="h-3.5 w-3.5 shrink-0" />
                    {course.credits || '3'} Credits
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedCourses;
