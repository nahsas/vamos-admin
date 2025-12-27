
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
  checker_type: 'main' | 'bar';
  stok: number;
};

export type OrderItem = {
  id: number;
  menu_id: number;
  menu_name: string;
  menu_price: number;
  menu_base_price: number;
  category_id: number;
  variant_id: number | null;
  variant_name: string | null;
  variant_price: number;
  quantity: number;
  note: string | null;
  is_locked: boolean;
  selected_additional_id: number | null;
  selected_additional_name: string | null;
  selected_additional_price: number;
  item_unit_price: number;
  item_total_price: number;
  is_printed: boolean;
  menu?: {
    checker_type: 'main' | 'bar';
  }
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
  items?: OrderItem[];
  discount_code?: string | null;
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
