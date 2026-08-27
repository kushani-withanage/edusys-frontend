import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserPlus, ArrowLeft, AlertCircle, Edit2, Search, Trash2, Plus, X, Check } from 'lucide-react';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import { api } from '@/utils/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const isEdit = !!userId;
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [parentUsers, setParentUsers] = useState<any[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<any[]>([]);
  
  // Student Search Modal States
  const [showStudentSearchModal, setShowStudentSearchModal] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSearchBatch, setStudentSearchBatch] = useState('All');

  // Guardian Lookup States
  const [isGuardianEmailExisting, setIsGuardianEmailExisting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'STUDENT',
    status: 'ACTIVE',
    
    // Student specific
    address: '',
    dob: '',
    enrollmentDate: '',
    gender: 'MALE',
    nic: '',
    currentBatchId: '',
    guardianName: '',
    guardianEmail: '',
    
    // Teacher specific
    specialization: '',
    joinDate: '',
    
    // Parent specific
    occupation: '',
    linkedStudentIds: [] as string[],
    
    // Reviewer specific
    expertiseArea: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [batchesData, usersData, profilesData] = await Promise.all([
          api.get<any[]>('/api/v1/batches').catch(() => []),
          api.get<any[]>('/api/v1/users').catch(() => []),
          api.get<any[]>('/api/v1/students').catch(() => [])
        ]);
        setBatches(batchesData || []);
        const studentUsers = (usersData || []).filter(u => u.role.toUpperCase() === 'STUDENT');
        const parents = (usersData || []).filter(u => u.role.toUpperCase() === 'PARENT');
        setStudents(studentUsers);
        setParentUsers(parents);
        setStudentProfiles(profilesData || []);
      } catch (err) {
        console.error('Failed to load batches/students/profiles/parents:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (formData.role === 'STUDENT' && formData.guardianEmail.trim()) {
      const email = formData.guardianEmail.trim().toLowerCase();
      const existingParent = parentUsers.find(p => p.email.toLowerCase() === email);
      if (existingParent) {
        setIsGuardianEmailExisting(true);
        setFormData(prev => ({
          ...prev,
          guardianName: existingParent.fullName
        }));
      } else {
        setIsGuardianEmailExisting(false);
      }
    } else {
      setIsGuardianEmailExisting(false);
    }
  }, [formData.guardianEmail, parentUsers, formData.role]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.fullName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                            s.email.toLowerCase().includes(studentSearchQuery.toLowerCase());
      
      let matchesBatch = true;
      if (studentSearchBatch !== 'All') {
        const profile = studentProfiles.find(p => p.studentId === s.userId);
        matchesBatch = profile?.currentBatchId === studentSearchBatch;
      }
      
      return matchesSearch && matchesBatch;
    });
  }, [students, studentProfiles, studentSearchQuery, studentSearchBatch]);

  useEffect(() => {
    if (!userId) return;
    
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const user = await api.get<any>(`/api/v1/users/${userId}`);
        if (user && user.fullName) {
          localStorage.setItem(`user_name_${userId}`, user.fullName);
          window.dispatchEvent(new Event('update-breadcrumbs'));
        }
        const role = user.role.toUpperCase();
        
        let roleDetails: any = {};
        let linkedStudentIds: string[] = [];
        try {
          if (role === 'STUDENT') {
            roleDetails = await api.get<any>(`/api/v1/students/${userId}`);
          } else if (role === 'TEACHER') {
            roleDetails = await api.get<any>(`/api/v1/teachers/${userId}`);
          } else if (role === 'PARENT') {
            roleDetails = await api.get<any>(`/api/v1/parents/${userId}`);
            const links = await api.get<any[]>('/api/v1/parent-student-links').catch(() => []);
            const parentLinks = links.filter(l => l.parentId === userId);
            linkedStudentIds = parentLinks.map(l => l.studentId);
          } else if (role === 'REVIEWER') {
            roleDetails = await api.get<any>(`/api/v1/reviewers/${userId}`);
          } else if (role === 'ADMIN') {
            roleDetails = await api.get<any>(`/api/v1/admins/${userId}`);
          }
        } catch (roleErr) {
          console.warn(`Failed to fetch role-specific details for role ${role}, proceeding with fallback:`, roleErr);
        }
        
        setFormData({
          fullName: roleDetails.fullName || user.fullName || '',
          email: roleDetails.email || user.email || '',
          password: '',
          phone: roleDetails.phone || user.phone || '',
          role: role,
          status: roleDetails.status || user.status || 'ACTIVE',
          address: roleDetails.address || '',
          dob: roleDetails.dob || '',
          enrollmentDate: roleDetails.enrollmentDate || '',
          gender: roleDetails.gender || 'MALE',
          nic: roleDetails.nic || '',
          currentBatchId: roleDetails.currentBatchId || '',
          guardianName: roleDetails.guardianName || '',
          guardianEmail: roleDetails.guardianEmail || '',
          specialization: roleDetails.specialization || '',
          joinDate: roleDetails.joinDate || '',
          occupation: roleDetails.occupation || '',
          linkedStudentIds: linkedStudentIds,
          expertiseArea: roleDetails.expertiseArea || ''
        });
      } catch (err: any) {
        console.error('Failed to load user details for editing:', err);
        setError('Failed to load user details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when editing field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!isEdit) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      }
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    // Role specific validation
    if (formData.role === 'STUDENT') {
      if (!formData.dob) {
        errors.dob = 'Date of Birth is required';
      }
      if (!formData.address.trim()) {
        errors.address = 'Address is required';
      }
      if (!formData.enrollmentDate) {
        errors.enrollmentDate = 'Enrollment date is required';
      }
      if (!formData.nic.trim()) {
        errors.nic = 'NIC is required';
      }
      if (!formData.currentBatchId) {
        errors.currentBatchId = 'Batch assignment is required';
      }
      if (!formData.guardianName.trim()) {
        errors.guardianName = 'Guardian Name is required';
      }
      if (!formData.guardianEmail.trim()) {
        errors.guardianEmail = 'Guardian Email is required';
      }
    } else if (formData.role === 'TEACHER') {
      if (!formData.specialization.trim()) {
        errors.specialization = 'Specialization is required';
      }
      if (!formData.joinDate) {
        errors.joinDate = 'Join date is required';
      }
    } else if (formData.role === 'PARENT') {
      if (!formData.occupation.trim()) {
        errors.occupation = 'Occupation is required';
      }
      if (!formData.linkedStudentIds || formData.linkedStudentIds.length === 0) {
        errors.linkedStudentIds = 'At least one linked student is required';
      }
    } else if (formData.role === 'REVIEWER') {
      if (!formData.expertiseArea.trim()) {
        errors.expertiseArea = 'Expertise area is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      
      if (isEdit) {
        const payload: any = {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          status: formData.status
        };
        
        let endpoint = '';
        const role = formData.role.toUpperCase();
        if (role === 'STUDENT') {
          endpoint = `/api/v1/students/${userId}`;
          Object.assign(payload, {
            studentId: userId,
            address: formData.address.trim(),
            dob: formData.dob,
            enrollmentDate: formData.enrollmentDate,
            gender: formData.gender,
            nic: formData.nic.trim(),
            currentBatchId: formData.currentBatchId,
            guardianName: formData.guardianName.trim(),
            guardianEmail: formData.guardianEmail.trim()
          });
        } else if (role === 'TEACHER') {
          endpoint = `/api/v1/teachers/${userId}`;
          Object.assign(payload, {
            teacherId: userId,
            specialization: formData.specialization.trim(),
            joinDate: formData.joinDate
          });
        } else if (role === 'PARENT') {
          endpoint = `/api/v1/parents/${userId}`;
          Object.assign(payload, {
            parentId: userId,
            occupation: formData.occupation.trim()
          });
          try {
            const links = await api.get<any[]>('/api/v1/parent-student-links').catch(() => []);
            const existingLinks = links.filter(l => l.parentId === userId);
            const currentIds = formData.linkedStudentIds;
            
            // Delete links that are no longer selected
            for (const link of existingLinks) {
              if (!currentIds.includes(link.studentId)) {
                await api.delete(`/api/v1/parent-student-links/${link.linkId}`);
              }
            }
            
            // Add new links
            const existingStudentIds = existingLinks.map(l => l.studentId);
            for (const sId of currentIds) {
              if (!existingStudentIds.includes(sId)) {
                await api.post('/api/v1/parent-student-links', {
                  parentId: userId,
                  studentId: sId,
                  relationshipType: 'Guardian',
                  linkedDate: new Date().toISOString().split('T')[0]
                });
              }
            }
          } catch (linkErr) {
            console.error('Failed to sync parent-student links:', linkErr);
          }
        } else if (role === 'REVIEWER') {
          endpoint = `/api/v1/reviewers/${userId}`;
          Object.assign(payload, {
            reviewerId: userId,
            expertiseArea: formData.expertiseArea.trim()
          });
        } else if (role === 'ADMIN') {
          endpoint = `/api/v1/admins/${userId}`;
          Object.assign(payload, {
            adminId: userId
          });
        }
        
        await api.put(endpoint, payload);
        alert('User details updated successfully!');
        navigate('/admin/users-roles');
      } else {
        const registerRes = await api.post<any>('/api/v1/auth/register', {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim(),
          role: formData.role.toUpperCase()
        });

        const newUserId = registerRes.userId;

        if (formData.role === 'STUDENT') {
          await api.post('/api/v1/students', {
            studentId: newUserId,
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            status: 'ACTIVE',
            address: formData.address.trim(),
            dob: formData.dob,
            enrollmentDate: formData.enrollmentDate,
            gender: formData.gender,
            nic: formData.nic.trim(),
            currentBatchId: formData.currentBatchId,
            guardianName: formData.guardianName.trim(),
            guardianEmail: formData.guardianEmail.trim()
          });
        } else if (formData.role === 'TEACHER') {
          await api.post('/api/v1/teachers', {
            teacherId: newUserId,
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            status: 'ACTIVE',
            specialization: formData.specialization.trim(),
            joinDate: formData.joinDate
          });
        } else if (formData.role === 'PARENT') {
          await api.post('/api/v1/parents', {
            parentId: newUserId,
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            status: 'ACTIVE',
            occupation: formData.occupation.trim()
          });
          if (formData.linkedStudentIds && formData.linkedStudentIds.length > 0) {
            try {
              for (const sId of formData.linkedStudentIds) {
                await api.post('/api/v1/parent-student-links', {
                  parentId: newUserId,
                  studentId: sId,
                  relationshipType: 'Guardian',
                  linkedDate: new Date().toISOString().split('T')[0]
                });
              }
            } catch (linkErr) {
              console.error('Failed to create parent-student links:', linkErr);
            }
          }
        } else if (formData.role === 'REVIEWER') {
          await api.post('/api/v1/reviewers', {
            reviewerId: newUserId,
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            status: 'ACTIVE',
            expertiseArea: formData.expertiseArea.trim()
          });
        } else if (formData.role === 'ADMIN') {
          await api.post('/api/v1/admins', {
            adminId: newUserId,
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            status: 'ACTIVE',
            department: 'Management'
          });
        }

        alert('User added successfully!');
        navigate('/admin/users-roles');
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.message || 'Failed to save user. The email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/users-roles')}
          className="p-2.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-600 rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
          title="Back to Users & Roles"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            {isEdit ? 'Edit User Details' : 'Add New User'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-semibold">
            {isEdit ? 'Update account details and role-specific profile information.' : 'Create a new user account with specific role and system permissions.'}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form Container */}
      <div className="bg-white border border-[#E9EDF5] rounded-2xl shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <TextField
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              error={validationErrors.fullName}
              required
              disabled={loading}
            />

            {/* Email Address */}
            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              error={validationErrors.email}
              required
              disabled={loading || isEdit}
            />

            {/* Password */}
            {!isEdit && (
              <TextField
                label="Temporary Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Temporary Password"
                error={validationErrors.password}
                required
                disabled={loading}
              />
            )}

            {/* Role selection */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold tracking-wider uppercase select-none text-slate-700">
                User Role <span className="text-rose-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading || isEdit}
                className={`w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-medium outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer ${(loading || isEdit) ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="REVIEWER">Reviewer</option>
                <option value="ADMIN">Admin</option>
                <option value="PARENT">Parent</option>
              </select>
            </div>

            {/* Phone Number */}
            <TextField
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder=""
              error={validationErrors.phone}
              required
              disabled={loading}
            />

            {/* Account Status (Edit Mode only) */}
            {isEdit && (
              <div className="space-y-1.5 text-left animate-in fade-in duration-200">
                <label className="block text-xs font-bold tracking-wider uppercase select-none text-slate-700">
                  Account Status <span className="text-rose-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-medium outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {/* Student Specific Fields */}
          {formData.role === 'STUDENT' && (
            <div className="pt-6 border-t border-slate-100 space-y-5 animate-in fade-in duration-200">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#4F3FF0] select-none">Student Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Gender */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold tracking-wider uppercase select-none text-slate-700">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-medium outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* DOB */}
                <TextField
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  error={validationErrors.dob}
                  required
                  disabled={loading}
                />

                {/* NIC */}
                <TextField
                  label="NIC Number"
                  name="nic"
                  value={formData.nic}
                  onChange={handleChange}
                  placeholder="NIC Number"
                  error={validationErrors.nic}
                  required
                  disabled={loading}
                />

                {/* Batch Selector */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold tracking-wider uppercase select-none text-slate-700">
                    Current Batch <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="currentBatchId"
                    value={formData.currentBatchId}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-medium outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
                  >
                    <option value="">Select Batch</option>
                    {batches.map(b => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.batchName}
                      </option>
                    ))}
                  </select>
                  {validationErrors.currentBatchId && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">{validationErrors.currentBatchId}</p>
                  )}
                </div>

                 {/* Guardian Name */}
                 <div className="relative">
                   <TextField
                     label="Guardian Name"
                     name="guardianName"
                     value={formData.guardianName}
                     onChange={handleChange}
                     placeholder="Guardian Name"
                     error={validationErrors.guardianName}
                     required
                     disabled={loading || isGuardianEmailExisting}
                   />
                   {isGuardianEmailExisting && (
                     <span className="absolute right-3 top-9 text-[10px] bg-[#4F3FF0]/10 text-[#4F3FF0] font-bold px-2.5 py-0.5 rounded-full select-none">
                       Linked Parent
                     </span>
                   )}
                 </div>

                {/* Guardian Email */}
                <TextField
                  label="Guardian Email Address"
                  name="guardianEmail"
                  type="email"
                  value={formData.guardianEmail}
                  onChange={handleChange}
                  placeholder="Guardian Email Address"
                  error={validationErrors.guardianEmail}
                  required
                  disabled={loading}
                />

                {/* Address */}
                <TextField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder=""
                  error={validationErrors.address}
                  required
                  disabled={loading}
                />

                {/* Enrollment Date */}
                <TextField
                  label="Enrollment Date"
                  name="enrollmentDate"
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={handleChange}
                  error={validationErrors.enrollmentDate}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Teacher Specific Fields */}
          {formData.role === 'TEACHER' && (
            <div className="pt-6 border-t border-slate-100 space-y-5 animate-in fade-in duration-200">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#4F3FF0] select-none">Teacher Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Specialization */}
                <TextField
                  label="Specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder=""
                  error={validationErrors.specialization}
                  required
                  disabled={loading}
                />

                {/* Join Date */}
                <TextField
                  label="Join Date"
                  name="joinDate"
                  type="date"
                  value={formData.joinDate}
                  onChange={handleChange}
                  error={validationErrors.joinDate}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Parent Specific Fields */}
          {formData.role === 'PARENT' && (
            <div className="pt-6 border-t border-slate-100 space-y-5 animate-in fade-in duration-200">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#4F3FF0] select-none">Parent Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Occupation */}
                <TextField
                  label="Occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder=""
                  error={validationErrors.occupation}
                  required
                  disabled={loading}
                />

                {/* Related Students List & Selector */}
                <div className="space-y-3 text-left md:col-span-2">
                  <div className="flex items-center justify-between border-b border-[#E9EDF5] pb-2">
                    <label className="block text-xs font-bold tracking-wider uppercase select-none text-slate-700">
                      Related Student(s) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowStudentSearchModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4F3FF0]/10 hover:bg-[#4F3FF0]/20 text-[#4F3FF0] text-xs font-bold rounded-xl transition-all cursor-pointer select-none"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Link Student
                    </button>
                  </div>

                  {formData.linkedStudentIds.length === 0 ? (
                    <div className="border-2 border-dashed border-[#E2E8F0] rounded-2xl p-6 text-center select-none bg-slate-50/50">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No students linked to this parent yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.linkedStudentIds.map(sId => {
                        const studentUser = students.find(u => u.userId === sId);
                        const profile = studentProfiles.find(p => p.studentId === sId);
                        const batchName = batches.find(b => b.batchId === profile?.currentBatchId)?.batchName || 'No Batch';
                        return (
                          <div key={sId} className="flex items-center justify-between p-3.5 bg-white border border-[#E9EDF5] rounded-xl hover:border-slate-350 transition-colors shadow-sm">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{studentUser?.fullName || 'Unknown Student'}</p>
                              <p className="text-[10px] text-slate-450 font-medium mt-0.5">{studentUser?.email || '-'}</p>
                              <span className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-full uppercase tracking-wider select-none">
                                {batchName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  linkedStudentIds: prev.linkedStudentIds.filter(id => id !== sId)
                                }));
                              }}
                              className="p-1.5 hover:bg-rose-50 text-slate-450 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Unlink Student"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {validationErrors.linkedStudentIds && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">{validationErrors.linkedStudentIds}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reviewer Specific Fields */}
          {formData.role === 'REVIEWER' && (
            <div className="pt-6 border-t border-slate-100 space-y-5 animate-in fade-in duration-200">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#4F3FF0] select-none">Reviewer Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Expertise Area */}
                <TextField
                  label="Expertise Area"
                  name="expertiseArea"
                  value={formData.expertiseArea}
                  onChange={handleChange}
                  placeholder=""
                  error={validationErrors.expertiseArea}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9EDF5] mt-6">
            <Button
              type="button"
              variant="outline"
              color="secondary"
              onClick={() => navigate('/admin/users-roles')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="solid"
              color="primary"
              isLoading={loading}
              startIcon={isEdit ? <Edit2 className="h-4.5 w-4.5" /> : <UserPlus className="h-4.5 w-4.5" />}
            >
              {isEdit ? 'Save Changes' : 'Add User'}
            </Button>
          </div>
        </form>
      </div>

      {/* --- STUDENT LINK SEARCH MODAL --- */}
      {showStudentSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#E9EDF5] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Link Student Profiles</h3>
                <p className="text-xs text-slate-450 mt-0.5 font-medium">Search and select active student records to link with this parent.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStudentSearchQuery('');
                  setStudentSearchBatch('All');
                  setShowStudentSearchModal(false);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-450 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-5 border-b border-[#E9EDF5] bg-white flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search by student name or email..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 outline-none transition-colors"
                />
              </div>

              <select
                value={studentSearchBatch}
                onChange={(e) => setStudentSearchBatch(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#4F3FF0] cursor-pointer"
              >
                <option value="All">All Batches</option>
                {batches.map(b => (
                  <option key={b.batchId} value={b.batchId}>{b.batchName}</option>
                ))}
              </select>
            </div>

            {/* Modal List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2.5 bg-slate-50/30">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No matching students found</p>
                </div>
              ) : (
                filteredStudents.map(s => {
                  const isLinked = formData.linkedStudentIds.includes(s.userId);
                  const profile = studentProfiles.find(p => p.studentId === s.userId);
                  const batchName = batches.find(b => b.batchId === profile?.currentBatchId)?.batchName || 'No Batch';
                  return (
                    <div
                      key={s.userId}
                      onClick={() => {
                        if (isLinked) {
                          setFormData(prev => ({
                            ...prev,
                            linkedStudentIds: prev.linkedStudentIds.filter(id => id !== s.userId)
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            linkedStudentIds: [...prev.linkedStudentIds, s.userId]
                          }));
                        }
                      }}
                      className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer select-none transition-all duration-200 ${isLinked ? 'bg-[#4F3FF0]/5 border-[#4F3FF0] shadow-sm' : 'bg-white border-[#E9EDF5] hover:border-slate-350 hover:shadow-sm'}`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{s.fullName}</p>
                        <p className="text-[10px] text-slate-450 font-medium mt-0.5">{s.email}</p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-full uppercase tracking-wider select-none">
                          {batchName}
                        </span>
                      </div>
                      <div>
                        {isLinked ? (
                          <span className="h-7 w-7 bg-[#4F3FF0] text-white rounded-full flex items-center justify-center">
                            <Check className="h-4.5 w-4.5" />
                          </span>
                        ) : (
                          <span className="h-7 w-7 border border-[#E2E8F0] hover:border-[#4F3FF0] hover:bg-slate-50 text-slate-500 hover:text-[#4F3FF0] rounded-full flex items-center justify-center transition-colors">
                            <Plus className="h-4.5 w-4.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#E9EDF5] flex items-center justify-between bg-[#F8FAFC]">
              <span className="text-xs text-slate-500 font-bold select-none">
                {formData.linkedStudentIds.length} Student(s) Selected
              </span>
              <button
                type="button"
                onClick={() => {
                  setStudentSearchQuery('');
                  setStudentSearchBatch('All');
                  setShowStudentSearchModal(false);
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUser;
