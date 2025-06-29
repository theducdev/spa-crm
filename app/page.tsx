"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, DollarSign, Clock, TrendingUp, Phone, MessageCircle, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"
import { getTotalCustomerDebt } from "@/lib/customer-api"

export default function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [totalDebt, setTotalDebt] = useState(0)

  useEffect(() => {
    const fetchTotalDebt = async () => {
      try {
        const debt = await getTotalCustomerDebt()
        setTotalDebt(debt)
      } catch (error) {
        console.error("Error fetching total debt:", error)
      }
    }
    fetchTotalDebt()
  }, [])

  const todayAppointments = [
    { id: 1, name: "Nguyễn Thị A", time: "09:00", treatment: "Điều trị mụn", session: "3/6", status: "confirmed" },
    { id: 2, name: "Trần Văn B", time: "10:30", treatment: "Laser tàn nhang", session: "5/8", status: "pending" },
    { id: 3, name: "Lê Thị C", time: "14:00", treatment: "Căng da mặt", session: "2/4", status: "confirmed" },
    { id: 4, name: "Phạm Văn D", time: "15:30", treatment: "Điều trị sẹo", session: "1/6", status: "completed" },
  ]

  const upcomingEnd = [
    { name: "Nguyễn Thị E", sessions: "5/6", nextDate: "2024-06-15" },
    { name: "Hoàng Văn F", sessions: "7/8", nextDate: "2024-06-18" },
  ]

  const topStaff = [
    { name: "KTV A", sessions: 12, revenue: "45tr" },
    { name: "KTV B", sessions: 10, revenue: "38tr" },
    { name: "KTV C", sessions: 8, revenue: "32tr" },
  ]

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Mobile Header */}
      <div className="flex items-center justify-between sm:hidden">
        <div>
          <h1 className="text-xl font-bold">Chào buổi sáng!</h1>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("vi-VN")}</p>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chào buổi sáng, Quản lý!</h1>
          <p className="text-muted-foreground">Hôm nay là {new Date().toLocaleDateString("vi-VN")}</p>
        </div>
      </div>

      {/* Stats Cards - Mobile: 2 columns, Desktop: 5 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-6">
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tổng nợ</CardTitle>
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold text-red-500">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0
              }).format(totalDebt)}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">Tổng nợ khách hàng</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tổng KH</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground hidden sm:block">+12% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Hôm nay</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground hidden sm:block">4 buổi đã hoàn thành</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">820tr</div>
            <p className="text-xs text-muted-foreground hidden sm:block">+8% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Hoàn thành</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Khách hàng hoàn thành</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Mobile: Stack vertically, Desktop: Side by side */}
      <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6">
        {/* Today's Appointments */}
        <Card className="sm:col-span-2">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              Lịch hẹn hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {todayAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-blue-600 shrink-0">{appointment.time}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base truncate">{appointment.name}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground truncate">{appointment.treatment}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {appointment.session}
                  </Badge>
                  <Badge
                    variant={
                      appointment.status === "completed"
                        ? "default"
                        : appointment.status === "confirmed"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs hidden sm:inline-flex"
                  >
                    {appointment.status === "completed"
                      ? "Hoàn thành"
                      : appointment.status === "confirmed"
                        ? "Đã xác nhận"
                        : "Chờ xác nhận"}
                  </Badge>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-4 sm:space-y-6">
          {/* Upcoming End Treatments */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-sm sm:text-lg">Sắp hết liệu trình</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEnd.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-2 sm:p-3 border rounded">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs sm:text-sm truncate">{client.name}</div>
                      <div className="text-xs text-muted-foreground">Buổi {client.sessions}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground">{client.nextDate}</div>
                      <Button size="sm" variant="outline" className="mt-1 h-6 text-xs">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Nhắc
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Staff */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-sm sm:text-lg">Top nhân viên</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topStaff.map((staff, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-xs sm:text-sm truncate">{staff.name}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground shrink-0">{staff.revenue}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(staff.sessions / 15) * 100} className="flex-1 h-1 sm:h-2" />
                      <span className="text-xs text-muted-foreground shrink-0">{staff.sessions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
