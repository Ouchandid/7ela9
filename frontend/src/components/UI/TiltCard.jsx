import React, { useState, useRef } from 'react';

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

export default TiltCard;