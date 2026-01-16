import React, { useState } from 'react';
import { Scissors, Mail, Lock, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GlassCard from '../UI/GlassCard';
import Button3D from '../UI/Button3D';

const LoginPage = ({ onNavigate }) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // La navigation se fait automatiquement via le contexte
        // Vous pouvez rediriger vers la page appropriée
        if (result.data.type === 'coiffeur') {
          onNavigate('dashboard');
        } else {
          onNavigate('home');
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('Network error during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-8 px-4">
      <GlassCard className="w-full max-w-md md:max-w-lg p-6 md:p-8 lg:p-12 mx-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Scissors className="w-12 h-12 text-pink-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400">Sign in to your account</p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-pink-500">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="email" 
                name="email" 
                required 
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all disabled:opacity-50"
                placeholder="you@example.com" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-pink-500">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                name="password" 
                required 
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all disabled:opacity-50"
                placeholder="••••••••" 
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                name="remember" 
                disabled={loading}
                className="rounded bg-zinc-800 border-pink-500/30 text-pink-500 disabled:opacity-50" 
              />
              <span className="text-sm text-gray-400">Remember me</span>
            </label>
            <button 
              type="button" 
              onClick={() => onNavigate('forgot-password')}
              className="text-sm text-pink-500 hover:text-pink-400 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>
          
          <Button3D 
            type="submit" 
            className="w-full py-4 text-lg"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </Button3D>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-500">New to 7ela9?</span>
            </div>
          </div>
          
          <Button3D 
            variant="outline" 
            className="w-full" 
            onClick={() => onNavigate('signup')}
            disabled={loading}
          >
            Create Account
          </Button3D>
          
          <p className="text-xs text-center text-gray-500 mt-4">
            Choose between Client or Stylist account
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default LoginPage;