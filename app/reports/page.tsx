"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Download, TrendingUp, Users, DollarSign, Calendar, FileText } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ReportsPage() {
  const staffPerformance = [
    { name: "KTV A", sessions: 45, revenue: "180tr", completion: 94, rating: 4.8 },
    { name: "KTV B", sessions: 38, revenue: "152tr", completion: 91, rating: 4.6 },
    { name: "KTV C", sessions: 42, revenue: "168tr", completion: 96, rating: 4.9 },
    { name: "KTV D", sessions: 35, revenue: "140tr", completion: 89, rating: 4.5 },
  ]

  const treatmentStats = [
    { treatment: "Điều trị mụn", customers: 45, revenue: "225tr", completion: 87 },
    { treatment: "Laser tàn nhang", customers: 32, revenue: "256tr", completion: 92 },
    { treatment: "Căng da mặt", customers: 28, revenue: "420tr", completion: 95 },
    { treatment: "Điều trị sẹo", customers: 18, revenue: "180tr", completion: 83 },
  ]

  const monthlyRevenue = [
    { month: "T1", revenue: 650, target: 700 },
    { month: "T2", revenue: 720, target: 700 },
    { month: "T3", revenue: 680, target: 700 },
    { month: "T4", revenue: 790, target: 750 },
    { month: "T5", revenue: 820, target: 800 },
  ]

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Báo cáo & Thống kê</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Xuất Excel
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <FileText className="h-4 w-4 mr-2" />
            Xuất PDF
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            Tìm kiếm nâng cao
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="fromDate" className="text-sm">
                Từ ngày
              </Label>
              <Input id="fromDate" type="date" defaultValue="2024-05-01" className="text-sm" />
            </div>
            <div>
              <Label htmlFor="toDate" className="text-sm">
                Đến ngày
              </Label>
              <Input id="toDate" type="date" defaultValue="2024-05-31" className="text-sm" />
            </div>
            <div>
              <Label htmlFor="staff" className="text-sm">
                Nhân viên
              </Label>
              <Select>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="staff1">Kỹ thuật viên A</SelectItem>
                  <SelectItem value="staff2">Kỹ thuật viên B</SelectItem>
                  <SelectItem value="staff3">Kỹ thuật viên C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="treatment" className="text-sm">
                Liệu trình
              </Label>
              <Select>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Chọn liệu trình" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="acne">Điều trị mụn</SelectItem>
                  <SelectItem value="laser">Laser tàn nhang</SelectItem>
                  <SelectItem value="facial">Căng da mặt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button size="sm" className="w-full sm:w-auto">
              <BarChart3 className="h-4 w-4 mr-2" />
              Tạo báo cáo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tổng KH</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">123</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Đang điều trị trong tháng</p>
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
            <div className="text-lg sm:text-2xl font-bold">91%</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Khách hoàn thành liệu trình</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Buổi điều trị</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Tổng buổi trong tháng</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables - Mobile: Stack, Desktop: Side by side */}
      <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6">
        {/* Staff Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Hiệu suất nhân viên</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile: Card layout */}
            <div className="block sm:hidden space-y-3">
              {staffPerformance.map((staff, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{staff.name}</div>
                    <div className="text-sm text-muted-foreground">{staff.revenue}</div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{staff.sessions} buổi</span>
                    <span>⭐ {staff.rating}</span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={staff.completion} className="h-2" />
                    <span className="text-xs text-muted-foreground">{staff.completion}% hoàn thành</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Buổi</TableHead>
                    <TableHead>Doanh thu</TableHead>
                    <TableHead>Hoàn thành</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffPerformance.map((staff, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{staff.name}</div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">⭐ {staff.rating}</div>
                        </div>
                      </TableCell>
                      <TableCell>{staff.sessions}</TableCell>
                      <TableCell>{staff.revenue}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={staff.completion} className="h-2" />
                          <span className="text-xs text-muted-foreground">{staff.completion}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Thống kê theo liệu trình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {treatmentStats.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.treatment}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.customers} khách
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                    <span>Doanh thu: {item.revenue}</span>
                    <span>Hoàn thành: {item.completion}%</span>
                  </div>
                  <Progress value={item.completion} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Biểu đồ doanh thu theo tháng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {monthlyRevenue.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{month.month}</span>
                  <div className="text-right">
                    <div className="font-bold text-sm">{month.revenue}tr</div>
                    <div className="text-xs text-muted-foreground">Mục tiêu: {month.target}tr</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={(month.revenue / month.target) * 100} className="h-2 sm:h-3" />
                  <div className="text-xs text-muted-foreground">
                    {((month.revenue / month.target) * 100).toFixed(1)}% mục tiêu
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
