import React from 'react';

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

export default GlassCard;