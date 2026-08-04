import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Lock, 
  RefreshCw,
  User,
  BookOpen,
  FileText,
  Activity,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const StudentSettings: React.FC = () => {
  const { user } = useAuth();

  // Password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    
    try {
      setSavingPassword(true);
      alert('Password reset completed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordModalOpen(false); // Close modal on success
    } catch (err) {
      console.error(err);
      alert('Password reset failed.');
    } finally {
      setSavingPassword(false);
    }
  };

  const courses = [
    { code: 'ICD110', name: 'Advanced Software Engineering' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans items-start animate-in fade-in duration-200">
      
      {/* Left 2 columns: Student Info Details */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* User Details Card */}
        <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 select-none">
              <User className="h-4 w-4 text-[#4F3FF0]" />
              User details
            </h3>
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="text-xs font-bold text-[#4F3FF0] hover:underline cursor-pointer bg-none border-none p-0"
            >
              Edit profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-slate-700 text-xs">
            <div className="space-y-1.5 md:col-span-2 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Email address</span>
              <div className="leading-relaxed">
                <span className="font-extrabold text-[#4F3FF0]">{user?.email || 'nethmakannangara07@gmail.com'}</span>{' '}
                <span className="text-[10px] text-slate-400 font-normal">
                  (Hidden from everyone except users with appropriate permissions)
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Country</span>
              <span className="font-extrabold text-slate-800">Sri Lanka</span>
            </div>

            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Timezone</span>
              <span className="font-extrabold text-slate-800">Asia/Colombo</span>
            </div>

            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Gender</span>
              <span className="font-extrabold text-slate-800">Male</span>
            </div>

            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">A/L Year</span>
              <span className="font-extrabold text-slate-800">2021</span>
            </div>

            <div className="space-y-1.5 md:col-span-2 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Subject Stream</span>
              <span className="font-extrabold text-slate-800">Technology</span>
            </div>
          </div>
        </div>

        {/* Reports Card */}
        <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 select-none border-b border-slate-100 pb-3">
            <FileText className="h-4 w-4 text-[#4F3FF0]" />
            Reports
          </h3>
          <div className="flex flex-col gap-3.5 text-xs text-left">
            <a href="#" className="font-extrabold text-[#4F3FF0] hover:underline" onClick={(e) => { e.preventDefault(); alert('Redirecting to browser sessions...'); }}>
              Browser sessions
            </a>
            <a href="#" className="font-extrabold text-[#4F3FF0] hover:underline" onClick={(e) => { e.preventDefault(); alert('Redirecting to grades overview...'); }}>
              Grades overview
            </a>
          </div>
        </div>

      </div>

      {/* Right Column: details panel listing */}
      <div className="space-y-6">
        
        {/* Course Details Card */}
        <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 select-none border-b border-slate-100 pb-3">
            <BookOpen className="h-4 w-4 text-[#4F3FF0]" />
            Course details
          </h3>
          
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block text-left">Course profiles</span>
            <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-0.5">
              {courses.map((course, idx) => (
                <Link
                  key={idx}
                  to={`/student/courses/${course.code}`}
                  className="text-xs font-extrabold text-[#4F3FF0] hover:underline leading-relaxed block text-left"
                >
                  {course.name}
                </Link>
              ))}
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); alert('Redirecting to full courses listing...'); }}
              className="text-[10px] font-extrabold text-slate-400 hover:text-slate-700 block text-left mt-2"
            >
              View more
            </a>
          </div>
        </div>

        {/* Login Activity Card */}
        <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 select-none border-b border-slate-100 pb-3">
            <Activity className="h-4 w-4 text-[#4F3FF0]" />
            Login activity
          </h3>
          <div className="text-xs text-left space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">First access to site</span>
            <p className="font-extrabold text-slate-800 leading-relaxed">
              Saturday, 2 March 2024, 10:56 AM{' '}
              <span className="text-slate-400 font-normal">(2 years 153 days)</span>
            </p>
          </div>
        </div>

      </div>

      {/* Reset Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-4 relative space-y-5 animate-in zoom-in-95 duration-200 text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Lock className="h-4.5 w-4.5 text-[#4F3FF0]" />
              <h4 className="font-extrabold text-slate-800 text-sm">Reset Account Password</h4>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase block select-none">Old Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-450 uppercase block select-none">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-450 uppercase block select-none">Confirm New</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] rounded-xl text-xs text-slate-750 font-bold outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 border border-[#E2E8F0] hover:bg-slate-50 text-slate-750 font-extrabold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex-1 py-2.5 bg-[#4F3FF0] hover:bg-[#3D2ED0] disabled:bg-slate-400 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#4F3FF0]/10"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentSettings;
