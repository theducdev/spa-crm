"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, User, Calendar, Loader2, Edit, Trash2, AlertCircle, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getCustomers, type Customer, type CustomerFilters } from "@/lib/customer-api"
import { getTreatmentsByCustomer, createTreatment, updateTreatment, deleteTreatment, updateTreatmentCurrentSession } from "@/lib/treatment-api"
import type { Treatment } from "@/lib/supabase"
import { getTreatmentPackages, type TreatmentPackage } from "@/lib/treatment-package-api"
import { maskPhoneNumber } from "@/lib/utils"
import { useFilterParams } from "@/hooks/use-filter-params"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Skeleton } from "@/components/ui/skeleton"

function TreatmentsContent() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [treatmentPackages, setTreatmentPackages] = useState<TreatmentPackage[]>([])
  const { filters: searchFilters, updateFilters } = useFilterParams({
    search: "",
    selectedCustomerId: ""
  })
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showNewTreatmentDialog, setShowNewTreatmentDialog] = useState(false)
  const [showEditTreatmentDialog, setShowEditTreatmentDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [treatmentSearchValue, setTreatmentSearchValue] = useState("")
  const [showCustomerInfoDialog, setShowCustomerInfoDialog] = useState(false)
  const [showEditSessionDialog, setShowEditSessionDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [updateResult, setUpdateResult] = useState<{
    oldSession: number;
    newSession: number;
    action: "increase" | "decrease" | "none";
  } | null>(null)
  const currentSessionInputRef = useRef<HTMLInputElement>(null)

  // Form data for new/edit treatment
  const [formData, setFormData] = useState({
    treatment_package_id: "",
    start_date: new Date().toISOString().split("T")[0],
    status: "active" as "active" | "completed",
    notes: ""
  })

  useEffect(() => {
    loadCustomers()
    loadTreatmentPackages()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchFilters.search])

  // Thêm effect để theo dõi selectedCustomerId từ URL
  useEffect(() => {
    if (searchFilters.selectedCustomerId && customers.length > 0) {
      const customer = customers.find(c => c.id === searchFilters.selectedCustomerId)
      if (customer) {
        setSelectedCustomer(customer)
      }
    } else if (!searchFilters.selectedCustomerId) {
      setSelectedCustomer(null)
    }
  }, [searchFilters.selectedCustomerId, customers])

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerTreatments()
    }
  }, [selectedCustomer])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const filters: CustomerFilters = {
        status: "active",
      }
      if (searchFilters.search) {
        filters.search = searchFilters.search
      }
      const data = await getCustomers(filters)
      setCustomers(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách khách hàng",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTreatmentPackages = async () => {
    try {
      const data = await getTreatmentPackages()
      setTreatmentPackages(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách gói điều trị",
        variant: "destructive",
      })
    }
  }

  const loadCustomerTreatments = async () => {
    if (!selectedCustomer) return
    try {
      const data = await getTreatmentsByCustomer(selectedCustomer.id)
      setTreatments(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách liệu trình",
        variant: "destructive",
      })
    }
  }

  const handleCreateTreatment = async () => {
    if (!selectedCustomer || !formData.treatment_package_id || !formData.start_date) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      })
      return
    }

    try {
      const selectedPackage = treatmentPackages.find(p => p.id === formData.treatment_package_id)
      if (!selectedPackage) return

      await createTreatment({
        customer_id: selectedCustomer.id,
        treatment_name: selectedPackage.name,
        total_sessions: selectedPackage.total_sessions,
        price: selectedPackage.price,
        start_date: formData.start_date,
        notes: formData.notes
      })

      toast({
        title: "Thành công",
        description: "Đã tạo liệu trình mới",
      })

      setShowNewTreatmentDialog(false)
      loadCustomerTreatments()
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi",
        description: "Không thể tạo liệu trình mới",
        variant: "destructive",
      })
    }
  }

  const handleEditTreatment = (treatment: Treatment) => {
    setSelectedTreatment(treatment)
    setFormData({
      treatment_package_id: treatmentPackages.find(p => p.name === treatment.treatment_name)?.id || "",
      start_date: treatment.start_date,
      status: treatment.status as "active" | "completed",
      notes: treatment.notes || ""
    })
    setShowEditTreatmentDialog(true)
  }

  const handleDeleteTreatment = (treatment: Treatment) => {
    setSelectedTreatment(treatment)
    setShowDeleteDialog(true)
  }

  const handleUpdateTreatment = async () => {
    if (!selectedTreatment || !formData.treatment_package_id || !formData.start_date) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      })
      return
    }

    try {
      const selectedPackage = treatmentPackages.find(p => p.id === formData.treatment_package_id)
      if (!selectedPackage) return

      await updateTreatment(selectedTreatment.id, {
        treatment_name: selectedPackage.name,
        total_sessions: selectedPackage.total_sessions,
        price: selectedPackage.price,
        start_date: formData.start_date,
        status: formData.status,
        notes: formData.notes
      })

      toast({
        title: "Thành công",
        description: "Đã cập nhật liệu trình",
      })

      setShowEditTreatmentDialog(false)
      loadCustomerTreatments()
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật liệu trình",
        variant: "destructive",
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedTreatment) return

    try {
      await deleteTreatment(selectedTreatment.id)

      toast({
        title: "Thành công",
        description: "Đã xóa liệu trình",
      })

      setShowDeleteDialog(false)
      loadCustomerTreatments()
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa liệu trình",
        variant: "destructive",
      })
    }
  }

  // Add this function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { 
      style: "currency", 
      currency: "VND" 
    }).format(value)
  }

  const formatDebt = (debt: number | null) => {
    if (debt === null || debt === 0) return "Không có nợ"
    return new Intl.NumberFormat("vi-VN", { 
      style: "currency", 
      currency: "VND" 
    }).format(debt)
  }

  const handleTreatmentClick = (treatmentId: string) => {
    router.push(`/treatment?id=${treatmentId}`)
  }

  const handleCustomerClick = (customer: Customer) => {
    updateFilters({ selectedCustomerId: customer.id })
    setShowCustomerInfoDialog(true)
  }

  const handleCloseCustomerDialog = () => {
    setShowCustomerInfoDialog(false)
  }

  const handleClearCustomerSelection = () => {
    updateFilters({ selectedCustomerId: "" })
    setSelectedCustomer(null)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Quản lý liệu trình</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Danh sách khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc số điện thoại..."
                  value={searchFilters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-lg">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                ) : customers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {searchFilters.search ? "Không tìm thấy khách hàng" : "Chưa có khách hàng nào"}
                  </div>
                ) : (
                  <div className="divide-y">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-4 cursor-pointer hover:bg-accent ${
                          selectedCustomer?.id === customer.id ? "bg-accent" : ""
                        }`}
                        onClick={() => handleCustomerClick(customer)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {maskPhoneNumber(customer.phone)}
                        </div>
                        <div className={cn(
                          "text-sm",
                          customer.debt && customer.debt > 0 ? "text-destructive" : "text-muted-foreground"
                        )}>
                          Nợ: {formatDebt(customer.debt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treatment List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              {selectedCustomer ? (
                <div>
                  Liệu trình của {selectedCustomer.name}
                  <div className="text-sm font-normal text-muted-foreground">
                    {maskPhoneNumber(selectedCustomer.phone)}
                  </div>
                  <div className={cn(
                    "text-sm font-normal",
                    selectedCustomer.debt && selectedCustomer.debt > 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    Nợ: {formatDebt(selectedCustomer.debt)}
                  </div>
                </div>
              ) : (
                "Danh sách liệu trình"
              )}
            </CardTitle>
            {selectedCustomer && (
              <Button onClick={() => setShowNewTreatmentDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm liệu trình
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedCustomer ? (
              <div className="text-center py-8 text-muted-foreground">
                Chọn một khách hàng để xem danh sách liệu trình
              </div>
            ) : treatments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Khách hàng chưa có liệu trình nào
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên liệu trình</TableHead>
                    <TableHead>Tiến độ</TableHead>
                    <TableHead>Ngày bắt đầu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatments.map((treatment) => (
                    <TableRow key={treatment.id}>
                      <TableCell>
                        <button
                          onClick={() => handleTreatmentClick(treatment.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {treatment.treatment_name}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{treatment.current_session}/{treatment.total_sessions} buổi</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTreatment(treatment)
                              setShowEditSessionDialog(true)
                            }}
                            className="h-6 w-6"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{treatment.start_date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={treatment.status === "active" ? "default" : "secondary"}>
                            {treatment.status === "active" ? "Đang điều trị" : "Hoàn thành"}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditTreatment(treatment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTreatment(treatment)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Treatment Dialog */}
      <Dialog open={showNewTreatmentDialog} onOpenChange={setShowNewTreatmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo liệu trình mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Khách hàng</Label>
              <div className="font-medium">{selectedCustomer?.name}</div>
              <div className="text-sm text-muted-foreground">
                {maskPhoneNumber(selectedCustomer?.phone || null)}
              </div>
              <div className={cn(
                "text-sm",
                selectedCustomer?.debt && selectedCustomer.debt > 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                Nợ: {formatDebt(selectedCustomer?.debt || null)}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatment_package">Gói điều trị</Label>
              <Command className="border rounded-md">
                <CommandInput
                  id="treatment_package"
                  placeholder="Tìm gói điều trị..."
                  value={treatmentSearchValue}
                  onValueChange={setTreatmentSearchValue}
                />
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {treatmentPackages.map((pkg) => (
                    <CommandItem
                      key={pkg.id}
                      value={pkg.name}
                      onSelect={() => {
                        setFormData(prev => ({ ...prev, treatment_package_id: pkg.id }))
                        setTreatmentSearchValue(pkg.name)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          formData.treatment_package_id === pkg.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{pkg.name}</span>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{pkg.total_sessions} buổi</span>
                          <span>{formatCurrency(pkg.price)}</span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Ngày bắt đầu</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, start_date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú về liệu trình</Label>
              <Textarea
                id="notes"
                placeholder="Ghi chú về tình trạng da, yêu cầu đặc biệt..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={handleCreateTreatment}>
              Tạo liệu trình
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Treatment Dialog */}
      <Dialog open={showEditTreatmentDialog} onOpenChange={setShowEditTreatmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật liệu trình</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Khách hàng</Label>
              <div className="font-medium">{selectedCustomer?.name}</div>
              <div className="text-sm text-muted-foreground">
                {maskPhoneNumber(selectedCustomer?.phone || null)}
              </div>
              <div className={cn(
                "text-sm",
                selectedCustomer?.debt && selectedCustomer.debt > 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                Nợ: {formatDebt(selectedCustomer?.debt || null)}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatment_package_edit">Gói điều trị</Label>
              <div className="relative">
                <Command className="rounded-lg border shadow-sm">
                  <CommandInput 
                    id="treatment_package_edit"
                    placeholder="Tìm gói điều trị..." 
                    className="h-9"
                    value={treatmentSearchValue}
                    onValueChange={(value) => setTreatmentSearchValue(value)}
                  />
                  <CommandEmpty>Không tìm thấy gói điều trị</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-auto">
                    {treatmentPackages.map((pkg) => (
                      <CommandItem
                        key={pkg.id}
                        value={pkg.name}
                        onSelect={() => {
                          setFormData(prev => ({ ...prev, treatment_package_id: pkg.id }))
                        }}
                        className="flex items-center gap-2"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4",
                            formData.treatment_package_id === pkg.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">{pkg.name}</span>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{pkg.total_sessions} buổi</span>
                            <span>{formatCurrency(pkg.price)}</span>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Ngày bắt đầu</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, start_date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "completed") =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang điều trị</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú về liệu trình</Label>
              <Textarea
                id="notes"
                placeholder="Ghi chú về tình trạng da, yêu cầu đặc biệt..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={handleUpdateTreatment}>
              Cập nhật liệu trình
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa liệu trình</DialogTitle>
            <DialogDescription className="pt-4">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p>Bạn có chắc chắn muốn xóa liệu trình này?</p>
                  <p className="font-medium mt-2">{selectedTreatment?.treatment_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Tiến độ: {selectedTreatment?.current_session}/{selectedTreatment?.total_sessions} buổi
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Xóa liệu trình
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Info Dialog */}
      <Dialog 
        open={showCustomerInfoDialog} 
        onOpenChange={(open) => {
          if (!open) handleCloseCustomerDialog()
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="mb-4 pr-6">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" aria-hidden="true" />
              <span>Thông tin khách hàng</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Chi tiết thông tin và liệu trình của khách hàng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedCustomer && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Tên khách hàng</Label>
                    <div id="customer-name" className="font-medium">{selectedCustomer.name}</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-phone">Số điện thoại</Label>
                    <div id="customer-phone" className="text-sm">
                      {maskPhoneNumber(selectedCustomer.phone)}
                    </div>
                    <div className={cn(
                      "text-sm",
                      selectedCustomer.debt && selectedCustomer.debt > 0 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      Nợ: {formatDebt(selectedCustomer.debt)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treatment-count">Số liệu trình</Label>
                    <div id="treatment-count" className="text-sm">
                      {treatments.length} liệu trình
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4" id="treatment-list-title">Danh sách liệu trình</h3>
                  {treatments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground" role="status">
                      Khách hàng chưa có liệu trình nào
                    </div>
                  ) : (
                    <div role="region" aria-labelledby="treatment-list-title" className="overflow-x-auto -mx-4 md:mx-0">
                      <div className="min-w-[600px] md:w-full p-4 md:p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[35%]">Tên liệu trình</TableHead>
                              <TableHead className="w-[20%]">Tiến độ</TableHead>
                              <TableHead className="w-[20%]">Ngày bắt đầu</TableHead>
                              <TableHead className="w-[25%]">Trạng thái</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {treatments.map((treatment) => (
                              <TableRow key={treatment.id}>
                                <TableCell className="font-medium">
                                  <button
                                    onClick={() => {
                                      handleTreatmentClick(treatment.id)
                                      setShowCustomerInfoDialog(false)
                                    }}
                                    className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                                    aria-label={`Xem chi tiết liệu trình ${treatment.treatment_name}`}
                                  >
                                    {treatment.treatment_name}
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span>{treatment.current_session}/{treatment.total_sessions} buổi</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedTreatment(treatment)
                                        setShowEditSessionDialog(true)
                                      }}
                                      className="h-6 w-6"
                                      aria-label={`Chỉnh sửa số buổi của liệu trình ${treatment.treatment_name}`}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>{treatment.start_date}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={treatment.status === "active" ? "default" : "secondary"}>
                                      {treatment.status === "active" ? "Đang điều trị" : "Hoàn thành"}
                                    </Badge>
                                    <div className="flex items-center gap-1 ml-auto">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditTreatment(treatment)
                                        }}
                                        aria-label={`Chỉnh sửa liệu trình ${treatment.treatment_name}`}
                                      >
                                        <Edit className="h-4 w-4" aria-hidden="true" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteTreatment(treatment)
                                        }}
                                        aria-label={`Xóa liệu trình ${treatment.treatment_name}`}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <Button 
                    className="w-full" 
                    onClick={() => setShowNewTreatmentDialog(true)}
                    aria-label="Thêm liệu trình mới cho khách hàng"
                  >
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Thêm liệu trình mới
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Current Session Dialog */}
      <Dialog open={showEditSessionDialog} onOpenChange={setShowEditSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật số buổi điều trị</DialogTitle>
            <DialogDescription>
              Nhập số buổi điều trị hiện tại cho liệu trình {selectedTreatment?.treatment_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current_session">Số buổi hiện tại</Label>
              <Input
                id="current_session"
                type="number"
                min={0}
                max={selectedTreatment?.total_sessions}
                defaultValue={selectedTreatment?.current_session}
                ref={currentSessionInputRef}
              />
              <p className="text-sm text-muted-foreground">
                Tổng số buổi: {selectedTreatment?.total_sessions} buổi
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={async () => {
                try {
                  if (!selectedTreatment || !currentSessionInputRef.current) return

                  const newSession = parseInt(currentSessionInputRef.current.value)
                  const oldSession = selectedTreatment.current_session
                  
                  await updateTreatmentCurrentSession(selectedTreatment.id, newSession)
                  
                  setUpdateResult({
                    oldSession,
                    newSession,
                    action: newSession > oldSession ? "increase" : newSession < oldSession ? "decrease" : "none"
                  })
                  
                  setShowEditSessionDialog(false)
                  setShowSuccessDialog(true)
                  await loadCustomerTreatments()
                } catch (error: any) {
                  toast({
                    title: "Lỗi",
                    description: error.message || "Không thể cập nhật số buổi điều trị",
                    variant: "destructive",
                  })
                }
              }}
            >
              Cập nhật
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Cập nhật thành công
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {updateResult && (
              <div className="space-y-4">
                <div className="text-center text-lg font-medium">
                  {selectedTreatment?.treatment_name}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Số buổi cũ</div>
                    <div className="text-2xl font-semibold">{updateResult.oldSession}</div>
                  </div>
                  <div className="text-2xl text-muted-foreground">→</div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Số buổi mới</div>
                    <div className="text-2xl font-semibold">{updateResult.newSession}</div>
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {updateResult.action === "increase" ? (
                    <>Đã tự động tạo thêm {updateResult.newSession - updateResult.oldSession} buổi điều trị mới</>
                  ) : updateResult.action === "decrease" ? (
                    <>Đã xóa {updateResult.oldSession - updateResult.newSession} buổi điều trị cuối cùng</>
                  ) : (
                    <>Không có thay đổi về số buổi</>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              className="w-full" 
              onClick={() => {
                setShowSuccessDialog(false)
                setUpdateResult(null)
              }}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TreatmentsLoading() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-10 w-1/3" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

export default function TreatmentsPage() {
  return (
    <Suspense fallback={<TreatmentsLoading />}>
      <TreatmentsContent />
    </Suspense>
  )
} 