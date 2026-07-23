import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FD] p-4 font-sans select-none">
      <div className="w-full max-w-[540px] bg-white rounded-3xl border border-[#E9EDF5] p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all">

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 bg-[#4F3FF0] rounded-[20px] flex items-center justify-center shadow-[0_8px_16px_rgba(79,63,240,0.25)] mb-5">
            <span className="text-white font-extrabold text-2xl tracking-wide">ES</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight mb-2">iCET EduSys</h1>
          <p className="text-sm font-medium text-[#7E8B9B]">Dual-Track Learning & Career Scaling</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600">
            {error}
          </div>
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
              <a
                href="#forgot"
                onClick={(e) => { e.preventDefault(); alert('Please contact your administrator to reset your password.'); }}
                className="text-xs font-bold text-[#111111] hover:underline"
              >
                Forgot password?
              </a>
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
      </div>
    </div>
  );
};
