import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  gender?: string
  birth_date?: string
  address?: string
  uid_zalo?: string
  created_at: string
  updated_at: string
}

export interface Treatment {
  id: string
  customer_id: string
  treatment_name: string
  total_sessions: number
  current_session: number
  start_date: string
  end_date?: string
  price?: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
  customer?: Customer
}

export type TreatmentSession = {
  id: string
  treatment_id: string
  session_number: number
  session_date: string | null
  products_used: string | null
  skin_condition: string | null
  reaction: string | null
  next_appointment: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  products_sold: string | null
  after_sales_care: string | null // Thêm trường mới
  treatment_images?: TreatmentImage[]
}

export interface TreatmentImage {
  id: string
  session_id: string
  image_type: "before" | "after"
  image_url: string
  storage_path: string
  file_type: "image" | "video"
  created_at: string
}
