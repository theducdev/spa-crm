-- Xóa bảng customer_care_status và các type enum không cần thiết
DROP TABLE IF EXISTS customer_care_status;
DROP TYPE IF EXISTS customer_care_status_type;

-- Tạo enum type cho priority nếu chưa tồn tại
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_care_priority') THEN
        CREATE TYPE customer_care_priority AS ENUM ('normal', 'high');
    END IF;
END $$;

-- Thêm cột priority vào customers nếu chưa tồn tại
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'care_priority') 
    THEN
        ALTER TABLE customers 
        ADD COLUMN care_priority customer_care_priority NOT NULL DEFAULT 'normal';
    END IF;
END $$;

-- Tạo index nếu chưa tồn tại
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
        WHERE tablename = 'customers' AND indexname = 'idx_customers_care_priority') 
    THEN
        CREATE INDEX idx_customers_care_priority ON customers(care_priority);
    END IF;
END $$;

-- Thêm comment để giải thích ý nghĩa của cột
COMMENT ON COLUMN customers.care_priority IS 'Mức độ ưu tiên chăm sóc khách hàng (normal/high)'; 