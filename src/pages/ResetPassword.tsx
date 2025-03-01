import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthLayout } from '../components/AuthLayout';

export function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Cliente Supabase não foi inicializado');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Verifique seu E-mail">
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Enviamos as instruções de recuperação de senha para {email}. Por favor, verifique seu e-mail para continuar.
          </p>
          <Link
            to="/signin"
            className="text-blue-600 hover:text-blue-500 font-medium flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Recuperar Senha">
      <form onSubmit={handleResetPassword} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <p className="text-gray-600 mb-4">
            Digite seu e-mail e enviaremos as instruções para recuperar sua senha.
          </p>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Enviar Instruções'}
        </button>

        <Link
          to="/signin"
          className="block text-center text-sm text-gray-600 hover:text-gray-900"
        >
          <span className="flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o Login
          </span>
        </Link>
      </form>
    </AuthLayout>
  );
}