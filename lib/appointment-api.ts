import { supabase } from "./supabase"
import { getDefaultStatusId } from "./appointment-status-api"

export interface Appointment {
  id: string
  customer_id: string
  appointment_date: string
  appointment_time: string
  status_id: string
  notes?: string
  created_by: number
  created_at: string
  updated_at: string
  treatment_id?: string
  appointment_status?: {
    id: string
    code: string
    name: string
    color: string
  }
}

// Lấy danh sách lịch hẹn
export async function getAppointments(filters?: { 
  fromDate?: string
  toDate?: string
  filterByCreatedAt?: boolean
}, page?: number, pageSize?: number) {
  let query = supabase
    .from("appointments")
    .select(`
      *,
      appointment_status:appointment_statuses!fk_appointments_status_id (
        id,
        code,
        name,
        color
      ),
      customers (
        id,
        name,
        phone,
        debt
      ),
      created_by_user:users!created_by (
        id,
        full_name
      )
    `, { count: 'exact' })

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



  // Thêm phân trang nếu có
  if (page && pageSize) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query
    .order(filters?.filterByCreatedAt ? "created_at" : "appointment_date", { ascending: true })
    .order(filters?.filterByCreatedAt ? "created_at" : "appointment_time", { ascending: true })

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
  
  return { data, total: count || 0 }
}

// Lấy thông tin một lịch hẹn
export async function getAppointment(id: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      appointment_status:appointment_statuses!fk_appointments_status_id (
        id,
        code,
        name,
        color
      ),
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
      status_id: appointmentData.status_id || await getDefaultStatusId(),
      notes: appointmentData.notes,
      created_by: appointmentData.created_by,
      treatment_id: appointmentData.treatment_id
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
      status_id: appointmentData.status_id,
      notes: appointmentData.notes,
      treatment_id: appointmentData.treatment_id
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
    const staffId = Array.isArray(curr.created_by_user) ? curr.created_by_user[0]?.id : curr.created_by_user?.id
    const existingStaff = acc.find(
      (item) => {
        const itemStaffId = Array.isArray(item.created_by_user) ? item.created_by_user[0]?.id : item.created_by_user?.id
        return itemStaffId === staffId
      }
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
      appointment_status:appointment_statuses!fk_appointments_status_id (
        id,
        code,
        name,
        color
      ),
      customers (
        id,
        name,
        phone,
        debt
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

// Lấy danh sách lịch hẹn trong ngày
export async function getTodayAppointments() {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      appointment_status:appointment_statuses!fk_appointments_status_id (
        id,
        code,
        name,
        color
      ),
      customer:customers (
        id,
        name,
        debt,
        tag:customer_tags (
          id,
          name,
          color
        ),
        treatments (
          id,
          treatment_name,
          total_sessions,
          current_session
        )
      )
    `)
    .eq("appointment_date", today)
    .order("appointment_time", { ascending: true })

  if (error) {
    console.error("Error fetching today's appointments:", error)
    throw new Error("Không thể lấy danh sách lịch hẹn hôm nay")
  }

  return data.map(appointment => ({
    id: appointment.id,
    customerId: appointment.customer?.id || "",
    name: appointment.customer?.name || "Không xác định",
    time: appointment.appointment_time.slice(0, 5), // Format HH:mm
    treatment: appointment.customer?.treatments?.[0]?.treatment_name || "Chưa có liệu trình",
    session: appointment.customer?.treatments?.[0] 
      ? `${appointment.customer.treatments[0].current_session}/${appointment.customer.treatments[0].total_sessions}`
      : "-",
         status: appointment.appointment_status?.code || "pending"
  }))
} 