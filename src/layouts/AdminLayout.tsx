import React from 'react';
import MainLayout, { type SidebarGroup } from './MainLayout';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileQuestion, 
  Award, 
  CheckSquare, 
  UserCheck, 
  Trophy, 
  BarChart3,
  Shield,
  Layers,
  Calendar,
  Key
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
    ]
  },
  {
    category: 'Courses & Calendars',
    links: [
      { label: 'Course Registry', path: '/admin/courses-calendars?tab=courses', icon: BookOpen },
      { label: 'Batches Planner', path: '/admin/courses-calendars?tab=batches', icon: Layers },
      { label: 'Academic Calendar', path: '/admin/courses-calendars?tab=calendar', icon: Calendar },
      { label: 'Course Access', path: '/admin/courses-calendars?tab=access', icon: Key },
    ]
  },
  {
    category: 'Academic Process',
    links: [
      { label: 'Question Bank & Exams', path: '/admin/exams', icon: FileQuestion },
      { label: 'Academic Results', path: '/admin/results', icon: Award },
    ]
  },
  {
    category: 'Career Scale',
    links: [
      { label: 'Points & Levels', path: '/admin/points-levels', icon: Trophy },
      { label: 'Task Creator', path: '/admin/task-creator', icon: CheckSquare },
      { label: 'Reviewer Workflow', path: '/admin/reviewer-workflow', icon: UserCheck },
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
