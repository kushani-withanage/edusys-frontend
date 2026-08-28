import React from 'react';
import MainLayout, { type SidebarGroup } from './MainLayout';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  Settings,
  Shield,
  Award
} from 'lucide-react';

const studentSidebarGroups: SidebarGroup[] = [
  {
    category: 'Overview',
    links: [
      { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    category: 'Academics & Progress',
    links: [
      { label: 'My Academics', path: '/student/academics', icon: BookOpen },
      { label: 'My Grades & Marks', path: '/student/grades', icon: Award },
      { label: 'Career Scale', path: '/student/career', icon: Trophy },
    ]
  },
  {
    category: 'Account',
    links: [
      { label: 'Settings', path: '/student/settings', icon: Settings },
    ]
  }
];

export const StudentLayout: React.FC = () => {
  return (
    <MainLayout
      sidebarGroups={studentSidebarGroups}
      portalName="Student Portal"
      logoText="iCET EduSys"
      logoIcon={Shield}
    />
  );
};

export default StudentLayout;
