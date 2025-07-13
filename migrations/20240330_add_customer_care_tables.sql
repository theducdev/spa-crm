-- Tạo enum cho priority và status
CREATE TYPE customer_care_priority AS ENUM ('normal', 'high');
CREATE TYPE customer_care_status_type AS ENUM ('active', 'follow_up', 'completed');
CREATE TYPE message_type AS ENUM ('appointment_reminder', 'post_treatment_care', 'promotion', 'custom');
CREATE TYPE feedback_type AS ENUM ('treatment', 'general', 'follow_up');

-- Tạo bảng customer_care_status để theo dõi trạng thái chăm sóc
CREATE TABLE public.customer_care_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  priority customer_care_priority NOT NULL DEFAULT 'normal',
  status customer_care_status_type NOT NULL DEFAULT 'active',
  next_contact_date date,
  last_contact_date date,
  assigned_to INTEGER REFERENCES users(id), -- Nhân viên phụ trách
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT customer_care_status_pkey PRIMARY KEY (id),
  CONSTRAINT customer_care_status_customer_fk FOREIGN KEY (customer_id) 
    REFERENCES public.customers(id) ON DELETE CASCADE
);

-- Tạo bảng customer_feedback để lưu trữ phản hồi
CREATE TABLE public.customer_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  treatment_session_id uuid,
  feedback_type feedback_type NOT NULL,
  feedback_content text NOT NULL,
  customer_reaction text,
  next_appointment_date date,
  recorded_by INTEGER NOT NULL REFERENCES users(id), -- Người ghi nhận feedback
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT customer_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT customer_feedback_customer_fk FOREIGN KEY (customer_id) 
    REFERENCES public.customers(id) ON DELETE CASCADE,
  CONSTRAINT customer_feedback_session_fk FOREIGN KEY (treatment_session_id) 
    REFERENCES public.treatment_sessions(id) ON DELETE SET NULL
);

-- Tạo bảng customer_messages để lưu trữ lịch sử tin nhắn
CREATE TABLE public.customer_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  message_type message_type NOT NULL,
  message_content text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  sent_by INTEGER NOT NULL REFERENCES users(id),
  delivery_status varchar(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  created_at timestamptz DEFAULT now(),
  CONSTRAINT customer_messages_pkey PRIMARY KEY (id),
  CONSTRAINT customer_messages_customer_fk FOREIGN KEY (customer_id) 
    REFERENCES public.customers(id) ON DELETE CASCADE
);

-- Tạo các index cần thiết
CREATE INDEX idx_customer_care_status_customer_id ON public.customer_care_status(customer_id);
CREATE INDEX idx_customer_care_status_priority ON public.customer_care_status(priority);
CREATE INDEX idx_customer_care_status_status ON public.customer_care_status(status);
CREATE INDEX idx_customer_care_status_next_contact ON public.customer_care_status(next_contact_date);
CREATE INDEX idx_customer_care_status_assigned_to ON public.customer_care_status(assigned_to);

CREATE INDEX idx_customer_feedback_customer_id ON public.customer_feedback(customer_id);
CREATE INDEX idx_customer_feedback_session_id ON public.customer_feedback(treatment_session_id);
CREATE INDEX idx_customer_feedback_created_at ON public.customer_feedback(created_at);
CREATE INDEX idx_customer_feedback_recorded_by ON public.customer_feedback(recorded_by);

CREATE INDEX idx_customer_messages_customer_id ON public.customer_messages(customer_id);
CREATE INDEX idx_customer_messages_sent_at ON public.customer_messages(sent_at);
CREATE INDEX idx_customer_messages_sent_by ON public.customer_messages(sent_by);
CREATE INDEX idx_customer_messages_delivery_status ON public.customer_messages(delivery_status);

-- Tạo triggers để tự động cập nhật updated_at
CREATE TRIGGER update_customer_care_status_updated_at
    BEFORE UPDATE ON customer_care_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_feedback_updated_at
    BEFORE UPDATE ON customer_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 