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
      admin_gates: {
        Row: {
          background: string | null
          close_time: string | null
          cooldown_minutes: number
          created_at: string
          description: string | null
          difficulty: string
          drops: Json
          enabled: boolean
          id: string
          image: string | null
          name: string
          open_time: string | null
          rank: string
          required_level: number
          rewards: Json
          updated_at: string
        }
        Insert: {
          background?: string | null
          close_time?: string | null
          cooldown_minutes?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          drops?: Json
          enabled?: boolean
          id?: string
          image?: string | null
          name: string
          open_time?: string | null
          rank?: string
          required_level?: number
          rewards?: Json
          updated_at?: string
        }
        Update: {
          background?: string | null
          close_time?: string | null
          cooldown_minutes?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          drops?: Json
          enabled?: boolean
          id?: string
          image?: string | null
          name?: string
          open_time?: string | null
          rank?: string
          required_level?: number
          rewards?: Json
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          ip: string | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          banner: string | null
          created_at: string
          description: string | null
          enabled: boolean
          end_date: string
          id: string
          image: string | null
          name: string
          rewards: Json
          rules: Json
          start_date: string
          updated_at: string
          visibility: string
        }
        Insert: {
          banner?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          end_date: string
          id?: string
          image?: string | null
          name: string
          rewards?: Json
          rules?: Json
          start_date: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          banner?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          end_date?: string
          id?: string
          image?: string | null
          name?: string
          rewards?: Json
          rules?: Json
          start_date?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
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
      grand_quests: {
        Row: {
          banner: string | null
          created_at: string
          description: string | null
          end_date: string
          id: string
          image: string | null
          is_active: boolean
          name: string
          priority: number
          rewards: Json
          start_date: string
          updated_at: string
          visibility: string
        }
        Insert: {
          banner?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          image?: string | null
          is_active?: boolean
          name: string
          priority?: number
          rewards?: Json
          start_date: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          banner?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          image?: string | null
          is_active?: boolean
          name?: string
          priority?: number
          rewards?: Json
          start_date?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      main_items: {
        Row: {
          buy_price: number
          category: string
          created_at: string
          description: string | null
          drop_rate: number
          duration: number | null
          effect: Json
          id: string
          image: string | null
          is_active: boolean
          name: string
          rarity: string
          sell_price: number
          stackable: boolean
          tradable: boolean
          updated_at: string
        }
        Insert: {
          buy_price?: number
          category?: string
          created_at?: string
          description?: string | null
          drop_rate?: number
          duration?: number | null
          effect?: Json
          id?: string
          image?: string | null
          is_active?: boolean
          name: string
          rarity?: string
          sell_price?: number
          stackable?: boolean
          tradable?: boolean
          updated_at?: string
        }
        Update: {
          buy_price?: number
          category?: string
          created_at?: string
          description?: string | null
          drop_rate?: number
          duration?: number | null
          effect?: Json
          id?: string
          image?: string | null
          is_active?: boolean
          name?: string
          rarity?: string
          sell_price?: number
          stackable?: boolean
          tradable?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      main_quests: {
        Row: {
          category: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          difficulty: string
          estimated_minutes: number
          gold_reward: number
          id: string
          is_active: boolean
          rewards: Json
          steps: Json
          title_ar: string
          title_en: string
          updated_at: string
          warning_ar: string | null
          warning_en: string | null
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          difficulty?: string
          estimated_minutes?: number
          gold_reward?: number
          id?: string
          is_active?: boolean
          rewards?: Json
          steps?: Json
          title_ar: string
          title_en: string
          updated_at?: string
          warning_ar?: string | null
          warning_en?: string | null
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          difficulty?: string
          estimated_minutes?: number
          gold_reward?: number
          id?: string
          is_active?: boolean
          rewards?: Json
          steps?: Json
          title_ar?: string
          title_en?: string
          updated_at?: string
          warning_ar?: string | null
          warning_en?: string | null
          xp_reward?: number
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
      side_items: {
        Row: {
          buy_price: number
          category: string
          created_at: string
          description: string | null
          drop_rate: number
          duration: number | null
          effect: Json
          id: string
          image: string | null
          is_active: boolean
          name: string
          rarity: string
          sell_price: number
          stackable: boolean
          tradable: boolean
          updated_at: string
        }
        Insert: {
          buy_price?: number
          category?: string
          created_at?: string
          description?: string | null
          drop_rate?: number
          duration?: number | null
          effect?: Json
          id?: string
          image?: string | null
          is_active?: boolean
          name: string
          rarity?: string
          sell_price?: number
          stackable?: boolean
          tradable?: boolean
          updated_at?: string
        }
        Update: {
          buy_price?: number
          category?: string
          created_at?: string
          description?: string | null
          drop_rate?: number
          duration?: number | null
          effect?: Json
          id?: string
          image?: string | null
          is_active?: boolean
          name?: string
          rarity?: string
          sell_price?: number
          stackable?: boolean
          tradable?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      side_quests: {
        Row: {
          category: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          difficulty: string
          estimated_minutes: number
          gold_reward: number
          id: string
          is_active: boolean
          rewards: Json
          steps: Json
          title_ar: string
          title_en: string
          updated_at: string
          warning_ar: string | null
          warning_en: string | null
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          difficulty?: string
          estimated_minutes?: number
          gold_reward?: number
          id?: string
          is_active?: boolean
          rewards?: Json
          steps?: Json
          title_ar: string
          title_en: string
          updated_at?: string
          warning_ar?: string | null
          warning_en?: string | null
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          difficulty?: string
          estimated_minutes?: number
          gold_reward?: number
          id?: string
          is_active?: boolean
          rewards?: Json
          steps?: Json
          title_ar?: string
          title_en?: string
          updated_at?: string
          warning_ar?: string | null
          warning_en?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_dashboard_stats: { Args: never; Returns: Json }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
      app_role: "super_admin" | "admin" | "moderator"
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
      app_role: ["super_admin", "admin", "moderator"],
    },
  },
} as const
