import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar todas as avaliações agrupadas por restaurante
    const { data: ratings, error: ratingsError } = await supabaseClient
      .from('order_reviews')
      .select('restaurant_id, rating')
      .not('rating', 'is', null)

    if (ratingsError) throw ratingsError

    // Calcular média por restaurante
    const restaurantRatings = ratings.reduce((acc, review) => {
      if (!acc[review.restaurant_id]) {
        acc[review.restaurant_id] = {
          sum: 0,
          count: 0
        }
      }
      acc[review.restaurant_id].sum += review.rating
      acc[review.restaurant_id].count += 1
      return acc
    }, {} as Record<string, { sum: number; count: number }>)

    // Atualizar a média na tabela de restaurantes
    const updates = Object.entries(restaurantRatings).map(([restaurantId, { sum, count }]) => {
      const average = sum / count
      return supabaseClient
        .from('restaurants')
        .update({ rating: Number(average.toFixed(1)) })
        .eq('id', restaurantId)
    })

    // Executar todas as atualizações
    await Promise.all(updates)

    return new Response(
      JSON.stringify({ message: 'Ratings updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 