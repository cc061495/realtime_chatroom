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
}

export interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  user_profiles: {
    username: string
    avatar_color: string
  }
  reply_to?: {
    id: string
    content: string
    user_name: string
  } | null
  attachment?: {
    url: string
    name: string
  }
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
          reply_to: {
            id: string
            content: string
            user_name: string
          } | null
          user_profiles?: {
            username: string
            avatar_color: string
          }
        }
      }
    }
  }
} 