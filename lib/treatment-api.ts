import { supabase } from "./supabase"
import type { Treatment, TreatmentSession, TreatmentImage } from "./supabase"

// Lấy danh sách khách hàng và liệu trình
export async function getTreatments() {
  const { data, error } = await supabase
    .from("treatments")
    .select(`
      *,
      customer:customers(*)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })


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
  notes?: string
}) {
  const { data, error } = await supabase
    .from("treatments")
    .insert([
      {
        ...treatmentData,
        current_session: 0,
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
  
  const { data, error } = await supabase
    .from("treatment_sessions")
    .select(`
      *,
      treatment_images(*)
    `)
    .eq("treatment_id", treatmentId)
    .order("session_number", { ascending: true })



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
  // Nếu có id, thực hiện cập nhật
  if (sessionData.id) {
    const { data, error } = await supabase
      .from("treatment_sessions")
      .update(sessionData)
      .eq("id", sessionData.id)
      .select()
      .single()

    if (error) throw error
    return data as TreatmentSession
  }
  
  // Nếu không có id, thực hiện thêm mới
  const { data, error } = await supabase
    .from("treatment_sessions")
    .insert(sessionData)
    .select()
    .single()

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

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit cho cả ảnh và video
      throw new Error("File quá lớn. Vui lòng chọn file nhỏ hơn 50MB")
    }

    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const allowedVideoTypes = ["video/mp4", "video/x-m4v", "video/quicktime"]
    
    if (!allowedImageTypes.includes(file.type) && !allowedVideoTypes.includes(file.type)) {
      throw new Error("Định dạng file không được hỗ trợ. Vui lòng chọn file JPG, PNG, WebP hoặc MP4")
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase()
    const fileName = `${sessionId}_${imageType}_${Date.now()}.${fileExt}`
    const filePath = `treatment-images/${fileName}`

    console.log("Uploading file:", { fileName, filePath, fileSize: file.size, fileType: file.type })

    // Upload file lên storage với content type phù hợp
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("treatment-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type // Thêm content type để đảm bảo file được serve đúng
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      throw new Error(`Lỗi upload: ${uploadError.message}`)
    }

    console.log("Upload successful:", uploadData)

    // Lấy public URL
    const { data: urlData } = supabase.storage.from("treatment-images").getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      throw new Error("Không thể tạo URL công khai cho file")
    }

    console.log("Public URL:", urlData.publicUrl)

    // Lưu thông tin file vào database
    const { data, error } = await supabase
      .from("treatment_images")
      .insert({
        session_id: sessionId,
        image_type: imageType,
        image_url: urlData.publicUrl,
        storage_path: filePath,
        file_type: allowedImageTypes.includes(file.type) ? "image" : "video"
      })
      .select()
      .single()

    if (error) {
      console.error("Database insert error:", error)
      // Nếu lưu database thất bại, xóa file đã upload
      await supabase.storage.from("treatment-images").remove([filePath])
      throw new Error(`Lỗi lưu thông tin file: ${error.message}`)
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

// Lấy thống kê buổi điều trị trong ngày
export async function getTodaySessionsStats(): Promise<{
  total: number;
  completed: number;
}> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from("treatment_sessions")
    .select(`
      id,
      notes,
      products_used,
      skin_condition,
      reaction,
      after_sales_care
    `)
    .eq("session_date", today)

  if (error) {
    console.error("Error fetching today's sessions:", error)
    throw new Error("Không thể lấy thông tin buổi điều trị hôm nay")
  }

  const total = data.length
  // Một buổi được coi là hoàn thành nếu có bất kỳ thông tin nào được điền
  const completed = data.filter(session => 
    session.notes || 
    session.products_used ||
    session.skin_condition ||
    session.reaction ||
    session.after_sales_care
  ).length

  return {
    total,
    completed
  }
}

// Lấy tỷ lệ khách hàng hoàn thành liệu trình
export async function getCompletionRate(): Promise<number> {
  const { data, error } = await supabase
    .from("treatments")
    .select(`
      id,
      current_session,
      total_sessions,
      status
    `)
    .eq("status", "active")

  if (error) {
    console.error("Error fetching treatments completion rate:", error)
    throw new Error("Không thể lấy tỷ lệ hoàn thành")
  }

  if (!data || data.length === 0) return 0

  const completedTreatments = data.filter(
    treatment => treatment.current_session === treatment.total_sessions
  ).length

  const completionRate = (completedTreatments / data.length) * 100
  return Math.round(completionRate)
}

// Lấy danh sách liệu trình sắp kết thúc
export async function getUpcomingEndTreatments(): Promise<Array<{
  id: string;
  customerId: string;
  name: string;
  sessions: string;
  nextDate: string | null;
}>> {
  const { data, error } = await supabase
    .from("treatments")
    .select(`
      id,
      customer_id,
      total_sessions,
      current_session,
      customer:customers (
        id,
        name
      ),
      treatment_sessions (
        session_date,
        next_appointment
      )
    `)
    .eq("status", "active")
    .order("current_session", { ascending: false })

  if (error) {
    console.error("Error fetching upcoming end treatments:", error)
    throw new Error("Không thể lấy danh sách liệu trình sắp kết thúc")
  }

  // Lọc các liệu trình còn 1-2 buổi
  const upcomingEnd = data
    .filter(treatment => {
      const remainingSessions = treatment.total_sessions - treatment.current_session
      return remainingSessions > 0 && remainingSessions <= 2
    })
    .slice(0, 5) // Chỉ lấy 5 liệu trình gần nhất

  return upcomingEnd.map(treatment => {
    // Lấy ngày hẹn tiếp theo từ buổi điều trị gần nhất
    const latestSession = treatment.treatment_sessions
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())[0]

    return {
      id: treatment.id,
      customerId: treatment.customer_id,
      name: treatment.customer?.name || "Không xác định",
      sessions: `${treatment.current_session}/${treatment.total_sessions}`,
      nextDate: latestSession?.next_appointment || null
    }
  })
}

export async function getTotalRevenue() {
  try {
    const { data, error } = await supabase
      .from('treatment_sessions')
      .select('products_sold, created_at')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString())

    if (error) {
      console.error('Error fetching revenue:', error)
      return { total: 0, percentChange: 0 }
    }

    // Tính tổng doanh thu tháng này
    const currentMonthRevenue = data.reduce((total, session) => {
      if (!session.products_sold) return total
      try {
        const products = JSON.parse(session.products_sold)
        return total + products.reduce((sum: number, product: any) => sum + (product.price || 0), 0)
      } catch (e) {
        console.error('Error parsing products_sold:', e)
        return total
      }
    }, 0)

    // Lấy doanh thu tháng trước để tính phần trăm thay đổi
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString()
    const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    
    const { data: lastMonthData, error: lastMonthError } = await supabase
      .from('treatment_sessions')
      .select('products_sold')
      .gte('created_at', lastMonthStart)
      .lt('created_at', lastMonthEnd)

    if (lastMonthError) {
      console.error('Error fetching last month revenue:', lastMonthError)
      return { total: currentMonthRevenue, percentChange: 0 }
    }

    const lastMonthRevenue = lastMonthData.reduce((total, session) => {
      if (!session.products_sold) return total
      try {
        const products = JSON.parse(session.products_sold)
        return total + products.reduce((sum: number, product: any) => sum + (product.price || 0), 0)
      } catch (e) {
        console.error('Error parsing products_sold:', e)
        return total
      }
    }, 0)

    // Tính phần trăm thay đổi
    const percentChange = lastMonthRevenue === 0 
      ? 100 
      : Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)

    return { 
      total: currentMonthRevenue,
      percentChange
    }
  } catch (error) {
    console.error('Error in getTotalRevenue:', error)
    return { total: 0, percentChange: 0 }
  }
}
