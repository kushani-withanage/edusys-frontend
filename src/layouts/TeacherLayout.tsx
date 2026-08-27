import React from 'react';
import MainLayout, { type SidebarGroup } from './MainLayout';
import { 
  LayoutDashboard, 
  FileQuestion, 
  Award,
  Shield,
  BookOpen
} from 'lucide-react';

const teacherSidebarGroups: SidebarGroup[] = [
  {
    category: 'Overview',
    links: [
      { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    category: 'Academic Process',
    links: [
      { label: 'My Assigned Modules', path: '/teacher/courses', icon: BookOpen },
      { label: 'Question Bank & Exams', path: '/teacher/exams', icon: FileQuestion },
      { label: 'Academic Results', path: '/teacher/results', icon: Award },
    ]
  }
];

export const TeacherLayout: React.FC = () => {
  return (
    <MainLayout
      sidebarGroups={teacherSidebarGroups}
      portalName="Teacher Portal"
      logoText="iCET EduSys"
      logoIcon={Shield}
    />
  );
};

export default TeacherLayout;
