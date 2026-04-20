
import React from 'react';

const Background3D: React.FC = () => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0,
      background: '#0b0d12',
      pointerEvents: 'none', overflow: 'hidden',
    }}>
      {/* Subtle ambient orbs — very faint, no glow */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* Subtle dot pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.015,
        backgroundImage: 'radial-gradient(rgba(138,180,248,0.4) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 60%, #0b0d12 100%)',
      }} />

      <style>{`
        .bg-orb { position:absolute; border-radius:50%; filter:blur(120px); will-change:transform; }
        .bg-orb-1 { width:500px; height:500px; top:-15%; left:-10%; background:radial-gradient(circle, rgba(66,133,244,0.04) 0%, transparent 70%); animation:bgFloat1 30s ease-in-out infinite; }
        .bg-orb-2 { width:400px; height:400px; bottom:-15%; right:-10%; background:radial-gradient(circle, rgba(52,168,83,0.03) 0%, transparent 70%); animation:bgFloat2 35s ease-in-out infinite; }
        @keyframes bgFloat1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,20px) scale(1.05);} }
        @keyframes bgFloat2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-25px,-15px) scale(1.03);} }
      `}</style>
    </div>
  );
};

export default Background3D;
