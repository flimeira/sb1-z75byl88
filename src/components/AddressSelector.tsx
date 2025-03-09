import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Address } from '../types';
import { Button } from './ui/button';

interface AddressSelectorProps {
  currentAddress: Address | null;
  onAddressChange: (address: Address) => void;
}

export function AddressSelector({ currentAddress, onAddressChange }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setError('Erro ao carregar endereços');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = async (address: Address) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Primeiro, remove o status de padrão de todos os endereços
      const { error: updateError } = await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Define o endereço selecionado como padrão
      const { error: setDefaultError } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', address.id);

      if (setDefaultError) throw setDefaultError;

      onAddressChange(address);
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating default address:', error);
      setError('Erro ao atualizar endereço padrão');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <MapPin className="w-4 h-4" />
        <span className="text-sm">Carregando endereços...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <MapPin className="w-4 h-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <MapPin className="w-4 h-4" />
        <span className="text-sm truncate max-w-[300px]">
          {currentAddress ? (
            `${currentAddress.street}, ${currentAddress.number}${currentAddress.complement ? ` - ${currentAddress.complement}` : ''}`
          ) : (
            'Selecione um endereço'
          )}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Selecione um endereço</h3>
            <div className="space-y-2">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  onClick={() => handleAddressSelect(address)}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                    currentAddress?.id === address.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="font-medium text-gray-900">
                    {address.street}, {address.number}
                    {address.complement && ` - ${address.complement}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address.neighborhood}, {address.city} - {address.state}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 