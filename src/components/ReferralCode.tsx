import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

export function ReferralCode() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const referralCode = user?.id.slice(0, 8).toUpperCase();
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indique Amigos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Compartilhe seu código de indicação com amigos e ganhe pontos quando eles se cadastrarem!
            </p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-2 bg-gray-50 rounded-md text-sm font-mono">
                {referralCode}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Ou compartilhe seu link de indicação:
            </p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-2 bg-gray-50 rounded-md text-sm truncate">
                {referralLink}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 