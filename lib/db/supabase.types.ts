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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account: {
        Row: {
          created_at: string | null
          role: Database["public"]["Enums"]["account_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role?: Database["public"]["Enums"]["account_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          role?: Database["public"]["Enums"]["account_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      answer: {
        Row: {
          created_at: string | null
          default_answer: string | null
          file_generated_at: string | null
          file_key: string | null
          form_id: string
          form_session_id: string
          id: string
          question_id: string
          stt: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_answer?: string | null
          file_generated_at?: string | null
          file_key?: string | null
          form_id: string
          form_session_id: string
          id?: string
          question_id: string
          stt?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_answer?: string | null
          file_generated_at?: string | null
          file_key?: string | null
          form_id?: string
          form_session_id?: string
          id?: string
          question_id?: string
          stt?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_form_id_form_id_fk"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_form_session_id_form_session_id_fk"
            columns: ["form_session_id"]
            isOneToOne: false
            referencedRelation: "form_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_question_id_question_id_fk"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question"
            referencedColumns: ["id"]
          },
        ]
      }
      asset: {
        Row: {
          created_at: string | null
          file_key: string
          id: string
          mime_type: string
          name: string
          size: number
          type: Database["public"]["Enums"]["asset_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_key: string
          id?: string
          mime_type: string
          name: string
          size: number
          type: Database["public"]["Enums"]["asset_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_key?: string
          id?: string
          mime_type?: string
          name?: string
          size?: number
          type?: Database["public"]["Enums"]["asset_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      form: {
        Row: {
          analysis_instructions: string | null
          background_image_key: string | null
          background_music_key: string | null
          created_at: string | null
          end_message: string | null
          end_title: string | null
          id: string
          instructions: string
          intro_message: string | null
          intro_title: string | null
          language: Database["public"]["Enums"]["form_language"]
          name: string
          theme: Database["public"]["Enums"]["form_theme"]
          type: Database["public"]["Enums"]["form_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_instructions?: string | null
          background_image_key?: string | null
          background_music_key?: string | null
          created_at?: string | null
          end_message?: string | null
          end_title?: string | null
          id?: string
          instructions: string
          intro_message?: string | null
          intro_title?: string | null
          language?: Database["public"]["Enums"]["form_language"]
          name: string
          theme?: Database["public"]["Enums"]["form_theme"]
          type?: Database["public"]["Enums"]["form_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_instructions?: string | null
          background_image_key?: string | null
          background_music_key?: string | null
          created_at?: string | null
          end_message?: string | null
          end_title?: string | null
          id?: string
          instructions?: string
          intro_message?: string | null
          intro_title?: string | null
          language?: Database["public"]["Enums"]["form_language"]
          name?: string
          theme?: Database["public"]["Enums"]["form_theme"]
          type?: Database["public"]["Enums"]["form_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      form_assignment: {
        Row: {
          active: boolean
          assigned_by: string
          created_at: string | null
          form_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          assigned_by: string
          created_at?: string | null
          form_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          assigned_by?: string
          created_at?: string | null
          form_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_assignment_form_id_form_id_fk"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form"
            referencedColumns: ["id"]
          },
        ]
      }
      form_session: {
        Row: {
          completion_analysis_audio_url: string | null
          completion_analysis_status: string
          completion_analysis_text: string | null
          created_at: string | null
          current_question_index: number
          form_id: string
          id: string
          status: Database["public"]["Enums"]["form_session_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completion_analysis_audio_url?: string | null
          completion_analysis_status?: string
          completion_analysis_text?: string | null
          created_at?: string | null
          current_question_index?: number
          form_id: string
          id?: string
          status?: Database["public"]["Enums"]["form_session_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completion_analysis_audio_url?: string | null
          completion_analysis_status?: string
          completion_analysis_text?: string | null
          created_at?: string | null
          current_question_index?: number
          form_id?: string
          id?: string
          status?: Database["public"]["Enums"]["form_session_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_session_form_id_form_id_fk"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form"
            referencedColumns: ["id"]
          },
        ]
      }
      lead: {
        Row: {
          created_at: string | null
          email: string
          form_id: string
          form_session_id: string
          id: string
          name: string
          phone: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          form_id: string
          form_session_id: string
          id?: string
          name: string
          phone: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          form_id?: string
          form_session_id?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_form_id_form_id_fk"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_form_session_id_form_session_id_fk"
            columns: ["form_session_id"]
            isOneToOne: false
            referencedRelation: "form_session"
            referencedColumns: ["id"]
          },
        ]
      }
      question: {
        Row: {
          created_at: string | null
          default_answers: Json
          file_generated_at: string | null
          file_key: string | null
          form_id: string
          id: string
          order: number
          question: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_answers: Json
          file_generated_at?: string | null
          file_key?: string | null
          form_id: string
          id?: string
          order?: number
          question: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_answers?: Json
          file_generated_at?: string | null
          file_key?: string | null
          form_id?: string
          id?: string
          order?: number
          question?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_form_id_form_id_fk"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form"
            referencedColumns: ["id"]
          },
        ]
      }
      test: {
        Row: {
          created_at: string | null
          end_message: string | null
          end_title: string | null
          id: string
          intro_message: string | null
          intro_title: string | null
          language: Database["public"]["Enums"]["form_language"]
          name: string
          slug: string
          status: Database["public"]["Enums"]["test_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_message?: string | null
          end_title?: string | null
          id?: string
          intro_message?: string | null
          intro_title?: string | null
          language?: Database["public"]["Enums"]["form_language"]
          name: string
          slug: string
          status?: Database["public"]["Enums"]["test_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_message?: string | null
          end_title?: string | null
          id?: string
          intro_message?: string | null
          intro_title?: string | null
          language?: Database["public"]["Enums"]["form_language"]
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["test_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      test_profile: {
        Row: {
          created_at: string | null
          description: string
          id: string
          order: number
          test_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          order?: number
          test_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          order?: number
          test_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_profile_test_id_test_id_fk"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "test"
            referencedColumns: ["id"]
          },
        ]
      }
      test_question: {
        Row: {
          answers: Json
          created_at: string | null
          file_generated_at: string | null
          file_key: string | null
          id: string
          order: number
          question: string
          test_id: string
          updated_at: string | null
        }
        Insert: {
          answers: Json
          created_at?: string | null
          file_generated_at?: string | null
          file_key?: string | null
          id?: string
          order?: number
          question: string
          test_id: string
          updated_at?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string | null
          file_generated_at?: string | null
          file_key?: string | null
          id?: string
          order?: number
          question?: string
          test_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_question_test_id_test_id_fk"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "test"
            referencedColumns: ["id"]
          },
        ]
      }
      test_result: {
        Row: {
          answer_selections: Json
          created_at: string | null
          id: string
          language: Database["public"]["Enums"]["form_language"]
          profile_id: string
          score_totals: Json
          test_id: string
          updated_at: string | null
        }
        Insert: {
          answer_selections: Json
          created_at?: string | null
          id?: string
          language?: Database["public"]["Enums"]["form_language"]
          profile_id: string
          score_totals: Json
          test_id: string
          updated_at?: string | null
        }
        Update: {
          answer_selections?: Json
          created_at?: string | null
          id?: string
          language?: Database["public"]["Enums"]["form_language"]
          profile_id?: string
          score_totals?: Json
          test_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_result_profile_id_test_profile_id_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "test_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_result_test_id_test_id_fk"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "test"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      submit_public_form_answer: {
        Args: {
          p_default_answer?: string
          p_file_generated_at?: string
          p_file_key?: string
          p_form_id: string
          p_question_id: string
          p_session_id: string
          p_stt?: string
        }
        Returns: Json
      }
    }
    Enums: {
      account_role: "admin" | "user"
      asset_type: "image" | "video" | "audio"
      form_language: "en" | "it" | "es"
      form_session_status: "pending" | "in_progress" | "completed"
      form_theme: "light" | "dark"
      form_type: "mixed" | "default-only" | "voice-only"
      test_status: "draft" | "published"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_role: ["admin", "user"],
      asset_type: ["image", "video", "audio"],
      form_language: ["en", "it", "es"],
      form_session_status: ["pending", "in_progress", "completed"],
      form_theme: ["light", "dark"],
      form_type: ["mixed", "default-only", "voice-only"],
      test_status: ["draft", "published"],
    },
  },
} as const
