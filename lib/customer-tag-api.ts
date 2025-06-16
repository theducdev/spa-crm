import { supabase } from "@/lib/supabase"

export type CustomerTag = {
  id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

// Lấy danh sách thẻ tag
export async function getCustomerTags(): Promise<CustomerTag[]> {
  const { data, error } = await supabase
    .from("customer_tags")
    .select("*")
    .order("name")

  if (error) {
    console.error("Error fetching customer tags:", error)
    throw new Error("Không thể tải danh sách thẻ tag")
  }

  return data as CustomerTag[]
}

// Tạo thẻ tag mới
export async function createCustomerTag(tagData: Partial<CustomerTag>): Promise<CustomerTag> {
  const { data, error } = await supabase
    .from("customer_tags")
    .insert([tagData])
    .select()
    .single()

  if (error) {
    console.error("Error creating customer tag:", error)
    throw new Error("Không thể tạo thẻ tag mới")
  }

  return data as CustomerTag
}

// Cập nhật thẻ tag
export async function updateCustomerTag(id: string, tagData: Partial<CustomerTag>): Promise<CustomerTag> {
  const { data, error } = await supabase
    .from("customer_tags")
    .update(tagData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating customer tag:", error)
    throw new Error("Không thể cập nhật thẻ tag")
  }

  return data as CustomerTag
}

// Xóa thẻ tag
export async function deleteCustomerTag(id: string): Promise<void> {
  const { error } = await supabase
    .from("customer_tags")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting customer tag:", error)
    throw new Error("Không thể xóa thẻ tag")
  }
} 