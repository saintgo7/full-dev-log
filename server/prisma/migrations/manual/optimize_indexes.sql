-- DevLog Hub Database Index Optimization
-- M13-T1: Performance Optimization Migration
--
-- This file documents all index additions for the database optimization milestone.
-- These indexes are managed by Prisma schema but documented here for reference.
--
-- IMPORTANT: Run `npx prisma migrate dev` to apply these changes through Prisma.
-- This SQL file is for documentation and manual database administration purposes.

-- =============================================================================
-- EVENT TABLE INDEXES
-- =============================================================================
-- The events table is the most heavily queried table in DevLog Hub.
-- These composite indexes optimize common query patterns.

-- Index: User Timeline Queries
-- Use case: Fetching events for a specific user, ordered by time
-- Query pattern: WHERE user_id = ? ORDER BY local_timestamp DESC
CREATE INDEX IF NOT EXISTS idx_events_user_timeline
ON events (user_id, local_timestamp DESC);

-- EXPLAIN ANALYZE example:
-- EXPLAIN ANALYZE SELECT * FROM events
-- WHERE user_id = 'user-uuid'
-- ORDER BY local_timestamp DESC
-- LIMIT 20;

-- Index: Project Timeline Queries
-- Use case: Fetching events for a specific project
-- Query pattern: WHERE project_id = ? ORDER BY local_timestamp DESC
CREATE INDEX IF NOT EXISTS idx_events_project_timeline
ON events (project_id, local_timestamp DESC);

-- Index: Agent Activity Queries
-- Use case: Monitoring agent sync activity
-- Query pattern: WHERE agent_id = ? ORDER BY local_timestamp DESC
CREATE INDEX IF NOT EXISTS idx_events_agent_activity
ON events (agent_id, local_timestamp DESC);

-- Index: Event Type Filtering
-- Use case: Filtering by event type (git, file, terminal, manual)
-- Query pattern: WHERE event_type = ? ORDER BY local_timestamp DESC
CREATE INDEX IF NOT EXISTS idx_events_type_timeline
ON events (event_type, local_timestamp DESC);

-- Index: User + Type Combined Queries
-- Use case: User events filtered by type
-- Query pattern: WHERE user_id = ? AND event_type = ? ORDER BY local_timestamp DESC
CREATE INDEX IF NOT EXISTS idx_events_user_type_timeline
ON events (user_id, event_type, local_timestamp DESC);

-- Index: User + Project Combined Queries
-- Use case: User events for a specific project
-- Query pattern: WHERE user_id = ? AND project_id = ? ORDER BY local_timestamp DESC
CREATE INDEX IF NOT EXISTS idx_events_user_project_timeline
ON events (user_id, project_id, local_timestamp DESC);

-- Index: Comprehensive Query Index
-- Use case: Dashboard queries with multiple filters
-- Query pattern: WHERE user_id = ? AND event_type = ? AND project_id = ? ORDER BY local_timestamp DESC
CREATE INDEX IF NOT EXISTS idx_events_comprehensive
ON events (user_id, event_type, project_id, local_timestamp DESC);

-- =============================================================================
-- REPORT TABLE INDEXES
-- =============================================================================

-- Index: User Report Timeline
-- Use case: Listing user's reports by creation date
CREATE INDEX IF NOT EXISTS idx_reports_user_timeline
ON reports (user_id, created_at DESC);

-- Index: User Reports by Type
-- Use case: Filtering reports by type (daily, weekly, monthly)
CREATE INDEX IF NOT EXISTS idx_reports_user_type_timeline
ON reports (user_id, report_type, created_at DESC);

-- Index: User Reports by Project
-- Use case: Filtering reports for a specific project
CREATE INDEX IF NOT EXISTS idx_reports_user_project_timeline
ON reports (user_id, project_id, created_at DESC);

-- Index: User Reports by Status
-- Use case: Finding reports by generation status
CREATE INDEX IF NOT EXISTS idx_reports_user_status
ON reports (user_id, status, created_at DESC);

-- =============================================================================
-- NOTE TABLE INDEXES
-- =============================================================================

-- Index: User Notes Timeline
-- Use case: Listing user's notes by creation date
CREATE INDEX IF NOT EXISTS idx_notes_user_timeline
ON notes (user_id, created_at DESC);

-- Index: User Notes by Update Time
-- Use case: Finding recently edited notes
CREATE INDEX IF NOT EXISTS idx_notes_user_updated
ON notes (user_id, updated_at DESC);

-- =============================================================================
-- NOTIFICATION TABLE INDEXES
-- =============================================================================
-- Note: The notification table already has a composite index on (user_id, read, created_at)

-- =============================================================================
-- QUERY PERFORMANCE ANALYSIS
-- =============================================================================
-- Use these queries to analyze index effectiveness:

-- Check index usage statistics:
-- SELECT
--   schemaname,
--   relname AS table_name,
--   indexrelname AS index_name,
--   idx_scan AS times_used,
--   idx_tup_read AS tuples_read,
--   idx_tup_fetch AS tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Check table size and index size:
-- SELECT
--   relname AS table_name,
--   pg_size_pretty(pg_table_size(relid)) AS table_size,
--   pg_size_pretty(pg_indexes_size(relid)) AS indexes_size,
--   pg_size_pretty(pg_total_relation_size(relid)) AS total_size
-- FROM pg_stat_user_tables
-- ORDER BY pg_total_relation_size(relid) DESC;

-- Identify missing indexes (unused indexes):
-- SELECT
--   schemaname,
--   relname AS table_name,
--   indexrelname AS index_name,
--   idx_scan
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0
-- AND schemaname = 'public';

-- =============================================================================
-- MAINTENANCE RECOMMENDATIONS
-- =============================================================================
-- 1. Run ANALYZE after bulk data imports:
--    ANALYZE events;
--    ANALYZE reports;
--    ANALYZE notes;

-- 2. Monitor slow queries with pg_stat_statements extension
-- 3. Consider VACUUM ANALYZE for optimal query planning after large deletes
-- 4. Review index usage monthly and drop unused indexes

-- =============================================================================
-- EXAMPLE EXPLAIN ANALYZE QUERIES
-- =============================================================================

-- User timeline query (should use idx_events_user_timeline):
-- EXPLAIN ANALYZE
-- SELECT id, event_type, event_action, title, local_timestamp
-- FROM events
-- WHERE user_id = 'user-uuid'
-- ORDER BY local_timestamp DESC
-- LIMIT 20;

-- User + type filter (should use idx_events_user_type_timeline):
-- EXPLAIN ANALYZE
-- SELECT id, event_type, event_action, title, local_timestamp
-- FROM events
-- WHERE user_id = 'user-uuid'
--   AND event_type = 'git'
-- ORDER BY local_timestamp DESC
-- LIMIT 20;

-- Date range aggregation (should use idx_events_user_timeline):
-- EXPLAIN ANALYZE
-- SELECT DATE(local_timestamp) as date, COUNT(*) as count
-- FROM events
-- WHERE user_id = 'user-uuid'
--   AND local_timestamp >= NOW() - INTERVAL '7 days'
-- GROUP BY DATE(local_timestamp)
-- ORDER BY date DESC;
