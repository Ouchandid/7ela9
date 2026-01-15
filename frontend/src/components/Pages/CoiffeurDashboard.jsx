import React, { useState, useEffect, useRef } from 'react';
import { 
  Grid, MapPin, Menu as MenuIcon, Image as ImageIcon, 
  Users, Scissors, Heart, Calendar, Camera, Upload, 
  Check, X, Trash2, Plus, Loader, TrendingUp,
  Clock, DollarSign, Filter, ListOrdered, Star,
  BarChart3, Eye, Settings, Bell, Award,
  ArrowUp, ArrowDown, Activity
} from 'lucide-react';
import { useLeaflet } from '../../hooks/useLeaflet';
import GlassCard from '../UI/GlassCard';
import Button3D from '../UI/Button3D';

const CoiffeurDashboard = ({ user, onNavigate }) => {
  const [stats, setStats] = useState(null); 
  const [reservations, setReservations] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const isLeafletLoaded = useLeaflet();
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if(!user) return;
    
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/stylists/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if(!data.error) {
          setStats({ 
            waiting: data.waiting || 0, 
            capacity: data.capacity || 0, 
            followers: data.subscriber_count || 0,
            image: data.image,
            rating: data.rating || 4.5,
            totalServices: data.total_services || 127
          });
          setMenuItems(data.menu || []);
        }
      });

    fetch(`${import.meta.env.VITE_API_URL || ''}/api/coiffeur/${user.id}/reservations`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setReservations(data);
      });
  }, [user]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar_file', file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/profile/upload_avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert("Profile picture updated!");
        setStats(prev => ({ ...prev, image: data.image_url }));
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Network error during upload");
    }
  };

  const updateQueue = async (delta) => {
    const newWaiting = Math.max(0, (stats?.waiting || 0) + delta);
    setStats(prev => ({ ...prev, waiting: newWaiting }));

    await fetch(`${import.meta.env.VITE_API_URL || ''}/api/stylists/${user.id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ waiting_count: newWaiting })
    });
  };

  const handleAddMenu = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/coiffeur/menu`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if(res.ok) {
        setMenuItems([...menuItems, { ...data, id: json.id, price: parseFloat(data.price) }]);
        form.reset();
        alert("Menu item added!");
      } else {
        alert(json.error || "Failed to add item");
      }
    } catch(err) {
      console.error(err);
      alert("Error adding menu item");
    }
  };

  const handleDeleteMenu = async (id) => {
    if(!confirm("Delete this menu item?")) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/coiffeur/menu/${id}`, { method: 'DELETE' });
      if(res.ok) {
        setMenuItems(menuItems.filter(m => m.id !== id));
      }
    } catch(err) {
      alert("Delete failed");
    }
  };

  const handleAddPublication = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/publications/with_images`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if(res.ok) {
        alert("Posted successfully!");
        e.target.reset();
      } else {
        alert(json.error || "Failed to post");
      }
    } catch(err) {
      alert("Error posting publication");
    }
  };

  const LocationManager = () => {
    const mapRef = useRef(null);
    const [loc, setLoc] = useState({ lat: 48.8566, lng: 2.3522 });

    useEffect(() => {
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/coiffeurs/locations`)
        .then(res => res.json())
        .then(data => {
          const myLoc = data.find(l => l.id === user.id);
          if (myLoc && myLoc.lat && myLoc.lng) {
            setLoc({ lat: myLoc.lat, lng: myLoc.lng });
          }
        });
    }, []);

    useEffect(() => {
      if(isLeafletLoaded && window.L && activeTab === 'location') {
        const container = document.getElementById('dash-map');
        if(container) {
          if (mapRef.current) {
            mapRef.current.remove();
          }
          
          const map = window.L.map('dash-map', { zoomControl: false }).setView([loc.lat, loc.lng], 13);
          
          window.L.control.zoom({ position: 'topright' }).addTo(map);
          
          window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            maxZoom: 19
          }).addTo(map);
          
          const pinIcon = window.L.divIcon({
            className: 'custom-pin',
            html: `
              <div style="position: relative;">
                <div style="
                  background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
                  width: 40px; 
                  height: 40px; 
                  border-radius: 50% 50% 50% 0;
                  transform: rotate(-45deg);
                  border: 3px solid white;
                  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.6);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  animation: pulse 2s infinite;
                ">
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          });

          let marker = window.L.marker([loc.lat, loc.lng], { draggable: true, icon: pinIcon }).addTo(map);
          
          marker.bindPopup(`
            <div style="color: white; background: #18181b; padding: 12px; border-radius: 8px; border: 1px solid rgba(236, 72, 153, 0.3);">
              <p style="margin: 0; font-weight: bold;">Your Salon Location</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa;">Drag to reposition</p>
            </div>
          `);
          
          map.on('click', (e) => {
            marker.setLatLng(e.latlng);
            setLoc(e.latlng);
          });
          
          marker.on('dragend', (e) => {
            setLoc(e.target.getLatLng());
          });

          mapRef.current = map;
        }
      }
    }, [isLeafletLoaded, activeTab]);

    const saveLocation = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/coiffeur/location`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ latitude: loc.lat, longitude: loc.lng })
        });
        if(res.ok) alert("Location updated successfully!");
      } catch(e) { alert("Error saving location"); }
    };

    return (
      <div className="space-y-6">
        <div id="dash-map" className="w-full h-[500px] rounded-2xl z-0 border border-white/10 overflow-hidden shadow-2xl" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl gap-4 border border-white/5">
          <div>
            <p className="text-sm text-gray-400 mb-1 font-semibold">Selected Coordinates</p>
            <p className="font-mono text-pink-400 text-lg">{loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}</p>
            <p className="text-xs text-gray-500 mt-2">Drag the pin or click on the map to update</p>
          </div>
          <Button3D onClick={saveLocation} className="flex items-center gap-2">
            <Check className="w-4 h-4" /> Save Location
          </Button3D>
        </div>
      </div>
    );
  };

  if(!stats) return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
        <Scissors className="w-6 h-6 text-pink-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <p className="text-gray-400">Loading your dashboard...</p>
    </div>
  );

  const tabs = [
    { id: 'overview', icon: Grid, label: 'Overview', color: 'pink' },
    { id: 'location', icon: MapPin, label: 'Location', color: 'blue' },
    { id: 'menu', icon: MenuIcon, label: 'Menu', color: 'purple' },
    { id: 'publications', icon: ImageIcon, label: 'Gallery', color: 'green' }
  ];

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Header with Stats */}
      <div className="relative bg-gradient-to-b from-zinc-900/80 via-zinc-900/40 to-transparent py-12 mb-8 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 mb-8">
            {/* Profile Section */}
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl ring-4 ring-pink-500/20 group-hover:ring-pink-500/40 transition-all">
                  <img 
                    src={stats.image || user.image || "https://placehold.co/120x120/111/FF69B4?text=ME"} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <Camera className="w-8 h-8 text-white mb-1" />
                    <span className="text-xs text-white font-semibold">Change</span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-black">
                  <Activity className="w-4 h-4 text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-black text-white">
                    {user?.name || 'Stylist'}
                  </h1>
                  <div className="flex items-center gap-1 bg-yellow-400/10 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-yellow-400 text-sm">{stats.rating}</span>
                  </div>
                </div>
                <p className="text-gray-400 mb-2">Professional Stylist Dashboard</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-pink-400" />
                    <span className="text-gray-300">{stats.totalServices} Services</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">{stats.followers} Followers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:ml-auto flex flex-wrap gap-2">
              <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <Bell className="w-5 h-5 text-gray-400" />
              </button>
              <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
              <Button3D variant="secondary" onClick={() => onNavigate('home')}>
                <Eye className="w-4 h-4 mr-2" /> View Profile
              </Button3D>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 space-y-8">
        {activeTab === 'location' && (
          <div className="animate-in slide-in-from-bottom duration-500">
            <div className="mb-6">
              <h2 className="text-3xl font-black text-white mb-2">Salon Location</h2>
              <p className="text-gray-400">Set your precise location to help clients find you easily</p>
            </div>
            <GlassCard className="p-6 md:p-8 bg-zinc-900/60 backdrop-blur-xl">
              <LocationManager />
            </GlassCard>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="animate-in slide-in-from-bottom duration-500">
            <div className="mb-6">
              <h2 className="text-3xl font-black text-white mb-2">Service Menu</h2>
              <p className="text-gray-400">Manage your services and pricing</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Add New Service */}
              <GlassCard className="p-6 md:p-8 bg-zinc-900/60 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white">Add New Service</h3>
                </div>

                <form onSubmit={handleAddMenu} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Service Name</label>
                    <input 
                      name="name" 
                      required 
                      placeholder="e.g. Premium Haircut" 
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Price (€)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        name="price" 
                        type="number" 
                        step="0.01" 
                        required 
                        placeholder="0.00" 
                        className="w-full px-4 py-3 pl-11 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Description</label>
                    <textarea 
                      name="description" 
                      placeholder="Describe your service..." 
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-all resize-none"
                      rows={4}
                    />
                  </div>
                  
                  <Button3D type="submit" className="w-full flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add to Menu
                  </Button3D>
                </form>
              </GlassCard>

              {/* Menu List */}
              <GlassCard className="p-6 md:p-8 bg-zinc-900/60 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <ListOrdered className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-black text-white">Current Menu</h3>
                  </div>
                  <span className="text-sm font-bold text-gray-400">{menuItems.length} items</span>
                </div>

                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                  {menuItems.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
                        <MenuIcon className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-500 mb-2">No services yet</p>
                      <p className="text-sm text-gray-600">Add your first service to get started</p>
                    </div>
                  ) : (
                    menuItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="group p-5 rounded-xl bg-black/30 border border-white/5 hover:border-pink-500/30 transition-all duration-300 hover:bg-black/50"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-lg mb-1 truncate">{item.name}</h4>
                            <p className="text-sm text-gray-400 line-clamp-2">{item.description || 'No description'}</p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                              {item.price}€
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <span className="text-xs text-gray-500 font-medium">Service #{idx + 1}</span>
                          <button 
                            onClick={() => handleDeleteMenu(item.id)} 
                            className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {activeTab === 'publications' && (
          <div className="animate-in slide-in-from-bottom duration-500">
            <div className="mb-6">
              <h2 className="text-3xl font-black text-white mb-2">Create Publication</h2>
              <p className="text-gray-400">Showcase your latest work to attract more clients</p>
            </div>

            <GlassCard className="p-6 md:p-8 bg-zinc-900/60 backdrop-blur-xl max-w-3xl mx-auto">
              <form onSubmit={handleAddPublication} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Description / Caption
                  </label>
                  <textarea 
                    name="text" 
                    required 
                    rows={6} 
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-all resize-none" 
                    placeholder="Share the story behind your work, techniques used, or simply show off your skills..."
                  ></textarea>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Photos (Max 3)
                  </label>
                  <div className="relative border-2 border-dashed border-zinc-700/50 rounded-2xl p-12 text-center hover:border-pink-500/50 transition-all cursor-pointer bg-black/30 hover:bg-black/50 group">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-all">
                        <Upload className="w-8 h-8 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold mb-1">Click to upload images</p>
                        <p className="text-sm text-gray-500">PNG, JPG up to 5MB each</p>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      name="pub_images" 
                      multiple 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>

                <Button3D type="submit" className="w-full flex items-center justify-center gap-2 text-lg py-4">
                  <ImageIcon className="w-5 h-5" />
                  Publish Work
                </Button3D>
              </form>
            </GlassCard>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="animate-in slide-in-from-bottom duration-500 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Queue Card */}
              <GlassCard className="p-6 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-l-4 border-pink-500 hover:shadow-xl hover:shadow-pink-500/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Queue</p>
                    <h2 className="text-5xl font-black text-white">{stats.waiting}</h2>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-pink-500/20 flex items-center justify-center">
                    <Users className="w-7 h-7 text-pink-400" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateQueue(-1)} 
                    className="flex-1 p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <ArrowDown className="w-4 h-4" /> Remove
                  </button>
                  <button 
                    onClick={() => updateQueue(1)} 
                    className="flex-1 p-3 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <ArrowUp className="w-4 h-4" /> Add
                  </button>
                </div>
              </GlassCard>

              {/* Capacity Card */}
              <GlassCard className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-l-4 border-blue-500 hover:shadow-xl hover:shadow-blue-500/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Active</p>
                    <h2 className="text-5xl font-black text-white">{stats.capacity}</h2>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Scissors className="w-7 h-7 text-blue-400" />
                  </div>
                </div>
                <p className="text-sm text-blue-400 font-medium">Currently serving</p>
              </GlassCard>

              {/* Followers Card */}
              <GlassCard className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-l-4 border-purple-500 hover:shadow-xl hover:shadow-purple-500/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Followers</p>
                    <h2 className="text-5xl font-black text-white">{stats.followers}</h2>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-purple-400" />
                  </div>
                </div>
                <p className="text-sm text-purple-400 font-medium">Total subscribers</p>
              </GlassCard>

              {/* Rating Card */}
              <GlassCard className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-l-4 border-yellow-500 hover:shadow-xl hover:shadow-yellow-500/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Rating</p>
                    <h2 className="text-5xl font-black text-white">{stats.rating}</h2>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                <p className="text-sm text-yellow-400 font-medium">Average score</p>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Appointments */}
              <GlassCard className="lg:col-span-2 p-6 md:p-8 bg-zinc-900/60 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-black text-white">Upcoming Appointments</h3>
                  </div>
                  <span className="bg-pink-500/20 text-pink-400 px-4 py-1.5 rounded-full text-sm font-bold">
                    {reservations.filter(r => r.status === 'Pending').length} Pending
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {reservations.length > 0 ? reservations.map(res => (
                    <div
                      key={res.id}
                      className="group p-5 rounded-xl bg-black/30 border border-white/5 hover:border-pink-500/30 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-lg mb-1">{res.client_name}</h4>
                          <p className="text-sm text-gray-400 mb-1">{res.service}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {res.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {res.time}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {res.status === 'Pending' ? (
                            <>
                              <button className="p-2.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all">
                                <Check className="w-5 h-5" />
                              </button>
                              <button className="p-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg ${
                              res.status === 'Confirmed' 
                                ? 'text-green-400 bg-green-500/10' 
                                : 'text-gray-500 bg-gray-500/10'
                            }`}>
                              {res.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-500 mb-2">No appointments scheduled</p>
                      <p className="text-sm text-gray-600">New bookings will appear here</p>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Quick Actions */}
              <GlassCard className="p-6 md:p-8 bg-zinc-900/60 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-black text-white">Quick Actions</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: MenuIcon, label: 'Manage Menu', action: () => setActiveTab('menu'), color: 'purple' },
                    { icon: ImageIcon, label: 'Add Publication', action: () => setActiveTab('publications'), color: 'pink' },
                    { icon: MapPin, label: 'Update Location', action: () => setActiveTab('location'), color: 'blue' },
                    { icon: Eye, label: 'View Profile', action: () => onNavigate('home'), color: 'green' }
                  ].map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.action}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-black/30 border border-white/5 hover:border-pink-500/30 hover:bg-black/50 transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-${action.color}-500/10 flex items-center justify-center group-hover:bg-${action.color}-500/20 transition-all`}>
                        <action.icon className={`w-5 h-5 text-${action.color}-400`} />
                      </div>
                      <span className="font-semibold text-gray-300 group-hover:text-white transition-colors">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar */}
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

export default CoiffeurDashboard;