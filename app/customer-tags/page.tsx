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
import {
  getAppointmentStatuses,
  createAppointmentStatus,
  updateAppointmentStatus,
  deleteAppointmentStatus,
  type AppointmentStatus,
} from "@/lib/appointment-status-api"

interface TagFormData {
  name: string
  color: string
}

interface StatusFormData {
  code: string
  name: string
  color: string
  sort_order: number
}

export default function CustomerTagsPage() {
  const [tags, setTags] = useState<CustomerTag[]>([])
  const [statuses, setStatuses] = useState<AppointmentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStatuses, setLoadingStatuses] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [isEditingTag, setIsEditingTag] = useState(false)
  const [selectedTag, setSelectedTag] = useState<CustomerTag | null>(null)
  const [tagToDelete, setTagToDelete] = useState<CustomerTag | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Appointment status states
  const [isAddingStatus, setIsAddingStatus] = useState(false)
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | null>(null)
  const [statusToDelete, setStatusToDelete] = useState<AppointmentStatus | null>(null)
  const [isConfirmingDeleteStatus, setIsConfirmingDeleteStatus] = useState(false)
  const [deletingStatus, setDeletingStatus] = useState(false)

  const { toast } = useToast()

  // Form data for add/edit
  const [formData, setFormData] = useState<TagFormData>({
    name: "",
    color: "#000000",
  })

  // Form data for appointment status
  const [statusFormData, setStatusFormData] = useState<StatusFormData>({
    code: "",
    name: "",
    color: "gray",
    sort_order: 0
  })

  // Load tags on component mount
  useEffect(() => {
    loadTags()
    loadStatuses()
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

  const loadStatuses = async () => {
    try {
      setLoadingStatuses(true)
      const data = await getAppointmentStatuses()
      setStatuses(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách trạng thái lịch hẹn",
        variant: "destructive",
      })
    } finally {
      setLoadingStatuses(false)
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

  const resetStatusForm = () => {
    setStatusFormData({
      code: "",
      name: "",
      color: "gray",
      sort_order: 0
    })
  }

  // Appointment status handlers
  const handleAddStatus = async () => {
    if (!statusFormData.code.trim() || !statusFormData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ mã và tên trạng thái",
        variant: "destructive",
      })
      return
    }

    setSavingStatus(true)
    try {
      await createAppointmentStatus(statusFormData)
      toast({
        title: "Thành công",
        description: "Đã thêm trạng thái mới",
      })
      setIsAddingStatus(false)
      resetStatusForm()
      loadStatuses()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm trạng thái",
        variant: "destructive",
      })
    } finally {
      setSavingStatus(false)
    }
  }

  const handleEditStatus = async () => {
    if (!selectedStatus || !statusFormData.code.trim() || !statusFormData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ mã và tên trạng thái",
        variant: "destructive",
      })
      return
    }

    setSavingStatus(true)
    try {
      await updateAppointmentStatus(selectedStatus.id, statusFormData)
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái",
      })
      setIsEditingStatus(false)
      setSelectedStatus(null)
      resetStatusForm()
      loadStatuses()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái",
        variant: "destructive",
      })
    } finally {
      setSavingStatus(false)
    }
  }

  const handleDeleteStatus = async () => {
    if (!statusToDelete) return

    setDeletingStatus(true)
    try {
      await deleteAppointmentStatus(statusToDelete.id)
      toast({
        title: "Thành công",
        description: "Đã xóa trạng thái",
      })
      setIsConfirmingDeleteStatus(false)
      setStatusToDelete(null)
      loadStatuses()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa trạng thái",
        variant: "destructive",
      })
    } finally {
      setDeletingStatus(false)
    }
  }

  const handleEditStatusClick = (status: AppointmentStatus) => {
    setSelectedStatus(status)
    setStatusFormData({
      code: status.code,
      name: status.name,
      color: status.color,
      sort_order: status.sort_order
    })
    setIsEditingStatus(true)
  }

  if (loading || loadingStatuses) {
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

      {/* Appointment Statuses Section */}
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">Quản lý trạng thái lịch hẹn</h2>
          <Dialog open={isAddingStatus} onOpenChange={setIsAddingStatus}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Thêm trạng thái
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm trạng thái mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="status-code">Mã trạng thái *</Label>
                  <Input
                    id="status-code"
                    value={statusFormData.code}
                    onChange={(e) => setStatusFormData((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="pending"
                  />
                </div>
                <div>
                  <Label htmlFor="status-name">Tên trạng thái *</Label>
                  <Input
                    id="status-name"
                    value={statusFormData.name}
                    onChange={(e) => setStatusFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Chờ xác nhận"
                  />
                </div>
                <div>
                  <Label htmlFor="status-color">Màu sắc</Label>
                  <div className="flex gap-2">
                    <Input
                      id="status-color"
                      type="color"
                      value={statusFormData.color === 'gray' ? '#6b7280' : 
                             statusFormData.color === 'yellow' ? '#eab308' :
                             statusFormData.color === 'green' ? '#22c55e' :
                             statusFormData.color === 'red' ? '#ef4444' :
                             statusFormData.color === 'blue' ? '#3b82f6' :
                             statusFormData.color === 'purple' ? '#a855f7' :
                             statusFormData.color === 'orange' ? '#f97316' : '#6b7280'}
                      onChange={(e) => {
                        const color = e.target.value
                        const colorName = color === '#6b7280' ? 'gray' :
                                        color === '#eab308' ? 'yellow' :
                                        color === '#22c55e' ? 'green' :
                                        color === '#ef4444' ? 'red' :
                                        color === '#3b82f6' ? 'blue' :
                                        color === '#a855f7' ? 'purple' :
                                        color === '#f97316' ? 'orange' : 'gray'
                        setStatusFormData((prev) => ({ ...prev, color: colorName }))
                      }}
                      className="w-20"
                    />
                    <select
                      value={statusFormData.color}
                      onChange={(e) => setStatusFormData((prev) => ({ ...prev, color: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="gray">Xám</option>
                      <option value="yellow">Vàng</option>
                      <option value="green">Xanh lá</option>
                      <option value="red">Đỏ</option>
                      <option value="blue">Xanh dương</option>
                      <option value="purple">Tím</option>
                      <option value="orange">Cam</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="status-sort">Thứ tự</Label>
                  <Input
                    id="status-sort"
                    type="number"
                    value={statusFormData.sort_order}
                    onChange={(e) => setStatusFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingStatus(false)}>
                  Hủy
                </Button>
                <Button onClick={handleAddStatus} disabled={savingStatus}>
                  {savingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Lưu
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statuses List */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên trạng thái</TableHead>
                  <TableHead>Màu sắc</TableHead>
                  <TableHead>Thứ tự</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell className="font-medium">{status.code}</TableCell>
                    <TableCell>
                      <Badge style={{ 
                        backgroundColor: status.color === 'gray' ? '#6b7280' : 
                                       status.color === 'yellow' ? '#eab308' :
                                       status.color === 'green' ? '#22c55e' :
                                       status.color === 'red' ? '#ef4444' :
                                       status.color === 'blue' ? '#3b82f6' :
                                       status.color === 'purple' ? '#a855f7' :
                                       status.color === 'orange' ? '#f97316' : '#6b7280',
                        color: "#fff" 
                      }}>
                        {status.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ 
                            backgroundColor: status.color === 'gray' ? '#6b7280' : 
                                           status.color === 'yellow' ? '#eab308' :
                                           status.color === 'green' ? '#22c55e' :
                                           status.color === 'red' ? '#ef4444' :
                                           status.color === 'blue' ? '#3b82f6' :
                                           status.color === 'purple' ? '#a855f7' :
                                           status.color === 'orange' ? '#f97316' : '#6b7280'
                          }}
                        />
                        <span>{status.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>{status.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditStatusClick(status)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setStatusToDelete(status)
                            setIsConfirmingDeleteStatus(true)
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
      </div>

      {/* Edit Status Dialog */}
      <Dialog open={isEditingStatus} onOpenChange={setIsEditingStatus}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa trạng thái</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-status-code">Mã trạng thái *</Label>
              <Input
                id="edit-status-code"
                value={statusFormData.code}
                onChange={(e) => setStatusFormData((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="pending"
              />
            </div>
            <div>
              <Label htmlFor="edit-status-name">Tên trạng thái *</Label>
              <Input
                id="edit-status-name"
                value={statusFormData.name}
                onChange={(e) => setStatusFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Chờ xác nhận"
              />
            </div>
            <div>
              <Label htmlFor="edit-status-color">Màu sắc</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-status-color"
                  type="color"
                  value={statusFormData.color === 'gray' ? '#6b7280' : 
                         statusFormData.color === 'yellow' ? '#eab308' :
                         statusFormData.color === 'green' ? '#22c55e' :
                         statusFormData.color === 'red' ? '#ef4444' :
                         statusFormData.color === 'blue' ? '#3b82f6' :
                         statusFormData.color === 'purple' ? '#a855f7' :
                         statusFormData.color === 'orange' ? '#f97316' : '#6b7280'}
                  onChange={(e) => {
                    const color = e.target.value
                    const colorName = color === '#6b7280' ? 'gray' :
                                    color === '#eab308' ? 'yellow' :
                                    color === '#22c55e' ? 'green' :
                                    color === '#ef4444' ? 'red' :
                                    color === '#3b82f6' ? 'blue' :
                                    color === '#a855f7' ? 'purple' :
                                    color === '#f97316' ? 'orange' : 'gray'
                    setStatusFormData((prev) => ({ ...prev, color: colorName }))
                  }}
                  className="w-20"
                />
                <select
                  value={statusFormData.color}
                  onChange={(e) => setStatusFormData((prev) => ({ ...prev, color: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="gray">Xám</option>
                  <option value="yellow">Vàng</option>
                  <option value="green">Xanh lá</option>
                  <option value="red">Đỏ</option>
                  <option value="blue">Xanh dương</option>
                  <option value="purple">Tím</option>
                  <option value="orange">Cam</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-status-sort">Thứ tự</Label>
              <Input
                id="edit-status-sort"
                type="number"
                value={statusFormData.sort_order}
                onChange={(e) => setStatusFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingStatus(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditStatus} disabled={savingStatus}>
              {savingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Status Confirmation Dialog */}
      <Dialog open={isConfirmingDeleteStatus} onOpenChange={setIsConfirmingDeleteStatus}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Bạn có chắc chắn muốn xóa trạng thái này không?</p>
            <p className="text-sm text-muted-foreground mt-2">
              Lưu ý: Các lịch hẹn đang sử dụng trạng thái này sẽ bị ảnh hưởng.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmingDeleteStatus(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteStatus} disabled={deletingStatus}>
              {deletingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 