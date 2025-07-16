"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, DollarSign, Clock, TrendingUp, Phone, MessageCircle, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"
import { getTotalCustomerDebt, getTotalActiveCustomers } from "@/lib/customer-api"
import { getStaffStats, getTodayAppointments } from "@/lib/appointment-api"
import { getTodaySessionsStats, getCompletionRate, getUpcomingEndTreatments, getTotalRevenue } from "@/lib/treatment-api"
import { StaffAppointmentsDialog } from "@/components/appointments/staff-appointments-dialog"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [totalDebt, setTotalDebt] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [todaySessions, setTodaySessions] = useState({ total: 0, completed: 0 })
  const [completionRate, setCompletionRate] = useState(0)
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [upcomingEndTreatments, setUpcomingEndTreatments] = useState<any[]>([])
  const [staffStats, setStaffStats] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<{ id: number; name: string } | null>(null)
  const [revenue, setRevenue] = useState<{ total: number; percentChange: number }>({ total: 0, percentChange: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [debt, customers, sessions, completion, appointments, upcoming, staff, revenueData] = await Promise.all([
          getTotalCustomerDebt(),
          getTotalActiveCustomers(),
          getTodaySessionsStats(),
          getCompletionRate(),
          getTodayAppointments(),
          getUpcomingEndTreatments(),
          getStaffStats(),
          getTotalRevenue()
        ])
        setTotalDebt(debt)
        setTotalCustomers(customers)
        setTodaySessions(sessions)
        setCompletionRate(completion)
        setTodayAppointments(appointments)
        setUpcomingEndTreatments(upcoming)
        setStaffStats(staff)
        setRevenue(revenueData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      }
    }
    fetchData()
  }, [])

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

      {/* Stats Cards */}
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
            <div className="text-lg sm:text-2xl font-bold">{totalCustomers.toLocaleString("vi-VN")}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Khách hàng đang hoạt động</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Hôm nay</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{todaySessions.total}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">{todaySessions.completed} buổi đã hoàn thành</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0
              }).format(revenue.total)}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {revenue.percentChange > 0 ? "+" : ""}{revenue.percentChange}% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Hoàn thành</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Liệu trình đã hoàn thành</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
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
            {todayAppointments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Không có lịch hẹn nào hôm nay
              </div>
            ) : (
              todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-blue-600 shrink-0">{appointment.time}</div>
                    <div className="min-w-0 flex-1">
                      <div 
                        className="font-medium text-sm sm:text-base truncate cursor-pointer hover:text-blue-600 hover:underline flex items-center gap-1"
                        onClick={() => router.push(`/customer-care?customerId=${appointment.customerId}`)}
                      >
                        {appointment.name}
                        <span className="text-xs text-muted-foreground">(Xem CSKH)</span>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">{appointment.treatment}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {appointment.session}
                    </Badge>
                    <Badge
                      variant={
                        appointment.status === "cancelled"
                          ? "destructive"
                          : appointment.status === "confirmed"
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs hidden sm:inline-flex"
                    >
                      {appointment.status === "cancelled"
                        ? "Đã hủy"
                        : appointment.status === "confirmed"
                          ? "Đã xác nhận"
                          : "Chờ xác nhận"}
                    </Badge>
                    {/* <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button> */}
                  </div>
                </div>
              ))
            )}
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
                {upcomingEndTreatments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    Không có liệu trình nào sắp kết thúc
                  </div>
                ) : (
                  upcomingEndTreatments.map((treatment) => (
                    <div key={treatment.id} className="flex items-center justify-between p-2 sm:p-3 border rounded">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs sm:text-sm truncate">{treatment.name}</div>
                        <div className="text-xs text-muted-foreground">Buổi {treatment.sessions}</div>
                      </div>
                      <div className="text-right shrink-0">
                        {treatment.nextDate ? (
                          <div className="text-xs text-muted-foreground">
                            {new Date(treatment.nextDate).toLocaleDateString("vi-VN")}
                          </div>
                        ) : (
                          <div className="text-xs text-yellow-600">Chưa có lịch hẹn</div>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-1 h-6 text-xs"
                          onClick={() => router.push(`/customer-care?customerId=${treatment.customerId}`)}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Nhắc
                        </Button>
                      </div>
                    </div>
                  ))
                )}
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
                {staffStats.map((staff) => (
                  <div 
                    key={staff.created_by_user.id} 
                    className="space-y-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                    onClick={() => setSelectedStaff({
                      id: staff.created_by_user.id,
                      name: staff.created_by_user.full_name
                    })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-xs sm:text-sm truncate">
                        {staff.created_by_user.full_name}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground shrink-0">
                        {staff.total_appointments} lịch hẹn
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(staff.total_appointments / Math.max(...staffStats.map(s => s.total_appointments))) * 100} 
                        className="flex-1 h-1 sm:h-2" 
                      />
                      <span className="text-xs text-muted-foreground shrink-0">
                        {staff.total_appointments}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedStaff && (
            <StaffAppointmentsDialog
              staffId={selectedStaff.id}
              staffName={selectedStaff.name}
              open={!!selectedStaff}
              onOpenChange={(open) => !open && setSelectedStaff(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
