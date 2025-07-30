-- Script chạy migration cho appointment statuses
-- Chạy từng file migration theo thứ tự

-- 1. Tạo bảng appointment_statuses
\i migrations/20240404_create_appointment_statuses.sql

-- 2. Cập nhật bảng appointments
\i migrations/20240404_update_appointments_status.sql

-- Kiểm tra kết quả
SELECT 'appointment_statuses' as table_name, COUNT(*) as count FROM appointment_statuses
UNION ALL
SELECT 'appointments with status_id' as table_name, COUNT(*) as count FROM appointments WHERE status_id IS NOT NULL; 