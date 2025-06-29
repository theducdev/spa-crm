ALTER TABLE treatment_sessions
ADD COLUMN products_sold JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN treatment_sessions.products_sold IS 'List of products sold during the treatment session'; 