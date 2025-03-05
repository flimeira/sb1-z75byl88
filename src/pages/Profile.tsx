import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Lock, Save, ArrowLeft, MapPin } from 'lucide-react';
import { geocodeAddress } from '../utils/geocoding';
import { fetchAddressFromCep } from '../utils/cep';

interface Profile {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
}

export function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingCoordinates, setUpdatingCoordinates] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) {
        navigate('/signin');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
      } else {
        setUser(user);
        fetchProfile(user.id);
      }
    };
    
    checkUser();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCoordinates = async () => {
    if (!profile) {
      setError('Perfil não encontrado');
      return;
    }

    if (!profile.street || !profile.number || !profile.city || !profile.state) {
      setError('Preencha o endereço completo para atualizar as coordenadas');
      return;
    }

    setUpdatingCoordinates(true);
    setError(null);

    try {
      const coordinates = await geocodeAddress(profile);
      
      if (!coordinates) {
        throw new Error('Não foi possível encontrar as coordenadas para o endereço informado');
      }

      if (profile && user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
        
        setProfile(prev => prev ? {
          ...prev,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        } : null);
        
        setSuccess('Coordenadas atualizadas com sucesso!');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Falha ao atualizar as coordenadas');
      console.error('Error updating coordinates:', error);
    } finally {
      setUpdatingCoordinates(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !profile || !user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Primeiro atualiza o perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Depois atualiza as coordenadas
      if (profile.street && profile.number && profile.city && profile.state) {
        const coordinates = await geocodeAddress(profile);
        
        if (coordinates) {
          const { error: coordinatesError } = await supabase
            .from('profiles')
            .update({
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          if (coordinatesError) throw coordinatesError;
          
          setProfile(prev => prev ? {
            ...prev,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          } : null);
        }
      }

      setSuccess('Perfil atualizado com sucesso!');
    } catch (error) {
      setError('Falha ao atualizar o perfil. Por favor, tente novamente.');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;
      
      setSuccess('Senha atualizada com sucesso!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
    } catch (error) {
      setError('Falha ao atualizar a senha. Por favor, tente novamente.');
      console.error('Error updating password:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    setProfile(prev => prev ? { ...prev, postal_code: cep } : null);

    // Remove caracteres não numéricos para verificar o comprimento
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const address = await fetchAddressFromCep(cep);
        if (address) {
          setProfile(prev => prev ? {
            ...prev,
            street: address.street,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state
          } : null);
        }
      } catch (error) {
        console.error('Erro ao buscar endereço:', error);
      } finally {
        setLoadingCep(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para o Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Configurações do Perfil</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Alterar Senha!
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-md">
                {success}
              </div>
            )}

            {showPasswordForm ? (
              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {saving ? 'Atualizando...' : 'Atualizar Senha'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={profile?.full_name || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      id="birthDate"
                      value={profile?.birth_date || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, birth_date: e.target.value } : null)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                        CEP
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="text"
                          id="postalCode"
                          value={profile?.postal_code || ''}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          maxLength={9}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {loadingCep && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                        Rua
                      </label>
                      <input
                        type="text"
                        id="street"
                        value={profile?.street || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, street: e.target.value } : null)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                        Número
                      </label>
                      <input
                        type="text"
                        id="number"
                        value={profile?.number || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, number: e.target.value } : null)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="complement" className="block text-sm font-medium text-gray-700">
                        Complemento
                      </label>
                      <input
                        type="text"
                        id="complement"
                        value={profile?.complement || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, complement: e.target.value } : null)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">
                        Bairro
                      </label>
                      <input
                        type="text"
                        id="neighborhood"
                        value={profile?.neighborhood || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, neighborhood: e.target.value } : null)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        Cidade
                      </label>
                      <input
                        type="text"
                        id="city"
                        value={profile?.city || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, city: e.target.value } : null)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                        Estado
                      </label>
                      <input
                        type="text"
                        id="state"
                        value={profile?.state || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, state: e.target.value } : null)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Save className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="-ml-1 mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}