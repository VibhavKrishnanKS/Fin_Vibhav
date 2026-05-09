
import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
  onUndo:  () => void;
}

const Toast: React.FC<ToastProps> = ({ message, visible, onUndo }) => {
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => { if (visible) setShouldRender(true); }, [visible]);

  const handleAnimEnd = () => { if (!visible) setShouldRender(false); };

  if (!shouldRender) return null;

  return (
    <div
      onAnimationEnd={handleAnimEnd}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm"
      style={{ animation: visible ? 'toastIn 0.35s cubic-bezier(0.16,1,0.3,1) both' : 'toastOut 0.3s ease both' }}>

      <div className="relative overflow-hidden flex items-center justify-between gap-4 px-4 py-3.5 rounded-[16px]"
        style={{
          background:  'var(--surface-2)',
          border:      '1px solid var(--border)',
          boxShadow:   '0 16px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)',
        }}>

        {/* Left icon + message */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(94,203,138,0.12)', color: '#5ecb8a' }}>
            <i className="fa-solid fa-check text-sm" />
          </div>
          <p className="text-[13px] font-semibold text-white">{message}</p>
        </div>

        {/* Undo button */}
        <button onClick={onUndo}
          className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0"
          style={{ background: 'rgba(108,158,248,0.1)', color: 'var(--primary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(108,158,248,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(108,158,248,0.1)')}>
          Undo
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-[2px] rounded-full"
          style={{
            background: 'var(--primary)',
            width:      '100%',
            opacity:    0.5,
            animation:  visible ? 'toastProgress 5s linear forwards' : 'none',
          }} />
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, -24px) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, 0)     scale(1);    }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translate(-50%, 0)     scale(1);    }
          to   { opacity: 0; transform: translate(-50%, -16px) scale(0.97); }
        }
        @keyframes toastProgress { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

export default Toast;
