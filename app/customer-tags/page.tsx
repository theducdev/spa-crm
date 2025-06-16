"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, Edit, Trash2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  getCustomerTags,
  createCustomerTag,
  updateCustomerTag,
  deleteCustomerTag,
  type CustomerTag,
} from "@/lib/customer-tag-api"

interface TagFormData {
  name: string
  color: string
}

export default function CustomerTagsPage() {
  const [tags, setTags] = useState<CustomerTag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [isEditingTag, setIsEditingTag] = useState(false)
  const [selectedTag, setSelectedTag] = useState<CustomerTag | null>(null)
  const [tagToDelete, setTagToDelete] = useState<CustomerTag | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { toast } = useToast()

  // Form data for add/edit
  const [formData, setFormData] = useState<TagFormData>({
    name: "",
    color: "#000000",
  })

  // Load tags on component mount
  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const data = await getCustomerTags()
      setTags(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách thẻ tag",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên thẻ tag",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await createCustomerTag(formData)
      toast({
        title: "Thành công",
        description: "Đã thêm thẻ tag mới",
      })
      setIsAddingTag(false)
      resetForm()
      loadTags()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm thẻ tag",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditTag = async () => {
    if (!selectedTag || !formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên thẻ tag",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await updateCustomerTag(selectedTag.id, formData)
      toast({
        title: "Thành công",
        description: "Đã cập nhật thẻ tag",
      })
      setIsEditingTag(false)
      setSelectedTag(null)
      resetForm()
      loadTags()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật thẻ tag",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTag = async () => {
    if (!tagToDelete) return

    setDeleting(true)
    try {
      await deleteCustomerTag(tagToDelete.id)
      toast({
        title: "Thành công",
        description: "Đã xóa thẻ tag",
      })
      setIsConfirmingDelete(false)
      setTagToDelete(null)
      loadTags()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa thẻ tag",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleEditClick = (tag: CustomerTag) => {
    setSelectedTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color,
    })
    setIsEditingTag(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      color: "#000000",
    })
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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Quản lý thẻ tag</h1>
        <Dialog open={isAddingTag} onOpenChange={setIsAddingTag}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Thêm thẻ tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm thẻ tag mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Tên thẻ tag *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập tên thẻ tag"
                />
              </div>
              <div>
                <Label htmlFor="color">Màu sắc</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-20"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingTag(false)}>
                Hủy
              </Button>
              <Button onClick={handleAddTag} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags List */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên thẻ tag</TableHead>
                <TableHead>Màu sắc</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Badge style={{ backgroundColor: tag.color, color: "#fff" }}>
                      {tag.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditClick(tag)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTagToDelete(tag)
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
        </CardContent>
      </Card>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditingTag} onOpenChange={setIsEditingTag}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thẻ tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Tên thẻ tag *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên thẻ tag"
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Màu sắc</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-20"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingTag(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditTag} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Bạn có chắc chắn muốn xóa thẻ tag này không?</p>
            <p className="text-sm text-muted-foreground mt-2">
              Lưu ý: Các khách hàng đang sử dụng thẻ tag này sẽ không còn được gắn thẻ.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmingDelete(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteTag} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 