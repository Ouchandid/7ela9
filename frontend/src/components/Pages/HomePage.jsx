import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Sparkles, 
  Zap, 
  Car, 
  ArrowRight, 
  MapPin, 
  Star, 
  Users,
  Clock,
  Shield,
  Award,
  ChevronRight
} from 'lucide-react';
import TiltCard from '../UI/TiltCard';
import Button3D from '../UI/Button3D';

const HomePage = ({ onNavigate }) => {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/stylists`)
      .then(res => res.json())
      .then(data => {
        setStylists(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch stylists", err);
        setLoading(false);
      });
  }, []);

  const stats = [
    { label: 'Active Stylists', value: '500+', icon: Users },
    { label: 'Happy Clients', value: '10K+', icon: Star },
    { label: 'Cities', value: '25+', icon: MapPin },
    { label: 'Satisfaction', value: '98%', icon: Award }
  ];

  return (
    <div className="overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-10 pb-20 px-4 md:px-6">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-20 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* TEXT LEFT */}
            <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-bold text-pink-300 tracking-wide">THE FUTURE OF BEAUTY</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] tracking-tighter">
                <span className="text-white">Experience</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 animate-gradient">
                  Luxury Styling
                </span>
                <br />
                <span className="text-white">At Your Doorstep</span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-400 font-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Connect with elite stylists or request a premium mobile service. 
                <span className="text-white font-semibold"> Your transformation begins here.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Button3D onClick={() => onNavigate('signup')} className="group">
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button3D>
                <Button3D variant="secondary" onClick={() => onNavigate('search')}>
                  Browse Stylists
                </Button3D>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center lg:text-left">
                    <div className="text-2xl sm:text-3xl font-black text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-400 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* VISUAL RIGHT */}
            <div className="w-full lg:w-1/2 relative">
              <TiltCard intensity={15} className="relative">
                <div className="relative">
                  {/* Main Image */}
                  <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                    <img 
                      src="https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800" 
                      className="w-full h-auto"
                      alt="Premium Styling" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </div>
                  
                  {/* Featured Badge */}
                  <div className="absolute bottom-6 left-6 right-6 p-5 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-pink-400 font-bold text-xs mb-2 tracking-widest uppercase">Featured Artist</p>
                        <h3 className="text-2xl font-black text-white">Jules Vernes</h3>
                        <p className="text-gray-400 text-sm mt-1">Master Stylist • 8 years exp.</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 bg-yellow-400/20 px-3 py-1 rounded-full">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-yellow-400 text-sm">4.9</span>
                        </div>
                        <div className="text-xs text-gray-400">287 reviews</div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 bg-gradient-to-br from-pink-500 to-purple-600 p-4 rounded-2xl shadow-2xl shadow-pink-500/50 animate-float">
                    <Scissors className="w-6 h-6 text-white" />
                  </div>
                </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES SECTION */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/50 to-transparent"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6">
              <Award className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-bold text-pink-300 tracking-wide">WHY CHOOSE US</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Experience</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              We've redefined beauty services with innovation and excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Sparkles, 
                title: "Elite Talent", 
                text: "Only the top 5% of applicants join our platform. Every stylist is vetted for excellence.", 
                color: "purple",
                gradient: "from-purple-500 to-pink-500"
              },
              { 
                icon: Zap, 
                title: "Instant Booking", 
                text: "Real-time availability and instant confirmations. Book your perfect stylist in seconds.", 
                color: "yellow",
                gradient: "from-yellow-500 to-orange-500"
              },
              { 
                icon: Car, 
                title: "VIP Mobile Service", 
                text: "Premium stylists come to your location. Experience luxury in the comfort of your home.", 
                color: "pink",
                gradient: "from-pink-500 to-rose-500"
              }
            ].map((item, idx) => (
              <TiltCard key={idx} className="h-full">
                <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/5 hover:border-white/10 transition-all duration-500 group hover:shadow-2xl">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} p-0.5 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                      <item.icon className={`w-7 h-7 text-${item.color}-400`} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 transition-all">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{item.text}</p>
                  
                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-gray-500 group-hover:text-pink-400 transition-colors">
                    <span>Learn more</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, text: 'Verified Professionals', color: 'blue' },
              { icon: Clock, text: '24/7 Support', color: 'green' },
              { icon: Award, text: 'Quality Guaranteed', color: 'yellow' },
              { icon: Star, text: '98% Satisfaction', color: 'pink' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/10 flex items-center justify-center mb-3`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-400`} />
                </div>
                <p className="text-sm font-semibold text-gray-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED STYLISTS */}
      <section className="py-24 md:py-32 px-4 md:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/5 to-transparent"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6">
              <Users className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-bold text-pink-300 tracking-wide">TOP TALENT</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Stylists</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Meet our most acclaimed professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {loading ? (
              <div className="col-span-full flex justify-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
                  <Scissors className="w-6 h-6 text-pink-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
              </div>
            ) : stylists.slice(0, 4).map(stylist => (
              <TiltCard key={stylist.id} onClick={() => onNavigate('profile', stylist.id)}>
                <div className="group h-full bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-md rounded-3xl p-6 cursor-pointer hover:from-zinc-800/80 hover:to-zinc-800/40 transition-all duration-500 border border-white/5 hover:border-white/10 hover:shadow-2xl hover:shadow-pink-500/20">
                  {/* Profile Image */}
                  <div className="relative w-24 h-24 mx-auto mb-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/10 group-hover:ring-pink-500/30 transition-all">
                      <img 
                        src={stylist.image || `https://placehold.co/100x100/111/FF69B4?text=${stylist.name?.[0] || 'S'}`} 
                        alt={stylist.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-4 border-zinc-900 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="text-center space-y-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 transition-all">
                      {stylist.name || 'Stylist'}
                    </h3>
                    
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{stylist.city || 'City'}</span>
                      <span>•</span>
                      <span>{stylist.category || 'Category'}</span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 py-3">
                      <div className="flex items-center gap-1.5 bg-yellow-400/10 px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-yellow-400 text-sm">{stylist.rating || '4.5'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-blue-400/10 px-3 py-1.5 rounded-full">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-blue-400 text-sm">{stylist.waiting || 0}</span>
                      </div>
                    </div>
                    
                    <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-600 group-hover:border-transparent transition-all duration-300 group-hover:shadow-lg group-hover:shadow-pink-500/50">
                      View Profile
                    </button>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
          
          <div className="text-center">
            <Button3D variant="secondary" onClick={() => onNavigate('search')} className="group">
              <span>View All Stylists</span>
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button3D>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-32 px-4 md:px-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.1)_0%,transparent_70%)]"></div>
        </div>
        
        <div className="relative container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-4">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-bold text-gray-300 tracking-wide">JOIN THOUSANDS OF SATISFIED CLIENTS</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
              Ready to Transform <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600">
                Your Look?
              </span>
            </h2>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Experience the future of beauty services. Book your perfect stylist today and discover why 7ela9 is the #1 choice for style-conscious clients.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button3D onClick={() => onNavigate('signup')} className="px-10 py-4 text-lg group">
                <span>Get Started Now</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button3D>
              <Button3D variant="outline" onClick={() => onNavigate('search')} className="px-10 py-4 text-lg">
                Browse Stylists
              </Button3D>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes gradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

export default HomePage;