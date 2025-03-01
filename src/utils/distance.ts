import { Profile } from '../types/profile';
import { Restaurant } from '../types/restaurant';

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