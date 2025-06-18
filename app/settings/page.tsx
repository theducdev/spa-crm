import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Settings, User, Bell, Shield, Database, Save, Upload, Download, Trash2, Eye, EyeOff, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from 'next/link'
import { isAdmin } from '@/lib/auth-utils'
import { getCurrentUser } from '@/app/actions/auth'
import SettingsContent from './SettingsContent'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const isUserAdmin = isAdmin(user)

  return <SettingsContent isUserAdmin={isUserAdmin} />
}
