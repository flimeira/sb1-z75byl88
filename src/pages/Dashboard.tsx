import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, ArrowLeft, Plus, Minus, Menu, ShoppingBag, MapPin, AlertCircle, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CheckoutPage } from '../components/CheckoutPage';
import { OrderConfirmationModal } from '../components/OrderConfirmationModal';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Restaurant, Product, CartItem, Order, Address } from '../types';
import { Profile } from '../types/profile';
import { calculateRestaurantDistance, isWithinDeliveryRadius } from '../utils/distance';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

interface Category {
  id: string;
  name: string;
  description: string | null;
  order: number;
}

interface RestaurantType {
  id: string;
  tipo: string;
}

interface OrderConfirmation {
  orderNumber: string;
  total: number;
  deliveryType: string;
  paymentMethod: string;
  deliveryAddress?: Address;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurantTypes, setRestaurantTypes] = useState<RestaurantType[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [typeMap, setTypeMap] = useState<Record<string, string>>({});
  const [restaurantDistances, setRestaurantDistances] = useState<Record<string, number | null>>({});
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Set<string>>(new Set());
  const logoUrl = 'https://bawostbfbkadpsggljfm.supabase.co/storage/v1/object/public/site-assets//logo.jpeg';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchFavoriteRestaurants();
    }
    fetchRestaurantTypes();
  }, [user]);

  // Calculate distances when profile or restaurants change
  useEffect(() => {
    if (userProfile && restaurants.length > 0) {
      calculateDistances();
    }
  }, [userProfile, restaurants]);

  const calculateDistances = () => {
    if (!userProfile || !userProfile.latitude || !userProfile.longitude) return;

    const distances: Record<string, number | null> = {};
    
    restaurants.forEach(restaurant => {
      distances[restaurant.id] = calculateRestaurantDistance(restaurant, userProfile);
    });
    
    setRestaurantDistances(distances);
  };

  const fetchUserProfile = async () => {
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchRestaurantTypes = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('tipos')
        .select('*')
        .order('tipo');

      if (error) throw error;
      setRestaurantTypes(data || []);
      
      // Create a map of type IDs to type names
      const types: Record<string, string> = {};
      data?.forEach(type => {
        types[type.id] = type.tipo;
      });
      setTypeMap(types);
      
      // Now fetch restaurants after we have the type map
      fetchRestaurants(types);
    } catch (error) {
      console.error('Error fetching restaurant types:', error);
    }
  };

  const fetchRestaurants = async (typesMap: Record<string, string> = {}) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('nome');

      if (error) throw error;
      
      // Map the database column names to the expected property names in the Restaurant interface
      // and replace the type ID with the actual type name
      const mappedRestaurants = data?.map(restaurant => ({
        ...restaurant,
        deliveryTime: restaurant.deliverytime,
        tipo: typesMap[restaurant.idtipo] || 'Desconhecido' // Use the type name from the map
      })) || [];
      
      setRestaurants(mappedRestaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (restaurantId: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('order');

      if (error) throw error;
      setCategories(data || []);
      if (data && data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleRestaurantSelect = async (restaurant: Restaurant) => {
    // Check if restaurant is within delivery radius
    if (userProfile) {
      const isInRange = isWithinDeliveryRadius(restaurant, userProfile);
      if (!isInRange) {
        // Don't allow selection if out of range
        return;
      }
    }
    
    setSelectedRestaurant(restaurant);
    if (!supabase) return;

    try {
      await fetchCategories(restaurant.id);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('idrestaurante', restaurant.id)
        .order('nome');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleBackClick = () => {
    setSelectedRestaurant(null);
    setProducts([]);
    setCategories([]);
    setSelectedCategory(null);
    setCart({});
  };

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const calculateOrderTotal = () => {
    return Object.entries(cart).reduce((sum, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return sum + (product?.valor || 0) * quantity;
    }, 0);
  };

  const handleConfirmOrder = async (notes: string, deliveryType: string, paymentMethod: string, deliveryAddress: Address | null) => {
    if (!supabase || !user || !selectedRestaurant) return;

    try {
      setLoading(true);
      setError(null);

      const totalAmount = calculateOrderTotal();

      // Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            restaurant_id: selectedRestaurant.id,
            total_amount: totalAmount,
            delivery_type: deliveryType,
            payment_method: paymentMethod,
            notes,
            delivery_address: deliveryAddress ? {
              street: deliveryAddress.street,
              number: deliveryAddress.number,
              complement: deliveryAddress.complement,
              neighborhood: deliveryAddress.neighborhood,
              city: deliveryAddress.city,
              state: deliveryAddress.state,
              zip_code: deliveryAddress.zip_code,
              latitude: deliveryAddress.latitude,
              longitude: deliveryAddress.longitude
            } : null
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar os itens do pedido
      const orderItems = Object.entries(cart).map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        if (!product) return null;
        return {
          order_id: order.id,
          product_id: productId,
          quantity,
          unit_price: product.valor,
        };
      }).filter(Boolean);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Buscar configuração de pontos
      const { data: pointsConfig, error: configError } = await supabase
        .from('points_config')
        .select('*')
        .single();

      if (configError) throw configError;

      // Buscar pontos atuais do usuário
      const { data: currentPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .single();

      if (pointsError) throw pointsError;

      // Calcular novos pontos
      const newPoints = (currentPoints?.total_points || 0) + pointsConfig.points_per_order;

      // Atualizar pontos do usuário
      const { error: updateError } = await supabase
        .from('user_points')
        .upsert({
          user_id: user.id,
          total_points: newPoints,
          points_expiration_date: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      // Registrar histórico de pontos
      const { error: historyError } = await supabase
        .from('points_history')
        .insert([
          {
            user_id: user.id,
            points: pointsConfig.points_per_order,
            source: 'order',
            source_id: order.id,
            description: `Pontos ganhos pelo pedido #${order.order_number}`,
          }
        ]);

      if (historyError) throw historyError;

      // Atualizar estado
      setShowCheckout(false);
      setCart({});
      setOrderConfirmation({
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        deliveryType: order.delivery_type,
        paymentMethod: order.payment_method,
        deliveryAddress: order.delivery_address,
      });
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter(product => product.category_id === selectedCategory)
    : products;

  const filteredRestaurants = restaurants.filter(restaurant => {
    // Filter by search term
    const matchesSearch = restaurant.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by restaurant type
    const matchesType = !selectedType || selectedType === 'All' || restaurant.idtipo === selectedType;
    
    return matchesSearch && matchesType;
  });

  const fetchFavoriteRestaurants = async () => {
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('favorite_restaurants')
        .select('restaurant_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao buscar restaurantes favoritos:', error);
        throw error;
      }

      console.log('Estrutura da tabela favorite_restaurants:', {
        columns: ['id', 'user_id', 'restaurant_id', 'created_at'],
        data: data
      });

      setFavoriteRestaurants(new Set(data.map(fav => fav.restaurant_id)));
    } catch (error) {
      console.error('Error fetching favorite restaurants:', error);
    }
  };

  const toggleFavorite = async (restaurantId: string) => {
    if (!supabase || !user) {
      console.log('Supabase ou usuário não disponível:', { 
        supabase: !!supabase, 
        user: !!user,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      });
      return;
    }

    try {
      const isFavorite = favoriteRestaurants.has(restaurantId);
      console.log('Iniciando toggle de favorito:', { 
        restaurantId, 
        isFavorite, 
        userId: user.id,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        session: await supabase.auth.getSession()
      });
      
      if (isFavorite) {
        console.log('Tentando remover favorito...');
        const { error } = await supabase
          .from('favorite_restaurants')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', restaurantId);

        if (error) {
          console.error('Erro detalhado ao remover favorito:', error);
          throw error;
        }
        
        setFavoriteRestaurants(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(restaurantId);
          return newFavorites;
        });
      } else {
        console.log('Tentando adicionar favorito...');
        // Buscar o restaurante
        const restaurant = restaurants.find(r => r.id === restaurantId);
        if (!restaurant) {
          console.error('Restaurante não encontrado');
          return;
        }

        const { data, error } = await supabase
          .from('favorite_restaurants')
          .insert({
            user_id: user.id,
            restaurant_id: restaurantId,
            restaurant_name: restaurant.nome,
            restaurant_image: restaurant.imagem
          })
          .select();

        if (error) {
          console.error('Erro detalhado ao adicionar favorito:', error);
          throw error;
        }
        
        console.log('Favorito adicionado com sucesso:', data);
        
        setFavoriteRestaurants(prev => {
          const newFavorites = new Set(prev);
          newFavorites.add(restaurantId);
          return newFavorites;
        });
      }
    } catch (error) {
      console.error('Erro completo ao togglar favorito:', error);
      // Tentar reautenticar o usuário em caso de erro
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError);
        } else {
          console.log('Sessão atual:', session);
        }
      } catch (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (showOrderConfirmation && orderConfirmation) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                Pedido Confirmado!
              </h2>
              <p className="text-gray-600">
                Seu pedido foi recebido com sucesso.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Número do Pedido:</span>
                <span className="font-medium">#{orderConfirmation.orderNumber}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">
                  R$ {orderConfirmation.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tipo de Entrega:</span>
                <span className="font-medium">
                  {orderConfirmation.deliveryType === 'delivery' ? 'Delivery' : 'Retirada'}
                </span>
              </div>

              {orderConfirmation.deliveryType === 'delivery' && orderConfirmation.deliveryAddress && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Endereço de Entrega:</h3>
                  <p className="text-gray-600">
                    {orderConfirmation.deliveryAddress.street}, {orderConfirmation.deliveryAddress.number}
                    {orderConfirmation.deliveryAddress.complement && ` - ${orderConfirmation.deliveryAddress.complement}`}
                  </p>
                  <p className="text-gray-600">
                    {orderConfirmation.deliveryAddress.neighborhood}, {orderConfirmation.deliveryAddress.city} - {orderConfirmation.deliveryAddress.state}
                  </p>
                  <p className="text-gray-600">CEP: {orderConfirmation.deliveryAddress.zip_code}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Forma de Pagamento:</span>
                <span className="font-medium">
                  {orderConfirmation.paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Dinheiro'}
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOrderConfirmation(false);
                  setSelectedRestaurant(null);
                }}
              >
                Fazer Novo Pedido
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowOrderConfirmation(false);
                  setSelectedRestaurant(null);
                }}
              >
                Voltar para Restaurantes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showCheckout && selectedRestaurant) {
    return (
      <CheckoutPage
        restaurant={selectedRestaurant}
        cart={cart}
        products={products}
        onBack={() => setShowCheckout(false)}
        onConfirm={handleConfirmOrder}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {selectedRestaurant ? (
                <div className="flex items-center">
                  <button
                    onClick={handleBackClick}
                    className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Voltar para Restaurantes
                  </button>
                  <button
                    onClick={() => toggleFavorite(selectedRestaurant.id)}
                    className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={favoriteRestaurants.has(selectedRestaurant.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        favoriteRestaurants.has(selectedRestaurant.id)
                          ? 'text-red-500 fill-current'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>
              ) : (
                <div className="flex items-center">
                  <img src={logoUrl} alt="Logo" className="h-8 w-auto mr-2" />
                  <h1 className="text-xl font-semibold text-gray-900">AmericanaFood</h1>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userEmail={user?.email || ''}
        onSignOut={signOut}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {selectedRestaurant ? (
          <div className="px-4 sm:px-0">
            <div className="relative h-64 rounded-lg overflow-hidden mb-6">
              <img
                src={selectedRestaurant.imagem}
                alt={selectedRestaurant.nome}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
                <div className="p-6 text-white">
                  <h2 className="text-2xl font-bold mb-1">{selectedRestaurant.nome}</h2>
                  <div className="flex items-center text-white text-sm mb-3">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{selectedRestaurant.street}, {selectedRestaurant.number} - {selectedRestaurant.city}, {selectedRestaurant.state}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="ml-1">{selectedRestaurant.rating}</span>
                    </div>
                    <span>•</span>
                    <span>{selectedRestaurant.tipo}</span>
                    <span>•</span>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{selectedRestaurant.deliveryTime} min</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>Até {selectedRestaurant.delivery_radius}km</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <div className="flex space-x-4">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                        selectedCategory === category.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Menu</h3>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="flex">
                        {product.imagem && (
                          <div className="w-24 h-24 flex-shrink-0">
                            <img 
                              src={product.imagem} 
                              alt={product.nome} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4 flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">{product.nome}</h4>
                              <p className="text-gray-600 text-sm mt-1">{product.descricao}</p>
                              <p className="text-gray-900 font-medium mt-2">R$ {product.valor.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => removeFromCart(product.id)}
                                className={`p-1 rounded-full ${
                                  cart[product.id] ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
                                }`}
                                disabled={!cart[product.id]}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-gray-700 w-6 text-center">
                                {cart[product.id] || 0}
                              </span>
                              <button
                                onClick={() => addToCart(product.id)}
                                className="p-1 rounded-full bg-green-100 text-green-600"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    Nenhum produto encontrado nesta categoria.
                  </div>
                )}
              </div>

              <div className="sticky top-24 h-fit">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Seu Pedido</h3>
                  {Object.keys(cart).length > 0 ? (
                    <>
                      <div className="space-y-4 mb-6">
                        {Object.entries(cart).map(([productId, quantity]) => {
                          const product = products.find(p => p.id === productId);
                          if (!product) return null;
                          return (
                            <div key={productId} className="flex justify-between items-center">
                              <div className="flex items-center">
                                {product.imagem && (
                                  <img 
                                    src={product.imagem} 
                                    alt={product.nome} 
                                    className="w-10 h-10 object-cover rounded-md mr-3"
                                  />
                                )}
                                <div>
                                  <span className="font-medium">{quantity}x</span>{' '}
                                  <span>{product.nome}</span>
                                </div>
                              </div>
                              <span className="text-gray-900">
                                R$ {(product.valor * quantity).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center font-semibold text-lg">
                          <span>Total</span>
                          <span>
                            R$ {calculateOrderTotal().toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleCheckout}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700 transition-colors"
                      >
                        Finalizar Pedido
                      </button>
                    </>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      Seu carrinho está vazio.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 sm:px-0">
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar restaurantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between mb-6">
              <div className="flex overflow-x-auto pb-2 mb-2 md:mb-0">
                <button
                  onClick={() => setSelectedType(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap mr-2 ${
                    selectedType === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                {restaurantTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap mr-2 ${
                      selectedType === type.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.tipo}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.length > 0 ? (
                filteredRestaurants.map(restaurant => {
                  const distance = restaurantDistances[restaurant.id];
                  const isInRange = userProfile && isWithinDeliveryRadius(restaurant, userProfile);
                  
                  return (
                    <div
                      key={restaurant.id}
                      onClick={() => handleRestaurantSelect(restaurant)}
                      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all ${
                        isInRange === false 
                          ? 'opacity-60 cursor-not-allowed' 
                          : 'cursor-pointer hover:shadow-lg'
                      }`}
                    >
                      <div className="relative h-48">
                        <img
                          src={restaurant.imagem}
                          alt={restaurant.nome}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white text-lg font-semibold">{restaurant.nome}</h3>
                            <div className="flex items-center text-white text-sm mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="truncate">{restaurant.street}, {restaurant.number}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-white text-sm mt-1">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="ml-1">{restaurant.rating}</span>
                              </div>
                              <span>•</span>
                              <span>{restaurant.tipo}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{restaurant.deliveryTime} min</span>
                          </div>
                          <div>
                            {restaurant.delivery_fee === 0 ? (
                              <span className="text-green-600 font-medium">Entrega Grátis</span>
                            ) : (
                              <span>Taxa: R$ {restaurant.delivery_fee.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Delivery radius information */}
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                            <span className="text-gray-500">Raio: {restaurant.delivery_radius}km</span>
                          </div>
                          
                          {distance !== null && distance !== undefined && (
                            <div className={`font-medium ${isInRange ? 'text-green-600' : 'text-red-500'}`}>
                              {isInRange ? 'Entrega disponível' : 'Fora da área de entrega'}
                              <span className="text-gray-500 font-normal ml-1">({distance.toFixed(1)}km)</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Warning banner for out of range restaurants */}
                        {isInRange === false && (
                          <div className="mt-2 bg-red-50 text-red-600 p-2 rounded-md text-xs text-center">
                            Este restaurante não entrega no seu endereço
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhum restaurante encontrado</h3>
                  <p className="text-gray-500 mt-2">Tente ajustar seus filtros de busca.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}