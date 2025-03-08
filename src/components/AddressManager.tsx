import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, MapPin, Star, StarOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { fetchAddressFromCep } from '../utils/cep';
import { getCoordinatesFromAddress } from '../utils/geocoding';

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
    console.log('salvando...');

    if (!supabase || !user) return;
    console.log('salvando...supabase');
    try {
      setLoading(true);
      setError(null);

      // Se este endereço será padrão, primeiro verificamos se já existe um endereço padrão
      if (formData.is_default) {
        const { data: existingDefault } = await supabase
          .from('user_addresses')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .single();

        // Se já existe um endereço padrão e não estamos editando ele,
        // removemos o status de padrão do endereço existente
        if (existingDefault && (!editingAddress || existingDefault.id !== editingAddress.id)) {
          const { error: updateDefaultError } = await supabase
            .from('user_addresses')
            .update({ is_default: false })
            .eq('id', existingDefault.id);

          if (updateDefaultError) throw updateDefaultError;
        }
      }

      let addressData = {
        user_id: user.id,
        ...formData
      };

      try {
        // Construir a string do endereço apenas com campos essenciais
        const addressString = [
          formData.street,
          formData.number,
          formData.city,
          formData.state,
          'Brasil'
        ].filter(Boolean).join(', ');

        console.log('Buscando coordenadas para:', addressString);
        
        // Adicionar delay para respeitar o rate limit do OpenStreetMap
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`,
          {
            headers: {
              'User-Agent': 'Flimeira/1.0',
              'Accept-Language': 'pt-BR'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Erro ao buscar coordenadas do endereço');
        }

        const data = await response.json();
        console.log('Resposta da API:', data);

        if (data && data[0]) {
          const { lat, lon } = data[0];
          console.log('Coordenadas encontradas:', { lat, lon });
          
          addressData = {
            ...addressData,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon)
          };
        } else {
          console.log('Nenhuma coordenada encontrada para o endereço');
        }
      } catch (error) {
        console.error('Erro ao buscar coordenadas:', error);
        // Continua salvando mesmo se não encontrar as coordenadas
      }

      console.log('Dados a serem salvos:', addressData);

      let error;
      if (editingAddress) {
        // Atualizar endereço existente
        const { error: updateError } = await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('id', editingAddress.id)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Inserir novo endereço
        const { error: insertError } = await supabase
          .from('user_addresses')
          .insert([addressData]);
        error = insertError;
      }

      if (error) {
        console.error('Erro ao salvar no Supabase:', error);
        throw error;
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

      setEditingAddress(null);
      setShowForm(false);
      await fetchAddresses();
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
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

  const handleSetDefault = async (address: Address) => {
    if (!supabase || !user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Primeiro, remove o status de padrão de todos os endereços
      const { error: updateOthersError } = await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (updateOthersError) throw updateOthersError;

      // Depois, define o endereço selecionado como padrão
      const { error: updateCurrentError } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', address.id)
        .eq('user_id', user.id);

      if (updateCurrentError) throw updateCurrentError;

      await fetchAddresses();
    } catch (error) {
      console.error('Erro ao definir endereço padrão:', error);
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <span>Meus Endereços</span>
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
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Endereço
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Nenhum endereço cadastrado
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium">
                      {address.street}, {address.number}
                      {address.complement && ` - ${address.complement}`}
                    </span>
                    {address.is_default && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {address.neighborhood}, {address.city} - {address.state}
                  </div>
                  <div className="text-sm text-gray-500">
                    CEP: {address.zip_code}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!address.is_default && (
                    <Button
                      onClick={() => handleSetDefault(address)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={() => {
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
                        latitude: address.latitude || 0,
                        longitude: address.longitude || 0
                      });
                      setShowForm(true);
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteAddress(address.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
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
      </CardContent>
    </Card>
  );
} 