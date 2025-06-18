import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export type TreatmentImage = {
  id: string
  treatment_session_id: string
  image_url: string
  image_type: "before" | "after"
  file_type: "image" | "video"
  created_at: string
}

// Tạo Supabase client
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Supabase Config:', {
    url: supabaseUrl ? 'Set' : 'Not set',
    key: supabaseKey ? 'Set' : 'Not set'
  });

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}; 