import React from 'react';
import { CheckCircle } from 'lucide-react';

interface OrderConfirmationModalProps {
  orderNumber: number;
  onClose: () => void;
}

export function OrderConfirmationModal({ orderNumber, onClose }: OrderConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center animate-fade-in">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido Confirmado!</h2>
        <p className="text-lg text-gray-600 mb-2">Seu pedido #{orderNumber} foi enviado com sucesso.</p>
        <p className="text-gray-600 mb-6">O pagamento será realizado no momento da entrega do seu pedido.</p>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium text-lg transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}