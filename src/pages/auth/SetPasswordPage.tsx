import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
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
          <Button onClick={() => navigate('/login')} variant="solid" color="primary" className="w-full">
            Back to Login
          </Button>
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
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] relative overflow-hidden px-4 font-sans selection:bg-[#4F3FF0]/30 selection:text-white">
      {/* Visual background gradients */}
      <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full bg-[#4F3FF0]/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-[460px] bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#4F3FF0] to-[#7C3AED] flex items-center justify-center shadow-lg shadow-[#4F3FF0]/30 mx-auto mb-5">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2 font-heading">
            Set Your Password
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[320px] mx-auto">
            Welcome, <span className="text-[#818CF8] font-bold">{fullName}</span>. Please configure a new password for your parent account to log in.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-rose-500/10 border-rose-500/20 text-rose-400 rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-semibold text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div className="space-y-1.5 text-left relative">
            <TextField
              label="New Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              disabled={loading}
              className="bg-slate-800/40 border-slate-800 text-white placeholder-slate-500 focus:border-[#4F3FF0] focus:bg-slate-900/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 bottom-3 text-slate-500 hover:text-slate-350 cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5 text-left relative">
            <TextField
              label="Confirm New Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              disabled={loading}
              className="bg-slate-800/40 border-slate-800 text-white placeholder-slate-500 focus:border-[#4F3FF0] focus:bg-slate-900/40"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 bottom-3 text-slate-500 hover:text-slate-350 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="solid"
            color="primary"
            className="w-full py-4 text-sm font-extrabold uppercase tracking-wider rounded-2xl shadow-lg shadow-[#4F3FF0]/20 mt-2 bg-[#4F3FF0] hover:bg-[#4F3FF0]/90 transition-colors"
            isLoading={loading}
          >
            Activate Account & Log In
          </Button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          EduSys Role-Based Education Management Platform
        </div>
      </div>
    </div>
  );
};

export default SetPasswordPage;
