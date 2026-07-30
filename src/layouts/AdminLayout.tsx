import React from 'react';
import MainLayout, { type SidebarGroup } from './MainLayout';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ClipboardList, 
  CreditCard, 
  FileQuestion, 
  FolderOpen, 
  Award, 
  CheckSquare, 
  UserCheck, 
  Trophy, 
  BarChart3,
  Shield
} from 'lucide-react';

const adminSidebarGroups: SidebarGroup[] = [
  {
    category: 'Overview',
    links: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    category: 'Administration',
    links: [
      { label: 'Users & Roles', path: '/admin/users-roles', icon: Users },
      { label: 'Courses & Calendars', path: '/admin/courses-calendars', icon: BookOpen },
      { label: 'Admissions', path: '/admin/admissions', icon: ClipboardList },
      { label: 'Fee Management', path: '/admin/fee-management', icon: CreditCard },
    ]
  },
  {
    category: 'Academic Process',
    links: [
      { label: 'Question Bank & Exams', path: '/admin/exams', icon: FileQuestion },
      { label: 'Materials & Assignments', path: '/admin/materials', icon: FolderOpen },
      { label: 'Academic Results', path: '/admin/results', icon: Award },
    ]
  },
  {
    category: 'Career Scale',
    links: [
      { label: 'Task Creator', path: '/admin/task-creator', icon: CheckSquare },
      { label: 'Reviewer Workflow', path: '/admin/reviewer-workflow', icon: UserCheck },
      { label: 'Points & Levels', path: '/admin/points-levels', icon: Trophy },
    ]
  },
  {
    category: 'Portals & Reports',
    links: [
      { label: 'All Reports', path: '/admin/reports', icon: BarChart3 },
    ]
  }
];

const AdminLayout: React.FC = () => {
  return (
    <MainLayout
      sidebarGroups={adminSidebarGroups}
      portalName="Admin Portal"
      logoText="iCET EduSys"
      logoIcon={Shield}
    />
  );
};

export default AdminLayout;
