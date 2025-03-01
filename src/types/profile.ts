export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  birth_date: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}