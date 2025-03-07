import { Profile } from '../types/profile';
import { Restaurant } from '../types/restaurant';
import { supabase } from '../lib/supabase';

interface Coordinates {
  lat: number;
  lon: number;
}

// Haversine formula to calculate distance between two points on Earth
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lon - coord1.lon);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  return Number(distance.toFixed(2));
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate distance between restaurant and user profile
export function calculateRestaurantDistance(restaurant: Restaurant, profile: Profile): number | null {
  if (!restaurant.latitude || !restaurant.longitude || !profile.latitude || !profile.longitude) {
    return null;
  }

  const restaurantCoords: Coordinates = {
    lat: restaurant.latitude,
    lon: restaurant.longitude
  };

  const profileCoords: Coordinates = {
    lat: profile.latitude,
    lon: profile.longitude
  };

  return calculateDistance(restaurantCoords, profileCoords);
}

// Check if restaurant delivers to user's location
export function isWithinDeliveryRadius(restaurant: Restaurant, profile: Profile): boolean {
  const distance = calculateRestaurantDistance(restaurant, profile);
  if (distance === null) return false;
  return distance <= restaurant.delivery_radius;
}

// Calculate distance between restaurant and user's default address
export async function calculateRestaurantDistanceWithDefaultAddress(restaurant: Restaurant, userId: string): Promise<number | null> {
  try {
    console.log('Calculando distância para restaurante:', {
      restaurante: {
        id: restaurant.id,
        nome: restaurant.nome,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude
      }
    });

    // Get user's default address
    const { data: defaultAddress, error } = await supabase
      .from('user_addresses')
      .select('latitude, longitude, street, number, neighborhood, city')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      console.error('Erro ao buscar endereço padrão:', error);
      return null;
    }

    if (!defaultAddress) {
      console.log('Endereço padrão não encontrado para o usuário:', userId);
      return null;
    }

    console.log('Endereço padrão encontrado:', defaultAddress);

    if (!restaurant.latitude || !restaurant.longitude || !defaultAddress.latitude || !defaultAddress.longitude) {
      console.log('Coordenadas faltando:', {
        restaurante: {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude
        },
        endereco: {
          latitude: defaultAddress.latitude,
          longitude: defaultAddress.longitude
        }
      });
      return null;
    }

    const restaurantCoords: Coordinates = {
      lat: restaurant.latitude,
      lon: restaurant.longitude
    };

    const addressCoords: Coordinates = {
      lat: defaultAddress.latitude,
      lon: defaultAddress.longitude
    };

    const distance = calculateDistance(restaurantCoords, addressCoords);
    console.log('Distância calculada:', {
      restaurante: restaurant.nome,
      endereco: `${defaultAddress.street}, ${defaultAddress.number}`,
      distancia: distance
    });

    return distance;
  } catch (error) {
    console.error('Erro ao calcular distância com endereço padrão:', error);
    return null;
  }
}

export async function isWithinDeliveryRadiusWithDefaultAddress(restaurant: Restaurant, userId: string): Promise<boolean> {
  console.log('Verificando raio de entrega para:', {
    restaurante: restaurant.nome,
    raio_entrega: restaurant.delivery_radius
  });

  const distance = await calculateRestaurantDistanceWithDefaultAddress(restaurant, userId);
  
  if (distance === null) {
    console.log('Não foi possível calcular a distância para:', restaurant.nome);
    return false;
  }

  const isInRange = distance <= restaurant.delivery_radius;
  console.log('Resultado da verificação:', {
    restaurante: restaurant.nome,
    distancia: distance,
    raio_entrega: restaurant.delivery_radius,
    dentro_do_raio: isInRange
  });

  return isInRange;
}