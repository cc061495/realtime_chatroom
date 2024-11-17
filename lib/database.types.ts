export type Database = {
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
        }
      }
      user_profiles: {
        Row: {
          user_id: string
          username: string
          avatar_color: string
        }
      }
    }
  }
} 