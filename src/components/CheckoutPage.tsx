import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, CreditCard, Banknote, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

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
        .from('addresses')
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

  if (!restaurant) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar para o Restaurante
      </Button>

      {/* Restaurant Header */}
      <Card>
        <div className="relative h-48">
          <img
            src={restaurant.imagem}
            alt={restaurant.nome}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60">
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h2 className="text-white text-3xl font-bold mb-2">{restaurant.nome}</h2>
              <div className="flex items-center space-x-4 text-white">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
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

      {/* Delivery Type Selection */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tipo de Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="deliveryType"
                value="delivery"
                checked={deliveryType === 'delivery'}
                onChange={(e) => setDeliveryType(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Delivery</span>
                <p className="text-sm text-gray-500">Entrega em até {restaurant.deliveryTime} minutos</p>
              </div>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="deliveryType"
                value="pickup"
                checked={deliveryType === 'pickup'}
                onChange={(e) => setDeliveryType(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Retirada</span>
                <p className="text-sm text-gray-500">Retire no restaurante em 20 minutos</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Address Selection */}
      {deliveryType === 'delivery' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Endereço de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-4">
              {loading ? (
                <div>Carregando endereços...</div>
              ) : addresses.length > 0 ? (
                <RadioGroup
                  value={selectedAddress || ''}
                  onValueChange={setSelectedAddress}
                  className="space-y-2"
                >
                  {addresses.map((address) => (
                    <div key={address.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={address.id} id={address.id} />
                      <Label htmlFor={address.id} className="flex flex-col">
                        <span className="font-medium">
                          {address.street}, {address.number}
                          {address.complement && ` - ${address.complement}`}
                        </span>
                        <span className="text-sm text-gray-600">
                          {address.neighborhood}, {address.city} - {address.state}
                        </span>
                        <span className="text-sm text-gray-600">CEP: {address.zip_code}</span>
                        {address.is_default && (
                          <span className="text-xs text-blue-600">Endereço padrão</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Nenhum endereço cadastrado.</p>
                  <a
                    href="/profile"
                    className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
                  >
                    Cadastrar endereço
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Selection */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="paymentMethod"
                value="credit_card"
                checked={paymentMethod === 'credit_card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
                <span className="font-medium text-gray-900">Cartão de Crédito</span>
              </div>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center">
                <Banknote className="w-5 h-5 text-gray-600 mr-2" />
                <span className="font-medium text-gray-900">Dinheiro</span>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resumo do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(cart).map(([productId, quantity]) => {
              const product = products.find(p => p.id === productId);
              if (!product) return null;
              return (
                <div key={productId} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{quantity}x</span>{' '}
                    <span>{product.nome}</span>
                  </div>
                  <span className="text-gray-900">
                    R$ {(product.valor * quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-gray-600">
                <span>Subtotal</span>
                <span>R$ {getCartTotal().toFixed(2)}</span>
              </div>
              {deliveryType === 'delivery' && (
                <div className="flex justify-between items-center text-gray-600 mt-2">
                  <span>Taxa de Entrega</span>
                  <span>
                    {restaurant.delivery_fee === 0 
                      ? 'Grátis' 
                      : `R$ ${restaurant.delivery_fee.toFixed(2)}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center font-semibold text-lg mt-4">
                <span>Total</span>
                <span>R$ {getFinalTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Algum ingrediente que deve ser retirado? Informe aqui..."
            className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </CardContent>
      </Card>

      {/* Confirm Button */}
      <Button
        onClick={handleSubmit}
        disabled={loading || (deliveryType === 'delivery' && !selectedAddress)}
        className="w-full mt-6"
      >
        {loading ? 'Processando...' : 'Enviar Pedido'}
      </Button>
    </div>
  );
}