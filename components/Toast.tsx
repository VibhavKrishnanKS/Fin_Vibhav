
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
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] w-[calc(100%-2rem)] max-w-sm"
      style={{ 
        animation: visible ? 'toastIn 0.4s ease both' : 'toastOut 0.4s ease both',
      }}
    >
      <div className="relative overflow-hidden p-4 rounded-card flex items-center justify-between gap-4"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(138,180,248,0.1)', color: '#8ab4f8' }}>
            <i className="fa-solid fa-check text-sm"></i>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{message}</p>
          </div>
        </div>
        
        <button 
          onClick={onUndo}
          className="px-3 py-1.5 rounded-lg text-[9px] font-bold text-primary uppercase tracking-wider transition-all"
          style={{ background: 'rgba(138,180,248,0.08)' }}
        >
          Undo
        </button>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-[2px] rounded-full" 
          style={{ background: '#8ab4f8', width: '100%', animation: visible ? 'progress 5s linear forwards' : 'none', opacity: 0.5 }}></div>
      </div>

      <style>{`
        @keyframes toastIn { 
          from { transform: translate(-50%, -40px); opacity: 0; } 
          to { transform: translate(-50%, 0); opacity: 1; } 
        }
        @keyframes toastOut { 
          from { transform: translate(-50%, 0); opacity: 1; } 
          to { transform: translate(-50%, -40px); opacity: 0; } 
        }
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

export default Toast;
