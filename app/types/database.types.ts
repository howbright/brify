export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      profiles: {
        Row: {
          created_at: string | null
          id: string
          initial_credits: number | null
          is_pro: boolean | null
          last_reset: string | null
          locale: string | null
          monthly_reset_credits: number | null
          pro_expiration: string | null
          remaining_credits: number | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          initial_credits?: number | null
          is_pro?: boolean | null
          last_reset?: string | null
          locale?: string | null
          monthly_reset_credits?: number | null
          pro_expiration?: string | null
          remaining_credits?: number | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          initial_credits?: number | null
          is_pro?: boolean | null
          last_reset?: string | null
          locale?: string | null
          monthly_reset_credits?: number | null
          pro_expiration?: string | null
          remaining_credits?: number | null
          role?: string | null
        }
        Relationships: []
      }
      summaries: {
        Row: {
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
