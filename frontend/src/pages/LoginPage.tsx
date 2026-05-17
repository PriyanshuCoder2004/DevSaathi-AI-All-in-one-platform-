import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import Button from '../components/ui/Button';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.verified) {
      setSuccessMessage('Email verified! Please sign in.');
    } else if (location.state?.reset) {
      setSuccessMessage('Password updated successfully! Please sign in.');
    } else if (location.state?.registered) {
      setSuccessMessage('Registration successful! Your account has been automatically verified. Please sign in.');
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { isSignedIn, nextStep } = await login(email, password);
      
      if (isSignedIn) {
        navigate(ROUTES.DASHBOARD);
      } else if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        navigate(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col bg-[#0A0F1E] relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at top, #0D1A35 0%, #0A0F1E 70%)' }}
    >
      {/* Premium Code Floating Background */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[10%] left-[5%] opacity-[0.06] font-mono text-[12px] text-primary rotate-[-15deg] whitespace-pre">
          {`interface AuthState {\n  user: User | null;\n  loading: boolean;\n}`}
        </div>
        <div className="absolute top-[20%] right-[8%] opacity-[0.04] font-mono text-[11px] text-white rotate-[10deg] whitespace-pre">
          {`async function signIn(creds: Credentials) {\n  const session = await auth.login(creds);\n  return session;\n}`}
        </div>
        <div className="absolute bottom-[15%] left-[10%] opacity-[0.04] font-mono text-[13px] text-white rotate-[5deg] whitespace-pre">
          {`const config = {\n  apiKey: process.env.KEY,\n  region: 'us-east-1'\n};`}
        </div>
        <div className="absolute bottom-[25%] right-[12%] opacity-[0.06] font-mono text-[10px] text-primary rotate-[-8deg] whitespace-pre">
          {`export const theme = {\n  primary: '#4F46E5',\n  dark: '#0A0F1E'\n};`}
        </div>
      </div>
      {/* HEADER */}
      <header className="fixed top-0 w-full h-14 border-b border-border/40 bg-[#0A0F1E]/40 backdrop-blur-md flex items-center px-8 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">D</span>
          </div>
          <span className="text-white font-bold text-sm">DevSaathi AI</span>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex flex-col items-center justify-center pt-14 px-4">
        <div className="bg-gradient-to-br from-primary to-primary-dark w-16 h-16 rounded-[20px] flex items-center justify-center shadow-2xl shadow-primary/40 mb-8">
          <span className="text-white font-black text-3xl">D</span>
        </div>

        <h2 className="text-white text-3xl font-bold tracking-tight text-center">Welcome back</h2>
        <p className="text-text-secondary text-sm text-center mt-2 max-w-xs leading-relaxed">
          Continue your development journey with DevSaathi AI.
        </p>

        <div className="w-full max-w-[400px] bg-[#0D1626]/80 backdrop-blur-xl border border-border/40 rounded-3xl p-8 mt-10 shadow-2xl">
          {successMessage && (
            <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <p className="text-success text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="bg-error/10 border border-error/30 rounded-xl p-4 flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle size={18} className="text-error" />
              <p className="text-error text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-text-muted text-[11px] font-black uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-text-muted group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-[#1A2333]/50 border border-border/40 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-text-muted text-[11px] font-black uppercase tracking-[0.2em]">Password</label>
                <Link to={ROUTES.RESET_PASSWORD} className="text-text-secondary text-[11px] font-bold hover:text-white transition-colors uppercase tracking-widest">Forgot password?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-text-muted group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-[#1A2333]/50 border border-border/40 rounded-2xl pl-11 pr-12 py-3.5 text-white placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-4 rounded-2xl font-black text-base mt-2 shadow-xl shadow-primary/30 group"
              disabled={isLoading}
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading ? 'Signing In...' : 'Sign In'}
                {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </div>
            </Button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-text-muted text-[10px] font-black uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border/40" />
          </div>

          <button className="w-full border border-border/60 bg-[#1A2333]/30 py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-3 hover:bg-[#1A2333]/60 transition-all active:scale-[0.98]">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-text-secondary text-sm text-center mt-10">
          Don't have an account? <Link to={ROUTES.REGISTER} className="text-primary font-black hover:underline tracking-tight ml-1">Sign up for free</Link>
        </p>
      </main>

      {/* FOOTER */}
      <footer className="w-full flex justify-between items-center px-8 py-8 bg-[#0A0F1E]">
        <span className="text-text-muted text-[11px]">© 2024 DevSaathi AI. All rights reserved.</span>
        <div className="flex gap-6">
          {['Privacy Policy', 'Terms of Service', 'Status'].map(l => (
            <span key={l} className="text-text-muted text-[11px] cursor-pointer hover:text-white transition-colors">{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
