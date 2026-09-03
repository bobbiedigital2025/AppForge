/**
 * AppForge Code Generation Agents
 * 
 * Three agents that run in parallel after the architect finishes:
 * 1. Database agent — generates SQL schema, migrations, seed data
 * 2. Backend agent — generates API routes, server actions, business logic
 * 3. Frontend agent — generates pages, components, layouts
 * 
 * Each agent takes the architecture doc and specs as input,
 * and outputs a set of GeneratedFile objects.
 */

import type { ProjectSpecs, ArchitectureDoc, GeneratedFile, AgentRole } from './types';

// ─── Database Agent ────────────────────────────────────────────────

export interface DatabaseAgentInput {
  architecture: ArchitectureDoc;
  specs: ProjectSpecs;
}

export interface DatabaseAgentOutput {
  files: GeneratedFile[];
}

export const DATABASE_AGENT_SYSTEM_PROMPT = `You are a senior database engineer. Given an architecture document, generate production-ready SQL:

1. Schema definition (CREATE TABLE statements with proper constraints)
2. Row-level security policies
3. Indexes for performance
4. Seed data for development
5. Migration scripts

Use PostgreSQL syntax (Supabase-compatible). Include proper foreign keys, constraints, and indexes.
Respond ONLY in valid JSON: { "files": [{ "path": "string", "content": "string", "agent": "database", "status": "generated" }] }`;

export function generateDefaultDatabaseFiles(input: DatabaseAgentInput): DatabaseAgentOutput {
  // Architecture data models inform the schema (used when AI is wired in)

  const schemaSQL = `-- AppForge Generated Schema
-- Auto-generated from architecture specification

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can CRUD own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own tasks" ON tasks FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

  const seedSQL = `-- AppForge Seed Data
-- Run after schema migration

INSERT INTO users (email, password_hash, name, role) VALUES
  ('admin@appforge.dev', crypt('admin123', gen_salt('bf')), 'Admin User', 'admin'),
  ('user@appforge.dev', crypt('user123', gen_salt('bf')), 'Test User', 'user');

INSERT INTO projects (user_id, name, description, status) VALUES
  ( (SELECT id FROM users WHERE email = 'user@appforge.dev'),
    'Demo Project', 'A sample project for demonstration', 'active');

INSERT INTO tasks (project_id, title, description, status, priority) VALUES
  ( (SELECT id FROM projects WHERE name = 'Demo Project'),
    'Setup database', 'Initialize the database schema', 'done', 'high'),
  ( (SELECT id FROM projects WHERE name = 'Demo Project'),
    'Build API', 'Create REST API endpoints', 'in_progress', 'high'),
  ( (SELECT id FROM projects WHERE name = 'Demo Project'),
    'Design UI', 'Create the user interface', 'todo', 'medium');
`;

  return {
    files: [
      { path: 'db/schema.sql', content: schemaSQL, agent: 'database', status: 'generated' },
      { path: 'db/seed.sql', content: seedSQL, agent: 'database', status: 'generated' },
    ],
  };
}

// ─── Backend Agent ─────────────────────────────────────────────────

export interface BackendAgentInput {
  architecture: ArchitectureDoc;
  specs: ProjectSpecs;
}

export interface BackendAgentOutput {
  files: GeneratedFile[];
}

export const BACKEND_AGENT_SYSTEM_PROMPT = `You are a senior backend engineer. Given an architecture document, generate production-ready Next.js API routes and server actions:

1. API route handlers for every endpoint in the architecture
2. Zod validation schemas for all inputs
3. Server actions for client-side mutations
4. Auth middleware and role checking
5. Error handling with proper HTTP status codes

Follow Next.js 15 App Router conventions. Use TypeScript.
Respond ONLY in valid JSON: { "files": [{ "path": "string", "content": "string", "agent": "backend", "status": "generated" }] }`;

export function generateDefaultBackendFiles(input: BackendAgentInput): BackendAgentOutput {
  // Architecture API endpoints inform the routes (used when AI is wired in)

  const authSignup = `import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = signupSchema.parse(body);

    // TODO: Replace with Supabase auth call
    // const { data, error } = await supabase.auth.signUp({ email, password })
    
    return NextResponse.json({
      message: 'Account created. Check your email for verification.',
      email,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
`;

  const authLogin = `import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // TODO: Replace with Supabase auth call
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    return NextResponse.json({
      message: 'Logged in successfully',
      user: { email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }
}
`;

  const projectsList = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // TODO: Get user from session
  // TODO: Fetch projects from Supabase where user_id = session.user.id
  
  return NextResponse.json({
    projects: [
      { id: 'demo-1', name: 'Demo Project', status: 'active' }
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name || body.name.length < 1) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // TODO: Insert into Supabase
    return NextResponse.json({
      message: 'Project created',
      project: { id: 'new-' + Date.now(), ...body },
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
`;

  const billingWebhook = `import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2024-06-20',
// });

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    // const event = stripe.webhooks.constructEvent(
    //   payload,
    //   signature,
    //   process.env.STRIPE_WEBHOOK_SECRET!
    // );

    // Handle event types:
    // - checkout.session.completed
    // - customer.subscription.updated
    // - customer.subscription.deleted
    // - invoice.payment_succeeded
    // - invoice.payment_failed

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
}
`;

  return {
    files: [
      { path: 'src/app/api/auth/signup/route.ts', content: authSignup, agent: 'backend', status: 'generated' },
      { path: 'src/app/api/auth/login/route.ts', content: authLogin, agent: 'backend', status: 'generated' },
      { path: 'src/app/api/projects/route.ts', content: projectsList, agent: 'backend', status: 'generated' },
      { path: 'src/app/api/billing/webhook/route.ts', content: billingWebhook, agent: 'backend', status: 'generated' },
    ],
  };
}

// ─── Frontend Agent ─────────────────────────────────────────────────

export interface FrontendAgentInput {
  architecture: ArchitectureDoc;
  specs: ProjectSpecs;
}

export interface FrontendAgentOutput {
  files: GeneratedFile[];
}

export const FRONTEND_AGENT_SYSTEM_PROMPT = `You are a senior frontend engineer. Given an architecture document, generate production-ready React components:

1. Page components for every route in the architecture
2. Layout components (dashboard layout, auth layout)
3. Reusable UI components (tables, forms, cards, modals)
4. Client-side data fetching hooks
5. Responsive design with Tailwind CSS

Follow Next.js 15 App Router conventions. Use TypeScript and shadcn/ui patterns.
Respond ONLY in valid JSON: { "files": [{ "path": "string", "content": "string", "agent": "frontend", "status": "generated" }] }`;

export function generateDefaultFrontendFiles(input: FrontendAgentInput): FrontendAgentOutput {
  const loginPage = `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Badge variant="error">{error}</Badge>}
            <div>
              <label className="text-sm text-white/60 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                required
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                required
              />
            </div>
            <Button variant="gradient" className="w-full" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-white/40 text-center">
              Don't have an account?{' '}
              <a href="/signup" className="text-fuchsia-400 hover:underline">Sign up</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
`;

  const signupPage = `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Signup failed');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Start building with AppForge</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Badge variant="error">{error}</Badge>}
            <div>
              <label className="text-sm text-white/60 mb-1 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                required
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                required
                minLength={8}
              />
            </div>
            <Button variant="gradient" className="w-full" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            <p className="text-sm text-white/40 text-center">
              Already have an account?{' '}
              <a href="/login" className="text-fuchsia-400 hover:underline">Sign in</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
`;

  const adminPage = `'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function AdminPage() {
  const stats = [
    { label: 'Total Users', value: 1247, change: '+12%' },
    { label: 'Active Projects', value: 342, change: '+8%' },
    { label: 'Revenue (MRR)', value: '$8,420', change: '+23%' },
    { label: 'API Calls (24h)', value: '1.2M', change: '+5%' },
  ];

  const users = [
    { email: 'admin@appforge.dev', role: 'admin', status: 'active' },
    { email: 'user@appforge.dev', role: 'user', status: 'active' },
    { email: 'test@appforge.dev', role: 'user', status: 'suspended' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <h1 className="font-semibold text-lg">Admin Panel</h1>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <p className="text-sm text-white/40 mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <Badge variant="success" className="text-xs">{stat.change}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and roles</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-sm text-white/40">
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 text-sm">{user.email}</td>
                    <td className="py-3">
                      <Badge variant={user.role === 'admin' ? 'warning' : 'default'} className="text-xs">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge variant={user.status === 'active' ? 'success' : 'error'} className="text-xs">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <button className="text-xs text-fuchsia-400 hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* System health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">API Uptime (30d)</span>
                <span className="text-emerald-400">99.98%</span>
              </div>
              <Progress value={99.98} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">Database Health</span>
                <span className="text-emerald-400">Healthy</span>
              </div>
              <Progress value={100} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">Error Rate (24h)</span>
                <span className="text-amber-400">0.02%</span>
              </div>
              <Progress value={99.98} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`;

  return {
    files: [
      { path: 'src/app/(auth)/login/page.tsx', content: loginPage, agent: 'frontend', status: 'generated' },
      { path: 'src/app/(auth)/signup/page.tsx', content: signupPage, agent: 'frontend', status: 'generated' },
      { path: 'src/app/(dashboard)/admin/page.tsx', content: adminPage, agent: 'frontend', status: 'generated' },
    ],
  };
}
