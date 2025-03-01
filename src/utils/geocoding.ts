import { Profile } from '../types/profile';

interface NominatimResponse {
  lat: string;
  lon: string;
}

export async function geocodeAddress(profile: Profile): Promise<{ latitude: number; longitude: number } | null> {
  if (!profile.street || !profile.number || !profile.city || !profile.state) {
    return null;
  }

  const address = `${profile.street}, ${profile.number}, ${profile.city}, ${profile.state}`;
  const query = encodeURIComponent(address);

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      {
        headers: {
          'User-Agent': 'FoodDelivery/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json() as NominatimResponse[];
    
    if (data.length === 0) {
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon)
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}