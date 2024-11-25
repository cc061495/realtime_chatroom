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
          attachment: {
            url: string
            name: string
            type: string
          } | null
          is_deleted: boolean
          user_profiles?: {
            username: string
            avatar_color: string
            created_at: string
            status?: string
          }
        }
        Insert: {
          content: string
          user_id: string
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
          is_deleted?: boolean
        }
        Update: {
          content?: string
          is_deleted?: boolean
          reply_to?: {
            id: string
            content: string
            user_name: string
          } | null
        }
      }
      user_profiles: {
        Row: {
          user_id: string
          username: string
          avatar_color: string
          created_at: string
          status?: string
        }
        Insert: {
          username: string
          avatar_color: string
          created_at: string
          status?: string
        }
        Update: {
          username?: string
          avatar_color?: string
          created_at?: string
          status?: string
        }
      }
    }
  }
} 