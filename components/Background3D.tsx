
import React from 'react';

const Background3D: React.FC = () => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0,
      background: '#0d1117',
      pointerEvents: 'none', overflow: 'hidden',
    }}>
      {/* Animated gradient mesh */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      
      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025,
        backgroundImage: 'linear-gradient(rgba(66,133,244,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(66,133,244,0.4) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, #0d1117 100%)',
      }} />

      <style>{`
        .bg-orb { position:absolute; border-radius:50%; filter:blur(100px); will-change:transform; }
        .bg-orb-1 { width:600px; height:600px; top:-10%; left:-5%; background:radial-gradient(circle, rgba(66,133,244,0.1) 0%, transparent 70%); animation:bgFloat1 25s ease-in-out infinite; }
        .bg-orb-2 { width:500px; height:500px; bottom:-10%; right:-5%; background:radial-gradient(circle, rgba(52,168,83,0.07) 0%, transparent 70%); animation:bgFloat2 30s ease-in-out infinite; }
        .bg-orb-3 { width:400px; height:400px; top:40%; left:40%; background:radial-gradient(circle, rgba(251,188,4,0.05) 0%, transparent 70%); animation:bgFloat3 20s ease-in-out infinite; }
        @keyframes bgFloat1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(40px,30px) scale(1.1);} }
        @keyframes bgFloat2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-35px,-20px) scale(1.05);} }
        @keyframes bgFloat3 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(20px,-30px) scale(0.95);} }
      `}</style>
    </div>
  );
};

export default Background3D;
