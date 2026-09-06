-- 005: Build quota helper
-- Returns how many projects a user has created in the last N hours.
-- Used by the generate route to enforce tier limits:
--   free: 1 build/month (720h), starter: 5/month, pro: unlimited (10/day guardrail), enterprise: unlimited

CREATE OR REPLACE FUNCTION count_recent_projects(p_user_id UUID, p_hours INTEGER)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM projects
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_hours || ' hours')::INTERVAL;
$$;

-- Only the service role (server routes) can call this
REVOKE ALL ON FUNCTION count_recent_projects(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION count_recent_projects(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION count_recent_projects(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION count_recent_projects(UUID, INTEGER) TO service_role;
