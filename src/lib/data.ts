

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
  kategori_struk?: 'makanan' | 'minuman';
  stok: number;
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
  identifier: string;
  location_area: string | null;
  order_type: 'dine-in' | 'take-away';
  subtotal: number;
  discount: number;
  total_amount: number;
  cash_received: number;
  change_amount: number;
  payment_method: 'cash' | 'qris' | null;
  bank_qris?: string | null;
  status: 'pending' | 'process' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  detail_pesanans?: OrderItem[];
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

    