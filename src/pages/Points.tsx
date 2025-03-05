import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReferralCode } from '../components/ReferralCode';

interface PointsConfig {
  points_expiration_days: number;
  points_per_order: number;
  points_per_review: number;
  points_per_referral: number;
}

interface UserPoints {
  total_points: number;
  points_expiration_date: string;
}

interface PointsHistory {
  id: string;
  points: number;
  action_type: string;
  description: string;
  created_at: string;
}

export function Points() {
  const { user } = useAuth();
  const [config, setConfig] = useState<PointsConfig | null>(null);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPointsData();
    }
  }, [user]);

  async function fetchPointsData() {
    try {
      setLoading(true);

      // Buscar configuração
      const { data: configData, error: configError } = await supabase
        .from('points_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (configError) throw configError;
      setConfig(configData);

      // Buscar pontos do usuário
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') throw pointsError;
      setUserPoints(pointsData || { total_points: 0, points_expiration_date: new Date().toISOString() });

      // Buscar histórico
      const { data: historyData, error: historyError } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;
      setHistory(historyData || []);
    } catch (error) {
      console.error('Error fetching points data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getActionIcon(actionType: string) {
    switch (actionType) {
      case 'order':
        return '🛍️';
      case 'review':
        return '⭐';
      case 'referral':
        return '👥';
      case 'expiration':
        return '⏰';
      default:
        return '📝';
    }
  }

  function getActionColor(actionType: string) {
    switch (actionType) {
      case 'order':
        return 'text-green-500';
      case 'review':
        return 'text-yellow-500';
      case 'referral':
        return 'text-blue-500';
      case 'expiration':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Programa de Pontos</h1>

      {/* Card de Pontos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seus Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-2">
            {userPoints?.total_points || 0} pontos
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Expira em: {format(new Date(userPoints?.points_expiration_date || new Date()), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
          <Progress 
            value={(userPoints?.total_points || 0) / 100} 
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Card de Como Ganhar Pontos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Como Ganhar Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🛍️</span>
              <div>
                <div className="font-medium">Realizar Pedidos</div>
                <div className="text-sm text-gray-500">{config?.points_per_order} pontos por pedido</div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">⭐</span>
              <div>
                <div className="font-medium">Avaliar Pedidos</div>
                <div className="text-sm text-gray-500">{config?.points_per_review} pontos por avaliação</div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">👥</span>
              <div>
                <div className="font-medium">Indicar Amigos</div>
                <div className="text-sm text-gray-500">{config?.points_per_referral} pontos por indicação</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Indicação */}
      <ReferralCode className="mb-6" />

      {/* Histórico de Pontos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getActionIcon(item.action_type)}</span>
                  <div>
                    <div className={`font-medium ${getActionColor(item.action_type)}`}>
                      {item.description}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(item.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </div>
                <div className={`font-bold ${item.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {item.points > 0 ? '+' : ''}{item.points}
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                Nenhum histórico de pontos encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 