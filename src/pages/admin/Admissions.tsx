import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  UserCheck,
  TrendingUp,
  ClipboardList,
  Users,
  Mail,
  Calendar,
  Sparkles
} from 'lucide-react';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import { inquiryService, type InquiryData } from '@/services/inquiryService';
import { studentService } from '@/services/studentService';

interface Inquiry {
  inquiryId: string;
  applicantName: string;
  contactInfo: string;
  status: string; // New, Contacted, Provisionally Enrolled
  inquiryDate: string;
}

interface Student {
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  regNo: string;
  enrollmentDate: string;
  dob?: string;
  address?: string;
}

export const Admissions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inquiries' | 'students'>('inquiries');

  // --- States ---
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filters ---
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');

  // --- Modals State ---
  const [showAddInquiryModal, setShowAddInquiryModal] = useState(false);
  const [showEditInquiryModal, setShowEditInquiryModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionInquiryId, setActionInquiryId] = useState<string | null>(null);

  // --- Form States ---
  const [inquiryForm, setInquiryForm] = useState({
    applicantName: '',
    contactInfo: '',
    status: 'New',
    inquiryDate: ''
  });

  // --- Mock Fallbacks (Sandbox visualization mode) ---
  const defaultInquiries = useMemo<Inquiry[]>(() => [
    { inquiryId: 'inq-1', applicantName: 'Sharadha Madusinghe', contactInfo: 'sharadha@gmail.com', status: 'New', inquiryDate: '2026-07-11' },
    { inquiryId: 'inq-2', applicantName: 'Dilshan Perera', contactInfo: 'dilshan@gmail.com', status: 'New', inquiryDate: '2026-07-10' },
    { inquiryId: 'inq-3', applicantName: 'Kavindi Samarasinghe', contactInfo: 'kavindi@gmail.com', status: 'Contacted', inquiryDate: '2026-07-05' },
    { inquiryId: 'inq-4', applicantName: 'Sachin Samarawickrama', contactInfo: 'sachin@gmail.com', status: 'Provisionally Enrolled', inquiryDate: '2026-07-01' }
  ], []);

  const defaultStudents = useMemo<Student[]>(() => [
    { studentId: 'usr-1', fullName: 'Nethmi Wijesinghe', email: 'nethmi@gmail.com', phone: '+94771234567', status: 'ACTIVE', regNo: 'pr268924011', enrollmentDate: '2026-06-15' },
    { studentId: 'usr-2', fullName: 'Ranuka Gamage', email: 'ranuka@gmail.com', phone: '+94779876543', status: 'ACTIVE', regNo: 'pr268924012', enrollmentDate: '2026-06-18' }
  ], []);

  // --- Fetch API data ---
  const fetchAdmissionsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [inquiriesData, studentsData] = await Promise.all([
        inquiryService.getInquiries(),
        studentService.getStudents()
      ]);

      setInquiries(inquiriesData);
      setStudents(studentsData);
    } catch (err: any) {
      console.error('Error fetching admissions data:', err);
      setError('Could not connect to backend server. Running in simulated sandbox mode.');
      setInquiries(defaultInquiries);
      setStudents(defaultStudents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissionsData();
  }, [defaultInquiries, defaultStudents]);

  // --- Calculations for Dashboard KPI Stats ---
  const totalInquiriesCount = inquiries.length;
  const activeStudentsCount = students.length;
  const conversionRate = useMemo(() => {
    const total = totalInquiriesCount + activeStudentsCount;
    if (total === 0) return 0;
    return Math.round((activeStudentsCount / total) * 100);
  }, [totalInquiriesCount, activeStudentsCount]);

  // --- Filtered lists ---
  const filteredInquiries = useMemo(() => {
    return inquiries
      .filter(inq => {
        const matchesSearch = 
          inq.applicantName.toLowerCase().includes(inquirySearch.toLowerCase()) ||
          inq.contactInfo.toLowerCase().includes(inquirySearch.toLowerCase());
        
        const matchesStatus = 
          inquiryStatusFilter === 'All' || 
          inq.status === inquiryStatusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.inquiryDate).getTime() - new Date(a.inquiryDate).getTime());
  }, [inquiries, inquirySearch, inquiryStatusFilter]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      student.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.regNo.toLowerCase().includes(studentSearch.toLowerCase())
    );
  }, [students, studentSearch]);

  // --- Create/Edit/Delete Handlers ---
  const handleCreateInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.applicantName.trim()) return;

    try {
      setSubmitting(true);
      const payload: InquiryData = {
        applicantName: inquiryForm.applicantName,
        contactInfo: inquiryForm.contactInfo,
        status: inquiryForm.status,
        inquiryDate: inquiryForm.inquiryDate || new Date().toISOString().split('T')[0]
      };

      const created = await inquiryService.createInquiry(payload);
      setInquiries(prev => [created, ...prev]);
      setShowAddInquiryModal(false);
      setInquiryForm({ applicantName: '', contactInfo: '', status: 'New', inquiryDate: '' });
      alert('Admissions inquiry registered successfully!');
    } catch (err: any) {
      console.error(err);
      // Fallback
      const sandboxCreated: Inquiry = {
        inquiryId: 'inq-' + (inquiries.length + 1),
        applicantName: inquiryForm.applicantName,
        contactInfo: inquiryForm.contactInfo,
        status: inquiryForm.status,
        inquiryDate: inquiryForm.inquiryDate || new Date().toISOString().split('T')[0]
      };
      setInquiries(prev => [sandboxCreated, ...prev]);
      setShowAddInquiryModal(false);
      setInquiryForm({ applicantName: '', contactInfo: '', status: 'New', inquiryDate: '' });
      alert('Simulation: Inquiry registered locally.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInquiryClick = (inq: Inquiry) => {
    setSelectedInquiry(inq);
    setInquiryForm({
      applicantName: inq.applicantName,
      contactInfo: inq.contactInfo,
      status: inq.status,
      inquiryDate: inq.inquiryDate
    });
    setShowEditInquiryModal(true);
  };

  const handleUpdateInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry || !inquiryForm.applicantName.trim()) return;

    try {
      setSubmitting(true);
      const payload: InquiryData = {
        applicantName: inquiryForm.applicantName,
        contactInfo: inquiryForm.contactInfo,
        status: inquiryForm.status,
        inquiryDate: inquiryForm.inquiryDate
      };

      const updated = await inquiryService.updateInquiry(selectedInquiry.inquiryId, payload);
      setInquiries(prev => prev.map(item => item.inquiryId === selectedInquiry.inquiryId ? updated : item));
      setShowEditInquiryModal(false);
      alert('Admissions inquiry updated successfully!');
    } catch (err: any) {
      console.error(err);
      // Fallback
      setInquiries(prev => prev.map(item => item.inquiryId === selectedInquiry.inquiryId ? {
        ...item,
        applicantName: inquiryForm.applicantName,
        contactInfo: inquiryForm.contactInfo,
        status: inquiryForm.status,
        inquiryDate: inquiryForm.inquiryDate
      } : item));
      setShowEditInquiryModal(false);
      alert('Simulation: Inquiry updated locally.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInquiry = async (inquiryId: string, name: string) => {
    const confirm = window.confirm(`Are you sure you want to delete inquiry of "${name}"?`);
    if (!confirm) return;

    try {
      await inquiryService.deleteInquiry(inquiryId);
      setInquiries(prev => prev.filter(item => item.inquiryId !== inquiryId));
      alert('Inquiry deleted successfully.');
    } catch (err: any) {
      console.error(err);
      setInquiries(prev => prev.filter(item => item.inquiryId !== inquiryId));
      alert('Simulation: Inquiry deleted.');
    }
  };

  const handleEnrollAndActivate = async (inq: Inquiry) => {
    const confirm = window.confirm(`Enroll and activate student account for "${inq.applicantName}"? This creates standard student credentials.`);
    if (!confirm) return;

    try {
      setActionInquiryId(inq.inquiryId);
      
      const regNo = await studentService.enrollAndActivateStudent(
        inq.inquiryId,
        inq.applicantName,
        inq.contactInfo
      );

      // Remove from inquiries list
      setInquiries(prev => prev.filter(item => item.inquiryId !== inq.inquiryId));
      
      // Add to students list
      const newStudent: Student = {
        studentId: inq.inquiryId,
        fullName: inq.applicantName,
        email: inq.contactInfo,
        phone: '+94770000000',
        status: 'ACTIVE',
        regNo: regNo,
        enrollmentDate: new Date().toISOString().split('T')[0]
      };
      setStudents(prev => [newStudent, ...prev]);

      alert(`Student account successfully registered and activated! Registration Number: ${regNo}`);
    } catch (err: any) {
      console.error(err);
      // Fallback
      setInquiries(prev => prev.filter(item => item.inquiryId !== inq.inquiryId));
      const simulatedReg = 'pr26' + Math.floor(100000 + Math.random() * 900000);
      const newStudent: Student = {
        studentId: inq.inquiryId,
        fullName: inq.applicantName,
        email: inq.contactInfo,
        phone: '+94770000000',
        status: 'ACTIVE',
        regNo: simulatedReg,
        enrollmentDate: new Date().toISOString().split('T')[0]
      };
      setStudents(prev => [newStudent, ...prev]);
      alert(`Simulation: Student registered and activated! Registration Number: ${simulatedReg}`);
    } finally {
      setActionInquiryId(null);
    }
  };

  const handleDeleteStudent = async (studentId: string, name: string) => {
    const confirm = window.confirm(`Are you sure you want to terminate student account for "${name}"?`);
    if (!confirm) return;

    try {
      await studentService.deleteStudent(studentId);
      setStudents(prev => prev.filter(item => item.studentId !== studentId));
      alert('Student account terminated successfully.');
    } catch (err: any) {
      console.error(err);
      setStudents(prev => prev.filter(item => item.studentId !== studentId));
      alert('Simulation: Student account terminated.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
            <ClipboardList className="h-7 w-7 text-[#4F3FF0]" />
            Admissions Desk
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage inquiries, configure pipeline conversions, and activate student accounts.
          </p>
        </div>
        <div>
          <Button 
            variant="solid" 
            color="primary" 
            onClick={() => {
              setInquiryForm({ applicantName: '', contactInfo: '', status: 'New', inquiryDate: '' });
              setShowAddInquiryModal(true);
            }} 
            startIcon={<Plus className="h-4.5 w-4.5" />}
          >
            Add Inquiry
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-indigo-50 text-[#4F3FF0] rounded-2xl">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Inquiries</p>
            <p className="text-2xl font-black text-slate-850 mt-1">{totalInquiriesCount}</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Students</p>
            <p className="text-2xl font-black text-slate-850 mt-1">{activeStudentsCount}</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Conversion Rate</p>
            <p className="text-2xl font-black text-slate-850 mt-1">{conversionRate}%</p>
          </div>
        </div>
      </div>

      {/* Tabs Selector Bar */}
      <div className="flex border-b border-[#E2E8F0] gap-8 select-none">
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
            activeTab === 'inquiries' 
              ? 'text-[#4F3FF0] font-extrabold' 
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Inquiries Pipeline
          {activeTab === 'inquiries' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`py-3.5 text-[13px] font-bold tracking-wide transition-all relative cursor-pointer outline-none ${
            activeTab === 'students' 
              ? 'text-[#4F3FF0] font-extrabold' 
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Enrolled Students
          {activeTab === 'students' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4F3FF0] rounded-t-full" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {activeTab === 'inquiries' ? (
          <div className="space-y-6">
            {/* Inquiry Filters */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Search className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  value={inquirySearch}
                  onChange={(e) => setInquirySearch(e.target.value)}
                  placeholder="Search applicant name or email..."
                  className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0]/60 focus:bg-white rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-450 tracking-wider uppercase select-none">Status:</span>
                <select
                  value={inquiryStatusFilter}
                  onChange={(e) => setInquiryStatusFilter(e.target.value)}
                  className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#4F3FF0] cursor-pointer"
                >
                  <option value="All">All Inquiries</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Provisionally Enrolled">Provisionally Enrolled</option>
                </select>
              </div>
            </div>

            {/* Inquiries Table */}
            <div className="bg-white border border-[#E9EDF5] rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
                  <p className="text-slate-500 font-medium text-sm">Loading inquiries pipeline...</p>
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="text-center py-20">
                  <h3 className="font-bold text-slate-655">No inquiries found in pipeline</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                        <th className="px-6 py-4">APPLICANT NAME</th>
                        <th className="px-6 py-4">CONTACT EMAIL</th>
                        <th className="px-6 py-4">STATUS</th>
                        <th className="px-6 py-4">APPLIED DATE</th>
                        <th className="px-6 py-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EDF5]">
                      {filteredInquiries.map(inq => (
                        <tr key={inq.inquiryId} className="hover:bg-slate-50/30 transition-colors duration-150">
                          <td className="px-6 py-4.5 font-bold text-slate-800 text-sm">
                            {inq.applicantName}
                          </td>
                          <td className="px-6 py-4.5 text-slate-505 text-sm font-semibold">
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {inq.contactInfo}
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 border text-xs font-semibold rounded-full ${
                              inq.status === 'New' 
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : inq.status === 'Contacted'
                                ? 'bg-blue-50 text-blue-600 border-blue-200'
                                : 'bg-amber-50 text-amber-705 border-amber-200'
                            }`}>
                              {inq.status}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-slate-505 text-sm font-semibold">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {inq.inquiryDate}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {/* Enroll Button */}
                              <button
                                onClick={() => handleEnrollAndActivate(inq)}
                                disabled={actionInquiryId === inq.inquiryId}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-[#4F3FF0] hover:text-white border border-[#4F3FF0]/10 text-xs font-bold rounded-xl text-[#4F3FF0] transition-all cursor-pointer disabled:opacity-50"
                                title="Activate & Convert to Student Profile"
                              >
                                {actionInquiryId === inq.inquiryId ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UserCheck className="h-3.5 w-3.5" />
                                )}
                                Enroll
                              </button>

                              {/* Edit Button */}
                              <button 
                                onClick={() => handleEditInquiryClick(inq)}
                                className="p-2 hover:bg-slate-100 text-slate-455 hover:text-[#4F3FF0] rounded-xl transition-colors cursor-pointer"
                                title="Update Status"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              {/* Delete Button */}
                              <button 
                                onClick={() => handleDeleteInquiry(inq.inquiryId, inq.applicantName)}
                                className="p-2 hover:bg-rose-50 text-slate-455 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                                title="Delete Inquiry"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Student Search */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
              <div className="relative w-full max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Search className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search student code, name or email..."
                  className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0]/60 focus:bg-white rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 font-medium"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white border border-[#E9EDF5] rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
                  <p className="text-slate-500 font-medium text-sm">Loading active students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-20">
                  <h3 className="font-bold text-slate-655">No enrolled students found</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                        <th className="px-6 py-4">REG NO</th>
                        <th className="px-6 py-4">STUDENT NAME</th>
                        <th className="px-6 py-4">EMAIL</th>
                        <th className="px-6 py-4">STATUS</th>
                        <th className="px-6 py-4">DATE ENROLLED</th>
                        <th className="px-6 py-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EDF5]">
                      {filteredStudents.map(student => (
                        <tr key={student.studentId} className="hover:bg-slate-50/30 transition-colors duration-150">
                          <td className="px-6 py-4.5 font-bold text-[#4F3FF0] text-sm">
                            {student.regNo}
                          </td>
                          <td className="px-6 py-4.5 font-extrabold text-slate-800 text-sm">
                            {student.fullName}
                          </td>
                          <td className="px-6 py-4.5 text-slate-505 text-sm font-semibold">
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {student.email}
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                              <Sparkles className="h-3 w-3 text-emerald-600" />
                              {student.status}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-slate-505 text-sm font-medium">
                            {student.enrollmentDate}
                          </td>
                          <td className="px-6 py-4.5 text-right">
                            <button 
                              onClick={() => handleDeleteStudent(student.studentId, student.fullName)}
                              className="p-2 hover:bg-rose-50 text-slate-455 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                              title="Terminate Student Profile"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- ADD INQUIRY MODAL --- */}
      {showAddInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-805 mb-4 font-heading">Add Admissions Inquiry</h3>
            <form onSubmit={handleCreateInquirySubmit} className="space-y-4 font-sans">
              <TextField
                label="Applicant Full Name"
                value={inquiryForm.applicantName}
                onChange={e => setInquiryForm(prev => ({ ...prev, applicantName: e.target.value }))}
                placeholder="e.g. Sharadha Madusinghe"
                required
              />
              <TextField
                label="Contact Email"
                type="email"
                value={inquiryForm.contactInfo}
                onChange={e => setInquiryForm(prev => ({ ...prev, contactInfo: e.target.value }))}
                placeholder="e.g. sharadha@gmail.com"
                required
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Inquiry Pipeline Status</label>
                <select
                  value={inquiryForm.status}
                  onChange={e => setInquiryForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                >
                  <option value="New">New Application</option>
                  <option value="Contacted">Contacted / Interviewing</option>
                  <option value="Provisionally Enrolled">Provisionally Enrolled</option>
                </select>
              </div>
              <TextField
                label="Applied Date"
                type="date"
                value={inquiryForm.inquiryDate}
                onChange={e => setInquiryForm(prev => ({ ...prev, inquiryDate: e.target.value }))}
              />
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <Button type="button" variant="outline" color="secondary" onClick={() => setShowAddInquiryModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  Register Inquiry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT INQUIRY STATUS MODAL --- */}
      {showEditInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-slate-850 mb-4 font-heading">Update Inquiry Pipeline</h3>
            <form onSubmit={handleUpdateInquirySubmit} className="space-y-4 font-sans">
              <TextField
                label="Applicant Full Name"
                value={inquiryForm.applicantName}
                onChange={e => setInquiryForm(prev => ({ ...prev, applicantName: e.target.value }))}
                required
              />
              <TextField
                label="Contact Email"
                type="email"
                value={inquiryForm.contactInfo}
                onChange={e => setInquiryForm(prev => ({ ...prev, contactInfo: e.target.value }))}
                required
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-700">Inquiry Pipeline Status</label>
                <select
                  value={inquiryForm.status}
                  onChange={e => setInquiryForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-semibold outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                >
                  <option value="New">New Application</option>
                  <option value="Contacted">Contacted / Interviewing</option>
                  <option value="Provisionally Enrolled">Provisionally Enrolled</option>
                </select>
              </div>
              <TextField
                label="Applied Date"
                type="date"
                value={inquiryForm.inquiryDate}
                onChange={e => setInquiryForm(prev => ({ ...prev, inquiryDate: e.target.value }))}
              />
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" color="secondary" onClick={() => setShowEditInquiryModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" color="primary" isLoading={submitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admissions;
