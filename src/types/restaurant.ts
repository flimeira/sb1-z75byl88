export interface Restaurant {
  id: string;
  nome: string;
  imagem: string;
  rating: number;
  tipo: string;
  deliveryTime: string;
  delivery_fee: number;
  delivery_radius: number;
  idtipo: string;
  street: string;
  number: string;
  neighborhood: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
}