import { CustomerFeedback, CustomerMessage } from '@/types/customer-care'
import { Customer } from '@/lib/customer-api'

interface FetchCustomerCareParams {
  page?: number
  limit?: number
  priority?: string
  status?: string
  search?: string
}

interface CustomerCareResponse {
  data: Customer[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export async function fetchCustomerCare(params: FetchCustomerCareParams = {}): Promise<CustomerCareResponse> {
  const searchParams = new URLSearchParams()
  
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.priority) searchParams.set('priority', params.priority)
  if (params.status) searchParams.set('status', params.status)
  if (params.search) searchParams.set('search', params.search)

  const response = await fetch(`/api/customer-care?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch customer care data')
  }
  return response.json()
}

export async function fetchCustomerFeedback(customerId: string): Promise<CustomerFeedback[]> {
  const response = await fetch(`/api/customer-care/feedback/${customerId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch customer feedback')
  }
  const { data } = await response.json()
  return data
}

interface CreateFeedbackParams {
  customer_id: string
  feedback_type: 'treatment' | 'general' | 'follow_up'
  feedback_content: string
  customer_reaction?: string
  next_appointment_date?: string
  treatment_session_id?: string
}

export async function createFeedback(params: CreateFeedbackParams): Promise<CustomerFeedback> {
  const response = await fetch(`/api/customer-care/feedback/${params.customer_id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error('Failed to create feedback')
  }

  const { data } = await response.json()
  return data
}

interface SendMessageParams {
  customer_id: string
  message_type: 'appointment_reminder' | 'post_treatment_care' | 'promotion' | 'custom'
  message_content: string
}

interface SendMessageResponse {
  data: CustomerMessage
  webhookStatus: 'success' | 'error'
}

export async function sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
  const response = await fetch('/api/customer-care/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error('Failed to send message')
  }

  return response.json()
}

export async function fetchCustomerMessages(customerId: string): Promise<CustomerMessage[]> {
  const response = await fetch(`/api/customer-care/messages?customerId=${customerId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch customer messages')
  }
  const { data } = await response.json()
  return data
} 

export async function updateCustomerPriority(customerId: string, priority: 'high' | 'normal'): Promise<Customer> {
  const response = await fetch(`/api/customer-care/priority/${customerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ priority }),
  })

  if (!response.ok) {
    throw new Error('Failed to update customer priority')
  }

  const { data } = await response.json()
  return data
} 