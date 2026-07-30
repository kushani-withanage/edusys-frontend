import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, AlertCircle } from 'lucide-react';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import { api } from '@/utils/api';

export const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'STUDENT'
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
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      
      // Call authentication register endpoint to create the user with password
      await api.post('/api/v1/auth/register', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role.toUpperCase()
      });

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
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-250 rounded-2xl text-rose-800 text-sm animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
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
