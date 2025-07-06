"use client"

import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface ProductUsage {
  product: string
  usage_times?: string[]
}

interface Customer {
  id: string
  name: string
}

interface Treatment {
  id: string
  customer_id: string
  customer: Customer
}

interface RawSession {
  id: string
  created_at: string
  products_sold: string | null
  treatment_id: string
  treatment: Treatment
}

interface ProductSoldSession {
  id: string
  created_at: string
  customer_name: string
  products_sold: ProductUsage[]
}

export default function ProductsSoldPage() {
  const supabase = createClientComponentClient()
  const [sessions, setSessions] = useState<ProductSoldSession[]>([])
  const [dateFilters, setDateFilters] = useState({
    fromDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    toDate: format(endOfMonth(new Date()), "yyyy-MM-dd")
  })

  useEffect(() => {
    loadSessions()
  }, [dateFilters])

  const loadSessions = async () => {
    let query = supabase
      .from('treatment_sessions')
      .select(`
        id,
        created_at,
        products_sold,
        treatment_id,
        treatment:treatments!inner (
          id,
          customer_id,
          customer:customers!inner (
            id,
            name
          )
        )
      `)
      .not('products_sold', 'is', null)
      .order('created_at', { ascending: false })

    // Chỉ thêm điều kiện lọc ngày nếu có giá trị
    if (dateFilters.fromDate) {
      query = query.gte('created_at', `${dateFilters.fromDate}T00:00:00`)
    }
    if (dateFilters.toDate) {
      query = query.lte('created_at', `${dateFilters.toDate}T23:59:59`)
    }

    const { data: rawSessions } = await query

    if (rawSessions) {
      const formattedSessions = (rawSessions as unknown as RawSession[]).map(session => ({
        id: session.id,
        created_at: session.created_at,
        customer_name: session.treatment?.customer?.name || 'Không có thông tin',
        products_sold: typeof session.products_sold === 'string' ? 
          JSON.parse(session.products_sold) : 
          []
      }))
      setSessions(formattedSessions)
    }
  }

  // Thêm hàm xử lý thay đổi ngày
  const handleDateChange = (field: "fromDate" | "toDate") => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilters(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  // Thêm hàm xem lịch hẹn hôm nay
  const setToday = () => {
    const today = new Date()
    setDateFilters({
      fromDate: format(today, "yyyy-MM-dd"),
      toDate: format(today, "yyyy-MM-dd")
    })
  }

  // Thêm hàm xem tất cả lịch hẹn
  const showAll = () => {
    setDateFilters({
      fromDate: "",
      toDate: ""
    })
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent>
            <p className="text-center text-muted-foreground">Không có dữ liệu sản phẩm đã bán</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sản phẩm đã bán</h1>
      </div>

      {/* Thêm bộ lọc thời gian */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="fromDate">Từ ngày</Label>
              <Input
                type="date"
                id="fromDate"
                value={dateFilters.fromDate}
                onChange={handleDateChange("fromDate")}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="toDate">Đến ngày</Label>
              <Input
                type="date"
                id="toDate"
                value={dateFilters.toDate}
                onChange={handleDateChange("toDate")}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={showAll}>Tất cả</Button>
              <Button variant="outline" onClick={setToday}>Hôm nay</Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const today = new Date()
                  setDateFilters({
                    fromDate: format(startOfMonth(today), "yyyy-MM-dd"),
                    toDate: format(endOfMonth(today), "yyyy-MM-dd")
                  })
                }}
              >
                Tháng này
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày bán</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Sản phẩm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                return session.products_sold.map((product: ProductUsage, index: number) => (
                  <TableRow key={`${session.id}-${index}`}>
                    <TableCell>
                      {new Date(session.created_at).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      {session.customer_name}
                    </TableCell>
                    <TableCell>{product.product}</TableCell>
                  </TableRow>
                ))
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 