import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Lock, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AddressManager } from '../components/AddressManager';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

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

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  birth_date: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setPhone(user.user_metadata?.phone || null);
      setEmail(user.email || null);
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!user?.id) {
        console.error('No user ID available');
        setError('Usuário não autenticado');
        return;
      }

      console.log('Fetching profile for user:', user.id);
      console.log('User metadata:', user.user_metadata);
      console.log('User email:', user.email);
      
      // Primeiro, vamos verificar se o perfil existe
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 é o código para "nenhum resultado encontrado"
        console.error('Error checking profile:', checkError);
        throw checkError;
      }

      console.log('Existing profile check:', existingProfile);

      // Se não existir, vamos criar um novo perfil
      if (!existingProfile) {
        console.log('Creating new profile for user');
        const newProfileData = {
          user_id: user.id,
          full_name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          birth_date: user.user_metadata?.birth_date || null,
        };
        console.log('New profile data:', newProfileData);

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfileData])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }

        console.log('New profile created:', newProfile);
        setProfile(newProfile);
        return;
      }

      // Se existir, vamos usar o perfil encontrado
      console.log('Profile data:', existingProfile);
      console.log('User data:', user);
      setProfile(existingProfile);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setError('Erro ao carregar perfil');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      setLoading(true);
      setError(null);

      // Atualizar o perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          birth_date: profile.birth_date,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Atualizar os metadados do usuário (email e telefone)
      const metadataUpdates: { [key: string]: any } = {};
      
      if (email !== user.email) {
        metadataUpdates.email = email;
      }
      
      if (phone !== user.user_metadata?.phone) {
        metadataUpdates.phone = phone;
      }

      if (Object.keys(metadataUpdates).length > 0) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: metadataUpdates
        });

        if (metadataError) throw metadataError;
      }

      setError('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validações de senha
    if (passwordData.new_password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres para garantir sua segurança.');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('As senhas não coincidem. Por favor, verifique se digitou corretamente.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password,
      });

      if (error) {
        if (error.message.includes('weak password')) {
          throw new Error('A senha escolhida é muito fraca. Por favor, escolha uma senha mais forte com pelo menos 6 caracteres.');
        }
        throw error;
      }

      setShowPasswordForm(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setError('Senha atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error updating password:', error);
      setError(error.message || 'Erro ao atualizar senha. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Bem-vindo ao Delivery App</h1>
          <p className="text-gray-600 mb-4">Faça login para continuar</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mr-4 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando...</p>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="border-b bg-white">
                  <CardTitle className="text-xl text-gray-900">Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome
                        </label>
                        <input
                          type="text"
                          value={profile.full_name}
                          onChange={(e) =>
                            setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email || ''}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Nascimento
                        </label>
                        <input
                          type="date"
                          value={profile.birth_date || ''}
                          onChange={(e) =>
                            setProfile(prev => prev ? { ...prev, birth_date: e.target.value } : null)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={phone || ''}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        {saving ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Salvando...
                          </div>
                        ) : (
                          'Salvar Alterações'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="border-b bg-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-gray-900">Segurança</CardTitle>
                    {!showPasswordForm && (
                      <Button
                        variant="outline"
                        onClick={() => setShowPasswordForm(true)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Alterar Senha
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {showPasswordForm ? (
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Senha Atual
                          </label>
                          <input
                            type="password"
                            value={passwordData.current_password}
                            onChange={(e) =>
                              setPasswordData(prev => ({
                                ...prev,
                                current_password: e.target.value
                              }))
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nova Senha
                          </label>
                          <input
                            type="password"
                            value={passwordData.new_password}
                            onChange={(e) =>
                              setPasswordData(prev => ({
                                ...prev,
                                new_password: e.target.value
                              }))
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmar Nova Senha
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirm_password}
                            onChange={(e) =>
                              setPasswordData(prev => ({
                                ...prev,
                                confirm_password: e.target.value
                              }))
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-4 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordData({
                              current_password: '',
                              new_password: '',
                              confirm_password: ''
                            });
                          }}
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={saving}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                          {saving ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Alterando...
                            </div>
                          ) : (
                            'Alterar Senha'
                          )}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600">Mantenha sua senha segura e atualize-a periodicamente</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="border-b bg-white">
                  <CardTitle className="text-xl text-gray-900">Endereços</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <AddressManager />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">Perfil não encontrado</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}