import { supabase } from '../lib/supabase';

export async function updateRestaurantRating(restaurantId: string) {
  try {
    console.log('Updating rating for restaurant:', restaurantId);

    if (!restaurantId) {
      console.error('Restaurant ID is undefined or null');
      throw new Error('Restaurant ID is required');
    }

    // Buscar todas as avaliações dos pedidos do restaurante
    const { data: reviews, error: reviewsError } = await supabase
      .from('order_reviews')
      .select(`
        rating,
        order:orders (
          restaurant_id
        )
      `)
      .eq('order.restaurant_id', restaurantId)
      .not('rating', 'is', null);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      throw reviewsError;
    }

    console.log('Found reviews:', reviews);

    if (!reviews || reviews.length === 0) {
      console.log('No reviews found, setting rating to 0');
      // Se não houver avaliações, define o rating como 0
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ rating: 0 })
        .eq('id', restaurantId);

      if (updateError) {
        console.error('Error updating restaurant rating to 0:', updateError);
        throw updateError;
      }
      return;
    }

    // Calcular a média
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = Number((sum / reviews.length).toFixed(1));

    console.log('Calculated average:', average);
  
    // Atualizar o rating do restaurante
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ rating: average })
      .eq('id', restaurantId);

    if (updateError) {
      console.error('Error updating restaurant rating:', updateError);
      throw updateError;
    }

    // Verificar o valor real na tabela após a atualização
    const { data: updatedRestaurant, error: verifyError } = await supabase
      .from('restaurants')
      .select('rating')
      .eq('id', restaurantId);

    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      throw verifyError;
    }

    if (updatedRestaurant && updatedRestaurant.length > 0) {
      console.log('Successfully updated restaurant rating. New value in database:', updatedRestaurant[0].rating);
    } else {
      console.error('Could not verify the update. Restaurant not found after update.');
    }
  } catch (error) {
    console.error('Error in updateRestaurantRating:', error);
    throw error;
  }
} 