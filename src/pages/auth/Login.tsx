import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/utils/api';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Views: 'login' | 'forgot' | 'reset' | 'success'
  const [view, setView] = useState<'login' | 'forgot' | 'reset' | 'success'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [sandboxCode, setSandboxCode] = useState<string | null>(null);

  // Set where to redirect after login
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await login({ email, password });

      if (response.mustSetPassword) {
        navigate('/set-password', {
          replace: true,
          state: {
            tempToken: response.token,
            userId: response.userId,
            fullName: response.fullName,
            email: response.email,
            role: response.role
          }
        });
        return;
      }

      const role = response.role.toUpperCase();
      if (role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'TEACHER') {
        navigate('/teacher/dashboard', { replace: true });
      } else if (role === 'REVIEWER') {
        navigate('/reviewer/dashboard', { replace: true });
      } else if (role === 'STUDENT') {
        navigate('/student/dashboard', { replace: true });
      } else if (role === 'PARENT') {
        navigate('/parent/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post<any>('/api/v1/auth/verify-email', { email: resetEmail });
      if (res && res.otp) {
        setSandboxCode(res.otp);
      }
      setView('reset');
    } catch (err: any) {
      const errMsg = err.message || 'Email address not registered in our system.';
      setError(errMsg);
      alert(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      alert('Passwords do not match.');
      return;
    }
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await api.post<any>('/api/v1/auth/reset-password', {
        email: resetEmail,
        otp: otp,
        newPassword: newPassword
      });
      setView('success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please verify the code is correct.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setView('login');
    setResetEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setSandboxCode(null);
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FD] p-4 font-sans select-none">
      <div className="w-full max-w-[540px] bg-white rounded-3xl border border-[#E9EDF5] p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all">

        {view === 'login' && (
          <>
            {/* Brand Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="h-16 w-16 bg-[#4F3FF0] rounded-[20px] flex items-center justify-center shadow-[0_8px_16px_rgba(79,63,240,0.25)] mb-5">
                <span className="text-white font-extrabold text-2xl tracking-wide">ES</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight mb-2">iCET EduSys</h1>
              <p className="text-sm font-medium text-[#7E8B9B]">Dual-Track Learning & Career Scaling</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold text-[#111111] tracking-wider uppercase">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#A0AEC0]">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@edusys.edu"
                    className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] focus:bg-white rounded-xl text-base text-[#1A202C] placeholder-[#A0AEC0] outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-bold text-[#111111] tracking-wider uppercase">
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); setError(null); }}
                    className="text-xs font-bold text-[#111111] hover:underline hover:text-[#4F3FF0] cursor-pointer transition-all"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#A0AEC0]">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] focus:bg-white rounded-xl text-base text-[#1A202C] placeholder-[#A0AEC0] outline-none transition-all tracking-wider font-medium"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#4F3FF0] hover:bg-[#4335D6] disabled:bg-indigo-300 text-white rounded-xl font-bold text-base shadow-[0_4px_12px_rgba(79,63,240,0.2)] hover:shadow-[0_6px_20px_rgba(79,63,240,0.3)] transition-all cursor-pointer select-none"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Log In to Dashboard</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {view === 'forgot' && (
          <>
            {/* Forgot Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <button 
                type="button"
                onClick={resetState}
                className="self-start flex items-center gap-2 mb-6 text-sm font-bold text-[#7E8B9B] hover:text-[#4F3FF0] cursor-pointer transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Login</span>
              </button>
              <div className="h-16 w-16 bg-[#4F3FF0]/10 rounded-[20px] flex items-center justify-center mb-5">
                <Lock className="h-8 w-8 text-[#4F3FF0]" />
              </div>
              <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight mb-2">Forgot Password</h1>
              <p className="text-sm font-medium text-[#7E8B9B] max-w-sm px-4">
                Enter your email address below to identify your account and proceed with password reset.
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleForgotNext} className="space-y-6">
              {/* Reset Email Field */}
              <div className="space-y-2">
                <label htmlFor="resetEmail" className="block text-xs font-bold text-[#111111] tracking-wider uppercase">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#A0AEC0]">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    id="resetEmail"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="email@edusys.edu"
                    className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] focus:bg-white rounded-xl text-base text-[#1A202C] placeholder-[#A0AEC0] outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* Next Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#4F3FF0] hover:bg-[#4335D6] disabled:bg-indigo-300 text-white rounded-xl font-bold text-base shadow-[0_4px_12px_rgba(79,63,240,0.2)] hover:shadow-[0_6px_20px_rgba(79,63,240,0.3)] transition-all cursor-pointer select-none"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {view === 'reset' && (
          <>
            {/* Reset Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <button 
                type="button"
                onClick={() => { setView('forgot'); setError(null); }}
                className="self-start flex items-center gap-2 mb-6 text-sm font-bold text-[#7E8B9B] hover:text-[#4F3FF0] cursor-pointer transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </button>
              <div className="h-16 w-16 bg-[#4F3FF0]/10 rounded-[20px] flex items-center justify-center mb-5">
                <Lock className="h-8 w-8 text-[#4F3FF0]" />
              </div>
              <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight mb-2">Set New Password</h1>
              <p className="text-sm font-medium text-[#7E8B9B]">
                Resetting password for <strong className="text-slate-800">{resetEmail}</strong>
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {sandboxCode && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold leading-relaxed">
                [Dev Sandbox] Simulated OTP sent to email: <span className="font-extrabold text-sm text-[#4F3FF0] ml-1">{sandboxCode}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              {/* Verification Code Field */}
              <div className="space-y-2">
                <label htmlFor="otp" className="block text-xs font-bold text-[#111111] tracking-wider uppercase">
                  VERIFICATION CODE (OTP)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#A0AEC0]">
                    <CheckCircle2 className="h-5 w-5 animate-pulse" />
                  </span>
                  <input
                    id="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] focus:bg-white rounded-xl text-base text-[#1A202C] placeholder-[#A0AEC0] outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-2">
                <label htmlFor="newPassword" className="block text-xs font-bold text-[#111111] tracking-wider uppercase">
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#A0AEC0]">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] focus:bg-white rounded-xl text-base text-[#1A202C] placeholder-[#A0AEC0] outline-none transition-all tracking-wider font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#A0AEC0] hover:text-[#4F3FF0] cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#111111] tracking-wider uppercase">
                  CONFIRM NEW PASSWORD
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#A0AEC0]">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    id="confirmPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#4F3FF0] focus:bg-white rounded-xl text-base text-[#1A202C] placeholder-[#A0AEC0] outline-none transition-all tracking-wider font-medium"
                  />
                </div>
              </div>

              {/* Submit Reset Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#4F3FF0] hover:bg-[#4335D6] disabled:bg-indigo-300 text-white rounded-xl font-bold text-base shadow-[0_4px_12px_rgba(79,63,240,0.2)] hover:shadow-[0_6px_20px_rgba(79,63,240,0.3)] transition-all cursor-pointer select-none mt-6"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {view === 'success' && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100 animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight mb-3">Reset Successful</h1>
            <p className="text-sm font-medium text-[#7E8B9B] max-w-sm px-2 mb-8 leading-relaxed">
              Your password has been successfully updated. You can now log in to the dashboard using your new credentials.
            </p>

            <button
              onClick={resetState}
              className="w-full py-4 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-base transition-all cursor-pointer select-none"
            >
              Log In Now
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
