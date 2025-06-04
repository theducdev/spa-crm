"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, Eye, Calendar, Grid, List } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function GalleryPage() {
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const images = [
    {
      id: 1,
      customer: "Nguyễn Thị A",
      date: "2024-06-10",
      session: 3,
      type: "before",
      treatment: "Điều trị mụn",
      url: "/placeholder.svg?height=200&width=200",
      notes: "Tình trạng da trước điều trị buổi 3",
    },
    {
      id: 2,
      customer: "Nguyễn Thị A",
      date: "2024-06-10",
      session: 3,
      type: "after",
      treatment: "Điều trị mụn",
      url: "/placeholder.svg?height=200&width=200",
      notes: "Kết quả sau điều trị buổi 3",
    },
    {
      id: 3,
      customer: "Trần Văn B",
      date: "2024-06-08",
      session: 5,
      type: "before",
      treatment: "Laser tàn nhang",
      url: "/placeholder.svg?height=200&width=200",
      notes: "Tình trạng tàn nhang trước điều trị",
    },
    {
      id: 4,
      customer: "Trần Văn B",
      date: "2024-06-08",
      session: 5,
      type: "after",
      treatment: "Laser tàn nhang",
      url: "/placeholder.svg?height=200&width=200",
      notes: "Kết quả sau laser buổi 5",
    },
    {
      id: 5,
      customer: "Lê Thị C",
      date: "2024-06-05",
      session: 2,
      type: "before",
      treatment: "Căng da mặt",
      url: "/placeholder.svg?height=200&width=200",
      notes: "Trước căng da buổi 2",
    },
    {
      id: 6,
      customer: "Lê Thị C",
      date: "2024-06-05",
      session: 2,
      type: "after",
      treatment: "Căng da mặt",
      url: "/placeholder.svg?height=200&width=200",
      notes: "Sau căng da buổi 2",
    },
  ]

  const handleImageSelect = (imageId: number) => {
    setSelectedImages((prev) => (prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]))
  }

  const handleSelectAll = () => {
    setSelectedImages(selectedImages.length === images.length ? [] : images.map((img) => img.id))
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
            {/* Mobile: Stack inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="customerSearch" className="text-sm">
                  Tên khách hàng
                </Label>
                <Input id="customerSearch" placeholder="Nhập tên..." className="text-sm" />
              </div>
              <div>
                <Label htmlFor="fromDate" className="text-sm">
                  Từ ngày
                </Label>
                <Input id="fromDate" type="date" className="text-sm" />
              </div>
              <div>
                <Label htmlFor="toDate" className="text-sm">
                  Đến ngày
                </Label>
                <Input id="toDate" type="date" className="text-sm" />
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
                    <SelectItem value="scar">Điều trị sẹo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Loại ảnh</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="before" />
                    <Label htmlFor="before" className="text-sm">
                      Trước
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="after" />
                    <Label htmlFor="after" className="text-sm">
                      Sau
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="sm" className="w-full sm:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Tìm kiếm
              </Button>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Bộ lọc nâng cao
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
            <div className="text-sm text-muted-foreground">Tổng cộng: {images.length} ảnh</div>
          </div>
        </CardContent>
      </Card>

      {/* Image Gallery */}
      {viewMode === "grid" ? (
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
                    src={image.url || "/placeholder.svg"}
                    alt={`${image.customer} - ${image.type}`}
                    className="w-full h-32 sm:h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant={image.type === "before" ? "secondary" : "default"} className="text-xs">
                      {image.type === "before" ? "Trước" : "Sau"}
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
                            src={image.url || "/placeholder.svg"}
                            alt={`${image.customer} - ${image.type}`}
                            className="w-full h-auto rounded-lg"
                          />
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Khách hàng</Label>
                            <p className="text-lg font-semibold">{image.customer}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Liệu trình</Label>
                            <p>{image.treatment}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Buổi điều trị</Label>
                            <p>Buổi {image.session}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Ngày chụp</Label>
                            <p>{image.date}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Loại ảnh</Label>
                            <Badge variant={image.type === "before" ? "secondary" : "default"}>
                              {image.type === "before" ? "Ảnh trước điều trị" : "Ảnh sau điều trị"}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Ghi chú</Label>
                            <p className="text-sm">{image.notes}</p>
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
                    <h3 className="font-medium text-xs sm:text-sm truncate">{image.customer}</h3>
                    <Badge variant="outline" className="text-xs">
                      Buổi {image.session}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {image.date}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{image.treatment}</p>
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
                    src={image.url || "/placeholder.svg"}
                    alt={`${image.customer} - ${image.type}`}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{image.customer}</h3>
                      <Badge variant={image.type === "before" ? "secondary" : "default"} className="text-xs">
                        {image.type === "before" ? "Trước" : "Sau"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Buổi {image.session}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{image.treatment}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {image.date}
                      </span>
                      <span className="truncate">{image.notes}</span>
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
                              src={image.url || "/placeholder.svg"}
                              alt={`${image.customer} - ${image.type}`}
                              className="w-full h-auto rounded-lg"
                            />
                          </div>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Khách hàng</Label>
                              <p className="text-lg font-semibold">{image.customer}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Liệu trình</Label>
                              <p>{image.treatment}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Buổi điều trị</Label>
                              <p>Buổi {image.session}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Ngày chụp</Label>
                              <p>{image.date}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Ghi chú</Label>
                              <p className="text-sm">{image.notes}</p>
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
      )}
    </div>
  )
}
