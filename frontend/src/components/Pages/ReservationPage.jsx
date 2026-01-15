import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, Loader } from 'lucide-react';
import GlassCard from '../UI/GlassCard';
import Button3D from '../UI/Button3D';

const ReservationPage = ({ stylistId, onNavigate, currentUser }) => {
  const [stylist, setStylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/stylists/${stylistId}`)
      .then(res => res.json())
      .then(data => {
        setStylist({
          ...data,
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
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/reserve/${stylistId}`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (response.ok) {
        alert("Reservation Request Sent!");
        onNavigate(currentUser && currentUser.type === 'coiffeur' ? 'dashboard' : 'home');
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch(err) {
      alert("Error processing reservation.");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
      <Loader className="animate-spin text-pink-500 w-8 h-8" />
    </div>
  );
  
  if (!stylist) return (
    <div className="text-center py-20 text-white">
      Stylist not found
    </div>
  );

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-8 px-4">
      <GlassCard className="w-full max-w-md md:max-w-xl p-6 md:p-8 lg:p-12 mx-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl text-gray-300 mb-2">Book Appointment with</h2>
          <h1 className="text-3xl md:text-4xl font-extrabold text-pink-500 mb-8">{stylist.name}</h1>
        </div>
        
        <form onSubmit={handleReservation} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-pink-500">Select Service</label>
            <select 
              name="service" 
              required 
              className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/50 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition duration-300"
            >
              <option value="" disabled selected>-- Choose a Service --</option>
              {stylist.services && stylist.services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.service_name} ({s.price}€)
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-pink-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Date
              </label>
              <input 
                type="date" 
                name="date" 
                required 
                className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/50 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-pink-500 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Time
              </label>
              <input 
                type="time" 
                name="time" 
                required 
                className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-pink-500/50 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-pink-500">Special Requests / Notes</label>
            <textarea 
              name="notes" 
              rows="3" 
              placeholder="e.g. Short on sides..." 
              maxLength="255"
              className="w-full p-4 rounded-lg bg-zinc-800 border border-pink-500/50 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            ></textarea>
          </div>

          <GlassCard className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Client Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  
                  <p className="text-white">{currentUser ? currentUser.name : 'Guest'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white">{currentUser ? currentUser.email : 'guest@example.com'}</p>
                </div>
              </div>
            </div>
            
            {!currentUser && (
              <p className="text-red-400 text-xs mt-4">
                <strong>Note:</strong> Log in to pre-fill your details and save your booking history.
              </p>
            )}
          </GlassCard>

          <Button3D type="submit" className="w-full py-4 text-lg">
            Confirm Reservation
          </Button3D>
          
          <p className="text-xs text-center text-gray-500 mt-4">
            Reservations are sent to the stylist as "Pending". You'll receive a confirmation once accepted.
          </p>
        </form>
      </GlassCard>
    </div>
  );
};

export default ReservationPage;