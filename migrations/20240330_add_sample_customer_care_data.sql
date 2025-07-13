-- Thêm dữ liệu mẫu cho customer_care_status
INSERT INTO customer_care_status (customer_id, priority, status, next_contact_date, last_contact_date, assigned_to, notes)
SELECT 
  c.id,
  CASE WHEN random() < 0.3 THEN 'high'::customer_care_priority ELSE 'normal'::customer_care_priority END,
  CASE 
    WHEN random() < 0.6 THEN 'active'::customer_care_status_type
    WHEN random() < 0.8 THEN 'follow_up'::customer_care_status_type
    ELSE 'completed'::customer_care_status_type
  END,
  CURRENT_DATE + (random() * 30)::integer,
  CURRENT_DATE - (random() * 30)::integer,
  (SELECT id FROM users ORDER BY random() LIMIT 1),
  'Ghi chú mẫu cho khách hàng'
FROM customers c
LIMIT 20;

-- Thêm dữ liệu mẫu cho customer_feedback
INSERT INTO customer_feedback (
  customer_id,
  treatment_session_id,
  feedback_type,
  feedback_content,
  customer_reaction,
  next_appointment_date,
  recorded_by
)
SELECT 
  ccs.customer_id,
  ts.id,
  CASE 
    WHEN random() < 0.4 THEN 'treatment'::feedback_type
    WHEN random() < 0.7 THEN 'general'::feedback_type
    ELSE 'follow_up'::feedback_type
  END,
  'Phản hồi mẫu từ khách hàng sau buổi điều trị',
  'Không có phản ứng bất thường',
  CURRENT_DATE + (random() * 14)::integer,
  (SELECT id FROM users ORDER BY random() LIMIT 1)
FROM customer_care_status ccs
LEFT JOIN treatments t ON t.customer_id = ccs.customer_id
LEFT JOIN treatment_sessions ts ON ts.treatment_id = t.id
WHERE ts.id IS NOT NULL
LIMIT 30;

-- Thêm dữ liệu mẫu cho customer_messages
INSERT INTO customer_messages (
  customer_id,
  message_type,
  message_content,
  sent_at,
  sent_by,
  delivery_status
)
SELECT 
  ccs.customer_id,
  CASE 
    WHEN random() < 0.3 THEN 'appointment_reminder'::message_type
    WHEN random() < 0.6 THEN 'post_treatment_care'::message_type
    WHEN random() < 0.8 THEN 'promotion'::message_type
    ELSE 'custom'::message_type
  END,
  CASE 
    WHEN random() < 0.3 THEN 'Nhắc lịch hẹn điều trị ngày mai'
    WHEN random() < 0.6 THEN 'Hướng dẫn chăm sóc sau điều trị'
    WHEN random() < 0.8 THEN 'Thông báo chương trình khuyến mãi đặc biệt'
    ELSE 'Tin nhắn chăm sóc khách hàng'
  END,
  CURRENT_TIMESTAMP - (random() * interval '7 days'),
  (SELECT id FROM users ORDER BY random() LIMIT 1),
  CASE 
    WHEN random() < 0.7 THEN 'delivered'
    WHEN random() < 0.9 THEN 'sent'
    ELSE 'pending'
  END
FROM customer_care_status ccs
LIMIT 50; 