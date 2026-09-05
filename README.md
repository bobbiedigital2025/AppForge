# AppForge

**AI-powered application factory.** One prompt in — a full marketplace-ready app comes out.

AppForge uses a team of 9 specialized AI agents to take a single text description and produce a complete, deployable application: frontend, backend, database schema, API routes, tests, compliance docs, and deployment configuration.

## How It Works

1. **Describe your app** — type what you want in plain English
2. **AI agent team builds it** — PM, Architect, Database, Backend, Frontend, Testing, Compliance, and DevOps agents work in sequence
3. **Preview goes live** — your app is deployed and you get a URL to share
4. **Export when ready** — download the full source code or push to GitHub

## The Agent Team

| Agent | Role |
|-------|------|
| Project Manager | Breaks down the idea into tasks, creates specs |
| Architect | Designs the system architecture |
| Database | Generates schema, migrations, seed data |
| Backend | Builds API routes, business logic, auth |
| Frontend | Creates UI components, pages, styling |
| Testing | Writes and runs tests, reports coverage |
| Compliance | Checks GDPR, accessibility, security |
| DevOps | Configures deployment, CI/CD, monitoring |
| Orchestrator | Coordinates all agents, manages retries |

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Auth:** Supabase Auth (email/password, Google OAuth, GitHub OAuth)
- **AI:** Letta agents with Telnyx Inference API (MiniMax-M3)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Deployment:** Vercel

## Pricing Tiers

| Feature | Free | Starter ($19/mo) | Pro ($49/mo) | Enterprise ($199/mo) |
|---------|------|-------------------|--------------|----------------------|
| Apps per month | 1 | 5 | Unlimited | Unlimited |
| Live preview | 7 days | 30 days | Unlimited | Unlimited |
| Source code export | — | ZIP | ZIP + GitHub | ZIP + GitHub |
| Backend included | — | Yes | Yes | Yes |
| Custom domain | — | — | Yes | Yes |
| Branding | AppForge badge | None | None | None |
| Support | Community | Email | Priority | Phone + SLA |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Telnyx](https://telnyx.com) API key (for AI inference)
- A [Supabase](https://supabase.com) project (for database and auth)

### Environment Variables

Create a `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-key

# AI Provider
TELNYX_API_KEY=your-telnyx-api-key

# Letta (optional, for agent orchestration)
LETTA_API_KEY=your-letta-api-key
```

### Database Setup

Run the SQL migrations in your Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql` — projects, tasks, files, logs tables with RLS
2. `supabase/migrations/002_profiles_and_admin.sql` — profiles table with auto-creation trigger
3. `supabase/migrations/003_tiers_and_previews.sql` — subscription tiers, preview expiry, plans

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with project creation form |
| `/signup` | Create account (email, Google, GitHub) |
| `/login` | Sign in |
| `/forgot-password` | Password reset request |
| `/reset-password` | Set new password |
| `/dashboard` | Your projects (protected) |
| `/dashboard/[projectId]` | Project details with pipeline progress |
| `/analytics/[projectId]` | Project analytics dashboard |
| `/admin` | Admin panel — all users, all projects (protected) |
| `/pricing` | Subscription plans |
| `/setup` | API key setup guide |
| `/terms` | Terms of Service |
| `/privacy` | Privacy Policy |
| `/preview/[projectId]` | Live app preview |

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/generate` | POST | Yes | Start a new project pipeline |
| `/api/generate` | GET | Yes | List user's projects |
| `/api/generate/[projectId]` | GET | Yes | Get project status |
| `/api/generate/[projectId]/download` | GET | Paid | Download project ZIP |
| `/api/admin/projects` | GET | Admin | List all projects (all users) |
| `/auth/callback` | GET | — | OAuth callback handler |

## Security

- **Row Level Security** on all database tables — users can only access their own data
- **Middleware** protects `/dashboard`, `/analytics`, and `/admin` routes
- **Admin panel** requires `role = 'admin'` in the profiles table
- **API routes** verify authentication via Supabase session
- **Service role key** is server-side only, never exposed to the client
- **Preview expiry** — free tier projects go offline after 7 days

## Architecture

```
User describes app
       ↓
  PM Agent → specs
       ↓
  Architect Agent → architecture
       ↓
  Database Agent → schema + files
       ↓
  Backend Agent → API routes + logic
       ↓
  Frontend Agent → UI components + pages
       ↓
  Testing Agent → tests + coverage report
       ↓
  Compliance Agent → GDPR + accessibility
       ↓
  DevOps Agent → deployment config
       ↓
  Project saved to Supabase
  Preview deployed
```

## License

Proprietary. All rights reserved.

---

Built with [Letta](https://letta.com) — the AI agent framework.
