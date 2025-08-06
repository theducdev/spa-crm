"use client"

import { useEffect, useState, useCallback, Suspense, useMemo } from "react"
import { getAppointments, deleteAppointment, Appointment } from "@/lib/appointment-api"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Search } from "lucide-react"
import { AppointmentDialog } from "@/components/appointments/appointment-dialog"
import { AppointmentList } from "@/components/appointments/appointment-list"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { addDays, format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { vi } from "date-fns/locale"
import { Switch } from "@/components/ui/switch"
import { useFilterParams } from "@/hooks/use-filter-params"
import { Skeleton } from "@/components/ui/skeleton"

interface AppointmentWithCustomer extends Appointment {
  customers?: {
    id: string
    name: string
    phone: string
    debt: number | null
  }
  created_by_user?: {
    id: number
    full_name: string
  }
}

function AppointmentsContent() {
  const [appointments, setAppointments] = useState<AppointmentWithCustomer[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>()
  const [totalPages, setTotalPages] = useState(1)
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [previousSearchTerm, setPreviousSearchTerm] = useState("")
  const [allAppointments, setAllAppointments] = useState<AppointmentWithCustomer[]>([])
  const [currentPageAppointments, setCurrentPageAppointments] = useState<AppointmentWithCustomer[]>([])
  
  const PAGE_SIZE = 20
  
  const { filters, updateFilters: _updateFilters } = useFilterParams({
    fromDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    toDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    showCreatedAt: false as boolean | undefined,
    search: "",
    page: 1
  })

  const [searchTerm, setSearchTerm] = useState(filters.search || "")
  const [currentPage, setCurrentPage] = useState(filters.page || 1)

  // Đồng bộ searchTerm với filters.search
  useEffect(() => {
    setSearchTerm(filters.search || "")
  }, [filters.search])

  // Đồng bộ currentPage với filters.page
  useEffect(() => {
    setCurrentPage(filters.page || 1)
  }, [filters.page])

  // Reset page về 1 khi đổi filter (trừ khi thay đổi page)
  const updateFilters = (newFilters: any) => {
    if (!('page' in newFilters)) {
      setCurrentPage(1)
      _updateFilters({ ...newFilters, page: 1 })
    } else {
      _updateFilters(newFilters)
    }
  }

  // Load tất cả appointments khi có search hoặc thay đổi filter
  const loadAllAppointments = useCallback(async () => {
    try {
      setLoadingAppointments(true)
      
      const result = await getAppointments(
        {
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          filterByCreatedAt: filters.showCreatedAt
        },
        1,
        999999
      )
      
      let allData: AppointmentWithCustomer[] = []
      
      if (typeof result === 'object' && 'data' in result && 'total' in result) {
        allData = result.data
      } else {
        allData = result as AppointmentWithCustomer[]
      }
      
      setAllAppointments(allData)
      setTotalAppointments(allData.length)
    } catch (error) {
      console.error("Error loading appointments:", error)
    } finally {
      setLoadingAppointments(false)
    }
  }, [filters])

  // Load appointments theo trang khi không search
  const loadPageAppointments = useCallback(async () => {
    try {
      setLoadingAppointments(true)
      
      const result = await getAppointments(
        {
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          filterByCreatedAt: filters.showCreatedAt
        },
        currentPage,
        PAGE_SIZE
      )
      
      let pageData: AppointmentWithCustomer[] = []
      let totalCount = 0
      
      if (typeof result === 'object' && 'data' in result && 'total' in result) {
        pageData = result.data
        totalCount = result.total
      } else {
        pageData = result as AppointmentWithCustomer[]
        totalCount = result.length
      }
      
      setCurrentPageAppointments(pageData)
      setTotalAppointments(totalCount)
      setTotalPages(Math.max(1, Math.ceil(totalCount / PAGE_SIZE)))
    } catch (error) {
      console.error("Error loading appointments:", error)
    } finally {
      setLoadingAppointments(false)
    }
  }, [filters, currentPage])

  // Filter appointments based on search term
  const filteredAppointments = useMemo(() => {
    if (!filters.search) return allAppointments
    
    const term = filters.search.toLowerCase()
    return allAppointments.filter(appointment => 
      appointment.customers?.name?.toLowerCase().includes(term) ||
      appointment.customers?.phone?.includes(term)
    )
  }, [allAppointments, filters.search])

  // Tính toán phân trang cho dữ liệu đã filter
  const paginatedAppointments = useMemo(() => {
    if (!filters.search) {
      // Nếu không search, sử dụng dữ liệu từ API
      return currentPageAppointments
    }
    
    // Nếu đang search, phân trang ở client side
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    return filteredAppointments.slice(startIndex, endIndex)
  }, [currentPageAppointments, filteredAppointments, currentPage, filters.search])

  // Tính toán tổng số trang cho dữ liệu đã filter
  const totalPagesForFiltered = useMemo(() => {
    if (!filters.search) {
      return Math.max(1, Math.ceil(totalAppointments / PAGE_SIZE))
    }
    return Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE))
  }, [filteredAppointments.length, totalAppointments, filters.search])

  // Effect để load data khi thay đổi filter hoặc search
  useEffect(() => {
    if (filters.search) {
      loadAllAppointments()
      // Chỉ reset về trang 1 khi thay đổi search term, không phải khi thay đổi trang
      if (filters.search !== previousSearchTerm) {
        setCurrentPage(1)
        updateFilters({ page: 1 })
        setPreviousSearchTerm(filters.search)
      }
    } else {
      loadPageAppointments()
      setPreviousSearchTerm("")
    }
  }, [filters.search, loadAllAppointments, loadPageAppointments, previousSearchTerm])

  // Effect riêng để xử lý thay đổi trang khi không search
  useEffect(() => {
    if (!filters.search) {
      loadPageAppointments()
    }
  }, [currentPage, filters.search, loadPageAppointments])

  const handleEdit = (id: string) => {
    setSelectedAppointmentId(id)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedAppointmentId(undefined)
    setDialogOpen(true)
  }

  // Thêm hàm xử lý thay đổi ngày
  const handleDateChange = (field: "fromDate" | "toDate") => (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ [field]: e.target.value })
  }

  // Thêm các nút shortcut
  const setDateRange = (days: number) => {
    const today = new Date()
    updateFilters({
      fromDate: format(today, "yyyy-MM-dd"),
      toDate: format(addDays(today, days), "yyyy-MM-dd")
    })
  }

  // Thêm hàm xem lịch hẹn hôm nay
  const setToday = () => {
    const today = format(new Date(), "yyyy-MM-dd")
    updateFilters({
      fromDate: today,
      toDate: today
    })
  }

  // Thêm hàm xem tất cả lịch hẹn
  const showAll = () => {
    updateFilters({
      fromDate: "",
      toDate: ""
    })
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý lịch hẹn</h1>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm lịch hẹn
        </Button>
      </div>

      {/* Thêm bộ lọc thời gian */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Ô tìm kiếm */}
            <div className="flex-1">
              <div className="relative">
                {isSearching ? (
                  <Loader2 className="absolute left-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                )}
                                 <Input 
                   placeholder="Tìm theo tên hoặc số điện thoại khách hàng..." 
                   className="pl-10" 
                   value={searchTerm}
                   onChange={(e) => {
                     const newSearchTerm = e.target.value
                     setSearchTerm(newSearchTerm)
                     updateFilters({ search: newSearchTerm })
                     setIsSearching(true)
                     setTimeout(() => setIsSearching(false), 500)
                   }}
                 />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="fromDate">
                  {filters.showCreatedAt ? "Từ ngày tạo" : "Từ ngày hẹn"}
                </Label>
                <Input
                  type="date"
                  id="fromDate"
                  value={filters.fromDate}
                  onChange={handleDateChange("fromDate")}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="toDate">
                  {filters.showCreatedAt ? "Đến ngày tạo" : "Đến ngày hẹn"}
                </Label>
                <Input
                  type="date"
                  id="toDate"
                  value={filters.toDate}
                  onChange={handleDateChange("toDate")}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={showAll}>Tất cả</Button>
                <Button variant="outline" onClick={setToday}>Hôm nay</Button>
                <Button variant="outline" onClick={() => setDateRange(7)}>7 ngày</Button>
                <Button variant="outline" onClick={() => setDateRange(30)}>30 ngày</Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const today = new Date()
                    updateFilters({
                      fromDate: format(startOfMonth(today), "yyyy-MM-dd"),
                      toDate: format(endOfMonth(today), "yyyy-MM-dd")
                    })
                  }}
                >
                  Tháng này
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Switch
            id="show-created-at"
            checked={filters.showCreatedAt}
            onCheckedChange={(checked) => updateFilters({ showCreatedAt: checked })}
          />
          <Label htmlFor="show-created-at">
            {filters.showCreatedAt ? "Hiển thị ngày giờ tạo" : "Hiển thị ngày giờ hẹn"}
          </Label>
        </div>
        {!loadingAppointments && (
          <div className="text-sm text-muted-foreground">
            {filters.search ? `${filteredAppointments.length} / ${totalAppointments}` : totalAppointments} lịch hẹn
          </div>
        )}
      </div>

      <AppointmentList
        appointments={paginatedAppointments}
        onEdit={handleEdit}
        onRefresh={() => {
          if (filters.search) {
            loadAllAppointments()
          } else {
            loadPageAppointments()
          }
        }}
        showCreatedAt={filters.showCreatedAt}
        loading={loadingAppointments}
      />

      {/* Phân trang */}
      {totalPagesForFiltered > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            {filters.search 
              ? `Hiển thị ${(currentPage - 1) * PAGE_SIZE + 1} - ${Math.min(currentPage * PAGE_SIZE, filteredAppointments.length)} trên tổng số ${filteredAppointments.length} lịch hẹn`
              : `Hiển thị ${(currentPage - 1) * PAGE_SIZE + 1} - ${Math.min(currentPage * PAGE_SIZE, totalAppointments)} trên tổng số ${totalAppointments} lịch hẹn`
            }
          </div>
                      <div className="flex items-center gap-1">
              {/* Nút về trang đầu */}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(1)
                  updateFilters({ page: 1 })
                }}
                className="h-8 w-8 p-0"
              >
                «
              </Button>
              
              {/* Nút trang trước */}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => {
                  const newPage = currentPage - 1
                  setCurrentPage(newPage)
                  updateFilters({ page: newPage })
                }}
                className="h-8 w-8 p-0"
              >
                ‹
              </Button>

              {/* Các nút số trang */}
              {(() => {
                const pages = []
                const maxVisiblePages = 5
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                let endPage = Math.min(totalPagesForFiltered, startPage + maxVisiblePages - 1)
                
                // Điều chỉnh startPage nếu endPage quá gần cuối
                if (endPage - startPage < maxVisiblePages - 1) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1)
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={i === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentPage(i)
                        updateFilters({ page: i })
                      }}
                      className="h-8 w-8 p-0"
                    >
                      {i}
                    </Button>
                  )
                }

                // Thêm dấu ... nếu có trang sau
                if (endPage < totalPagesForFiltered) {
                  pages.push(
                    <span key="ellipsis" className="px-2 text-muted-foreground">
                      ...
                    </span>
                  )
                }

                return pages
              })()}

              {/* Nút trang sau */}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPagesForFiltered}
                onClick={() => {
                  const newPage = currentPage + 1
                  setCurrentPage(newPage)
                  updateFilters({ page: newPage })
                }}
                className="h-8 w-8 p-0"
              >
                ›
              </Button>

              {/* Nút về trang cuối */}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPagesForFiltered}
                onClick={() => {
                  setCurrentPage(totalPagesForFiltered)
                  updateFilters({ page: totalPagesForFiltered })
                }}
                className="h-8 w-8 p-0"
              >
                »
              </Button>
            </div>
        </div>
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointmentId={selectedAppointmentId}
        onSuccess={() => {
          if (filters.search) {
            loadAllAppointments()
          } else {
            loadPageAppointments()
          }
        }}
      />
    </div>
  )
}

function AppointmentsLoading() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex items-end gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<AppointmentsLoading />}>
      <AppointmentsContent />
    </Suspense>
  )
} 