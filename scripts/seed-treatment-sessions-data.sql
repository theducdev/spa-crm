-- Thêm dữ liệu mẫu cho treatment_sessions
WITH treatment_data AS (
  SELECT 
    t.id as treatment_id,
    t.current_session,
    t.start_date,
    generate_series(1, t.current_session) as session_number
  FROM treatments t
  WHERE t.status = 'active'
)
INSERT INTO treatment_sessions (treatment_id, session_number, session_date, products_used, skin_condition, reaction, notes)
SELECT 
  td.treatment_id,
  td.session_number,
  td.start_date + (td.session_number - 1) * INTERVAL '7 days' as session_date,
  CASE 
    WHEN td.session_number % 3 = 1 THEN 'Serum Vitamin C, Kem dưỡng ẩm'
    WHEN td.session_number % 3 = 2 THEN 'Toner BHA, Kem chống nắng SPF50'
    ELSE 'Mặt nạ collagen, Tinh chất phục hồi'
  END as products_used,
  CASE 
    WHEN td.session_number % 3 = 1 THEN 'Da khô, có mụn đầu đen'
    WHEN td.session_number % 3 = 2 THEN 'Da cải thiện, ít mụn hơn'
    ELSE 'Da mịn màng, sáng hơn'
  END as skin_condition,
  CASE 
    WHEN td.session_number % 3 = 1 THEN 'Hơi đỏ sau điều trị, bình thường sau 2h'
    WHEN td.session_number % 3 = 2 THEN 'Không có phản ứng bất thường'
    ELSE 'Da hơi khô, cần dưỡng ẩm nhiều hơn'
  END as reaction,
  'Buổi điều trị diễn ra tốt, khách hàng hài lòng' as notes
FROM treatment_data td;
