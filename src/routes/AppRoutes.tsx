import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '@/layouts/AdminLayout';
import StudentLayout from '@/layouts/StudentLayout';
import TeacherLayout from '@/layouts/TeacherLayout';
import ReviewerLayout from '@/layouts/ReviewerLayout';
import ParentLayout from '@/layouts/ParentLayout';

import Dashboard from '@/pages/admin/Dashboard';
import UsersRoles from '@/pages/admin/UsersRoles';
import AddUser from '@/pages/admin/AddUser';
import CoursesCalendars from '@/pages/admin/CoursesCalendars';
import AddCourse from '@/pages/admin/AddCourse';
import Admissions from '@/pages/admin/Admissions';
import FeeManagement from '@/pages/admin/FeeManagement';
import Exams from '@/pages/admin/Exams';
import Results from '@/pages/admin/Results';
import Materials from '@/pages/admin/Materials';
import CareerTasks from '@/pages/admin/CareerTasks';
import Reviews from '@/pages/admin/Reviews';
import PointsLevels from '@/pages/admin/PointsLevels';
import Reports from '@/pages/admin/Reports';
import CourseAccess from '@/pages/admin/CourseAccess';
import UpdateAssignment from '@/pages/admin/UpdateAssignment';

import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentAcademics from '@/pages/student/StudentAcademics';
import StudentCareer from '@/pages/student/StudentCareer';
import StudentSettings from '@/pages/student/StudentSettings';
import StudentCourseDetail from '@/pages/student/StudentCourseDetail';

import ParentDashboard from '@/pages/parent/ParentDashboard';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import ReviewerDashboard from '@/pages/reviewer/ReviewerDashboard';

import { Login } from '@/pages/auth/Login';
import { useAuth } from '@/hooks/useAuth';

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center font-sans text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  const role = user.role.toUpperCase();
  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
  if (role === 'REVIEWER') return <Navigate to="/reviewer/dashboard" replace />;
  if (role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
  if (role === 'PARENT') return <Navigate to="/parent/dashboard" replace />;
  
  return <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/users-roles" element={<UsersRoles />} />
          <Route path="/admin/users-roles/new" element={<AddUser />} />
          <Route path="/admin/courses-calendars" element={<CoursesCalendars />} />
          <Route path="/admin/courses/new" element={<AddCourse />} />
          <Route path="/admin/courses/:courseId" element={<StudentCourseDetail />} />
          <Route path="/admin/courses/:courseId/sections/:sectionIdx/assignments/new" element={<UpdateAssignment />} />
          <Route path="/admin/courses/:courseId/sections/:sectionIdx/assignments/:assignmentId/edit" element={<UpdateAssignment />} />
          <Route path="/admin/course-access" element={<CourseAccess />} />
          <Route path="/admin/admissions" element={<Admissions />} />
          <Route path="/admin/fee-management" element={<FeeManagement />} />
          <Route path="/admin/exams" element={<Exams />} />
          <Route path="/admin/results" element={<Results />} />
          <Route path="/admin/materials" element={<Materials />} />
          <Route path="/admin/task-creator" element={<CareerTasks />} />
          <Route path="/admin/reviewer-workflow" element={<Reviews />} />
          <Route path="/admin/points-levels" element={<PointsLevels />} />
          <Route path="/admin/reports" element={<Reports />} />
        </Route>
      </Route>

      {/* Protected Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/academics" element={<StudentAcademics />} />
          <Route path="/student/courses/:courseId" element={<StudentCourseDetail />} />
          <Route path="/student/career" element={<StudentCareer />} />
          <Route path="/student/settings" element={<StudentSettings />} />
        </Route>
      </Route>

      {/* Protected Parent Routes */}
      <Route element={<ProtectedRoute allowedRoles={['PARENT']} />}>
        <Route element={<ParentLayout />}>
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/parent/academics" element={<ParentDashboard />} />
          <Route path="/parent/fees" element={<ParentDashboard />} />
        </Route>
      </Route>

      {/* Protected Teacher Routes */}
      <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
        <Route element={<TeacherLayout />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/materials" element={<Materials />} />
          <Route path="/teacher/exams" element={<Exams />} />
          <Route path="/teacher/results" element={<Results />} />
        </Route>
      </Route>

      {/* Protected Reviewer Routes */}
      <Route element={<ProtectedRoute allowedRoles={['REVIEWER']} />}>
        <Route element={<ReviewerLayout />}>
          <Route path="/reviewer/dashboard" element={<ReviewerDashboard />} />
          <Route path="/reviewer/workflow" element={<Reviews />} />
          <Route path="/reviewer/points-levels" element={<PointsLevels />} />
        </Route>
      </Route>

      {/* Root Path Redirect */}
      <Route path="/" element={<RoleBasedRedirect />} />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
