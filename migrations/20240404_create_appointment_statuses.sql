-- Tạo bảng appointment_statuses
CREATE TABLE public.appointment_statuses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code varchar(50) NOT NULL UNIQUE, -- 'pending', 'confirmed', 'cancelled'
  name varchar(100) NOT NULL, -- 'Chờ xác nhận', 'Đã xác nhận', 'Đã hủy'
  color varchar(20) DEFAULT 'gray', -- 'yellow', 'green', 'red', 'blue'
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT appointment_statuses_pkey PRIMARY KEY (id)
);

-- Thêm dữ liệu mặc định
INSERT INTO appointment_statuses (code, name, color, sort_order) VALUES
('pending', 'Chờ xác nhận', 'yellow', 1),
('confirmed', 'Đã xác nhận', 'green', 2),
('cancelled', 'Đã hủy', 'red', 3);

-- Tạo index
CREATE INDEX idx_appointment_statuses_code ON appointment_statuses(code);
CREATE INDEX idx_appointment_statuses_active ON appointment_statuses(is_active);
CREATE INDEX idx_appointment_statuses_sort_order ON appointment_statuses(sort_order);

-- Tạo trigger để tự động cập nhật updated_at
CREATE TRIGGER update_appointment_statuses_updated_at
  BEFORE UPDATE ON appointment_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 