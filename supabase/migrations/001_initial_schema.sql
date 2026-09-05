-- AppForge Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,  -- AppForge project ID (e.g., proj-xxxxx)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  idea TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  current_phase INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0,
  specs JSONB,
  architecture JSONB,
  deployment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PROJECT TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  error TEXT,
  output JSONB,
  started_at BIGINT,
  completed_at BIGINT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PROJECT FILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_files (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  agent TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PROJECT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_logs (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  agent TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_logs_project_id ON project_logs(project_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own projects
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Tasks: users can only access tasks for their own projects
CREATE POLICY "Users can view own tasks" ON project_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_tasks.project_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own tasks" ON project_tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_tasks.project_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own tasks" ON project_tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_tasks.project_id AND user_id = auth.uid())
);

-- Files: users can only access files for their own projects
CREATE POLICY "Users can view own files" ON project_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_files.project_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own files" ON project_files FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_files.project_id AND user_id = auth.uid())
);

-- Logs: users can only access logs for their own projects
CREATE POLICY "Users can view own logs" ON project_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_logs.project_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own logs" ON project_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_logs.project_id AND user_id = auth.uid())
);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER project_tasks_updated_at BEFORE UPDATE ON project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
