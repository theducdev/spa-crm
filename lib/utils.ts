import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskPhoneNumber(phone: string | null): string {
  if (!phone) return "Chưa có SĐT"
  // Chỉ lấy các số, bỏ qua các ký tự khác
  const numbers = phone.replace(/\D/g, '')
  // Nếu số điện thoại ít hơn 5 số, trả về toàn dấu *
  if (numbers.length < 5) return '*'.repeat(numbers.length)
  // Lấy 5 số cuối
  const lastFive = numbers.slice(-5)
  // Thay thế các số còn lại bằng *
  const masked = '*'.repeat(numbers.length - 5) + lastFive
  return masked
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  if (!date) return "Chưa có"
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Kiểm tra nếu date không hợp lệ
  if (isNaN(dateObj.getTime())) return "Chưa có"
  
  return dateObj.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function formatDateTime(date: string | Date): string {
  if (!date) return "Chưa có"
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Kiểm tra nếu date không hợp lệ
  if (isNaN(dateObj.getTime())) return "Chưa có"
  
  return dateObj.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateForInput(date: string | Date): string {
  if (!date) return ""
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Kiểm tra nếu date không hợp lệ
  if (isNaN(dateObj.getTime())) return ""
  
  return dateObj.toISOString().split('T')[0]
}
