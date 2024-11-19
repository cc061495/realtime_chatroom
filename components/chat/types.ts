export interface OnlineUser {
  username: string
  user_id?: string
  status: 'online' | 'typing' | 'away'
  lastActive: number
  avatarColor: string
  created_at?: string
}

export interface User {
  id: string
  username: string
  created_at: string
  email: string
  avatarColor?: string
  status?: "online" | "typing" | "away"
}

export interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  user_profiles: {
    username: string
    avatar_color: string
    created_at: string
    status?: string
  }
  reply_to?: {
    id: string
    content: string
    user_name: string
  } | null
  attachment?: {
    url: string
    name: string
    type: string
  } | null
  is_deleted: boolean
}

export interface ColorOption {
  name: string
  value: string
}

export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string
          content: string
          created_at: string
          user_id: string
          reply_to: any
          user_profiles?: {
            username: string
            avatar_color: string
            created_at: string
            status?: string
          }
        }
      }
    }
  }
}

export interface Attachment {
  type: 'image'
  url: string
  fileName: string
  file: File
}

export interface MessageDraft {
  text: string
  attachments: Attachment[]
}

export interface ChatInputProps {
  onSendMessage: (text: string, attachments?: Attachment[]) => void
  isLoading?: boolean
}

export interface UserProfile {
  user_id: string
  username: string
  avatar_color: string
  created_at: string
  status?: string
} 