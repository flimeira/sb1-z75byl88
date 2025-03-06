import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, CreditCard, Banknote, MapPin, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Listbox, ListboxContent, ListboxItem, ListboxTrigger, ListboxValue } from './ui/listbox';

interface Restaurant {
  id: string;
  nome: string;
  imagem: string;
  rating: number;
  tipo: string;
  deliveryTime: string;
  delivery_fee: number;
}

interface CheckoutPageProps {
  restaurant: Restaurant;
  cart: Record<string, number>;
  products: Array<{
    id: string;
    nome: string;
    valor: number;
  }>;
  onBack: () => void;
  onConfirm: (notes: string, deliveryType: string, paymentMethod: string, deliveryAddress: Address | null) => void;
}

export function CheckoutPage({ restaurant, cart, products, onBack, onConfirm }: CheckoutPageProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;

      setAddresses(data || []);
      
      // Selecionar o endereço padrão se existir
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id);
      } else if (data && data.length > 0) {
        setSelectedAddress(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setError('Erro ao carregar endereços');
    } finally {
      setLoading(false);
    }
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product?.valor || 0) * quantity;
    }, 0);
  };

  const getDeliveryFee = () => {
    return deliveryType === 'delivery' ? restaurant.delivery_fee : 0;
  };

  const getFinalTotal = () => {
    return getCartTotal() + getDeliveryFee();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedAddressData = addresses.find(addr => addr.id === selectedAddress);
    onConfirm(notes, deliveryType, paymentMethod, deliveryType === 'delivery' ? selectedAddressData || null : null);
  };

  const getAddressDisplay = (address: Address) => {
    return `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}`;
  };

  if (!restaurant) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header with Back Button */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Restaurant Info */}
          <Card className="overflow-hidden">
            <div className="relative h-32">
              <img
                src={restaurant.imagem}
                alt={restaurant.nome}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h2 className="text-white text-2xl font-bold">{restaurant.nome}</h2>
                  <div className="flex items-center space-x-3 text-white/90 text-sm mt-1">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span>{restaurant.rating}</span>
                    </div>
                    <span>•</span>
                    <span>{restaurant.tipo}</span>
                    <span>•</span>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{restaurant.deliveryTime} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Delivery Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tipo de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    deliveryType === 'delivery'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <MapPin className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="font-medium">Delivery</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Entrega em até {restaurant.deliveryTime} minutos
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    deliveryType === 'pickup'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <MapPin className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="font-medium">Retirada</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Retire no restaurante em 20 minutos
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {deliveryType === 'delivery' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                    {error}
                  </div>
                )}
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Carregando endereços...</div>
                ) : addresses.length > 0 ? (
                  <div className="relative">
                    <Listbox value={selectedAddress || ''} onValueChange={setSelectedAddress}>
                      <ListboxTrigger className="w-full h-auto py-3 px-4 border rounded-lg bg-white">
                        <ListboxValue placeholder="Selecione um endereço" />
                      </ListboxTrigger>
                      <ListboxContent 
                        className="max-h-[300px] absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg"
                        position="popper"
                        sideOffset={5}
                      >
                        {addresses.map((address) => (
                          <ListboxItem
                            key={address.id}
                            value={address.id}
                            className="py-3 px-4 hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex items-start">
                              <div className="flex-1">
                                <div className="font-medium">
                                  {getAddressDisplay(address)}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {address.neighborhood}, {address.city} - {address.state}
                                </div>
                                <div className="text-sm text-gray-600">
                                  CEP: {address.zip_code}
                                </div>
                                {address.is_default && (
                                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                    Endereço padrão
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                            </div>
                          </ListboxItem>
                        ))}
                      </ListboxContent>
                    </Listbox>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-2">Nenhum endereço cadastrado</p>
                    <a
                      href="/profile"
                      className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
                    >
                      Cadastrar endereço
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    paymentMethod === 'credit_card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="font-medium">Cartão de Crédito</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    paymentMethod === 'cash'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Banknote className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="font-medium">Dinheiro</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Algum ingrediente que deve ser retirado? Informe aqui..."
                className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(cart).map(([productId, quantity]) => {
                  const product = products.find(p => p.id === productId);
                  if (!product) return null;
                  return (
                    <div key={productId} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="bg-gray-100 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                          {quantity}
                        </span>
                        <span className="text-gray-700">{product.nome}</span>
                      </div>
                      <span className="font-medium">
                        R$ {(product.valor * quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>R$ {getCartTotal().toFixed(2)}</span>
                  </div>
                  {deliveryType === 'delivery' && (
                    <div className="flex justify-between text-gray-600">
                      <span>Taxa de Entrega</span>
                      <span>
                        {restaurant.delivery_fee === 0 
                          ? 'Grátis' 
                          : `R$ ${restaurant.delivery_fee.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-lg pt-2">
                    <span>Total</span>
                    <span>R$ {getFinalTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading || (deliveryType === 'delivery' && !selectedAddress)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-medium"
                >
                  {loading ? 'Processando...' : 'Finalizar Pedido'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}