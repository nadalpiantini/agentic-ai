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
          model_used: string | null
          tool_calls: Json | null
          tokens_used: number | null
          user_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          role: string
          content: string
          model_used?: string | null
          tool_calls?: Json | null
          tokens_used?: number | null
          user_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          role?: string
          content?: string
          model_used?: string | null
          tool_calls?: Json | null
          tokens_used?: number | null
          user_id?: string | null
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
      activity_logs: {
        Row: {
          id: string
          event_type: string
          user_id: string | null
          thread_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          user_id?: string | null
          thread_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          user_id?: string | null
          thread_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      api_requests: {
        Row: {
          id: string
          request_id: string
          method: string
          path: string
          user_id: string | null
          thread_id: string | null
          status_code: number
          duration_ms: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          method: string
          path: string
          user_id?: string | null
          thread_id?: string | null
          status_code?: number
          duration_ms?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          method?: string
          path?: string
          user_id?: string | null
          thread_id?: string | null
          status_code?: number
          duration_ms?: number
          metadata?: Json
          created_at?: string
        }
      }
      metrics: {
        Row: {
          id: string
          metric_name: string
          metric_value: number
          unit: string
          user_id: string | null
          thread_id: string | null
          metadata: Json
          recorded_at: string
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value: number
          unit: string
          user_id?: string | null
          thread_id?: string | null
          metadata?: Json
          recorded_at?: string
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: number
          unit?: string
          user_id?: string | null
          thread_id?: string | null
          metadata?: Json
          recorded_at?: string
        }
      }
      rate_limits: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          request_count: number
          reset_at: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          request_count?: number
          reset_at: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          request_count?: number
          reset_at?: string
          metadata?: Json
          created_at?: string
        }
      }
      database_health: {
        Row: {
          id: string
          status: string
          connection_count: number
          total_size_bytes: number
          replication_lag_ms: number
          disk_available_bytes: number
          checked_at: string
        }
        Insert: {
          id?: string
          status: string
          connection_count?: number
          total_size_bytes?: number
          replication_lag_ms?: number
          disk_available_bytes?: number
          checked_at?: string
        }
        Update: {
          id?: string
          status?: string
          connection_count?: number
          total_size_bytes?: number
          replication_lag_ms?: number
          disk_available_bytes?: number
          checked_at?: string
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
