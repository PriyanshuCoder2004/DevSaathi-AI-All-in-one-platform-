import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronLeft, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { cn } from '../lib/utils';
import Button from '../components/ui/Button';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword } = useAuth();
  
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password strength logic
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (newPassword.length >= 1) strength = 1;
    if (newPassword.length >= 8) strength = 2;
    if (newPassword.length >= 8 && /[0-9]/.test(newPassword)) strength = 3;
    if (newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[A-Z]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)) strength = 4;
    setPasswordStrength(strength);
  }, [newPassword]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setStep('reset');
    } catch (error) {
      console.error('Forgot password failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    
    setIsLoading(true);
    try {
      await resetPassword(email, otp.join(''), newPassword);
      navigate(ROUTES.LOGIN, { state: { reset: true } });
    } catch (error) {
      console.error('Reset password failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col relative overflow-hidden">
      {/* Premium Code Floating Background */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[12%] right-[10%] opacity-[0.02] font-mono text-[11px] text-white rotate-[10deg] whitespace-pre">
          {`async function resetPwd(token: string) {\n  const isValid = await auth.verify(token);\n  return isValid;\n}`}
        </div>
        <div className="absolute top-[28%] left-[6%] opacity-[0.03] font-mono text-[13px] text-primary rotate-[-8deg] whitespace-pre">
          {`type ResetState = \n  | 'INIT'\n  | 'SENT'\n  | 'RESETTING'\n  | 'DONE';`}
        </div>
        <div className="absolute bottom-[18%] right-[15%] opacity-[0.03] font-mono text-[10px] text-primary rotate-[15deg] whitespace-pre">
          {`const securityConfig = {\n  saltRounds: 12,\n  algo: 'argon2id'\n};`}
        </div>
      </div>
      {/* HEADER */}
      <header className="fixed top-0 w-full h-14 border-b border-border/40 bg-[#0A0F1E]/80 backdrop-blur-md flex items-center px-8 z-50">
        <Link to={ROUTES.LOGIN} className="flex items-center gap-2 group">
          <ChevronLeft size={18} className="text-text-muted group-hover:text-white transition-colors" />
          <span className="text-text-muted text-sm group-hover:text-white transition-colors">Back to login</span>
        </Link>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex flex-col items-center justify-center pt-14 px-4">
        <div className="w-full max-w-md bg-[#0D1626] border border-border/40 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[60px] rounded-full" />
          
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <Lock size={28} className="text-white" />
          </div>

          <h2 className="text-white text-2xl font-bold text-center mt-6">
            {step === 'email' ? 'Forgot your password?' : 'Reset your password'}
          </h2>
          <p className="text-text-secondary text-sm text-center mt-2 leading-relaxed px-4">
            {step === 'email' 
              ? 'Enter your email to receive a reset code.' 
              : 'Enter your new password below to regain access to your workspace.'}
          </p>

          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="mt-10 space-y-6">
              <div className="space-y-2">
                <label className="text-text-muted text-[11px] font-black uppercase tracking-[0.2em] ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-text-muted group-focus-within:text-primary transition-colors" />
                  </div>
                  <input 
                    type="email"
                    placeholder="name@company.com"
                    className="w-full bg-[#1A2333]/50 border border-border/40 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-text-muted outline-none focus:border-primary transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full py-4 rounded-xl font-bold" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
              <div className="flex gap-2.5 justify-center">
                {otp.map((digit, i) => (
                  <input 
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 bg-[#1A2333]/50 border border-border/40 rounded-xl text-center text-white text-xl font-bold outline-none focus:border-primary transition-all"
                  />
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-text-muted text-[11px] font-black uppercase tracking-[0.2em] ml-1">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-text-muted group-focus-within:text-primary transition-colors" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-[#1A2333]/50 border border-border/40 rounded-2xl pl-11 pr-12 py-3.5 text-white placeholder-text-muted outline-none focus:border-primary transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
                
                {/* Strength Bar */}
                <div className="flex gap-1.5 mt-3">
                  {[1, 2, 3, 4].map((seg) => (
                    <div 
                      key={seg}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all duration-500",
                        seg <= passwordStrength 
                          ? passwordStrength === 1 ? "bg-error" : passwordStrength === 2 ? "bg-warning" : "bg-primary"
                          : "bg-[#1A2333]"
                      )}
                    />
                  ))}
                </div>
                {passwordStrength === 4 && <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">Strength: Secure enough</p>}
              </div>

              <div className="space-y-2">
                <label className="text-text-muted text-[11px] font-black uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#1A2333]/50 border border-border/40 rounded-2xl px-4 py-3.5 text-white placeholder-text-muted outline-none focus:border-primary transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full py-4 rounded-xl font-bold" disabled={isLoading || newPassword !== confirmPassword || otp.join('').length !== 6}>
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}

          {/* AI tip */}
          <div className="bg-[#1A2333]/30 border border-border/30 rounded-2xl p-5 mt-10 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-primary" />
            </div>
            <p className="text-text-secondary text-[13px] leading-relaxed">
              Don't worry, even senior devs forget passwords. Let's get you back to building.
            </p>
          </div>
        </div>

        <Link to={ROUTES.LOGIN} className="text-primary font-bold text-sm mt-8 hover:underline">Back to login</Link>
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

export default ResetPasswordPage;
