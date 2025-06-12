import { supabase } from "./supabase"

export interface Product {
  id: string
  name: string
  notes?: string
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface ProductFilters {
  status?: string
  search?: string
}

export async function getProducts(filters: ProductFilters = {}) {
  let query = supabase.from("products").select("*")

  if (filters.status) {
    query = query.eq("status", filters.status)
  }

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data as Product[]
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as Product
}

export async function createProduct(product: Partial<Product>) {
  const { data, error } = await supabase
    .from("products")
    .insert([product])
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const { data, error } = await supabase
    .from("products")
    .update(product)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)

  if (error) throw error
} 