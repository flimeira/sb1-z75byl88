import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function RegistrationConfirmation({ email }: { email: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Verifique seu Email
              </h2>
              <p className="text-gray-600">
                Enviamos um link de confirmação para:
              </p>
              <p className="text-blue-600 font-medium mt-1">
                {email}
              </p>
              <p className="text-gray-600 mt-4">
                Por favor, clique no link enviado para confirmar seu email e ativar sua conta.
              </p>
            </div>

            <div className="mt-6">
              <Button
                className="w-full flex items-center justify-center space-x-2"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar para Login</span>
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              <p>Não recebeu o email?</p>
              <p className="mt-1">
                Verifique sua pasta de spam ou aguarde alguns minutos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 