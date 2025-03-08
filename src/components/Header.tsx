import React, { useState, useEffect } from 'react';
import { Menu, MapPin, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../types';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Header() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);

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
      
      // Selecionar o endereço padrão ou o primeiro endereço disponível
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else if (data && data.length > 0) {
        setSelectedAddress(data[0]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = async (address: Address) => {
    try {
      // Se o endereço selecionado não for o padrão, atualizar o status
      if (!address.is_default) {
        // Remover o padrão dos outros endereços
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user?.id);

        // Definir o novo endereço como padrão
        await supabase
          .from('user_addresses')
          .update({ is_default: true })
          .eq('id', address.id);

        // Atualizar a lista de endereços
        const updatedAddresses = addresses.map(addr => ({
          ...addr,
          is_default: addr.id === address.id
        }));
        setAddresses(updatedAddresses);
      }

      setSelectedAddress(address);
    } catch (error) {
      console.error('Error updating default address:', error);
    }
  };

  const getAddressDisplay = (address: Address) => {
    return `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">FoodApp</h1>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1">
                  {loading ? (
                    <span className="text-gray-500">Carregando...</span>
                  ) : selectedAddress ? (
                    <>
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {getAddressDisplay(selectedAddress)}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  ) : (
                    <span className="text-gray-500">Selecione um endereço</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px]">
                {addresses.map((address) => (
                  <DropdownMenuItem
                    key={address.id}
                    onClick={() => handleAddressSelect(address)}
                    className="flex flex-col items-start gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getAddressDisplay(address)}</span>
                      {address.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Padrão
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {address.neighborhood}, {address.city} - {address.state}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
} 