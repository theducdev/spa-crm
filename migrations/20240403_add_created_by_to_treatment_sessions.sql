-- Add created_by column to treatment_sessions table
ALTER TABLE treatment_sessions 
ADD COLUMN created_by integer,
ADD CONSTRAINT treatment_sessions_created_by_fkey 
    FOREIGN KEY (created_by) 
    REFERENCES users(id);

-- Cập nhật dữ liệu cũ, set created_by là user admin đầu tiên
UPDATE treatment_sessions
SET created_by = (
  SELECT id 
  FROM users 
  WHERE role = 'admin' 
  ORDER BY created_at ASC 
  LIMIT 1
)
WHERE created_by IS NULL;

COMMENT ON COLUMN treatment_sessions.created_by IS 'ID của người tạo phiên điều trị';