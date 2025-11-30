
export type Category = {
  id: number;
  nama: string;
  urutan?: number;
  support_additional?: boolean;
  support_dimsum_additional?: boolean;
};

export type Discount = {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  is_active: boolean;
  valid_from?: string;
  valid_to?: string;
};

export type Additional = {
  id: number;
  nama: string;
  harga: number;
  is_active: boolean;
};

    
