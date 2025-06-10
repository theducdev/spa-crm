export type TreatmentImage = {
  id: string
  treatment_session_id: string
  image_url: string
  image_type: "before" | "after"
  file_type: "image" | "video"
  created_at: string
} 