-- Thêm cột status_id vào bảng appointments
ALTER TABLE appointments 
ADD COLUMN status_id uuid REFERENCES appointment_statuses(id);

-- Cập nhật dữ liệu cũ từ status string sang status_id
UPDATE appointments 
SET status_id = (
  SELECT id 
  FROM appointment_statuses 
  WHERE code = appointments.status
)
WHERE status_id IS NULL;

-- Đặt NOT NULL constraint sau khi cập nhật xong
ALTER TABLE appointments 
ALTER COLUMN status_id SET NOT NULL;

-- Tạo index cho status_id
CREATE INDEX idx_appointments_status_id ON appointments(status_id);

-- Tạo foreign key constraint
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_status_id 
FOREIGN KEY (status_id) REFERENCES appointment_statuses(id);

-- Lưu ý: Cột status cũ vẫn giữ lại để đảm bảo tương thích ngược
-- Có thể xóa sau khi đã migrate hoàn toàn sang status_id
-- ALTER TABLE appointments DROP COLUMN status; 