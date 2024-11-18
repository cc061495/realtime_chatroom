export interface OnlineUser {
  username: string
  user_id?: string
  status: 'online' | 'typing' | 'away'
  lastActive: number
  avatarColor: string
}

export interface User {
  id: string
  email: string
  username: string
  avatarColor?: string
}

export interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  reply_to: any
  attachment: any
  user_profiles: {
    username: string
    avatar_color: string
  }
  is_deleted?: boolean
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