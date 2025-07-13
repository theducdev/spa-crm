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
    currency: 'VND'
  }).format(amount)
}
