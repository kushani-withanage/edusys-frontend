import React, { useState, useEffect } from 'react';
import { Shield, Key, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/utils/api';
import { toast } from '@/utils/toast';

export const ParentProfileSettingsPage: React.FC = () => {
  const { user, loginWithToken } = useAuth();

  // Profile fields state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email] = useState(user?.email || '');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileError('Display name is required.');
      return;
    }

    try {
      setSavingProfile(true);
      setProfileError(null);

      const res = await api.put<any>('/api/v1/parent/profile', {
        fullName: fullName.trim()
      });

      toast.success('Profile details updated successfully!');
      
      // Update local storage and authentication context with new display name
      const storedToken = localStorage.getItem('edusys_token');
      if (storedToken && user) {
        loginWithToken(storedToken, {
          userId: user.userId,
          fullName: res.fullName,
          email: user.email,
          role: user.role
        });
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordError(null);

      await api.put<any>('/api/v1/parent/profile/password', {
        currentPassword,
        newPassword
      });

      toast.success('Account password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password. Verify your current password is correct.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="border-b border-[#E9EDF5] pb-6 select-none text-left">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-heading">
          <Shield className="h-7 w-7 text-[#4F3FF0]" />
          Account Profile Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure your personal parent details, update your display username, and modify security passwords.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings Block */}
        <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-6 text-left">
          <div className="flex items-center gap-3 border-b border-[#E9EDF5] pb-4">
            <div className="h-10 w-10 bg-indigo-50 text-[#4F3FF0] rounded-xl flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 leading-snug">Personal Profile Info</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Update display details</span>
            </div>
          </div>

          {profileError && (
            <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20 text-rose-600 rounded-2xl">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <AlertDescription className="font-semibold text-xs">{profileError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <TextField
              label="Display Username"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Priyantha Samarawickrama"
              required
              disabled={savingProfile}
            />

            <div className="space-y-1.5 relative">
              <TextField
                label="Registered Login Email (Read Only)"
                value={email}
                disabled
                placeholder="email@example.com"
                className="bg-slate-50 border-slate-200 text-slate-400"
              />
              <span className="absolute right-4 bottom-3.5 text-[9px] font-extrabold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">
                Immutable
              </span>
            </div>

            <Button
              type="submit"
              variant="solid"
              color="primary"
              className="px-6 py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md shadow-[#4F3FF0]/10 bg-[#4F3FF0] hover:bg-[#4F3FF0]/90 transition-colors"
              isLoading={savingProfile}
            >
              Update Profile Name
            </Button>
          </form>
        </div>

        {/* Change Password Block */}
        <div className="bg-white border border-[#E9EDF5] rounded-3xl p-6 shadow-sm space-y-6 text-left">
          <div className="flex items-center gap-3 border-b border-[#E9EDF5] pb-4">
            <div className="h-10 w-10 bg-indigo-50 text-[#4F3FF0] rounded-xl flex items-center justify-center">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 leading-snug">Security & Password</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configure your password</span>
            </div>
          </div>

          {passwordError && (
            <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20 text-rose-600 rounded-2xl">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <AlertDescription className="font-semibold text-xs">{passwordError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <TextField
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              disabled={savingPassword}
            />

            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              disabled={savingPassword}
            />

            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              disabled={savingPassword}
            />

            <Button
              type="submit"
              variant="solid"
              color="primary"
              className="px-6 py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md shadow-[#4F3FF0]/10 bg-[#4F3FF0] hover:bg-[#4F3FF0]/90 transition-colors"
              isLoading={savingPassword}
            >
              Update Security Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParentProfileSettingsPage;
