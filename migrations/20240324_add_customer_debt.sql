-- Thêm cột debt vào bảng customers
ALTER TABLE customers ADD COLUMN debt BIGINT DEFAULT 0;

-- Cập nhật giá trị mặc định cho các bản ghi hiện có
UPDATE customers SET debt = 0 WHERE debt IS NULL;

-- Đảm bảo giá trị debt không âm
ALTER TABLE customers ADD CONSTRAINT check_debt_non_negative CHECK (debt >= 0); 