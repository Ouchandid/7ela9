import React from 'react';
import { Car, MapPin, Calendar, Clock } from 'lucide-react';
import GlassCard from '../UI/GlassCard';
import Button3D from '../UI/Button3D';

const DeplacementRequestPage = ({ onNavigate }) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    alert("Broadcasting request to nearby mobile stylists...");
    onNavigate('home');
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Left Content */}
        <div className="flex-1 space-y-6 md:space-y-8">
          <div className="space-y-4">
            <span className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest rounded-full border bg-pink-500/20 text-pink-300 border-pink-500/30">
              VIP Service
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Bring the Salon <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">To Your Doorstep.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400">
              Broadcast your request to all verified "Déplacé" stylists nearby. Perfect for events, special occasions, or just the convenience of home service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <GlassCard className="p-6">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Any Location</h3>
              <p className="text-sm text-gray-400">Service at your home, office, or venue</p>
            </GlassCard>
            
            <GlassCard className="p-6">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Flexible Timing</h3>
              <p className="text-sm text-gray-400">Choose date and time that works for you</p>
            </GlassCard>
            
            <GlassCard className="p-6">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <Car className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Mobile Experts</h3>
              <p className="text-sm text-gray-400">Verified mobile stylists with equipment</p>
            </GlassCard>
          </div>
        </div>

        {/* Right Form */}
        <GlassCard className="w-full lg:max-w-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Request Mobile Service</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Service Requested</label>
              <input 
                required 
                placeholder="e.g. Bridal Updo, Men's Cut, Color Treatment..." 
                className="w-full p-3 bg-zinc-800 rounded-lg text-white border border-white/10 focus:border-pink-500 outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Full Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  required 
                  placeholder="Your Address" 
                  className="w-full pl-10 pr-3 py-3 bg-zinc-800 rounded-lg text-white border border-white/10 focus:border-pink-500 outline-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-gray-400 text-sm">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="date" 
                    required 
                    className="w-full pl-10 pr-3 py-3 bg-zinc-800 rounded-lg text-white border border-white/10 focus:border-pink-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-gray-400 text-sm">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="time" 
                    required 
                    className="w-full pl-10 pr-3 py-3 bg-zinc-800 rounded-lg text-white border border-white/10 focus:border-pink-500 outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Additional Details (Optional)</label>
              <textarea 
                placeholder="Number of people, special requirements, etc." 
                rows={3}
                className="w-full p-3 bg-zinc-800 rounded-lg text-white border border-white/10 focus:border-pink-500 outline-none"
              />
            </div>
            
            <Button3D type="submit" className="w-full mt-4">
              Broadcast Request
            </Button3D>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Your request will be visible to all mobile stylists in your area. They can contact you to confirm.
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default DeplacementRequestPage;