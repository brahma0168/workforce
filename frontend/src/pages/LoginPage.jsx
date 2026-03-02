import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Eye, EyeOff, User, Lock, Wifi, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }
    
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand-teal/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-mint/5 rounded-full blur-[150px] translate-x-1/4 translate-y-1/4"></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="bg-surface/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 p-8">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              {/* Signal Logo */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-teal to-brand-mint flex items-center justify-center">
                <Wifi className="w-8 h-8 text-black" strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-rubik font-bold text-white tracking-tight">SIGNAL</h1>
                <p className="text-xs text-text-secondary tracking-widest uppercase">BY PROFITCAST</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-rubik font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-text-secondary">Sign in to access your Signal dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-teal transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-12 pr-4 py-4 bg-surface-highlight border border-white/10 rounded-xl text-white placeholder-text-muted focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 transition-all outline-none"
                  data-testid="login-username-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-teal transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-4 bg-surface-highlight border border-white/10 rounded-xl text-white placeholder-text-muted focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 transition-all outline-none"
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded border ${rememberMe ? 'bg-brand-teal border-brand-teal' : 'border-white/20 bg-transparent'} flex items-center justify-center transition-all`}>
                  {rememberMe && (
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="hidden"
                />
                <span className="text-sm text-text-secondary group-hover:text-white transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-sm text-brand-teal hover:text-brand-mint transition-colors font-medium">
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-black bg-gradient-to-r from-brand-teal to-brand-mint hover:opacity-90 transition-all shadow-glow-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="login-submit-button"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-text-secondary">
              Powered by <span className="text-brand-teal font-medium">Profitcast</span>
            </p>
            <p className="text-xs text-text-muted mt-1">v2.1 • AI-Powered Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
