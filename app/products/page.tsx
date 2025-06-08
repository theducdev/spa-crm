"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, Search, Edit, X, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  getProducts,
  createProduct,
  updateProduct,
  type Product,
  type ProductFilters,
} from "@/lib/product-api"

export default function ProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ProductFilters>({
    status: "active",
    search: "",
  })
  const [showDialog, setShowDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadProducts()
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }))
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  async function loadProducts() {
    try {
      setLoading(true)
      const data = await getProducts(filters)
      setProducts(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sản phẩm",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingProduct?.id) {
        await updateProduct(editingProduct.id, editingProduct)
        toast({
          title: "Thành công",
          description: "Đã cập nhật sản phẩm",
        })
      } else {
        await createProduct(editingProduct!)
        toast({
          title: "Thành công",
          description: "Đã thêm sản phẩm mới",
        })
      }
      setShowDialog(false)
      loadProducts()
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi",
        description: "Không thể lưu sản phẩm",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Quản lý sản phẩm</CardTitle>
          <Button onClick={() => {
            setEditingProduct({})
            setShowDialog(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang sử dụng</SelectItem>
                <SelectItem value="inactive">Ngưng sử dụng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      {searchTerm ? "Không tìm thấy sản phẩm nào" : "Không có sản phẩm nào"}
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.notes}</TableCell>
                      <TableCell>
                        <Badge variant={product.status === "active" ? "default" : "secondary"}>
                          {product.status === "active" ? "Đang sử dụng" : "Ngưng sử dụng"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingProduct(product)
                            setShowDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct?.id ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên sản phẩm</Label>
                <Input
                  id="name"
                  value={editingProduct?.name || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({ ...prev!, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  value={editingProduct?.notes || ""}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({ ...prev!, notes: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={editingProduct?.status || "active"}
                  onValueChange={(value) =>
                    setEditingProduct((prev) => ({ ...prev!, status: value as "active" | "inactive" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang sử dụng</SelectItem>
                    <SelectItem value="inactive">Ngưng sử dụng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  Hủy
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Lưu
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 