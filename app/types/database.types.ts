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
          payment_id: string | null
          reason: string | null
          source: Database["public"]["Enums"]["credit_transaction_source"]
          summary_id: string | null
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
          payment_id?: string | null
          reason?: string | null
          source: Database["public"]["Enums"]["credit_transaction_source"]
          summary_id?: string | null
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
          payment_id?: string | null
          reason?: string | null
          source?: Database["public"]["Enums"]["credit_transaction_source"]
          summary_id?: string | null
          tx_type?: Database["public"]["Enums"]["credit_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          id: number
          lang: string
          name: string
        }
        Insert: {
          id?: number
          lang?: string
          name: string
        }
        Update: {
          id?: number
          lang?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          dedupe_key: string | null
          delta_credits: number
          entity_id: string | null
          event_type: string
          id: string
          is_read: boolean
          message_key: string
          params: Json
          read_at: string | null
          source: string | null
          status: string
          title_key: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          dedupe_key?: string | null
          delta_credits?: number
          entity_id?: string | null
          event_type: string
          id?: string
          is_read?: boolean
          message_key: string
          params?: Json
          read_at?: string | null
          source?: string | null
          status: string
          title_key: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          dedupe_key?: string | null
          delta_credits?: number
          entity_id?: string | null
          event_type?: string
          id?: string
          is_read?: boolean
          message_key?: string
          params?: Json
          read_at?: string | null
          source?: string | null
          status?: string
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
          terms_accepted: boolean
        }
        Insert: {
          created_at?: string | null
          credits_free?: number
          credits_paid?: number
          email?: string | null
          id: string
          locale?: string | null
          terms_accepted?: boolean
        }
        Update: {
          created_at?: string | null
          credits_free?: number
          credits_paid?: number
          email?: string | null
          id?: string
          locale?: string | null
          terms_accepted?: boolean
        }
        Relationships: []
      }
      summaries: {
        Row: {
          category: string | null
          created_at: string | null
          detailed_summary_text: string | null
          diagram_json: Json | null
          error_message: string | null
          id: string
          is_public: boolean | null
          lang: string | null
          original_expire_at: string | null
          original_text: string | null
          public_comment: string | null
          source_title: string | null
          source_type: string
          source_url: string | null
          status: string
          summary_text: string | null
          temp_diagram_json: Json | null
          temp_summary_text: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          detailed_summary_text?: string | null
          diagram_json?: Json | null
          error_message?: string | null
          id?: string
          is_public?: boolean | null
          lang?: string | null
          original_expire_at?: string | null
          original_text?: string | null
          public_comment?: string | null
          source_title?: string | null
          source_type: string
          source_url?: string | null
          status?: string
          summary_text?: string | null
          temp_diagram_json?: Json | null
          temp_summary_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          detailed_summary_text?: string | null
          diagram_json?: Json | null
          error_message?: string | null
          id?: string
          is_public?: boolean | null
          lang?: string | null
          original_expire_at?: string | null
          original_text?: string | null
          public_comment?: string | null
          source_title?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          summary_text?: string | null
          temp_diagram_json?: Json | null
          temp_summary_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      summary_keywords: {
        Row: {
          keyword_id: number
          summary_id: string
        }
        Insert: {
          keyword_id: number
          summary_id: string
        }
        Update: {
          keyword_id?: number
          summary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summary_keywords_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summary_keywords_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      summary_questions: {
        Row: {
          answer: string | null
          created_at: string | null
          id: string
          question: string
          summary_id: string | null
          user_id: string | null
        }
        Insert: {
          answer?: string | null
          created_at?: string | null
          id?: string
          question: string
          summary_id?: string | null
          user_id?: string | null
        }
        Update: {
          answer?: string | null
          created_at?: string | null
          id?: string
          question?: string
          summary_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "summary_questions_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "summaries"
            referencedColumns: ["id"]
          },
        ]
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
      terminologies: {
        Row: {
          definition: string | null
          id: number
          summary_id: string | null
          term: string
        }
        Insert: {
          definition?: string | null
          id?: number
          summary_id?: string | null
          term: string
        }
        Update: {
          definition?: string | null
          id?: number
          summary_id?: string | null
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "terminologies_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "summaries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
      currency_code: "krw" | "usd"
      payment_provider: "lemon_squeezy" | "toss"
      payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "part_refunded"
        | "canceled"
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
      currency_code: ["krw", "usd"],
      payment_provider: ["lemon_squeezy", "toss"],
      payment_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "part_refunded",
        "canceled",
      ],
    },
  },
} as const
