import { supabase } from "./supabase"

export interface TreatmentPackage {
  id: string
  name: string
  description?: string
  total_sessions: number
  price: number
  status: string
  created_at: string
  updated_at: string
}

// Lấy danh sách gói điều trị
export async function getTreatmentPackages() {
  const { data, error } = await supabase
    .from("treatment_packages")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as TreatmentPackage[]
}

// Lấy thông tin một gói điều trị
export async function getTreatmentPackage(id: string) {
  const { data, error } = await supabase
    .from("treatment_packages")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as TreatmentPackage
}

// Tạo gói điều trị mới
export async function createTreatmentPackage(packageData: Partial<TreatmentPackage>) {
  const { data, error } = await supabase
    .from("treatment_packages")
    .insert([packageData])
    .select()
    .single()

  if (error) throw error
  return data as TreatmentPackage
}

// Cập nhật gói điều trị
export async function updateTreatmentPackage(id: string, packageData: Partial<TreatmentPackage>) {
  const { data, error } = await supabase
    .from("treatment_packages")
    .update(packageData)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as TreatmentPackage
}

// Xóa gói điều trị (soft delete)
export async function deleteTreatmentPackage(id: string) {
  const { error } = await supabase
    .from("treatment_packages")
    .update({ status: "inactive" })
    .eq("id", id)

  if (error) throw error
} 