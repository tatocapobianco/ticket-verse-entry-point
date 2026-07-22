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
      courtesy_links: {
        Row: {
          code: string
          created_at: string
          created_by: string
          event_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          ticket_type_id: string
          updated_at: string
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          event_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          ticket_type_id: string
          updated_at?: string
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          ticket_type_id?: string
          updated_at?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "courtesy_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtesy_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtesy_links_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtesy_links_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types_public"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          access_key: string
          created_at: string
          description: string | null
          event_date: string | null
          event_number: string
          event_time: string | null
          id: string
          image_url: string | null
          is_public: boolean
          location: string | null
          name: string
          organizer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          access_key: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_number: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          location?: string | null
          name: string
          organizer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          access_key?: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_number?: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          location?: string | null
          name?: string
          organizer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dni: string | null
          email: string | null
          full_name: string | null
          id: string
          organization_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dni?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          organization_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dni?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          organization_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          created_at: string
          id: string
          purchase_id: string
          quantity: number
          ticket_type_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          purchase_id: string
          quantity: number
          ticket_type_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          purchase_id?: string
          quantity?: number
          ticket_type_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types_public"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          buyer_email: string | null
          buyer_id: string
          created_at: string
          event_id: string
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          service_fee: number
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          buyer_email?: string | null
          buyer_id: string
          created_at?: string
          event_id: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          service_fee?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          buyer_email?: string | null
          buyer_id?: string
          created_at?: string
          event_id?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          service_fee?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_scans: {
        Row: {
          event_id: string
          id: string
          qr_code: string
          result: string
          scanned_at: string
          scanner_id: string | null
          ticket_id: string | null
        }
        Insert: {
          event_id: string
          id?: string
          qr_code: string
          result: string
          scanned_at?: string
          scanner_id?: string | null
          ticket_id?: string | null
        }
        Update: {
          event_id?: string
          id?: string
          qr_code?: string
          result?: string
          scanned_at?: string
          scanner_id?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_scans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_scans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_scans_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          authorization_code: string | null
          created_at: string
          description: string | null
          event_id: string
          id: string
          is_courtesy: boolean
          name: string
          price: number
          quantity_sold: number
          quantity_total: number | null
          status: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          authorization_code?: string | null
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          is_courtesy?: boolean
          name: string
          price?: number
          quantity_sold?: number
          quantity_total?: number | null
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          authorization_code?: string | null
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          is_courtesy?: boolean
          name?: string
          price?: number
          quantity_sold?: number
          quantity_total?: number | null
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          courtesy_link_id: string | null
          created_at: string
          event_id: string
          id: string
          owner_dni: string | null
          owner_email: string | null
          owner_id: string | null
          purchase_id: string | null
          qr_code: string
          source: string
          status: string
          ticket_type_id: string
          updated_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          courtesy_link_id?: string | null
          created_at?: string
          event_id: string
          id?: string
          owner_dni?: string | null
          owner_email?: string | null
          owner_id?: string | null
          purchase_id?: string | null
          qr_code?: string
          source?: string
          status?: string
          ticket_type_id: string
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          courtesy_link_id?: string | null
          created_at?: string
          event_id?: string
          id?: string
          owner_dni?: string | null
          owner_email?: string | null
          owner_id?: string | null
          purchase_id?: string | null
          qr_code?: string
          source?: string
          status?: string
          ticket_type_id?: string
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_courtesy_link_id_fkey"
            columns: ["courtesy_link_id"]
            isOneToOne: false
            referencedRelation: "courtesy_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      events_public: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string | null
          event_number: string | null
          event_time: string | null
          id: string | null
          image_url: string | null
          is_public: boolean | null
          location: string | null
          name: string | null
          organizer_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_number?: string | null
          event_time?: string | null
          id?: string | null
          image_url?: string | null
          is_public?: boolean | null
          location?: string | null
          name?: string | null
          organizer_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_number?: string | null
          event_time?: string | null
          id?: string | null
          image_url?: string | null
          is_public?: boolean | null
          location?: string | null
          name?: string | null
          organizer_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_types_public: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string | null
          id: string | null
          name: string | null
          price: number | null
          status: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          id?: string | null
          name?: string | null
          price?: number | null
          status?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          id?: string | null
          name?: string | null
          price?: number | null
          status?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_public"
            referencedColumns: ["id"]
          },
        ]
      }
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
