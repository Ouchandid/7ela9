import React, { useState } from 'react';
import { Upload, CheckCircle, ArrowRight, MapPin, Scissors, Mail, Phone, Lock } from 'lucide-react';
import GlassCard from '../UI/GlassCard';
import Button3D from '../UI/Button3D';

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
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/signup/coiffeur`, {
        method: 'POST',
        body: data
      });
      
      const resData = await response.json();

      if (response.ok) {
        alert("Application submitted! Please check your email for the confirmation code.");
        onNavigate('login');
      } else {
        alert(resData.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup failed", err);
      alert("There was an error submitting your application.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-8 px-4">
      <GlassCard className="w-full max-w-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/10 pb-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Partner Registration</h2>
            <p className="text-gray-400 text-sm">Join our community of professional stylists</p>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-pink-500 text-white' : 'bg-zinc-800 text-gray-400'}`}>
                  {s}
                </div>
                {s < 5 && (
                  <div className={`w-6 h-0.5 ${step > s ? 'bg-pink-500' : 'bg-zinc-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form id="signup-form" onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <h3 className="text-xl text-pink-400 font-bold">Personal Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-pink-500">Full Name</label>
                  <div className="relative">
                    <input 
                      name="name" 
                      onChange={handleChange} 
                      required 
                      placeholder="Full Name" 
                      className="w-full pl-4 pr-4 py-3 rounded-lg bg-zinc-800 border border-white/10 text-white focus:border-pink-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-pink-500">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="email" 
                      name="email" 
                      onChange={handleChange} 
                      required 
                      placeholder="Email" 
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-white/10 text-white focus:border-pink-500 outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-pink-500">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="tel" 
                    name="phone" 
                    onChange={handleChange} 
                    required 
                    placeholder="Phone Number" 
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-white/10 text-white focus:border-pink-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <h3 className="text-xl text-pink-400 font-bold">Security</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-pink-500">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="password" 
                    name="password" 
                    onChange={handleChange} 
                    required 
                    placeholder="Password (Min 6 chars)" 
                    minLength={6}
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-white/10 text-white focus:border-pink-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <h3 className="text-xl text-pink-400 font-bold">Location & Skill</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-pink-500">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      name="city" 
                      onChange={handleChange} 
                      required 
                      placeholder="City" 
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-zinc-800 border border-white/10 text-white focus:border-pink-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-pink-500">Category</label>
                  <select 
                    name="category" 
                    onChange={handleChange} 
                    className="w-full p-3 bg-zinc-800 rounded-lg text-white border border-white/10 focus:border-pink-500 outline-none"
                  >
                    <option value="Femme">Coiffeure Femme</option>
                    <option value="Homme">Coiffeure Homme</option>
                    <option value="Déplacé">Mobile / Déplacé</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-pink-500">Address or Service Area</label>
                <input 
                  name="address" 
                  onChange={handleChange} 
                  required 
                  placeholder="Salon Address or Service Area" 
                  className="w-full p-3 rounded-lg bg-zinc-800 border border-white/10 text-white focus:border-pink-500 outline-none"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <h3 className="text-xl text-pink-400 font-bold">About You</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-pink-500">Description</label>
                <textarea 
                  name="description" 
                  onChange={handleChange} 
                  required 
                  rows={4} 
                  placeholder="Describe your experience and style..." 
                  className="w-full p-3 rounded-lg bg-zinc-800 border border-white/10 text-white focus:border-pink-500 outline-none"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <div className="p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> 1-Month Free Trial Active!
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  No immediate payment required. Submit your profile to start immediately.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Virement Proof (Optional for trial)</label>
                <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-pink-500 transition-colors cursor-pointer relative bg-zinc-900/50">
                  <Upload className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                  <span className="text-gray-500 text-sm">Click to upload receipt</span>
                  <input 
                    type="file" 
                    name="virement_proof" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 gap-4">
            {step > 1 && (
              <Button3D variant="secondary" onClick={() => setStep(step - 1)}>
                Back
              </Button3D>
            )}
            {step < 5 ? (
              <Button3D onClick={handleNext} className="ml-auto">
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button3D>
            ) : (
              <Button3D variant="success" type="submit" className="ml-auto">
                Start Free Trial
              </Button3D>
            )}
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <button 
              onClick={() => onNavigate('login')}
              className="text-pink-500 hover:text-pink-400 font-medium transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default CoiffeurSignup;