-- Thêm cột uid_zalo vào bảng customers
ALTER TABLE customers
ADD COLUMN uid_zalo VARCHAR(255);

-- Thêm comment cho cột
COMMENT ON COLUMN customers.uid_zalo IS 'ID của người dùng trên Zalo';

-- Tạo index để tối ưu tìm kiếm
CREATE INDEX idx_customers_uid_zalo ON customers(uid_zalo); 