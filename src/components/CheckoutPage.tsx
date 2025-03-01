import React, { useState } from 'react';
import { ArrowLeft, Star, Clock, CreditCard, Banknote } from 'lucide-react';

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
  onConfirm: (notes: string, deliveryType: string, paymentMethod: string) => void;
}

export function CheckoutPage({ restaurant, cart, products, onBack, onConfirm }: CheckoutPageProps) {
  const [notes, setNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

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

  if (!restaurant) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar para o Restaurante
      </button>

      {/* Restaurant Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
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
      </div>

      {/* Delivery Type Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Tipo de Entrega</h3>
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
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Forma de Pagamento</h3>
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
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Resumo do Pedido</h3>
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
      </div>

      {/* Additional Notes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Observações</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Algum ingrediente que deve ser retirado? Informe aqui..."
          className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Confirm Button */}
      <button
        onClick={() => onConfirm(notes, deliveryType, paymentMethod)}
        className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 font-medium text-lg"
      >
        Enviar Pedido
      </button>
    </div>
  );
}