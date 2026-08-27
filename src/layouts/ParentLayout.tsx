import React from 'react';
import MainLayout, { type SidebarGroup } from './MainLayout';
import { 
  LayoutDashboard, 
  BookOpen, 
  Shield,
  Settings
} from 'lucide-react';

const parentSidebarGroups: SidebarGroup[] = [
  {
    category: 'Overview',
    links: [
      { label: 'Dashboard', path: '/parent/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    category: 'Child monitoring',
    links: [
      { label: 'Academic Progress', path: '/parent/academics', icon: BookOpen },
    ]
  },
  {
    category: 'Account',
    links: [
      { label: 'Profile Settings', path: '/parent/settings', icon: Settings },
    ]
  }
];

export const ParentLayout: React.FC = () => {
  return (
    <MainLayout
      sidebarGroups={parentSidebarGroups}
      portalName="Parent Portal"
      logoText="iCET EduSys"
      logoIcon={Shield}
    />
  );
};

export default ParentLayout;
