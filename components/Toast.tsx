
import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
  onUndo: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, visible, onUndo }) => {
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) setShouldRender(true);
  }, [visible]);

  const handleAnimationEnd = () => {
    if (!visible) setShouldRender(false);
  };

  if (!shouldRender) return null;

  return (
    <div 
      onAnimationEnd={handleAnimationEnd}
      className={`fixed bottom-28 sm:bottom-12 left-1/2 -translate-x-1/2 z-[110] w-[calc(100%-3rem)] max-w-sm`}
      style={{ 
        animation: visible ? 'toastIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' : 'toastOut 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <div className="glass relative overflow-hidden p-5 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center justify-between gap-6"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#4285F4]/15 flex items-center justify-center text-[#4285F4] shadow-[0_0_15px_rgba(66,133,244,0.2)]">
            <i className="fa-solid fa-satellite-dish text-sm animate-pulse"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">System Notification</p>
            <p className="text-sm font-bold text-white tracking-tight">{message}</p>
          </div>
        </div>
        
        <button 
          onClick={onUndo}
          className="px-4 py-2 glass hover:bg-[#4285F4]/10 text-[9px] font-black text-[#8ab4f8] uppercase tracking-[0.2em] rounded-xl transition-all border border-[#4285F4]/20 active:scale-95"
        >
          Revert
        </button>

        {/* Tactical Progress Bar */}
        <div className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-[#4285F4] to-[#34A853] rounded-full" 
          style={{ width: '100%', animation: visible ? 'progress 5s linear forwards' : 'none', boxShadow: '0 0 10px rgba(66,133,244,0.5)' }}></div>
      </div>

      <style>{`
        @keyframes toastIn { 
          from { transform: translate(-50%, 60px) scale(0.85); opacity: 0; filter: blur(10px); } 
          to { transform: translate(-50%, 0) scale(1); opacity: 1; filter: blur(0); } 
        }
        @keyframes toastOut { 
          from { transform: translate(-50%, 0) scale(1); opacity: 1; filter: blur(0); } 
          to { transform: translate(-50%, 60px) scale(0.85); opacity: 0; filter: blur(10px); } 
        }
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

export default Toast;
