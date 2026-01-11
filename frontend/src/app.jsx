import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Scissors, Calendar, MapPin, Star, User, Mail, 
  Menu, X, Sparkles, Navigation, Camera, Zap, 
  ChevronRight, Heart, MessageSquare, Check, Trash2, 
  Search, Car, Bell, Phone, LogOut, Loader, ArrowRight,
  Map as MapIcon, Lock, CreditCard, Upload, CheckCircle,
  Filter, ListOrdered, Users, Grid, TrendingUp, Clock, 
  DollarSign, Settings, Plus, Save, Image as ImageIcon
} from 'lucide-react';

// --- CONFIG ---
// Robust backend URL retrieval:
// 1. Tries to access Vite environment variable
// 2. Catches errors if import.meta is empty/undefined (common in some preview environments)
// 3. Falls back to empty string (relative path) if variable is missing
const API_URL = (() => {
  try {
    return (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || '';
  } catch (e) {
    return '';
  }
})();

// --- UTILS & HOOKS ---

const useLeaflet = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (document.getElementById('leaflet-css')) {
      setLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
  }, []);

  return loaded;
};

// --- 3D & UI COMPONENTS ---

const TiltCard = ({ children, className = '', intensity = 15, onClick }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;
    setRotation({ x: rotateX, y: rotateY });
  };

  return (
    <div 
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setRotation({ x: 0, y: 0 }); }}
      style={{
        transform: isHovered 
          ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.02, 1.02, 1.02)` 
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out'
      }}
      className={`relative z-10 preserve-3d ${className}`}
    >
      {children}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 rounded-2xl"
        style={{
          opacity: isHovered ? 0.4 : 0,
          background: `radial-gradient(circle at ${50 + (rotation.y * 2)}% ${50 + (rotation.x * 2)}%, rgba(255,255,255,0.2), transparent 50%)`
        }}
      />
    </div>
  );
};

const Button3D = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false, ...props }) => {
  const baseStyles = "relative px-8 py-4 font-bold uppercase tracking-wider transition-all duration-200 rounded-xl active:translate-y-1 active:shadow-none flex items-center justify-center group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-[0_6px_0_rgb(157,23,77)] hover:shadow-[0_8px_0_rgb(157,23,77)] hover:-translate-y-1",
    secondary: "bg-zinc-800 text-white shadow-[0_6px_0_rgb(24,24,27)] hover:shadow-[0_8px_0_rgb(24,24,27)] hover:-translate-y-1 hover:bg-zinc-700",
    outline: "bg-transparent border-2 border-pink-500 text-pink-500 shadow-none hover:bg-pink-500/10 active:translate-y-0",
    success: "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-[0_6px_0_rgb(5,150,105)] hover:shadow-[0_8px_0_rgb(5,150,105)] hover:-translate-y-1",
    purple: "bg-purple-700 text-white shadow-[0_6px_0_rgb(88,28,135)] hover:bg-purple-600 hover:-translate-y-1",
    danger: "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_6px_0_rgb(185,28,28)] hover:shadow-[0_8px_0_rgb(185,28,28)] hover:-translate-y-1"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center">{children}</span>
      <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
    </button>
  );
};

const GlassCard = ({ children, className = '', hoverEffect = true }) => {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl
      shadow-2xl transition-all duration-300 group
      ${hoverEffect ? 'hover:border-pink-500/30' : ''}
      ${className}
    `}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />
      {children}
    </div>
  );
};

// --- FEATURE COMPONENTS ---

// 1. LOGIN PAGE (NEW)
const LoginPage = ({ onNavigate }) => {
  return (
    <div className="flex justify-center py-12 px-4">
      <GlassCard className="w-full max-w-lg p-8 md:p-12">
        <h2 className="text-3xl font-extrabold text-white text-center mb-8">Welcome Back</h2>
        
        {/* Standard Form Submission to Flask Backend */}
        <form action={`${API_URL}/login`} method="POST" className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-pink-500 mb-2">Email</label>
            <input type="email" name="email" required className="w-full p-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-pink-500 mb-2">Password</label>
            <input type="password" name="password" required className="w-full p-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 outline-none" placeholder="••••••••" />
          </div>
          
          <Button3D type="submit" className="w-full">Login</Button3D>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-white/10">
          <p className="text-gray-400 mb-4">Don't have an account?</p>
          <Button3D variant="outline" className="w-full" onClick={() => onNavigate('signup')}>
            Sign Up
          </Button3D>
          <p className="text-xs text-gray-500 mt-2">Choose between Client or Stylist account</p>
        </div>
      </GlassCard>
    </div>
  );
};

// 2. SIGNUP SELECTION
const SignupSelection = ({ onNavigate }) => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
    <h1 className="text-4xl font-black text-white mb-12 text-center">Choose Your Path</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full px-4">
      <TiltCard className="cursor-pointer" onClick={() => onNavigate('signup-client')}>
        <div className="p-10 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-pink-500 transition-colors h-full flex flex-col items-center text-center group">
          <div className="w-24 h-24 rounded-full bg-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <User className="w-12 h-12 text-pink-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">I am a Client</h2>
          <p className="text-gray-400">Find stylists, book appointments, and look your best.</p>
        </div>
      </TiltCard>

      <TiltCard className="cursor-pointer" onClick={() => onNavigate('signup-coiffeur')}>
         <div className="p-10 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-purple-500 transition-colors h-full flex flex-col items-center text-center group">
          <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Scissors className="w-12 h-12 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">I am a Stylist</h2>
          <p className="text-gray-400">Showcase your work, manage bookings, and grow your business.</p>
        </div>
      </TiltCard>
    </div>
  </div>
);

// 3. CLIENT SIGNUP
const ClientSignup = ({ onNavigate }) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      const res = await fetch(`${API_URL}/signup_client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data)
      });
      if (res.ok) {
        alert('Account created! Please log in.');
        onNavigate('login'); 
      } else {
        alert('Signup failed. Email might be taken.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  return (
    <div className="flex justify-center py-12">
      <GlassCard className="w-full max-w-lg p-8 md:p-12">
        <h2 className="text-3xl font-extrabold text-white text-center mb-8">Client Signup</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-pink-500 mb-2">Full Name</label>
            <input name="name" required className="w-full p-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 outline-none" placeholder="Sarah Connor" />
          </div>
          <div>
            <label className="block text-sm font-medium text-pink-500 mb-2">Email</label>
            <input type="email" name="email" required className="w-full p-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-pink-500 mb-2">City</label>
            <input name="city" required className="w-full p-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 outline-none" placeholder="Paris" />
          </div>
          <div>
            <label className="block text-sm font-medium text-pink-500 mb-2">Password</label>
            <input type="password" name="password" required className="w-full p-3 rounded-lg bg-zinc-800 border border-pink-500/30 text-white focus:border-pink-500 outline-none" placeholder="••••••••" />
          </div>
          <Button3D type="submit" className="w-full">Create Account</Button3D>
        </form>
      </GlassCard>
    </div>
  );
};

// 4. COIFFEUR SIGNUP
const CoiffeurSignup = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    const form = document.getElementById('signup-form');
    if (form.checkValidity()) setStep(step + 1);
    else form.reportValidity();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formEl = e.target;
    const data = new FormData(formEl);

    try {
        const response = await fetch(`${API_URL}/signup_coiffeur`, {
            method: 'POST',
            body: data // Sending FormData directly for file upload support
        });
        
        if (response.redirected) {
             window.location.href = response.url; // Handle Flask redirect
        } else {
             alert("Application submitted! Please check your email.");
             onNavigate('login');
        }
    } catch (err) {
        console.error("Signup failed", err);
        alert("There was an error submitting your application.");
    }
  };

  return (
    <div className="flex justify-center py-12 px-4">
      <GlassCard className="w-full max-w-2xl p-8">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-bold text-white">Partner Registration</h2>
          <span className="text-pink-500 font-mono">Step {step}/5</span>
        </div>

        <form id="signup-form" onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right">
              <h3 className="text-xl text-pink-400 font-bold">Personal Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <input name="name" onChange={handleChange} required placeholder="Full Name" className="p-3 bg-zinc-800 rounded-lg text-white border border-white/10 w-full" />
                <input type="email" name="email" onChange={handleChange} required placeholder="Email" className="p-3 bg-zinc-800 rounded-lg text-white border border-white/10 w-full" />
              </div>
              <input type="tel" name="phone" onChange={handleChange} required placeholder="Phone Number" className="p-3 bg-zinc-800 rounded-lg text-white border border-white/10 w-full" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right">
              <h3 className="text-xl text-pink-400 font-bold">Security</h3>
              <input type="password" name="password" onChange={handleChange} required placeholder="Password (Min 6 chars)" minLength={6} className="p-3 bg-zinc-800 rounded-lg text-white border border-white/10 w-full" />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right">
              <h3 className="text-xl text-pink-400 font-bold">Location & Skill</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <input name="city" onChange={handleChange} required placeholder="City" className="p-3 bg-zinc-800 rounded-lg text-white border border-white/10 w-full" />
                <select name="category" onChange={handleChange} className="p-3 bg-zinc-800 rounded-lg text-white border border-white/10 w-full">
                  <option value="Femme">Coiffeure Femme</option>
                  <option value="Homme">Coiffeure Homme</option>
                  <option value="Déplacé">Mobile / Déplacé</option>
                </select>
              </div>
              <input name="address" onChange={handleChange} required placeholder="Salon Address or Service Area" className="p-3 bg-zinc-800 rounded-lg text-white border border-white/10 w-full" />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in slide-in-from-right">
              <h3 className="text-xl text-pink-400 font-bold">About You</h3>
              <textarea name="description" onChange={handleChange} required rows={4} placeholder="Describe your experience and style..." className="p-3 bg-zinc-800 rounded-lg text-white border border-white/10 w-full" />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in slide-in-from-right">
               <div className="p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                 <p className="text-green-400 font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5" /> 1-Month Free Trial Active!</p>
                 <p className="text-sm text-gray-400 mt-2">No immediate payment required. Submit your profile to start immediately.</p>
               </div>
               
               <div className="space-y-2">
                 <label className="text-sm text-gray-400">Virement Proof (Optional for trial)</label>
                 <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-pink-500 transition-colors cursor-pointer relative">
                   <Upload className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                   <span className="text-gray-500 text-sm">Click to upload receipt</span>
                   <input type="file" name="virement_proof" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                 </div>
               </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            {step > 1 && (
              <Button3D variant="secondary" onClick={() => setStep(step - 1)}>Back</Button3D>
            )}
            {step < 5 ? (
              <Button3D onClick={handleNext} className="ml-auto">Continue</Button3D>
            ) : (
              <Button3D variant="success" type="submit" className="ml-auto">Start Free Trial</Button3D>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

// 5. RESERVATION PAGE
const ReservationPage = ({ stylistId, onNavigate, currentUser }) => {
  const [stylist, setStylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/stylists/${stylistId}`)
      .then(res => res.json())
      .then(data => {
        setStylist({
          ...data,
           // Ensure services map correctly if backend structure differs, otherwise assume structure is good
          services: data.menu ? data.menu.map((m, i) => ({ id: i, service_name: m.name, price: m.price })) : [] 
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [stylistId]);

  const handleReservation = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    // Add logic to get Service ID if needed by backend, or send name
    
    try {
        // Since we are using a Form submit in app.py logic roughly
        // We'll mimic the form action in React if possible or use fetch
        // NOTE: The backend expects a Form POST to /reserve/<id>.
        
        const form = e.target;
        form.action = `${API_URL}/reserve/${stylistId}`;
        form.method = "POST";
        form.submit(); // Submit natively to handle Flask redirect logic easily
    } catch(err) {
      alert("Error processing reservation.");
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-pink-500" /></div>;
  if (!stylist) return <div className="text-center p-20 text-white">Stylist not found</div>;

  return (
    <div className="flex justify-center py-12 animate-in slide-in-from-bottom">
      <GlassCard className="w-full max-w-xl p-8 md:p-12">
        <h2 className="text-2xl text-gray-300 text-center mb-1">Book Appointment with</h2>
        <h1 className="text-4xl font-extrabold text-pink-500 text-center mb-8">{stylist.name}</h1>
        
        <form onSubmit={handleReservation} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-pink-500 mb-2">Select Service</label>
            <select name="service" required className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/50 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition duration-300">
              <option value="" disabled selected>-- Choose a Service --</option>
              {stylist.services && stylist.services.map(s => (
                <option key={s.id} value={s.id || 1}>{s.service_name} ({s.price}€)</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium text-pink-500 mb-2">Date</label>
               <input type="date" name="date" required 
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/50 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
             </div>
             <div>
               <label className="block text-sm font-medium text-pink-500 mb-2">Time</label>
               <input type="time" name="time" required 
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/50 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-pink-500 mb-2">Special Requests / Notes</label>
            <textarea name="notes" rows="3" placeholder="e.g. Short on sides..." maxLength="255"
                      className="w-full p-4 rounded-lg bg-zinc-800 border border-pink-500/50 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"></textarea>
          </div>

          <div className="bg-zinc-900/50 p-4 rounded-lg border border-white/5">
             <h3 className="text-lg font-semibold text-white mb-2">Client Details</h3>
             <p className="text-gray-400">Name: <span className="text-white">{currentUser ? currentUser.name : 'Guest'}</span></p>
             <p className="text-gray-400">Email: <span className="text-white">{currentUser ? currentUser.email : 'guest@example.com'}</span></p>
             {!currentUser && <p className="text-red-400 text-xs mt-2">Log in to pre-fill details.</p>}
          </div>

          <Button3D type="submit" className="w-full">Confirm Reservation</Button3D>
          <p className="text-xs text-center text-gray-500 mt-2">Reservations are sent to the stylist as "Pending".</p>
        </form>
      </GlassCard>
    </div>
  );
};

// 6. SEARCH PAGE
const SearchPage = ({ onNavigate }) => {
  const [allStylists, setAllStylists] = useState([]);
  const [filteredStylists, setFilteredStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', category: 'all', sort: 'rating' });

  // Fetch initial data
  useEffect(() => {
    fetch(`${API_URL}/api/stylists`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setAllStylists(list);
        setFilteredStylists(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter Logic
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    let result = [...allStylists];

    if (filters.city) {
        result = result.filter(s => s.city === filters.city);
    }
    if (filters.category !== 'all') {
        result = result.filter(s => s.category === filters.category);
    }
    if (filters.sort === 'rating') {
        result.sort((a, b) => b.rating - a.rating);
    } else if (filters.sort === 'waiting') {
        result.sort((a, b) => (a.waiting || 0) - (b.waiting || 0));
    }
    setFilteredStylists(result);
  };

  return (
    <div className="container mx-auto px-4 py-12 animate-in slide-in-from-bottom">
      <h1 className="text-5xl font-extrabold text-white mb-4">
          Find Your <span className="text-pink-500">Perfect Stylist</span>
      </h1>
      <p className="text-lg text-gray-300 mb-8">
          Discover top-rated coiffeurs near you. Refine your search using the filters below.
      </p>

      <Button3D variant="purple" onClick={() => onNavigate('map')} className="mb-10 w-full md:w-auto">
        <MapIcon className="w-5 h-5 mr-2" /> Open Interactive Map View
      </Button3D>

      <GlassCard className="p-6 mb-12 bg-zinc-800/70">
         <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
               <label className="block text-sm font-medium text-pink-500 mb-2">Location</label>
               <select name="city" onChange={handleFilterChange} className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-pink-500/50 text-white focus:outline-none">
                 <option value="">All Cities</option>
                 <option value="Paris">Paris</option>
                 <option value="Lyon">Lyon</option>
                 <option value="Marseille">Marseille</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-pink-500 mb-2">Category</label>
               <select name="category" onChange={handleFilterChange} className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-pink-500/50 text-white focus:outline-none">
                 <option value="all">All Categories</option>
                 <option value="Femme">Femme</option>
                 <option value="Homme">Homme</option>
                 <option value="Déplacé">Mobile</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-pink-500 mb-2">Sort By</label>
               <select name="sort" onChange={handleFilterChange} className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-pink-500/50 text-white focus:outline-none">
                 <option value="rating">Highest Rating</option>
                 <option value="waiting">Lowest Wait Time</option>
               </select>
            </div>
            <Button3D type="submit" className="h-[42px] flex items-center justify-center">
              <Search className="w-5 h-5 mr-2" /> Apply Filters
            </Button3D>
         </form>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {loading ? <Loader className="animate-spin text-pink-500" /> : filteredStylists.length > 0 ? filteredStylists.map(stylist => (
           <TiltCard key={stylist.id} onClick={() => onNavigate('profile', stylist.id)} className="cursor-pointer h-full">
               <div className="h-full group bg-zinc-800 rounded-2xl p-4 transition duration-300 border border-zinc-700 hover:border-pink-500/50 shadow-lg hover:shadow-pink-500/20">
                  <div className="flex flex-col items-center">
                     <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-4 border-pink-500 group-hover:border-white transition-colors">
                        <img src={stylist.image || `https://placehold.co/120x120/111/FF69B4?text=${stylist.name[0]}`} alt={stylist.name} className="w-full h-full object-cover" />
                     </div>
                     <h2 className="text-xl font-bold text-white group-hover:text-pink-500 transition-colors">{stylist.name}</h2>
                     <p className="text-sm text-gray-400 mb-3">{stylist.city} | <span className="text-pink-300">{stylist.category}</span></p>
                     
                     <div className="flex items-center mb-4 text-pink-500">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(stylist.rating) ? 'fill-current' : 'text-zinc-600'}`} />)}
                        <span className="text-gray-300 ml-2 text-sm">({stylist.rating})</span>
                     </div>

                     <div className="w-full flex justify-between items-center px-3 py-1 bg-zinc-900 rounded-full text-xs font-medium">
                        <div className="flex items-center space-x-1 text-yellow-400">
                           <Users className="w-3 h-3" />
                           <span>Wait: {stylist.waiting || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-blue-400">
                           <Scissors className="w-3 h-3" />
                           <span>Attending: {stylist.capacity || 0}</span>
                        </div>
                     </div>

                     <Button3D className="w-full mt-4 !py-2 !text-xs">Book Now</Button3D>
                  </div>
               </div>
           </TiltCard>
         )) : (
            <p className="col-span-full text-center text-gray-500 text-lg py-10">No stylists found matching your criteria.</p>
         )}
      </div>
    </div>
  );
};

// 7. MAP PAGE (FIXED)
const MapPage = ({ onNavigate }) => {
  const isLeafletLoaded = useLeaflet();
  const [stylists, setStylists] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/stylists`)
      .then(res => res.json())
      .then(data => setStylists(Array.isArray(data) ? data : []));
  }, []);
  
  // Fixed Map Logic: Uses custom icons to prevent 404 errors
  useEffect(() => {
      if(isLeafletLoaded && window.L) {
          fetch(`${API_URL}/api/coiffeurs/locations`)
            .then(res => res.json())
            .then(locations => {
                const container = document.getElementById('map-container');
                if (container && !container._leaflet_id && Array.isArray(locations)) {
                    const map = window.L.map('map-container').setView([48.8566, 2.3522], 6);
                    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap'
                    }).addTo(map);

                    // Custom Icon to avoid missing asset issues
                    const pinIcon = window.L.divIcon({
                        className: 'custom-pin',
                        html: `<div style="background-color: #ec4899; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });

                    const markers = [];
                    locations.forEach(loc => {
                        if (loc.lat && loc.lng) {
                            const marker = window.L.marker([loc.lat, loc.lng], { icon: pinIcon }).addTo(map);
                            marker.bindPopup(`
                                <div style="color:black; min-width: 150px;">
                                    <h3 style="margin:0; font-weight:bold;">${loc.name}</h3>
                                    <p style="margin:5px 0;">${loc.address}</p>
                                    <span style="background:#ec4899; color:white; padding:2px 6px; border-radius:4px; font-size:10px;">${loc.category}</span>
                                    <br/><br/>
                                    <a href="#" onclick="window.location.hash='stylist-${loc.id}'; return false;" style="color:#ec4899;">View Profile</a>
                                </div>
                            `);
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

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-6rem)]">
      <h1 className="text-3xl font-bold text-pink-500 mb-6 border-b border-pink-500/50 pb-4">Stylists Near You</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
         <div className="order-2 md:order-1 overflow-y-auto space-y-4 pr-2 h-full custom-scrollbar">
            <h2 className="text-xl font-semibold text-white mb-4">Stylist List</h2>
            {stylists.map(stylist => (
               <div key={stylist.id} onClick={() => onNavigate('profile', stylist.id)} className="glass-card p-4 flex items-center space-x-4 cursor-pointer hover:border-pink-500 transition-colors">
                  <img src={stylist.image || `https://placehold.co/50x50/111/FF69B4?text=${stylist.name[0]}`} className="w-12 h-12 rounded-full border border-pink-500 object-cover" alt={stylist.name} />
                  <div>
                     <h4 className="font-bold text-white text-lg">{stylist.name}</h4>
                     <p className="text-xs text-gray-400">{stylist.address || stylist.city}</p>
                     <div className="flex gap-2 mt-1 text-xs">
                        <span className="text-yellow-400">Wait: {stylist.waiting || 0}</span>
                        <span className="text-blue-400">Attending: {stylist.capacity || 0}</span>
                     </div>
                  </div>
               </div>
            ))}
            <Button3D variant="outline" className="w-full" onClick={() => onNavigate('search')}>Switch to List View</Button3D>
         </div>

         <div className="order-1 md:order-2 md:col-span-2 relative h-[40vh] md:h-full rounded-xl overflow-hidden shadow-2xl border border-white/10">
            <div id="map-container" className="w-full h-full z-0 bg-zinc-800" />
            {!isLeafletLoaded && <div className="absolute inset-0 flex items-center justify-center bg-zinc-900"><Loader className="animate-spin text-pink-500" /></div>}
         </div>
      </div>
    </div>
  );
};

// 8. HOME PAGE (Unchanged)
const HomePage = ({ onNavigate }) => {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/stylists`)
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

  return (
    <div className="overflow-x-hidden">
      {/* HERO SECTION - REVERTED TO 3D STYLE */}
      <section className="relative min-h-[90vh] flex flex-col md:flex-row items-center pt-24 pb-12">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-pink-600/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
        
        {/* TEXT LEFT */}
        <div className="w-full md:w-1/2 z-10 space-y-8 px-6 md:pl-20 animate-in slide-in-from-left duration-700">
          <span className="px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest rounded-full border bg-pink-500/20 text-pink-300 border-pink-500/30">
            The Future of Styling
          </span>
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
            NOT JUST <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600">A HAIRCUT.</span>
            <br /> A MASTERPIECE.
          </h1>
          <p className="text-xl text-gray-400 font-light max-w-lg border-l-4 border-pink-500 pl-6">
            Experience the new standard of beauty. Book elite stylists or request a mobile VIP session to your doorstep.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button3D onClick={() => onNavigate('signup')}>
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button3D>
            <Button3D variant="secondary" onClick={() => onNavigate('login')}>
              Login
            </Button3D>
          </div>
        </div>
        
        {/* 3D VISUALS RIGHT */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-auto relative flex items-center justify-center mt-12 md:mt-0">
          <TiltCard intensity={20}>
             <img src="https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=600" className="rounded-[2rem] shadow-2xl border-2 border-white/10" alt="Hero" />
             <div className="absolute bottom-8 left-8">
                <p className="text-pink-400 font-bold tracking-widest text-xs mb-1">FEATURED ARTIST</p>
                <h3 className="text-3xl font-black text-white">Jules Vernes</h3>
             </div>
          </TiltCard>
        </div>
      </section>

      {/* VALUES SECTION (3D Cards) */}
      <section className="py-24 relative container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Sparkles, title: "Curated Talent", text: "Top 5% of applicants only.", color: "text-purple-400" },
              { icon: Zap, title: "Instant Booking", text: "Real-time availability.", color: "text-yellow-400" },
              { icon: Car, title: "VIP Mobile Service", text: "We come to you.", color: "text-pink-400" }
            ].map((item, idx) => (
              <TiltCard key={idx} className="h-full">
                <div className="h-full p-8 rounded-2xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-800/60 transition-colors">
                  <item.icon className={`w-10 h-10 mb-4 ${item.color}`} />
                  <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.text}</p>
                </div>
              </TiltCard>
            ))}
          </div>
      </section>

      {/* FEATURED STYLISTS (Grid View) */}
      <section className="mb-32 px-6 container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Featured Stylists</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Browse top talent in your city.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stylists.slice(0, 4).map(stylist => (
              <TiltCard key={stylist.id} onClick={() => onNavigate('profile', stylist.id)}>
                <div className="group h-full bg-zinc-800/50 backdrop-blur-md rounded-2xl p-6 cursor-pointer text-center hover:bg-white/10 transition-all border border-white/5">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 bg-pink-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <img src={stylist.image || `https://placehold.co/100x100/111/FF69B4?text=${stylist.name[0]}`} 
                            alt={stylist.name} className="relative w-24 h-24 rounded-2xl object-cover border border-white/10" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-pink-500 transition-colors">{stylist.name}</h3>
                    <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider">{stylist.city} • {stylist.category}</p>
                    <button className="w-full py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white group-hover:bg-pink-600 group-hover:border-pink-600 transition-all">
                        View Profile
                    </button>
                </div>
              </TiltCard>
            ))}
          </div>
          
          <div className="text-center mt-16">
             <Button3D variant="secondary" onClick={() => onNavigate('search')}>View All Stylists <ArrowRight className="ml-2 w-4 h-4" /></Button3D>
          </div>
        </section>
    </div>
  );
};

// 9. MOBILE REQUEST PAGE (Unchanged)
const DeplacementRequestPage = ({ onNavigate }) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    alert("Broadcasting request to nearby mobile stylists...");
    onNavigate('home');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-12 items-start">
        <div className="flex-1 space-y-6">
          <h1 className="text-5xl font-black text-white leading-tight">
            Bring the Salon <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">To Your Doorstep.</span>
          </h1>
          <p className="text-xl text-gray-400">Broadcast your request to all verified "Déplacé" stylists nearby.</p>
        </div>

        <GlassCard className="w-full max-w-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className="text-gray-400 text-sm">Service</label><input required className="w-full p-3 bg-zinc-800 rounded-lg text-white border border-white/10" placeholder="e.g. Bridal Updo" /></div>
            <div><label className="text-gray-400 text-sm">Address</label><input required className="w-full p-3 bg-zinc-800 rounded-lg text-white border border-white/10" placeholder="Your Address" /></div>
            <div className="flex gap-4">
               <div className="flex-1"><label className="text-gray-400 text-sm">Date</label><input type="date" required className="w-full p-3 bg-zinc-800 rounded-lg text-white border border-white/10" /></div>
               <div className="flex-1"><label className="text-gray-400 text-sm">Time</label><input type="time" required className="w-full p-3 bg-zinc-800 rounded-lg text-white border border-white/10" /></div>
            </div>
            <Button3D type="submit" className="w-full mt-4">Broadcast Request</Button3D>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

// 10. PROFILE PAGE (Unchanged)
const ProfilePage = ({ stylistId, onNavigate, currentUser }) => {
  const [stylist, setStylist] = useState(null);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // REAL FETCH
    fetch(`${API_URL}/api/stylists/${stylistId}`)
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
      // Add fetch call to follow API here
  };
  
  const handleReview = () => {
       if (!currentUser) {
          alert("Login to leave a review.");
          return;
       }
       // Open review modal logic
  };

  if (loading) return <div className="flex justify-center pt-40 min-h-screen bg-black"><Loader className="animate-spin text-pink-500 w-12 h-12" /></div>;
  if (!stylist) return <div className="text-white text-center pt-40">Stylist not found</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-20">
      
      {/* 1. PREMIUM HERO HEADER */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        {/* Parallax Background */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105" 
             style={{ backgroundImage: `url('https://images.unsplash.com/photo-1521590832898-947b408d3d95?auto=format&fit=crop&q=80')` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-[#050505]" />
        </div>
        
        {/* Content Container */}
        <div className="absolute inset-0 container mx-auto px-6 flex flex-col justify-end pb-12">
            <div className="flex flex-col md:flex-row items-end gap-8 animate-in slide-in-from-bottom duration-1000">
                {/* Avatar with Golden Ring */}
                <div className="relative group">
                    <div className="w-40 h-40 md:w-56 md:h-56 rounded-full p-1 bg-gradient-to-tr from-yellow-500 via-yellow-200 to-yellow-600 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
                        <img src={stylist.image || "https://placehold.co/400x400"} 
                             className="w-full h-full rounded-full object-cover border-4 border-[#050505]" alt={stylist.name} />
                    </div>
                    {/* Status Indicator */}
                    <div className="absolute bottom-4 right-4 bg-emerald-500 w-6 h-6 rounded-full border-4 border-[#050505] shadow-lg animate-pulse"></div>
                </div>

                {/* Text Details */}
                <div className="flex-1 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-yellow-100">
                            {stylist.category}
                        </span>
                        <span className="flex items-center text-yellow-400 text-sm font-bold">
                            <Star className="w-4 h-4 fill-current mr-1"/> {stylist.rating}
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-2 tracking-tight leading-none">
                        {stylist.name}
                    </h1>
                    <p className="text-xl text-gray-300 font-light flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-500" /> {stylist.city} 
                        <span className="w-1 h-1 bg-gray-600 rounded-full mx-2" />
                        <span className="text-gray-400">{stylist.subscriber_count} followers</span>
                    </p>
                </div>

                {/* Floating Action Button - Desktop */}
                <div className="hidden md:flex gap-4 mb-4">
                    <button onClick={handleFollow} className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                        <Heart className={`w-6 h-6 ${isFollowing ? 'fill-pink-500 text-pink-500' : ''}`} />
                    </button>
                    <button onClick={handleBook} className="h-14 px-10 rounded-full bg-white text-black font-bold text-lg hover:bg-yellow-400 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        Book Appointment
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT GRID */}
      <div className="container mx-auto px-4 md:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Bio & Services */}
          <div className="lg:col-span-8 space-y-12">
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
                          <div key={idx} className="group p-6 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-default flex justify-between items-center">
                              <div>
                                  <h4 className="text-xl font-medium text-white group-hover:text-yellow-200 transition-colors">{item.name}</h4>
                                  <p className="text-sm text-gray-500 mt-1">{item.description || "Standard service duration applies."}</p>
                              </div>
                              <span className="text-2xl font-light text-white">€{item.price}</span>
                          </div>
                      )) : <p className="text-gray-500 italic">No services listed yet.</p>}
                  </div>
              </section>

              {/* Feed / Portfolio */}
              <section>
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                    <h3 className="text-2xl font-light text-white border-l-2 border-yellow-500 pl-4">Visual Diary</h3>
                </div>
                
                <div className="columns-1 md:columns-2 gap-6 space-y-6">
                    {stylist.feed && stylist.feed.map(post => (
                        <div key={post.id} className="break-inside-avoid rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 group">
                            {post.images && JSON.parse(post.images).map((img, i) => (
                                <img key={i} src={img} alt="Post" className="w-full object-cover" />
                            ))}
                            <div className="p-6">
                                <p className="text-gray-300 font-light mb-4 text-sm">{post.text}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wider">
                                    <span>{post.created_at}</span>
                                    <div className="flex gap-4">
                                        <span className="flex items-center gap-1 hover:text-pink-500 cursor-pointer"><Heart className="w-4 h-4" /> {post.likes}</span>
                                        <span className="flex items-center gap-1 hover:text-blue-500 cursor-pointer"><MessageSquare className="w-4 h-4" /> {post.comments}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!stylist.feed?.length && (
                        <div className="col-span-full h-64 flex items-center justify-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <p className="text-gray-500">No posts shared yet.</p>
                        </div>
                    )}
                </div>
              </section>
          </div>

          {/* Right Column: Sticky Info */}
          <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-28 space-y-6">
                  {/* Location Card */}
                  <div className="p-8 rounded-3xl bg-[#111] border border-white/10">
                      <h4 className="text-white font-bold mb-6 flex items-center gap-3">
                          <MapPin className="text-yellow-500" /> Location
                      </h4>
                      <p className="text-gray-400 mb-6 leading-relaxed">{stylist.address}</p>
                      <div className="h-40 rounded-xl bg-zinc-800 overflow-hidden relative opacity-50 hover:opacity-100 transition-opacity">
                          {/* Static map placeholder since we are inside detailed view */}
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">Map View</div>
                      </div>
                  </div>

                  {/* Hours Card */}
                  <div className="p-8 rounded-3xl bg-[#111] border border-white/10">
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
                  </div>

                  {/* Mobile FAB (Only visible on mobile) */}
                  <button onClick={handleBook} className="md:hidden w-full py-4 rounded-xl bg-white text-black font-bold shadow-lg shadow-white/10">
                      Book Now
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

// 11. COIFFEUR DASHBOARD (UPDATED - Publications & Menu Implementation)
const CoiffeurDashboard = ({ user, onNavigate }) => {
  // Use null for loading states
  const [stats, setStats] = useState(null); 
  const [reservations, setReservations] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'location', 'menu', 'publications'
  const isLeafletLoaded = useLeaflet();
  
  // File Upload Ref
  const fileInputRef = useRef(null);
  
  // Load real data
  useEffect(() => {
    if(!user) return;
    
    // 1. Fetch Profile Stats (Waiting, Capacity, Followers) & Menu
    fetch(`${API_URL}/api/stylists/${user.id}`)
        .then(res => res.json())
        .then(data => {
            if(!data.error) {
                setStats({ 
                    waiting: data.waiting || 0, 
                    capacity: data.capacity || 0, 
                    followers: data.subscriber_count || 0,
                    image: data.image
                });
                setMenuItems(data.menu || []);
            }
        });

    // 2. Fetch Reservations
    fetch(`${API_URL}/api/coiffeur/${user.id}/reservations`)
        .then(res => res.json())
        .then(data => {
            if(Array.isArray(data)) setReservations(data);
        });
  }, [user]);

  // Handle Image Upload
  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('avatar_file', file);

      try {
          const res = await fetch(`${API_URL}/api/profile/upload_avatar`, {
              method: 'POST',
              body: formData
          });
          const data = await res.json();
          if (res.ok) {
              alert("Profile picture updated!");
              // Update local state to show new image immediately
              setStats(prev => ({ ...prev, image: data.image_url }));
          } else {
              alert(data.error || "Upload failed");
          }
      } catch (err) {
          alert("Network error during upload");
      }
  };

  // Update Queue Logic
  const updateQueue = async (delta) => {
      // Optimistic update
      const newWaiting = Math.max(0, (stats?.waiting || 0) + delta);
      setStats(prev => ({ ...prev, waiting: newWaiting }));

      // Send to API
      await fetch(`${API_URL}/api/stylists/${user.id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ waiting_count: newWaiting })
      });
  };

  // Add Menu Item
  const handleAddMenu = async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = Object.fromEntries(new FormData(form));
      
      try {
          const res = await fetch(`${API_URL}/api/coiffeur/menu`, {
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

  // Delete Menu Item
  const handleDeleteMenu = async (id) => {
      if(!confirm("Delete this menu item?")) return;
      
      try {
          const res = await fetch(`${API_URL}/api/coiffeur/menu/${id}`, { method: 'DELETE' });
          if(res.ok) {
              setMenuItems(menuItems.filter(m => m.id !== id)); // Adjust logic if ID is missing in frontend list
          }
      } catch(err) {
          alert("Delete failed");
      }
  };

  // Add Publication
  const handleAddPublication = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      try {
          const res = await fetch(`${API_URL}/api/publications/with_images`, {
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

  // Location Manager Component
  const LocationManager = () => {
    const mapRef = useRef(null);
    const [loc, setLoc] = useState({ lat: 48.8566, lng: 2.3522 }); // Default Paris

    useEffect(() => {
        // Fetch current location
        fetch(`${API_URL}/api/coiffeurs/locations`)
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
                
                const map = window.L.map('dash-map').setView([loc.lat, loc.lng], 13);
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                
                // Use default icon or custom for editing
                const pinIcon = window.L.divIcon({
                        className: 'custom-pin',
                        html: `<div style="background-color: #ec4899; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                });

                let marker = window.L.marker([loc.lat, loc.lng], { draggable: true, icon: pinIcon }).addTo(map);
                
                // Click to move marker
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
            const res = await fetch(`${API_URL}/api/coiffeur/location`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ latitude: loc.lat, longitude: loc.lng })
            });
            if(res.ok) alert("Location updated successfully!");
        } catch(e) { alert("Error saving location"); }
    };

    return (
        <div className="space-y-4">
            <div id="dash-map" className="w-full h-[400px] rounded-xl z-0 border border-white/10" />
            <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl">
                <div>
                    <p className="text-xs text-gray-500">Selected Coordinates</p>
                    <p className="font-mono text-pink-500">{loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}</p>
                </div>
                <Button3D onClick={saveLocation} variant="success">Save Location</Button3D>
            </div>
        </div>
    );
  };

  if(!stats) return <div className="flex justify-center p-20"><Loader className="animate-spin text-pink-500" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500 shadow-xl">
                        <img src={stats.image || user.image || "https://placehold.co/100x100/111/FF69B4?text=ME"} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-sm">
                        <Camera className="w-8 h-8 text-white" />
                    </div>
                </div>
                {/* EXPLICIT UPDATE BUTTON */}
                <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-pink-400 hover:text-white flex items-center gap-1 border border-pink-500/30 px-3 py-1 rounded-full transition-colors">
                    <Camera className="w-3 h-3" /> Update Photo
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">Stylist Dashboard</h1>
              <p className="text-pink-500 font-medium">Welcome back, {user?.name || 'Stylist'}</p>
            </div>
        </div>
        <div className="flex flex-wrap gap-2">
            <Button3D variant={activeTab === 'overview' ? 'primary' : 'outline'} onClick={() => setActiveTab('overview')} className="!py-2 !px-4 !text-xs">
                <Grid className="w-4 h-4 mr-2" /> Overview
            </Button3D>
            <Button3D variant={activeTab === 'location' ? 'primary' : 'outline'} onClick={() => setActiveTab('location')} className="!py-2 !px-4 !text-xs">
                <MapPin className="w-4 h-4 mr-2" /> Location
            </Button3D>
            <Button3D variant={activeTab === 'menu' ? 'primary' : 'outline'} onClick={() => setActiveTab('menu')} className="!py-2 !px-4 !text-xs">
                <Menu className="w-4 h-4 mr-2" /> Menu
            </Button3D>
            <Button3D variant={activeTab === 'publications' ? 'primary' : 'outline'} onClick={() => setActiveTab('publications')} className="!py-2 !px-4 !text-xs">
                <ImageIcon className="w-4 h-4 mr-2" /> Publications
            </Button3D>
        </div>
      </div>

      {activeTab === 'location' && (
          <GlassCard className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Update Your Salon Location</h2>
              <p className="text-gray-400 mb-4">Click on the map to set your precise location. This will be used for client searches.</p>
              <LocationManager />
          </GlassCard>
      )}

      {activeTab === 'menu' && (
          <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Service Menu</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                  {/* Add New Item Form */}
                  <div className="space-y-4">
                      <h3 className="text-pink-500 font-bold uppercase text-sm">Add New Service</h3>
                      <form onSubmit={handleAddMenu} className="space-y-3">
                          <input name="name" required placeholder="Service Name (e.g. Buzz Cut)" className="w-full p-3 bg-zinc-900 border border-white/10 rounded-lg text-white" />
                          <input name="price" type="number" step="0.01" required placeholder="Price (€)" className="w-full p-3 bg-zinc-900 border border-white/10 rounded-lg text-white" />
                          <textarea name="description" placeholder="Description (optional)" className="w-full p-3 bg-zinc-900 border border-white/10 rounded-lg text-white" rows={2} />
                          <Button3D type="submit" variant="success" className="w-full">Add to Menu</Button3D>
                      </form>
                  </div>

                  {/* Existing Menu List */}
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      <h3 className="text-pink-500 font-bold uppercase text-sm">Current Menu</h3>
                      {menuItems.length === 0 ? <p className="text-gray-500">No items yet.</p> : (
                          menuItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                                  <div>
                                      <p className="font-bold text-white">{item.name}</p>
                                      <p className="text-xs text-gray-400">{item.description}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-white font-mono mb-1">{item.price}€</p>
                                      <button onClick={() => handleDeleteMenu(item.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </GlassCard>
      )}

      {activeTab === 'publications' && (
          <GlassCard className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Create New Publication</h2>
              <form onSubmit={handleAddPublication} className="space-y-6 max-w-2xl mx-auto">
                  <div className="space-y-2">
                      <label className="text-gray-400">Description / Caption</label>
                      <textarea name="text" required rows={4} className="w-full p-4 bg-zinc-900 border border-white/10 rounded-xl text-white focus:border-pink-500 outline-none" placeholder="Show off your latest work..."></textarea>
                  </div>
                  
                  <div className="space-y-2">
                      <label className="text-gray-400">Upload Photos (Max 3)</label>
                      <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-pink-500 transition-colors cursor-pointer relative bg-zinc-900/50">
                          <ImageIcon className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                          <span className="text-gray-500 text-sm">Click to select images</span>
                          <input type="file" name="pub_images" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </div>
                  </div>

                  <Button3D type="submit" className="w-full">Publish Work</Button3D>
              </form>
          </GlassCard>
      )}

      {activeTab === 'overview' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 flex items-center justify-between border-l-4 border-pink-500">
                    <div>
                    <p className="text-gray-400 text-sm uppercase tracking-widest">Queue</p>
                    <h2 className="text-5xl font-black text-white mt-2">{stats.waiting}</h2>
                    <div className="flex gap-2 mt-4">
                        <button onClick={() => updateQueue(-1)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/30 transition-colors"><Trash2 className="w-5 h-5" /></button>
                        <button onClick={() => updateQueue(1)} className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/30 transition-colors"><Plus className="w-5 h-5" /></button>
                    </div>
                    </div>
                    <Users className="w-20 h-20 text-pink-500/20" />
                </GlassCard>

                <GlassCard className="p-6 flex items-center justify-between border-l-4 border-blue-500">
                    <div>
                    <p className="text-gray-400 text-sm uppercase tracking-widest">Attending</p>
                    <h2 className="text-5xl font-black text-white mt-2">{stats.capacity}</h2>
                    <p className="text-xs text-blue-400 mt-2">Occupied Chairs</p>
                    </div>
                    <Scissors className="w-20 h-20 text-blue-500/20" />
                </GlassCard>

                <GlassCard className="p-6 flex items-center justify-between border-l-4 border-purple-500">
                    <div>
                    <p className="text-gray-400 text-sm uppercase tracking-widest">Followers</p>
                    <h2 className="text-5xl font-black text-white mt-2">{stats.followers}</h2>
                    <p className="text-xs text-purple-400 mt-2">Verified Clients</p>
                    </div>
                    <Heart className="w-20 h-20 text-purple-500/20" />
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Reservations List */}
                <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-pink-500" /> Upcoming</h3>
                    <span className="bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full text-xs font-bold">{reservations.filter(r => r.status === 'Pending').length} Pending</span>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {reservations.length > 0 ? reservations.map(res => (
                    <div key={res.id} className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 flex justify-between items-center group hover:border-pink-500/30 transition-colors">
                        <div>
                        <h4 className="font-bold text-white">{res.client_name}</h4>
                        <p className="text-sm text-gray-400">{res.service} @ {res.time}</p>
                        <p className="text-xs text-gray-600">{res.date}</p>
                        </div>
                        <div className="flex gap-2">
                        {res.status === 'Pending' ? (
                            <>
                                <button className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"><Check className="w-5 h-5" /></button>
                                <button className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"><X className="w-5 h-5" /></button>
                            </>
                        ) : (
                            <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${
                                res.status === 'Confirmed' ? 'text-green-500 border-green-500/20' : 'text-gray-500 border-gray-500/20'
                            }`}>{res.status}</span>
                        )}
                        </div>
                    </div>
                    )) : <p className="text-gray-500 text-center py-4">No reservations yet.</p>}
                </div>
                </GlassCard>

                {/* Quick Shortcuts */}
                <GlassCard className="p-6 flex flex-col justify-center gap-4">
                    <h3 className="text-xl font-bold text-white">Quick Actions</h3>
                    <Button3D variant="outline" onClick={() => setActiveTab('menu')}>Manage Menu</Button3D>
                    <Button3D variant="outline" onClick={() => setActiveTab('publications')}>Add Publication</Button3D>
                    <Button3D variant="outline" onClick={() => setActiveTab('location')}>Update Map Location</Button3D>
                </GlassCard>
            </div>
          </>
      )}
    </div>
  );
};

// --- LAYOUT ---

const Navbar = ({ user, onNavigate, onLogout }) => (
  <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
    <div className="container mx-auto px-6 h-24 flex items-center justify-between">
      <div onClick={() => onNavigate('home')} className="flex items-center gap-3 cursor-pointer group">
        <Scissors className="w-8 h-8 text-white group-hover:rotate-180 transition-transform duration-700" />
        <span className="text-3xl font-black text-white">7ela9<span className="text-pink-500">.com</span></span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <button onClick={() => onNavigate('home')} className="text-sm font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors">Home</button>
        
        {/* If user is coiffeur, show Dashboard link, otherwise show standard links */}
        {user?.type === 'coiffeur' ? (
          <button onClick={() => onNavigate('dashboard')} className="text-sm font-bold text-pink-500 hover:text-pink-400 uppercase tracking-widest transition-colors flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Dashboard
          </button>
        ) : (
          <>
            <button onClick={() => onNavigate('search')} className="text-sm font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors">Search</button>
            <button onClick={() => onNavigate('map')} className="text-sm font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors">Map</button>
            {user && <button onClick={() => onNavigate('request-mobile')} className="text-sm font-bold text-gray-400 hover:text-white uppercase tracking-widest">Mobile Request</button>}
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => user.type === 'coiffeur' ? onNavigate('dashboard') : null}>
              <span className="text-sm font-bold text-white hidden sm:block">{user.name}</span>
              <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center font-bold text-white">{user.name[0]}</div>
            </div>
            <button onClick={onLogout}><LogOut className="w-5 h-5 text-gray-500 hover:text-red-500" /></button>
          </>
        ) : (
          <div className="flex gap-4">
            <button onClick={() => onNavigate('login')} className="text-sm font-bold text-gray-300 hover:text-white">Login</button>
            <Button3D variant="primary" className="!px-6 !py-2 !text-xs" onClick={() => onNavigate('signup')}>
              Sign Up
            </Button3D>
          </div>
        )}
      </div>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="border-t border-white/5 bg-black py-20 mt-24">
    <div className="container mx-auto px-6 text-center">
      <h4 className="text-2xl font-black text-white mb-4">7ela9<span className="text-pink-500">.com</span></h4>
      <p className="text-gray-500 text-sm">Redefining beauty, one appointment at a time.</p>
    </div>
  </footer>
);

// --- MAIN APP ---

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentStylistId, setCurrentStylistId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Auth Check
  useEffect(() => {
    fetch(`${API_URL}/api/me`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then(data => {
        setCurrentUser(data);
        setCheckingAuth(false);
        // FIX: Redirect coiffeur to dashboard on initial load/login
        if (data && (data.type === 'coiffeur' || data.role === 'coiffeur')) {
          setCurrentPage('dashboard');
        }
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, []);

  const navigate = (page, id = null) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(page);
    if (id) setCurrentStylistId(id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('home');
    window.location.href = `${API_URL}/logout`;
  };

  if (checkingAuth) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader className="w-10 h-10 text-pink-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-pink-500/30 selection:text-white overflow-x-hidden">
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 bg-black pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black" />
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar user={currentUser} onNavigate={navigate} onLogout={handleLogout} />

        <main className="flex-grow pt-24 container mx-auto px-4 sm:px-6">
          {/* ROUTER SWITCH */}
          {currentPage === 'home' && <HomePage onNavigate={navigate} />}
          {currentPage === 'login' && <LoginPage onNavigate={navigate} />}
          {currentPage === 'signup' && <SignupSelection onNavigate={navigate} />}
          {currentPage === 'signup-client' && <ClientSignup onNavigate={navigate} />}
          {currentPage === 'signup-coiffeur' && <CoiffeurSignup onNavigate={navigate} />}
          {currentPage === 'search' && <SearchPage onNavigate={navigate} />}
          {currentPage === 'profile' && <ProfilePage stylistId={currentStylistId} onNavigate={navigate} currentUser={currentUser} />}
          {currentPage === 'reservation' && <ReservationPage stylistId={currentStylistId} onNavigate={navigate} currentUser={currentUser} />}
          {currentPage === 'request-mobile' && <DeplacementRequestPage onNavigate={navigate} />}
          {currentPage === 'map' && <MapPage onNavigate={navigate} />}
          {currentPage === 'dashboard' && <CoiffeurDashboard user={currentUser} onNavigate={navigate} />}
        </main>

        <Footer />
      </div>

      <style jsx global>{`
        @keyframes float-slow { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(2deg); } }
        @keyframes shine { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-shine { animation: shine 2s infinite; }
        .preserve-3d { transform-style: preserve-3d; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #333; border-radius: 4px; }
      `}</style>
    </div>
  );
}