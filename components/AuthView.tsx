
import React, { useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/firebase';

const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isLogin && password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      if (isLogin) await loginUser(email, password);
      else await registerUser(email, password);
    } catch (err: any) {
      let msg = err.message || "Authentication failed.";
      if (msg.includes("auth/email-already-in-use")) msg = "Already registered.";
      if (msg.includes("auth/invalid-credential")) msg = "Invalid credentials.";
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-x-hidden overflow-y-auto selection:bg-[#4285F4]/30" style={{ background: '#0a0f1a' }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-orb auth-orb-4" />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(66,133,244,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(66,133,244,0.3) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          animation: 'gridPan 30s linear infinite',
        }} />
      </div>

      <div className={`w-full max-w-[420px] relative z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] flex items-center justify-center mx-auto relative group shine-hover overflow-hidden" style={{
              background: 'linear-gradient(135deg, #4285F4, #34A853)',
              boxShadow: '0 12px 40px rgba(66,133,244,0.4), 0 0 100px rgba(66,133,244,0.1)',
            }}>
              <i className={`fa-solid ${isLogin ? 'fa-fingerprint' : 'fa-user-plus'} text-white text-3xl transition-transform duration-500 group-hover:scale-110`}></i>
            </div>
            <div className="absolute -inset-4 rounded-full animate-pulse opacity-40" style={{ background: 'radial-gradient(circle, rgba(66,133,244,0.2) 0%, transparent 70%)' }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-white mb-2">
            {isLogin ? 'VibhavWealth' : 'Join Legacy'}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm font-medium tracking-wide">
            {isLogin ? 'Intelligent Wealth Architecture' : 'Begin your institutional financial journey'}
          </p>
        </div>

        <div className="glass rounded-[32px] p-6 sm:p-10 relative overflow-hidden" style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
            background: isLogin
              ? 'linear-gradient(90deg, transparent, #4285F4, #34A853, transparent)'
              : 'linear-gradient(90deg, transparent, #34A853, #4285F4, transparent)',
            transition: 'background 0.5s ease',
          }} />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Account Identifier</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"></i>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.com"
                  className="w-full pl-11 pr-4 py-3.5 sm:py-4 rounded-2xl text-sm text-white font-medium placeholder:text-gray-700 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#4285F4]/30"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Access Credentials</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"></i>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 sm:py-4 rounded-2xl text-sm text-white font-medium placeholder:text-gray-700 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#4285F4]/30"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5" style={{ animation: 'slideDown 0.3s ease-out' }}>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm Integrity</label>
                <div className="relative">
                  <i className="fa-solid fa-shield-halved absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"></i>
                  <input
                    type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 sm:py-4 rounded-2xl text-sm text-white font-medium placeholder:text-gray-700 outline-none transition-all duration-300 focus:ring-2 focus:ring-emerald-500/30"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl text-sm" style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)' }}>
                <i className="fa-solid fa-triangle-exclamation text-red-400"></i>
                <span className="text-red-300 text-xs font-bold">{error}</span>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-4 sm:py-4.5 rounded-2xl text-[11px] font-bold text-white uppercase tracking-[0.2em] shine-hover btn-primary-glow shadow-xl active:scale-[0.98]"
              style={{
                background: isLogin
                  ? 'linear-gradient(135deg, #4285F4, #3b78e7)'
                  : 'linear-gradient(135deg, #34A853, #2d9249)',
              }}
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
              ) : (
                <>{isLogin ? 'Authenticate' : 'Initialize Account'}<i className="fa-solid fa-chevron-right text-[10px] ml-2 opacity-60"></i></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-gray-500 hover:text-white text-xs font-medium transition-colors"
            >
              {isLogin ? "Institutional new user? " : "Existing stakeholder? "}
              <span className="text-[#4285F4] font-bold">{isLogin ? 'Onboard' : 'Sign in'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-10 text-gray-600 text-[10px] font-bold uppercase tracking-widest opacity-60">
          <span className="flex items-center gap-2"><i className="fa-solid fa-shield-check text-[#4285F4]"></i> AES-256</span>
          <span className="flex items-center gap-2"><i className="fa-solid fa-satellite-dish text-[#34A853]"></i> Sync</span>
          <span className="flex items-center gap-2"><i className="fa-solid fa-microchip text-[#FBBC04]"></i> Engine</span>
        </div>
      </div>

      <style>{`
        .auth-orb { position: absolute; border-radius: 50%; filter: blur(100px); }
        .auth-orb-1 { width: 600px; height: 600px; top: -20%; left: -10%; background: radial-gradient(circle, rgba(66,133,244,0.18) 0%, transparent 70%); animation: orbFloat1 25s ease-in-out infinite; }
        .auth-orb-2 { width: 500px; height: 500px; bottom: -15%; right: -5%; background: radial-gradient(circle, rgba(52,168,83,0.15) 0%, transparent 70%); animation: orbFloat2 30s ease-in-out infinite; }
        .auth-orb-3 { width: 400px; height: 400px; top: 50%; left: 50%; transform: translate(-50%,-50%); background: radial-gradient(circle, rgba(234,67,53,0.1) 0%, transparent 70%); animation: orbFloat3 22s ease-in-out infinite; }
        .auth-orb-4 { width: 450px; height: 450px; top: 10%; right: 20%; background: radial-gradient(circle, rgba(251,188,4,0.08) 0%, transparent 70%); animation: orbFloat4 28s ease-in-out infinite; }
        @keyframes orbFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(80px,50px) scale(1.1); } 66% { transform: translate(-40px,80px) scale(0.9); } }
        @keyframes orbFloat2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-60px,-40px) scale(1.2); } }
        @keyframes orbFloat3 { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-45%,-55%) scale(1.25); } }
        @keyframes orbFloat4 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,60px) scale(0.85); } }
        @keyframes gridPan { 0% { transform: translate(0,0); } 100% { transform: translate(80px,80px); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

export default AuthView;
