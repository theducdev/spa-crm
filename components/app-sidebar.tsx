"use client"

import { Users, FileText, BarChart3, Camera, MessageCircle, Home, Settings, Package, Calendar, ClipboardCheck, Box, Heart, Image, Tag, Clock } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Tổng quan",
    url: "/",
    icon: Home,
  },
  {
    title: "Khách hàng",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Lịch hẹn",
    url: "/appointments",
    icon: Clock,
  },
  {
    title: "Thẻ tag",
    url: "/customer-tags",
    icon: Tag,
  },
  {
    title: "Liệu trình",
    url: "/treatments",
    icon: Calendar,
  },
  {
    title: "Ghi nhận điều trị",
    url: "/treatment",
    icon: ClipboardCheck,
  },
  {
    title: "Gói điều trị",
    url: "/treatment-packages",
    icon: Package,
  },
  {
    title: "Sản phẩm",
    url: "/products",
    icon: Box,
  },
  {
    title: "Chăm sóc khách hàng",
    url: "/customer-care",
    icon: Heart,
  },
  {
    title: "Thư viện ảnh",
    url: "/gallery",
    icon: Image,
  },
  {
    title: "Báo cáo",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Cài đặt",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="hidden group-data-[collapsible=icon]:hidden">
            <h2 className="font-semibold">Spa Management</h2>
            <p className="text-xs text-muted-foreground">Hệ thống quản lý</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings />
                <span>Cài đặt</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
