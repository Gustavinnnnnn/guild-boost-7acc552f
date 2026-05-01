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
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          ip_hash: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          affiliate_user_id: string
          commission_cents: number
          created_at: string
          deposit_amount_cents: number
          deposit_id: string | null
          id: string
          rate: number
          referred_user_id: string
          status: string
        }
        Insert: {
          affiliate_id: string
          affiliate_user_id: string
          commission_cents: number
          created_at?: string
          deposit_amount_cents: number
          deposit_id?: string | null
          id?: string
          rate: number
          referred_user_id: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          affiliate_user_id?: string
          commission_cents?: number
          created_at?: string
          deposit_amount_cents?: number
          deposit_id?: string | null
          id?: string
          rate?: number
          referred_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          affiliate_user_id: string
          created_at: string
          id: string
          referred_user_id: string
          source: string | null
          total_commission_cents: number
          total_spent_cents: number
        }
        Insert: {
          affiliate_id: string
          affiliate_user_id: string
          created_at?: string
          id?: string
          referred_user_id: string
          source?: string | null
          total_commission_cents?: number
          total_spent_cents?: number
        }
        Update: {
          affiliate_id?: string
          affiliate_user_id?: string
          created_at?: string
          id?: string
          referred_user_id?: string
          source?: string | null
          total_commission_cents?: number
          total_spent_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_withdrawals: {
        Row: {
          affiliate_id: string
          affiliate_user_id: string
          amount_cents: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          pix_key: string
          pix_key_type: string
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          affiliate_user_id: string
          amount_cents: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          pix_key: string
          pix_key_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          affiliate_user_id?: string
          amount_cents?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          pix_key?: string
          pix_key_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          available_cents: number
          code: string
          commission_rate: number
          created_at: string
          id: string
          pix_key: string | null
          pix_key_type: string | null
          total_clicks: number
          total_earned_cents: number
          total_paid_cents: number
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_cents?: number
          code: string
          commission_rate?: number
          created_at?: string
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          total_clicks?: number
          total_earned_cents?: number
          total_paid_cents?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_cents?: number
          code?: string
          commission_rate?: number
          created_at?: string
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          total_clicks?: number
          total_earned_cents?: number
          total_paid_cents?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      campaign_deliveries: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          failure_reason: string | null
          guild_id: string | null
          id: string
          recipient_discord_id: string
          status: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          failure_reason?: string | null
          guild_id?: string | null
          id?: string
          recipient_discord_id: string
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          failure_reason?: string | null
          guild_id?: string | null
          id?: string
          recipient_discord_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_deliveries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          button_label: string | null
          button_url: string | null
          created_at: string
          credits_spent: number
          embed_color: string | null
          error_message: string | null
          failed_blocked: number
          failed_deleted: number
          failed_dm_closed: number
          failed_other: number
          id: string
          image_url: string | null
          message: string
          name: string
          sent_at: string | null
          status: string
          target_category: string | null
          target_count: number
          target_niches: string[]
          title: string
          total_clicks: number
          total_delivered: number
          total_failed: number
          total_targeted: number
          updated_at: string
          user_id: string
        }
        Insert: {
          button_label?: string | null
          button_url?: string | null
          created_at?: string
          credits_spent?: number
          embed_color?: string | null
          error_message?: string | null
          failed_blocked?: number
          failed_deleted?: number
          failed_dm_closed?: number
          failed_other?: number
          id?: string
          image_url?: string | null
          message: string
          name: string
          sent_at?: string | null
          status?: string
          target_category?: string | null
          target_count?: number
          target_niches?: string[]
          title?: string
          total_clicks?: number
          total_delivered?: number
          total_failed?: number
          total_targeted?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          button_label?: string | null
          button_url?: string | null
          created_at?: string
          credits_spent?: number
          embed_color?: string | null
          error_message?: string | null
          failed_blocked?: number
          failed_deleted?: number
          failed_dm_closed?: number
          failed_other?: number
          id?: string
          image_url?: string | null
          message?: string
          name?: string
          sent_at?: string | null
          status?: string
          target_category?: string | null
          target_count?: number
          target_niches?: string[]
          title?: string
          total_clicks?: number
          total_delivered?: number
          total_failed?: number
          total_targeted?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          campaign_id: string | null
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_servers: {
        Row: {
          bot_in_server: boolean | null
          category: string | null
          created_at: string
          guild_id: string
          icon_url: string | null
          id: string
          last_synced_at: string | null
          member_count: number | null
          name: string
          niche: string | null
          owner_discord_id: string | null
          updated_at: string
        }
        Insert: {
          bot_in_server?: boolean | null
          category?: string | null
          created_at?: string
          guild_id: string
          icon_url?: string | null
          id?: string
          last_synced_at?: string | null
          member_count?: number | null
          name: string
          niche?: string | null
          owner_discord_id?: string | null
          updated_at?: string
        }
        Update: {
          bot_in_server?: boolean | null
          category?: string | null
          created_at?: string
          guild_id?: string
          icon_url?: string | null
          id?: string
          last_synced_at?: string | null
          member_count?: number | null
          name?: string
          niche?: string | null
          owner_discord_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pending_deposits: {
        Row: {
          amount_cents: number
          coins: number
          created_at: string
          expires_at: string | null
          id: string
          paid_at: string | null
          paradise_transaction_id: string | null
          qr_code: string | null
          qr_code_base64: string | null
          reference: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          coins: number
          created_at?: string
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          paradise_transaction_id?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          reference: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          coins?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          paradise_transaction_id?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          reference?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          discord_access_token: string | null
          discord_id: string | null
          discord_refresh_token: string | null
          discord_token_expires_at: string | null
          discord_username: string | null
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          discord_access_token?: string | null
          discord_id?: string | null
          discord_refresh_token?: string | null
          discord_token_expires_at?: string | null
          discord_username?: string | null
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          discord_access_token?: string | null
          discord_id?: string | null
          discord_refresh_token?: string | null
          discord_token_expires_at?: string | null
          discord_username?: string | null
          id?: string
          updated_at?: string
          username?: string
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
      bootstrap_admin_account: { Args: never; Returns: Json }
      generate_affiliate_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
