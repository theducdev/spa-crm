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

export interface CustomerFeedback {
  id: string
  customer_id: string
  treatment_session_id: string | null
  feedback_type: 'treatment' | 'general' | 'follow_up'
  feedback_content: string
  customer_reaction: string | null
  next_appointment_date: string | null
  recorded_by: number
  created_at: string
  updated_at: string
  users?: {
    id: number
    full_name: string
  }
  treatment_sessions?: {
    id: string
    session_number: number
    session_date: string
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