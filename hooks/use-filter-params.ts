import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type FilterValue = string | string[] | number | boolean | null | undefined

export function useFilterParams<T extends Record<string, FilterValue>>(
  initialState: T,
  options?: {
    debounceMs?: number
    onFilterChange?: (filters: T) => void
  }
) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<T>(() => {
    // Khôi phục state từ URL nếu có
    const stateFromUrl = { ...initialState }
    for (const [key, initialValue] of Object.entries(initialState)) {
      const value = searchParams.get(key)
      if (value !== null) {
        if (Array.isArray(initialValue)) {
          (stateFromUrl as any)[key] = value.split(',')
        } else if (typeof initialValue === 'boolean') {
          (stateFromUrl as any)[key] = value === 'true'
        } else if (typeof initialValue === 'number') {
          (stateFromUrl as any)[key] = Number(value)
        } else {
          (stateFromUrl as any)[key] = value
        }
      }
    }
    return stateFromUrl as T
  })

  // Cập nhật URL khi filters thay đổi
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key)
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','))
        } else {
          params.delete(key)
        }
      } else {
        params.set(key, String(value))
      }
    })

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl)
  }, [filters, pathname, router, searchParams])

  // Debounce cập nhật filters
  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters }
      options?.onFilterChange?.(updated)
      return updated
    })
  }, [options])

  const resetFilters = useCallback(() => {
    setFilters(initialState)
    options?.onFilterChange?.(initialState)
  }, [initialState, options])

  return {
    filters,
    updateFilters,
    resetFilters
  }
} 