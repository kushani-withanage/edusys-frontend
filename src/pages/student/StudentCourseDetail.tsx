import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronDown, 
  Check, 
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  FileText,
  ClipboardList,
  HelpCircle,
  Upload,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export interface SyllabusItem {
  id: string;
  type: 'resource' | 'assignment' | 'quiz';
  title: string;
  pdfName?: string;
  pdfUrl?: string;
  startDate?: string;
  deadline?: string;
  questionsCount?: number;
}

interface CourseDetail {
  code: string;
  name: string;
  program: string;
  level: string;
  certReqs: string[];
  qualifyReqs: string[];
  qualifyIntro?: string;
  sections: { 
    title: string; 
    content: string;
    items?: SyllabusItem[];
  }[];
  isCompulsory?: boolean;
  description?: string;
}

const courseDetailsMap: Record<string, CourseDetail> = {
  CRS_1: {
    code: 'iCD110',
    name: 'Programming Fundamentals',
    program: 'iCD Program',
    level: 'Level 1',
    certReqs: [
      'Complete at least 80% attendance based on your registration mode.',
      'Submit the final coursework for review.',
      'Attend the final examination session via LMS.',
      'Final transcript grade will be calculated as: Coursework Results (75%) + Final Exam Results (25%).'
    ],
    qualifyIntro: 'To be eligible to participate in the Industry Training Selection Test, ensure you meet the following requirements:',
    qualifyReqs: [
      'Submit the all coursework for review.',
      'Physically participate in the Final Coursework Viva Session and obtain a score of 75% or higher.',
      'You must fulfill all of the above requirements, along with the certificate eligibility criteria, to participate in the Industry Training Selection Test.'
    ],
    sections: [
      { 
        title: 'Introduction', 
        content: 'Overview of variable scoping, standard data structures, arrays, logical branching loops, and problem solving.',
        items: []
      },
      { 
        title: 'Data Types & Control Structures', 
        content: 'In-depth focus on standard types, iterative control blocks, parameters parsing, and algorithmic logic designs.',
        items: []
      }
    ],
    isCompulsory: true
  },
  ICD110: {
    code: 'iCD110',
    name: 'Advanced Software Engineering',
    program: 'iCD Program',
    level: 'Level 3',
    certReqs: [
      'Complete at least 80% attendance based on your registration mode.',
      'Submit the final coursework for review.',
      'Attend the final examination session via LMS.',
      'Final transcript grade will be calculated as: Coursework Results (75%) + Final Exam Results (25%).'
    ],
    qualifyIntro: 'To be eligible to participate in the Industry Training Selection Test, ensure you meet the following requirements:',
    qualifyReqs: [
      'Submit the all coursework for review.',
      'Physically participate in the Final Coursework Viva Session and obtain a score of 75% or higher.',
      'You must fulfill all of the above requirements, along with the certificate eligibility criteria, to participate in the Industry Training Selection Test.'
    ],
    sections: [
      { 
        title: 'Introduction', 
        content: 'Overview of Agile methodologies, DevOps pipelines, Git workflows, clean branching strategies, and collaborative code review practices for modern software development teams.',
        items: [
          { id: 'item-1', type: 'resource', title: 'Agile & Scrum Methodologies Lecture Slide', pdfName: 'Agile_Lecture_Slide.pdf' },
          { id: 'item-2', type: 'assignment', title: 'Agile Branching Strategy Hands-on Assignment', pdfName: 'Agile_Branching_Assignment.pdf', startDate: '2026-07-01', deadline: '2026-07-20' },
          { id: 'item-3', type: 'quiz', title: 'Scrum Process Basics Checkpoint Quiz', questionsCount: 10 }
        ]
      },
      { 
        title: 'System Architecture & Design', 
        content: 'Deep dive into microservices design, clean code standards, SOLID architecture design, design patterns implementation, and RESTful service modeling.',
        items: []
      }
    ],
    isCompulsory: true
  },
  CRS_2: {
    code: 'iCM111',
    name: 'Database Management System',
    program: 'iCD Program',
    level: 'Level 2',
    certReqs: [
      'Complete at least 80% attendance based on your registration mode.',
      'Submit the final web application project for review.',
      'Attend the final examination session via LMS.',
      'Final transcript grade will be calculated as: Project (60%) + Viva (40%).'
    ],
    qualifyIntro: 'To qualify for the frontend placement test, ensure you achieve:',
    qualifyReqs: [
      'Submit all portfolio web sites.',
      'Perform live presentation of dynamic database operations.',
      'Obtain recommendation from course instructor.'
    ],
    sections: [
      { 
        title: 'Introduction', 
        content: 'Basics of relational tables, SQL queries, logical constraints, and indexes.',
        items: []
      },
      { 
        title: 'Data Model', 
        content: 'Database concepts, entity relationship modeling, SQL schema construction, and relational constraints.',
        items: []
      }
    ],
    isCompulsory: true
  },
  ICM111: {
    code: 'iCM111',
    name: 'Full Stack Web Development',
    program: 'iCD Program',
    level: 'Level 1',
    certReqs: [
      'Complete at least 80% attendance based on your registration mode.',
      'Submit the final web application project for review.',
      'Attend the final examination session via LMS.',
      'Final transcript grade will be calculated as: Project (60%) + Viva (40%).'
    ],
    qualifyIntro: 'To qualify for the frontend placement test, ensure you achieve:',
    qualifyReqs: [
      'Submit all portfolio web sites.',
      'Perform live presentation of dynamic database operations.',
      'Obtain recommendation from course instructor.'
    ],
    sections: [
      { 
        title: 'Introduction', 
        content: 'Basics of HTML5 semantic elements, CSS3 flexbox/grid layout, modern JavaScript ES6 syntax, and responsive web design.',
        items: [
          { id: 'item-101', type: 'resource', title: 'HTML5 & CSS3 Essentials Slide', pdfName: 'HTML_CSS_Essentials.pdf' },
          { id: 'item-102', type: 'assignment', title: 'Responsive Portfolio Webpage Creation', pdfName: 'Responsive_Portfolio_Web.pdf', startDate: '2026-07-05', deadline: '2026-07-28' }
        ]
      },
      { 
        title: 'Data Model', 
        content: 'Database concepts, entity relationship modeling, SQL schema construction, and relational constraints.',
        items: []
      }
    ],
    isCompulsory: true
  },
  CRS_3: {
    code: 'iCD112',
    name: 'Object Oriented Programming',
    program: 'iCD Program',
    level: 'Level 1',
    certReqs: [
      'Complete 80% attendance.',
      'Submit Java assignments.',
      'Complete OOP final examination.'
    ],
    qualifyIntro: 'Requirements to qualify:',
    qualifyReqs: [
      'Submit code models.',
      'Present design patterns project.'
    ],
    sections: [
      { 
        title: 'Introduction', 
        content: 'Classes, Objects, Inheritance, Polymorphism, and Encapsulation.',
        items: []
      }
    ],
    isCompulsory: true
  },
  CRS_4: {
    code: 'iCM113',
    name: 'Internet Technologies',
    program: 'iCD Program',
    level: 'Level 2',
    certReqs: [
      'Complete web API assessment.'
    ],
    qualifyReqs: [
      'Deploy full-stack project.'
    ],
    sections: [
      { 
        title: 'Introduction', 
        content: 'Network protocols, HTTP handshakes, REST API standards.',
        items: []
      }
    ],
    isCompulsory: true
  },
  CRS_5: {
    code: 'iCD114',
    name: 'Standalone Application',
    program: 'iCD Program',
    level: 'Level 2',
    certReqs: [
      'Submit desktop client application.'
    ],
    qualifyReqs: [
      'Develop multithreading modules.'
    ],
    sections: [
      { 
        title: 'Introduction', 
        content: 'Event-driven programming, GUI tools, local storage databases.',
        items: []
      }
    ],
    isCompulsory: true
  },
  CRS_6: {
    code: 'iCD115',
    name: 'Enterprise Engineering',
    program: 'iCD Program',
    level: 'Level 3',
    certReqs: [
      'Complete full CI/CD delivery assessment.'
    ],
    qualifyReqs: [
      'Deploy cloud microservice systems.'
    ],
    sections: [
      { 
        title: 'Introduction', 
        content: 'Message brokers, microservices architecture, Docker and Kubernetes cloud orchestration.',
        items: []
      }
    ],
    isCompulsory: true
  }
};

const getStaticDescription = (code: string): string => {
  const descMap: Record<string, string> = {
    iCD110: 'Modern software engineering principles, agile development models, continuous integration, version control best practices, and enterprise system design patterns.',
    iCM111: 'Relational query design schemas, SQL query execution plans, normalization rules, indexes, and ACID transactions.',
    iCD112: 'Encapsulation, inheritance, polymorphism, abstract class overrides, design patterns, and Java syntax standards.',
    iCM113: 'HTTP protocols, REST API architectures, client-server handshake, web security standards, and responsive web configurations.',
    iCD114: 'Desktop client application development, event-driven listener structures, local storage, and multithreading processes.',
    iCD115: 'Distributed architectures, microservices, cloud deployments, message queue brokers, and automated CI/CD pipelines.'
  };
  return descMap[code] || '';
};

export const StudentCourseDetail: React.FC = () => {
  const { user } = useAuth();
  const { courseId } = useParams<{ courseId: string }>();
  
  const isAdmin = user?.role === 'ADMIN';

  // Find matching course or fall back to ICD110
  const course = useMemo(() => {
    const rawKey = courseId || 'ICD110';
    
    // First check local storage custom courses
    const stored = localStorage.getItem('custom_courses');
    if (stored) {
      const customCourses = JSON.parse(stored);
      const found = customCourses.find((c: any) => 
        c.courseId.toUpperCase() === rawKey.toUpperCase() || 
        c.batchCode.toUpperCase() === rawKey.toUpperCase()
      );
      if (found) {
        return {
          code: found.batchCode,
          name: found.courseName,
          program: 'iCD Program',
          level: found.level || 'Level 1',
          certReqs: found.certReqs || [],
          qualifyIntro: found.qualifyIntro || '',
          qualifyReqs: found.qualifyReqs || [],
          sections: found.sections || [],
          isCompulsory: found.isCompulsory !== undefined ? found.isCompulsory : true,
          description: found.description || ''
        };
      }
    }
    
    const staticKey = rawKey.toUpperCase().replace(/-/g, '_');
    const staticCourse = courseDetailsMap[staticKey] || courseDetailsMap.ICD110;
    return {
      ...staticCourse,
      description: staticCourse.description || getStaticDescription(staticCourse.code)
    };
  }, [courseId]);

  // Section expansion states (normal view)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    introduction: false,
    extra: false
  });

  const [markedDone, setMarkedDone] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // --- Live Inline Editor States ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState('Level 1');
  const [editIsCompulsory, setEditIsCompulsory] = useState(true);
  const [editCertReqs, setEditCertReqs] = useState<string[]>([]);
  const [editQualifyIntro, setEditQualifyIntro] = useState('');
  const [editQualifyReqs, setEditQualifyReqs] = useState<string[]>([]);
  const [editSections, setEditSections] = useState<{ title: string; content: string; items?: SyllabusItem[] }[]>([]);
  const [editDescription, setEditDescription] = useState('');

  // Initialize editor inputs
  const initEditorState = () => {
    setEditName(course.name);
    setEditLevel(course.level || 'Level 1');
    setEditIsCompulsory(course.isCompulsory !== undefined ? course.isCompulsory : true);
    setEditCertReqs([...course.certReqs]);
    setEditQualifyIntro(course.qualifyIntro || '');
    setEditQualifyReqs([...course.qualifyReqs]);
    setEditSections(course.sections.map((s: { title: string; content: string; items?: SyllabusItem[] }) => ({
      title: s.title,
      content: s.content,
      items: s.items ? [...s.items.map((i: SyllabusItem) => ({ ...i }))] : []
    })));
    setEditDescription(course.description || '');
  };

  // Turn edit mode on/off
  const toggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
    } else {
      initEditorState();
      setIsEditMode(true);
    }
  };

  // Edit action operations
  const handleAddCertReq = () => setEditCertReqs(prev => [...prev, '']);
  const handleUpdateCertReq = (index: number, val: string) => {
    setEditCertReqs(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };
  const handleRemoveCertReq = (index: number) => setEditCertReqs(prev => prev.filter((_, i) => i !== index));

  const handleAddQualifyReq = () => setEditQualifyReqs(prev => [...prev, '']);
  const handleUpdateQualifyReq = (index: number, val: string) => {
    setEditQualifyReqs(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };
  const handleRemoveQualifyReq = (index: number) => setEditQualifyReqs(prev => prev.filter((_, i) => i !== index));

  const handleAddSection = () => setEditSections(prev => [...prev, { title: '', content: '', items: [] }]);
  const handleUpdateSection = (index: number, field: 'title' | 'content', val: string) => {
    setEditSections(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: val
      };
      return copy;
    });
  };
  const handleRemoveSection = (index: number) => setEditSections(prev => prev.filter((_, i) => i !== index));

  // Syllabus resource/activity item management helpers
  const handleAddSyllabusItem = (sectionIdx: number, type: 'resource' | 'assignment' | 'quiz') => {
    setEditSections(prev => {
      const copy = [...prev];
      const section = copy[sectionIdx];
      const items = section.items ? [...section.items] : [];
      
      const newItem: SyllabusItem = {
        id: `item-${Date.now()}`,
        type,
        title: type === 'resource' ? 'Lecture Slide Ch 1' : type === 'assignment' ? 'Lab Assignment Ch 1' : 'Basics Checkpoint Quiz',
        pdfName: type !== 'quiz' ? 'document.pdf' : undefined,
        startDate: type === 'assignment' ? '2026-08-01' : undefined,
        deadline: type === 'assignment' ? '2026-08-15' : undefined,
        questionsCount: type === 'quiz' ? 10 : undefined
      };
      
      copy[sectionIdx] = {
        ...section,
        items: [...items, newItem]
      };
      return copy;
    });
  };

  const handleUpdateSyllabusItem = (sectionIdx: number, itemIdx: number, field: keyof SyllabusItem, val: any) => {
    setEditSections(prev => {
      const copy = [...prev];
      const section = copy[sectionIdx];
      const items = section.items ? [...section.items] : [];
      
      items[itemIdx] = {
        ...items[itemIdx],
        [field]: val
      };
      
      copy[sectionIdx] = {
        ...section,
        items
      };
      return copy;
    });
  };

  const handleRemoveSyllabusItem = (sectionIdx: number, itemIdx: number) => {
    setEditSections(prev => {
      const copy = [...prev];
      const section = copy[sectionIdx];
      const items = section.items ? [...section.items] : [];
      
      copy[sectionIdx] = {
        ...section,
        items: items.filter((_, i) => i !== itemIdx)
      };
      return copy;
    });
  };

  // Save changes to localStorage
  const handleSaveEdits = () => {
    if (!editName.trim()) {
      alert('Course name cannot be empty.');
      return;
    }

    const cleanCertReqs = editCertReqs.filter(r => r.trim() !== '');
    const cleanQualifyReqs = editQualifyReqs.filter(q => q.trim() !== '');
    const cleanSections = editSections.filter(s => s.title.trim() !== '');

    const rawKey = courseId || 'ICD110';
    const stored = localStorage.getItem('custom_courses');
    const existing: any[] = stored ? JSON.parse(stored) : [];

    const existingIndex = existing.findIndex((c: any) => 
      c.courseId.toUpperCase() === rawKey.toUpperCase() || 
      c.batchCode.toUpperCase() === rawKey.toUpperCase()
    );

    const originalBatchCode = course.code;

    const updatedCourse = {
      courseId: existingIndex > -1 ? existing[existingIndex].courseId : rawKey,
      courseName: editName,
      description: editDescription,
      credits: existingIndex > -1 ? existing[existingIndex].credits : 3,
      durationWeeks: existingIndex > -1 ? existing[existingIndex].durationWeeks : 12,
      batchCode: originalBatchCode,
      certReqs: cleanCertReqs,
      qualifyIntro: editQualifyIntro,
      qualifyReqs: cleanQualifyReqs,
      sections: cleanSections,
      level: editLevel,
      isCompulsory: editIsCompulsory
    };

    if (existingIndex > -1) {
      existing[existingIndex] = updatedCourse;
    } else {
      existing.push(updatedCourse);
    }

    localStorage.setItem('custom_courses', JSON.stringify(existing));
    alert('Course outline saved successfully!');
    setIsEditMode(false);
    
    // Reload state logic
    window.location.reload();
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Dynamic Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={toggleEditMode}
              className={`px-4 py-1.5 text-[10px] font-black rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                isEditMode
                  ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-[#4F3FF0]/30 hover:bg-[#4F3FF0]/5 text-slate-600 hover:text-[#4F3FF0]'
              }`}
            >
              <Edit2 className="h-3.5 w-3.5" />
              {isEditMode ? 'Cancel Edit' : 'Edit Mode'}
            </button>
          )}
          <Link 
            to={isAdmin ? "/admin/courses-calendars?tab=courses" : "/student/academics"} 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-650 hover:text-[#4F3FF0] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {isAdmin ? "Back to Courses Desk" : "Back to Academics"}
          </Link>
        </div>
      </div>

      {/* Accordions / Edit panel Container */}
      <div className="space-y-4">
        
        {/* Accordion 1: General */}
        <div className="bg-white border border-[#E9EDF5] rounded-3xl shadow-sm overflow-hidden transition-all duration-200">
          <button
            onClick={() => !isEditMode && toggleSection('general')}
            disabled={isEditMode}
            className={`w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 border-b border-transparent focus:outline-none ${isEditMode ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-2">
              {expandedSections.general || isEditMode ? (
                <ChevronDown className="h-4.5 w-4.5 text-slate-500" />
              ) : (
                <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
              )}
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                General {isEditMode && <span className="text-amber-500 font-bold text-[9px] lowercase tracking-normal bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded ml-2">(Edit mode)</span>}
              </span>
            </div>
          </button>

          {(expandedSections.general || isEditMode) && (
            <div className="p-6 border-t border-[#E9EDF5] space-y-6">
              
              {/* Blue Banner: Edit Mode vs Normal Mode */}
              {isEditMode ? (
                <div className="bg-gradient-to-r from-[#4F3FF0] to-[#6E5DF5] rounded-2xl p-6 text-white relative overflow-hidden flex flex-col gap-4 text-center items-center shadow-lg shadow-[#4F3FF0]/10 select-none">
                  <div className="w-full max-w-xl space-y-1">
                    <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider block text-left">Edit Banner Course Title</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full bg-white/10 text-white font-black text-2xl border border-white/20 px-4 py-2.5 rounded-xl focus:bg-white/20 focus:outline-none text-center outline-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg items-center justify-center">
                    <div className="flex-1 space-y-1 text-left w-full">
                      <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider block">Course Level</label>
                      <select
                        value={editLevel}
                        onChange={e => setEditLevel(e.target.value)}
                        className="w-full bg-white/10 text-white font-bold text-xs border border-white/20 px-3 py-2 rounded-xl focus:bg-white/20 outline-none cursor-pointer"
                      >
                        <option value="Level 1" className="text-slate-800">Level 1</option>
                        <option value="Level 2" className="text-slate-800">Level 2</option>
                        <option value="Level 3" className="text-slate-800">Level 3</option>
                        <option value="Level 4" className="text-slate-800">Level 4</option>
                      </select>
                    </div>

                    <div className="flex-1 space-y-1 text-left w-full">
                      <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider block">Course Status</label>
                      <select
                        value={editIsCompulsory ? 'Compulsory' : 'Optional'}
                        onChange={e => setEditIsCompulsory(e.target.value === 'Compulsory')}
                        className="w-full bg-white/10 text-white font-bold text-xs border border-white/20 px-3 py-2 rounded-xl focus:bg-white/20 outline-none cursor-pointer"
                      >
                        <option value="Compulsory" className="text-slate-800">Compulsory</option>
                        <option value="Optional" className="text-slate-800">Optional</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-[#4F3FF0] to-[#6E5DF5] rounded-2xl p-8 text-white relative overflow-hidden flex flex-col items-center justify-center text-center shadow-lg shadow-[#4F3FF0]/10 select-none">
                  <h1 className="text-2xl font-black font-heading tracking-tight max-w-xl leading-tight">
                    {course.name}
                  </h1>
                  <p className="text-white/80 text-[10px] font-extrabold uppercase tracking-widest mt-2">
                    {course.program} | {course.level || 'Level 1'} | {course.isCompulsory ? 'Compulsory Courses' : 'Optional Courses'}
                  </p>
                </div>
              )}

              {/* Course Description Section */}
              {isEditMode ? (
                <div className="bg-[#F8FAFC] border border-[#E9EDF5] rounded-2xl p-5 space-y-2 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Course Description</label>
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none resize-none min-h-[90px]"
                    placeholder="Enter course description here..."
                  />
                </div>
              ) : (
                course.description && (
                  <div className="bg-[#F8FAFC] border border-[#E9EDF5] rounded-2xl p-5 text-left space-y-1.5 select-none">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Course Description
                    </h4>
                    <p className="text-xs font-semibold text-slate-650 leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                )
              )}

              {/* Requirement Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Certificate Requirements Card */}
                <div className="border border-[#E9EDF5] rounded-2xl p-5 bg-white text-left space-y-4 hover:shadow-md hover:border-slate-350 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-extrabold text-[#4F3FF0] text-[11px] uppercase tracking-wider select-none">
                        Certificate Requirements
                      </h4>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={handleAddCertReq}
                          className="px-2.5 py-1 border border-[#4F3FF0]/25 hover:border-[#4F3FF0]/50 text-[#4F3FF0] hover:bg-[#4F3FF0]/5 text-[9px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </button>
                      )}
                    </div>
                    
                    <ul className="space-y-3.5 text-[11px] font-bold text-slate-700 mt-3">
                      {(isEditMode ? editCertReqs : course.certReqs).map((req: string, idx: number) => (
                        <li key={idx} className="flex gap-2.5 items-start">
                          <Check className="h-4 w-4 text-[#4F3FF0] shrink-0 mt-0.5" />
                          {isEditMode ? (
                            <div className="flex-1 flex gap-1.5 items-center">
                              <input
                                type="text"
                                required
                                value={req}
                                onChange={e => handleUpdateCertReq(idx, e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveCertReq(idx)}
                                className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="leading-relaxed">{req}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Selection Test Requirements Card */}
                <div className="border border-[#E9EDF5] rounded-2xl p-5 bg-white text-left space-y-4 hover:shadow-md hover:border-slate-350 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-extrabold text-[#4F3FF0] text-[11px] uppercase tracking-wider select-none">
                        Requirements to Qualify for Industry Training Selection Test
                      </h4>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={handleAddQualifyReq}
                          className="px-2.5 py-1 border border-[#4F3FF0]/25 hover:border-[#4F3FF0]/50 text-[#4F3FF0] hover:bg-[#4F3FF0]/5 text-[9px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </button>
                      )}
                    </div>

                    <div className="space-y-3.5 mt-3">
                      {isEditMode ? (
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Eligibility Intro</label>
                          <textarea
                            value={editQualifyIntro}
                            onChange={e => setEditQualifyIntro(e.target.value)}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none resize-none h-[60px]"
                          />
                        </div>
                      ) : (
                        <p className="text-[11px] font-semibold text-slate-450 leading-relaxed">
                          {course.qualifyIntro}
                        </p>
                      )}

                      <ul className="space-y-3.5 text-[11px] font-bold text-slate-700">
                        {(isEditMode ? editQualifyReqs : course.qualifyReqs).map((req: string, idx: number) => (
                          <li key={idx} className="flex gap-2.5 items-start">
                            <Check className="h-4 w-4 text-[#4F3FF0] shrink-0 mt-0.5" />
                            {isEditMode ? (
                              <div className="flex-1 flex gap-1.5 items-center">
                                <input
                                  type="text"
                                  required
                                  value={req}
                                  onChange={e => handleUpdateQualifyReq(idx, e.target.value)}
                                  className="flex-1 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveQualifyReq(idx)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="leading-relaxed">{req}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action buttons under general panel */}
              {!isEditMode && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setMarkedDone(prev => !prev)}
                    className={`px-4 py-2 text-[10px] font-extrabold rounded-xl border transition-all cursor-pointer ${
                      markedDone 
                        ? 'bg-[#4F3FF0] text-white border-[#4F3FF0] hover:bg-[#3D2ED0]' 
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {markedDone ? '✓ Marked as done' : 'Mark as done'}
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Dynamic Accordions list block */}
        {isEditMode ? (
          /* Editable Accordion Block list in Edit Mode */
          <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider select-none">
                  Syllabus Dropdown Sections
                </h4>
                <p className="text-slate-450 text-[9px] font-semibold mt-0.5">
                  Configure assignment accordions or course syllabus drop contents.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSection}
                className="px-3 py-1.5 bg-[#4F3FF0] text-white hover:bg-[#3D2ED0] text-[10px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shadow-md shadow-[#4F3FF0]/10"
              >
                <Plus className="h-3 w-3" />
                Add Dropdown Section
              </button>
            </div>

            <div className="space-y-4">
              {editSections.map((sect, idx) => (
                <div key={idx} className="border border-slate-150 rounded-2xl p-5 bg-slate-50/20 space-y-4 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(idx)}
                    className="absolute right-3 top-3 p-1.5 hover:bg-rose-50 text-rose-500 rounded-xl transition-all cursor-pointer"
                    title="Remove Section"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 gap-3.5 pr-8 text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Dropdown Title</label>
                      <input
                        type="text"
                        required
                        value={sect.title}
                        onChange={e => handleUpdateSection(idx, 'title', e.target.value)}
                        placeholder="e.g. Assignments / Chapter Details"
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Section Contents</label>
                      <textarea
                        required
                        value={sect.content}
                        onChange={e => handleUpdateSection(idx, 'content', e.target.value)}
                        placeholder="Detail content notes..."
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none min-h-[60px] resize-none"
                      />
                    </div>
                  </div>

                  {/* Syllabus Items List (Resources/Activities) inside Edit Mode */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 text-left">
                    <h5 className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Resources & Activities Planner</h5>
                    
                    {sect.items && sect.items.length > 0 && (
                      <div className="space-y-3 pl-4 border-l-2 border-slate-200">
                        {sect.items.map((item, itemIdx) => (
                          <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2.5 relative shadow-sm">
                            <button
                              type="button"
                              onClick={() => handleRemoveSyllabusItem(idx, itemIdx)}
                              className="absolute right-2.5 top-2.5 p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pr-8">
                              <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                                item.type === 'resource' 
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200/50' 
                                  : item.type === 'assignment'
                                  ? 'bg-indigo-50 text-[#4F3FF0] border border-indigo-200/50'
                                  : 'bg-amber-50 text-amber-600 border border-amber-250/50'
                              }`}>
                                {item.type}
                              </span>
                              <input
                                type="text"
                                required
                                value={item.title}
                                onChange={e => handleUpdateSyllabusItem(idx, itemIdx, 'title', e.target.value)}
                                placeholder="Item Title"
                                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-[#4F3FF0] rounded-xl text-xs font-bold outline-none"
                              />
                            </div>

                            {/* Conditional fields based on type */}
                            {item.type === 'resource' && (
                              <div className="flex flex-col gap-1.5 text-left">
                                <label className="text-[8px] font-bold text-slate-450 uppercase block">Upload Resource (PDF or Photo)</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    accept=".pdf, image/*"
                                    id={`upload-res-${idx}-${itemIdx}`}
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        const file = e.target.files[0];
                                        handleUpdateSyllabusItem(idx, itemIdx, 'pdfName', file.name);
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          if (event.target?.result) {
                                            handleUpdateSyllabusItem(idx, itemIdx, 'pdfUrl', event.target.result as string);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`upload-res-${idx}-${itemIdx}`}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[10px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                                  >
                                    <Upload className="h-3.5 w-3.5" /> Select File
                                  </label>
                                  {item.pdfName ? (
                                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]" title={item.pdfName}>
                                      📎 {item.pdfName}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-slate-400 italic">No file selected</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {item.type === 'assignment' && (
                              <div className="space-y-2.5 text-left">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[8px] font-bold text-slate-450 uppercase block">Upload Assignment (PDF or Photo)</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="file"
                                      accept=".pdf, image/*"
                                      id={`upload-assign-${idx}-${itemIdx}`}
                                      className="hidden"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          const file = e.target.files[0];
                                          handleUpdateSyllabusItem(idx, itemIdx, 'pdfName', file.name);
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            if (event.target?.result) {
                                              handleUpdateSyllabusItem(idx, itemIdx, 'pdfUrl', event.target.result as string);
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={`upload-assign-${idx}-${itemIdx}`}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[10px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                                    >
                                      <Upload className="h-3.5 w-3.5" /> Select File
                                    </label>
                                    {item.pdfName ? (
                                      <span className="text-[10px] font-bold text-slate-655 truncate max-w-[200px]" title={item.pdfName}>
                                        📎 {item.pdfName}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold text-slate-400 italic">No file selected</span>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Start Date</label>
                                    <input
                                      type="date"
                                      required
                                      value={item.startDate || ''}
                                      onChange={e => handleUpdateSyllabusItem(idx, itemIdx, 'startDate', e.target.value)}
                                      className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none cursor-pointer"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Deadline Date</label>
                                    <input
                                      type="date"
                                      required
                                      value={item.deadline || ''}
                                      onChange={e => handleUpdateSyllabusItem(idx, itemIdx, 'deadline', e.target.value)}
                                      className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none cursor-pointer"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {item.type === 'quiz' && (
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-bold text-slate-400 uppercase">Questions Count</label>
                                <input
                                  type="number"
                                  required
                                  value={item.questionsCount || 10}
                                  onChange={e => handleUpdateSyllabusItem(idx, itemIdx, 'questionsCount', Number(e.target.value))}
                                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Add Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleAddSyllabusItem(idx, 'resource')}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 text-[9px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" /> Add Resource PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSyllabusItem(idx, 'assignment')}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-[#4F3FF0] border border-indigo-200/50 text-[9px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" /> Add Assignment PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSyllabusItem(idx, 'quiz')}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-250/50 text-[9px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" /> Add Quiz
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Normal Collapsed/Expanded Accordion lists */
          course.sections.map((sect: { title: string; content: string; items?: SyllabusItem[] }, idx: number) => {
            const key = `sect-${idx}`;
            const isExpanded = !!expandedSections[key];
            return (
              <div key={key} className="bg-white border border-[#E9EDF5] rounded-3xl shadow-sm overflow-hidden transition-all duration-200">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer border-b border-transparent focus:outline-none"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4.5 w-4.5 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    )}
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">{sect.title}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-6 border-t border-[#E9EDF5] text-left space-y-4">
                    <p className="text-xs text-slate-650 leading-relaxed font-medium">
                      {sect.content}
                    </p>

                    {/* Resources & Activities List View */}
                    {sect.items && sect.items.length > 0 && (
                      <div className="mt-5 space-y-3.5 border-t border-slate-100 pt-5 text-left">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 select-none">
                          Resources & Activities
                        </h5>
                        <div className="grid grid-cols-1 gap-3">
                          {sect.items.map((item) => (
                            <div key={item.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 hover:border-slate-350 rounded-2xl p-4.5 transition-all duration-200 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                              <div className="flex gap-3 items-start">
                                <div className="mt-0.5 shrink-0">
                                  {item.type === 'resource' ? (
                                    <div className="h-9 w-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
                                      <FileText className="h-4.5 w-4.5" />
                                    </div>
                                  ) : item.type === 'assignment' ? (
                                    <div className="h-9 w-9 bg-indigo-50 text-[#4F3FF0] rounded-xl flex items-center justify-center border border-indigo-100">
                                      <ClipboardList className="h-4.5 w-4.5" />
                                    </div>
                                  ) : (
                                    <div className="h-9 w-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-200">
                                      <HelpCircle className="h-4.5 w-4.5" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-0.5">
                                  <h6 className="font-extrabold text-slate-850 text-xs leading-snug">
                                    {item.type === 'resource' ? 'Resource: ' : item.type === 'assignment' ? 'Assignment: ' : 'Quiz: '}
                                    {item.title}
                                  </h6>
                                  {item.type === 'resource' && (
                                    <div className="space-y-1">
                                      {item.pdfName && <p className="text-[10px] font-bold text-slate-450 uppercase">{item.pdfName}</p>}
                                      {item.pdfUrl && item.pdfUrl.startsWith('data:image/') && (
                                        <div className="mt-2 border border-slate-250 rounded-xl overflow-hidden max-w-sm shadow-sm">
                                          <img src={item.pdfUrl} alt={item.title} className="w-full h-auto object-cover max-h-40" />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {item.type === 'assignment' && (
                                    <div className="space-y-1">
                                      {item.pdfName && <p className="text-[10px] font-bold text-slate-450 uppercase">{item.pdfName}</p>}
                                      <p className="text-[9.5px] font-bold text-indigo-600">
                                        🗓️ Opens: {item.startDate} | ⏳ Deadline: {item.deadline}
                                      </p>
                                      {item.pdfUrl && item.pdfUrl.startsWith('data:image/') && (
                                        <div className="mt-2 border border-slate-250 rounded-xl overflow-hidden max-w-sm shadow-sm">
                                          <img src={item.pdfUrl} alt={item.title} className="w-full h-auto object-cover max-h-40" />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {item.type === 'quiz' && (
                                    <p className="text-[10px] font-bold text-slate-450 uppercase">Questions: {item.questionsCount || 10}</p>
                                  )}
                                </div>
                              </div>

                              <div className="w-full md:w-auto shrink-0 flex flex-col items-end gap-2">
                                {item.type === 'resource' && (
                                  <a
                                    href={`#download-${item.pdfName}`}
                                    onClick={(e) => { e.preventDefault(); alert(`Mock download started for ${item.pdfName}`); }}
                                    className="w-full md:w-auto px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 text-slate-650 text-[10px] font-black rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Download className="h-3.5 w-3.5" /> Download PDF
                                  </a>
                                )}

                                {item.type === 'quiz' && (
                                  <button
                                    onClick={() => alert(`Starting ${item.title}... Redirecting to quiz engine.`)}
                                    className="w-full md:w-auto px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-700 text-[10px] font-black rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    Start Quiz
                                  </button>
                                )}

                                {item.type === 'assignment' && (
                                  <div className="space-y-2 w-full md:w-auto">
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                      <a
                                        href={`#download-${item.pdfName}`}
                                        onClick={(e) => { e.preventDefault(); alert(`Mock download started for ${item.pdfName}`); }}
                                        className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 text-slate-650 text-[10px] font-black rounded-xl transition-all inline-flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <Download className="h-3.5 w-3.5" /> Download PDF
                                      </a>
                                    </div>
                                    
                                    {!isAdmin && (
                                      <div className="bg-slate-100/80 border border-slate-200/50 rounded-xl p-3.5 space-y-2 text-left w-full min-w-[200px]">
                                        <label className="text-[8px] font-bold text-slate-450 uppercase block">Submit File</label>
                                        <div className="flex flex-col gap-2">
                                          <input
                                            type="file"
                                            id={`file-${item.id}`}
                                            className="hidden"
                                            onChange={(e) => {
                                              if (e.target.files && e.target.files.length > 0) {
                                                const f = e.target.files[0];
                                                alert(`Successfully uploaded submission: ${f.name} for ${item.title}`);
                                              }
                                            }}
                                          />
                                          <label
                                            htmlFor={`file-${item.id}`}
                                            className="px-3 py-1.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-[9.5px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center justify-center gap-1 shadow-sm w-full"
                                          >
                                            <Upload className="h-3 w-3" /> Upload Submission
                                          </label>
                                          <span className="text-[8px] font-bold text-slate-400 text-center">Accepts PDF format (max 10MB)</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}

      </div>

      {/* Edit Mode Save / Cancel bottom bar */}
      {isEditMode && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex items-center justify-between shadow-inner select-none animate-in slide-in-from-bottom duration-250">
          <p className="text-xs font-bold text-slate-500">
            You are editing <span className="text-slate-800 font-extrabold">{course.name}</span>. Save changes to update the module template.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditMode(false)}
              className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleSaveEdits}
              className="px-6 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-lg shadow-[#4F3FF0]/15"
            >
              Save Template Changes
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentCourseDetail;
