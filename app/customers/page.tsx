"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, Save, Search, Edit, Eye, Phone, X, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  uploadCustomerFaceImage,
  deleteCustomerFaceImage,
  type Customer,
  type CustomerFilters,
} from "@/lib/customer-api"
import { getTreatmentPackages, type TreatmentPackage } from "@/lib/treatment-package-api"
import { createTreatment } from "@/lib/treatment-api"
import { debounce } from "lodash"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [treatmentPackages, setTreatmentPackages] = useState<TreatmentPackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)

  // Dialog states
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [isViewingCustomer, setIsViewingCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Filter states
  const [filters, setFilters] = useState<CustomerFilters>({
    search: "",
    status: "all",
  })

  // Search state
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const { toast } = useToast()

  // Form data for add/edit
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "" as "male" | "female" | null,
    birth_date: "",
    address: "",
    notes: "",
    status: "active" as const,
    treatment_package_id: "",
  })

  // Thêm vào phần state declarations
  const [uploadingNewCustomerImage, setUploadingNewCustomerImage] = useState(false)
  const [newCustomerImageFile, setNewCustomerImageFile] = useState<File | null>(null)
  const [newCustomerImagePreview, setNewCustomerImagePreview] = useState<string | null>(null)

  // Load customers on mount and when filters change
  useEffect(() => {
    loadCustomers()
    loadTreatmentPackages()
  }, [filters])

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }))
    }, 500) // Tăng debounce time lên 500ms

    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const data = await getCustomers(filters)
      setCustomers(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách khách hàng",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  const loadTreatmentPackages = async () => {
    try {
      setLoadingPackages(true)
      const data = await getTreatmentPackages()
      setTreatmentPackages(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách gói điều trị",
        variant: "destructive",
      })
    } finally {
      setLoadingPackages(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSearching(true)
    setSearchTerm(e.target.value)
  }

  const handleStatusFilter = useCallback((status: "all" | "active" | "inactive" | "pending") => {
    setFilters((prev) => ({ ...prev, status }))
  }, [])

  // Thêm vào phần function declarations
  const handleNewCustomerImageUpload = (file: File) => {
    setNewCustomerImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setNewCustomerImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeNewCustomerImage = () => {
    setNewCustomerImageFile(null)
    setNewCustomerImagePreview(null)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      gender: "",
      birth_date: "",
      address: "",
      notes: "",
      status: "active",
      treatment_package_id: "",
    })
    removeNewCustomerImage()
  }

  const handleAddCustomer = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập họ tên khách hàng",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Tạo khách hàng trước
      const customerData = {
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        gender: formData.gender as "male" | "female" | null,
        birth_date: formData.birth_date || null,
        address: formData.address || null,
        notes: formData.notes || null,
        status: formData.status,
      }
      const newCustomer = await createCustomer(customerData)

      // Nếu có ảnh, upload ảnh
      if (newCustomerImageFile) {
        setUploadingNewCustomerImage(true)
        await uploadCustomerFaceImage(newCustomerImageFile, newCustomer.id)
      }

      // Nếu có chọn gói điều trị, tạo liệu trình
      if (formData.treatment_package_id) {
        const selectedPackage = treatmentPackages.find((pkg) => pkg.id === formData.treatment_package_id)
        if (selectedPackage) {
          await createTreatment({
            customer_id: newCustomer.id,
            treatment_name: selectedPackage.name,
            total_sessions: selectedPackage.total_sessions,
            price: selectedPackage.price,
            start_date: new Date().toISOString().split("T")[0],
          })
        }
      }

      toast({
        title: "Thành công",
        description: "Đã thêm khách hàng mới",
      })
      setIsAddingCustomer(false)
      resetForm()
      removeNewCustomerImage()
      loadCustomers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm khách hàng",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setUploadingNewCustomerImage(false)
    }
  }

  const handleEditCustomer = async () => {
    if (!selectedCustomer || !formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập họ tên khách hàng",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await updateCustomer(selectedCustomer.id, formData)
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin khách hàng",
      })
      setIsEditingCustomer(false)
      setSelectedCustomer(null)
      resetForm()
      loadCustomers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật thông tin khách hàng",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleViewCustomer = async (customer: Customer) => {
    try {
      const fullCustomerData = await getCustomer(customer.id)
      setSelectedCustomer(fullCustomerData)
      setIsViewingCustomer(true)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin khách hàng",
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      gender: customer.gender || "",
      birth_date: customer.birth_date || "",
      address: customer.address || "",
      notes: customer.notes || "",
      status: customer.status,
      treatment_package_id: customer.treatment_package_id || "",
    })
    setIsEditingCustomer(true)
  }

  const handleImageUpload = async (file: File) => {
    if (!selectedCustomer) return

    setUploading(true)
    try {
      const updatedCustomer = await uploadCustomerFaceImage(file, selectedCustomer.id)
      setSelectedCustomer(updatedCustomer)
      toast({
        title: "Thành công",
        description: "Đã tải lên ảnh nhận diện",
      })
      loadCustomers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải lên ảnh",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async () => {
    if (!selectedCustomer) return

    try {
      const updatedCustomer = await deleteCustomerFaceImage(selectedCustomer.id)
      setSelectedCustomer(updatedCustomer)
      toast({
        title: "Thành công",
        description: "Đã xóa ảnh nhận diện",
      })
      loadCustomers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa ảnh",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Đang hoạt động</Badge>
      case "inactive":
        return <Badge variant="secondary">Không hoạt động</Badge>
      case "pending":
        return <Badge variant="outline">Chờ xử lý</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Chưa có"
    return new Date(dateString).toLocaleDateString("vi-VN")
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Quản lý khách hàng</h1>
        <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm khách hàng
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm khách hàng mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Face ID Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Ảnh nhận diện</CardTitle>
                </CardHeader>
                <CardContent>
                  {newCustomerImagePreview ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                          <img
                            src={newCustomerImagePreview || "/placeholder.svg"}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Ảnh đã chọn</p>
                          <Button variant="outline" size="sm" onClick={removeNewCustomerImage}>
                            <X className="h-4 w-4 mr-2" />
                            Xóa ảnh
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                      <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-2 sm:mb-4" />
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">Tải lên ảnh khuôn mặt</p>
                      <p className="text-xs text-gray-500 mb-2 sm:mb-4">JPG, PNG. Tối đa: 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleNewCustomerImageUpload(file)
                        }}
                        className="hidden"
                        id="new-customer-image"
                      />
                      <label htmlFor="new-customer-image">
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Chọn ảnh
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Treatment Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Tạo liệu trình</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="treatmentPackage">Gói điều trị *</Label>
                      <Select
                        value={formData.treatment_package_id}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, treatment_package_id: value }))}
                        disabled={loadingPackages}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn gói điều trị" />
                        </SelectTrigger>
                        <SelectContent>
                          {treatmentPackages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {pkg.name} - {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(pkg.price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="startDate">Ngày bắt đầu</Label>
                      <Input id="startDate" type="date" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="totalSessions">Tổng số buổi</Label>
                      <Input id="totalSessions" type="number" placeholder="6" />
                    </div>
                    <div>
                      <Label htmlFor="price">Giá gói (VNĐ)</Label>
                      <Input id="price" type="number" placeholder="5000000" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="treatmentNotes">Ghi chú về liệu trình</Label>
                    <Textarea id="treatmentNotes" placeholder="Ghi chú về tình trạng da, yêu cầu đặc biệt..." />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Họ và tên *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập họ tên đầy đủ"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="0901234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Giới tính</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birth_date">Ngày sinh</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, birth_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Đang hoạt động</SelectItem>
                      <SelectItem value="pending">Chờ xử lý</SelectItem>
                      <SelectItem value="inactive">Không hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Địa chỉ</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Nhập địa chỉ đầy đủ"
                />
              </div>

              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ghi chú về khách hàng..."
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddingCustomer(false)}
                  disabled={saving || uploadingNewCustomerImage}
                >
                  Hủy
                </Button>
                <Button onClick={handleAddCustomer} disabled={saving || uploadingNewCustomerImage}>
                  {saving || uploadingNewCustomerImage ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {uploadingNewCustomerImage ? "Đang tải ảnh..." : saving ? "Đang lưu..." : "Lưu khách hàng"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                {isSearching ? (
                  <Loader2 className="absolute left-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  placeholder="Tìm kiếm theo tên, số điện thoại..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <Select value={filters.status} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách khách hàng ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Không tìm thấy khách hàng nào</p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="block sm:hidden space-y-4">
                {customers.map((customer) => (
                  <div key={customer.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.phone || "Chưa có SĐT"}</p>
                        <p className="text-sm text-muted-foreground truncate">{customer.email || "Chưa có email"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">{getStatusBadge(customer.status)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditClick(customer)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Sửa
                      </Button>
                      {customer.phone && (
                        <Button size="sm" variant="outline" className="flex-1">
                          <Phone className="h-4 w-4 mr-1" />
                          Gọi
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Giới tính</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.phone || "Chưa có"}</TableCell>
                        <TableCell>{customer.email || "Chưa có"}</TableCell>
                        <TableCell>
                          {customer.gender === "male" ? "Nam" : customer.gender === "female" ? "Nữ" : "Chưa có"}
                        </TableCell>
                        <TableCell>{getStatusBadge(customer.status)}</TableCell>
                        <TableCell>{formatDate(customer.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewCustomer(customer)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditClick(customer)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Customer Dialog */}
      <Dialog open={isViewingCustomer} onOpenChange={setIsViewingCustomer}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết khách hàng</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Photo */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                  {selectedCustomer.face_image_url ? (
                    <img
                      src={selectedCustomer.face_image_url || "/placeholder.svg"}
                      alt={selectedCustomer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-gray-400">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                  <p className="text-muted-foreground">Mã KH: {selectedCustomer.id.slice(0, 8)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Số điện thoại</Label>
                  <p className="text-base">{selectedCustomer.phone || "Chưa có"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-base">{selectedCustomer.email || "Chưa có"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Giới tính</Label>
                  <p className="text-base">
                    {selectedCustomer.gender === "male"
                      ? "Nam"
                      : selectedCustomer.gender === "female"
                        ? "Nữ"
                        : "Chưa có"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Ngày sinh</Label>
                  <p className="text-base">{formatDate(selectedCustomer.birth_date || "")}</p>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Địa chỉ</Label>
                  <p className="text-base">{selectedCustomer.address || "Chưa có"}</p>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Ghi chú</Label>
                  <p className="text-base">{selectedCustomer.notes || "Chưa có"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Trạng thái</Label>
                  <div className="mt-1">{getStatusBadge(selectedCustomer.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Ngày tạo</Label>
                  <p className="text-base">{formatDate(selectedCustomer.created_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditingCustomer} onOpenChange={setIsEditingCustomer}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa thông tin khách hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Face Image Upload */}
            {selectedCustomer && (
              <div>
                <Label>Ảnh nhận diện</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {selectedCustomer.face_image_url ? (
                      <img
                        src={selectedCustomer.face_image_url || "/placeholder.svg"}
                        alt={selectedCustomer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-lg font-bold text-gray-400">
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file)
                        }}
                        className="hidden"
                        id="face-upload"
                        disabled={uploading}
                      />
                      <label htmlFor="face-upload">
                        <Button variant="outline" asChild size="sm" disabled={uploading}>
                          <span>
                            {uploading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Tải lên
                          </span>
                        </Button>
                      </label>
                      {selectedCustomer.face_image_url && (
                        <Button variant="outline" size="sm" onClick={handleDeleteImage}>
                          <X className="h-4 w-4 mr-2" />
                          Xóa
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">JPG, PNG. Tối đa 5MB</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Họ và tên *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập họ tên đầy đủ"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Số điện thoại</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="0901234567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-gender">Giới tính</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-birth_date">Ngày sinh</Label>
                <Input
                  id="edit-birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, birth_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang hoạt động</SelectItem>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-address">Địa chỉ</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Nhập địa chỉ đầy đủ"
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Ghi chú</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Ghi chú về khách hàng..."
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditingCustomer(false)} disabled={saving}>
                Hủy
              </Button>
              <Button onClick={handleEditCustomer} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
