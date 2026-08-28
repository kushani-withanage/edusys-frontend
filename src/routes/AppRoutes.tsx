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
import CoursesCalendars from '@/pages/admin/CoursesCalendars/index';
import AddCourse from '@/pages/admin/AddCourse';
import { ExamListPage } from '@/pages/admin/ExamListPage';
import { QuestionBankPage } from '@/pages/admin/QuestionBankPage';
import { ExamBuilderPage } from '@/pages/admin/ExamBuilderPage';
import { ExamResultsPage } from '@/pages/admin/ExamResultsPage';
import Results from '@/pages/admin/Results';

import CareerTasks from '@/pages/admin/CareerTasks';
import Reviews from '@/pages/admin/Reviews';
import PointsLevels from '@/pages/admin/PointsLevels';
import Reports from '@/pages/admin/Reports';
import CourseAccess from '@/pages/admin/CourseAccess';


import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentAcademics from '@/pages/student/StudentAcademics';
import { ExamTakingPage } from '@/pages/student/ExamTakingPage';
import { ExamResultPage } from '@/pages/student/ExamResultPage';
import StudentCareer from '@/pages/student/StudentCareer';
import StudentSettings from '@/pages/student/StudentSettings';
import StudentCourseDetail from '@/pages/student/StudentCourseDetail';
import { StudentGradesPage } from '@/pages/student/StudentGradesPage';

import ParentDashboard from '@/pages/parent/ParentDashboard';
import { ParentProfileSettingsPage } from '@/pages/parent/ParentProfileSettingsPage';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import ReviewerDashboard from '@/pages/reviewer/ReviewerDashboard';
import { AssignedCourses } from '@/pages/shared/AssignedCourses';

import { Login } from '@/pages/auth/Login';
import { SetPasswordPage } from '@/pages/auth/SetPasswordPage';
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
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/users-roles" element={<UsersRoles />} />
          <Route path="/admin/users-roles/new" element={<AddUser />} />
          <Route path="/admin/users-roles/edit/:userId" element={<AddUser />} />
          <Route path="/admin/courses-calendars" element={<CoursesCalendars />} />
          <Route path="/admin/courses/new" element={<AddCourse />} />
          <Route path="/admin/courses/:courseId" element={<StudentCourseDetail />} />

          <Route path="/admin/course-access" element={<CourseAccess />} />
          <Route path="/admin/exams" element={<ExamListPage />} />
          <Route path="/admin/exams/questions" element={<QuestionBankPage />} />
          <Route path="/admin/exams/new" element={<ExamBuilderPage />} />
          <Route path="/admin/exams/edit/:examId" element={<ExamBuilderPage />} />
          <Route path="/admin/exams/:examId/analytics" element={<ExamResultsPage />} />
          <Route path="/admin/exams/attempts/:attemptId/result" element={<ExamResultPage />} />
          <Route path="/admin/results" element={<Results />} />

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
          <Route path="/student/grades" element={<StudentGradesPage />} />
          <Route path="/student/settings" element={<StudentSettings />} />
          <Route path="/student/exams/:examId/take" element={<ExamTakingPage />} />
          <Route path="/student/exams/attempts/:attemptId/result" element={<ExamResultPage />} />
        </Route>
      </Route>

      {/* Protected Parent Routes */}
      <Route element={<ProtectedRoute allowedRoles={['PARENT']} />}>
        <Route element={<ParentLayout />}>
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/parent/academics" element={<ParentDashboard />} />
          <Route path="/parent/settings" element={<ParentProfileSettingsPage />} />
        </Route>
      </Route>

      {/* Protected Teacher Routes */}
      <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
        <Route element={<TeacherLayout />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />

          <Route path="/teacher/exams" element={<ExamListPage />} />
          <Route path="/teacher/exams/questions" element={<QuestionBankPage />} />
          <Route path="/teacher/exams/new" element={<ExamBuilderPage />} />
          <Route path="/teacher/exams/edit/:examId" element={<ExamBuilderPage />} />
          <Route path="/teacher/exams/:examId/analytics" element={<ExamResultsPage />} />
          <Route path="/teacher/exams/attempts/:attemptId/result" element={<ExamResultPage />} />
          <Route path="/teacher/results" element={<Results />} />
          <Route path="/teacher/courses" element={<AssignedCourses />} />
          <Route path="/teacher/courses/:courseId" element={<StudentCourseDetail />} />

        </Route>
      </Route>

      {/* Protected Reviewer Routes */}
      <Route element={<ProtectedRoute allowedRoles={['REVIEWER']} />}>
        <Route element={<ReviewerLayout />}>
          <Route path="/reviewer/dashboard" element={<ReviewerDashboard />} />
          <Route path="/reviewer/workflow" element={<Reviews />} />
          <Route path="/reviewer/points-levels" element={<PointsLevels />} />
          <Route path="/reviewer/courses" element={<AssignedCourses />} />
          <Route path="/reviewer/courses/:courseId" element={<StudentCourseDetail />} />
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
