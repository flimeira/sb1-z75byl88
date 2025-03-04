import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface FavoriteRestaurant {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  createdAt: string;
}

interface FavoriteRestaurantsContextType {
  favoriteRestaurants: FavoriteRestaurant[];
  isFavorite: (restaurantId: string) => boolean;
  toggleFavorite: (restaurant: { id: string; name: string; image: string }) => Promise<void>;
}

const FavoriteRestaurantsContext = createContext<FavoriteRestaurantsContextType | undefined>(undefined);

export function FavoriteRestaurantsProvider({ children }: { children: ReactNode }) {
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<FavoriteRestaurant[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFavoriteRestaurants();
    }
  }, [user]);

  const fetchFavoriteRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('favorite_restaurants')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedFavorites = data.map(favorite => ({
        id: favorite.id,
        restaurantId: favorite.restaurant_id,
        restaurantName: favorite.restaurant_name,
        restaurantImage: favorite.restaurant_image,
        createdAt: favorite.created_at,
      }));

      setFavoriteRestaurants(formattedFavorites);
    } catch (error) {
      console.error('Error fetching favorite restaurants:', error);
    }
  };

  const isFavorite = (restaurantId: string) => {
    return favoriteRestaurants.some(favorite => favorite.restaurantId === restaurantId);
  };

  const toggleFavorite = async (restaurant: { id: string; name: string; image: string }) => {
    try {
      const existingFavorite = favoriteRestaurants.find(
        favorite => favorite.restaurantId === restaurant.id
      );

      if (existingFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from('favorite_restaurants')
          .delete()
          .eq('id', existingFavorite.id);

        if (error) throw error;

        setFavoriteRestaurants(prev =>
          prev.filter(favorite => favorite.id !== existingFavorite.id)
        );
      } else {
        // Add favorite
        const { data, error } = await supabase
          .from('favorite_restaurants')
          .insert([
            {
              user_id: user?.id,
              restaurant_id: restaurant.id,
              restaurant_name: restaurant.name,
              restaurant_image: restaurant.image,
            }
          ])
          .select()
          .single();

        if (error) throw error;

        const newFavorite: FavoriteRestaurant = {
          id: data.id,
          restaurantId: data.restaurant_id,
          restaurantName: data.restaurant_name,
          restaurantImage: data.restaurant_image,
          createdAt: data.created_at,
        };

        setFavoriteRestaurants(prev => [newFavorite, ...prev]);
      }
    } catch (error) {
      console.error('Error toggling favorite restaurant:', error);
    }
  };

  return (
    <FavoriteRestaurantsContext.Provider
      value={{
        favoriteRestaurants,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoriteRestaurantsContext.Provider>
  );
}

export function useFavoriteRestaurants() {
  const context = useContext(FavoriteRestaurantsContext);
  if (context === undefined) {
    throw new Error('useFavoriteRestaurants must be used within a FavoriteRestaurantsProvider');
  }
  return context;
} 