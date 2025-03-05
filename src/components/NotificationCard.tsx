import { Notification } from '../types/notification';
import { useNotifications } from '../contexts/NotificationContext';
import { Heart } from 'lucide-react';
import { useState } from 'react';

interface NotificationCardProps {
  notification: Notification;
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const { markAsRead } = useNotifications();
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Previne que a notificação seja marcada como lida ao clicar no coração
    setIsFavorite(!isFavorite);
  };

  return (
    <div
      className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        notification.read ? 'bg-white' : 'bg-blue-50'
      }`}
      onClick={() => markAsRead(notification.id)}
    >
      <div className="flex items-start space-x-4">
        <img
          src={notification.restaurantImage}
          alt={notification.restaurantName}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{notification.restaurantName}</h3>
            <button
              onClick={handleFavorite}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Favoritar restaurante"
            >
              <Heart
                size={24}
                strokeWidth={2}
                className={isFavorite ? 'text-red-500' : 'text-gray-400'}
              />
            </button>
          </div>
          <h4 className="text-lg font-medium text-gray-800 mt-1">{notification.title}</h4>
          <p className="text-gray-600 mt-2">{notification.content}</p>
          <p className="text-sm text-gray-500 mt-2">
            {new Date(notification.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
} 