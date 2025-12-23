

export type MenuItem = {
  id: number;
  name: string;
  price: string;
  image: string;
  description: string;
  is_available: boolean;
  is_best_seller: boolean;
  category_id: number;
  created_at: string;
  updated_at: string;
  variant_ids?: number[];
  additional_ids?: number[];
  variants?: { id: number; name: string; price: number; is_available: boolean }[];
  additionals?: { id: number; name: string; price: number; is_available: boolean }[];
};

export type OrderItem = {
  id: number;
  pesanan_id: number;
  menu_id: number;
  jumlah: number;
  subtotal: string;
  note: string | null;
  varian: string | null;
  additionals: { [key: string]: boolean } | null;
  dimsum_additionals: { [key: string]: boolean } | null;
  additional_price: string;
  base_price: number;
  is_locked: boolean;
  cancelled_qty: number;
  cancellation_notes: string | null;
  cancelled_at: string | null;
  jumlah_asli: number | null;
  printed: number; // 0 for false, 1 for true
};

export type Order = {
  id: number;
  no_meja: string;
  status: string; // 'pending', 'diproses', 'selesai', 'cancelled'
  total: string;
  created_at: string;
  note: string | null;
  updated_at: string;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  location_type: 'DINE-IN' | 'TAKEAWAY';
  pickup_time: string | null;
  discount_code: string | null;
  discount_amount: number | null;
  total_after_discount: number | null;
  processed_at: string | null;
  completed_at: string | null;
  is_hidden: boolean | null;
  archived_at: string | null;
  location_area: string | null;
  metode_pembayaran: 'cash' | 'qris' | null;
  bank_qris: string | null;
  is_final: boolean | null;
  detail_pesanans: OrderItem[];
};

export type Additional = {
    id: number;
    name: string;
    price: number;
    is_available: boolean;
    created_at: string;
};

export type Struk = {
  id: number;
  pesanan_id: number;
  total: number;
  dibayar: number;
  kembalian: number;
  created_at: string;
}


// The following are mock data and will be replaced by API calls.
export const menuItems: any[] = [];

export const orders: any[] = [];

    
