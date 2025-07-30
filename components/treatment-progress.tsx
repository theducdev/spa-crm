"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, CheckCircle, Clock } from "lucide-react"
import type { Treatment } from "@/lib/supabase"

interface TreatmentProgressProps {
  treatment: Treatment
}

export function TreatmentProgress({ treatment }: TreatmentProgressProps) {
  const progressPercentage = (treatment.current_session / treatment.total_sessions) * 100
  const isCompleted = treatment.current_session >= treatment.total_sessions

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
            <p className="font-medium">{treatment.start_date}</p>
          </div>
        </div>
        {treatment.end_date && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Ngày kết thúc</p>
              <p className="font-medium">{treatment.end_date}</p>
            </div>
          </div>
        )}
      </div>

      {treatment.notes && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Công nghệ sử dụng:</p>
          <p className="text-sm">{treatment.notes}</p>
        </div>
      )}
    </div>
  )
}
