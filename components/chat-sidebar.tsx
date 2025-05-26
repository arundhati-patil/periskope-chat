"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Settings, MoreVertical, Archive, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Chat } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface ChatSidebarProps {
  selectedChatId?: string
  onChatSelect: (chatId: string) => void
}

export default function ChatSidebar({ selectedChatId, onChatSelect }: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredChats, setFilteredChats] = useState<Chat[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchChats()
    }
  }, [user])

  useEffect(() => {
    if (searchQuery) {
      const filtered = chats.filter(
        (chat) =>
          chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chat.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredChats(filtered)
    } else {
      setFilteredChats(chats)
    }
  }, [searchQuery, chats])

  const fetchChats = async () => {
    if (!user?.id) return

    // First, ensure the user exists in our custom users table
    const { data: existingUser } = await supabase.from("users").select("id").eq("id", user.id).single()

    if (!existingUser) {
      // Create user in our custom table
      await supabase.from("users").insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email!.split("@")[0],
        avatar_url: user.user_metadata?.avatar_url,
        status: "online",
      })
    }

    // Always try to create sample chats (will be ignored if they already exist)
    await createSampleChatsForUser(user.id)

    const { data, error } = await supabase
      .from("chat_participants")
      .select(`
        chat_id,
        chats!inner (
          id,
          name,
          type,
          avatar_url,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", user.id)

    if (data) {
      const chatIds = data.map((item) => item.chat_id)

      // Fetch last messages for each chat
      const { data: lastMessages } = await supabase
        .from("messages")
        .select("*")
        .in("chat_id", chatIds)
        .order("created_at", { ascending: false })

      const chatsWithMessages = data.map((item) => {
        const chat = item.chats
        const lastMessage = lastMessages?.find((msg) => msg.chat_id === chat.id)
        return {
          ...chat,
          last_message: lastMessage,
        }
      })

      setChats(chatsWithMessages)
    }
  }

  const createSampleChatsForUser = async (userId: string) => {
    // Demo users with proper UUIDs (these should already exist in the database)
    const demoUsers = [
      {
        id: "550e8400-e29b-41d4-a716-446655440021",
        full_name: "Alice Johnson",
        avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440022",
        full_name: "Bob Wilson",
        avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440023",
        full_name: "Carol Davis",
        avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440024",
        full_name: "David Brown",
        avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440025",
        full_name: "Emma Taylor",
        avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      },
    ]

    // Generate proper UUIDs for chats
    const generateUUID = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c == "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    // Create direct chats with each demo user
    const directChats = demoUsers.map((demoUser) => ({
      id: generateUUID(),
      name: demoUser.full_name,
      type: "direct" as const,
      created_by: userId,
      avatar_url: demoUser.avatar_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Insert chats (use upsert to avoid conflicts)
    const { error: chatError } = await supabase.from("chats").upsert(directChats, {
      onConflict: "id",
      ignoreDuplicates: false,
    })

    if (chatError) {
      console.error("Error creating chats:", chatError)
      return
    }

    // Add participants to each direct chat (user + one demo user)
    const participantData = []
    directChats.forEach((chat, index) => {
      // Add the main user
      participantData.push({
        id: generateUUID(),
        chat_id: chat.id,
        user_id: userId,
        role: "member" as const,
        joined_at: new Date().toISOString(),
      })
      // Add the demo user
      participantData.push({
        id: generateUUID(),
        chat_id: chat.id,
        user_id: demoUsers[index].id,
        role: "member" as const,
        joined_at: new Date().toISOString(),
      })
    })

    const { error: participantError } = await supabase.from("chat_participants").upsert(participantData, {
      onConflict: "id",
      ignoreDuplicates: false,
    })

    if (participantError) {
      console.error("Error adding participants:", participantError)
      return
    }

    // Add sample messages for each chat
    const sampleMessages = [
      // Alice Johnson chat
      {
        id: generateUUID(),
        chat_id: directChats[0].id,
        sender_id: demoUsers[0].id,
        content: "Hey! 👋 How are you doing today?",
        message_type: "text" as const,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: generateUUID(),
        chat_id: directChats[0].id,
        sender_id: demoUsers[0].id,
        content: "I just finished working on the new design mockups! 🎨",
        message_type: "text" as const,
        created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: generateUUID(),
        chat_id: directChats[0].id,
        sender_id: demoUsers[0].id,
        content: "What do you think? 😊",
        message_type: "text" as const,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },

      // Bob Wilson chat
      {
        id: generateUUID(),
        chat_id: directChats[1].id,
        sender_id: demoUsers[1].id,
        content: "Good morning! ☀️",
        message_type: "text" as const,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: generateUUID(),
        chat_id: directChats[1].id,
        sender_id: demoUsers[1].id,
        content: "The marketing campaign is ready to launch! 🚀",
        message_type: "text" as const,
        created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: generateUUID(),
        chat_id: directChats[1].id,
        sender_id: demoUsers[1].id,
        content: "🎤 Voice message (0:32)",
        message_type: "voice" as const,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },

      // Carol Davis chat
      {
        id: generateUUID(),
        chat_id: directChats[2].id,
        sender_id: demoUsers[2].id,
        content: "Hi there! 👋",
        message_type: "text" as const,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: generateUUID(),
        chat_id: directChats[2].id,
        sender_id: demoUsers[2].id,
        content: "📎 Shared file: project_specs.pdf",
        message_type: "file" as const,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },

      // David Brown chat
      {
        id: generateUUID(),
        chat_id: directChats[3].id,
        sender_id: demoUsers[3].id,
        content: "Hey! How's the development going? 💻",
        message_type: "text" as const,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: generateUUID(),
        chat_id: directChats[3].id,
        sender_id: demoUsers[3].id,
        content: "All tests are passing! ✅",
        message_type: "text" as const,
        created_at: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
      },

      // Emma Taylor chat
      {
        id: generateUUID(),
        chat_id: directChats[4].id,
        sender_id: demoUsers[4].id,
        content: "Hello! 😊 Hope you're having a great day!",
        message_type: "text" as const,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: generateUUID(),
        chat_id: directChats[4].id,
        sender_id: demoUsers[4].id,
        content: "Customer feedback has been amazing! 🎉",
        message_type: "text" as const,
        created_at: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(),
      },
    ]

    const { error: messageError } = await supabase.from("messages").upsert(sampleMessages, {
      onConflict: "id",
      ignoreDuplicates: false,
    })

    if (messageError) {
      console.error("Error creating messages:", messageError)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    } else {
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <header className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-gray-700">chats</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="text-gray-500">
              <span className="text-xs">Refresh</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500">
              <span className="text-xs">Help</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500">
              <span className="text-xs">5 / 6 phones</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Star className="w-4 h-4 mr-2" />
                  Starred
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center space-x-2 mb-3">
          <Button variant="outline" size="sm" className="text-green-600 border-green-600">
            <Filter className="w-4 h-4 mr-1" />
            Custom filter
          </Button>
          <Button variant="outline" size="sm">
            Save
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="text-green-600">
            <Filter className="w-4 h-4 mr-1" />
            Filtered
          </Button>
          <span className="text-xs text-gray-500">2</span>
        </div>
      </header>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onChatSelect(chat.id)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
              selectedChatId === chat.id ? "bg-green-50 border-l-4 border-l-green-500" : ""
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={chat.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gray-300 text-gray-600">{getInitials(chat.name)}</AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{chat.name || "Unnamed Chat"}</h3>
                  <div className="flex items-center space-x-1">
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-600">
                      Demo
                    </Badge>
                    {Math.random() > 0.5 && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-600">
                        Internal
                      </Badge>
                    )}
                    {Math.random() > 0.7 && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-600">
                        Content
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 truncate mb-1">{chat.last_message?.content || "No messages yet"}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">📞 +91 99799 44008 +1</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {chat.last_message ? formatTime(chat.last_message.created_at) : ""}
                    </span>
                    {chat.unread_count && (
                      <div className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                        {chat.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
