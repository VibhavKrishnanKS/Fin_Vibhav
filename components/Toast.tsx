
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
      className={`fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-xs md:max-w-sm transition-all duration-500 ease-in-out ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}
      style={{ animation: visible ? 'toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'toastOut 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div className="bg-[#121214]/90 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
            <i className="fa-solid fa-circle-check text-xs"></i>
          </div>
          <p className="text-[11px] font-bold text-white uppercase tracking-wider">{message}</p>
        </div>
        
        <button 
          onClick={onUndo}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-black text-[#d4af37] uppercase tracking-widest rounded-lg transition-colors border border-white/5"
        >
          Undo
        </button>

        {/* Progress bar countdown */}
        <div className="absolute bottom-0 left-0 h-0.5 bg-[#d4af37] rounded-full overflow-hidden" style={{ width: '100%', animation: visible ? 'progress 5s linear forwards' : 'none' }}></div>
      </div>

      <style>{`
        @keyframes toastIn { from { transform: translate(-50%, 40px) scale(0.9); opacity: 0; } to { transform: translate(-50%, 0) scale(1); opacity: 1; } }
        @keyframes toastOut { from { transform: translate(-50%, 0) scale(1); opacity: 1; } to { transform: translate(-50%, 40px) scale(0.9); opacity: 0; } }
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

export default Toast;
