-- Add after_sales_care column to treatment_sessions table
ALTER TABLE public.treatment_sessions
ADD COLUMN after_sales_care text;

COMMENT ON COLUMN public.treatment_sessions.after_sales_care IS 'Thông tin chăm sóc sau bán'; 