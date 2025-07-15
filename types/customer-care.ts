export interface CustomerCareStatus {
  id: string
  customer_id: string
  priority: 'normal' | 'high'
  status: 'active' | 'follow_up' | 'completed'
  next_contact_date: string | null
  last_contact_date: string | null
  assigned_to: number | null
  notes: string | null
  created_at: string
  updated_at: string
  customers?: {
    id: string
    name: string
    phone: string
  }
  users?: {
    id: number
    full_name: string
  }
  treatments?: {
    id: string
    treatment_name: string
    total_sessions: number
    current_session: number
  }
}

export interface CustomerMessage {
  id: string
  customer_id: string
  message_type: 'appointment_reminder' | 'post_treatment_care' | 'promotion' | 'custom'
  message_content: string
  sent_at: string
  sent_by: number
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed'
  created_at: string
  users?: {
    id: number
    full_name: string
  }
} 