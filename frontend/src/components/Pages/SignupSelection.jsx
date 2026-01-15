import React from 'react';
import { User, Scissors, Check } from 'lucide-react';
import TiltCard from '../UI/TiltCard';

const SignupSelection = ({ onNavigate }) => (
  <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center py-12 px-4">
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Join 7ela9</h1>
      <p className="text-xl text-gray-400 max-w-2xl mx-auto">
        Choose your path and start your journey with us
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full px-4">
      <TiltCard className="cursor-pointer" onClick={() => onNavigate('signup-client')}>
        <div className="p-8 md:p-10 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-black/80 border border-white/10 hover:border-pink-500 transition-all duration-300 h-full flex flex-col items-center text-center group hover:bg-zinc-900/90">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <User className="w-12 h-12 text-pink-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">I am a Client</h2>
          <p className="text-gray-400 mb-6">Find stylists, book appointments, and look your best.</p>
          <div className="mt-auto space-y-2 text-left w-full">
            <div className="flex items-center text-sm text-gray-300">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Browse top-rated stylists
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Book appointments easily
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Get mobile services
            </div>
          </div>
        </div>
      </TiltCard>

      <TiltCard className="cursor-pointer" onClick={() => onNavigate('signup-coiffeur')}>
        <div className="p-8 md:p-10 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-black/80 border border-white/10 hover:border-purple-500 transition-all duration-300 h-full flex flex-col items-center text-center group hover:bg-zinc-900/90">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Scissors className="w-12 h-12 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">I am a Stylist</h2>
          <p className="text-gray-400 mb-6">Showcase your work, manage bookings, and grow your business.</p>
          <div className="mt-auto space-y-2 text-left w-full">
            <div className="flex items-center text-sm text-gray-300">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Showcase your portfolio
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Manage appointments
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              Grow your client base
            </div>
          </div>
        </div>
      </TiltCard>
    </div>
    
    <div className="mt-12 text-center">
      <p className="text-gray-500">
        Already have an account?{' '}
        <button 
          onClick={() => onNavigate('login')}
          className="text-pink-500 hover:text-pink-400 font-medium transition-colors"
        >
          Sign in here
        </button>
      </p>
    </div>
  </div>
);

export default SignupSelection;