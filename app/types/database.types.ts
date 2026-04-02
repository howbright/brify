export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      credit_lot_consumptions: {
        Row: {
          created_at: string
          credit_transaction_id: string
          id: string
          lot_id: string
          metadata: Json
          reference_id: string | null
          reference_table: string | null
          usage_type: Database["public"]["Enums"]["credit_usage_type"]
          used_credits: number
        }
        Insert: {
          created_at?: string
          credit_transaction_id: string
          id?: string
          lot_id: string
          metadata?: Json
          reference_id?: string | null
          reference_table?: string | null
          usage_type: Database["public"]["Enums"]["credit_usage_type"]
          used_credits: number
        }
        Update: {
          created_at?: string
          credit_transaction_id?: string
          id?: string
          lot_id?: string
          metadata?: Json
          reference_id?: string | null
          reference_table?: string | null
          usage_type?: Database["public"]["Enums"]["credit_usage_type"]
          used_credits?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_lot_consumptions_credit_transaction_id_fkey"
            columns: ["credit_transaction_id"]
            isOneToOne: false
            referencedRelation: "credit_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_lot_consumptions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "credit_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_lots: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          original_credits: number
          payment_id: string
          remaining_credits: number
          source: Database["public"]["Enums"]["credit_transaction_source"]
          status: Database["public"]["Enums"]["credit_lot_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          original_credits: number
          payment_id: string
          remaining_credits: number
          source: Database["public"]["Enums"]["credit_transaction_source"]
          status?: Database["public"]["Enums"]["credit_lot_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          original_credits?: number
          payment_id?: string
          remaining_credits?: number
          source?: Database["public"]["Enums"]["credit_transaction_source"]
          status?: Database["public"]["Enums"]["credit_lot_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_lots_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_lots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packs: {
        Row: {
          created_at: string
          credits: number
          currency: Database["public"]["Enums"]["currency_code"]
          display_name: string
          id: string
          is_active: boolean
          lemon_variant_id: string | null
          price: number
          toss_price_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits: number
          currency: Database["public"]["Enums"]["currency_code"]
          display_name: string
          id: string
          is_active?: boolean
          lemon_variant_id?: string | null
          price: number
          toss_price_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          currency?: Database["public"]["Enums"]["currency_code"]
          display_name?: string
          id?: string
          is_active?: boolean
          lemon_variant_id?: string | null
          price?: number
          toss_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          balance_free_after: number
          balance_paid_after: number
          balance_total_after: number
          created_at: string
          delta_free: number
          delta_paid: number
          delta_total: number
          id: string
          map_id: string | null
          payment_id: string | null
          reason: string | null
          source: Database["public"]["Enums"]["credit_transaction_source"]
          tx_type: Database["public"]["Enums"]["credit_transaction_type"]
          user_id: string
        }
        Insert: {
          balance_free_after: number
          balance_paid_after: number
          balance_total_after: number
          created_at?: string
          delta_free?: number
          delta_paid?: number
          delta_total: number
          id?: string
          map_id?: string | null
          payment_id?: string | null
          reason?: string | null
          source: Database["public"]["Enums"]["credit_transaction_source"]
          tx_type: Database["public"]["Enums"]["credit_transaction_type"]
          user_id: string
        }
        Update: {
          balance_free_after?: number
          balance_paid_after?: number
          balance_total_after?: number
          created_at?: string
          delta_free?: number
          delta_paid?: number
          delta_total?: number
          id?: string
          map_id?: string | null
          payment_id?: string | null
          reason?: string | null
          source?: Database["public"]["Enums"]["credit_transaction_source"]
          tx_type?: Database["public"]["Enums"]["credit_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      map_notes: {
        Row: {
          created_at: string
          id: string
          map_id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          map_id: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          map_id?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_notes_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
        ]
      }
      map_term_requests: {
        Row: {
          created_at: string
          error: string | null
          id: string
          job_id: string | null
          map_id: string
          mode: Database["public"]["Enums"]["map_term_request_kind"]
          status: Database["public"]["Enums"]["map_term_request_status"]
          terms_csv: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          job_id?: string | null
          map_id: string
          mode: Database["public"]["Enums"]["map_term_request_kind"]
          status?: Database["public"]["Enums"]["map_term_request_status"]
          terms_csv?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          job_id?: string | null
          map_id?: string
          mode?: Database["public"]["Enums"]["map_term_request_kind"]
          status?: Database["public"]["Enums"]["map_term_request_status"]
          terms_csv?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_term_requests_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_term_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      map_terms: {
        Row: {
          created_at: string
          id: string
          lang: string | null
          map_id: string
          meaning: string
          request_id: string
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lang?: string | null
          map_id: string
          meaning: string
          request_id: string
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lang?: string | null
          map_id?: string
          meaning?: string
          request_id?: string
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_terms_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_terms_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "map_term_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      maps: {
        Row: {
          ai_processing_ms: number | null
          channel_name: string | null
          created_at: string
          credits_charged: number
          credits_charged_at: string | null
          description: string | null
          extract_error: string | null
          extract_job_id: string | null
          extract_status: Database["public"]["Enums"]["map_extract_status"]
          extracted_text: string | null
          id: string
          map_status: Database["public"]["Enums"]["map_status"]
          mind_elixir: Json | null
          mind_elixir_draft: Json | null
          mind_theme_override: string | null
          output_language: string | null
          required_credits: number
          schema_version: number
          share_enabled: boolean
          share_token: string | null
          short_title: string | null
          source_char_count: number | null
          source_type: Database["public"]["Enums"]["map_source_type"]
          source_url: string | null
          summary: string | null
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_processing_ms?: number | null
          channel_name?: string | null
          created_at?: string
          credits_charged?: number
          credits_charged_at?: string | null
          description?: string | null
          extract_error?: string | null
          extract_job_id?: string | null
          extract_status?: Database["public"]["Enums"]["map_extract_status"]
          extracted_text?: string | null
          id?: string
          map_status?: Database["public"]["Enums"]["map_status"]
          mind_elixir?: Json | null
          mind_elixir_draft?: Json | null
          mind_theme_override?: string | null
          output_language?: string | null
          required_credits?: number
          schema_version?: number
          share_enabled?: boolean
          share_token?: string | null
          short_title?: string | null
          source_char_count?: number | null
          source_type?: Database["public"]["Enums"]["map_source_type"]
          source_url?: string | null
          summary?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_processing_ms?: number | null
          channel_name?: string | null
          created_at?: string
          credits_charged?: number
          credits_charged_at?: string | null
          description?: string | null
          extract_error?: string | null
          extract_job_id?: string | null
          extract_status?: Database["public"]["Enums"]["map_extract_status"]
          extracted_text?: string | null
          id?: string
          map_status?: Database["public"]["Enums"]["map_status"]
          mind_elixir?: Json | null
          mind_elixir_draft?: Json | null
          mind_theme_override?: string | null
          output_language?: string | null
          required_credits?: number
          schema_version?: number
          share_enabled?: boolean
          share_token?: string | null
          short_title?: string | null
          source_char_count?: number | null
          source_type?: Database["public"]["Enums"]["map_source_type"]
          source_url?: string | null
          summary?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string
          dedupe_key: string | null
          delta_credits: number
          entity_id: string | null
          event_type: Database["public"]["Enums"]["notification_event_type"]
          id: string
          is_read: boolean
          message_key: string
          params: Json
          read_at: string | null
          source: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title_key: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          dedupe_key?: string | null
          delta_credits?: number
          entity_id?: string | null
          event_type: Database["public"]["Enums"]["notification_event_type"]
          id?: string
          is_read?: boolean
          message_key: string
          params?: Json
          read_at?: string | null
          source?: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title_key: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          dedupe_key?: string | null
          delta_credits?: number
          entity_id?: string | null
          event_type?: Database["public"]["Enums"]["notification_event_type"]
          id?: string
          is_read?: boolean
          message_key?: string
          params?: Json
          read_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title_key?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_webhook_logs: {
        Row: {
          event_type: string
          id: string
          payload: Json
          provider: Database["public"]["Enums"]["payment_provider"]
          received_at: string
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          provider: Database["public"]["Enums"]["payment_provider"]
          received_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          provider?: Database["public"]["Enums"]["payment_provider"]
          received_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          credit_pack_id: string | null
          credits: number
          currency: Database["public"]["Enums"]["currency_code"]
          id: string
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_customer_id: string | null
          provider_order_id: string
          provider_payment_key: string | null
          raw_payload: Json | null
          receipt_url: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credit_pack_id?: string | null
          credits?: number
          currency: Database["public"]["Enums"]["currency_code"]
          id?: string
          paid_at?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_customer_id?: string | null
          provider_order_id: string
          provider_payment_key?: string | null
          raw_payload?: Json | null
          receipt_url?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credit_pack_id?: string | null
          credits?: number
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_customer_id?: string | null
          provider_order_id?: string
          provider_payment_key?: string | null
          raw_payload?: Json | null
          receipt_url?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_credit_pack_id_fkey"
            columns: ["credit_pack_id"]
            isOneToOne: false
            referencedRelation: "credit_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          credits_free: number
          credits_paid: number
          email: string | null
          id: string
          locale: string | null
          mind_theme_preference: string | null
          role: Database["public"]["Enums"]["profile_role"]
          terms_accepted: boolean
        }
        Insert: {
          created_at?: string | null
          credits_free?: number
          credits_paid?: number
          email?: string | null
          id: string
          locale?: string | null
          mind_theme_preference?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
          terms_accepted?: boolean
        }
        Update: {
          created_at?: string | null
          credits_free?: number
          credits_paid?: number
          email?: string | null
          id?: string
          locale?: string | null
          mind_theme_preference?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
          terms_accepted?: boolean
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          email: string | null
          id: number
          message: string
          meta: Json | null
          needs_reply: boolean
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          email?: string | null
          id?: number
          message: string
          meta?: Json | null
          needs_reply?: boolean
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          email?: string | null
          id?: number
          message?: string
          meta?: Json | null
          needs_reply?: boolean
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      youtube_scripts: {
        Row: {
          channel_name: string | null
          created_at: string
          error_message: string | null
          id: string
          language: string | null
          script_raw: string | null
          status: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          url: string
          user_id: string
          video_id: string
        }
        Insert: {
          channel_name?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          language?: string | null
          script_raw?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          url: string
          user_id: string
          video_id: string
        }
        Update: {
          channel_name?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          language?: string | null
          script_raw?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          url?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      credit_lot_status: "active" | "depleted" | "expired" | "refunded"
      credit_transaction_source:
        | "lemon_squeezy"
        | "toss"
        | "system"
        | "admin"
        | "migration"
      credit_transaction_type:
        | "purchase"
        | "spend"
        | "bonus"
        | "refund"
        | "adjustment"
        | "expire"
      credit_usage_type:
        | "map_generation"
        | "summary_generation"
        | "export"
        | "feature_access"
        | "admin_adjustment"
        | "system_deduction"
      currency_code: "krw" | "usd"
      map_extract_status:
        | "idle"
        | "queued"
        | "processing"
        | "cached"
        | "completed"
        | "failed"
        | "error"
        | "not_found"
      map_source_type: "youtube" | "website" | "file" | "manual"
      map_status: "processing" | "done" | "failed" | "idle" | "queued"
      map_term_request_kind: "auto" | "custom"
      map_term_request_status:
        | "processing"
        | "done"
        | "failed"
        | "idle"
        | "queued"
      map_term_session_status: "active" | "exhausted" | "cancelled"
      notification_category: "mission" | "billing" | "system"
      notification_event_type:
        | "signup_bonus"
        | "mission_approved"
        | "mission_rejected"
        | "payment_completed"
        | "payment_failed"
        | "refund_completed"
        | "credit_insufficient"
        | "system_info"
      notification_status:
        | "approved"
        | "rejected"
        | "completed"
        | "failed"
        | "refunded"
        | "insufficient"
        | "info"
      payment_provider: "lemon_squeezy" | "toss"
      payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "part_refunded"
        | "canceled"
      profile_role: "ADMIN" | "USER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      credit_lot_status: ["active", "depleted", "expired", "refunded"],
      credit_transaction_source: [
        "lemon_squeezy",
        "toss",
        "system",
        "admin",
        "migration",
      ],
      credit_transaction_type: [
        "purchase",
        "spend",
        "bonus",
        "refund",
        "adjustment",
        "expire",
      ],
      credit_usage_type: [
        "map_generation",
        "summary_generation",
        "export",
        "feature_access",
        "admin_adjustment",
        "system_deduction",
      ],
      currency_code: ["krw", "usd"],
      map_extract_status: [
        "idle",
        "queued",
        "processing",
        "cached",
        "completed",
        "failed",
        "error",
        "not_found",
      ],
      map_source_type: ["youtube", "website", "file", "manual"],
      map_status: ["processing", "done", "failed", "idle", "queued"],
      map_term_request_kind: ["auto", "custom"],
      map_term_request_status: [
        "processing",
        "done",
        "failed",
        "idle",
        "queued",
      ],
      map_term_session_status: ["active", "exhausted", "cancelled"],
      notification_category: ["mission", "billing", "system"],
      notification_event_type: [
        "signup_bonus",
        "mission_approved",
        "mission_rejected",
        "payment_completed",
        "payment_failed",
        "refund_completed",
        "credit_insufficient",
        "system_info",
      ],
      notification_status: [
        "approved",
        "rejected",
        "completed",
        "failed",
        "refunded",
        "insufficient",
        "info",
      ],
      payment_provider: ["lemon_squeezy", "toss"],
      payment_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "part_refunded",
        "canceled",
      ],
      profile_role: ["ADMIN", "USER"],
    },
  },
} as const
