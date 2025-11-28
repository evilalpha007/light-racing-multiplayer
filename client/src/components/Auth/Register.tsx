import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Flag, Trophy, Zap } from 'lucide-react';
import './Auth.css';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    setError('');

    // Validation
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/lobby');
    } catch (err: any) {
      setError(err?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob top-0 -left-4"></div>
        <div className="absolute w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 top-0 -right-4"></div>
        <div className="absolute w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 bottom-0 left-20"></div>

        <div className="absolute top-1/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="absolute top-20 left-20 text-yellow-400 opacity-20 animate-bounce" style={{ animationDelay: '0.5s' }}>
        <Trophy size={40} />
      </div>
      <div className="absolute bottom-20 right-20 text-purple-400 opacity-20 animate-bounce" style={{ animationDelay: '1s' }}>
        <Zap size={40} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-4 shadow-lg transform hover:scale-110 transition-transform duration-300">
                <Flag size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 mb-2">
                Light Car RACING
              </h1>
              <p className="text-white/70 text-sm font-light tracking-wider">CREATE YOUR RACING PROFILE</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-white/90 text-sm font-medium tracking-wide">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    disabled={loading}
                    minLength={3}
                    maxLength={20}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm transition-all duration-300 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-white/90 text-sm font-medium tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="racer@pixelracing.com"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm transition-all duration-300 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-white/90 text-sm font-medium tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    disabled={loading}
                    minLength={6}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm transition-all duration-300 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-white/90 text-sm font-medium tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••"
                    disabled={loading}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm transition-all duration-300 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    CREATING ACCOUNT...
                  </span>
                ) : (
                  '🟢 CREATE ACCOUNT'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-white/60 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors duration-300">
                  Login
                </Link>
              </p>
            </div>

            {/* Stats Bar */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-2xl font-bold text-yellow-400">150K+</p>
                  <p className="text-white/50 text-xs mt-1">Active Racers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">50+</p>
                  <p className="text-white/50 text-xs mt-1">Tracks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-400">24/7</p>
                  <p className="text-white/50 text-xs mt-1">Racing</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 -z-10"></div>
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};
