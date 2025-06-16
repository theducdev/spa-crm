import { supabase } from "@/lib/supabase"

export type Customer = {
  id: string
  name: string
  phone: string | null
  email: string | null
  gender: "male" | "female" | null
  birth_date: string | null
  address: string | null
  face_image_url: string | null
  face_image_path: string | null
  notes: string | null
  status: "active" | "inactive" | "pending"
  tag_id: string | null
  tag?: {
    id: string
    name: string
    color: string
  }
  created_at: string
  updated_at: string
}

export type CustomerFilters = {
  search?: string
  status?: string
}

// Lấy danh sách khách hàng với bộ lọc
export async function getCustomers(filters: CustomerFilters = {}): Promise<Customer[]> {
  let query = supabase
    .from("customers")
    .select(`
      *,
      tag:customer_tags(id, name, color)
    `)

  // Lọc theo trạng thái
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }

  // Tìm kiếm theo tên hoặc số điện thoại
  if (filters.search) {
    const searchTerm = filters.search.trim()
    query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
  }

  // Sắp xếp theo ngày tạo mới nhất
  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("Error fetching customers:", error)
    throw new Error("Không thể tải danh sách khách hàng")
  }

  return data as Customer[]
}

// Lấy thông tin chi tiết của một khách hàng
export async function getCustomer(id: string): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      *,
      tag:customer_tags(id, name, color)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching customer:", error)
    throw new Error("Không thể tải thông tin khách hàng")
  }

  return data as Customer
}

// Tạo khách hàng mới
export async function createCustomer(customerData: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase.from("customers").insert([customerData]).select().single()

  if (error) {
    console.error("Error creating customer:", error)
    throw new Error("Không thể tạo khách hàng mới")
  }

  return data as Customer
}

// Cập nhật thông tin khách hàng
export async function updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer> {
  // Kiểm tra id
  if (!id) {
    throw new Error("ID khách hàng không hợp lệ")
  }

  // Loại bỏ các trường undefined và null không cần thiết
  const cleanedData = Object.entries(customerData).reduce((acc, [key, value]) => {
    // Chỉ giữ lại các trường có giá trị
    if (value !== undefined && value !== null) {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, any>)

  // Kiểm tra dữ liệu trước khi cập nhật
  if (Object.keys(cleanedData).length === 0) {
    throw new Error("Không có dữ liệu để cập nhật")
  }

  const { data, error } = await supabase
    .from("customers")
    .update(cleanedData)
    .eq("id", id)
    .select(`
      *,
      tag:customer_tags(id, name, color)
    `)
    .single()

  if (error) {
    console.error("Error updating customer:", {
      error,
      customerId: id,
      updateData: cleanedData
    })
    throw new Error(error.message || "Không thể cập nhật thông tin khách hàng")
  }

  if (!data) {
    throw new Error("Không tìm thấy khách hàng sau khi cập nhật")
  }

  return data as Customer
}

// Upload ảnh nhận diện
export async function uploadCustomerFaceImage(file: File, customerId: string): Promise<Customer> {
  // Tạo tên file duy nhất
  const fileExt = file.name.split(".").pop()
  const fileName = `${customerId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
  const filePath = `customer-faces/${fileName}`

  // Upload file lên storage
  const { error: uploadError } = await supabase.storage.from("treatment-images").upload(filePath, file)

  if (uploadError) {
    console.error("Error uploading image:", uploadError)
    throw new Error("Không thể tải lên ảnh")
  }

  // Lấy URL công khai của file
  const {
    data: { publicUrl },
  } = supabase.storage.from("treatment-images").getPublicUrl(filePath)

  // Cập nhật thông tin khách hàng với URL ảnh mới
  const { data, error } = await supabase
    .from("customers")
    .update({
      face_image_url: publicUrl,
      face_image_path: filePath,
    })
    .eq("id", customerId)
    .select()
    .single()

  if (error) {
    console.error("Error updating customer with image:", error)
    throw new Error("Không thể cập nhật ảnh nhận diện")
  }

  return data as Customer
}

// Xóa ảnh nhận diện
export async function deleteCustomerFaceImage(customerId: string): Promise<Customer> {
  // Lấy thông tin khách hàng để biết đường dẫn file
  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select("face_image_path")
    .eq("id", customerId)
    .single()

  if (fetchError) {
    console.error("Error fetching customer:", fetchError)
    throw new Error("Không thể tải thông tin khách hàng")
  }

  // Nếu có đường dẫn file, xóa file từ storage
  if (customer?.face_image_path) {
    const { error: deleteError } = await supabase.storage.from("treatment-images").remove([customer.face_image_path])

    if (deleteError) {
      console.error("Error deleting image:", deleteError)
      // Tiếp tục xử lý ngay cả khi xóa file thất bại
    }
  }

  // Cập nhật thông tin khách hàng, xóa URL và đường dẫn ảnh
  const { data, error } = await supabase
    .from("customers")
    .update({
      face_image_url: null,
      face_image_path: null,
    })
    .eq("id", customerId)
    .select()
    .single()

  if (error) {
    console.error("Error updating customer:", error)
    throw new Error("Không thể xóa ảnh nhận diện")
  }

  return data as Customer
}

// Xóa khách hàng
export async function deleteCustomer(id: string): Promise<void> {
  // Lấy thông tin khách hàng để kiểm tra ảnh
  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select("face_image_path")
    .eq("id", id)
    .single()

  if (fetchError) {
    console.error("Error fetching customer:", fetchError)
    throw new Error("Không thể tải thông tin khách hàng")
  }

  // Nếu có ảnh, xóa ảnh từ storage
  if (customer?.face_image_path) {
    const { error: deleteImageError } = await supabase.storage
      .from("treatment-images")
      .remove([customer.face_image_path])

    if (deleteImageError) {
      console.error("Error deleting image:", deleteImageError)
      // Tiếp tục xử lý ngay cả khi xóa file thất bại
    }
  }

  // Xóa khách hàng từ database
  const { error } = await supabase.from("customers").delete().eq("id", id)

  if (error) {
    console.error("Error deleting customer:", error)
    throw new Error("Không thể xóa khách hàng")
  }
}
