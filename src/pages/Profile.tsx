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
  email: string;
  phone: string | null;
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

  useEffect(() => {
    if (user) {
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
          email: user.email || '',
          phone: user.user_metadata?.phone || null,
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

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          birth_date: profile.birth_date,
        })
        .eq('user_id', user.id);

      if (error) throw error;

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

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password,
      });

      if (error) throw error;

      setShowPasswordForm(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setError('Senha atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Erro ao atualizar senha');
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : profile ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)
                      }
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile(prev => prev ? { ...prev, email: e.target.value } : null)
                      }
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={profile.birth_date || ''}
                      onChange={(e) =>
                        setProfile(prev => prev ? { ...prev, birth_date: e.target.value } : null)
                      }
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) =>
                        setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)
                      }
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Alterando...' : 'Alterar Senha'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endereços</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressManager />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">Perfil não encontrado</div>
        )}
      </div>
    </div>
  );
}