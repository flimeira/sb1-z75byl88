import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, ArrowLeft, Plus, Minus, Menu, ShoppingBag, MapPin, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CheckoutPage } from '../components/CheckoutPage';
import { OrderConfirmationModal } from '../components/OrderConfirmationModal';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Restaurant } from '../types/restaurant';
import { Profile } from '../types/profile';
import { calculateRestaurantDistance, isWithinDeliveryRadius } from '../utils/distance';

interface Product {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  imagem: string;
  category_id: string;
}

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
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurantTypes, setRestaurantTypes] = useState<RestaurantType[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [typeMap, setTypeMap] = useState<Record<string, string>>({});
  const [restaurantDistances, setRestaurantDistances] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (user) {
      fetchUserProfile();
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

  const handleConfirmOrder = async (notes: string, deliveryType: string, paymentMethod: string) => {
    if (!supabase || !user || !selectedRestaurant) return;

    try {
      // Calculate the total first
      const total = calculateOrderTotal();

      // Create the order first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          restaurant_id: selectedRestaurant.id,
          total_amount: total,
          delivery_type: deliveryType,
          payment_method: paymentMethod,
          notes
        })
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      // Then create the order items
      const orderItems = Object.entries(cart).map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        if (!product) throw new Error('Product not found');
        return {
          order_id: orderData.id,
          product_id: productId,
          quantity,
          unit_price: product.valor
        };
      });

      // Insert all order items at once
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderNumber(orderData.order_number);
      setShowOrderConfirmation(true);
      setShowCheckout(false);
      setCart({});
    } catch (error) {
      console.error('Error creating order:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
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
                <button
                  onClick={handleBackClick}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar para Restaurantes
                </button>
              ) : (
                <h1 className="text-xl font-semibold text-gray-900">FoodDelivery</h1>
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

      {showOrderConfirmation && orderNumber && (
        <OrderConfirmationModal
          orderNumber={orderNumber}
          onClose={() => {
            setShowOrderConfirmation(false);
            setSelectedRestaurant(null);
          }}
        />
      )}

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