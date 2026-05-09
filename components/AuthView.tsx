
import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, resetPassword } from '../services/firebase';

const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (isPasswordReset) {
      if (!email) { setError("Please provide your username or email."); return; }
      setLoading(true);
      try {
        await resetPassword(email);
        setMessage("Password reset link sent! Please check your Inbox (and Spam).");
        setTimeout(() => { 
          setIsPasswordReset(false); 
          setIsLogin(true); 
          setMessage('');
        }, 6000);
      } catch (err: any) {
        setError(err.message || "Failed to initiate reset.");
      } finally { setLoading(false); }
      return;
    }

    if (!isLogin && password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (!isLogin && !username) { setError("Username is required for institutional onboarding."); return; }
    
    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(email, password); // email here is the identifier (email or username)
      } else {
        // Set flag to prevent App.tsx from flashing dashboard
        sessionStorage.setItem('vibhav_registering', 'true');
        
        await registerUser(email, password, username);
        
        // Clear flag after registration is complete
        sessionStorage.removeItem('vibhav_registering');
        
        setMessage("Account successfully created! Please log in.");
        setTimeout(() => {
          setIsLogin(true);
          setEmail('');
          setUsername('');
          setPassword('');
          setConfirmPassword('');
        }, 1500); // Small wait to show the message
      }
    } catch (err: any) {
      sessionStorage.removeItem('vibhav_registering'); // Clean up on error
      let msg = err.message || "Authentication failed.";
      if (msg.includes("auth/email-already-in-use")) msg = "Identifier already registered.";
      if (msg.includes("auth/invalid-credential")) msg = "Invalid credentials.";
      if (msg.includes("auth/user-not-found") || msg.includes("Username not found")) msg = "Stakeholder not found.";
      setError(msg);
    } finally { setLoading(false); }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsPasswordReset(false);
    setError('');
    setMessage('');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-x-hidden overflow-y-auto" style={{ background: 'var(--base)', fontFamily: "'Inter', sans-serif" }}>
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
              background: 'linear-gradient(135deg, var(--primary-deep), var(--secondary))',
              boxShadow: '0 10px 32px var(--primary-glow)',
            }}>
              <i className={`fa-solid ${isPasswordReset ? 'fa-key' : isLogin ? 'fa-fingerprint' : 'fa-user-plus'} text-white text-3xl transition-transform duration-500 group-hover:scale-110`}></i>
            </div>
            <div className="absolute -inset-4 rounded-full animate-pulse opacity-30" style={{ background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)' }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-white mb-2">
            {isPasswordReset ? 'Reset Password' : (isLogin ? 'VibhavWealth' : 'Sign Up')}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm font-medium tracking-wide">
            {isPasswordReset ? 'Enter your email to reset access' : (isLogin ? 'Manage your wealth' : 'Create your account')}
          </p>
        </div>

        <div className="rounded-[28px] p-6 sm:p-9 relative overflow-hidden" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
            background: isPasswordReset
              ? 'linear-gradient(90deg, transparent, var(--accent), transparent)'
              : isLogin
              ? 'linear-gradient(90deg, transparent, var(--primary-deep), var(--secondary), transparent)'
              : 'linear-gradient(90deg, transparent, var(--secondary), var(--primary-deep), transparent)',
            transition: 'background 0.5s ease',
          }} />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{isLogin && !isPasswordReset ? 'Email or Username' : 'Email'}</label>
              <div className="relative">
                <i className={`fa-solid ${isLogin && !isPasswordReset ? 'fa-id-card' : 'fa-envelope'} absolute left-4 top-1/2 -translate-y-1/2 text-gray-600`}></i>
                <input
                  type={isLogin && !isPasswordReset ? "text" : "email"} required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={isLogin && !isPasswordReset ? "Enter email or username" : "Enter your email"}
                  className="w-full pl-11 pr-4 py-3.5 sm:py-4 rounded-2xl text-sm text-white font-medium placeholder:text-gray-700 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#4285F4]/30"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>

            {!isLogin && !isPasswordReset && (
              <div className="space-y-1.5" style={{ animation: 'slideDown 0.3s ease-out' }}>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <i className="fa-solid fa-user-tag absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"></i>
                  <input
                    type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full pl-11 pr-4 py-3.5 sm:py-4 rounded-2xl text-sm text-white font-medium placeholder:text-gray-700 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#4285F4]/30"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>
              </div>
            )}

            {!isPasswordReset && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold"></i>
                  <input
                    type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 sm:py-4 rounded-2xl text-sm text-white font-medium placeholder:text-gray-700 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#4285F4]/30"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <div 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer select-none"
                    style={{ transition: 'none', transform: 'translateY(-50%)', filter: 'none', boxShadow: 'none' }}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'} text-sm`}></i>
                  </div>
                </div>
              </div>
            )}

            {!isLogin && !isPasswordReset && (
              <div className="space-y-1.5" style={{ animation: 'slideDown 0.3s ease-out' }}>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative">
                  <i className="fa-solid fa-shield-halved absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold"></i>
                  <input
                    type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 sm:py-4 rounded-2xl text-sm text-white font-medium placeholder:text-gray-700 outline-none transition-all duration-300 focus:ring-2 focus:ring-emerald-500/30"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <div 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer select-none"
                    style={{ transition: 'none', transform: 'translateY(-50%)', filter: 'none', boxShadow: 'none' }}
                  >
                    <i className={`fa-solid ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'} text-sm`}></i>
                  </div>
                </div>
              </div>
            )}

            {isLogin && !isPasswordReset && (
              <div className="text-right">
                <button type="button" onClick={() => setIsPasswordReset(true)}
                  className="text-[11px] font-semibold transition-colors"
                  style={{ color: 'var(--primary)' }}>
                  Forget Password?
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl text-sm" style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)' }}>
                <i className="fa-solid fa-triangle-exclamation text-red-400"></i>
                <span className="text-red-300 text-xs font-bold">{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-center gap-3 p-4 rounded-2xl text-sm" style={{ background: 'rgba(52,168,83,0.1)', border: '1px solid rgba(52,168,83,0.2)' }}>
                <i className="fa-solid fa-circle-check text-emerald-400"></i>
                <span className="text-emerald-300 text-xs font-bold">{message}</span>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-4 rounded-[14px] text-[12px] font-semibold text-white uppercase tracking-[0.12em] shine-hover active:scale-[0.98] transition-all"
              style={{
                background: isPasswordReset
                  ? 'linear-gradient(135deg, #e6ac05, #f5c842)'
                  : isLogin
                  ? 'var(--primary-deep)'
                  : 'linear-gradient(135deg, #2a9c4e, var(--secondary))',
                boxShadow: isLogin ? '0 4px 16px var(--primary-glow)' : 'none',
              }}
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
              ) : (
                <>{isPasswordReset ? 'Send Link' : (isLogin ? 'Login' : 'Sign Up')}<i className="fa-solid fa-chevron-right text-[10px] ml-2 opacity-60"></i></>
              )}
            </button>
          </form>

          <div className="mt-7 pt-5 text-center" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={isPasswordReset ? () => setIsPasswordReset(false) : toggleMode}
              className="text-[12px] font-medium transition-colors"
              style={{ color: 'var(--text-3)' }}
            >
              {isPasswordReset ? 'Back to ' : (isLogin ? "Don't have an account? " : 'Already have an account? ')}
              <span className="font-semibold" style={{ color: 'var(--primary)' }}>
                {isPasswordReset ? 'Login' : (isLogin ? 'Sign Up' : 'Login')}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-8" style={{ opacity: 0.4 }}>
          <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>
            <i className="fa-solid fa-shield-check" style={{ color: 'var(--primary)' }} /> Security
          </span>
          <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>
            <i className="fa-solid fa-satellite-dish" style={{ color: 'var(--secondary)' }} /> Sync
          </span>
          <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>
            <i className="fa-solid fa-microchip" style={{ color: 'var(--accent)' }} /> Engine
          </span>
        </div>
      </div>

      <style>{`
        .auth-orb { position: absolute; border-radius: 50%; filter: blur(100px); }
        .auth-orb-1 { width: 500px; height: 500px; top: -15%; left: -8%; background: radial-gradient(circle, rgba(59,116,224,0.14) 0%, transparent 70%); animation: orbFloat1 25s ease-in-out infinite; }
        .auth-orb-2 { width: 450px; height: 450px; bottom: -12%; right: -5%; background: radial-gradient(circle, rgba(94,203,138,0.12) 0%, transparent 70%); animation: orbFloat2 30s ease-in-out infinite; }
        .auth-orb-3 { width: 350px; height: 350px; top: 50%; left: 50%; transform: translate(-50%,-50%); background: radial-gradient(circle, rgba(232,104,94,0.07) 0%, transparent 70%); animation: orbFloat3 22s ease-in-out infinite; }
        .auth-orb-4 { width: 400px; height: 400px; top: 10%; right: 20%; background: radial-gradient(circle, rgba(245,200,66,0.06) 0%, transparent 70%); animation: orbFloat4 28s ease-in-out infinite; }
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
