"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  getTreatmentPackages,
  createTreatmentPackage,
  updateTreatmentPackage,
  deleteTreatmentPackage,
  type TreatmentPackage,
} from "@/lib/treatment-package-api"

export default function TreatmentPackagesPage() {
  const [packages, setPackages] = useState<TreatmentPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Dialog states
  const [isAddingPackage, setIsAddingPackage] = useState(false)
  const [isEditingPackage, setIsEditingPackage] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<TreatmentPackage | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    total_sessions: "",
    price: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    try {
      setLoading(true)
      const data = await getTreatmentPackages()
      setPackages(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách gói điều trị",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      total_sessions: "",
      price: "",
    })
  }

  const handleAddPackage = async () => {
    if (!formData.name.trim() || !formData.total_sessions || !formData.price) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin bắt buộc",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await createTreatmentPackage({
        name: formData.name,
        description: formData.description,
        total_sessions: parseInt(formData.total_sessions),
        price: parseFloat(formData.price),
        status: "active",
      })

      toast({
        title: "Thành công",
        description: "Đã thêm gói điều trị mới",
      })
      setIsAddingPackage(false)
      resetForm()
      loadPackages()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm gói điều trị",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditPackage = async () => {
    if (!selectedPackage || !formData.name.trim() || !formData.total_sessions || !formData.price) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin bắt buộc",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await updateTreatmentPackage(selectedPackage.id, {
        name: formData.name,
        description: formData.description,
        total_sessions: parseInt(formData.total_sessions),
        price: parseFloat(formData.price),
      })

      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin gói điều trị",
      })
      setIsEditingPackage(false)
      setSelectedPackage(null)
      resetForm()
      loadPackages()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật thông tin gói điều trị",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (pkg: TreatmentPackage) => {
    setSelectedPackage(pkg)
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      total_sessions: pkg.total_sessions.toString(),
      price: pkg.price.toString(),
    })
    setIsEditingPackage(true)
  }

  const handleDeleteClick = async (pkg: TreatmentPackage) => {
    if (!confirm("Bạn có chắc chắn muốn xóa gói điều trị này?")) return

    try {
      await deleteTreatmentPackage(pkg.id)
      toast({
        title: "Thành công",
        description: "Đã xóa gói điều trị",
      })
      loadPackages()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa gói điều trị",
        variant: "destructive",
      })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý gói điều trị</h1>
        <Dialog open={isAddingPackage} onOpenChange={setIsAddingPackage}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm gói điều trị
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm gói điều trị mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên gói điều trị</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_sessions">Số buổi điều trị</Label>
                <Input
                  id="total_sessions"
                  type="number"
                  min="1"
                  value={formData.total_sessions}
                  onChange={(e) => setFormData((prev) => ({ ...prev, total_sessions: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Giá gói (VNĐ)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <Button className="w-full" onClick={handleAddPackage} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Thêm gói điều trị
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Package List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách gói điều trị</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên gói</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-right">Số buổi</TableHead>
                <TableHead className="text-right">Giá gói</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell>{pkg.description || "-"}</TableCell>
                  <TableCell className="text-right">{pkg.total_sessions}</TableCell>
                  <TableCell className="text-right">{formatPrice(pkg.price)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(pkg)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(pkg)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {packages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Chưa có gói điều trị nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditingPackage} onOpenChange={setIsEditingPackage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa gói điều trị</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tên gói điều trị</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-total_sessions">Số buổi điều trị</Label>
              <Input
                id="edit-total_sessions"
                type="number"
                min="1"
                value={formData.total_sessions}
                onChange={(e) => setFormData((prev) => ({ ...prev, total_sessions: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Giá gói (VNĐ)</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={handleEditPackage} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cập nhật
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 