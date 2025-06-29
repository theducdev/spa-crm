-- Thêm cột created_by vào bảng appointments
ALTER TABLE appointments
ADD COLUMN created_by INTEGER REFERENCES users(id);

-- Cập nhật dữ liệu cũ, set created_by là user admin đầu tiên
UPDATE appointments
SET created_by = (
  SELECT id 
  FROM users 
  WHERE role = 'admin' 
  ORDER BY created_at ASC 
  LIMIT 1
)
WHERE created_by IS NULL; 