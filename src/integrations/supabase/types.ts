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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          detail: Json | null
          entity: string
          entity_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          active: boolean
          address: string | null
          code: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          code: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          code?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      machines: {
        Row: {
          active: boolean
          capacity_per_hour: number | null
          code: string
          created_at: string
          id: string
          name: string
          type: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity_per_hour?: number | null
          code: string
          created_at?: string
          id?: string
          name: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity_per_hour?: number | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      material_status: {
        Row: {
          created_at: string
          eta: string | null
          id: string
          material_id: string | null
          material_name: string | null
          need_qty: number
          note: string | null
          ready_qty: number
          sales_order_id: string
          status: Database["public"]["Enums"]["material_state"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          eta?: string | null
          id?: string
          material_id?: string | null
          material_name?: string | null
          need_qty?: number
          note?: string | null
          ready_qty?: number
          sales_order_id: string
          status?: Database["public"]["Enums"]["material_state"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          eta?: string | null
          id?: string
          material_id?: string | null
          material_name?: string | null
          need_qty?: number
          note?: string | null
          ready_qty?: number
          sales_order_id?: string
          status?: Database["public"]["Enums"]["material_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_status_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_status_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          body: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["note_kind"]
          sales_order_id: string | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["note_kind"]
          sales_order_id?: string | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["note_kind"]
          sales_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_logs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          log_date: string
          machine_id: string | null
          note: string | null
          qty_produced: number
          qty_reject: number
          sales_order_id: string
          shift: Database["public"]["Enums"]["shift_kind"]
          status: Database["public"]["Enums"]["log_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          log_date?: string
          machine_id?: string | null
          note?: string | null
          qty_produced?: number
          qty_reject?: number
          sales_order_id: string
          shift?: Database["public"]["Enums"]["shift_kind"]
          status?: Database["public"]["Enums"]["log_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          log_date?: string
          machine_id?: string | null
          note?: string | null
          qty_produced?: number
          qty_reject?: number
          sales_order_id?: string
          shift?: Database["public"]["Enums"]["shift_kind"]
          status?: Database["public"]["Enums"]["log_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_logs_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_plans: {
        Row: {
          created_at: string
          estimated_output: number | null
          finish_date: string | null
          id: string
          machine_id: string | null
          note: string | null
          priority_rank: number
          sales_order_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_output?: number | null
          finish_date?: string | null
          id?: string
          machine_id?: string | null
          note?: string | null
          priority_rank?: number
          sales_order_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_output?: number | null
          finish_date?: string | null
          id?: string
          machine_id?: string | null
          note?: string | null
          priority_rank?: number
          sales_order_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_plans_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_plans_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          box_type: string | null
          code: string
          created_at: string
          id: string
          name: string
          paper_material: string | null
          specification: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          box_type?: string | null
          code: string
          created_at?: string
          id?: string
          name: string
          paper_material?: string | null
          specification?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          box_type?: string | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          paper_material?: string | null
          specification?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_orders: {
        Row: {
          box_type: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_po: string | null
          delivery_date: string | null
          id: string
          note: string | null
          paper_material: string | null
          priority: Database["public"]["Enums"]["so_priority"]
          product_id: string | null
          product_name: string | null
          qty_order: number
          qty_produced: number
          qty_reject: number
          so_number: string
          specification: string | null
          status: Database["public"]["Enums"]["so_status"]
          updated_at: string
        }
        Insert: {
          box_type?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_po?: string | null
          delivery_date?: string | null
          id?: string
          note?: string | null
          paper_material?: string | null
          priority?: Database["public"]["Enums"]["so_priority"]
          product_id?: string | null
          product_name?: string | null
          qty_order?: number
          qty_produced?: number
          qty_reject?: number
          so_number: string
          specification?: string | null
          status?: Database["public"]["Enums"]["so_status"]
          updated_at?: string
        }
        Update: {
          box_type?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_po?: string | null
          delivery_date?: string | null
          id?: string
          note?: string | null
          paper_material?: string | null
          priority?: Database["public"]["Enums"]["so_priority"]
          product_id?: string | null
          product_name?: string | null
          qty_order?: number
          qty_produced?: number
          qty_reject?: number
          so_number?: string
          specification?: string | null
          status?: Database["public"]["Enums"]["so_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      [_ in never]: never
    }
    Functions: {
      can_write_production: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated_user: { Args: { _user_id: string }; Returns: boolean }
      is_super_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_user" | "production_user" | "viewer"
      log_status: "not_started" | "running" | "partial" | "completed" | "hold"
      material_state: "ready" | "partial" | "shortage" | "waiting_supplier"
      note_kind:
        | "order"
        | "material"
        | "planning"
        | "production"
        | "completion"
        | "general"
      plan_status: "scheduled" | "running" | "completed" | "hold"
      shift_kind: "shift_1" | "shift_2" | "shift_3"
      so_priority: "low" | "normal" | "high" | "urgent"
      so_status:
        | "new"
        | "waiting_material"
        | "ready_plan"
        | "planned"
        | "running"
        | "partial"
        | "completed"
        | "hold"
        | "late"
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
      app_role: ["super_user", "production_user", "viewer"],
      log_status: ["not_started", "running", "partial", "completed", "hold"],
      material_state: ["ready", "partial", "shortage", "waiting_supplier"],
      note_kind: [
        "order",
        "material",
        "planning",
        "production",
        "completion",
        "general",
      ],
      plan_status: ["scheduled", "running", "completed", "hold"],
      shift_kind: ["shift_1", "shift_2", "shift_3"],
      so_priority: ["low", "normal", "high", "urgent"],
      so_status: [
        "new",
        "waiting_material",
        "ready_plan",
        "planned",
        "running",
        "partial",
        "completed",
        "hold",
        "late",
      ],
    },
  },
} as const
