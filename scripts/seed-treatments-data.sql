-- Thêm dữ liệu mẫu cho bảng treatments
INSERT INTO treatments (customer_id, treatment_name, total_sessions, current_session, start_date, price, status, notes) 
SELECT 
  c.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 1 THEN 'Điều trị mụn'
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 2 THEN 'Laser tàn nhang'
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 3 THEN 'Căng da mặt'
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 4 THEN 'Điều trị sẹo'
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 5 THEN 'Trắng da toàn thân'
    ELSE 'Chống lão hóa'
  END as treatment_name,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 1 THEN 6
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 2 THEN 8
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 3 THEN 4
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 4 THEN 10
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 5 THEN 12
    ELSE 6
  END as total_sessions,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 3 = 1 THEN 2
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 3 = 2 THEN 4
    ELSE 1
  END as current_session,
  CURRENT_DATE - INTERVAL '30 days' + (ROW_NUMBER() OVER (ORDER BY c.created_at) * INTERVAL '5 days') as start_date,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 1 THEN 5000000
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 2 THEN 8000000
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 3 THEN 6000000
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 4 THEN 12000000
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 6 = 5 THEN 15000000
    ELSE 7000000
  END as price,
  'active' as status,
  'Liệu trình điều trị theo kế hoạch' as notes
FROM customers c
WHERE c.status = 'active'
LIMIT 8;
