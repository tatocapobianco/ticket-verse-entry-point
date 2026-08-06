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
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      courtesy_links: {
        Row: {
          code: string
          created_at: string
          created_by: string
          event_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          label: string | null
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
          label?: string | null
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
          label?: string | null
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
      event_rrpps: {
        Row: {
          active: boolean
          created_at: string
          event_id: string
          id: string
          link_code: string
          link_type: string
          max_courtesies: number
          max_tickets: number | null
          rrpp_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          event_id: string
          id?: string
          link_code?: string
          link_type?: string
          max_courtesies?: number
          max_tickets?: number | null
          rrpp_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          event_id?: string
          id?: string
          link_code?: string
          link_type?: string
          max_courtesies?: number
          max_tickets?: number | null
          rrpp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rrpps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rrpps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rrpps_rrpp_id_fkey"
            columns: ["rrpp_id"]
            isOneToOne: false
            referencedRelation: "rrpps"
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
          productora_id: string | null
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
          productora_id?: string | null
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
          productora_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_productora_id_fkey"
            columns: ["productora_id"]
            isOneToOne: false
            referencedRelation: "productoras"
            referencedColumns: ["id"]
          },
        ]
      }
      productoras: {
        Row: {
          created_at: string
          descripcion: string | null
          email_contacto: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          nombre: string
          slug: string
          suspended: boolean
          suspended_at: string | null
          suspended_reason: string | null
          telefono_contacto: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          email_contacto?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nombre: string
          slug: string
          suspended?: boolean
          suspended_at?: string | null
          suspended_reason?: string | null
          telefono_contacto?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          email_contacto?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nombre?: string
          slug?: string
          suspended?: boolean
          suspended_at?: string | null
          suspended_reason?: string | null
          telefono_contacto?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          dni: string | null
          email: string | null
          full_name: string | null
          id: string
          mp_access_token: string | null
          mp_connected_at: string | null
          mp_public_key: string | null
          mp_refresh_token: string | null
          mp_user_id: string | null
          organization_name: string | null
          suspended: boolean
          suspended_at: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          mp_access_token?: string | null
          mp_connected_at?: string | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          mp_user_id?: string | null
          organization_name?: string | null
          suspended?: boolean
          suspended_at?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          mp_access_token?: string | null
          mp_connected_at?: string | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          mp_user_id?: string | null
          organization_name?: string | null
          suspended?: boolean
          suspended_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_attempts: {
        Row: {
          created_at: string
          id: string
          ip: string | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: string | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string | null
          success?: boolean
          user_id?: string | null
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
      rrpp_sales: {
        Row: {
          created_at: string
          event_rrpp_id: string
          id: string
          purchase_id: string | null
        }
        Insert: {
          created_at?: string
          event_rrpp_id: string
          id?: string
          purchase_id?: string | null
        }
        Update: {
          created_at?: string
          event_rrpp_id?: string
          id?: string
          purchase_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrpp_sales_event_rrpp_id_fkey"
            columns: ["event_rrpp_id"]
            isOneToOne: false
            referencedRelation: "event_rrpps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrpp_sales_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      rrpps: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          name: string
          organizer_id: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          organizer_id: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          organizer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrpps_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          commission: number
          created_at: string
          event_id: string | null
          gross: number
          id: string
          net: number
          note: string | null
          paid_at: string | null
          paid_by: string | null
          productora_id: string
          status: string
          updated_at: string
        }
        Insert: {
          commission?: number
          created_at?: string
          event_id?: string | null
          gross?: number
          id?: string
          net?: number
          note?: string | null
          paid_at?: string | null
          paid_by?: string | null
          productora_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          commission?: number
          created_at?: string
          event_id?: string | null
          gross?: number
          id?: string
          net?: number
          note?: string | null
          paid_at?: string | null
          paid_by?: string | null
          productora_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_productora_id_fkey"
            columns: ["productora_id"]
            isOneToOne: false
            referencedRelation: "productoras"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          quantity: number
          status: string
          ticket_type_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          quantity: number
          status?: string
          ticket_type_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          quantity?: number
          status?: string
          ticket_type_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types_public"
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
          requires_auth_code: boolean
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
          requires_auth_code?: boolean
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
          requires_auth_code?: boolean
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
      admin_audit: {
        Args: { _limit?: number; _offset?: number }
        Returns: Json
      }
      admin_delete_event: { Args: { _id: string }; Returns: undefined }
      admin_event_support: { Args: { _event_id: string }; Returns: Json }
      admin_events: {
        Args: { _productora_id?: string; _search?: string }
        Returns: Json
      }
      admin_failed_payments: { Args: { _limit?: number }; Returns: Json }
      admin_global_search: { Args: { _q: string }; Returns: Json }
      admin_grant_admin: { Args: { _email: string }; Returns: Json }
      admin_list_admins: { Args: never; Returns: Json }
      admin_log: {
        Args: {
          _action: string
          _details?: Json
          _entity_id: string
          _entity_label: string
          _entity_type: string
        }
        Returns: undefined
      }
      admin_mark_settlement: {
        Args: {
          _event_id: string
          _note?: string
          _productora_id: string
          _status: string
        }
        Returns: undefined
      }
      admin_metrics: {
        Args: { _from: string; _granularity?: string; _to: string }
        Returns: Json
      }
      admin_productoras: { Args: { _search?: string }; Returns: Json }
      admin_purchase_detail: { Args: { _purchase_id: string }; Returns: Json }
      admin_require: { Args: never; Returns: undefined }
      admin_revoke_admin: { Args: { _user_id: string }; Returns: Json }
      admin_revoke_courtesy: { Args: { _link_id: string }; Returns: undefined }
      admin_set_productora_suspended: {
        Args: { _id: string; _reason?: string; _suspended: boolean }
        Returns: undefined
      }
      admin_set_rrpp_active: {
        Args: { _active: boolean; _event_rrpp_id: string }
        Returns: undefined
      }
      admin_set_ticket_used: {
        Args: { _ticket_id: string; _used: boolean }
        Returns: undefined
      }
      admin_set_user_suspended: {
        Args: { _id: string; _suspended: boolean }
        Returns: undefined
      }
      admin_settlements: {
        Args: { _event_id?: string; _from?: string; _to?: string }
        Returns: Json
      }
      admin_transactions: {
        Args: {
          _event_id?: string
          _from?: string
          _limit?: number
          _offset?: number
          _productora_id?: string
          _search?: string
          _status?: string
          _to?: string
        }
        Returns: Json
      }
      admin_update_event: {
        Args: { _id: string; _patch: Json }
        Returns: undefined
      }
      admin_update_productora: {
        Args: { _id: string; _patch: Json }
        Returns: undefined
      }
      admin_user_tickets: { Args: { _user_id: string }; Returns: Json }
      admin_users: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: Json
      }
      check_purchase_rate_limit: {
        Args: { _ip: string; _user_id: string }
        Returns: {
          allowed: boolean
          reason: string
        }[]
      }
      email_for_dni: { Args: { _dni: string }; Returns: string }
      get_courtesy_link_by_code: {
        Args: { _code: string }
        Returns: {
          event_id: string
          expires_at: string
          id: string
          is_active: boolean
          max_uses: number
          ticket_type_id: string
          uses_count: number
        }[]
      }
      get_event_access_key: { Args: { _event_id: string }; Returns: string }
      get_event_rrpp_by_code: {
        Args: { _code: string }
        Returns: {
          active: boolean
          event_id: string
          id: string
          link_type: string
          rrpp_id: string
        }[]
      }
      get_my_productora: {
        Args: never
        Returns: {
          descripcion: string
          email_contacto: string
          id: string
          instagram: string
          logo_url: string
          nombre: string
          slug: string
          telefono_contacto: string
        }[]
      }
      get_ticket_type_auth_code: {
        Args: { _ticket_type_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      productora_nombre_disponible: {
        Args: { _nombre: string }
        Returns: boolean
      }
      release_expired_reservations: { Args: never; Returns: undefined }
      reserve_stock: {
        Args: { _quantity: number; _ticket_type_id: string }
        Returns: {
          expires_at: string
          reservation_id: string
        }[]
      }
      self_assign_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      validate_and_scan_ticket: {
        Args: { _access_key: string; _event_number: string; _qr_code: string }
        Returns: {
          attendee: string
          event_name: string
          result: string
          ticket_id: string
          ticket_type_name: string
        }[]
      }
      verify_ticket_auth_code: {
        Args: { _code: string; _ticket_type_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "buyer" | "organizer" | "scanner" | "admin" | "super_admin"
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
      app_role: ["buyer", "organizer", "scanner", "admin", "super_admin"],
    },
  },
} as const
