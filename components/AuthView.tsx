
import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/firebase';

const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
      }
    } catch (err: any) {
      let msg = err.message || "Authentication failed.";
      if (msg.includes("auth/email-already-in-use")) msg = "This email is already in use.";
      if (msg.includes("auth/invalid-credential")) msg = "Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md animate-page-enter">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#d4af37] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl transition-all">
            <i className={`fa-solid ${isLogin ? 'fa-lock' : 'fa-user-plus'} text-[#0a0a0b] text-2xl`}></i>
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight text-white mb-2 uppercase">
            {isLogin ? 'Login' : 'Sign Up'}<span className="text-[#d4af37]">.</span>
          </h1>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.5em]">
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </p>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-2xl">
          <div className={`absolute top-0 left-0 w-full h-1 transition-colors duration-500 ${isLogin ? 'bg-[#d4af37]/40' : 'bg-emerald-500/40'}`}></div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">User ID (Email)</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full px-5 py-4 bg-zinc-950 border border-white/10 rounded-2xl text-white font-bold text-sm focus:border-[#d4af37]/50 outline-none transition-all placeholder:text-zinc-800"
              />
            </div>
            
            <div>
              <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Password</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-zinc-950 border border-white/10 rounded-2xl text-white font-bold text-sm focus:border-[#d4af37]/50 outline-none transition-all placeholder:text-zinc-800"
              />
            </div>

            {!isLogin && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Confirm Password</label>
                <input 
                  type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-zinc-950 border border-white/10 rounded-2xl text-white font-bold text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-800"
                />
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" disabled={loading}
              className={`w-full py-4 font-black rounded-2xl text-[11px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 ${isLogin ? 'bg-[#d4af37] text-[#0a0a0b]' : 'bg-emerald-500 text-white'}`}
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch animate-spin"></i>
              ) : (
                <>{isLogin ? 'LOGIN' : 'CREATE ACCOUNT'}</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
        
        <p className="text-center mt-10 text-[8px] font-black text-zinc-800 uppercase tracking-[0.4em]">
          Secure Cloud Storage • Real-time Sync
        </p>
      </div>
    </div>
  );
};

export default AuthView;
