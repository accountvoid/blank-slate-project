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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      gates: {
        Row: {
          battle_sessions: Json
          created_at: string
          id: string
          id_gate: string
          name_gate: string
          power_gate: number
          rank_gate: string
          rewards_log: Json
          stats: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          battle_sessions?: Json
          created_at?: string
          id?: string
          id_gate: string
          name_gate: string
          power_gate?: number
          rank_gate?: string
          rewards_log?: Json
          stats?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          battle_sessions?: Json
          created_at?: string
          id?: string
          id_gate?: string
          name_gate?: string
          power_gate?: number
          rank_gate?: string
          rewards_log?: Json
          stats?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_usd: number
          created_at: string
          credited: boolean
          gold_amount: number
          id: string
          nowpayments_invoice_id: string | null
          nowpayments_payment_id: string | null
          pay_address: string | null
          pay_amount: number | null
          pay_currency: string
          provider: string
          raw_payload: Json | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          credited?: boolean
          gold_amount: number
          id?: string
          nowpayments_invoice_id?: string | null
          nowpayments_payment_id?: string | null
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency: string
          provider?: string
          raw_payload?: Json | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          credited?: boolean
          gold_amount?: number
          id?: string
          nowpayments_invoice_id?: string | null
          nowpayments_payment_id?: string | null
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency?: string
          provider?: string
          raw_payload?: Json | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portals: {
        Row: {
          active: boolean
          color: string
          created_at: string
          danger: string
          energy_density: string
          id: string
          id_portal: string
          name: string
          rank: string
          required_level: number
          required_power: number
          rewards: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          danger?: string
          energy_density?: string
          id?: string
          id_portal: string
          name: string
          rank?: string
          required_level?: number
          required_power?: number
          rewards?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          danger?: string
          energy_density?: string
          id?: string
          id_portal?: string
          name?: string
          rank?: string
          required_level?: number
          required_power?: number
          rewards?: Json
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          daily_deadline_at: string | null
          gold_player: number
          hp_last_tick_at: string
          hp_max: number
          hp_player: number
          id_player: string
          last_daily_check: string | null
          level_player: number
          mb_player: number
          mp_max: number
          name_player: string
          punishment_active: boolean
          punishment_count: number | null
          punishment_end_at: string | null
          punishment_reason: string | null
          punishment_started_at: string | null
          Quests: Json
          rank_player: string
          stats_player: Json
          updated_at: string
          user_id: string
          void_player: number
        }
        Insert: {
          created_at?: string
          daily_deadline_at?: string | null
          gold_player?: number
          hp_last_tick_at?: string
          hp_max?: number
          hp_player?: number
          id_player: string
          last_daily_check?: string | null
          level_player?: number
          mb_player?: number
          mp_max?: number
          name_player?: string
          punishment_active?: boolean
          punishment_count?: number | null
          punishment_end_at?: string | null
          punishment_reason?: string | null
          punishment_started_at?: string | null
          Quests?: Json
          rank_player?: string
          stats_player?: Json
          updated_at?: string
          user_id: string
          void_player?: number
        }
        Update: {
          created_at?: string
          daily_deadline_at?: string | null
          gold_player?: number
          hp_last_tick_at?: string
          hp_max?: number
          hp_player?: number
          id_player?: string
          last_daily_check?: string | null
          level_player?: number
          mb_player?: number
          mp_max?: number
          name_player?: string
          punishment_active?: boolean
          punishment_count?: number | null
          punishment_end_at?: string | null
          punishment_reason?: string | null
          punishment_started_at?: string | null
          Quests?: Json
          rank_player?: string
          stats_player?: Json
          updated_at?: string
          user_id?: string
          void_player?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_damage: {
        Args: { hp_delta: number; mp_delta: number; uid: string }
        Returns: {
          created_at: string
          daily_deadline_at: string | null
          gold_player: number
          hp_last_tick_at: string
          hp_max: number
          hp_player: number
          id_player: string
          last_daily_check: string | null
          level_player: number
          mb_player: number
          mp_max: number
          name_player: string
          punishment_active: boolean
          punishment_count: number | null
          punishment_end_at: string | null
          punishment_reason: string | null
          punishment_started_at: string | null
          Quests: Json
          rank_player: string
          stats_player: Json
          updated_at: string
          user_id: string
          void_player: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_punishment_drain: {
        Args: { uid: string }
        Returns: {
          created_at: string
          daily_deadline_at: string | null
          gold_player: number
          hp_last_tick_at: string
          hp_max: number
          hp_player: number
          id_player: string
          last_daily_check: string | null
          level_player: number
          mb_player: number
          mp_max: number
          name_player: string
          punishment_active: boolean
          punishment_count: number | null
          punishment_end_at: string | null
          punishment_reason: string | null
          punishment_started_at: string | null
          Quests: Json
          rank_player: string
          stats_player: Json
          updated_at: string
          user_id: string
          void_player: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_and_apply_punishment: {
        Args: { uid: string }
        Returns: {
          created_at: string
          daily_deadline_at: string | null
          gold_player: number
          hp_last_tick_at: string
          hp_max: number
          hp_player: number
          id_player: string
          last_daily_check: string | null
          level_player: number
          mb_player: number
          mp_max: number
          name_player: string
          punishment_active: boolean
          punishment_count: number | null
          punishment_end_at: string | null
          punishment_reason: string | null
          punishment_started_at: string | null
          Quests: Json
          rank_player: string
          stats_player: Json
          updated_at: string
          user_id: string
          void_player: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      credit_payment_gold: {
        Args: { payment_id: string }
        Returns: {
          amount_usd: number
          created_at: string
          credited: boolean
          gold_amount: number
          id: string
          nowpayments_invoice_id: string | null
          nowpayments_payment_id: string | null
          pay_address: string | null
          pay_amount: number | null
          pay_currency: string
          provider: string
          raw_payload: Json | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_punishment:
        | {
            Args: { hours?: number; uid: string }
            Returns: {
              created_at: string
              daily_deadline_at: string | null
              gold_player: number
              hp_last_tick_at: string
              hp_max: number
              hp_player: number
              id_player: string
              last_daily_check: string | null
              level_player: number
              mb_player: number
              mp_max: number
              name_player: string
              punishment_active: boolean
              punishment_count: number | null
              punishment_end_at: string | null
              punishment_reason: string | null
              punishment_started_at: string | null
              Quests: Json
              rank_player: string
              stats_player: Json
              updated_at: string
              user_id: string
              void_player: number
            }
            SetofOptions: {
              from: "*"
              to: "profiles"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { hours?: number; reason?: string; uid: string }
            Returns: {
              created_at: string
              daily_deadline_at: string | null
              gold_player: number
              hp_last_tick_at: string
              hp_max: number
              hp_player: number
              id_player: string
              last_daily_check: string | null
              level_player: number
              mb_player: number
              mp_max: number
              name_player: string
              punishment_active: boolean
              punishment_count: number | null
              punishment_end_at: string | null
              punishment_reason: string | null
              punishment_started_at: string | null
              Quests: Json
              rank_player: string
              stats_player: Json
              updated_at: string
              user_id: string
              void_player: number
            }
            SetofOptions: {
              from: "*"
              to: "profiles"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      update_quests: {
        Args: { quests_json: Json; uid: string }
        Returns: {
          created_at: string
          daily_deadline_at: string | null
          gold_player: number
          hp_last_tick_at: string
          hp_max: number
          hp_player: number
          id_player: string
          last_daily_check: string | null
          level_player: number
          mb_player: number
          mp_max: number
          name_player: string
          punishment_active: boolean
          punishment_count: number | null
          punishment_end_at: string | null
          punishment_reason: string | null
          punishment_started_at: string | null
          Quests: Json
          rank_player: string
          stats_player: Json
          updated_at: string
          user_id: string
          void_player: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
