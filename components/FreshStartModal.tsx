
import React, { useState, useEffect, useRef } from 'react';

interface FreshStartModalProps {
  onConfirm: (keepAccounts: boolean) => Promise<void>;
  onClose: () => void;
}

type Step = 'warn' | 'confirm' | 'processing' | 'done';

const FreshStartModal: React.FC<FreshStartModalProps> = ({ onConfirm, onClose }) => {
  const [step, setStep] = useState<Step>('warn');
  const [typedText, setTypedText] = useState('');
  const [keepAccounts, setKeepAccounts] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const CONFIRM_PHRASE = 'FRESH START';

  useEffect(() => {
    if (step === 'confirm') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  // Trap focus inside modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleConfirm = async () => {
    if (typedText !== CONFIRM_PHRASE) return;
    setStep('processing');
    try {
      await onConfirm(keepAccounts);
      setStep('done');
    } catch {
      setStep('confirm'); // Allow retry
    }
  };

  const isMatch = typedText === CONFIRM_PHRASE;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && step !== 'processing') onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-[32px] overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #1a1a1f 0%, #111114 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          animation: 'freshModalIn 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Red accent top bar */}
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #f28b82, #ff6b6b, #f28b82)', backgroundSize: '200% 100%', animation: 'shimmerRed 2s linear infinite' }} />

        <div className="p-7 sm:p-9">

          {/* STEP 1: WARNING */}
          {step === 'warn' && (
            <div style={{ animation: 'stepIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(242,139,130,0.12)', border: '1px solid rgba(242,139,130,0.2)' }}>
                  <i className="fa-solid fa-triangle-exclamation text-2xl" style={{ color: '#f28b82' }} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: '#f28b82' }}>Danger Zone</p>
                  <h2 className="text-xl font-black text-white tracking-tight">Fresh Start</h2>
                </div>
              </div>

              <p className="text-[13px] text-gray-400 leading-relaxed mb-6">
                This will <strong className="text-white">permanently erase all your transaction history</strong> and reset your account balances. This action <span className="text-[#f28b82] font-bold">cannot be undone</span>.
              </p>

              {/* Option toggle */}
              <div className="rounded-2xl p-4 mb-7" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">What to reset?</p>
                <div className="space-y-2.5">
                  {[
                    {
                      value: true,
                      label: 'Keep Accounts & Categories',
                      desc: 'Only erase transaction history. Keep your account structure and categories intact.',
                      icon: 'fa-receipt',
                    },
                    {
                      value: false,
                      label: 'Full Reset (Everything)',
                      desc: 'Wipe all transactions AND reset accounts to defaults. Complete blank slate.',
                      icon: 'fa-bomb',
                    }
                  ].map(opt => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setKeepAccounts(opt.value)}
                      className="w-full text-left p-3.5 rounded-xl transition-all duration-200 flex gap-3 items-start"
                      style={{
                        background: keepAccounts === opt.value ? 'rgba(242,139,130,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${keepAccounts === opt.value ? 'rgba(242,139,130,0.3)' : 'rgba(255,255,255,0.04)'}`,
                      }}
                    >
                      <div className="w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all"
                        style={{ borderColor: keepAccounts === opt.value ? '#f28b82' : '#444' }}>
                        {keepAccounts === opt.value && <div className="w-2 h-2 rounded-full" style={{ background: '#f28b82' }} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <i className={`fa-solid ${opt.icon} text-[10px]`} style={{ color: keepAccounts === opt.value ? '#f28b82' : '#666' }} />
                          <p className="text-[11px] font-black text-white">{opt.label}</p>
                        </div>
                        <p className="text-[10px] text-gray-600 leading-relaxed">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider text-gray-400 transition-all hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  Cancel
                </button>
                <button onClick={() => setStep('confirm')}
                  className="flex-1 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #c0392b, #f28b82)', boxShadow: '0 4px 20px rgba(242,139,130,0.25)' }}>
                  <i className="fa-solid fa-arrow-right mr-2 text-[10px]" />
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TYPED CONFIRMATION */}
          {step === 'confirm' && (
            <div style={{ animation: 'stepIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(242,139,130,0.12)', border: '1px solid rgba(242,139,130,0.2)' }}>
                  <i className="fa-solid fa-keyboard text-2xl" style={{ color: '#f28b82' }} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: '#f28b82' }}>Confirm Action</p>
                  <h2 className="text-xl font-black text-white tracking-tight">Type to Confirm</h2>
                </div>
              </div>

              <p className="text-[12px] text-gray-400 leading-relaxed mb-5">
                To proceed, type the phrase below <strong className="text-white">exactly</strong>:
              </p>

              <div className="rounded-xl px-4 py-3 mb-5 text-center"
                style={{ background: 'rgba(242,139,130,0.05)', border: '1px dashed rgba(242,139,130,0.3)' }}>
                <span className="font-mono text-base font-black tracking-widest" style={{ color: '#f28b82' }}>
                  {CONFIRM_PHRASE}
                </span>
              </div>

              <input
                ref={inputRef}
                type="text"
                value={typedText}
                onChange={e => setTypedText(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter' && isMatch) handleConfirm(); }}
                placeholder="Type here..."
                className="w-full rounded-2xl px-4 py-3.5 text-[13px] font-mono font-black text-white outline-none mb-6 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${typedText.length === 0 ? 'rgba(255,255,255,0.06)' : isMatch ? 'rgba(52,211,153,0.4)' : 'rgba(242,139,130,0.3)'}`,
                  color: isMatch ? '#34d399' : 'white',
                  caretColor: '#f28b82',
                  letterSpacing: '0.1em',
                }}
              />

              <div className="flex gap-3">
                <button onClick={() => { setStep('warn'); setTypedText(''); }}
                  className="flex-1 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider text-gray-400 transition-all hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <i className="fa-solid fa-arrow-left mr-2 text-[10px]" />
                  Back
                </button>
                <button onClick={handleConfirm} disabled={!isMatch}
                  className="flex-1 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider text-white transition-all active:scale-95"
                  style={{
                    background: isMatch ? 'linear-gradient(135deg, #c0392b, #f28b82)' : 'rgba(255,255,255,0.04)',
                    border: isMatch ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    color: isMatch ? 'white' : '#444',
                    boxShadow: isMatch ? '0 4px 20px rgba(242,139,130,0.3)' : 'none',
                    cursor: isMatch ? 'pointer' : 'not-allowed',
                  }}>
                  <i className="fa-solid fa-trash-can mr-2 text-[10px]" />
                  Erase Now
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING */}
          {step === 'processing' && (
            <div className="py-8 flex flex-col items-center gap-5" style={{ animation: 'stepIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(242,139,130,0.1)', border: '1px solid rgba(242,139,130,0.2)' }}>
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: '#f28b82', borderTopColor: 'transparent' }} />
              </div>
              <div className="text-center">
                <p className="text-base font-black text-white mb-1">Clearing Data…</p>
                <p className="text-[11px] text-gray-500">Wiping transaction history from the cloud</p>
              </div>
            </div>
          )}

          {/* STEP 4: DONE */}
          {step === 'done' && (
            <div className="py-8 flex flex-col items-center gap-5" style={{ animation: 'stepIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <i className="fa-solid fa-check text-2xl" style={{ color: '#34d399' }} />
              </div>
              <div className="text-center">
                <p className="text-base font-black text-white mb-1">Fresh Start! 🎉</p>
                <p className="text-[11px] text-gray-500 max-w-[240px]">
                  All transaction data has been cleared. You're ready to start a new month!
                </p>
              </div>
              <button onClick={onClose}
                className="mt-2 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider text-white active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 4px 20px rgba(52,211,153,0.25)' }}>
                Let's Go!
              </button>
            </div>
          )}

        </div>

        <style>{`
          @keyframes freshModalIn {
            from { opacity: 0; transform: scale(0.94) translateY(16px); }
            to   { opacity: 1; transform: scale(1)    translateY(0);    }
          }
          @keyframes stepIn {
            from { opacity: 0; transform: translateX(12px); }
            to   { opacity: 1; transform: translateX(0);    }
          }
          @keyframes shimmerRed {
            0%   { background-position: 0% 0%;    }
            100% { background-position: 200% 0%;  }
          }
        `}</style>
      </div>
    </div>
  );
};

export default FreshStartModal;
