import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, MapPin, Star, StarOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { fetchAddressFromCep } from '../utils/cep';

const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];

interface AddressFormData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
}

export function AddressManager() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: false,
    latitude: 0,
    longitude: 0
  });

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
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setError('Erro ao carregar endereços');
    } finally {
      setLoading(false);
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    setFormData(prev => ({ ...prev, zip_code: cep }));

    // Remove caracteres não numéricos para verificar o comprimento
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const address = await fetchAddressFromCep(cep);
        if (address) {
          setFormData(prev => ({
            ...prev,
            street: address.street,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar endereço:', error);
        setError('Erro ao buscar endereço pelo CEP');
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar coordenadas do endereço usando a API de geocoding
      const addressString = `${formData.street}, ${formData.number}, ${formData.neighborhood}, ${formData.city}, ${formData.state}, ${formData.zip_code}`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}`);
      const data = await response.json();

      if (data && data[0]) {
        const { lat, lon } = data[0];
        formData.latitude = parseFloat(lat);
        formData.longitude = parseFloat(lon);
      }

      const { error } = await supabase
        .from('user_addresses')
        .insert([
          {
            user_id: user.id,
            ...formData
          }
        ]);

      if (error) throw error;

      // Se este endereço for padrão, remover o padrão dos outros
      if (formData.is_default) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', formData.id);
      }

      setFormData({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
        is_default: false,
        latitude: 0,
        longitude: 0
      });

      await fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      setError('Erro ao salvar endereço');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!supabase || !user) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      setError('Erro ao excluir endereço');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!supabase || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Primeiro, remover o padrão de todos os endereços
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Depois, definir o novo endereço como padrão
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      setError('Erro ao definir endereço padrão');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      street: address.street,
      number: address.number,
      complement: address.complement || '',
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
      is_default: address.is_default,
      latitude: address.latitude,
      longitude: address.longitude
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meus Endereços</h2>
        <Button
          onClick={() => {
            setEditingAddress(null);
            setFormData({
              street: '',
              number: '',
              complement: '',
              neighborhood: '',
              city: '',
              state: '',
              zip_code: '',
              is_default: false,
              latitude: 0,
              longitude: 0
            });
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Endereço
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rua
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    name="complement"
                    value={formData.complement}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleCepChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Definir como endereço padrão
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAddress(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : editingAddress ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="text-center py-4">Carregando endereços...</div>
        ) : addresses.length > 0 ? (
          addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                          {address.street}, {address.number}
                        </span>
                        {address.is_default && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            Padrão
                          </span>
                        )}
                      </div>
                      {address.complement && (
                        <p className="text-gray-600">{address.complement}</p>
                      )}
                      <p className="text-gray-600">
                        {address.neighborhood}, {address.city} - {address.state}
                      </p>
                      <p className="text-gray-600">CEP: {address.zip_code}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {!address.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        Definir como Padrão
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            Nenhum endereço cadastrado
          </div>
        )}
      </div>
    </div>
  );
} 