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
export async function getAppointments(filters?: { 
  fromDate?: string
  toDate?: string
  filterByCreatedAt?: boolean 
}) {
  let query = supabase
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

  // Thêm điều kiện lọc theo thời gian
  if (filters?.fromDate) {
    if (filters.filterByCreatedAt) {
      query = query.gte("created_at", `${filters.fromDate}T00:00:00`)
    } else {
      query = query.gte("appointment_date", filters.fromDate)
    }
  }
  if (filters?.toDate) {
    if (filters.filterByCreatedAt) {
      query = query.lte("created_at", `${filters.toDate}T23:59:59`)
    } else {
      query = query.lte("appointment_date", filters.toDate)
    }
  }

  const { data, error } = await query
    .order(filters?.filterByCreatedAt ? "created_at" : "appointment_date", { ascending: true })
    .order(filters?.filterByCreatedAt ? "created_at" : "appointment_time", { ascending: true })

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

// Lấy thống kê nhân viên
export async function getStaffStats() {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      created_by,
      created_by_user:users!created_by (
        id,
        full_name
      )
    `)
    .not('created_by', 'is', null)

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }

  // Group và đếm số lượng lịch hẹn theo nhân viên
  const stats = data.reduce((acc: any[], curr) => {
    const existingStaff = acc.find(
      (item) => item.created_by_user.id === curr.created_by_user.id
    )
    
    if (existingStaff) {
      existingStaff.total_appointments++
    } else {
      acc.push({
        created_by_user: curr.created_by_user,
        total_appointments: 1
      })
    }
    
    return acc
  }, [])

  // Sắp xếp theo số lượng lịch hẹn giảm dần
  return stats.sort((a, b) => b.total_appointments - a.total_appointments)
}

// Lấy danh sách lịch hẹn theo nhân viên
export async function getStaffAppointments(staffId: number) {
  const { data, error } = await supabase
    .from('appointments')
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
    .eq('created_by', staffId)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false })

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
  return data
} 