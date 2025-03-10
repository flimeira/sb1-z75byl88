import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AlertCircle, Loader2, Eye, EyeOff, Check, X } from 'lucide-react';

interface AuthError {
  message: string;
  status?: number;
}

interface PasswordRequirement {
  text: string;
  met: boolean;
}

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const logoUrl = 'https://bawostbfbkadpsggljfm.supabase.co/storage/v1/object/public/site-assets//logo.jpeg';

  const passwordRequirements: PasswordRequirement[] = [
    { text: 'Mínimo de 8 caracteres', met: password.length >= 8 },
    { text: 'Pelo menos uma letra maiúscula', met: /[A-Z]/.test(password) },
    { text: 'Pelo menos uma letra minúscula', met: /[a-z]/.test(password) },
    { text: 'Pelo menos um número', met: /[0-9]/.test(password) },
    { text: 'Pelo menos um caractere especial', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    { text: 'Senhas coincidem', met: password === confirmPassword && password !== '' }
  ];

  const isPasswordValid = passwordRequirements.every(req => req.met);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    if (formatted.length <= 15) { // (99) 99999-9999
      setPhone(formatted);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (typeof error === 'object' && error !== null) {
      // Erro específico de usuário já registrado
      if (error.message?.includes('User already registered')) {
        return 'Este email já está cadastrado. Por favor, faça login ou use outro email.';
      }

      // Erro de formato de email inválido
      if (error.message?.includes('Invalid email')) {
        return 'Por favor, insira um email válido.';
      }

      // Erro de senha muito fraca
      if (error.message?.includes('Password')) {
        return 'A senha não atende aos requisitos mínimos de segurança.';
      }

      // Erro de rede ou servidor
      if (error.message?.includes('network') || error.status === 500) {
        return 'Erro de conexão. Por favor, verifique sua internet e tente novamente.';
      }

      // Se houver uma mensagem de erro, use-a
      if (error.message) {
        return error.message;
      }
    }

    // Mensagem genérica para outros casos
    return 'Erro ao criar conta. Por favor, tente novamente mais tarde.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('=== INÍCIO DO PROCESSO DE REGISTRO ===');
    console.log('URL da aplicação:', window.location.origin);
    console.log('Dados do formulário:', { 
      email, 
      name, 
      phone,
      passwordLength: password.length,
      isPasswordValid
    });

    if (!isPasswordValid) {
      console.log('Senha não atende aos requisitos');
      setError('Por favor, atenda a todos os requisitos da senha');
      setLoading(false);
      return;
    }

    try {
      console.log('=== TENTANDO CRIAR USUÁRIO ===');
      
      // Criar o usuário com dados mínimos
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      console.log('Resposta completa do Supabase:', {
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role,
          aud: user.aud,
          created_at: user.created_at
        } : null,
        error: signUpError ? {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name
        } : null
      });

      if (signUpError) {
        console.error('Erro detalhado do signUp:', {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name,
          stack: signUpError.stack,
          details: signUpError.details,
          hint: signUpError.hint
        });
        throw signUpError;
      }

      if (!user) {
        console.error('Usuário não foi criado - resposta vazia do Supabase');
        throw new Error('Erro ao criar usuário');
      }

      console.log('=== USUÁRIO CRIADO COM SUCESSO ===');
      console.log('Detalhes do usuário:', {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      });

      // Atualizar os dados do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name,
          phone
        }
      });

      if (updateError) {
        console.error('Erro ao atualizar dados do usuário:', updateError);
        throw updateError;
      }

      // Criar perfil do usuário
      console.log('=== TENTANDO CRIAR PERFIL ===');
      const profileToInsert = {
        id: user.id,
        user_id: user.id,
        name,
        phone,
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Dados do perfil sendo enviados:', profileToInsert);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([profileToInsert])
        .select();

      console.log('Resposta da criação do perfil:', {
        data: profileData,
        error: profileError ? {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        } : null
      });

      if (profileError) {
        console.error('Erro detalhado da criação do perfil:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
          stack: profileError.stack
        });
        throw new Error('Erro ao criar perfil do usuário');
      }

      console.log('=== PERFIL CRIADO COM SUCESSO ===');
      console.log('Dados do perfil criado:', profileData);

      navigate('/login', { 
        state: { 
          message: 'Conta criada com sucesso! Por favor, verifique seu email para confirmar o cadastro.' 
        }
      });
    } catch (error) {
      console.error('=== ERRO COMPLETO DO PROCESSO DE REGISTRO ===');
      console.error('Detalhes do erro:', {
        error,
        message: error.message,
        stack: error.stack,
        name: error.name,
        type: typeof error,
        isObject: error instanceof Object,
        keys: error instanceof Object ? Object.keys(error) : null
      });
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
      console.log('=== FIM DO PROCESSO DE REGISTRO ===');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
          <img
            src={logoUrl}
            alt="AmericanaFood"
            className="h-16 w-16 rounded-full shadow-lg"
          />
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
            AmericanaFood
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Crie sua conta para começar
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome completo
              </Label>
              <div className="mt-1">
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Seu nome completo"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone
              </Label>
              <div className="mt-1">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  placeholder="(99) 99999-9999"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Senha
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="rounded-md bg-gray-50 p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Requisitos da senha:
              </div>
              <div className="space-y-2">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center text-sm">
                    {req.met ? (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading || !isPasswordValid}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Criar Conta'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Faça login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 