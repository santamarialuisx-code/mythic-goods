/**
 * Hand-written mirror of `supabase/migrations/0001_init.sql`.
 *
 * Once the project is linked to a real Supabase instance you can replace this
 * file with the generated one:
 *
 *   npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          position: number;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          position?: number;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          position?: number;
          slug?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          line_total_cents: number;
          order_id: string;
          product_name: string;
          qty: number;
          unit_price_cents: number;
          variant_id: string | null;
          variant_label: string | null;
        };
        Insert: {
          id?: string;
          line_total_cents: number;
          order_id: string;
          product_name: string;
          qty: number;
          unit_price_cents: number;
          variant_id?: string | null;
          variant_label?: string | null;
        };
        Update: {
          id?: string;
          line_total_cents?: number;
          order_id?: string;
          product_name?: string;
          qty?: number;
          unit_price_cents?: number;
          variant_id?: string | null;
          variant_label?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          code: string;
          created_at: string;
          currency: string;
          customer_email: string | null;
          customer_name: string;
          customer_phone: string;
          id: string;
          notes: string | null;
          shipping_address: string | null;
          shipping_cents: number;
          status: OrderStatus;
          subtotal_cents: number;
          total_cents: number;
          updated_at: string;
        };
        Insert: {
          code?: string;
          created_at?: string;
          currency?: string;
          customer_email?: string | null;
          customer_name: string;
          customer_phone: string;
          id?: string;
          notes?: string | null;
          shipping_address?: string | null;
          shipping_cents?: number;
          status?: OrderStatus;
          subtotal_cents: number;
          total_cents: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          currency?: string;
          customer_email?: string | null;
          customer_name?: string;
          customer_phone?: string;
          id?: string;
          notes?: string | null;
          shipping_address?: string | null;
          shipping_cents?: number;
          status?: OrderStatus;
          subtotal_cents?: number;
          total_cents?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          alt: string | null;
          id: string;
          position: number;
          product_id: string;
          storage_path: string;
        };
        Insert: {
          alt?: string | null;
          id?: string;
          position?: number;
          product_id: string;
          storage_path: string;
        };
        Update: {
          alt?: string | null;
          id?: string;
          position?: number;
          product_id?: string;
          storage_path?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          color: string | null;
          id: string;
          position: number;
          product_id: string;
          size: string | null;
          sku: string | null;
          stock: number;
        };
        Insert: {
          color?: string | null;
          id?: string;
          position?: number;
          product_id: string;
          size?: string | null;
          sku?: string | null;
          stock?: number;
        };
        Update: {
          color?: string | null;
          id?: string;
          position?: number;
          product_id?: string;
          size?: string | null;
          sku?: string | null;
          stock?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          active: boolean;
          category_id: string | null;
          compare_at_cents: number | null;
          created_at: string;
          currency: string;
          description: string | null;
          id: string;
          name: string;
          price_cents: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          category_id?: string | null;
          compare_at_cents?: number | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          name: string;
          price_cents: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          category_id?: string | null;
          compare_at_cents?: number | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          name?: string;
          price_cents?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { order_status: OrderStatus };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

/** Row type helper: `TableRow<"products">` */
export type TableRow<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

/** Insert type helper: `TableInsert<"products">` */
export type TableInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

/** Update type helper: `TableUpdate<"products">` */
export type TableUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
