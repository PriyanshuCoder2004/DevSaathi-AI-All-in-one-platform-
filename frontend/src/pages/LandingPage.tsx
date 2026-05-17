import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  Search,
  MessageSquare,
  Code2,
  BrainCircuit
} from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { cn } from '../lib/utils';
import Button from '../components/ui/Button';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-primary/30">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border h-14">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 h-full">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="text-white font-bold text-base tracking-tight">DevSaathi AI</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it works', 'Pricing', 'Docs'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-text-secondary hover:text-white text-sm font-medium transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm" className="text-text-secondary hover:text-white">
                Login
              </Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button size="sm" className="gap-2">
                Get Started <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-24 pb-20 px-8 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-20 right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="max-w-xl">
            <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-white">
              Learn faster. <br />
              <span className="text-primary">Code smarter.</span> <br />
              Powered by AI.
            </h1>
            <p className="text-text-secondary text-lg mt-6 leading-relaxed max-w-md">
              Your personal AI tutor for technical concepts, code debugging, and documentation — built for India's engineering ecosystem.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-10">
              <Link to={ROUTES.REGISTER}>
                <button className="bg-primary hover:bg-primary-dark text-white px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2 shadow-xl shadow-primary/25 transition-all active:scale-95">
                  Get Started Free <ArrowRight size={18} />
                </button>
              </Link>
              <button className="bg-bg-elevated border border-border hover:border-border-light text-text-secondary hover:text-white px-7 py-3.5 rounded-xl font-semibold transition-all active:scale-95">
                View Demo
              </button>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {['AD', 'RK', 'SN'].map((initials, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 border-bg-primary flex items-center justify-center text-[10px] font-bold text-white",
                      i === 0 ? "bg-accent" : i === 1 ? "bg-primary" : "bg-success"
                    )}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-text-muted text-sm">
                Joined by <span className="text-white font-medium">10,000+ developers</span> in India
              </p>
            </div>
          </div>

          {/* Code Mockup */}
          <div className="relative w-full lg:w-[540px]">
            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl -z-10" />
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500">
              {/* Editor Title Bar */}
              <div className="h-10 bg-bg-secondary flex items-center px-4 gap-1.5 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-error/40" />
                <div className="w-3 h-3 rounded-full bg-warning/40" />
                <div className="w-3 h-3 rounded-full bg-success/40" />
                <div className="ml-4 text-[11px] text-text-muted font-mono">auth.service.ts — DevSaathi</div>
              </div>
              {/* Fake Code Content */}
              <div className="p-6 font-mono text-[13px] leading-relaxed overflow-x-auto whitespace-pre">
                <div className="flex gap-4">
                  <span className="text-text-muted select-none">1</span>
                  <span><span className="text-primary">import</span> &#123; <span className="text-accent">Amplify</span> &#125; <span className="text-primary">from</span> <span className="text-success">'aws-amplify'</span>;</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-muted select-none">2</span>
                  <span><span className="text-primary">import</span> &#123; <span className="text-accent">signIn</span> &#125; <span className="text-primary">from</span> <span className="text-success">'aws-amplify/auth'</span>;</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-muted select-none">3</span>
                  <span />
                </div>
                <div className="flex gap-4">
                  <span className="text-text-muted select-none">4</span>
                  <span><span className="text-primary">export const</span> <span className="text-accent">login</span> = <span className="text-primary">async</span> (email, password) =&gt; &#123;</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-muted select-none">5</span>
                  <span>  <span className="text-primary">try</span> &#123;</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-muted select-none">6</span>
                  <span>    <span className="text-primary">const</span> result = <span className="text-primary">await</span> <span className="text-warning">signIn</span>(&#123; email, password &#125;);</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-muted select-none">7</span>
                  <span>    <span className="text-primary">return</span> result;</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-muted select-none">8</span>
                  <span>  &#125; <span className="text-primary">catch</span> (err) &#123;</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-muted select-none">9</span>
                  <span className="text-error">    console.error('Auth failed', err);</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-muted select-none">10</span>
                  <span>  &#125;</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-muted select-none">11</span>
                  <span>&#125;;</span>
                </div>
              </div>
              {/* AI Insight Overlay */}
              <div className="m-4 mt-0 bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                <div className="w-8 h-8 rounded-lg bg-primary flex-shrink-0 flex items-center justify-center">
                  <BrainCircuit size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-[11px] text-primary font-bold uppercase tracking-wider">DevSaathi AI Insight</p>
                  <p className="text-[12px] text-white/90 mt-0.5">Using Amplify v6? The `signIn` function now expects a named object instead of positional arguments.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Precision tools for modern engineering</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">Reduce cognitive load and ship faster with our suite of AI-native developer tools.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-bg-card border border-border rounded-2xl p-8 hover:border-primary transition-all duration-300 group">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Search className="text-primary" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI Topic Tutor</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Personalized learning paths for any technology. From React to Rust, get complex concepts explained simply.
            </p>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-8 hover:border-primary transition-all duration-300 group">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Code2 className="text-primary" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Code Analyzer</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Instant debugging and performance analysis. Identify bottlenecks and security vulnerabilities before you commit.
            </p>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-8 hover:border-primary transition-all duration-300 group">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="text-primary" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Smart Quiz</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Adaptive testing to validate your expertise. AI-generated questions based on your specific learning gaps.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-bg-secondary relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 relative">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">Go from a technical problem to a solution in seconds.</p>
          </div>

          <div className="flex flex-col md:flex-row items-start justify-between gap-12 relative">
            {/* Dashed Connector Line */}
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] border-t-2 border-dashed border-border -z-0" />

            <div className="flex-1 flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-bg-elevated border border-border flex items-center justify-center mb-6 shadow-xl">
                <span className="text-primary font-bold text-xl">1</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-3">Connect Knowledge</h4>
              <p className="text-text-secondary text-sm leading-relaxed">
                Upload documentation, share GitHub repos, or simply paste a snippet you're struggling with.
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-bg-elevated border border-border flex items-center justify-center mb-6 shadow-xl">
                <span className="text-primary font-bold text-xl">2</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-3">AI Processing</h4>
              <p className="text-text-secondary text-sm leading-relaxed">
                Our specialized models parse your input using deep contextual understanding of your codebase.
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-bg-elevated border border-border flex items-center justify-center mb-6 shadow-xl">
                <span className="text-primary font-bold text-xl">3</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-3">Instant Guidance</h4>
              <p className="text-text-secondary text-sm leading-relaxed">
                Receive interactive explanations, bug fixes, or generated quizzes to master the material.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BENTO GRID */}
      <section className="py-24 px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* LEFT CARD: Core Experience */}
          <div className="md:col-span-7 bg-[#0D1626]/50 border border-border/40 rounded-3xl overflow-hidden relative group h-[480px] flex flex-col p-10">
            <div className="relative z-10">
              <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-4">
                Core Experience
              </p>
              <h3 className="text-3xl font-bold text-white mb-6 tracking-tight">
                Deep Technical Context
              </h3>
              <p className="text-text-secondary leading-relaxed text-sm max-w-sm">
                Unlike generic AI, DevSaathi understands the nuances of modern engineering stacks and Indian developer ecosystems.
              </p>
            </div>

            {/* Mesh Image at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[240px] pointer-events-none">
              <img
                src="/assets/mesh.png"
                alt="Technical Mesh"
                className="w-full h-full object-cover opacity-60 mix-blend-screen"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-transparent to-transparent" />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="md:col-span-5 flex flex-col gap-6">

            {/* TOP RIGHT: Performance Card */}
            <div className="bg-primary rounded-3xl p-10 h-[220px] flex flex-col justify-center relative group overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  Built for Performance
                </h3>
                <p className="text-white/80 text-sm max-w-[200px] leading-relaxed">
                  Optimized latency for real-time coding sessions.
                </p>
              </div>
              <Zap
                className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 transition-all duration-500 group-hover:scale-110"
                size={80}
                strokeWidth={1.5}
              />

              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -z-0 rounded-full group-hover:bg-white/20 transition-all" />
            </div>

            {/* BOTTOM TWO STATS */}
            <div className="grid grid-cols-2 gap-6 h-[234px]">
              <div className="bg-[#1A2333]/40 border border-border/40 rounded-3xl flex flex-col items-center justify-center text-center p-6 hover:bg-[#1E2D42]/60 transition-colors cursor-default">
                <p className="text-4xl font-bold text-white mb-1">99.9%</p>
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.15em]">Uptime</p>
              </div>

              <div className="bg-[#1A2333]/40 border border-border/40 rounded-3xl flex flex-col items-center justify-center text-center p-6 hover:bg-[#1E2D42]/60 transition-colors cursor-default">
                <p className="text-4xl font-bold text-white mb-1">40%</p>
                <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.15em]">Faster Shipping</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-8 max-w-7xl mx-auto border-t border-border/50">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-white mb-10">Trusted by developers at India's top tech companies</h2>
          <div className="flex flex-wrap justify-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {['Flipkart', 'Zomato', 'Paytm', 'Swiggy', 'Razorpay'].map(brand => (
              <span key={brand} className="text-xl font-bold text-white font-mono tracking-tighter">{brand}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "DevSaathi has halved our onboarding time for junior engineers. The AI Topic Tutor explains our proprietary architecture as if it were a senior dev sitting right next to them.",
              name: "Priyanshu Arya",
              role: "Senior Engineering Manager, Bangalore",
              initials: "PA"
            },
            {
              quote: "The Code Analyzer is spooky good. It caught a race condition in our payment gateway logic that four manual reviews missed. It's now a mandatory part of our CI/CD pipeline.",
              name: "Archy Gupta",
              role: "Lead Architect, Tech Unicorn",
              initials: "AG"
            },
            {
              quote: "Finally, an AI that understands the way we actually code in India. The context-aware documentation parsing is a lifesaver when working with legacy internal APIs.",
              name: "Shikha Nagar",
              role: "Full Stack Developer, Mumbai",
              initials: "SN"
            }
          ].map((testimonial, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-2xl p-8 flex flex-col h-full">
              <div className="flex-1">
                <p className="text-text-secondary italic text-sm leading-relaxed">
                  "{testimonial.quote}"
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{testimonial.name}</p>
                  <p className="text-text-muted text-[10px] uppercase tracking-wide">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-24 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-5">Ready to upgrade your development workflow?</h2>
          <p className="text-text-secondary text-lg mb-10">
            Join thousands of developers building the future of software with DevSaathi AI. No credit card required.
          </p>
          <Link to={ROUTES.REGISTER}>
            <button className="bg-primary hover:bg-primary-dark text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1 active:translate-y-0">
              Create Free Account
            </button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">D</span>
            </div>
            <span className="text-white font-bold text-sm">DevSaathi AI</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {['Privacy Policy', 'Terms of Service', 'Status', 'Contact'].map(link => (
              <a key={link} href="#" className="text-text-muted hover:text-white text-sm transition-colors">{link}</a>
            ))}
          </div>

          <div className="text-text-muted text-sm">
            © 2026 DevSaathi AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
