import React from 'react';

const Button3D = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false, ...props }) => {
  const baseStyles = "relative px-6 md:px-8 py-3 md:py-4 font-bold uppercase tracking-wider transition-all duration-200 rounded-xl active:translate-y-1 active:shadow-none flex items-center justify-center group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base";
  
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

export default Button3D;