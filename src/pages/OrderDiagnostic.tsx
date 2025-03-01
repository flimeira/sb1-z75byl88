import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OrderReview {
  id: string;
  order_id: string;
  order_number: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function OrderDiagnostic() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<OrderReview[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderReviews();
  }, []);

  const fetchOrderReviews = async () => {
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      // Direct query to order_reviews with order number
      const { data, error } = await supabase
        .from('order_reviews')
        .select(`
          id,
          order_id,
          rating,
          comment,
          created_at,
          orders:order_id (
            order_number
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Map the data to include order_number directly
      const mappedReviews = data.map(review => ({
        id: review.id,
        order_id: review.order_id,
        order_number: review.orders?.order_number,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at
      }));

      setReviews(mappedReviews);
    } catch (err) {
      console.error('Error fetching order reviews:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para Pedidos
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Diagnóstico de Avaliações</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Avaliações Encontradas</h3>
            
            {reviews.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pedido #
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID da Avaliação
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nota
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comentário
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reviews.map((review) => (
                      <tr key={review.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {review.order_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {review.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-bold">{review.rating}</span>/5
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {review.comment || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma avaliação encontrada.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Consulta Direta</h3>
            <p className="text-gray-600 mb-4">
              Execute uma consulta direta para verificar a avaliação do pedido #24:
            </p>
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  const { data, error } = await supabase
                    .from('orders')
                    .select(`
                      id,
                      order_number,
                      review:order_reviews (
                        id,
                        rating,
                        comment
                      )
                    `)
                    .eq('order_number', 24)
                    .single();

                  if (error) throw error;

                  alert(
                    `Pedido #24:\n` +
                    `ID: ${data.id}\n` +
                    `Review: ${data.review ? JSON.stringify(data.review, null, 2) : 'Nenhuma avaliação encontrada'}`
                  );
                } catch (err) {
                  console.error('Error:', err);
                  setError(err instanceof Error ? err.message : 'An error occurred');
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Verificar Pedido #24
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}