import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const success = await register({
          email,
          username: username || email.split('@')[0],
          password,
          full_name: fullName,
          preferred_currency: 'INR'
        });
        if (success) {
          onClose();
        } else {
          setError('Registration failed. Username or email may already be in use.');
        }
      } else {
        const success = await login(email, password);
        if (success) {
          onClose();
        } else {
          setError('Invalid email or password.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@smartcart.ai');
    setPassword('SmartCart123!');
    setIsRegister(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="text-center mb-5">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              {isRegister ? 'Create Your Account' : 'Welcome to SmartCart'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {isRegister
                ? 'Track your favorite products and set custom price drop alerts'
                : 'Sign in to access your personal watchlists and alerts'}
            </p>
          </div>

          {error && (
            <div className="mb-3.5 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ragu Ram"
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg pl-8 pr-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. raguram"
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg pl-8 pr-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg pl-8 pr-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg pl-8 pr-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50 mt-1"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credentials Button */}
          <div className="mt-3.5 pt-3.5 border-t border-slate-200">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-blue-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              Fill Demo Credentials (demo@smartcart.ai)
            </button>
          </div>

          <div className="text-center mt-3.5">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-slate-500 hover:text-blue-700 font-medium transition-colors"
            >
              {isRegister
                ? 'Already have an account? Sign In'
                : "Don't have an account yet? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
