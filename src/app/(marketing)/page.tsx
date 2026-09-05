'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Zap, Shield, Code2, Rocket, Brain, CheckCircle2, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';

const EXAMPLE_IDEAS = [
  'A task management app for remote teams with time tracking and AI-powered sprint planning',
  'A marketplace for local chefs to sell meal prep subscriptions with delivery scheduling',
  'A fitness coaching platform with video workouts, progress tracking, and Stripe payments',
  'A customer support dashboard with AI ticket routing and Slack integration',
];

export default function LandingPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!idea.trim()) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push('/login?redirect=/');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });
      if (res.status === 401) {
        router.push('/login?redirect=/');
        return;
      }
      const data = await res.json();
      if (data.projectId) {
        router.push(`/dashboard/${data.projectId}`);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-black to-black" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">AppForge</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            {user ? (
              <>
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={async () => { await signOut(); router.push('/'); }}>
                  <LogOut className="w-3 h-3" /> Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                  Sign in
                </Button>
                <Button variant="gradient" size="sm" onClick={() => router.push('/signup')}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
          <Badge variant="info" className="mb-6">
            <Zap className="w-3 h-3 mr-1" /> AI-Powered App Factory
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Describe your app.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              We build it for you.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            One prompt in. A team of AI agents builds your full application —
            frontend, backend, database, tests, deployment, docs. Marketplace-ready.
          </p>

          {/* Idea Input */}
          <Card className="max-w-2xl mx-auto border-white/10">
            <CardContent className="p-6">
              <Textarea
                placeholder="Describe the app you want to build... Be as detailed or as simple as you like. The AI team handles the rest."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="min-h-[140px] text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmit();
                  }
                }}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-white/40">
                  {idea.length} chars · Press ⌘+Enter to submit
                </span>
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!idea.trim() || loading}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⚡</span> Building...
                    </>
                  ) : (
                    <>
                      Build My App <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Example ideas */}
          <div className="mt-8">
            <p className="text-sm text-white/40 mb-3">Or try one of these:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLE_IDEAS.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setIdea(ex)}
                  className="text-xs text-white/50 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30 hover:text-white/80 transition-all"
                >
                  {ex.slice(0, 60)}...
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Brain, title: '1. PM Agent', desc: 'Analyzes your idea, writes specs, user stories, and a project plan' },
              { icon: Code2, title: '2. Build Agents', desc: 'Frontend, backend, and database agents generate code in parallel' },
              { icon: Shield, title: '3. Test & Audit', desc: 'Testing agent runs tests, compliance agent checks security and legal' },
              { icon: Rocket, title: '4. Deploy', desc: 'DevOps agent deploys to production, docs agent writes documentation' },
            ].map((step, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-6 h-6 text-fuchsia-400" />
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-white/50">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">What you get</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              'Full admin dashboard with user management',
              'Client-facing UI with responsive design',
              'Authentication with role-based access',
              'Database with migrations and seed data',
              'API routes with validation',
              'Unit, integration, and e2e tests',
              'CI/CD pipeline with auto-deployment',
              'Stripe payment integration',
              'GDPR, CCPA, WCAG compliance checks',
              'Self-healing: detects and fixes failures',
              'Complete documentation (README, API docs)',
              'Marketplace-ready packaging',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/70">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-white/40">
            <p>AppForge — AI-powered application factory. Built with Letta.</p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <a href="/terms" className="hover:text-white/60 transition">Terms of Service</a>
              <a href="/privacy" className="hover:text-white/60 transition">Privacy Policy</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
