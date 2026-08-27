import React from 'react';
import MainLayout, { type SidebarGroup } from './MainLayout';
import { 
  LayoutDashboard, 
  UserCheck, 
  Trophy,
  Shield,
  BookOpen
} from 'lucide-react';

const reviewerSidebarGroups: SidebarGroup[] = [
  {
    category: 'Overview',
    links: [
      { label: 'Dashboard', path: '/reviewer/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    category: 'Career scale evaluation',
    links: [
      { label: 'My Assigned Modules', path: '/reviewer/courses', icon: BookOpen },
      { label: 'Reviewer Workflow', path: '/reviewer/workflow', icon: UserCheck },
      { label: 'Points & Levels', path: '/reviewer/points-levels', icon: Trophy },
    ]
  }
];

export const ReviewerLayout: React.FC = () => {
  return (
    <MainLayout
      sidebarGroups={reviewerSidebarGroups}
      portalName="Reviewer Portal"
      logoText="iCET EduSys"
      logoIcon={Shield}
    />
  );
};

export default ReviewerLayout;
