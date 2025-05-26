"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Send, MoreVertical, Search, Star, Phone, Video, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import EmojiPicker from "./emoji-picker"
import VoiceRecorder from "./voice-recorder"
import AttachmentHandler from "./attachment-handler"
import type { Message, Chat, User } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface ChatAreaProps {
  chatId?: string
}

export default function ChatArea({ chatId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chat, setChat] = useState<Chat | null>(null)
  const [participants, setParticipants] = useState<User[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (chatId) {
      fetchChat()
      fetchMessages()
      fetchParticipants()

      // Subscribe to new messages
      const subscription = supabase
        .channel(`messages:${chatId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            const newMessage = payload.new as Message
            setMessages((prev) => [...prev, newMessage])
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchChat = async () => {
    if (!chatId) return

    const { data, error } = await supabase.from("chats").select("*").eq("id", chatId).single()

    if (data) {
      setChat(data)
    }
  }

  const fetchMessages = async () => {
    if (!chatId) return

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (data) {
      setMessages(data)
    }
  }

  const fetchParticipants = async () => {
    if (!chatId) return

    const { data, error } = await supabase
      .from("chat_participants")
      .select(`
        user:users!chat_participants_user_id_fkey (
          id,
          full_name,
          avatar_url,
          status
        )
      `)
      .eq("chat_id", chatId)

    if (data) {
      setParticipants(data.map((item) => item.user).filter(Boolean))
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !chatId || !user) return

    const { error } = await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      content: newMessage.trim(),
      message_type: "text",
    })

    if (!error) {
      setNewMessage("")
    }
  }

  const handleFileSelect = async (file: File, type: string) => {
    if (!chatId || !user) return

    // For demo, just add a message indicating file was shared
    const { error } = await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      content: `📎 Shared ${type}: ${file.name}`,
      message_type: type,
    })
  }

  const handleVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!chatId || !user) return

    // For demo, just add a message indicating voice message was sent
    const { error } = await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      content: `🎤 Voice message (${duration}s)`,
      message_type: "voice",
    })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
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

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
  }

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">💬</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a chat to start messaging</h3>
          <p className="text-gray-500">Choose from your existing conversations or start a new one</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <header className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={chat?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-gray-300 text-gray-600">{getInitials(chat?.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-gray-900">{chat?.name || "Test El Centro"}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Roshnag Airtel, Roshnag Jio, Bharat Kumar Ramesh, Periskope</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {participants.slice(0, 5).map((participant, index) => (
              <Avatar key={participant.id} className="w-8 h-8 -ml-2 border-2 border-white">
                <AvatarImage src={participant.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-gray-300 text-gray-600 text-xs">
                  {getInitials(participant.full_name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {participants.length > 5 && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600">
                +{participants.length - 5}
              </div>
            )}
            <Button variant="ghost" size="sm">
              <Star className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwnMessage = message.sender_id === user?.id
          const showDate = index === 0 || formatDate(messages[index - 1].created_at) !== formatDate(message.created_at)

          return (
            <div key={message.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formatDate(message.created_at)}
                  </span>
                </div>
              )}

              <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage ? "bg-green-500 text-white" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="text-xs font-semibold mb-1 text-green-600">
                      {message.sender?.full_name || "Unknown User"}
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <div className={`text-xs mt-1 ${isOwnMessage ? "text-green-100" : "text-gray-500"}`}>
                    {formatTime(message.created_at)}
                    {isOwnMessage && <span className="ml-1">✓✓</span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <Badge variant="secondary" className="bg-green-100 text-green-600">
            WhatsApp
          </Badge>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-600">
            Private Note
          </Badge>
        </div>

        <form onSubmit={sendMessage} className="flex items-center space-x-2">
          <AttachmentHandler onFileSelect={handleFileSelect} />

          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              <VoiceRecorder onVoiceMessage={handleVoiceMessage} />
            </div>
          </div>

          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <Avatar className="w-4 h-4">
              <AvatarFallback className="bg-green-500 text-white text-xs">P</AvatarFallback>
            </Avatar>
            <span>Periskope</span>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
