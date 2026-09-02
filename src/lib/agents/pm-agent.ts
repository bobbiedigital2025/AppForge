/**
 * AppForge PM Agent
 * 
 * The Project Manager agent takes a raw idea and produces:
 * - Project summary and target audience
 * - Feature list with priorities and complexity ratings
 * - User stories with acceptance criteria
 * - Tech stack recommendation
 * - Compliance requirements
 * - Monetization strategy
 * - Marketplace target
 * 
 * This is the first agent in the pipeline. Everything downstream depends on its output.
 */

import type { ProjectSpecs, FeatureSpec, UserStory, TechStackRecommendation } from './types';

export interface PMAgentInput {
  idea: string;
}

export interface PMAgentOutput {
  specs: ProjectSpecs;
}

/**
 * System prompt for the PM agent.
 * This is what makes the agent act like a senior project manager.
 */
export const PM_AGENT_SYSTEM_PROMPT = `You are a senior project manager and product strategist with 15+ years of experience shipping marketplace-ready applications.

Your job is to take a raw app idea and produce a complete project specification that a team of AI agents can use to build the application.

You must:
1. Analyze the idea and identify the core value proposition
2. Define the target audience with specificity
3. Break down features by priority (critical, high, medium, low) and complexity (simple, moderate, complex)
4. Write user stories in the format: "As a [role], I want to [goal] so that [benefit]" with acceptance criteria
5. Recommend a modern tech stack that is production-ready and marketplace-ready
6. Identify compliance requirements (GDPR, CCPA, ADA/WCAG, COPPA, HIPAA, etc. as applicable)
7. Recommend a monetization strategy (freemium, subscription, one-time, marketplace fees, ads, etc.)
8. Identify the best marketplace target (web, iOS, Shopify, Google Play, or multi-platform)

You respond ONLY in valid JSON. No markdown, no explanations outside the JSON.

The JSON structure must be:
{
  "summary": "One paragraph project summary",
  "targetAudience": "Specific target audience description",
  "features": [
    {
      "name": "Feature name",
      "description": "What it does",
      "priority": "critical|high|medium|low",
      "complexity": "simple|moderate|complex"
    }
  ],
  "userStories": [
    {
      "id": "US-001",
      "role": "user type",
      "goal": "what they want to do",
      "benefit": "why they want it",
      "acceptanceCriteria": ["criterion 1", "criterion 2"]
    }
  ],
  "techStack": {
    "frontend": "Next.js 15 with App Router, Tailwind CSS, shadcn/ui",
    "backend": "Next.js API routes and server actions",
    "database": "Supabase (PostgreSQL + Auth + Storage)",
    "hosting": "Vercel",
    "auth": "Supabase Auth or Clerk",
    "payments": "Stripe",
    "testing": "Vitest + Playwright",
    "rationale": "Why this stack"
  },
  "compliance": ["GDPR", "CCPA", "WCAG 2.1 AA"],
  "monetization": "Strategy description",
  "marketplace": "web|ios|shopify|google-play|multi"
}

Be thorough but realistic. Focus on what's needed for a v1 marketplace-ready release.`;

/**
 * Generate the user prompt for the PM agent.
 */
export function buildPMPrompt(input: PMAgentInput): string {
  return `Analyze this app idea and generate a complete project specification:

"${input.idea}"

Respond with the JSON specification only.`;
}

/**
 * Parse the PM agent's JSON response into a typed ProjectSpecs object.
 * Includes validation and fallbacks for missing fields.
 */
export function parsePMResponse(response: string): PMAgentOutput {
  let parsed: ProjectSpecs;

  try {
    parsed = JSON.parse(response);
  } catch {
    // If JSON parsing fails, try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('PM agent returned invalid JSON');
    }
  }

  // Validate and provide defaults
  const specs: ProjectSpecs = {
    summary: parsed.summary || 'No summary provided',
    targetAudience: parsed.targetAudience || 'General users',
    features: (parsed.features || []).map((f: FeatureSpec) => ({
      name: f.name || 'Unnamed feature',
      description: f.description || '',
      priority: f.priority || 'medium',
      complexity: f.complexity || 'moderate',
    })),
    userStories: (parsed.userStories || []).map((us: UserStory, i: number) => ({
      id: us.id || `US-${String(i + 1).padStart(3, '0')}`,
      role: us.role || 'user',
      goal: us.goal || '',
      benefit: us.benefit || '',
      acceptanceCriteria: us.acceptanceCriteria || [],
    })),
    techStack: {
      frontend: parsed.techStack?.frontend || 'Next.js 15 with App Router, Tailwind CSS, shadcn/ui',
      backend: parsed.techStack?.backend || 'Next.js API routes and server actions',
      database: parsed.techStack?.database || 'Supabase (PostgreSQL + Auth + Storage)',
      hosting: parsed.techStack?.hosting || 'Vercel',
      auth: parsed.techStack?.auth || 'Supabase Auth',
      payments: parsed.techStack?.payments || 'Stripe',
      testing: parsed.techStack?.testing || 'Vitest + Playwright',
      rationale: parsed.techStack?.rationale || 'Modern, production-ready, marketplace-ready',
    },
    compliance: parsed.compliance || ['GDPR', 'CCPA', 'WCAG 2.1 AA'],
    monetization: parsed.monetization || 'Freemium with premium subscription',
    marketplace: parsed.marketplace || 'web',
  };

  return { specs };
}

/**
 * Default specs for when no AI is available yet (fallback / demo mode).
 * This lets the UI work before API keys are configured.
 */
export function generateDefaultSpecs(idea: string): PMAgentOutput {
  return {
    specs: {
      summary: `An application based on the idea: "${idea}". This is a generated specification that will be replaced with AI-driven analysis once API keys are configured.`,
      targetAudience: 'General users seeking a streamlined, modern application experience.',
      features: [
        {
          name: 'User Authentication',
          description: 'Secure sign-up, login, and session management',
          priority: 'critical',
          complexity: 'simple',
        },
        {
          name: 'Admin Dashboard',
          description: 'Full admin panel for managing users, content, and settings',
          priority: 'high',
          complexity: 'moderate',
        },
        {
          name: 'Client-Facing Interface',
          description: 'Clean, intuitive UI for end users',
          priority: 'critical',
          complexity: 'moderate',
        },
        {
          name: 'Payment Processing',
          description: 'Stripe integration for subscriptions and one-time payments',
          priority: 'high',
          complexity: 'moderate',
        },
        {
          name: 'Analytics',
          description: 'User behavior tracking and reporting',
          priority: 'medium',
          complexity: 'moderate',
        },
      ],
      userStories: [
        {
          id: 'US-001',
          role: 'new user',
          goal: 'create an account',
          benefit: 'I can access the application',
          acceptanceCriteria: [
            'Sign-up form with email and password',
            'Email verification sent',
            'Account created in database',
            'Welcome email sent',
          ],
        },
        {
          id: 'US-002',
          role: 'admin',
          goal: 'manage users',
          benefit: 'I can oversee and control user access',
          acceptanceCriteria: [
            'View list of all users',
            'Search and filter users',
            'Ban or suspend users',
            'Change user roles',
          ],
        },
        {
          id: 'US-003',
          role: 'user',
          goal: 'use the main feature',
          benefit: 'I get value from the application',
          acceptanceCriteria: [
            'Main feature is accessible after login',
            'Responsive on mobile and desktop',
            'Actions are saved to database',
          ],
        },
      ],
      techStack: {
        frontend: 'Next.js 15 with App Router, Tailwind CSS, shadcn/ui',
        backend: 'Next.js API routes and server actions',
        database: 'Supabase (PostgreSQL + Auth + Storage)',
        hosting: 'Vercel',
        auth: 'Supabase Auth',
        payments: 'Stripe',
        testing: 'Vitest + Playwright',
        rationale: 'Modern, production-ready stack with excellent DX, strong typing, and marketplace-ready deployment options.',
      },
      compliance: ['GDPR', 'CCPA', 'WCAG 2.1 AA'],
      monetization: 'Freemium with premium subscription tier',
      marketplace: 'web',
    },
  };
}
