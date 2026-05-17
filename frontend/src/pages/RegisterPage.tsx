import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { cn } from '../lib/utils';
import Button from '../components/ui/Button';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Password strength logic
  useEffect(() => {
    const password = formData.password;
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 1) strength = 1;
    if (password.length >= 8) strength = 2;
    if (password.length >= 8 && /[0-9]/.test(password)) strength = 3;
    if (password.length >= 8 && /[0-9]/.test(password) && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength = 4;

    setPasswordStrength(strength);
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return;

    setIsLoading(true);
    try {
      const { isSignUpComplete } = await register(formData.fullName, formData.email, formData.password);
      
      if (!isSignUpComplete) {
        navigate(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(formData.email)}`);
      } else {
        // If somehow already complete (unlikely for new user), go to login
        navigate(ROUTES.LOGIN, { state: { registered: true } });
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Handle the case where user already exists but might not be confirmed
      if (error.name === 'UsernameExistsException' || error.code === 'UsernameExistsException') {
        // Redirect to verify page so they can resend the code if needed
        navigate(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(formData.email)}`);
        return;
      }
      
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.fullName &&
    formData.email &&
    formData.password &&
    formData.password === formData.confirmPassword &&
    agreed;

  return (
    <div className="h-screen w-full flex overflow-hidden bg-bg-primary">
      {/* LEFT HALF */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1A2B5E] via-[#0D1A35] to-[#0A0F1E]">
        {/* Premium Blurred Code Background */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden p-12">
          <div className="absolute inset-0 opacity-[0.12] font-mono text-[11px] leading-relaxed whitespace-pre p-10 blur-[1px]">
            <div className="flex flex-col gap-8 scale-110">
              {[
                `import { Amplify } from 'aws-amplify';\nAmplify.configure({\n  Auth: { userPoolId: 'ap-south-1_...', ... }\n});`,
                `interface UserProfile {\n  id: string;\n  name: string;\n  email: string;\n  skills: Skill[];\n  progress: Progress;\n}`,
                `async function analyzeCode(source: string) {\n  const result = await ai.process(source);\n  return result.suggestions;\n}`,
                `const Dashboard = () => {\n  const { user } = useAuth();\n  return <Layout user={user} />;\n}`,
                `export const ROUTES = {\n  HOME: '/',\n  LOGIN: '/login',\n  LEARN: '/learn',\n  CODE: '/code'\n} as const;`,
                `type Progress = {\n  completed: number;\n  total: number;\n  lastAccessed: Date;\n};`,
                `function useDebounce<T>(value: T, delay: number): T {\n  const [val, setVal] = useState(value);\n  return val;\n}`,
                `const theme = {\n  colors: {\n    primary: '#4F46E5',\n    bg: '#0A0F1E',\n    text: '#FFFFFF'\n  }\n};`
              ].map((snippet, i) => (
                <div key={i} className={cn(
                  "transition-all duration-1000",
                  i % 2 === 0 ? "text-primary" : "text-white",
                  i % 3 === 0 ? "ml-0" : i % 3 === 1 ? "ml-12" : "ml-6"
                )}>
                  {snippet}
                </div>
              ))}
            </div>
          </div>

          {/* Decorative glows for that "premium" look */}
          <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Subtle gradient overlay to match the depth in screenshot */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-transparent to-transparent opacity-40" />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-16 h-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-base">D</span>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">DevSaathi AI</span>
          </div>

          <h1 className="text-white text-4xl font-bold leading-tight mt-12 max-w-sm">
            "Join 10,000+ developers learning smarter"
          </h1>

          <div className="mt-12 space-y-6">
            {[
              "AI-Powered Learning Paths",
              "Instant Code Feedback",
              "Smart Skill Assessment"
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-4">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-text-secondary text-base">{feature}</span>
              </div>
            ))}
          </div>

          <p className="text-text-muted text-sm mt-auto">
            Empowering the next generation of engineers.
          </p>
        </div>
      </div>

      {/* RIGHT HALF */}
      <div className="w-full lg:w-1/2 bg-[#0A0F1E] flex flex-col justify-between overflow-y-auto">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full p-8 lg:p-12">
          <h2 className="text-white text-3xl font-bold">Create your account</h2>
          <p className="text-text-secondary text-sm mt-2 mb-10">
            Get started with your technical journey today.
          </p>

          {error && (
            <div className="bg-error/10 border border-error/30 rounded-xl p-4 flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
              <p className="text-error text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-text-secondary text-sm mb-2 block font-medium">Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full bg-[#1A2333]/50 border border-border/50 rounded-xl px-4 py-3 text-white placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-text-secondary text-sm mb-2 block font-medium">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                className="w-full bg-[#1A2333]/50 border border-border/50 rounded-xl px-4 py-3 text-white placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-text-secondary text-sm font-medium">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-secondary text-xs flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full bg-[#1A2333]/50 border border-border/50 rounded-xl px-4 py-3 text-white placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />

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
            </div>

            <div>
              <label className="text-text-secondary text-sm mb-2 block font-medium">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className={cn(
                  "w-full bg-[#1A2333]/50 border border-border/50 rounded-xl px-4 py-3 text-white placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all",
                  formData.confirmPassword && formData.password !== formData.confirmPassword && "border-error/50"
                )}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-error text-xs mt-2">Passwords don't match</p>
              )}
            </div>

            <div className="flex items-start gap-3 py-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 rounded border-border bg-bg-input text-primary focus:ring-primary"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="terms" className="text-text-secondary text-sm leading-tight">
                I agree to <span className="text-primary cursor-pointer hover:underline">Terms of Service</span> and <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full py-4 rounded-xl font-bold mt-2 shadow-lg shadow-primary/20"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-text-muted text-xs uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border/40" />
          </div>

          <button className="w-full border border-border/60 bg-transparent py-3.5 rounded-xl text-white font-medium flex items-center justify-center gap-3 hover:bg-white/5 transition-all active:scale-[0.98]">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="text-text-secondary text-sm text-center mt-8">
            Already have an account? <Link to={ROUTES.LOGIN} className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </div>

        <footer className="border-t border-border/40 p-6 lg:px-12 flex justify-between items-center bg-[#0A0F1E]">
          <span className="text-white text-sm font-bold">DevSaathi AI</span>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Security', 'Status'].map(link => (
              <span key={link} className="text-text-muted text-[11px] cursor-pointer hover:text-white transition-colors">{link}</span>
            ))}
            <span className="text-text-muted text-[11px] ml-4">© 2024 DevSaathi AI. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default RegisterPage;
