-- Cập nhật dữ liệu mẫu cho cột products_sold
UPDATE treatment_sessions
SET products_sold = CASE 
  WHEN session_number % 3 = 1 THEN '[
    {"product": "Serum Vitamin C", "usage_times": ["morning"]},
    {"product": "Kem dưỡng ẩm", "usage_times": ["morning", "evening"]}
  ]'::jsonb
  WHEN session_number % 3 = 2 THEN '[
    {"product": "Toner BHA", "usage_times": ["evening"]},
    {"product": "Kem chống nắng SPF50", "usage_times": ["morning"]}
  ]'::jsonb
  ELSE '[
    {"product": "Mặt nạ collagen", "usage_times": ["evening"]},
    {"product": "Tinh chất phục hồi", "usage_times": ["night"]}
  ]'::jsonb
END
WHERE products_sold IS NULL; 