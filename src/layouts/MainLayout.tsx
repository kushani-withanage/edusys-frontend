import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Menu, X, Shield, ChevronRight, User, Search, Bell, Moon, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/utils';
import { courseService } from '@/services/courseService';

export interface SidebarLink {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  subLinks?: { label: string; path: string }[];
}

export interface SidebarGroup {
  category: string;
  links: SidebarLink[];
}

export interface MainLayoutProps {
  sidebarLinks?: SidebarLink[];
  sidebarGroups?: SidebarGroup[];
  portalName?: string;
  logoText?: string;
  logoIcon?: React.ComponentType<{ className?: string }>;
}

const getBatchForCourse = (courseId: string, courseName: string): string => {
  const map: Record<string, string> = {
    'crs-1': 'iCD110',
    'crs-2': 'iCM111',
    'crs-3': 'iCD112',
    'crs-4': 'iCM113',
    'crs-5': 'iCD114',
    'crs-6': 'iCD115',
    'crs0001': 'iCD110',
    'crs0002': 'iCD110',
    'crs0003': 'iCD110',
    'crs0004': 'iCM111',
    'crs0005': 'iCD112',
    'crs0006': 'iCD110',
    'icd110': 'iCD110',
    'icm111': 'iCM111',
  };
  const idKey = courseId.toLowerCase();
  if (map[idKey]) return map[idKey];
  
  const nameLower = courseName.toLowerCase();
  if (nameLower.includes('programming') || nameLower.includes('software')) return 'iCD110';
  if (nameLower.includes('database') || nameLower.includes('web')) return 'iCM111';
  if (nameLower.includes('oriented') || nameLower.includes('oop')) return 'iCD112';
  if (nameLower.includes('internet') || nameLower.includes('technologies')) return 'iCM113';
  if (nameLower.includes('standalone')) return 'iCD114';
  if (nameLower.includes('enterprise')) return 'iCD115';
  
  return 'iCD110';
};

const getBreadcrumbLabel = (segment: string, dbCourses: any[] = []): string => {
  const customMap: Record<string, string> = {
    dashboard: 'Dashboard',
    academics: 'My Academics',
    courses: 'Courses',
    career: 'Career Scale',
    settings: 'Settings',
    new: 'Create Course Template',
    'users-roles': 'Users & Roles',
    'courses-calendars': 'Courses & Batches',
    admissions: 'Admissions',
    'fee-management': 'Fee Management',
    exams: 'Exams',
    results: 'Results',
    materials: 'Materials',
    'task-creator': 'Task Creator',
    'reviewer-workflow': 'Reviews',
    'points-levels': 'Points & Levels',
    reports: 'Reports'
  };
  
  const key = segment.toLowerCase();
  if (customMap[key]) return customMap[key];

  // 1. Check loaded database courses list
  const foundDb = dbCourses.find((c: any) => 
    c.courseId?.toUpperCase() === segment.toUpperCase()
  );
  if (foundDb) {
    const batch = foundDb.batchCode || getBatchForCourse(foundDb.courseId, foundDb.courseName);
    return `${batch} ${foundDb.courseName}`;
  }
  
  const isCourseId = key.startsWith('crs') || key.startsWith('icd') || key.startsWith('icm');
  if (isCourseId) {
    const stored = localStorage.getItem('custom_courses');
    if (stored) {
      const customCourses = JSON.parse(stored);
      const found = customCourses.find((c: any) => 
        c.courseId.toUpperCase() === segment.toUpperCase() || 
        c.batchCode.toUpperCase() === segment.toUpperCase()
      );
      if (found) return `${found.batchCode} ${found.courseName}`;
    }
    
    const staticKey = segment.toUpperCase().replace(/-/g, '_');
    const staticMap: Record<string, string> = {
      CRS_1: 'ICD110 Programming Fundamentals',
      ICD110: 'ICD110 Advanced Software Engineering',
      CRS_2: 'ICM111 Database Management System',
      ICM111: 'ICM111 Full Stack Web Development',
      CRS_3: 'ICD112 Object Oriented Programming',
      CRS_4: 'ICM113 Internet Technologies',
      CRS_5: 'ICD114 Standalone Application',
      CRS_6: 'ICD115 Enterprise Engineering'
    };
    if (staticMap[staticKey]) return staticMap[staticKey];
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
};

export const MainLayout: React.FC<MainLayoutProps> = ({
  sidebarLinks = [],
  sidebarGroups,
  portalName = 'Portal',
  logoText = 'iCET EduSys',
  logoIcon: LogoIcon = Shield,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedLinks, setExpandedLinks] = useState<Record<string, boolean>>({});
  const [dbCourses, setDbCourses] = useState<any[]>([]);

  useEffect(() => {
    courseService.getCourses()
      .then(data => setDbCourses(data))
      .catch(err => console.error('Error fetching courses for breadcrumbs:', err));
  }, []);

  const generateBreadcrumbs = () => {
    const rawSegments = location.pathname.split('/').filter(x => x);
    const items = [{ label: 'Dashboard', path: user?.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard' }];
    
    const subSegments = rawSegments.filter(seg => {
      const lower = seg.toLowerCase();
      return lower !== 'student' && lower !== 'admin' && lower !== 'parent' && lower !== 'teacher' && lower !== 'reviewer' && lower !== 'dashboard';
    });
    
    let currentPath = user?.role === 'ADMIN' ? '/admin' : '/student';
    subSegments.forEach((seg) => {
      currentPath += `/${seg}`;
      items.push({
        label: getBreadcrumbLabel(seg, dbCourses),
        path: currentPath
      });
    });
    
    return items;
  };

  const toggleExpand = (path: string) => {
    setExpandedLinks(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const isLinkExpanded = (link: SidebarLink) => {
    if (expandedLinks[link.path] !== undefined) {
      return expandedLinks[link.path];
    }
    if (link.subLinks) {
      const currentFullUrl = location.pathname + location.search;
      return link.subLinks.some(sub => currentFullUrl === sub.path || location.pathname === sub.path.split('?')[0]);
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  const renderLinkItem = (link: SidebarLink) => {
    const currentFullUrl = location.pathname + location.search;
    const isParentActive = location.pathname === link.path || 
      (link.subLinks && link.subLinks.some(sub => currentFullUrl === sub.path || location.pathname === sub.path.split('?')[0]));
    const LinkIcon = link.icon;
    const hasSubLinks = !!link.subLinks && link.subLinks.length > 0;
    const expanded = hasSubLinks && isLinkExpanded(link);

    const handleParentClick = (e: React.MouseEvent) => {
      if (hasSubLinks) {
        e.preventDefault();
        toggleExpand(link.path);
      } else {
        setMobileMenuOpen(false);
      }
    };

    return (
      <div key={link.path} className="space-y-1">
        {hasSubLinks ? (
          <button
            onClick={handleParentClick}
            className={cn(
              'w-full group flex items-center justify-between px-4 py-3 rounded-xl text-sm lg:text-base font-medium transition-all duration-200 cursor-pointer relative overflow-hidden text-left focus:outline-none',
              isParentActive
                ? 'bg-gradient-to-r from-[#4F3FF0]/10 to-[#4F3FF0]/5 text-[#4F3FF0] border border-[#4F3FF0]/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                : 'text-slate-550 hover:text-slate-900 hover:bg-slate-100/60'
            )}
          >
            {isParentActive && (
              <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#4F3FF0] rounded-r-md" />
            )}
            <div className="flex items-center gap-3">
              <LinkIcon
                className={cn(
                  'h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105',
                  isParentActive ? 'text-[#4F3FF0]' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <span>{link.label}</span>
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 text-slate-400 group-hover:text-slate-650 shrink-0',
                expanded && 'rotate-180 text-[#4F3FF0]'
              )}
            />
          </button>
        ) : (
          <Link
            to={link.path}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              'group flex items-center justify-between px-4 py-3 rounded-xl text-sm lg:text-base font-medium transition-all duration-200 cursor-pointer relative overflow-hidden',
              isParentActive
                ? 'bg-gradient-to-r from-[#4F3FF0]/10 to-[#4F3FF0]/5 text-[#4F3FF0] border border-[#4F3FF0]/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                : 'text-slate-550 hover:text-slate-900 hover:bg-slate-100/60'
            )}
          >
            {isParentActive && (
              <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#4F3FF0] rounded-r-md" />
            )}
            
            <div className="flex items-center gap-3">
              <LinkIcon
                className={cn(
                  'h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105',
                  isParentActive ? 'text-[#4F3FF0]' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <span>{link.label}</span>
            </div>

            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 opacity-0 transition-all duration-200',
                isParentActive ? 'opacity-100 text-[#4F3FF0]' : 'group-hover:opacity-60 group-hover:translate-x-0.5 text-slate-400'
              )}
            />
          </Link>
        )}

        {hasSubLinks && expanded && (
          <div className="pl-5.5 mt-1.5 space-y-1.5 border-l border-slate-100 ml-6 flex flex-col">
            {link.subLinks!.map(sub => {
              const isSubActive = currentFullUrl === sub.path || (location.pathname === sub.path.split('?')[0] && location.search === sub.path.split('?')[1]);
              return (
                <Link
                  key={sub.path}
                  to={sub.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block py-2.5 px-3.5 text-xs font-medium tracking-wide rounded-lg transition-all duration-150 border border-transparent leading-none select-none',
                    isSubActive
                      ? 'bg-[#4F3FF0]/7 text-[#4F3FF0] border-[#4F3FF0]/10 shadow-[inset_0_0.5px_1px_rgba(255,255,255,0.7)]'
                      : 'text-slate-550 hover:text-slate-900 hover:bg-slate-100/60'
                  )}
                >
                  {sub.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-750 select-none">
      {/* Sidebar Header */}
      <div className="h-20 px-6 flex items-center gap-3.5 border-b border-slate-100 bg-slate-50/20">
        <div className="h-10 w-10 bg-[#4F3FF0] rounded-xl flex items-center justify-center shadow-lg shadow-[#4F3FF0]/20">
          <LogoIcon className="h-5.5 w-5.5 text-white" />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="font-extrabold text-base tracking-wide text-slate-800 leading-tight">{logoText}</h1>
          <span className="text-[10px] text-[#4F3FF0] font-bold tracking-wider uppercase">{portalName}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        {sidebarGroups ? (
          sidebarGroups.map((group, idx) => (
            <div key={group.category || idx} className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase px-4 select-none">
                {group.category}
              </div>
              <div className="space-y-1">
                {group.links.map(renderLinkItem)}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-1">
            {sidebarLinks.map(renderLinkItem)}
          </div>
        )}
      </nav>

      {/* Sidebar User Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="h-10 w-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-slate-500" />
            )}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{user?.fullName || 'User Profile'}</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-none">{user?.email || 'user@edusys.edu'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Log Out"
          className="p-2.5 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded-xl transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FD] font-sans flex flex-col md:flex-row overflow-x-hidden">
      {/* Desktop Sidebar (visible md and up) */}
      <aside className="hidden md:flex md:w-70 md:shrink-0 flex-col border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.01)] h-screen fixed left-0 top-0 z-25 overflow-hidden">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer (visible on mobile only) */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity duration-300',
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={cn(
            'fixed inset-y-0 left-0 w-72 bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button for Mobile Menu */}
          <div className="absolute right-4 top-4 z-55">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {renderSidebarContent()}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen md:pl-70">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-[#E9EDF5] px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.015)] backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-4 flex-1">
            {/* Hamburger button (mobile only) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              aria-label="Open Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Search Input (mockup matching) */}
            <div className="relative max-w-sm w-full hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search records, courses, tasks..."
                className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0]/40 focus:bg-white rounded-xl text-xs text-slate-700 placeholder-[#A0AEC0] outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Right Action Icons (mockup matching) */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors cursor-pointer">
              <Moon className="h-4.5 w-4.5" />
            </button>
            
            <button className="relative p-2 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors cursor-pointer">
              <Bell className="h-4.5 w-4.5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-[#4F3FF0] text-white text-[8px] font-extrabold rounded-full flex items-center justify-center border-2 border-white">
                1
              </span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1" />

            <div className="flex items-center gap-2 pl-1 cursor-pointer select-none group">
              <div className="h-8 w-8 rounded-full border border-slate-200 bg-[#E2E8F0] flex items-center justify-center overflow-hidden font-bold text-xs text-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                {user?.fullName ? user.fullName.charAt(0) : 'A'}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content Wrapper */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300 space-y-5">
          {generateBreadcrumbs().length > 1 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 select-none pb-2 border-b border-slate-100/40">
              {generateBreadcrumbs().map((item, idx, arr) => (
                <React.Fragment key={idx}>
                  {idx < arr.length - 1 ? (
                    <Link to={item.path} className="hover:text-[#4F3FF0] transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-slate-700 font-extrabold">{item.label}</span>
                  )}
                  {idx < arr.length - 1 && <ChevronRight className="h-3 w-3 text-slate-350 shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
