import React, { useState, useEffect } from 'react';
import { MapPin, Star, Heart, MessageSquare, Clock, Scissors, Calendar } from 'lucide-react';
import Button3D from '../UI/Button3D';
import GlassCard from '../UI/GlassCard';

const ProfilePage = ({ stylistId, onNavigate, currentUser }) => {
  const [stylist, setStylist] = useState(null);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/stylists/${stylistId}`)
      .then(res => {
        if(!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(data => {
        setStylist(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [stylistId]);

  const handleBook = () => {
    if (!currentUser) {
      onNavigate('login');
      return;
    }
    onNavigate('reservation', stylist.id);
  };

  const handleFollow = () => {
    if (!currentUser) {
      onNavigate('login');
      return;
    }
    setIsFollowing(!isFollowing);
  };
  
  const handleReview = () => {
    if (!currentUser) {
      alert("Login to leave a review.");
      return;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>
  );
  
  if (!stylist) return (
    <div className="text-white text-center pt-40 min-h-screen bg-black">
      Stylist not found
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-20">
      {/* HERO HEADER */}
      <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105" 
             style={{ backgroundImage: `url('https://images.unsplash.com/photo-1521590832898-947b408d3d95?auto=format&fit=crop&q=80')` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-[#050505]" />
        </div>
        
        <div className="absolute inset-0 container mx-auto px-4 md:px-6 flex flex-col justify-end pb-8 md:pb-12">
          <div className="flex flex-col md:flex-row items-end gap-6 md:gap-8 animate-in slide-in-from-bottom duration-1000">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full p-1 bg-gradient-to-tr from-yellow-500 via-yellow-200 to-yellow-600 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
                <img 
                  src={stylist.image || "https://placehold.co/400x400"} 
                  className="w-full h-full rounded-full object-cover border-4 border-[#050505]" 
                  alt={stylist.name} 
                />
              </div>
              <div className="absolute bottom-4 right-4 bg-emerald-500 w-6 h-6 rounded-full border-4 border-[#050505] shadow-lg animate-pulse"></div>
            </div>

            {/* Text Details */}
            <div className="flex-1 mb-4">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-yellow-100">
                  {stylist.category}
                </span>
                <span className="flex items-center text-yellow-400 text-sm font-bold">
                  <Star className="w-4 h-4 fill-current mr-1"/> {stylist.rating || 0}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-2 tracking-tight leading-none">
                {stylist.name}
              </h1>
              <p className="text-lg md:text-xl text-gray-300 font-light flex items-center gap-2 flex-wrap">
                <MapPin className="w-5 h-5 text-gray-500" /> 
                {stylist.city} 
                <span className="w-1 h-1 bg-gray-600 rounded-full mx-2" />
                <span className="text-gray-400">{stylist.subscriber_count || 0} followers</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex md:hidden gap-4 mb-4 w-full">
              <button onClick={handleFollow} className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <Heart className={`w-6 h-6 ${isFollowing ? 'fill-pink-500 text-pink-500' : ''}`} />
              </button>
              <button onClick={handleBook} className="flex-1 h-14 rounded-full bg-white text-black font-bold text-lg hover:bg-yellow-400 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                Book Now
              </button>
            </div>
            
            <div className="hidden md:flex gap-4 mb-4">
              <button onClick={handleFollow} className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <Heart className={`w-6 h-6 ${isFollowing ? 'fill-pink-500 text-pink-500' : ''}`} />
              </button>
              <button onClick={handleBook} className="h-14 px-8 rounded-full bg-white text-black font-bold text-lg hover:bg-yellow-400 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-8 md:space-y-12">
            {/* About Section */}
            <section className="animate-in fade-in duration-700 delay-200">
              <h3 className="text-2xl font-light text-white mb-6 border-l-2 border-yellow-500 pl-4">The Artist</h3>
              <p className="text-lg text-gray-400 leading-relaxed font-light">
                {stylist.description || "Passionate about creating unique styles that reflect your personality. With years of experience in high-end salons, I bring precision and artistry to every cut."}
              </p>
            </section>

            {/* Services Menu */}
            <section>
              <h3 className="text-2xl font-light text-white mb-6 border-l-2 border-yellow-500 pl-4">Service Menu</h3>
              <div className="grid gap-4">
                {stylist.menu && stylist.menu.length > 0 ? stylist.menu.map((item, idx) => (
                  <GlassCard key={idx} className="group p-6 flex justify-between items-center hover:border-pink-500/50">
                    <div>
                      <h4 className="text-xl font-medium text-white group-hover:text-yellow-200 transition-colors">{item.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{item.description || "Standard service duration applies."}</p>
                    </div>
                    <span className="text-2xl font-light text-white">€{item.price}</span>
                  </GlassCard>
                )) : (
                  <p className="text-gray-500 italic">No services listed yet.</p>
                )}
              </div>
            </section>

            {/* Portfolio */}
            <section>
              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <h3 className="text-2xl font-light text-white border-l-2 border-yellow-500 pl-4">Visual Diary</h3>
                <div className="flex space-x-4">
                  <button 
                    className={`px-4 py-2 rounded-lg ${activeTab === 'portfolio' ? 'bg-pink-500 text-white' : 'bg-zinc-800 text-gray-400'}`}
                    onClick={() => setActiveTab('portfolio')}
                  >
                    Portfolio
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-lg ${activeTab === 'reviews' ? 'bg-pink-500 text-white' : 'bg-zinc-800 text-gray-400'}`}
                    onClick={() => setActiveTab('reviews')}
                  >
                    Reviews
                  </button>
                </div>
              </div>
              
              {activeTab === 'portfolio' ? (
                <div className="columns-1 md:columns-2 gap-6 space-y-6">
                  {stylist.feed && stylist.feed.length > 0 ? stylist.feed.map((post, index) => (
                    <GlassCard key={index} className="break-inside-avoid">
                      <div className="p-6">
                        <p className="text-gray-300 font-light mb-4 text-sm">{post.text}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wider">
                          <span>{post.created_at}</span>
                          <div className="flex gap-4">
                            <span className="flex items-center gap-1 hover:text-pink-500 cursor-pointer">
                              <Heart className="w-4 h-4" /> {post.likes || 0}
                            </span>
                            <span className="flex items-center gap-1 hover:text-blue-500 cursor-pointer">
                              <MessageSquare className="w-4 h-4" /> {post.comments || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  )) : (
                    <div className="col-span-full h-64 flex items-center justify-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <p className="text-gray-500">No posts shared yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 bg-zinc-900/50 rounded-xl">
                    <p className="text-gray-300">No reviews yet. Be the first to review!</p>
                  </div>
                  <Button3D variant="outline" onClick={handleReview}>
                    Write a Review
                  </Button3D>
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-28 space-y-6">
              {/* Location Card */}
              <GlassCard className="p-6">
                <h4 className="text-white font-bold mb-6 flex items-center gap-3">
                  <MapPin className="text-yellow-500" /> Location
                </h4>
                <p className="text-gray-400 mb-6 leading-relaxed">{stylist.address || stylist.city}</p>
                <div className="h-40 rounded-xl bg-zinc-800 overflow-hidden relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                    <MapPin className="w-8 h-8 mb-2" />
                    <p>Map View</p>
                  </div>
                </div>
              </GlassCard>

              {/* Hours Card */}
              <GlassCard className="p-6">
                <h4 className="text-white font-bold mb-6 flex items-center gap-3">
                  <Clock className="text-blue-500" /> Availability
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Weekdays</span>
                    <span className="text-white">10:00 - 20:00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Saturday</span>
                    <span className="text-white">09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/10 pt-4">
                    <span className="text-gray-400">Current Queue</span>
                    <span className="text-yellow-400 font-bold">{stylist.waiting || 0} People</span>
                  </div>
                </div>
              </GlassCard>

              {/* Mobile Booking Button */}
              <button onClick={handleBook} className="md:hidden w-full py-4 rounded-xl bg-white text-black font-bold shadow-lg shadow-white/10 hover:bg-yellow-400 transition-colors">
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;