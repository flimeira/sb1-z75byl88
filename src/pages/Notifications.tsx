import { useNotifications } from '../contexts/NotificationContext';
import { NotificationCard } from '../components/NotificationCard';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function Notifications() {
  const { notifications, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Marcar todas como lidas
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhuma notificação encontrada
          </p>
        ) : (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
            />
          ))
        )}
      </div>
    </div>
  );
} 