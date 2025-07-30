import { supabase } from "./supabase"

export interface AppointmentStatus {
  id: string
  code: string
  name: string
  color: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Lấy tất cả trạng thái
export async function getAppointmentStatuses() {
  const { data, error } = await supabase
    .from("appointment_statuses")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
  return data
}

// Lấy trạng thái theo code
export async function getAppointmentStatusByCode(code: string) {
  const { data, error } = await supabase
    .from("appointment_statuses")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
  return data
}

// Lấy trạng thái theo ID
export async function getAppointmentStatusById(id: string) {
  const { data, error } = await supabase
    .from("appointment_statuses")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
  return data
}

// Tạo trạng thái mới
export async function createAppointmentStatus(statusData: Partial<AppointmentStatus>) {
  const { data, error } = await supabase
    .from("appointment_statuses")
    .insert([statusData])
    .select()
    .single()

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
  return data
}

// Cập nhật trạng thái
export async function updateAppointmentStatus(id: string, statusData: Partial<AppointmentStatus>) {
  const { data, error } = await supabase
    .from("appointment_statuses")
    .update(statusData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
  return data
}

// Xóa trạng thái (soft delete)
export async function deleteAppointmentStatus(id: string) {
  const { error } = await supabase
    .from("appointment_statuses")
    .update({ is_active: false })
    .eq("id", id)

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }
}

// Lấy default status ID (pending)
export async function getDefaultStatusId(): Promise<string> {
  const { data } = await supabase
    .from("appointment_statuses")
    .select("id")
    .eq("code", "pending")
    .eq("is_active", true)
    .single()
  return data?.id || ""
} 