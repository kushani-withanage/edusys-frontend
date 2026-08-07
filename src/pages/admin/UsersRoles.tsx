import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  Loader2, 
  AlertCircle,
  ShieldAlert,
  Award
} from 'lucide-react';
import Button from '@/components/common/Button';
import { api } from '@/utils/api';
import { careerSubmissionService as reviewService } from '@/services/careerSubmissionService';
import { pointsLevelService, type CareerLevelData } from '@/services/pointsLevelService';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface User {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  phone: string;
  status: string;
  createdAt: string;
}

export const UsersRoles: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [levels, setLevels] = useState<CareerLevelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  
  const itemsPerPage = 5;

  // Override Modal States
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStudent, setOverrideStudent] = useState<{ id: string; name: string } | null>(null);
  const [overrideForm, setOverrideForm] = useState({
    levelId: '',
    reason: ''
  });
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const fetchUsersAndLevels = async () => {
    try {
      setLoading(true);
      const [usersData, levelsData] = await Promise.all([
        api.get<User[]>('/api/v1/users'),
        pointsLevelService.getLevels().catch(() => [])
      ]);
      setUsers(usersData || []);
      setLevels(levelsData || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users/levels:', err);
      setError('Could not fetch data. Please verify that backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndLevels();
  }, []);



  // Handle Override Click
  const handleOverrideClick = (studentId: string, name: string) => {
    setOverrideStudent({ id: studentId, name });
    setOverrideForm({
      levelId: levels.length > 0 ? (levels[0].id || '') : '',
      reason: ''
    });
    setShowOverrideModal(true);
  };

  // Submit Override Form
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideStudent || !overrideForm.levelId || !overrideForm.reason.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      setOverrideSubmitting(true);
      await reviewService.overrideStudentLevel(
        overrideStudent.id,
        overrideForm.levelId,
        overrideForm.reason
      );
      alert(`Successfully overridden ${overrideStudent.name}'s level stage.`);
      setShowOverrideModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to submit level override.');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = 
        selectedRole === 'All' || 
        user.role.toUpperCase() === selectedRole.toUpperCase();

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRole]);

  // Paginated Users List
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole]);

  const getRoleBadgeClass = (role: string) => {
    const upperRole = role.toUpperCase();
    switch (upperRole) {
      case 'ADMIN':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      case 'TEACHER':
        return 'bg-indigo-50 text-[#4F3FF0] border-indigo-200';
      case 'REVIEWER':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'STUDENT':
        return 'bg-slate-100 text-slate-650 border-slate-200';
      case 'PARENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-255';
      default:
        return 'bg-slate-100 text-slate-650 border-slate-250';
    }
  };

  const getRoleDisplay = (role: string) => {
    const upperRole = role.toUpperCase();
    if (upperRole === 'REVIEWER') return 'Reviewer';
    if (upperRole === 'TEACHER') return 'Teacher';
    if (upperRole === 'ADMIN') return 'Admin';
    if (upperRole === 'STUDENT') return 'Student';
    if (upperRole === 'PARENT') return 'Parent';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">User Management</h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Configure global users, administrative permissions, and roles mapping.
          </p>
        </div>
        <Button 
          variant="solid" 
          color="primary"
          onClick={() => navigate('/admin/users-roles/new')}
          startIcon={<Plus className="h-4.5 w-4.5" />}
        >
          Add New User
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <Alert variant="destructive" className="animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-xl">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-450">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email address..."
            className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0]/60 focus:bg-white rounded-xl text-xs text-slate-700 placeholder-slate-450 outline-none transition-all duration-200 font-bold"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[10px] font-bold text-slate-450 tracking-wider uppercase select-none">ROLE:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#4F3FF0] cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="TEACHER">Teacher</option>
            <option value="REVIEWER">Reviewer</option>
            <option value="STUDENT">Student</option>
            <option value="PARENT">Parent</option>
          </select>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white border border-[#E9EDF5] rounded-3xl overflow-hidden shadow-sm p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading users records...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="font-extrabold text-slate-705 text-sm uppercase tracking-wider">No users found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-bold tracking-wider uppercase">
                  <th className="w-10 px-6 py-4"></th>
                  <th className="px-6 py-4">NAME</th>
                  <th className="px-6 py-4">ROLE</th>
                  <th className="px-6 py-4">EMAIL ADDRESS</th>
                  <th className="px-6 py-4">PHONE</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDF5] text-slate-800 text-xs font-semibold">
                {paginatedUsers.map((user) => (
                  <tr 
                    key={user.userId} 
                    className="hover:bg-slate-50/40 transition-colors duration-150"
                  >
                    <td className="px-6 py-4.5 text-slate-400">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                    <td className="px-6 py-4.5 font-extrabold text-slate-800">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 border text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {getRoleDisplay(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-slate-500 font-medium">
                      {user.email}
                    </td>
                    <td className="px-6 py-4.5 text-slate-600 font-medium">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 border border-emerald-250 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right select-none">
                      <div className="flex justify-end gap-2">
                        {user.role.toUpperCase() === 'STUDENT' && (
                          <button
                            onClick={() => handleOverrideClick(user.userId, user.fullName)}
                            className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-[#4F3FF0] rounded-lg transition-colors cursor-pointer"
                            title="Override Career Level"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          title="Edit User details (Not implemented)"
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#4F3FF0] rounded-lg transition-colors cursor-not-allowed"
                          disabled
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(user)}
                          className="p-1.5 hover:bg-rose-50 text-slate-450 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete User"
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

        {/* Table Pagination Footer */}
        {!loading && filteredUsers.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#E9EDF5] bg-white select-none">
            <span className="text-xs font-medium text-slate-500">
              Showing {Math.min(filteredUsers.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
              {Math.min(filteredUsers.length, currentPage * itemsPerPage)} of {filteredUsers.length} users
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-[0.98]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-[0.98]"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- LEVEL OVERRIDE MODAL --- */}
      {showOverrideModal && overrideStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 w-full max-w-md shadow-2xl relative text-left">
            <h3 className="text-base font-black text-slate-800 mb-1 flex items-center gap-2 select-none">
              <Award className="h-5 w-5 text-[#4F3FF0]" />
              Administrative Level Override
            </h3>
            <p className="text-slate-450 text-[10px] font-bold mb-4 uppercase tracking-wider">Directly upgrade student's career milestone and reset level points.</p>

            <div className="mb-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Student Name:</span>
                <span className="text-slate-800">{overrideStudent.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Student ID:</span>
                <span className="text-slate-800">{overrideStudent.id}</span>
              </div>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4 font-sans">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold tracking-wider uppercase text-slate-500 select-none">Target Career Level *</label>
                <select
                  value={overrideForm.levelId}
                  onChange={e => setOverrideForm(prev => ({ ...prev, levelId: e.target.value }))}
                  className="w-full pl-3 pr-8 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-800 font-bold outline-none focus:bg-white cursor-pointer"
                  required
                >
                  <option value="" disabled>Select Level</option>
                  {levels.map(l => (
                    <option key={l.id} value={l.id}>L{l.levelNumber} - {l.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold tracking-wider uppercase text-slate-500 select-none">Override Audit Reason *</label>
                <textarea
                  value={overrideForm.reason}
                  onChange={e => setOverrideForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Provide audit reason for directly editing student stage progression..."
                  className="w-full pl-4 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-850 placeholder-slate-450 outline-none focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10 min-h-[80px]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 font-sans select-none">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-5 py-2.5 border border-[#E2E8F0] text-slate-500 text-xs font-bold rounded-xl cursor-pointer"
                  disabled={overrideSubmitting}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="solid"
                  color="primary"
                  isLoading={overrideSubmitting}
                >
                  Confirm Override
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete User Confirm Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-xl border border-[#E9EDF5] space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <div className="space-y-1.5 font-sans">
              <h3 className="font-bold text-slate-800 text-base">Delete User Account</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Are you sure you want to delete user <strong className="text-slate-700">"{deletingUser.fullName}"</strong>? This will also remove all their enrollments, results, and records. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2 font-sans select-none">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-750 text-xs font-black rounded-xl transition-all cursor-pointer bg-white"
                disabled={submittingDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const userId = deletingUser.userId;
                  try {
                    setSubmittingDelete(true);
                    await api.delete(`/api/v1/users/${userId}`);
                    setUsers(prev => prev.filter(u => u.userId !== userId));
                    setDeletingUser(null);
                    alert('User deleted successfully.');
                  } catch (err: any) {
                    console.error('Failed to delete user:', err);
                    alert(err.message || 'Error occurred while deleting user.');
                  } finally {
                    setSubmittingDelete(false);
                  }
                }}
                disabled={submittingDelete}
                className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-100 flex items-center justify-center"
              >
                {submittingDelete ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersRoles;
