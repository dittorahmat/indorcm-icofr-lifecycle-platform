-- =============================================================================
-- Cross-App & Cross-Server PostgreSQL Access Setup Template for ICOFR Data
-- =============================================================================
-- Run this script in PostgreSQL console / pgAdmin to create external app user.

-- 1. Create a dedicated user for external application
CREATE USER external_app_user WITH PASSWORD 'StrongPassword123!';

-- 2. Grant connection permission to target database
GRANT CONNECT ON DATABASE current_database() TO external_app_user;

-- 3. Grant access to 'icofr' schema
GRANT USAGE ON SCHEMA icofr TO external_app_user;

-- 4. Grant Read-Only (SELECT) access to all current and future tables in 'icofr' schema
GRANT SELECT ON ALL TABLES IN SCHEMA icofr TO external_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA icofr GRANT SELECT ON TABLES TO external_app_user;

-- 5. Set default search_path so external app can query tables easily
ALTER USER external_app_user SET search_path TO icofr, public;

-- =============================================================================
-- Connection String for External App / Cross Server:
-- postgresql://external_app_user:StrongPassword123!@YOUR_POSTGRES_HOST:5432/YOUR_DB_NAME?options=-c%20search_path%3Dicofr,public
-- =============================================================================
