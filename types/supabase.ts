export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      dreams: {
        Row: {
          id: string
          created_at: string
          user_id: string
          dream_content: string
          emotions: string[]
          analysis: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          dream_content: string
          emotions: string[]
          analysis?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          dream_content?: string
          emotions?: string[]
          analysis?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          display_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
        }
      }
    }
  }
}
