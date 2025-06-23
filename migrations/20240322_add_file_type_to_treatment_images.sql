-- Thêm cột file_type vào bảng treatment_images
ALTER TABLE treatment_images
ADD COLUMN file_type text CHECK (file_type IN ('image', 'video')) DEFAULT 'image' NOT NULL;

-- Cập nhật dữ liệu cũ
UPDATE treatment_images
SET file_type = 'image'
WHERE file_type IS NULL; 