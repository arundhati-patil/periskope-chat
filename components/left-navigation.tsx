"use client"

import {
  Home,
  MessageCircle,
  Users,
  Phone,
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  Archive,
  Star,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"

export default function LeftNavigation() {
  const { user, signOut } = useAuth()

  const navigationItems = [
    { icon: Home, label: "Home", active: false },
    { icon: MessageCircle, label: "Chats", active: true },
    { icon: Users, label: "Contacts", active: false },
    { icon: Phone, label: "Calls", active: false },
    { icon: Calendar, label: "Calendar", active: false },
    { icon: BarChart3, label: "Analytics", active: false },
    { icon: Archive, label: "Archive", active: false },
    { icon: Star, label: "Starred", active: false },
    { icon: Bell, label: "Notifications", active: false },
    { icon: Settings, label: "Settings", active: false },
    { icon: HelpCircle, label: "Help", active: false },
  ]

  return (
    <nav className="w-16 bg-gray-900 flex flex-col items-center py-4 space-y-2">
      {/* User Avatar */}
      <div className="mb-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
          <AvatarFallback className="bg-green-500 text-white">
            {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Navigation Items */}
      {navigationItems.map((item, index) => (
        <Button
          key={index}
          variant="ghost"
          size="sm"
          className={`w-12 h-12 p-0 rounded-lg ${
            item.active
              ? "bg-green-600 text-white hover:bg-green-700"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <item.icon className="w-5 h-5" />
        </Button>
      ))}

      {/* Logout Button */}
      <div className="mt-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-12 h-12 p-0 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </nav>
  )
}
