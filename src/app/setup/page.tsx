'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Key, Shield, CheckCircle, Copy, ExternalLink,
  ChevronDown, ChevronUp, Lock, Eye, EyeOff, AlertTriangle,
  Database, Zap, Cloud, ArrowRight, Terminal, BookOpen
} from 'lucide-react';

interface ApiKeyGuide {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  steps: string[];
  url: string;
  urlLabel: string;
  envVarName: string;
  example: string;
  warning?: string;
}

const guides: ApiKeyGuide[] = [
  {
    name: 'AI Provider (Telnyx)',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-violet-500 to-fuchsia-500',
    description: 'Powers the AI agents that build your app. Required for the pipeline to work.',
    steps: [
      'Go to telnyx.com and create a free account',
      'Navigate to API Keys in the dashboard',
      'Click "Create API Key"',
      'Copy the key — you will only see it once',
      'Paste it as TELNYX_API_KEY in your environment variables',
    ],
    url: 'https://telnyx.com',
    urlLabel: 'Get Telnyx API Key',
    envVarName: 'TELNYX_API_KEY',
    example: 'KEY019A2B3C...',
    warning: 'Never share this key publicly. It has full access to your AI account.',
  },
  {
    name: 'Database (Supabase)',
    icon: <Database className="w-5 h-5" />,
    color: 'from-emerald-500 to-teal-500',
    description: 'Stores your projects, user accounts, and app data. Three keys needed.',
    steps: [
      'Go to supabase.com and create a free account',
      'Click "New Project" — pick a name and password',
      'Wait for the project to provision (takes about 2 minutes)',
      'Go to Settings → API',
      'Copy the "Project URL" — that\'s your NEXT_PUBLIC_SUPABASE_URL',
      'Copy the "Publishable key" — that\'s your NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'Copy the "Secret key" — that\'s your SUPABASE_SERVICE_ROLE_KEY',
      'Add all three to your environment variables',
    ],
    url: 'https://supabase.com',
    urlLabel: 'Get Supabase Keys',
    envVarName: 'NEXT_PUBLIC_SUPABASE_URL',
    example: 'https://abcdefgh.supabase.co',
    warning: 'The secret key bypasses security rules. Never expose it in client-side code.',
  },
  {
    name: 'Deployment (Vercel)',
    icon: <Cloud className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-500',
    description: 'Hosts your generated app on the web. Optional but recommended.',
    steps: [
      'Go to vercel.com and sign up with GitHub',
      'Click "Add New Project" and import your repo',
      'Vercel auto-detects Next.js and configures the build',
      'Add your environment variables in Settings → Environment Variables',
      'Click Deploy — your app goes live on a .vercel.app URL',
    ],
    url: 'https://vercel.com',
    urlLabel: 'Deploy on Vercel',
    envVarName: 'VERCEL_TOKEN',
    example: 'vcp_xxxxxxxxxxxx',
    warning: 'You can also deploy to Netlify, Railway, or any Node.js host.',
  },
];

const securityTips = [
  {
    icon: <Lock className="w-5 h-5 text-green-400" />,
    title: 'Never commit keys to git',
    description: 'API keys in code get pushed to GitHub and can be stolen by bots within minutes. Always use environment variables.',
  },
  {
    icon: <EyeOff className="w-5 h-5 text-yellow-400" />,
    title: 'Use .env.local for local dev',
    description: 'Create a .env.local file (already in .gitignore) for local development. Never commit it.',
  },
  {
    icon: <Shield className="w-5 h-5 text-blue-400" />,
    title: 'Use env vars in production',
    description: 'Set keys in your hosting platform\'s dashboard (Vercel, Netlify, etc.) — never in code or config files.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
    title: 'Rotate keys if exposed',
    description: 'If a key ever appears in a commit, screenshot, or public URL — revoke it immediately and generate a new one.',
  },
];

export default function SetupPage() {
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleStep = (guideIdx: number, stepIdx: number) => {
    const key = `${guideIdx}-${stepIdx}`;
    setCheckedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <h1 className="font-semibold">Setup Guide</h1>
          <Badge variant="info" className="ml-2">Required Steps</Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Get Your API Keys
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">
            AppForge needs a few API keys to work. This guide walks you through getting each one,
            keeping them safe, and deploying your first app with real results.
          </p>
        </div>

        {/* Key Guides */}
        <div className="space-y-4 mb-12">
          {guides.map((guide, gi) => (
            <Card key={guide.name} className="overflow-hidden">
              <button
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition"
                onClick={() => setExpandedGuide(expandedGuide === gi ? null : gi)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${guide.color} flex items-center justify-center`}>
                    {guide.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{guide.name}</h3>
                    <p className="text-sm text-white/40">{guide.description}</p>
                  </div>
                </div>
                {expandedGuide === gi ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedGuide === gi && (
                <div className="border-t border-white/10 p-5 space-y-4">
                  {/* Steps */}
                  <div className="space-y-2">
                    {guide.steps.map((step, si) => (
                      <div
                        key={si}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition"
                        onClick={() => toggleStep(gi, si)}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          checkedSteps[`${gi}-${si}`]
                            ? 'bg-green-500 border-green-500'
                            : 'border-white/20'
                        }`}>
                          {checkedSteps[`${gi}-${si}`] && <CheckCircle className="w-4 h-4" />}
                        </div>
                        <p className={`text-sm ${checkedSteps[`${gi}-${si}`] ? 'text-white/40 line-through' : 'text-white/80'}`}>
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Env Var */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-white/40" />
                        <span className="text-xs text-white/40 font-mono">Environment Variable</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(guide.envVarName, `env-${gi}`)}
                      >
                        {copiedIndex === `env-${gi}` ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <code className="text-sm text-green-400 font-mono">{guide.envVarName}</code>
                    <p className="text-xs text-white/30 mt-1">Example: {guide.example}</p>
                  </div>

                  {/* Warning */}
                  {guide.warning && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300">{guide.warning}</p>
                    </div>
                  )}

                  {/* CTA */}
                  <a href={guide.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="gradient" className="w-full">
                      {guide.urlLabel} <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </a>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Security Section */}
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" /> Keeping Your Keys Safe
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityTips.map((tip, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-start gap-3">
                  {tip.icon}
                  <div>
                    <h4 className="font-medium text-sm">{tip.title}</h4>
                    <p className="text-xs text-white/40 mt-1">{tip.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How To Add Keys */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-4 h-4" /> How to Add Your Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <div>
                  <p className="text-sm font-medium">Local Development</p>
                  <p className="text-xs text-white/40 mt-1">Create a <code className="bg-white/10 px-1 rounded">.env.local</code> file in the project root with your keys. This file is already in .gitignore so it won&apos;t be committed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <div>
                  <p className="text-sm font-medium">Production (Vercel)</p>
                  <p className="text-xs text-white/40 mt-1">Go to your Vercel project → Settings → Environment Variables → add each key. They&apos;re encrypted and never exposed in code.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <div>
                  <p className="text-sm font-medium">Other Platforms</p>
                  <p className="text-xs text-white/40 mt-1">Netlify: Site Settings → Environment Variables. Railway: Variables tab. Docker: Use -e flags or docker-compose environment section.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ready CTA */}
        <div className="text-center">
          <p className="text-white/40 mb-4">Got your keys configured?</p>
          <Button variant="gradient" size="lg" onClick={() => window.location.href = '/'}>
            Start Building <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
