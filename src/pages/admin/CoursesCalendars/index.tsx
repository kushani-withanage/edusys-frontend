import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '@/components/common/Button';
import { CourseRegistry } from './CourseRegistry';
import { BatchesPlanner } from './BatchesPlanner';
import { AcademicCalendar } from './AcademicCalendar';
import { CourseAccessControl } from './CourseAccessControl';

export const CoursesCalendars: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'courses';

  // Triggers to open modals in child components
  const [addBatchTrigger, setAddBatchTrigger] = useState(0);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div className="text-left">
          <h1 className="text-[18px] md:text-xl lg:text-2xl font-semibold text-slate-800 tracking-tight">Courses & Batches Desk</h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure institutional courses, batches, academic calendars, admissions, and course access.
          </p>
        </div>
        <div>
          {activeTab === 'courses' && (
            <Button 
              variant="solid" 
              color="primary" 
              onClick={() => navigate('/admin/courses/new')} 
              startIcon={<Plus className="h-4.5 w-4.5" />}
            >
              Add Course
            </Button>
          )}
          {activeTab === 'batches' && (
            <Button 
              variant="solid" 
              color="primary" 
              onClick={() => setAddBatchTrigger(prev => prev + 1)} 
              startIcon={<Plus className="h-4.5 w-4.5" />}
            >
              Add Batch
            </Button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        {activeTab === 'courses' && <CourseRegistry />}
        {activeTab === 'batches' && <BatchesPlanner addTrigger={addBatchTrigger} />}
        {activeTab === 'calendar' && <AcademicCalendar />}
        {activeTab === 'access' && <CourseAccessControl />}
      </div>
    </div>
  );
};

export default CoursesCalendars;
