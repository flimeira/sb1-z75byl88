import { supabase } from '../lib/supabase';

export async function updateRestaurantRating(restaurantId: string) {
  try {
    console.log('Updating rating for restaurant:', restaurantId);

    if (!restaurantId) {
      console.error('Restaurant ID is undefined or null');
      throw new Error('Restaurant ID is required');
    }

    // Primeiro, verificar o rating atual do restaurante
    const { data: currentRestaurant, error: currentError } = await supabase
      .from('restaurants')
      .select('rating')
      .eq('id', restaurantId);

    if (currentError) {
      console.error('Error checking current rating:', currentError);
      throw currentError;
    }

    console.log('Current restaurant rating:', currentRestaurant?.[0]?.rating);

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
      console.log('No orders found for this restaurant');
      return;
    }

    const orderIds = orders.map(order => order.id);
    console.log('Found order IDs:', orderIds);

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

    console.log('Found reviews:', reviews);

    if (!reviews || reviews.length === 0) {
      console.log('No reviews found, setting rating to 0');
      // Se não houver avaliações, define o rating como 0
      const { data: zeroUpdateData, error: updateError } = await supabase
        .from('restaurants')
        .update({ rating: 0 })
        .eq('id', restaurantId)
        .select('rating');

      if (updateError) {
        console.error('Error updating restaurant rating to 0:', updateError);
        throw updateError;
      }

      console.log('Zero rating update result:', zeroUpdateData);
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
      .select('rating');

    if (updateError) {
      console.error('Error updating restaurant rating:', updateError);
      throw updateError;
    }

    console.log('Update result:', updateData);

    // Verificar o valor real na tabela após a atualização
    const { data: verifyData, error: verifyError } = await supabase
      .from('restaurants')
      .select('rating')
      .eq('id', restaurantId);

    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      throw verifyError;
    }

    if (verifyData && verifyData.length > 0) {
      console.log('Final verification - Rating in database:', verifyData[0].rating);
      if (verifyData[0].rating !== average) {
        console.error('Warning: The final rating in the database does not match the calculated average!');
        console.error('Calculated average:', average);
        console.error('Database value:', verifyData[0].rating);
      }
    } else {
      console.error('Could not verify the update. Restaurant not found after update.');
    }
  } catch (error) {
    console.error('Error in updateRestaurantRating:', error);
    throw error;
  }
} 