-- Thay đổi giá trị mặc định của current_session từ 1 thành 0
ALTER TABLE treatments 
    ALTER COLUMN current_session SET DEFAULT 0;

-- Cập nhật các bản ghi hiện tại có current_session là NULL thành 0
UPDATE treatments 
SET current_session = 0 
WHERE current_session IS NULL;

-- Thêm ràng buộc kiểm tra current_session không được âm
ALTER TABLE treatments 
    ADD CONSTRAINT check_current_session_non_negative 
    CHECK (current_session >= 0);

-- Thêm ràng buộc kiểm tra current_session không được vượt quá total_sessions
ALTER TABLE treatments 
    ADD CONSTRAINT check_current_session_not_exceed_total 
    CHECK (current_session <= total_sessions); 