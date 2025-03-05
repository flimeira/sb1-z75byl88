import { supabase } from '../lib/supabase';

export async function updateRestaurantRating(restaurantId: string) {
  try {
    console.log('Updating rating for restaurant:', restaurantId);

    // Buscar todas as avaliações dos pedidos do restaurante
    const { data: reviews, error: reviewsError } = await supabase
      .from('order_reviews')
      .select(`
        rating,
        order:orders!order_reviews_order_id_fkey (
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

    console.log('Successfully updated restaurant rating to:', average);
  } catch (error) {
    console.error('Error in updateRestaurantRating:', error);
    throw error;
  }
} 