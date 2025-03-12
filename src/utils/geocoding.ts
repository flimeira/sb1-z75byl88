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
          'User-Agent': 'AmericanaFood/1.0'
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

export async function getCoordinatesFromAddress(address: string, city: string, state: string, country: string = 'Brasil') {
  const apiKey = process.env.NEXT_PUBLIC_BING_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Bing Maps API key não configurada');
  }

  const addressString = `${address}, ${city}, ${state}, ${country}`;
  const encodedAddress = encodeURIComponent(addressString);
  
  const response = await fetch(
    `https://dev.virtualearth.net/REST/v1/Locations?q=${encodedAddress}&key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error('Erro ao buscar coordenadas do endereço');
  }

  const data = await response.json();

  if (data.resourceSets && data.resourceSets[0]?.resources?.[0]?.point?.coordinates) {
    const [longitude, latitude] = data.resourceSets[0].resources[0].point.coordinates;
    return {
      latitude,
      longitude
    };
  }

  throw new Error('Endereço não encontrado');
}