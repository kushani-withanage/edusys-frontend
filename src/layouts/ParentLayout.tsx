import React from 'react';
import MainLayout, { type SidebarGroup } from './MainLayout';
import { 
  LayoutDashboard, 
  BookOpen, 
  CreditCard,
  Shield
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
      { label: 'Tuition Fees', path: '/parent/fees', icon: CreditCard },
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
