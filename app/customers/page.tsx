"use client"

import { useState, useEffect, useCallback, useRef, memo, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, Save, Search, Edit, Eye, Phone, X, Loader2, Trash2, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  uploadCustomerFaceImage,
  deleteCustomerFaceImage,
  deleteCustomer,
  type Customer,
} from "@/lib/customer-api"
import { getTreatmentPackages, type TreatmentPackage } from "@/lib/treatment-package-api"
import { createTreatment } from "@/lib/treatment-api"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getCustomerTags, type CustomerTag } from "@/lib/customer-tag-api"
import { SearchableCombobox } from "@/components/ui/searchable-combobox"
import { useFilterParams } from "@/hooks/use-filter-params"
import { Skeleton } from "@/components/ui/skeleton"

interface CustomerFormData {
  name: string
  phone: string
  email: string
  gender: "male" | "female" | null
  birth_date: string
  address: string
  notes: string
  status: "active" | "inactive" | "pending"
  tag_id: string | null
  debt: number
}

interface CustomerFilters {
  [key: string]: string | string[] | number | boolean | null | undefined
  search: string
  status: "all" | "active" | "inactive" | "pending"
  tag_id: string | null
}

// Tách thành component riêng để tránh re-render không cần thiết
const DebtInput = memo(({ 
  value, 
  onChange 
}: { 
  value: number
  onChange: (value: number) => void 
}) => {
  const [localValue, setLocalValue] = useState(() => 
    value ? new Intl.NumberFormat("vi-VN").format(value) : ""
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '')
    const formattedValue = rawValue ? new Intl.NumberFormat("vi-VN").format(parseInt(rawValue)) : ""
    setLocalValue(formattedValue)
    onChange(rawValue ? parseInt(rawValue) : 0)
  }

  // Chỉ cập nhật local value khi prop value thay đổi và khác với giá trị đã parse
  useEffect(() => {
    const currentNumericValue = parseInt(localValue.replace(/[^0-9]/g, '')) || 0
    if (value !== currentNumericValue) {
      setLocalValue(value ? new Intl.NumberFormat("vi-VN").format(value) : "")
    }
  }, [value])

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={handleChange}
      placeholder="0"
      className="text-right"
    />
  )
})
DebtInput.displayName = "DebtInput"

function CustomersContent() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [treatmentPackages, setTreatmentPackages] = useState<TreatmentPackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [tempPhone, setTempPhone] = useState("")

  // Dialog states
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [isViewingCustomer, setIsViewingCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Replace filters state with useFilterParams
  const { filters, updateFilters } = useFilterParams<CustomerFilters>({
    search: "",
    status: "all",
    tag_id: null
  })

  // Sync searchTerm with URL search param
  useEffect(() => {
    setSearchTerm(filters.search)
  }, [filters.search])

  // Search state
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const { toast } = useToast()

  // Form data for add/edit
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    phone: "",
    email: "",
    gender: null,
    birth_date: "",
    address: "",
    notes: "",
    status: "active",
    tag_id: null,
    debt: 0,
  })

  // Add formRef to store temporary form data
  const formRef = useRef<CustomerFormData>({
    name: "",
    phone: "",
    email: "",
    gender: null,
    birth_date: "",
    address: "",
    notes: "",
    status: "active",
    tag_id: null,
    debt: 0,
  })

  // Thêm state riêng cho gói điều trị
  const [selectedTreatmentPackage, setSelectedTreatmentPackage] = useState<string>("")

  // Update formRef when formData changes
  useEffect(() => {
    formRef.current = formData
  }, [formData])

  // Function to update formRef without causing re-render
  const updateFormField = (field: keyof CustomerFormData, value: any) => {
    formRef.current = {
      ...formRef.current,
      [field]: value
    }
  }

  // Function to sync formRef with formData (use this when needed, e.g., on blur or submit)
  const syncFormData = () => {
    setFormData(formRef.current)
  }

  // Thêm vào phần state declarations
  const [uploadingNewCustomerImage, setUploadingNewCustomerImage] = useState(false)
  const [newCustomerImageFile, setNewCustomerImageFile] = useState<File | null>(null)
  const [newCustomerImagePreview, setNewCustomerImagePreview] = useState<string | null>(null)

  // Delete confirmation
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [treatmentSearchOpen, setTreatmentSearchOpen] = useState(false)
  const [treatmentSearchValue, setTreatmentSearchValue] = useState("")

  // Thêm ref cho textarea
  const treatmentNotesRef = useRef<HTMLTextAreaElement>(null)

  const [tags, setTags] = useState<CustomerTag[]>([])

  // Load initial data
  useEffect(() => {
    loadTreatmentPackages()
    loadTags()
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search: searchTerm })
    }, 1000)
    return () => clearTimeout(timer)
  }, [searchTerm, updateFilters])

  // Load customers when filters change
  useEffect(() => {
    loadCustomers()
  }, [filters.search, filters.status, filters.tag_id])

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

  const loadTags = async () => {
    try {
      const data = await getCustomerTags()
      setTags(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thẻ tag",
        variant: "destructive",
      })
    }
  }

  // Handle search with debounce
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setIsSearching(true)
    setSearchTerm(value)
  }

  const handleStatusFilter = useCallback((status: "all" | "active" | "inactive" | "pending") => {
    updateFilters({ status })
  }, [updateFilters])

  const handleTagFilter = useCallback((tag_id: string | null) => {
    updateFilters({ tag_id })
  }, [updateFilters])

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
      gender: null,
      birth_date: "",
      address: "",
      notes: "",
      status: "active",
      tag_id: null,
      debt: 0,
    })
    formRef.current = {
      name: "",
      phone: "",
      email: "",
      gender: null,
      birth_date: "",
      address: "",
      notes: "",
      status: "active",
      tag_id: null,
      debt: 0,
    }
    setSelectedTreatmentPackage("")
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
        tag_id: formData.tag_id,
        debt: formData.debt || 0,
      }
      const newCustomer = await createCustomer(customerData)

      // Nếu có ảnh, upload ảnh
      if (newCustomerImageFile) {
        setUploadingNewCustomerImage(true)
        await uploadCustomerFaceImage(newCustomerImageFile, newCustomer.id)
      }

      // Nếu có chọn gói điều trị, tạo liệu trình
      if (selectedTreatmentPackage) {
        const selectedPackage = treatmentPackages.find((pkg) => pkg.id === selectedTreatmentPackage)
        if (selectedPackage) {
          await createTreatment({
            customer_id: newCustomer.id,
            treatment_name: selectedPackage.name,
            total_sessions: selectedPackage.total_sessions,
            price: selectedPackage.price,
            start_date: new Date().toISOString().split("T")[0],
            notes: formData.notes || ""
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
    if (!selectedCustomer) return

    setSaving(true)
    try {
      const customerData = {
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        gender: formData.gender as "male" | "female" | null,
        birth_date: formData.birth_date || null,
        address: formData.address || null,
        notes: formData.notes || null,
        status: formData.status,
        tag_id: formData.tag_id,
        debt: formData.debt || 0,
      }
      await updateCustomer(selectedCustomer.id, customerData)

      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin khách hàng",
      })
      setIsEditingCustomer(false)
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

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      gender: customer.gender as "male" | "female" | null,
      birth_date: customer.birth_date || "",
      address: customer.address || "",
      notes: customer.notes || "",
      status: customer.status,
      tag_id: customer.tag_id,
      debt: customer.debt || 0,
    })
    setIsViewingCustomer(true)
  }

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      gender: customer.gender,
      birth_date: customer.birth_date || "",
      address: customer.address || "",
      notes: customer.notes || "",
      status: customer.status,
      tag_id: customer.tag_id,
      debt: customer.debt || 0,
    })
    setIsEditingPhone(false)
    setTempPhone("")
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

  const maskPhoneNumber = (phone: string | null) => {
    if (!phone) return "Chưa có"
    return phone.length > 5 ? `*****${phone.slice(-5)}` : phone
  }

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return

    setDeleting(true)
    try {
      await deleteCustomer(customerToDelete.id)
      toast({
        title: "Thành công",
        description: "Đã xóa khách hàng",
      })
      setIsConfirmingDelete(false)
      setCustomerToDelete(null)
      loadCustomers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa khách hàng",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleInputChange = useCallback((field: keyof CustomerFormData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }
  }, [])

  const handleSelectChange = useCallback((field: keyof CustomerFormData) => {
    return (value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }, [])

  const handleGenderChange = useCallback((value: "male" | "female" | "") => {
    setFormData(prev => ({
      ...prev,
      gender: value === "" ? null : value
    }))
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { 
      style: "currency", 
      currency: "VND" 
    }).format(value)
  }

  // Thêm hàm format số tiền khi nhập
  const formatNumberInput = (value: string) => {
    // Loại bỏ tất cả ký tự không phải số
    const number = value.replace(/[^0-9]/g, '')
    if (!number) return ''
    return new Intl.NumberFormat("vi-VN").format(parseInt(number))
  }

  // Thêm state để hiển thị số tiền đã format
  const [formattedDebt, setFormattedDebt] = useState("")

  // Thêm useEffect để format số tiền khi formData.debt thay đổi
  useEffect(() => {
    setFormattedDebt(formData.debt ? new Intl.NumberFormat("vi-VN").format(formData.debt) : "")
  }, [formData.debt])

  // Thêm hàm xử lý thay đổi giá trị nợ với debounce
  const handleDebtChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    const numberValue = value ? parseInt(value) : 0
    
    // Cập nhật giá trị đã format ngay lập tức để UI mượt
    setFormattedDebt(value ? new Intl.NumberFormat("vi-VN").format(parseInt(value)) : "")
    
    // Debounce cập nhật formData
    const timer = setTimeout(() => {
      setFormData(prev => ({ ...prev, debt: numberValue }))
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  const handleCustomerNameClick = (customerId: string) => {
    router.push(`/treatments?selectedCustomerId=${customerId}`)
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
                      <Label htmlFor="treatment_package">Gói điều trị</Label>
                      <SearchableCombobox
                        options={treatmentPackages.map(pkg => ({
                          value: pkg.id,
                          label: pkg.name
                        }))}
                        value={selectedTreatmentPackage}
                        onChange={setSelectedTreatmentPackage}
                        placeholder="Chọn gói điều trị"
                        className="w-full"
                      />
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
                    <Textarea 
                      ref={treatmentNotesRef}
                      id="treatmentNotes" 
                      placeholder="Ghi chú về tình trạng da, yêu cầu đặc biệt..."
                      defaultValue={formData.notes}
                      onChange={(e) => {
                        if (formRef.current) {
                          formRef.current.notes = e.target.value
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Họ và tên *</Label>
                  <Input
                    id="name"
                    defaultValue={formData.name}
                    onChange={(e) => updateFormField("name", e.target.value)}
                    onBlur={syncFormData}
                    placeholder="Nhập họ tên đầy đủ"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      {isEditingPhone ? (
                        <Input
                          id="edit-phone"
                          value={tempPhone}
                          onChange={(e) => {
                            const phoneNumber = e.target.value.replace(/[^0-9]/g, '')
                            setTempPhone(phoneNumber)
                          }}
                          onBlur={() => {
                            if (tempPhone) {
                              setFormData(prev => ({ ...prev, phone: tempPhone }))
                            }
                            setIsEditingPhone(false)
                          }}
                          placeholder="0901234567"
                          autoFocus
                        />
                      ) : (
                        <Input
                          id="edit-phone"
                          value={maskPhoneNumber(formData.phone)}
                          readOnly
                          placeholder="0901234567"
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          if (isEditingPhone) {
                            setTempPhone("")
                            setFormData(prev => ({ ...prev, phone: "" }))
                            setIsEditingPhone(false)
                          } else {
                            setTempPhone("")
                            setIsEditingPhone(true)
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">
                          {isEditingPhone ? "Hủy" : "Sửa số điện thoại"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={formData.email}
                    onChange={(e) => updateFormField("email", e.target.value)}
                    onBlur={syncFormData}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Giới tính</Label>
                  <Select
                    defaultValue={formData.gender || ""}
                    onValueChange={(value) => {
                      updateFormField("gender", value === "" ? null : value)
                      syncFormData()
                    }}
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
                    defaultValue={formData.birth_date}
                    onChange={(e) => updateFormField("birth_date", e.target.value)}
                    onBlur={syncFormData}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    defaultValue={formData.status}
                    onValueChange={(value: "active" | "inactive" | "pending") => {
                      updateFormField("status", value)
                      syncFormData()
                    }}
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
                  defaultValue={formData.address}
                  onChange={(e) => updateFormField("address", e.target.value)}
                  onBlur={syncFormData}
                  placeholder="Nhập địa chỉ đầy đủ"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    defaultValue={formData.notes}
                    onChange={(e) => updateFormField("notes", e.target.value)}
                    onBlur={syncFormData}
                    placeholder="Ghi chú về khách hàng..."
                  />
                </div>
                <div>
                  <Label htmlFor="tag">Thẻ tag</Label>
                  <Select
                    value={formData.tag_id || undefined}
                    onValueChange={(value: string) => {
                      updateFormField("tag_id", value || null)
                      syncFormData()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thẻ tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có</SelectItem>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
            <Select value={filters.tag_id || "all"} onValueChange={(value) => handleTagFilter(value === "all" ? null : value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Thẻ tag">
                  {filters.tag_id ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tags.find(t => t.id === filters.tag_id)?.color }}
                      />
                      {tags.find(t => t.id === filters.tag_id)?.name}
                    </div>
                  ) : (
                    "Tất cả thẻ"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thẻ</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
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
                        <button
                          onClick={() => handleCustomerNameClick(customer.id)}
                          className="font-medium truncate text-left text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors block w-full"
                        >
                          {customer.name}
                        </button>
                        <p className="text-sm text-muted-foreground">{maskPhoneNumber(customer.phone)}</p>
                        <p className="text-sm text-muted-foreground truncate">{customer.email || "Chưa có email"}</p>
                        {customer.tag ? (
                          <Badge className="mt-2" style={{ backgroundColor: customer.tag.color, color: "#fff" }}>
                            {customer.tag.name}
                          </Badge>
                        ) : (
                          <Badge className="mt-2" variant="outline">Không có tag</Badge>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {getStatusBadge(customer.status)}
                        <p className="text-sm font-medium text-muted-foreground">
                          Nợ: {formatCurrency(customer.debt || 0)}
                        </p>
                      </div>
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setCustomerToDelete(customer)
                          setIsConfirmingDelete(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Xóa
                      </Button>
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
                      <TableHead>Thẻ tag</TableHead>
                      <TableHead>Nợ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <button
                            onClick={() => handleCustomerNameClick(customer.id)}
                            className="font-medium text-left text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors"
                          >
                            {customer.name}
                          </button>
                        </TableCell>
                        <TableCell>{maskPhoneNumber(customer.phone)}</TableCell>
                        <TableCell>{customer.email || "Chưa có"}</TableCell>
                        <TableCell>
                          {customer.gender === "male" ? "Nam" : customer.gender === "female" ? "Nữ" : "Chưa có"}
                        </TableCell>
                        <TableCell>
                          {customer.tag ? (
                            <Badge style={{ backgroundColor: customer.tag.color, color: "#fff" }}>
                              {customer.tag.name}
                            </Badge>
                          ) : (
                            "Không có"
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(customer.debt || 0)}</TableCell>
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCustomerToDelete(customer)
                                setIsConfirmingDelete(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
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
                  <p className="text-base">{maskPhoneNumber(selectedCustomer.phone)}</p>
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
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nợ</Label>
                  <p className="text-base">{formatCurrency(selectedCustomer.debt || 0)}</p>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập họ tên đầy đủ"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Số điện thoại</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    {isEditingPhone ? (
                      <Input
                        id="edit-phone"
                        value={tempPhone}
                        onChange={(e) => {
                          const phoneNumber = e.target.value.replace(/[^0-9]/g, '')
                          setTempPhone(phoneNumber)
                        }}
                        onBlur={() => {
                          if (tempPhone) {
                            setFormData(prev => ({ ...prev, phone: tempPhone }))
                          }
                          setIsEditingPhone(false)
                        }}
                        placeholder="0901234567"
                        autoFocus
                      />
                    ) : (
                      <Input
                        id="edit-phone"
                        value={maskPhoneNumber(formData.phone)}
                        readOnly
                        placeholder="0901234567"
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        if (isEditingPhone) {
                          setTempPhone("")
                          setFormData(prev => ({ ...prev, phone: "" }))
                          setIsEditingPhone(false)
                        } else {
                          setTempPhone("")
                          setIsEditingPhone(true)
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">
                        {isEditingPhone ? "Hủy" : "Sửa số điện thoại"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-gender">Giới tính</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value === "" ? null : value as "male" | "female" }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "pending") => setFormData(prev => ({ ...prev, status: value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Nhập địa chỉ đầy đủ"
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Ghi chú</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ghi chú về khách hàng..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-debt">Nợ (VNĐ)</Label>
                <Input
                  id="edit-debt"
                  type="text"
                  inputMode="numeric"
                  defaultValue={formData.debt.toLocaleString('vi-VN')}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                    setFormData(prev => ({ ...prev, debt: value }))
                    e.target.value = value.toLocaleString('vi-VN')
                  }}
                  placeholder="0"
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor="tag">Thẻ tag</Label>
                <Select
                  value={formData.tag_id || undefined}
                  onValueChange={(value: string) => {
                    updateFormField("tag_id", value || null)
                    syncFormData()
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thẻ tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có</SelectItem>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa khách hàng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa khách hàng {customerToDelete?.name}? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmingDelete(false)
                setCustomerToDelete(null)
              }}
              disabled={deleting}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer} disabled={deleting}>
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {deleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CustomersLoading() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  )
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<CustomersLoading />}>
      <CustomersContent />
    </Suspense>
  )
}
