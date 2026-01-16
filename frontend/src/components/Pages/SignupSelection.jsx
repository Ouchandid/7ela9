import React from 'react';
import { User, Scissors, Check, Sparkles } from 'lucide-react';
import TiltCard from '../UI/TiltCard';

const SignupSelection = ({ onNavigate }) => {
  const options = [
    {
      id: 'client',
      title: 'I am a Client',
      icon: User,
      iconColor: 'text-pink-400',
      gradient: 'from-pink-500/20 to-rose-500/20',
      borderColor: 'hover:border-pink-500',
      description: 'Find stylists, book appointments, and look your best.',
      features: [
        'Browse top-rated stylists',
        'Book appointments easily',
        'Get mobile services'
      ],
      navigateTo: 'signup-client'
    },
    {
      id: 'stylist',
      title: 'I am a Stylist',
      icon: Scissors,
      iconColor: 'text-purple-400',
      gradient: 'from-purple-500/20 to-violet-500/20',
      borderColor: 'hover:border-purple-500',
      description: 'Showcase your work, manage bookings, and grow your business.',
      features: [
        'Showcase your portfolio',
        'Manage appointments',
        'Grow your client base'
      ],
      navigateTo: 'signup-coiffeur'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-white/5">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-medium text-pink-300">Get Started</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          Join 7ela9
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Choose your path and start your journey with us. We're excited to have you!
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl w-full px-4">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <TiltCard 
              key={option.id}
              className="cursor-pointer h-full"
              onClick={() => onNavigate(option.navigateTo)}
              intensity={20}
            >
              <div className={`
                p-6 md:p-8 lg:p-10 rounded-2xl 
                bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-black/80 
                border border-white/10 ${option.borderColor}
                transition-all duration-300 h-full flex flex-col items-center text-center 
                group hover:from-zinc-900 hover:to-black backdrop-blur-sm
                hover:shadow-2xl hover:shadow-${option.id === 'client' ? 'pink' : 'purple'}-500/10
              `}>
                <div className={`
                  w-20 h-20 md:w-24 md:h-24 rounded-full 
                  bg-gradient-to-br ${option.gradient} 
                  flex items-center justify-center mb-6 
                  group-hover:scale-110 transition-all duration-300
                  group-hover:shadow-lg group-hover:shadow-${option.id === 'client' ? 'pink' : 'purple'}-500/30
                `}>
                  <Icon className={`w-10 h-10 md:w-12 md:h-12 ${option.iconColor} transition-transform group-hover:rotate-12`} />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400">
                  {option.title}
                </h2>
                
                <p className="text-gray-400 mb-6 md:mb-8 text-sm md:text-base leading-relaxed">
                  {option.description}
                </p>
                
                <div className="mt-auto space-y-3 text-left w-full px-2">
                  {option.features.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center text-sm text-gray-300 group-hover:text-gray-200 transition-colors"
                    >
                      <div className="flex-shrink-0 mr-3">
                        <Check className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/10 text-white font-medium hover:from-white/20 hover:to-white/10 transition-all duration-300 group-hover:border-white/20">
                  Get Started as {option.id === 'client' ? 'Client' : 'Stylist'}
                </button>
              </div>
            </TiltCard>
          );
        })}
      </div>
      
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 text-gray-500 mb-2">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
          <span className="text-sm">Already have an account?</span>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
        </div>
        <button 
          onClick={() => onNavigate('login')}
          className="text-pink-500 hover:text-pink-400 font-medium transition-all duration-300 hover:scale-105 px-6 py-2 rounded-full bg-gradient-to-r from-pink-500/5 to-purple-500/5 border border-pink-500/10 hover:border-pink-500/30"
        >
          Sign in to your account
        </button>
      </div>
    </div>
  );
};

export default SignupSelection;