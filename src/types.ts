export interface Transaction {
  id: string;
  created_at?: string;
  description: string;
  amount: number;
  date: string;
  transaction_type: string;
  category_id?: string | null;
  category_name?: string | null;
  paid_by_user_id?: string | null;
  paid_by_user_name?: string | null;
  split_type?: string | null;
  paid_to_user_id?: string | null;
  paid_to_user_name?: string | null;
  reimburses_transaction_id?: string | null;
  // For client-side state
  is_new?: boolean;
}

export interface Category {
  id: string;
  name: string;
  image_url?: string;
}

export interface Sector {
  id: string;
  name: string;
  category_ids: string[];
}
