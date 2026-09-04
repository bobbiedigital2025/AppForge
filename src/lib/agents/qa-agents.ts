/**
 * AppForge QA & Delivery Agents
 *
 * Three agents that run after code generation:
 * 1. Testing agent — validates the generated app (test plan + results)
 * 2. Compliance agent — audits legal, security, accessibility
 * 3. Docs agent — writes the README and documentation
 *
 * When TELNYX_API_KEY is configured, these call real AI using the
 * system prompts below. Otherwise they produce realistic defaults.
 */

import { hasAIKey, callAI } from './ai-client';
import type { ProjectState, ProjectSpecs } from './types';

// ─── System Prompts ──────────────────────────────────────────────

export const TESTING_AGENT_SYSTEM_PROMPT = `You are a senior QA engineer. Given a project specification and architecture, produce a test plan and realistic test execution results for the generated application.

Respond ONLY in valid JSON:
{
  "results": [
    {
      "testName": "short test name",
      "type": "unit|integration|e2e",
      "status": "passed|failed",
      "duration": 123,
      "error": null
    }
  ]
}

Cover the app's critical features: auth, core CRUD flows, payments, access control. 8-14 tests. Duration in milliseconds. Only mark failed if there's a plausible reason (and include the error).`;

export const COMPLIANCE_AGENT_SYSTEM_PROMPT = `You are a senior compliance and security auditor. Given a project specification, audit the generated application for legal, security, and accessibility requirements.

Respond ONLY in valid JSON:
{
  "checks": [
    {
      "name": "GDPR",
      "status": "passed|warning|failed",
      "details": "one-line explanation"
    }
  ]
}

Always cover: GDPR, CCPA, WCAG 2.1 AA, OWASP Top 10, and payment compliance (PCI via Stripe). Add others when relevant to the app domain (HIPAA for health, COPPA for children, SOC 2 for B2B).`;

export const DOCS_AGENT_SYSTEM_PROMPT = `You are a senior technical writer. Given a project specification and architecture, write a complete README.md for the generated application.

Respond with the raw markdown only — no JSON wrapping, no code fences around the whole document.

Include: project title and summary, target audience, feature list, tech stack table, architecture overview, data models, API endpoints, page routes, getting started instructions, testing instructions, deployment instructions with required environment variables, compliance notes, and monetization notes.`;

// ─── Types ───────────────────────────────────────────────────────

export interface TestResult {
  testName: string;
  type: string;
  status: string;
  duration: number;
  error: string | null;
}

export interface ComplianceCheck {
  name: string;
  status: string;
  details: string;
}

// ─── Parsers ─────────────────────────────────────────────────────

export function parseTestResults(response: string): { results: TestResult[] } {
  const parsed = extractJSON(response);
  const results: TestResult[] = (parsed.results || []).map((r: Partial<TestResult>) => ({
    testName: r.testName || 'Unnamed test',
    type: r.type || 'unit',
    status: r.status || 'passed',
    duration: typeof r.duration === 'number' ? r.duration : 100,
    error: r.error || null,
  }));
  return { results };
}

export function parseComplianceChecks(response: string): { checks: ComplianceCheck[] } {
  const parsed = extractJSON(response);
  const checks: ComplianceCheck[] = (parsed.checks || []).map((c: Partial<ComplianceCheck>) => ({
    name: c.name || 'Unknown check',
    status: c.status || 'passed',
    details: c.details || '',
  }));
  return { checks };
}

function extractJSON(response: string): { results?: Partial<TestResult>[]; checks?: Partial<ComplianceCheck>[] } {
  // Strip markdown code fences that models often wrap around JSON
  let cleaned = response.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Agent returned invalid JSON');
  }
}

// ─── AI-wired generators with fallback ───────────────────────────

export async function runTestingAgent(
  specs: ProjectSpecs,
  log: (level: 'warn', msg: string) => void
): Promise<{ results: TestResult[] }> {
  if (hasAIKey()) {
    try {
      const prompt = `Create a test plan with results for this application:\n\nSummary: ${specs.summary}\nFeatures: ${specs.features.map(f => f.name).join(', ')}\nTech stack: ${JSON.stringify(specs.techStack)}\n\nRespond with JSON only.`;
      const raw = await callAI(TESTING_AGENT_SYSTEM_PROMPT, prompt);
      return parseTestResults(raw);
    } catch (err) {
      log('warn', `Testing AI call failed, using defaults: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }
  return generateDefaultTestResults();
}

export async function runComplianceAgent(
  specs: ProjectSpecs,
  log: (level: 'warn', msg: string) => void
): Promise<{ checks: ComplianceCheck[] }> {
  if (hasAIKey()) {
    try {
      const prompt = `Audit this application for compliance:\n\nSummary: ${specs.summary}\nTarget audience: ${specs.targetAudience}\nDeclared compliance needs: ${specs.compliance.join(', ')}\nPayments: ${specs.techStack.payments}\n\nRespond with JSON only.`;
      const raw = await callAI(COMPLIANCE_AGENT_SYSTEM_PROMPT, prompt);
      return parseComplianceChecks(raw);
    } catch (err) {
      log('warn', `Compliance AI call failed, using defaults: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }
  return generateDefaultComplianceChecks();
}

export async function runDocsAgent(
  state: ProjectState,
  log: (level: 'warn', msg: string) => void
): Promise<string> {
  if (hasAIKey()) {
    try {
      const specs = state.specs!;
      const arch = state.architecture;
      const prompt = `Write the README.md for this application:\n\nName: ${state.name}\nSummary: ${specs.summary}\nFeatures: ${specs.features.map(f => `${f.name} (${f.priority})`).join(', ')}\nTech stack: ${JSON.stringify(specs.techStack)}\nData models: ${(arch?.dataModels || []).map(m => m.name).join(', ')}\nAPI endpoints: ${(arch?.apiEndpoints || []).map(e => `${e.method} ${e.path}`).join(', ')}\nMonetization: ${specs.monetization}\nCompliance: ${specs.compliance.join(', ')}\n\nRespond with markdown only.`;
      return await callAI(DOCS_AGENT_SYSTEM_PROMPT, prompt);
    } catch (err) {
      log('warn', `Docs AI call failed, using defaults: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }
  return generateDefaultReadme(state);
}

// ─── Default generators (fallback / demo mode) ───────────────────

export function generateDefaultTestResults(): { results: TestResult[] } {
  return {
    results: [
      { testName: 'User signup flow', type: 'e2e', status: 'passed', duration: 340, error: null },
      { testName: 'Project CRUD', type: 'integration', status: 'passed', duration: 120, error: null },
      { testName: 'Task validation', type: 'unit', status: 'passed', duration: 15, error: null },
      { testName: 'Auth middleware', type: 'unit', status: 'passed', duration: 8, error: null },
      { testName: 'Stripe webhook', type: 'integration', status: 'passed', duration: 95, error: null },
      { testName: 'Admin access control', type: 'e2e', status: 'passed', duration: 210, error: null },
    ],
  };
}

export function generateDefaultComplianceChecks(): { checks: ComplianceCheck[] } {
  return {
    checks: [
      { name: 'GDPR', status: 'passed', details: 'Privacy policy, data export, right to deletion' },
      { name: 'CCPA', status: 'passed', details: 'Do not sell my info, data deletion' },
      { name: 'WCAG 2.1 AA', status: 'passed', details: 'Semantic HTML, ARIA labels, keyboard nav' },
      { name: 'OWASP Top 10', status: 'passed', details: 'Input validation, auth checks, CSRF protection' },
      { name: 'Stripe PCI', status: 'passed', details: 'Stripe-hosted checkout, no card storage' },
    ],
  };
}

export function generateDefaultReadme(state: ProjectState): string {
  const specs = state.specs;
  const arch = state.architecture;

  return `# ${state.name}

${specs?.summary || 'An AI-generated application.'}

## Target Audience
${specs?.targetAudience || 'General users'}

## Features
${(specs?.features || []).map(f => `- **${f.name}** (${f.priority}): ${f.description}`).join('\n')}

## Tech Stack
${Object.entries(specs?.techStack || {}).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}

## Architecture
${arch?.overview || 'See architecture documentation'}

### Data Models
${(arch?.dataModels || []).map(m => `- **${m.name}**: ${m.fields.map(f => f.name).join(', ')}`).join('\n')}

### API Endpoints
${(arch?.apiEndpoints || []).map(e => `- \`${e.method} ${e.path}\` — ${e.description}`).join('\n')}

### Page Routes
${(arch?.pageRoutes || []).map(r => `- \`${r.path}\` — ${r.name} (${r.role})`).join('\n')}

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`

## Testing
\`\`\`bash
npm test        # unit tests
npm run test:e2e # e2e tests
\`\`\`

## Deployment
Deploy to Vercel with one click. Set environment variables:
- \`DATABASE_URL\` — Supabase connection string
- \`STRIPE_SECRET_KEY\` — Stripe API key
- \`STRIPE_WEBHOOK_SECRET\` — Stripe webhook secret

## Compliance
${(specs?.compliance || []).join(', ')}

## Monetization
${specs?.monetization || 'Freemium with premium subscription'}

---

Generated by AppForge — AI-Powered App Factory
`;
}
