export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  phone_number?: string
  status: "online" | "offline" | "away"
  created_at: string
  updated_at: string
}

export interface Chat {
  id: string
  name?: string
  type: "direct" | "group"
  avatar_url?: string
  created_by: string
  created_at: string
  updated_at: string
  participants?: ChatParticipant[]
  last_message?: Message
  unread_count?: number
  labels?: ChatLabel[]
}

export interface ChatParticipant {
  id: string
  chat_id: string
  user_id: string
  role: "admin" | "member"
  joined_at: string
  user?: User
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: "text" | "image" | "file" | "system"
  attachment_url?: string
  reply_to?: string
  created_at: string
  updated_at: string
  sender?: User
}

export interface ChatLabel {
  id: string
  name: string
  color: string
  created_at: string
}
