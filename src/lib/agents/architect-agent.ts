/**
 * AppForge Architect Agent
 * 
 * Takes the PM agent's specs and designs the system architecture:
 * - Data models (tables, fields, relationships)
 * - API endpoints (REST routes with methods)
 * - Page routes (with auth requirements)
 * - Component tree (pages, layouts, components)
 * - Security model
 * - Scalability notes
 */

import type { ProjectSpecs, ArchitectureDoc, DataModel, ApiEndpoint, PageRoute, ComponentNode } from './types';

export interface ArchitectAgentInput {
  specs: ProjectSpecs;
  idea: string;
}

export interface ArchitectAgentOutput {
  architecture: ArchitectureDoc;
}

export const ARCHITECT_AGENT_SYSTEM_PROMPT = `You are a senior software architect with 15+ years of experience designing scalable, marketplace-ready applications.

Given a project specification, design a complete system architecture. You must define:

1. Data Models: Every database table with fields, types, required flags, and foreign key relationships
2. API Endpoints: Every REST endpoint with HTTP method, path, description, and auth requirement
3. Page Routes: Every page in the app with path, name, auth requirement, and role (public/user/admin)
4. Component Tree: The React component hierarchy (pages, layouts, components)
5. Security Model: Authentication, authorization, data protection strategy
6. Scalability Notes: How the system handles growth

Respond ONLY in valid JSON:
{
  "overview": "One paragraph architecture overview",
  "dataModels": [
    {
      "name": "users",
      "fields": [
        { "name": "id", "type": "uuid", "required": true },
        { "name": "email", "type": "string", "required": true },
        { "name": "created_at", "type": "timestamp", "required": true }
      ],
      "relationships": ["has_many:projects"]
    }
  ],
  "apiEndpoints": [
    { "method": "POST", "path": "/api/auth/signup", "description": "Create new account", "authRequired": false }
  ],
  "pageRoutes": [
    { "path": "/", "name": "Landing", "authRequired": false, "role": "public" }
  ],
  "componentTree": [
    {
      "name": "RootLayout",
      "type": "layout",
      "children": [
        { "name": "Navbar", "type": "component", "children": [] }
      ]
    }
  ],
  "securityModel": "Description of auth, authorization, and data protection",
  "scalabilityNotes": "How the system scales"
}`;

export function buildArchitectPrompt(input: ArchitectAgentInput): string {
  return `Design the system architecture for this application:

Project: ${input.idea}
Target Audience: ${input.specs.targetAudience}
Features: ${input.specs.features.map(f => f.name).join(', ')}
Tech Stack: ${JSON.stringify(input.specs.techStack)}
Marketplace: ${input.specs.marketplace}

Respond with the JSON architecture only.`;
}

export function generateDefaultArchitecture(specs: ProjectSpecs, idea: string): ArchitectAgentOutput {
  const dataModels: DataModel[] = [
    {
      name: 'users',
      fields: [
        { name: 'id', type: 'uuid', required: true },
        { name: 'email', type: 'string', required: true },
        { name: 'password_hash', type: 'string', required: true },
        { name: 'name', type: 'string', required: false },
        { name: 'role', type: 'enum(user, admin)', required: true },
        { name: 'created_at', type: 'timestamp', required: true },
        { name: 'updated_at', type: 'timestamp', required: true },
      ],
      relationships: ['has_many:projects', 'has_many:subscriptions'],
    },
    {
      name: 'projects',
      fields: [
        { name: 'id', type: 'uuid', required: true },
        { name: 'user_id', type: 'uuid', required: true, references: 'users.id' },
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'status', type: 'enum(active, archived)', required: true },
        { name: 'created_at', type: 'timestamp', required: true },
      ],
      relationships: ['belongs_to:users', 'has_many:tasks'],
    },
    {
      name: 'tasks',
      fields: [
        { name: 'id', type: 'uuid', required: true },
        { name: 'project_id', type: 'uuid', required: true, references: 'projects.id' },
        { name: 'title', type: 'string', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'status', type: 'enum(todo, in_progress, done)', required: true },
        { name: 'priority', type: 'enum(low, medium, high)', required: true },
        { name: 'due_date', type: 'date', required: false },
        { name: 'created_at', type: 'timestamp', required: true },
      ],
      relationships: ['belongs_to:projects'],
    },
    {
      name: 'subscriptions',
      fields: [
        { name: 'id', type: 'uuid', required: true },
        { name: 'user_id', type: 'uuid', required: true, references: 'users.id' },
        { name: 'stripe_customer_id', type: 'string', required: true },
        { name: 'stripe_subscription_id', type: 'string', required: false },
        { name: 'plan', type: 'enum(free, pro, enterprise)', required: true },
        { name: 'status', type: 'enum(active, canceled, past_due)', required: true },
        { name: 'current_period_end', type: 'timestamp', required: false },
      ],
      relationships: ['belongs_to:users'],
    },
  ];

  const apiEndpoints: ApiEndpoint[] = [
    { method: 'POST', path: '/api/auth/signup', description: 'Create a new account', authRequired: false },
    { method: 'POST', path: '/api/auth/login', description: 'Authenticate user', authRequired: false },
    { method: 'POST', path: '/api/auth/logout', description: 'End session', authRequired: true },
    { method: 'GET', path: '/api/projects', description: 'List user projects', authRequired: true },
    { method: 'POST', path: '/api/projects', description: 'Create a project', authRequired: true },
    { method: 'GET', path: '/api/projects/:id', description: 'Get project details', authRequired: true },
    { method: 'PUT', path: '/api/projects/:id', description: 'Update project', authRequired: true },
    { method: 'DELETE', path: '/api/projects/:id', description: 'Delete project', authRequired: true },
    { method: 'GET', path: '/api/projects/:id/tasks', description: 'List tasks in project', authRequired: true },
    { method: 'POST', path: '/api/projects/:id/tasks', description: 'Create task', authRequired: true },
    { method: 'PUT', path: '/api/tasks/:id', description: 'Update task', authRequired: true },
    { method: 'DELETE', path: '/api/tasks/:id', description: 'Delete task', authRequired: true },
    { method: 'GET', path: '/api/admin/users', description: 'Admin: list all users', authRequired: true },
    { method: 'PUT', path: '/api/admin/users/:id', description: 'Admin: update user role', authRequired: true },
    { method: 'POST', path: '/api/billing/subscribe', description: 'Create Stripe subscription', authRequired: true },
    { method: 'POST', path: '/api/billing/webhook', description: 'Stripe webhook handler', authRequired: false },
  ];

  const pageRoutes: PageRoute[] = [
    { path: '/', name: 'Landing', authRequired: false, role: 'public' },
    { path: '/login', name: 'Login', authRequired: false, role: 'public' },
    { path: '/signup', name: 'Sign Up', authRequired: false, role: 'public' },
    { path: '/dashboard', name: 'Dashboard', authRequired: true, role: 'user' },
    { path: '/projects/:id', name: 'Project Detail', authRequired: true, role: 'user' },
    { path: '/settings', name: 'Settings', authRequired: true, role: 'user' },
    { path: '/billing', name: 'Billing', authRequired: true, role: 'user' },
    { path: '/admin', name: 'Admin Panel', authRequired: true, role: 'admin' },
    { path: '/admin/users', name: 'User Management', authRequired: true, role: 'admin' },
  ];

  const componentTree: ComponentNode[] = [
    {
      name: 'RootLayout',
      type: 'layout',
      children: [
        { name: 'Navbar', type: 'component', children: [] },
        { name: 'Footer', type: 'component', children: [] },
      ],
    },
    {
      name: 'LandingPage',
      type: 'page',
      children: [
        { name: 'HeroSection', type: 'component', children: [] },
        { name: 'FeaturesSection', type: 'component', children: [] },
        { name: 'CTASection', type: 'component', children: [] },
      ],
    },
    {
      name: 'DashboardLayout',
      type: 'layout',
      children: [
        { name: 'Sidebar', type: 'component', children: [] },
        { name: 'DashboardNav', type: 'component', children: [] },
      ],
    },
    {
      name: 'DashboardPage',
      type: 'page',
      children: [
        { name: 'ProjectList', type: 'component', children: [
          { name: 'ProjectCard', type: 'component', children: [] },
        ] },
        { name: 'StatsOverview', type: 'component', children: [] },
      ],
    },
    {
      name: 'AdminPage',
      type: 'page',
      children: [
        { name: 'UserTable', type: 'component', children: [] },
        { name: 'SystemStats', type: 'component', children: [] },
      ],
    },
  ];

  return {
    architecture: {
      overview: `A full-stack web application built with Next.js 15 (App Router) and Supabase (PostgreSQL). The architecture follows a feature-centric organization with route groups for (marketing), (dashboard), and (admin). Authentication is handled via Supabase Auth with role-based access control (user/admin). The API layer uses Next.js server actions and API routes with Zod validation. Stripe handles subscription billing with webhook-based lifecycle management.`,
      dataModels,
      apiEndpoints,
      pageRoutes,
      componentTree,
      securityModel: 'Authentication via Supabase Auth (email/password + OAuth). JWT-based sessions with refresh tokens. Role-based access control (RBAC) with user and admin roles. Row-level security (RLS) policies on all database tables. API routes validate input with Zod schemas. CORS configured for allowed origins only. Rate limiting on auth endpoints.',
      scalabilityNotes: 'Serverless deployment on Vercel with edge functions for API routes. Supabase handles database scaling with connection pooling. Static pages cached at the edge. ISR for semi-dynamic content. Image optimization via next/image. Horizontal scaling via stateless API design.',
    },
  };
}
