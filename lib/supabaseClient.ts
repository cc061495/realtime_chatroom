import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  reply_to: {
    id: string
    content: string
    user_name: string
  } | null
  user_profiles: {
    username: string
    avatar_color: string
  }
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
        }
        Insert: {
          content: string
          user_id: string
          reply_to?: {
            id: string
            content: string
            user_name: string
          } | null
        }
        Update: {
          content?: string
          user_id?: string
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
          email: string
          avatar_color: string
        }
        Insert: {
          user_id: string
          username: string
          email: string
          avatar_color?: string
        }
        Update: {
          username?: string
          email?: string
          avatar_color?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey) 