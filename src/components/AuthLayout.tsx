import React from 'react';
import { LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function getLogoUrl() {
      if (!supabase) return;
      
      const { data } = await supabase.storage
        .from('site-assets')
        .getPublicUrl('logo.png');
      
      if (data?.publicUrl) {
        setLogoUrl(data.publicUrl);
      }
    }

    getLogoUrl();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 w-auto" />
          ) : (
            <LogIn className="w-10 h-10 text-blue-600" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">{title}</h2>
        {children}
      </div>
    </div>
  );
}