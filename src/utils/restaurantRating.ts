import { supabase } from '../lib/supabase';

export async function updateRestaurantRating(restaurantId: string) {
  try {
    // Buscar todas as avaliações do restaurante
    const { data: reviews, error: reviewsError } = await supabase
      .from('order_reviews')
      .select('rating')
      .eq('restaurant_id', restaurantId)
      .not('rating', 'is', null);

    if (reviewsError) throw reviewsError;

    if (!reviews || reviews.length === 0) {
      // Se não houver avaliações, define o rating como 0
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ rating: 0 })
        .eq('id', restaurantId);

      if (updateError) throw updateError;
      return;
    }

    // Calcular a média
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = Number((sum / reviews.length).toFixed(1));

    // Atualizar o rating do restaurante
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ rating: average })
      .eq('id', restaurantId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating restaurant rating:', error);
    throw error;
  }
} 