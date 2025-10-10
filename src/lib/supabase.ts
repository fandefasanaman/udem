import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'client' | 'admin';
export type FormationLevel = 'beginner' | 'intermediate' | 'advanced';
export type FormationStatus = 'active' | 'inactive';
export type OrderStatus = 'pending' | 'validated' | 'rejected';
export type PaymentMethod = 'mvola' | 'orange';

export interface Profile {
  id: string;
  name: string;
  phone: string;
  address: string;
  role: UserRole;
  created_at: string;
  last_login: string;
}

export interface Formation {
  id: string;
  title: string;
  category: string;
  description: string;
  description_long: string;
  price: number;
  image_url: string;
  duration: string;
  level: FormationLevel;
  drive_file_id: string;
  syllabus: string[];
  status: FormationStatus;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderFormation {
  formation_id: string;
  title: string;
  price: number;
  drive_link?: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  formations: OrderFormation[];
  total_price: number;
  payment_method: PaymentMethod;
  proof_image_url: string;
  status: OrderStatus;
  rejection_reason: string;
  validated_by: string | null;
  validated_at: string | null;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
}
