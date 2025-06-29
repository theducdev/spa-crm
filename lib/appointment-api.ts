import { supabase } from "./supabase"

export interface Appointment {
  id: string
  customer_id: string
  appointment_date: string
  appointment_time: string
  status: "pending" | "confirmed" | "cancelled"
  notes?: string
  created_by: number
  created_at: string
  updated_at: string
}

// Lấy danh sách lịch hẹn
export async function getAppointments() {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      customers (
        id,
        name
      ),
      created_by_user:users!created_by (
        id,
        full_name
      )
    `)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
  return data
}

// Lấy thông tin một lịch hẹn
export async function getAppointment(id: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      customers (
        id,
        name
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
  return data
}

// Tạo lịch hẹn mới
export async function createAppointment(appointmentData: Partial<Appointment>) {
  const { data, error } = await supabase
    .from("appointments")
    .insert([{
      customer_id: appointmentData.customer_id,
      appointment_date: appointmentData.appointment_date,
      appointment_time: appointmentData.appointment_time,
      status: appointmentData.status || "pending",
      notes: appointmentData.notes,
      created_by: appointmentData.created_by
    }])
    .select()
    .single()

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
  return data as Appointment
}

// Cập nhật lịch hẹn
export async function updateAppointment(id: string, appointmentData: Partial<Appointment>) {
  const { data, error } = await supabase
    .from("appointments")
    .update({
      customer_id: appointmentData.customer_id,
      appointment_date: appointmentData.appointment_date,
      appointment_time: appointmentData.appointment_time,
      status: appointmentData.status,
      notes: appointmentData.notes
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
  return data as Appointment
}

// Xóa lịch hẹn
export async function deleteAppointment(id: string) {
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
} 