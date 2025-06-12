-- Bắt đầu transaction để đảm bảo tính nhất quán của dữ liệu
BEGIN;

-- 1. Tạm thời bỏ ràng buộc để có thể cập nhật dữ liệu
ALTER TABLE treatments DROP CONSTRAINT IF EXISTS check_current_session_non_negative;
ALTER TABLE treatments DROP CONSTRAINT IF EXISTS check_current_session_not_exceed_total;

-- 2. Giảm current_session đi 1 cho tất cả các liệu trình
UPDATE treatments 
SET current_session = current_session - 1 
WHERE current_session > 0;

-- 3. Giảm session_number đi 1 cho tất cả các buổi điều trị
UPDATE treatment_sessions 
SET session_number = session_number - 1;

-- 4. Thêm lại các ràng buộc
ALTER TABLE treatments 
    ADD CONSTRAINT check_current_session_non_negative 
    CHECK (current_session >= 0);

ALTER TABLE treatments 
    ADD CONSTRAINT check_current_session_not_exceed_total 
    CHECK (current_session <= total_sessions);

-- 5. Cập nhật trạng thái của các liệu trình
-- Đánh dấu hoàn thành cho các liệu trình đã đạt đủ số buổi
UPDATE treatments 
SET status = 'completed' 
WHERE current_session = total_sessions;

-- Đánh dấu đang điều trị cho các liệu trình chưa hoàn thành
UPDATE treatments 
SET status = 'active' 
WHERE current_session < total_sessions;

-- Kết thúc transaction
COMMIT; 