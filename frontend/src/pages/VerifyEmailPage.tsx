import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, HelpCircle, Moon, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import Button from '../components/ui/Button';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerificationCode } = useAuth();
  
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer logic
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleInput = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;

    setIsLoading(true);
    try {
      await verifyEmail(email, code);
      navigate(ROUTES.LOGIN, { state: { verified: true } });
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !email) return;
    
    try {
      await resendVerificationCode(email);
      setTimer(60);
    } catch (error) {
      console.error('Failed to resend code:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col relative overflow-hidden">
      {/* Premium Code Floating Background */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[15%] left-[8%] opacity-[0.02] font-mono text-[11px] text-white rotate-[-12deg] whitespace-pre">
          {`function sendOTP(email: string) {\n  return mailer.send(email, template);\n}`}
        </div>
        <div className="absolute top-[25%] right-[5%] opacity-[0.03] font-mono text-[10px] text-primary rotate-[15deg] whitespace-pre">
          {`const schema = z.object({\n  code: z.string().length(6)\n});`}
        </div>
        <div className="absolute bottom-[20%] left-[12%] opacity-[0.03] font-mono text-[12px] text-primary rotate-[-5deg] whitespace-pre">
          {`export type VerificationStatus = \n  | 'PENDING'\n  | 'SUCCESS'\n  | 'EXPIRED';`}
        </div>
      </div>
      {/* MINIMAL HEADER */}
      <header className="fixed top-0 w-full h-14 border-b border-border/40 bg-[#0A0F1E]/80 backdrop-blur-md flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">D</span>
          </div>
          <span className="text-white font-bold text-sm">DevSaathi AI</span>
        </div>
        <div className="flex items-center gap-4 text-text-muted">
          <HelpCircle size={18} className="cursor-pointer hover:text-white transition-colors" />
          <Moon size={18} className="cursor-pointer hover:text-white transition-colors" />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col items-center justify-center pt-14 px-4">
        <div className="w-full max-w-md bg-[#0D1626] border border-border/40 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[60px] rounded-full" />
          
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <Mail size={28} className="text-white" />
          </div>

          <h2 className="text-white text-2xl font-bold text-center mt-6">Check your inbox</h2>
          <p className="text-text-secondary text-sm text-center mt-2 leading-relaxed">
            We sent a verification link to<br/>
            <span className="text-primary font-medium">{email || 'your email'}</span>
          </p>

          <div className="flex gap-3 justify-center mt-10">
            {otp.map((digit, i) => (
              <input 
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 bg-[#1A2333]/50 border border-border/40 rounded-xl text-center text-white text-xl font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            ))}
          </div>

          <Button 
            onClick={handleVerify}
            className="w-full py-4 rounded-xl font-bold mt-8 shadow-lg shadow-primary/20"
            disabled={otp.join('').length !== 6 || isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>

          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-text-secondary text-sm">Didn't receive the code?</p>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleResend}
                disabled={timer > 0}
                className={`text-sm font-bold transition-colors ${timer > 0 ? 'text-text-muted cursor-not-allowed' : 'text-primary hover:underline'}`}
              >
                Resend code
              </button>
              <div className="bg-[#1A2333] border border-border/40 rounded-full px-3 py-1 text-[11px] font-mono text-text-secondary">
                00:{timer < 10 ? `0${timer}` : timer}
              </div>
            </div>
          </div>

          {/* Pro tip card */}
          <div className="bg-[#1A2333]/30 border border-border/30 rounded-2xl p-5 mt-10 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-primary" />
            </div>
            <p className="text-text-secondary text-[13px] leading-relaxed">
              <span className="text-white font-medium block mb-0.5">Quick Tip</span>
              Our AI engine is waiting to help you build faster. Finish the setup to get started.
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full flex justify-between items-center px-8 py-6 bg-[#0A0F1E]">
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

export default VerifyEmailPage;
