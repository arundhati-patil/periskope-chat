"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import LeftNavigation from "@/components/left-navigation"
import ChatSidebar from "@/components/chat-sidebar"
import ChatArea from "@/components/chat-area"
import LoginForm from "@/components/login-form"

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string>()
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <LeftNavigation />
      <ChatSidebar selectedChatId={selectedChatId} onChatSelect={setSelectedChatId} />
      <ChatArea chatId={selectedChatId} />
    </div>
  )
}
