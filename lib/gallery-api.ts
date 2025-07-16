import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export interface GalleryImage {
  id: string
  image_type: string
  image_url: string
  file_type: string
  created_at: string
  treatment_sessions: {
    id: string
    session_number: number
    session_date: string
    notes: string
    treatments: {
      id: string
      treatment_name: string
      customers: {
        id: string
        name: string
      }
    }
  }
}

interface GalleryFilters {
  customerId?: string
  fromDate?: string
  toDate?: string
  treatment?: string
  imageType?: string
}

export async function fetchGalleryImages(filters: GalleryFilters = {}): Promise<GalleryImage[]> {
  const supabase = createClientComponentClient()

  const params = new URLSearchParams()
  if (filters.customerId) params.set("customerId", filters.customerId)
  if (filters.fromDate) params.set("fromDate", filters.fromDate)
  if (filters.toDate) params.set("toDate", filters.toDate)
  if (filters.treatment) params.set("treatment", filters.treatment)
  if (filters.imageType) params.set("imageType", filters.imageType)

  const response = await fetch(`/api/gallery?${params.toString()}`)
  if (!response.ok) {
    throw new Error("Lỗi khi tải dữ liệu ảnh")
  }

  return response.json()
}

export async function fetchTreatments() {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase
    .from("treatments")
    .select("id, treatment_name")
    .eq('status', 'active')
    .order("treatment_name")
  if (error) throw error
  return data.map(t => ({ id: t.id, name: t.treatment_name }))
} 