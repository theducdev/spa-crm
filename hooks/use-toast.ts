"use client"

import { useState } from "react"

type ToastProps = {
  title: string
  description: string
  variant?: "default" | "destructive"
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = (props: ToastProps) => {
    // Trong môi trường thực tế, bạn sẽ sử dụng một thư viện toast
    // Nhưng ở đây chúng ta sẽ giả lập bằng cách log ra console
    console.log(`Toast: ${props.title} - ${props.description}`)

    // Thêm toast vào danh sách (nếu bạn muốn hiển thị UI)
    setToasts((prev) => [...prev, props])

    // Tự động xóa toast sau 3 giây
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t !== props))
    }, 3000)
  }

  return { toast, toasts }
}
