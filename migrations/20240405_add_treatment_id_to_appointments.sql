-- Thêm column treatment_id
ALTER TABLE public.appointments
ADD COLUMN treatment_id uuid NULL;

-- Thêm foreign key
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_treatment_id_fkey 
    FOREIGN KEY (treatment_id) 
    REFERENCES treatments(id) 
    ON DELETE SET NULL;

-- Thêm index để tối ưu query
CREATE INDEX idx_appointments_treatment_id 
    ON appointments(treatment_id);
