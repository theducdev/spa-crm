"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, Eye, Calendar, Grid, List } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchGalleryImages, type GalleryImage } from "@/lib/gallery-api"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { getCustomers, type Customer } from "@/lib/customer-api"
import { getTreatmentsByCustomer } from "@/lib/treatment-api"
import type { Treatment } from "@/lib/supabase"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { useFilterParams } from "../../hooks/use-filter-params"

export default function GalleryPage() {
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerTreatments, setCustomerTreatments] = useState<Treatment[]>([])
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [openCustomer, setOpenCustomer] = useState(false)
  const [openTreatment, setOpenTreatment] = useState(false)
  const [treatmentSearchTerm, setTreatmentSearchTerm] = useState("")
  const [searching, setSearching] = useState(false)

  // Cập nhật initialState của useFilterParams để thêm customerId và treatmentId
  const { filters, updateFilters, resetFilters } = useFilterParams({
    customerName: "",
    customerId: "",
    treatmentId: "",
    fromDate: "",
    toDate: "",
    imageType: [] as string[],
  })

  // Theo dõi thay đổi của selectedCustomer để cập nhật URL
  useEffect(() => {
    if (selectedCustomer) {
      updateFilters({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name
      })
    }
  }, [selectedCustomer])

  // Theo dõi thay đổi của selectedTreatment để cập nhật URL
  useEffect(() => {
    if (selectedTreatment) {
      updateFilters({
        treatmentId: selectedTreatment.id
      })
    }
  }, [selectedTreatment])

  // Khôi phục selectedCustomer và selectedTreatment từ URL khi load trang
  useEffect(() => {
    const loadCustomerFromUrl = async () => {
      if (filters.customerId && !selectedCustomer) {
        try {
          const response = await fetch(`/api/customers/search?q=${filters.customerId}`)
          if (response.ok) {
            const customers = await response.json()
            const customer = customers.find((c: Customer) => c.id === filters.customerId)
            if (customer) {
              setSelectedCustomer(customer)
            }
          }
        } catch (error) {
          console.error("Error loading customer from URL:", error)
        }
      }
    }

    const loadTreatmentFromUrl = async () => {
      if (filters.treatmentId && filters.customerId && !selectedTreatment) {
        try {
          const data = await getTreatmentsByCustomer(filters.customerId)
          const treatment = data.find(t => t.id === filters.treatmentId)
          if (treatment) {
            setSelectedTreatment(treatment)
          }
        } catch (error) {
          console.error("Error loading treatment from URL:", error)
        }
      }
    }

    loadCustomerFromUrl()
    loadTreatmentFromUrl()
  }, [filters.customerId, filters.treatmentId])

  const filteredTreatments = customerTreatments.filter(treatment => 
    treatment.treatment_name.toLowerCase().includes(treatmentSearchTerm.toLowerCase())
  )

  useEffect(() => {
    loadImages()
  }, [selectedTreatment, filters]) // Thêm filters vào dependencies

  useEffect(() => {
    searchCustomers()
  }, [searchTerm])

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerTreatments()
    } else {
      setCustomerTreatments([])
      setSelectedTreatment(null)
    }
  }, [selectedCustomer])

  const searchCustomers = useCallback(async () => {
    if (searchTerm.length < 2) {
      setCustomers([])
      return
    }
    try {
      setSearching(true)
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(searchTerm)}`)
      if (!response.ok) {
        throw new Error("Lỗi khi tìm kiếm khách hàng")
      }
      const data = await response.json()
      console.log("Search results:", data)
      setCustomers(data)
    } catch (error) {
      console.error("Error searching customers:", error)
    } finally {
      setSearching(false)
    }
  }, [searchTerm])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCustomers()
    }, 2000) // Đợi 2s sau khi người dùng ngừng gõ

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchCustomers])

  const loadCustomerTreatments = async () => {
    if (!selectedCustomer) return
    try {
      const data = await getTreatmentsByCustomer(selectedCustomer.id)
      setCustomerTreatments(data)
    } catch (error) {
      console.error("Error loading customer treatments:", error)
    }
  }

  // Cập nhật hàm loadImages để sử dụng customerId từ filters
  const loadImages = async () => {
    try {
      setLoading(true)
      setError(null)
      const imageType = filters.imageType.length > 0 ? filters.imageType.join(",") : undefined
      const data = await fetchGalleryImages({
        customerId: filters.customerId || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        imageType,
        treatment: filters.treatmentId || undefined
      })
      setImages(data)
    } catch (error) {
      console.error("Error loading images:", error)
      setError("Không thể tải dữ liệu ảnh")
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (imageId: string) => {
    setSelectedImages((prev) => (prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]))
  }

  const handleSelectAll = () => {
    setSelectedImages(selectedImages.length === images.length ? [] : images.map((img) => img.id))
  }

  // Cập nhật hàm xử lý filter
  const handleSearch = () => {
    loadImages()
  }

  // Cập nhật hàm xóa filter
  const handleClearFilters = () => {
    setSelectedCustomer(null)
    setSelectedTreatment(null)
    resetFilters()
  }

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: vi })
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={loadImages} className="mt-4">
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Thư viện ảnh</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="flex-1 sm:flex-none"
          >
            {viewMode === "grid" ? <List className="h-4 w-4 mr-2" /> : <Grid className="h-4 w-4 mr-2" />}
            {viewMode === "grid" ? "Danh sách" : "Lưới"}
          </Button>
          <Button variant="outline" size="sm" disabled={selectedImages.length === 0} className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-2" />
            Tải ({selectedImages.length})
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            Tìm kiếm ảnh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Khách hàng</Label>
                <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCustomer}
                      className="w-full justify-between"
                    >
                      {selectedCustomer?.name || filters.customerName || "Chọn khách hàng"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Tìm khách hàng..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandEmpty>Không tìm thấy khách hàng</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.id}
                            onSelect={() => {
                              setSelectedCustomer(customer)
                              setOpenCustomer(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {customer.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Liệu trình</Label>
                <Popover open={openTreatment} onOpenChange={setOpenTreatment}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openTreatment}
                      className="w-full justify-between"
                      disabled={!selectedCustomer && !filters.treatmentId}
                    >
                      {selectedTreatment?.treatment_name || filters.treatmentId ? 
                        (selectedTreatment?.treatment_name || "Đang tải...") : 
                        (!selectedCustomer ? "Vui lòng chọn khách hàng trước" : "Chọn liệu trình")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  {(selectedCustomer || filters.treatmentId) && (
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Tìm liệu trình..."
                          value={treatmentSearchTerm}
                          onValueChange={setTreatmentSearchTerm}
                        />
                        <CommandEmpty>Không tìm thấy liệu trình</CommandEmpty>
                        <CommandGroup>
                          {filteredTreatments.map((treatment) => (
                            <CommandItem
                              key={treatment.id}
                              value={treatment.id}
                              onSelect={() => {
                                setSelectedTreatment(treatment)
                                setOpenTreatment(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedTreatment?.id === treatment.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {treatment.treatment_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  )}
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Từ ngày</Label>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => updateFilters({ fromDate: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Đến ngày</Label>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => updateFilters({ toDate: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label>Loại ảnh</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="before"
                    checked={filters.imageType.includes("before")}
                    onCheckedChange={(checked) =>
                      updateFilters({
                        imageType: checked
                          ? [...filters.imageType, "before"]
                          : filters.imageType.filter((type: string) => type !== "before"),
                      })
                    }
                  />
                  <Label htmlFor="before" className="text-sm">
                    Trước
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="after"
                    checked={filters.imageType.includes("after")}
                    onCheckedChange={(checked) =>
                      updateFilters({
                        imageType: checked
                          ? [...filters.imageType, "after"]
                          : filters.imageType.filter((type: string) => type !== "after"),
                      })
                    }
                  />
                  <Label htmlFor="after" className="text-sm">
                    Sau
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="sm" className="w-full sm:w-auto" onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Đang tìm..." : "Tìm kiếm"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
                onClick={handleClearFilters}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Controls */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedImages.length === images.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </Button>
              <span className="text-sm text-muted-foreground">
                Đã chọn {selectedImages.length} / {images.length} ảnh
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              <span>Hiển thị {images.length} ảnh mới nhất</span>
              {images.length >= 100 && (
                <span className="ml-1 text-yellow-600">
                  (Đã đạt giới hạn 100 ảnh, hãy sử dụng bộ lọc để tìm ảnh cũ hơn)
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p>Đang tải dữ liệu...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && images.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Không có ảnh nào</p>
        </div>
      )}

      {/* Image Gallery */}
      {!loading && images.length > 0 && (
        viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {images.map((image) => (
              <Card
                key={image.id}
                className={`cursor-pointer transition-all ${
                  selectedImages.includes(image.id) ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <CardContent className="p-2 sm:p-4">
                  <div className="relative">
                    <img
                      src={image.image_url}
                      alt={`${image.treatment_sessions.treatments.customers.name} - ${image.image_type}`}
                      className="w-full h-32 sm:h-48 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant={image.image_type === "before" ? "secondary" : "default"} className="text-xs">
                        {image.image_type === "before" ? "Trước" : "Sau"}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Checkbox
                        checked={selectedImages.includes(image.id)}
                        onCheckedChange={() => handleImageSelect(image.id)}
                      />
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="secondary" className="absolute bottom-2 right-2 h-6 w-6 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Chi tiết ảnh</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <img
                              src={image.image_url}
                              alt={`${image.treatment_sessions.treatments.customers.name} - ${image.image_type}`}
                              className="w-full h-auto rounded-lg"
                            />
                          </div>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Khách hàng</Label>
                              <p className="text-lg font-semibold">
                                {image.treatment_sessions.treatments.customers.name}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Liệu trình</Label>
                              <p>{image.treatment_sessions.treatments.treatment_name}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Buổi điều trị</Label>
                              <p>Buổi {image.treatment_sessions.session_number}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Ngày chụp</Label>
                              <p>{formatDate(image.treatment_sessions.session_date)}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Loại ảnh</Label>
                              <Badge variant={image.image_type === "before" ? "secondary" : "default"}>
                                {image.image_type === "before" ? "Ảnh trước điều trị" : "Ảnh sau điều trị"}
                              </Badge>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Ghi chú</Label>
                              <p className="text-sm">{image.treatment_sessions.notes}</p>
                            </div>
                            <Button className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Tải xuống ảnh
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-xs sm:text-sm truncate">
                        {image.treatment_sessions.treatments.customers.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        Buổi {image.treatment_sessions.session_number}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(image.treatment_sessions.session_date)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {image.treatment_sessions.treatments.treatment_name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Danh sách ảnh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg ${
                      selectedImages.includes(image.id) ? "border-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    <Checkbox
                      checked={selectedImages.includes(image.id)}
                      onCheckedChange={() => handleImageSelect(image.id)}
                    />
                    <img
                      src={image.image_url}
                      alt={`${image.treatment_sessions.treatments.customers.name} - ${image.image_type}`}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">
                          {image.treatment_sessions.treatments.customers.name}
                        </h3>
                        <Badge variant={image.image_type === "before" ? "secondary" : "default"} className="text-xs">
                          {image.image_type === "before" ? "Trước" : "Sau"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Buổi {image.treatment_sessions.session_number}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(image.treatment_sessions.session_date)}
                        </span>
                        <span className="truncate">{image.treatment_sessions.notes}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Chi tiết ảnh</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <img
                                src={image.image_url}
                                alt={`${image.treatment_sessions.treatments.customers.name} - ${image.image_type}`}
                                className="w-full h-auto rounded-lg"
                              />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Khách hàng</Label>
                                <p className="text-lg font-semibold">
                                  {image.treatment_sessions.treatments.customers.name}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Liệu trình</Label>
                                <p>{image.treatment_sessions.treatments.treatment_name}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Buổi điều trị</Label>
                                <p>Buổi {image.treatment_sessions.session_number}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Ngày chụp</Label>
                                <p>{formatDate(image.treatment_sessions.session_date)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Ghi chú</Label>
                                <p className="text-sm">{image.treatment_sessions.notes}</p>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
