import React from 'react';
import { User, Mail, MapPin, Lock, Phone } from 'lucide-react';
import GlassCard from '../UI/GlassCard';
import Button3D from '../UI/Button3D';

const ClientSignup = ({ onNavigate }) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/signup/client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        alert('Account created! Please log in.');
        onNavigate('login'); 
      } else {
        const errData = await res.json();
        alert(errData.error || 'Signup failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-8 px-4">
      <GlassCard className="w-full max-w-md md:max-w-lg p-6 md:p-8 lg:p-12 mx-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white mb-2">Client Signup</h2>
          <p className="text-gray-400">Create your client account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-pink-500">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                name="name" 
                required 
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                placeholder="Sarah Connor" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-pink-500">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                placeholder="you@example.com" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-pink-500">City</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  name="city" 
                  required 
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                  placeholder="Paris" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-pink-500">Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  name="phone" 
                  required 
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                  placeholder="06..." 
                />
              </div>
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
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                placeholder="••••••••" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-pink-500">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                name="confirmPassword" 
                required 
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                placeholder="••••••••" 
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input type="checkbox" required className="rounded bg-zinc-800 border-pink-500/30 text-pink-500" />
            <span className="text-sm text-gray-400">
              I agree to the <a href="#" className="text-pink-500 hover:text-pink-400">Terms of Service</a> and <a href="#" className="text-pink-500 hover:text-pink-400">Privacy Policy</a>
            </span>
          </div>
          
          <Button3D type="submit" className="w-full py-4 text-lg">
            Create Account
          </Button3D>
        </form>
        
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-500">
            Already have an account?{' '}
            <button 
              onClick={() => onNavigate('login')}
              className="text-pink-500 hover:text-pink-400 font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default ClientSignup;