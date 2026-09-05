-- AppForge Tiered Subscriptions & Preview System
-- Run this in the Supabase SQL Editor after 002_profiles_and_admin.sql

-- ============================================================================
-- ADD TIER COLUMNS TO PROFILES
-- ============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'enterprise'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- ============================================================================
-- ADD PREVIEW COLUMNS TO PROJECTS
-- ============================================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_preview BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS preview_expires_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- ============================================================================
-- SUBSCRIPTION PLANS TABLE (reference data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL, -- in cents
  features JSONB NOT NULL,
  limits JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the plans
INSERT INTO plans (id, name, price_monthly, features, limits) VALUES
  ('free', 'Free', 0,
   '["AI-generated app", "Live preview URL", "7-day preview", "Community support"]',
   '{"projects_per_month": 1, "exports": false, "backend": false, "custom_domain": false, "branding": true}'),
  ('starter', 'Starter', 1900,
   '["Everything in Free", "Full source code export (ZIP)", "Backend included", "30-day previews", "Email support", "No branding"]',
   '{"projects_per_month": 5, "exports": true, "backend": true, "custom_domain": false, "branding": false}'),
  ('pro', 'Pro', 4900,
   '["Everything in Starter", "GitHub export", "Custom domain", "Unlimited previews", "Priority AI pipeline", "Priority support"]',
   '{"projects_per_month": -1, "exports": true, "backend": true, "custom_domain": true, "branding": false}'),
  ('enterprise', 'Enterprise', 19900,
   '["Everything in Pro", "Dedicated infrastructure", "SLA guarantee", "Custom AI models", "White label", "Phone support"]',
   '{"projects_per_month": -1, "exports": true, "backend": true, "custom_domain": true, "branding": false}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS FOR PLANS (read-only for everyone)
-- ============================================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plans" ON plans FOR SELECT USING (true);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);
CREATE INDEX IF NOT EXISTS idx_projects_preview ON projects(is_preview, preview_expires_at);
