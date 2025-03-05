import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateRestaurantRating } from '../utils/restaurantRating';

interface OrderItem {
  product: {
    nome: string;
    valor: number;
  };
  quantity: number;
  unit_price: number;
}

interface OrderReview {
  id: string;
  rating: number;
  comment: string | null;
}

interface Order {
  id: string;
  order_number: number;
  restaurant: {
    nome: string;
    imagem: string;
    delivery_fee: number;
  };
  delivery_type: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
  review: OrderReview | null;
}

export function Orders() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const logoUrl = 'https://bawostbfbkadpsggljfm.supabase.co/storage/v1/object/public/site-assets//logo.jpeg';
  const ordersPerPage = 10;
  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  useEffect(() => {
    fetchOrdersCount();
    fetchOrders();
  }, [currentPage]);

  const fetchOrdersCount = async () => {
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setTotalOrders(count || 0);
    } catch (error) {
      console.error('Error fetching orders count:', error);
    }
  };

  const fetchOrders = async () => {
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      setLoading(true);

      // Calculate pagination range
      const from = (currentPage - 1) * ordersPerPage;
      const to = from + ordersPerPage - 1;

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          delivery_type,
          created_at,
          restaurant:restaurant_id (
            nome,
            imagem,
            delivery_fee
          ),
          items:order_items (
            quantity,
            unit_price,
            product:product_id (
              nome,
              valor
            )
          ),
          review:order_reviews (
            id,
            rating,
            comment
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (ordersError) throw ordersError;

      console.log('Raw orders data:', ordersData);

      // Process the data
      const processedOrders = ordersData.map(order => {
        console.log('Processing order:', order.id, 'Review data:', order.review);
        // Extract the first review from the array if it exists
        const reviewData = order.review && Array.isArray(order.review) && order.review.length > 0 
          ? order.review[0] 
          : order.review; // Se não for array, usa o objeto diretamente
        
        console.log('Processed review data:', reviewData);
        
        return {
          ...order,
          review: reviewData
        };
      });

      console.log('Final processed orders:', processedOrders);
      setOrders(processedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !supabase) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('order_reviews')
        .insert({
          order_id: selectedOrder.id,
          restaurant_id: selectedOrder.restaurant.id,
          user_id: user?.id,
          rating,
          comment
        });

      if (error) throw error;

      // Atualizar o rating do restaurante
      await updateRestaurantRating(selectedOrder.restaurant.id);

      // Atualizar a lista de pedidos
      fetchOrders();
      setSelectedOrder(null);
      setRating(0);
      setComment('');
      setSuccess('Avaliação enviada com sucesso!');
    } catch (error) {
      setError('Falha ao enviar avaliação. Por favor, tente novamente.');
      console.error('Error submitting review:', error);
    } finally {
      setSaving(false);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are fewer than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate start and end of page range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're at the beginning or end
      if (currentPage <= 2) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para o Dashboard
          </button>
          <div className="flex items-center">
            <img src={logoUrl} alt="Logo" className="h-8 w-auto mr-2" />
            <h1 className="text-xl font-semibold text-gray-900">AmericanaFood</h1>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Meus Pedidos</h2>
          {totalOrders > 0 && (
            <div className="text-sm text-gray-500">
              Mostrando {Math.min((currentPage - 1) * ordersPerPage + 1, totalOrders)} - {Math.min(currentPage * ordersPerPage, totalOrders)} de {totalOrders} pedidos
            </div>
          )}
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start">
                  <img
                    src={order.restaurant.imagem}
                    alt={order.restaurant.nome}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="ml-6 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pedido #{order.order_number}
                        </h3>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <p className="text-gray-700 mt-1">{order.restaurant.nome}</p>
                    
                    {/* Order Items */}
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Itens do Pedido:</h4>
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm text-gray-600">
                          <div>
                            <span className="font-medium">{item.quantity}x</span>{' '}
                            <span>{item.product.nome}</span>
                          </div>
                          <div>R$ {(item.quantity * item.unit_price).toFixed(2)}</div>
                        </div>
                      ))}
                      
                      <div className="pt-2 mt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Subtotal</span>
                          <span>R$ {order.total_amount.toFixed(2)}</span>
                        </div>
                        {order.delivery_type === 'delivery' && (
                          <div className="flex justify-between items-center text-gray-600 mt-1">
                            <span>Taxa de Entrega</span>
                            <span>
                              {order.restaurant.delivery_fee === 0 
                                ? 'Grátis' 
                                : `R$ ${order.restaurant.delivery_fee.toFixed(2)}`}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center font-medium text-gray-900 mt-2">
                          <span>Total</span>
                          <span>
                            R$ {(order.total_amount + (order.delivery_type === 'delivery' ? order.restaurant.delivery_fee : 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Review Section */}
                    {order.review ? (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <h4 className="text-sm font-medium text-gray-700 mr-2">Sua avaliação:</h4>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= order.review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {getRatingText(order.review.rating)}
                          </span>
                        </div>
                        {order.review.comment && (
                          <div className="flex items-start mt-2 text-gray-600 text-sm">
                            <MessageSquare className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            <p>{order.review.comment}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      selectedOrder === order.id ? (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          {error && (
                            <div className="mb-4 text-sm text-red-600">
                              {error}
                            </div>
                          )}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Avalie seu pedido
                            </label>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => setRating(value)}
                                  onMouseEnter={() => setHoveredRating(value)}
                                  onMouseLeave={() => setHoveredRating(0)}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      value <= (hoveredRating || rating)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    } transition-colors`}
                                  />
                                </button>
                              ))}
                            </div>
                            {rating > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                {getRatingText(rating)}
                              </p>
                            )}
                          </div>

                          <div className="mb-4">
                            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                              Comentário (opcional)
                            </label>
                            <textarea
                              id="comment"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Conte-nos sobre sua experiência com este pedido..."
                              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2"
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(null);
                                setRating(0);
                                setComment('');
                                setError(null);
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReview}
                              disabled={reviewLoading || !rating}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                              {reviewLoading ? 'Enviando...' : 'Enviar Avaliação'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <button
                            onClick={() => setSelectedOrder(order.id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium focus:outline-none flex items-center"
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Avaliar Pedido
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">Você ainda não fez nenhum pedido.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-8">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${page}`}
                      onClick={() => goToPage(page as number)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Próxima</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get rating text based on rating value
function getRatingText(rating: number): string {
  switch (rating) {
    case 1:
      return 'Muito ruim';
    case 2:
      return 'Ruim';
    case 3:
      return 'Regular';
    case 4:
      return 'Bom';
    case 5:
      return 'Excelente';
    default:
      return '';
  }
}