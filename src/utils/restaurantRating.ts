import { supabase } from '../lib/supabase';

export async function updateRestaurantRating(restaurantId: string) {
  try {
    if (!restaurantId) {
      console.error('Restaurant ID is undefined or null');
      throw new Error('Restaurant ID is required');
    }

    // Primeiro, buscar todos os IDs dos pedidos do restaurante
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('restaurant_id', restaurantId);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      return;
    }

    const orderIds = orders.map(order => order.id);

    // Agora buscar as avaliações usando os IDs dos pedidos
    const { data: reviews, error: reviewsError } = await supabase
      .from('order_reviews')
      .select('rating')
      .in('order_id', orderIds)
      .not('rating', 'is', null);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      throw reviewsError;
    }

    if (!reviews || reviews.length === 0) {
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
  
    // Atualizar o rating do restaurante
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ rating: average })
      .eq('id', restaurantId);

    if (updateError) {
      console.error('Error updating restaurant rating:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Error in updateRestaurantRating:', error);
    throw error;
  }
} 