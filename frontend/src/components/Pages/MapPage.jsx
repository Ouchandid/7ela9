import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Loader, 
  Navigation, 
  Star, 
  Users, 
  Clock,
  Scissors,
  Filter,
  List,
  Maximize2,
  Search
} from 'lucide-react';
import { useLeaflet } from '../../hooks/useLeaflet';
import GlassCard from '../UI/GlassCard';
import Button3D from '../UI/Button3D';

const MapPage = ({ onNavigate }) => {
  const isLeafletLoaded = useLeaflet();
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/stylists`)
      .then(res => res.json())
      .then(data => {
        setStylists(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  useEffect(() => {
    if(isLeafletLoaded && window.L) {
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/coiffeurs/locations`)
        .then(res => res.json())
        .then(locations => {
          const container = document.getElementById('map-container');
          if (container && !container._leaflet_id && Array.isArray(locations)) {
            const map = window.L.map('map-container', {
              zoomControl: false
            }).setView([48.8566, 2.3522], 6);

            // Add custom zoom control
            window.L.control.zoom({
              position: 'topright'
            }).addTo(map);

            // Dark theme map tiles
            window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
              attribution: '© OpenStreetMap contributors © CARTO',
              maxZoom: 19
            }).addTo(map);

            // Custom pin with gradient
            const pinIcon = window.L.divIcon({
              className: 'custom-pin',
              html: `
                <div style="position: relative;">
                  <div style="
                    background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
                    width: 32px; 
                    height: 32px; 
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: 3px solid white;
                    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            });

            const markers = [];
            locations.forEach(loc => {
              if (loc.lat && loc.lng) {
                const marker = window.L.marker([loc.lat, loc.lng], { icon: pinIcon }).addTo(map);
                
                // Enhanced popup
                marker.bindPopup(`
                  <div style="
                    color: white;
                    background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
                    padding: 16px;
                    border-radius: 12px;
                    min-width: 200px;
                    border: 1px solid rgba(255,255,255,0.1);
                  ">
                    <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px; color: white;">${loc.name}</h3>
                    <p style="margin: 0 0 8px 0; color: #a1a1aa; font-size: 13px; display: flex; align-items: center; gap: 4px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      ${loc.address || loc.city}
                    </p>
                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                      <span style="
                        background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
                        color: white;
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 600;
                      ">${loc.category}</span>
                      <span style="
                        background: rgba(234, 179, 8, 0.2);
                        color: #fbbf24;
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                      ">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        ${loc.rating || '4.5'}
                      </span>
                    </div>
                    <a 
                      href="#" 
                      onclick="window.location.hash='stylist-${loc.id}'; return false;" 
                      style="
                        display: inline-block;
                        background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-size: 13px;
                        font-weight: 600;
                        width: 100%;
                        text-align: center;
                        transition: all 0.3s;
                      "
                      onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 16px rgba(236, 72, 153, 0.4)';"
                      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
                    >
                      View Profile →
                    </a>
                  </div>
                `, {
                  className: 'custom-popup',
                  closeButton: true,
                  maxWidth: 250
                });

                marker.on('click', () => {
                  setSelectedStylist(loc.id);
                });

                markers.push(marker);
              }
            });
            
            if(markers.length > 0) {
              const group = new window.L.featureGroup(markers);
              map.fitBounds(group.getBounds().pad(0.1));
            }
          }
        })
        .catch(err => console.error("Map data fetch error:", err));
    }
  }, [isLeafletLoaded]);

  const filteredStylists = stylists.filter(stylist => 
    stylist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stylist.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-b from-zinc-900/50 to-transparent py-12 md:py-16 mb-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6">
              <Navigation className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-bold text-pink-300 tracking-wide">EXPLORE LOCATIONS</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              Find Stylists <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Near You</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed mb-6">
              Discover top-rated professionals in your area using our interactive map
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <div className="font-bold text-white">{stylists.length}+</div>
                  <div className="text-gray-500">Locations</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-bold text-white">Real-time</div>
                  <div className="text-gray-500">Tracking</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="font-bold text-white">Instant</div>
                  <div className="text-gray-500">Booking</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 pb-12">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button3D 
              variant="secondary" 
              onClick={() => onNavigate('search')}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" /> 
              <span className="hidden sm:inline">List View</span>
            </Button3D>
            
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          <div className="text-sm text-gray-400">
            Showing <span className="font-semibold text-white">{filteredStylists.length}</span> stylists on map
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Map Container */}
          <div className="lg:col-span-2 h-[400px] md:h-[500px] lg:h-[700px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group">
            <div id="map-container" className="w-full h-full z-0 bg-zinc-900" />
            {!isLeafletLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
                  <MapPin className="w-6 h-6 text-pink-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="text-gray-400 mt-4 text-sm">Loading interactive map...</p>
              </div>
            )}

            {/* Map Overlay Controls */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <button className="w-10 h-10 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/90 transition-all shadow-lg">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/90 transition-all shadow-lg">
                <Navigation className="w-4 h-4" />
              </button>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-500 to-purple-600"></div>
                  <span className="text-gray-300">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-300">Busy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stylist Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-11 rounded-xl bg-zinc-900/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 focus:bg-zinc-900 transition-all"
                  />
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>

              {/* Stylist List Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white">Stylists Nearby</h2>
                <span className="text-sm text-gray-400">{filteredStylists.length} found</span>
              </div>

              {/* Stylist Cards */}
              <div className="space-y-3 overflow-y-auto h-[300px] md:h-[400px] lg:h-[550px] pr-2 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
                      <Scissors className="w-5 h-5 text-pink-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                  </div>
                ) : filteredStylists.length > 0 ? filteredStylists.map(stylist => (
                  <div
                    key={stylist.id}
                    onClick={() => {
                      setSelectedStylist(stylist.id);
                      onNavigate('profile', stylist.id);
                    }}
                    className={`group p-4 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border transition-all duration-300 cursor-pointer hover:from-zinc-800/80 hover:to-zinc-800/40 hover:shadow-xl hover:shadow-pink-500/10 ${
                      selectedStylist === stylist.id 
                        ? 'border-pink-500/50 shadow-lg shadow-pink-500/20' 
                        : 'border-white/5 hover:border-pink-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                        <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-pink-500/30 transition-all">
                          <img 
                            src={stylist.image || `https://placehold.co/56x56/111/FF69B4?text=${stylist.name?.[0] || 'S'}`} 
                            className="w-full h-full object-cover" 
                            alt={stylist.name} 
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm mb-1 truncate group-hover:text-pink-400 transition-colors">
                          {stylist.name}
                        </h4>
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span>{stylist.address || stylist.city}</span>
                        </p>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="font-semibold">{stylist.rating || '4.5'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-400">
                            <Users className="w-3 h-3" />
                            <span className="font-semibold">{stylist.waiting || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span className="font-semibold">{stylist.capacity || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-lg">
                        <Scissors className="w-3 h-3" />
                        {stylist.category || 'Stylist'}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No stylists found</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      {searchTerm ? 'Try a different search term' : 'No stylists available in your area'}
                    </p>
                    {searchTerm && (
                      <Button3D 
                        variant="outline" 
                        className="!text-sm"
                        onClick={() => setSearchTerm('')}
                      >
                        Clear Search
                      </Button3D>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #db2777 0%, #9333ea 100%);
        }
      `}</style>
    </div>
  );
};

export default MapPage;