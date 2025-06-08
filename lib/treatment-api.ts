import { supabase } from "./supabase"
import type { Treatment, TreatmentSession, TreatmentImage } from "./supabase"

// Lấy danh sách khách hàng và liệu trình
export async function getTreatments() {
  console.log("Fetching treatments...")
  const { data, error } = await supabase
    .from("treatments")
    .select(`
      *,
      customer:customers(*)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  console.log("Treatments data:", data)
  console.log("Treatments error:", error)

  if (error) throw error
  return data as (Treatment & { customer: any })[]
}

// Tạo liệu trình mới
export async function createTreatment(treatmentData: {
  customer_id: string
  treatment_name: string
  total_sessions: number
  price: number
  start_date: string
}) {
  const { data, error } = await supabase
    .from("treatments")
    .insert([
      {
        ...treatmentData,
        current_session: 1,
        status: "active",
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data as Treatment
}

// Lấy thông tin buổi điều trị theo treatment_id
export async function getTreatmentSessions(treatmentId: string) {
  console.log("Fetching sessions for treatment:", treatmentId)
  const { data, error } = await supabase
    .from("treatment_sessions")
    .select(`
      *,
      treatment_images(*)
    `)
    .eq("treatment_id", treatmentId)
    .order("session_number", { ascending: true })

  console.log("Sessions data:", data)
  console.log("Sessions error:", error)

  if (error) throw error
  return data as (TreatmentSession & { treatment_images: TreatmentImage[] })[]
}

// Lấy thông tin một buổi điều trị cụ thể
export async function getTreatmentSession(sessionId: string) {
  const { data, error } = await supabase
    .from("treatment_sessions")
    .select(`
      *,
      treatment_images(*)
    `)
    .eq("id", sessionId)
    .single()

  if (error) throw error
  return data as TreatmentSession & { treatment_images: TreatmentImage[] }
}

// Tạo hoặc cập nhật buổi điều trị
export async function upsertTreatmentSession(sessionData: Partial<TreatmentSession>) {
  const { data, error } = await supabase.from("treatment_sessions").upsert(sessionData).select().single()

  if (error) throw error
  return data as TreatmentSession
}

// Upload ảnh lên Supabase Storage với error handling tốt hơn
export async function uploadTreatmentImage(file: File, sessionId: string, imageType: "before" | "after") {
  try {
    // Validate file
    if (!file) {
      throw new Error("Không có file được chọn")
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      throw new Error("File quá lớn. Vui lòng chọn file nhỏ hơn 5MB")
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Định dạng file không được hỗ trợ. Vui lòng chọn file JPG, PNG hoặc WebP")
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase()
    const fileName = `${sessionId}_${imageType}_${Date.now()}.${fileExt}`
    const filePath = `treatment-images/${fileName}`

    console.log("Uploading file:", { fileName, filePath, fileSize: file.size, fileType: file.type })

    // Upload file lên storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("treatment-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      throw new Error(`Lỗi upload: ${uploadError.message}`)
    }

    console.log("Upload successful:", uploadData)

    // Lấy public URL
    const { data: urlData } = supabase.storage.from("treatment-images").getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      throw new Error("Không thể tạo URL công khai cho ảnh")
    }

    console.log("Public URL:", urlData.publicUrl)

    // Lưu thông tin ảnh vào database
    const { data, error } = await supabase
      .from("treatment_images")
      .insert({
        session_id: sessionId,
        image_type: imageType,
        image_url: urlData.publicUrl,
        storage_path: filePath,
      })
      .select()
      .single()

    if (error) {
      console.error("Database insert error:", error)
      // Nếu lưu database thất bại, xóa file đã upload
      await supabase.storage.from("treatment-images").remove([filePath])
      throw new Error(`Lỗi lưu thông tin ảnh: ${error.message}`)
    }

    console.log("Database insert successful:", data)
    return data as TreatmentImage
  } catch (error: any) {
    console.error("Upload treatment image error:", error)
    throw error
  }
}

// Xóa ảnh điều trị
export async function deleteTreatmentImage(imageId: string) {
  try {
    // Lấy thông tin ảnh trước khi xóa
    const { data: imageData, error: fetchError } = await supabase
      .from("treatment_images")
      .select("storage_path")
      .eq("id", imageId)
      .single()

    if (fetchError) {
      console.error("Fetch image error:", fetchError)
      throw new Error(`Không thể tìm thấy ảnh: ${fetchError.message}`)
    }

    // Xóa file từ storage
    const { error: storageError } = await supabase.storage.from("treatment-images").remove([imageData.storage_path])

    if (storageError) {
      console.error("Storage delete error:", storageError)
      // Vẫn tiếp tục xóa record trong database ngay cả khi xóa file thất bại
    }

    // Xóa record từ database
    const { error } = await supabase.from("treatment_images").delete().eq("id", imageId)

    if (error) {
      console.error("Database delete error:", error)
      throw new Error(`Lỗi xóa thông tin ảnh: ${error.message}`)
    }

    console.log("Image deleted successfully")
  } catch (error: any) {
    console.error("Delete treatment image error:", error)
    throw error
  }
}

// Tạo buổi điều trị mới
export async function createNewTreatmentSession(treatmentId: string) {
  // Lấy thông tin liệu trình hiện tại
  const { data: treatment, error: treatmentError } = await supabase
    .from("treatments")
    .select("current_session, total_sessions")
    .eq("id", treatmentId)
    .single()

  if (treatmentError) throw treatmentError

  // Kiểm tra xem đã hết buổi điều trị chưa
  if (treatment.current_session >= treatment.total_sessions) {
    throw new Error("Đã hoàn thành tất cả buổi điều trị")
  }

  const nextSessionNumber = treatment.current_session + 1

  // Tạo buổi điều trị mới
  const { data: newSession, error: sessionError } = await supabase
    .from("treatment_sessions")
    .insert({
      treatment_id: treatmentId,
      session_number: nextSessionNumber,
      session_date: new Date().toISOString().split("T")[0], // Ngày hiện tại
    })
    .select()
    .single()

  if (sessionError) throw sessionError

  // Cập nhật current_session trong bảng treatments
  const { error: updateError } = await supabase
    .from("treatments")
    .update({
      current_session: nextSessionNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", treatmentId)

  if (updateError) throw updateError

  return newSession as TreatmentSession
}

// Kiểm tra xem có thể tạo buổi điều trị mới không
export async function canCreateNewSession(treatmentId: string) {
  const { data: treatment, error } = await supabase
    .from("treatments")
    .select("current_session, total_sessions")
    .eq("id", treatmentId)
    .single()

  if (error) throw error

  return treatment.current_session < treatment.total_sessions
}

// Lấy thông tin liệu trình cụ thể
export async function getTreatment(treatmentId: string) {
  const { data, error } = await supabase
    .from("treatments")
    .select(`
      *,
      customer:customers(*)
    `)
    .eq("id", treatmentId)
    .single()

  if (error) throw error
  return data as Treatment & { customer: any }
}

// Lấy danh sách liệu trình theo khách hàng
export async function getTreatmentsByCustomer(customerId: string) {
  const { data, error } = await supabase
    .from("treatments")
    .select(`
      *,
      customer:customers(*)
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as (Treatment & { customer: any })[]
}

// Cập nhật liệu trình
export async function updateTreatment(id: string, treatmentData: Partial<Treatment>) {
  const { data, error } = await supabase
    .from("treatments")
    .update(treatmentData)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Treatment
}

// Xóa liệu trình
export async function deleteTreatment(id: string) {
  const { error } = await supabase
    .from("treatments")
    .delete()
    .eq("id", id)

  if (error) throw error
  return true
}
