
export type MenuItem = {
  id: number; // Changed from string to number to match API
  nama: string; // Changed from name to nama
  kategori: string;
  harga: string;
  is_available: boolean;
  is_recommendation: boolean;
  description: string;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
  is_special: boolean;
  image_url: string;
  kategori_id: number;
};

export type OrderItem = {
  id: number;
  pesanan_id: number;
  menu_id: number;
  jumlah: number;
  subtotal: string;
  note: string | null;
  varian: string | null;
  additionals: any;
  dimsum_additionals: any;
  additional_price: string;
  base_price: number;
  is_locked: boolean;
  cancelled_qty: number;
  cancellation_notes: string | null;
  cancelled_at: string | null;
  jumlah_asli: number | null;
};

export type Order = {
  id: number;
  no_meja: string;
  status: string; // 'pending', 'diproses', 'selesai'
  total: string;
  created_at: string;
  note: string | null;
  updated_at: string;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  location_type: 'DINE_IN' | 'TAKEAWAY';
  pickup_time: string | null;
  discount_code: string | null;
  discount_amount: string | null;
  total_after_discount: string | null;
  processed_at: string | null;
  completed_at: string | null;
  is_hidden: boolean | null;
  archived_at: string | null;
  location_area: string | null;
  metode_pembayaran: string | null;
  bank_qris: string | null;
  is_final: boolean | null;
  detail_pesanans: OrderItem[];
};


// The following are mock data and will be replaced by API calls.
export const menuItems: any[] = [];

export const orders: any[] = [];
