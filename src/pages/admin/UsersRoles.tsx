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
  AlertCircle 
} from 'lucide-react';
import Button from '@/components/common/Button';
import { api } from '@/utils/api';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const itemsPerPage = 5;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get<User[]>('/api/v1/users');
      // Set users sorted by creation date or ID descending
      setUsers(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Could not fetch users list. Please verify that backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle User Deletion
  const handleDeleteUser = async (userId: string, fullName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete user "${fullName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setIsDeleting(userId);
      await api.delete(`/api/v1/users/${userId}`);
      // Remove from list
      setUsers(prev => prev.filter(u => u.userId !== userId));
      alert('User deleted successfully.');
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      alert(err.message || 'Error occurred while deleting user.');
    } finally {
      setIsDeleting(null);
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

  // Reset pagination to page 1 on filter changes
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
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
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E9EDF5] pb-6">
        <div>
          <h1 className="text-[18px] md:text-xl lg:text-2xl font-semibold text-slate-800 tracking-tight">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">
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
        {/* Search */}
        <div className="relative w-full md:max-w-xl">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email address..."
            className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0]/60 focus:bg-white rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 font-medium"
          />
        </div>

        {/* Role dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase select-none">ROLE:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#4F3FF0] cursor-pointer"
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
      <div className="bg-white border border-[#E9EDF5] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-[#4F3FF0] animate-spin" />
            <p className="text-slate-500 font-medium text-sm">Loading users records...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-700">No users found</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or register a new user using the add user button.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC]/50 border-b border-[#E9EDF5] text-slate-450 text-[10px] font-extrabold tracking-wider uppercase">
                  <th className="w-10 px-6 py-4"></th>
                  <th className="px-6 py-4">NAME</th>
                  <th className="px-6 py-4">ROLE</th>
                  <th className="px-6 py-4">EMAIL ADDRESS</th>
                  <th className="px-6 py-4">PHONE</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDF5]">
                {paginatedUsers.map((user) => (
                  <tr 
                    key={user.userId} 
                    className="hover:bg-slate-50/40 transition-colors duration-150"
                  >
                    <td className="px-6 py-4.5 text-slate-400">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                    <td className="px-6 py-4.5 font-bold text-slate-800">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 border text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {getRoleDisplay(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-slate-500 text-sm font-medium lowercase">
                      {user.email}
                    </td>
                    <td className="px-6 py-4.5 text-slate-600 text-sm font-medium">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 border border-emerald-250 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          title="Edit User details (Not implemented)"
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#4F3FF0] rounded-lg transition-colors cursor-not-allowed"
                          disabled
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.userId, user.fullName)}
                          disabled={isDeleting === user.userId}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete User"
                        >
                          {isDeleting === user.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
    </div>
  );
};

export default UsersRoles;
