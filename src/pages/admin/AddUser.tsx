import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, AlertCircle } from 'lucide-react';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import { api } from '@/utils/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'STUDENT',
    
    // Student specific
    address: '',
    dob: '',
    enrollmentDate: '',
    gender: 'MALE',
    nic: '',
    
    // Teacher specific
    specialization: '',
    joinDate: '',
    
    // Parent specific
    occupation: '',
    
    // Reviewer specific
    expertiseArea: ''
  });
  
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
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
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
      
      // 1. Call authentication register endpoint to create the user with password
      const registerRes = await api.post<any>('/api/v1/auth/register', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role.toUpperCase()
      });

      const newUserId = registerRes.userId;

      // 2. Create the role-specific profile linked to newUserId
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
          nic: formData.nic.trim()
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
      } else if (formData.role === 'REVIEWER') {
        await api.post('/api/v1/reviewers', {
          reviewerId: newUserId,
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          status: 'ACTIVE',
          expertiseArea: formData.expertiseArea.trim()
        });
      }

      alert('User added successfully!');
      navigate('/admin/users-roles');
    } catch (err: any) {
      console.error('Error adding user:', err);
      setError(err.message || 'Failed to create user. The email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
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
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Add New User</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Create a new user account with specific role and system permissions.
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
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <TextField
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g. Sachin Samarawickrama"
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
            placeholder="e.g. sachin@edusys.edu"
            error={validationErrors.email}
            required
            disabled={loading}
          />

          {/* Password */}
          <TextField
            label="Temporary Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min. 6 characters password"
            error={validationErrors.password}
            required
            disabled={loading}
          />

          {/* Role selection */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold tracking-wider uppercase select-none text-slate-700">
              User Role <span className="text-rose-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-4 pr-10 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-sm text-slate-800 font-medium outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 cursor-pointer"
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
            placeholder="e.g. +94 77 123 4567"
            error={validationErrors.phone}
            required
            disabled={loading}
          />

          {/* Student Specific Fields */}
          {formData.role === 'STUDENT' && (
            <div className="pt-4 border-t border-slate-100 space-y-5 animate-in fade-in duration-200">
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
              </div>

              {/* NIC */}
              <TextField
                label="NIC Number"
                name="nic"
                value={formData.nic}
                onChange={handleChange}
                placeholder="e.g. 200456123987 or 991234567V"
                error={validationErrors.nic}
                required
                disabled={loading}
              />

              {/* Address */}
              <TextField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. 123 Galle Road, Colombo"
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
          )}

          {/* Teacher Specific Fields */}
          {formData.role === 'TEACHER' && (
            <div className="pt-4 border-t border-slate-100 space-y-5 animate-in fade-in duration-200">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#4F3FF0] select-none">Teacher Information</h3>

              {/* Specialization */}
              <TextField
                label="Specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="e.g. Java Enterprise Development, Database Systems"
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
          )}

          {/* Parent Specific Fields */}
          {formData.role === 'PARENT' && (
            <div className="pt-4 border-t border-slate-100 space-y-5 animate-in fade-in duration-200">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#4F3FF0] select-none">Parent Information</h3>

              {/* Occupation */}
              <TextField
                label="Occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="e.g. Software Engineer, Doctor"
                error={validationErrors.occupation}
                required
                disabled={loading}
              />
            </div>
          )}

          {/* Reviewer Specific Fields */}
          {formData.role === 'REVIEWER' && (
            <div className="pt-4 border-t border-slate-100 space-y-5 animate-in fade-in duration-200">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#4F3FF0] select-none">Reviewer Information</h3>

              {/* Expertise Area */}
              <TextField
                label="Expertise Area"
                name="expertiseArea"
                value={formData.expertiseArea}
                onChange={handleChange}
                placeholder="e.g. Fullstack Developer, DevOps Engineering"
                error={validationErrors.expertiseArea}
                required
                disabled={loading}
              />
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
              startIcon={<UserPlus className="h-4.5 w-4.5" />}
            >
              Add User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;
