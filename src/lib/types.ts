
export type Category = {
  id: number;
  name: string;
  is_available: boolean;
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
  name: string;
  price: number;
  is_available: boolean;
};

export type Variant = {
  id: number;
  name: string;
  price: number;
  is_available: boolean;
}

export type Worker = {
    id: number;
    nip: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    is_active: boolean;
    password?: string;
};

export type Attendance = {
    id: number;
    worker_id: number;
    worker_name: string;
    clock_in_time: string | null;
    clock_out_time: string | null;
    clock_in_photo_url: string | null;
    clock_out_photo_url: string | null;
};
