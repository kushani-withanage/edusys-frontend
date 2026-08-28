import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/utils/api';
import { toast } from '@/utils/toast';

export const SetPasswordPage: React.FC = () => {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tempToken = location.state?.tempToken;
  const userId = location.state?.userId;
  const fullName = location.state?.fullName;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If page was refreshed and state was lost, redirect back to login
  if (!tempToken || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6">
        <div className="bg-white border border-[#E9EDF5] rounded-2xl p-6 text-center max-w-sm shadow-xl">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-800 mb-2">Session Expired</h3>
          <p className="text-sm text-slate-500 mb-4">Please return to the login screen and enter your email address to continue.</p>
          <button 
            onClick={() => navigate('/login')} 
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#4F3FF0] hover:bg-[#4335D6] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call set-password endpoint with limited token in headers
      const res = await api.post<any>('/api/v1/auth/set-password', 
        { newPassword: password },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );

      toast.success('Password configured successfully!');

      // Complete login session using the new full session token
      loginWithToken(res.token, {
        userId: res.userId,
        fullName: res.fullName,
        email: res.email,
        role: res.role
      });

      // Navigate to correct dashboard based on role
      const targetRole = res.role.toUpperCase();
      if (targetRole === 'PARENT') {
        navigate('/parent/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }

    } catch (err: any) {
      setError(err.message || 'Failed to configure password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FD] p-4 font-sans select-none">
      <div className="w-full max-w-[540px] bg-white rounded-3xl border border-[#E9EDF5] p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all">
        
        {/* Branding header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 bg-[#4F3FF0] rounded-[20px] flex items-center justify-center shadow-[0_8px_16px_rgba(79,63,240,0.25)] mb-5">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight mb-2">Set Your Password</h1>
          <p className="text-sm font-medium text-[#7E8B9B] max-w-[340px]">
            Welcome, <span className="text-[#4F3FF0] font-bold">{fullName}</span>. Please configure a new password for your parent account to log in.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#111111] tracking-wider uppercase text-left">
              NEW PASSWORD
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#A0AEC0]">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                disabled={loading}
                className="w-full pl-12 pr-12 py-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] focus:bg-white rounded-xl text-base text-[#1A202C] placeholder-[#A0AEC0] outline-none transition-all tracking-wider font-medium text-left"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#A0AEC0] hover:text-[#4F3FF0] cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#111111] tracking-wider uppercase text-left">
              CONFIRM NEW PASSWORD
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#A0AEC0]">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                disabled={loading}
                className="w-full pl-12 pr-12 py-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] focus:bg-white rounded-xl text-base text-[#1A202C] placeholder-[#A0AEC0] outline-none transition-all tracking-wider font-medium text-left"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#A0AEC0] hover:text-[#4F3FF0] cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#4F3FF0] hover:bg-[#4335D6] disabled:bg-indigo-300 text-white rounded-xl font-bold text-base shadow-[0_4px_12px_rgba(79,63,240,0.2)] hover:shadow-[0_6px_20px_rgba(79,63,240,0.3)] transition-all cursor-pointer select-none"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span>Activate Account & Log In</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          EduSys Role-Based Education Management Platform
        </div>
      </div>
    </div>
  );
};

export default SetPasswordPage;
