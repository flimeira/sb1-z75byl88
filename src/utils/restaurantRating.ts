import { supabase } from '../lib/supabase';

export async function updateRestaurantRating(restaurantId: string) {
  try {
    console.log('Updating rating for restaurant:', restaurantId);

    if (!restaurantId) {
      console.error('Restaurant ID is undefined or null');
      throw new Error('Restaurant ID is required');
    }

    // Primeiro, verificar se o restaurante existe e seu rating atual
    const { data: currentRestaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, rating')
      .eq('id', restaurantId)
      .single();

    if (restaurantError) {
      console.error('Error checking restaurant:', restaurantError);
      throw restaurantError;
    }

    if (!currentRestaurant) {
      console.error('Restaurant not found with ID:', restaurantId);
      throw new Error('Restaurant not found');
    }

    console.log('Current restaurant data:', currentRestaurant);

    // Buscar todas as avaliações dos pedidos do restaurante
    const { data: reviews, error: reviewsError } = await supabase
      .from('order_reviews')
      .select('rating')
      .in('order_id', (
        supabase
          .from('orders')
          .select('id')
          .eq('restaurant_id', restaurantId)
      ))
      .not('rating', 'is', null);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      throw reviewsError;
    }

    console.log('Found reviews:', reviews);

    if (!reviews || reviews.length === 0) {
      console.log('No reviews found, setting rating to 0');
      // Se não houver avaliações, define o rating como 0
      const { data: zeroUpdateData, error: updateError } = await supabase
        .from('restaurants')
        .update({ rating: 0 })
        .eq('id', restaurantId)
        .select('id, rating')
        .single();

      if (updateError) {
        console.error('Error updating restaurant rating to 0:', updateError);
        throw updateError;
      }

      console.log('Zero rating update response:', zeroUpdateData);
      return;
    }

    // Calcular a média
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = Number((sum / reviews.length).toFixed(1));

    console.log('Calculated average:', average);

    // Atualizar o rating do restaurante
    const { data: updateData, error: updateError } = await supabase
      .from('restaurants')
      .update({ rating: average })
      .eq('id', restaurantId)
      .select('id, rating')
      .single();

    if (updateError) {
      console.error('Error updating restaurant rating:', updateError);
      throw updateError;
    }

    console.log('Update response:', updateData);

    // Verificar se a atualização foi bem sucedida
    const { data: verifyData, error: verifyError } = await supabase
      .from('restaurants')
      .select('id, rating')
      .eq('id', restaurantId)
      .single();

    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      throw verifyError;
    }

    console.log('Verification after update:', verifyData);
    console.log('Successfully updated restaurant rating to:', average);
  } catch (error) {
    console.error('Error in updateRestaurantRating:', error);
    throw error;
  }
} 