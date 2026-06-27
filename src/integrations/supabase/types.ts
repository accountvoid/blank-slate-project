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
      ad_events: {
        Row: {
          ad_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["ad_event_type"]
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["ad_event_type"]
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["ad_event_type"]
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_events_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_packages: {
        Row: {
          created_at: string
          gold_reward: number
          id: string
          is_active: boolean
          max_duration_days: number
          max_impressions: number | null
          max_sponsored_missions: number
          name: string
          price_usd: number
          priority_boost: number
          slug: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          gold_reward?: number
          id?: string
          is_active?: boolean
          max_duration_days?: number
          max_impressions?: number | null
          max_sponsored_missions?: number
          name: string
          price_usd?: number
          priority_boost?: number
          slug: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          gold_reward?: number
          id?: string
          is_active?: boolean
          max_duration_days?: number
          max_impressions?: number | null
          max_sponsored_missions?: number
          name?: string
          price_usd?: number
          priority_boost?: number
          slug?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      ads: {
        Row: {
          advertiser_logo_url: string | null
          advertiser_name: string | null
          banner_size: Database["public"]["Enums"]["ad_banner_size"] | null
          button_text: string | null
          category: Database["public"]["Enums"]["ad_category"] | null
          clicks_count: number
          completion_requirements: Json
          created_at: string
          description: string | null
          destination_url: string | null
          difficulty: string | null
          display_order: number
          end_at: string | null
          gold_reward: number
          id: string
          image_url: string | null
          internal_route: string | null
          last_clicked_at: string | null
          last_viewed_at: string | null
          mission_completions_count: number
          mission_duration_minutes: number | null
          mission_starts_count: number
          package_id: string | null
          placement: string
          priority: number
          repeat_interval_hours: number | null
          reward_claims_count: number
          reward_multiplier: number
          skip_after_seconds: number | null
          sponsor_logo_url: string | null
          sponsor_name: string | null
          start_at: string
          status: Database["public"]["Enums"]["ad_status"]
          subtitle: string | null
          title: string
          total_gold_granted: number
          total_xp_granted: number
          type: Database["public"]["Enums"]["ad_type"]
          unique_views_count: number
          updated_at: string
          video_thumbnail_url: string | null
          video_url: string | null
          views_count: number
          xp_reward: number
        }
        Insert: {
          advertiser_logo_url?: string | null
          advertiser_name?: string | null
          banner_size?: Database["public"]["Enums"]["ad_banner_size"] | null
          button_text?: string | null
          category?: Database["public"]["Enums"]["ad_category"] | null
          clicks_count?: number
          completion_requirements?: Json
          created_at?: string
          description?: string | null
          destination_url?: string | null
          difficulty?: string | null
          display_order?: number
          end_at?: string | null
          gold_reward?: number
          id?: string
          image_url?: string | null
          internal_route?: string | null
          last_clicked_at?: string | null
          last_viewed_at?: string | null
          mission_completions_count?: number
          mission_duration_minutes?: number | null
          mission_starts_count?: number
          package_id?: string | null
          placement?: string
          priority?: number
          repeat_interval_hours?: number | null
          reward_claims_count?: number
          reward_multiplier?: number
          skip_after_seconds?: number | null
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["ad_status"]
          subtitle?: string | null
          title: string
          total_gold_granted?: number
          total_xp_granted?: number
          type: Database["public"]["Enums"]["ad_type"]
          unique_views_count?: number
          updated_at?: string
          video_thumbnail_url?: string | null
          video_url?: string | null
          views_count?: number
          xp_reward?: number
        }
        Update: {
          advertiser_logo_url?: string | null
          advertiser_name?: string | null
          banner_size?: Database["public"]["Enums"]["ad_banner_size"] | null
          button_text?: string | null
          category?: Database["public"]["Enums"]["ad_category"] | null
          clicks_count?: number
          completion_requirements?: Json
          created_at?: string
          description?: string | null
          destination_url?: string | null
          difficulty?: string | null
          display_order?: number
          end_at?: string | null
          gold_reward?: number
          id?: string
          image_url?: string | null
          internal_route?: string | null
          last_clicked_at?: string | null
          last_viewed_at?: string | null
          mission_completions_count?: number
          mission_duration_minutes?: number | null
          mission_starts_count?: number
          package_id?: string | null
          placement?: string
          priority?: number
          repeat_interval_hours?: number | null
          reward_claims_count?: number
          reward_multiplier?: number
          skip_after_seconds?: number | null
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["ad_status"]
          subtitle?: string | null
          title?: string
          total_gold_granted?: number
          total_xp_granted?: number
          type?: Database["public"]["Enums"]["ad_type"]
          unique_views_count?: number
          updated_at?: string
          video_thumbnail_url?: string | null
          video_url?: string | null
          views_count?: number
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "ads_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "ad_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_usd: number
          created_at: string
          credited: boolean
          credited_at: string | null
          gold_amount: number
          id: string
          nowpayments_invoice_id: string | null
          nowpayments_payment_id: string | null
          pay_address: string | null
          pay_amount: number | null
          pay_currency: string
          provider: string
          raw_payload: Json
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          credited?: boolean
          credited_at?: string | null
          gold_amount: number
          id?: string
          nowpayments_invoice_id?: string | null
          nowpayments_payment_id?: string | null
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency: string
          provider?: string
          raw_payload?: Json
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          credited?: boolean
          credited_at?: string | null
          gold_amount?: number
          id?: string
          nowpayments_invoice_id?: string | null
          nowpayments_payment_id?: string | null
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency?: string
          provider?: string
          raw_payload?: Json
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_payment_gold: {
        Args: { payment_id: string }
        Returns: {
          amount_usd: number
          created_at: string
          credited: boolean
          credited_at: string | null
          gold_amount: number
          id: string
          nowpayments_invoice_id: string | null
          nowpayments_payment_id: string | null
          pay_address: string | null
          pay_amount: number | null
          pay_currency: string
          provider: string
          raw_payload: Json
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
    }
    Enums: {
      ad_banner_size: "horizontal" | "square" | "full_width"
      ad_category: "strength" | "mind" | "spirit" | "agility"
      ad_event_type: "view" | "click" | "start" | "complete" | "claim"
      ad_status: "active" | "inactive" | "archived"
      ad_type: "banner" | "video" | "sponsored_mission"
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
      ad_banner_size: ["horizontal", "square", "full_width"],
      ad_category: ["strength", "mind", "spirit", "agility"],
      ad_event_type: ["view", "click", "start", "complete", "claim"],
      ad_status: ["active", "inactive", "archived"],
      ad_type: ["banner", "video", "sponsored_mission"],
    },
  },
} as const
