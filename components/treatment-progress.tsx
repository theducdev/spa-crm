"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, CheckCircle, Clock } from "lucide-react"
import type { Treatment, TreatmentSession } from "@/lib/supabase"
import { getTreatmentSessions } from "@/lib/treatment-api"
import { useEffect, useState } from "react"
import { formatDate } from "@/lib/utils"

interface TreatmentProgressProps {
  treatment: Treatment
  selectedSession?: number // Số buổi đang được chọn
}

export function TreatmentProgress({ treatment, selectedSession }: TreatmentProgressProps) {
  const [sessions, setSessions] = useState<TreatmentSession[]>([])
  const progressPercentage = (treatment.current_session / treatment.total_sessions) * 100
  const isCompleted = treatment.current_session >= treatment.total_sessions

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await getTreatmentSessions(treatment.id)
        setSessions(data)
      } catch (error) {
        console.error("Lỗi khi tải danh sách buổi điều trị:", error)
      }
    }
    loadSessions()
  }, [treatment.id])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Tiến độ liệu trình</h3>
        <Badge variant={isCompleted ? "default" : "secondary"} className="flex items-center gap-1">
          {isCompleted ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Hoàn thành
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" />
              Đang điều trị
            </>
          )}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>
            Buổi {treatment.current_session}/{treatment.total_sessions}
          </span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Ngày bắt đầu</p>
            <p className="font-medium">{formatDate(treatment.start_date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Ngày kết thúc</p>
            <p className="font-medium">{treatment.end_date ? formatDate(treatment.end_date) : "Chưa xác định"}</p>
          </div>
        </div>
      </div>

      {sessions.length > 0 && (
        <>
          {(() => {
            // Lọc session theo số buổi được chọn
            const filteredSessions = sessions.filter(
              session => session.session_number === (selectedSession ?? treatment.current_session)
            );
            
            // Nếu có nhiều session cùng số buổi, lấy session cuối cùng
            const latestSession = filteredSessions[filteredSessions.length - 1];
            
            if (latestSession) {
              return (
                <div key={latestSession.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Công nghệ sử dụng - Buổi {latestSession.session_number}:
                  </p>
                  <p className="text-sm">{latestSession.notes || "Không có ghi chú"}</p>
                  {latestSession.creator && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Nhân viên thực hiện: {latestSession.creator.full_name}
                    </p>
                  )}
                </div>
              );
            }
            return null;
          })()}
        </>
      )}
    </div>
  )
}
