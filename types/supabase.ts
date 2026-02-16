/**
 * Supabase Database Types
 *
 * Generated types for Supabase tables
 * This file will be replaced by the Supabase CLI generated types
 * For now, we define the minimal types needed for the application
 */

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
      threads: {
        Row: {
          id: string
          user_id: string
          title: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          thread_id: string
          role: string
          content: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          role: string
          content: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          role?: string
          content?: string
          metadata?: Json
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          content: string
          embedding: number[]
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          embedding: number[]
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          embedding?: number[]
          metadata?: Json
          created_at?: string
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
