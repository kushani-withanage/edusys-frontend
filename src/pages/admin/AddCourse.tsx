import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Check, 
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { courseService } from '@/services/courseService';
import { toast } from '@/utils/toast';
import { batchService } from '@/services/batchService';

interface CustomCourseSection {
  title: string;
  content: string;
}

export const AddCourse: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // --- Form States ---
  const [courseName, setCourseName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [credits, setCredits] = useState(3);
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('Level 1');
  const [isCompulsory, setIsCompulsory] = useState(true);

  const [dbBatches, setDbBatches] = useState<any[]>([]);

  useEffect(() => {
    // Fetch batches
    batchService.getBatches()
      .then(data => {
        setDbBatches(data);
        if (data.length > 0) {
          setBatchCode(data[0].batchName);
        }
      })
      .catch(err => console.error('Error loading batches:', err));
  }, []);

  // Template States
  const [certReqs, setCertReqs] = useState<string[]>([
    'Complete at least 80% attendance based on your registration mode.',
    'Submit the final coursework for review.',
    'Attend the final examination session via LMS.'
  ]);

  const [qualifyIntro, setQualifyIntro] = useState(
    'To be eligible to participate in the Industry Training Selection Test, ensure you meet the following requirements:'
  );
  
  const [qualifyReqs, setQualifyReqs] = useState<string[]>([
    'Submit all coursework for review.',
    'Physically participate in the Final Coursework Viva Session and obtain a score of 75% or higher.'
  ]);

  const [sections, setSections] = useState<CustomCourseSection[]>([
    { title: 'Introduction', content: 'Basic overview modules, roadmap specifications, and workspace tools configuration.' }
  ]);

  // --- Handlers for Dynamic Lists ---
  const handleAddCertReq = () => {
    setCertReqs(prev => [...prev, '']);
  };

  const handleUpdateCertReq = (index: number, val: string) => {
    setCertReqs(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveCertReq = (index: number) => {
    setCertReqs(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddQualifyReq = () => {
    setQualifyReqs(prev => [...prev, '']);
  };

  const handleUpdateQualifyReq = (index: number, val: string) => {
    setQualifyReqs(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveQualifyReq = (index: number) => {
    setQualifyReqs(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSection = () => {
    setSections(prev => [...prev, { title: '', content: '' }]);
  };

  const handleUpdateSection = (index: number, field: 'title' | 'content', val: string) => {
    setSections(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: val
      };
      return copy;
    });
  };

  const handleRemoveSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  // --- Submit handler ---
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) {
      alert('Please enter a course title.');
      return;
    }

    // Filter out empty requirements
    const cleanCertReqs = certReqs.filter(r => r.trim() !== '');
    const cleanQualifyReqs = qualifyReqs.filter(q => q.trim() !== '');
    const cleanSections = sections.filter(s => s.title.trim() !== '');

    const payload = {
      courseName,
      description,
      credits: Number(credits),
      durationWeeks: Number(durationWeeks),
      batchCode,
      certReqs: JSON.stringify(cleanCertReqs),
      qualifyIntro,
      qualifyReqs: JSON.stringify(cleanQualifyReqs),
      sections: JSON.stringify(cleanSections),
      level,
      isCompulsory
    };

    try {
      setSubmitting(true);
      await courseService.createCourse(payload);
      toast.success('New Course Template saved successfully!');
      navigate('/admin/courses-calendars?tab=courses');
    } catch (err) {
      console.error(err);
      // Fallback to local storage custom courses list if api fails
      const stored = localStorage.getItem('custom_courses');
      const existing = stored ? JSON.parse(stored) : [];
      const fallbackPayload = {
        ...payload,
        courseId: 'crs-custom-' + Date.now(),
        certReqs: cleanCertReqs,
        qualifyReqs: cleanQualifyReqs,
        sections: cleanSections
      };
      localStorage.setItem('custom_courses', JSON.stringify([...existing, fallbackPayload]));
      toast.warning('New Course Template saved successfully (simulated fallback)!');
      navigate('/admin/courses-calendars?tab=courses');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-left">
      
      {/* Breadcrumbs & Navigation */}
      <div className="flex justify-end">
        <Link 
          to="/admin/courses-calendars?tab=courses" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#4F3FF0] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Courses Desk
        </Link>
      </div>

      {/* Main Container */}
      <form onSubmit={handleSaveCourse} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: General Configuration parameters */}
        <div className="lg:col-span-1 space-y-6 bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 select-none border-b border-slate-100 pb-3">
            <BookOpen className="h-4 w-4 text-[#4F3FF0]" />
            Course Settings
          </h3>

          <div className="space-y-4">
            
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Course Title</label>
              <input
                type="text"
                required
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                placeholder="e.g. Advanced Software Engineering"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none"
              />
            </div>

            {/* Select Batch */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Associated Batch</label>
              <select
                value={batchCode}
                onChange={e => setBatchCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none cursor-pointer"
              >
                {dbBatches.length > 0 ? (
                  dbBatches.map(b => (
                    <option key={b.batchId} value={b.batchName}>{b.batchName}</option>
                  ))
                ) : (
                  <>
                    <option value="iCD110">iCD110</option>
                    <option value="iCM111">iCM111</option>
                    <option value="iCD112">iCD112</option>
                    <option value="iCM113">iCM113</option>
                    <option value="iCD114">iCD114</option>
                    <option value="iCD115">iCD115</option>
                  </>
                )}
              </select>
            </div>

            {/* Select Level */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Course Level</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none cursor-pointer"
              >
                <option value="Level 1">Level 1</option>
                <option value="Level 2">Level 2</option>
                <option value="Level 3">Level 3</option>
              </select>
            </div>

            {/* Select Compulsory/Optional */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Course Requirement Status</label>
              <select
                value={isCompulsory ? 'Compulsory' : 'Optional'}
                onChange={e => setIsCompulsory(e.target.value === 'Compulsory')}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none cursor-pointer"
              >
                <option value="Compulsory">Compulsory</option>
                <option value="Optional">Optional</option>
              </select>
            </div>

            {/* Credits */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Academic Credits</label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={credits}
                onChange={e => setCredits(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none"
              />
            </div>

            {/* Duration (Weeks) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Duration (Weeks)</label>
              <input
                type="number"
                min="1"
                max="52"
                required
                value={durationWeeks}
                onChange={e => setDurationWeeks(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Outline / Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief summary outline of the syllabus modules..."
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none min-h-[90px] resize-none"
              />
            </div>

          </div>
        </div>

        {/* Right Columns: Template Builder */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Certificate & Industry Qualifications Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Certificate Requirements Template */}
            <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-[#4F3FF0] text-[11px] uppercase tracking-wider select-none">
                  Certificate Requirements
                </h4>
                <button
                  type="button"
                  onClick={handleAddCertReq}
                  className="px-2.5 py-1 border border-[#4F3FF0]/25 hover:border-[#4F3FF0]/50 text-[#4F3FF0] hover:bg-[#4F3FF0]/5 text-[9px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {certReqs.map((req, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Check className="h-4 w-4 text-[#4F3FF0] shrink-0" />
                    <input
                      type="text"
                      required
                      value={req}
                      onChange={e => handleUpdateCertReq(idx, e.target.value)}
                      placeholder="e.g. Complete 80% attendance"
                      className="flex-1 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCertReq(idx)}
                      className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualification Requirements Template */}
            <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-[#4F3FF0] text-[11px] uppercase tracking-wider select-none">
                  Industry Training Qualifications
                </h4>
                <button
                  type="button"
                  onClick={handleAddQualifyReq}
                  className="px-2.5 py-1 border border-[#4F3FF0]/25 hover:border-[#4F3FF0]/50 text-[#4F3FF0] hover:bg-[#4F3FF0]/5 text-[9px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Eligibility Intro Message</label>
                  <textarea
                    value={qualifyIntro}
                    onChange={e => setQualifyIntro(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none resize-none h-[60px]"
                  />
                </div>

                <div className="space-y-3">
                  {qualifyReqs.map((req, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Check className="h-4 w-4 text-[#4F3FF0] shrink-0" />
                      <input
                        type="text"
                        required
                        value={req}
                        onChange={e => handleUpdateQualifyReq(idx, e.target.value)}
                        placeholder="e.g. Obtain score of 75% or higher"
                        className="flex-1 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveQualifyReq(idx)}
                        className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Collapsible Dropdown Sections (Dynamic Accordions) */}
          <div className="bg-white border border-[#E9EDF5] p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider select-none">
                  Syllabus Dropdown Sections
                </h4>
                <p className="text-slate-450 text-[9px] font-semibold mt-0.5">
                  Add dynamic collapsible accordions (e.g. Introduction, Assignments, Course Materials).
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
              {sections.map((sect, idx) => (
                <div key={idx} className="border border-slate-100 rounded-2xl p-4.5 bg-slate-50/30 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(idx)}
                    className="absolute right-3 top-3 p-1.5 hover:bg-rose-50 text-rose-500 rounded-xl transition-all cursor-pointer"
                    title="Remove Section"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 gap-3.5 pr-8">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Dropdown Title</label>
                      <input
                        type="text"
                        required
                        value={sect.title}
                        onChange={e => handleUpdateSection(idx, 'title', e.target.value)}
                        placeholder="e.g. Topic 1: System Models / Assignments"
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Section Contents</label>
                      <textarea
                        required
                        value={sect.content}
                        onChange={e => handleUpdateSection(idx, 'content', e.target.value)}
                        placeholder="Detail information displayed inside this accordion..."
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-medium outline-none min-h-[60px] resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {sections.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  No dropdown sections created yet. Add sections to represent assignments or course contents!
                </div>
              )}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex gap-4 items-center justify-end select-none">
            <Link
              to="/admin/courses-calendars?tab=courses"
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-extrabold rounded-xl transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-lg shadow-[#4F3FF0]/15 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Course Template'}
            </button>
          </div>

        </div>

      </form>

    </div>
  );
};

export default AddCourse;
