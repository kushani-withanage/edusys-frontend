import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import Button from '@/components/common/Button';
import { api } from '@/utils/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type { User } from './types';

export const UsersRoles: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [students, setStudents] = useState<any[]>([]);



  // User Details Modal States
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewingUserDetails, setViewingUserDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);

  const handleUserClick = async (user: User) => {
    setViewingUser(user);
    setViewingUserDetails(null);
    const roleUpper = user.role.toUpperCase();
    if (roleUpper === 'STUDENT') {
      try {
        setLoadingDetails(true);
        const details = await api.get<any>(`/api/v1/students/${user.userId}`);
        setViewingUserDetails(details);
      } catch (err) {
        console.error('Failed to load student details:', err);
      } finally {
        setLoadingDetails(false);
      }
    } else if (roleUpper === 'PARENT') {
      try {
        setLoadingDetails(true);
        const details = await api.get<any>(`/api/v1/parents/${user.userId}`);
        
        // Find linked students
        const links = await api.get<any[]>('/api/v1/parent-student-links').catch(() => []);
        const parentLinks = links.filter(l => l.parentId === user.userId);
        
        let linkedStudentNames: string[] = [];
        for (const parentLink of parentLinks) {
          const studentUser = users.find(u => u.userId === parentLink.studentId);
          if (studentUser) {
            linkedStudentNames.push(studentUser.fullName);
          }
        }
        
        setViewingUserDetails({
          ...details,
          linkedStudentNames: linkedStudentNames.join(', ') || 'None'
        });
      } catch (err) {
        console.error('Failed to load parent details:', err);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const formatAccessTime = (dateStr: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    const formattedDate = `${weekday}, ${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    
    const diffMs = new Date().getTime() - date.getTime();
    if (diffMs < 0) return formattedDate;
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffYears = Math.floor(diffDays / 365);
    const remDays = diffDays % 365;

    let relative = '';
    if (diffMins < 1) {
      relative = 'just now';
    } else if (diffMins < 60) {
      relative = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      relative = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffYears > 0) {
      relative = `${diffYears} year${diffYears > 1 ? 's' : ''} ${remDays} day${remDays !== 1 ? 's' : ''}`;
    } else {
      relative = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
    return `${formattedDate} (${relative})`;
  };

  const formatLastAccessTime = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    return formatAccessTime(lastLogin);
  };

  const fetchUsersAndLevels = async () => {
    try {
      setLoading(true);
      const [usersData, batchesData, studentsData] = await Promise.all([
        api.get<User[]>('/api/v1/users'),
        api.get<any[]>('/api/v1/batches').catch(() => []),
        api.get<any[]>('/api/v1/students').catch(() => [])
      ]);
      setUsers(usersData || []);
      setBatches(batchesData || []);
      setStudents(studentsData || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users/batches/students:', err);
      setError('Could not fetch data. Please verify that backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndLevels();
  }, []);


  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = 
        selectedRole === 'All' || 
        user.role.toUpperCase() === selectedRole.toUpperCase();

      let matchesBatch = true;
      if (selectedBatch !== 'All') {
        const studentProfile = students.find(s => s.studentId === user.userId);
        matchesBatch = studentProfile?.currentBatchId === selectedBatch;
      }

      return matchesSearch && matchesRole && matchesBatch;
    });
  }, [users, searchQuery, selectedRole, selectedBatch, students]);

  const getRoleDisplay = (role: string) => {
    const upperRole = role.toUpperCase();
    if (upperRole === 'REVIEWER') return 'Reviewer';
    if (upperRole === 'TEACHER') return 'Teacher';
    if (upperRole === 'ADMIN') return 'Admin';
    if (upperRole === 'STUDENT') return 'Student';
    if (upperRole === 'PARENT') return 'Parent';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const getStatusBadgeClass = (status: string) => {
    const s = (status || 'ACTIVE').toUpperCase();
    if (s === 'ACTIVE') {
      return 'border-emerald-250 bg-emerald-50 text-emerald-700';
    }
    return 'border-slate-350 bg-slate-100 text-slate-650';
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
          <span className="text-[10px] font-bold text-slate-455 tracking-wider uppercase select-none">BATCH:</span>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#4F3FF0] cursor-pointer"
          >
            <option value="All">All Batches</option>
            {batches.map(b => (
              <option key={b.batchId} value={b.batchId}>{b.batchName}</option>
            ))}
          </select>

          <span className="text-[10px] font-bold text-slate-455 tracking-wider uppercase select-none ml-2">ROLE:</span>
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
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.userId} 
                    className="hover:bg-slate-50/40 transition-colors duration-150 cursor-pointer"
                    onClick={() => handleUserClick(user)}
                  >
                    <td className="px-6 py-4.5 text-slate-400">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                    <td className="px-6 py-4.5 font-extrabold text-slate-800 hover:underline">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4.5 text-slate-600 font-bold">
                      {getRoleDisplay(user.role)}
                    </td>
                    <td className="px-6 py-4.5 text-slate-500 font-medium">
                      {user.email}
                    </td>
                    <td className="px-6 py-4.5 text-slate-600 font-medium">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 border text-xs font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right select-none">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.setItem(`user_name_${user.userId}`, user.fullName);
                            navigate(`/admin/users-roles/edit/${user.userId}`);
                          }}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#4F3FF0] rounded-lg transition-colors cursor-pointer"
                          title="Edit User Details"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingUser(user);
                          }}
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

        {/* Table Total Users Footer */}
        {!loading && filteredUsers.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#E9EDF5] bg-white select-none">
            <span className="text-xs font-semibold text-slate-500">
              Showing all {filteredUsers.length} users
            </span>
          </div>
        )}
      </div>

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

      {/* --- USER DETAILS MODAL --- */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#F8FAFC] border border-[#E9EDF5] rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative text-left my-8">
            <button 
              onClick={() => setViewingUser(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-xl transition-all cursor-pointer font-bold text-sm"
              title="Close Details"
            >
              ✕
            </button>
            <h2 className="text-xl font-black text-slate-800 mb-6 select-none border-b border-[#E9EDF5] pb-4">
              Profile: {viewingUser.fullName}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User details Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-55 pb-2">User details</h3>
                <span className="text-xs text-blue-600 hover:underline cursor-pointer block font-semibold">
                  Edit profile
                </span>

                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-700">Email address</span>
                  <span className="block text-xs text-slate-500 pl-2">
                    <span className="text-blue-600 hover:underline cursor-pointer">{viewingUser.email}</span> (Hidden from everyone except users with appropriate permissions)
                  </span>
                </div>

                {viewingUser.role.toUpperCase() === 'STUDENT' && (
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-slate-700">Batch</span>
                    <span className="block text-xs text-slate-500 pl-2">
                      {loadingDetails ? 'Loading...' : (batches.find(b => b.batchId === viewingUserDetails?.currentBatchId)?.batchName || 'No Batch')}
                    </span>
                  </div>
                )}

                {viewingUser.role.toUpperCase() !== 'STUDENT' && viewingUser.role.toUpperCase() !== 'PARENT' && (
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-slate-700">Country</span>
                    <span className="block text-xs text-slate-500 pl-2">Sri Lanka</span>
                  </div>
                )}

                {viewingUser.role.toUpperCase() !== 'PARENT' && (
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-slate-700">Gender</span>
                    <span className="block text-xs text-slate-500 pl-2 capitalize">
                      {loadingDetails ? 'Loading...' : (viewingUserDetails?.gender || 'Not specified')}
                    </span>
                  </div>
                )}

                {viewingUser.role.toUpperCase() === 'PARENT' && (
                  <>
                    <div className="space-y-1">
                      <span className="block text-xs font-bold text-slate-700">Occupation</span>
                      <span className="block text-xs text-slate-500 pl-2">
                        {loadingDetails ? 'Loading...' : (viewingUserDetails?.occupation || '-')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-xs font-bold text-slate-700">Related Student(s)</span>
                      <span className="block text-xs text-slate-500 pl-2 font-bold text-[#4F3FF0]">
                        {loadingDetails ? 'Loading...' : (viewingUserDetails?.linkedStudentNames || '-')}
                      </span>
                    </div>
                  </>
                )}

                {viewingUser.role.toUpperCase() === 'STUDENT' && (
                  <>
                    <div className="space-y-1">
                      <span className="block text-xs font-bold text-slate-700">Guardian Name</span>
                      <span className="block text-xs text-slate-500 pl-2">
                        {loadingDetails ? 'Loading...' : (viewingUserDetails?.guardianName || '-')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-xs font-bold text-slate-700">Guardian Email</span>
                      <span className="block text-xs text-slate-500 pl-2">
                        {loadingDetails ? 'Loading...' : (viewingUserDetails?.guardianEmail || '-')}
                      </span>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-700">Contact numbers</span>
                  <span className="block text-xs text-slate-500 pl-2">
                    {viewingUser.phone || '-'}
                  </span>
                </div>
              </div>

              {/* Login activity Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-55 pb-2">Login activity</h3>

                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-700">First access to site</span>
                  <span className="block text-xs text-slate-500 pl-2">
                    {formatAccessTime(viewingUser.firstLogin || '')}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-700">Last access to site</span>
                  <span className="block text-xs text-slate-500 pl-2">
                    {formatLastAccessTime(viewingUser.lastLogin)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-6 mt-6 border-t border-slate-100 font-sans select-none">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersRoles;
