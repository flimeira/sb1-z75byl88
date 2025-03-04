import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Notification } from '../types/notification';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const sampleNotifications = [
  {
    restaurantId: "1",
    restaurantName: "Restaurante Italiano",
    restaurantImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&fit=crop",
    title: "Novo Pedido Recebido",
    content: "Seu pedido #123 foi recebido e está sendo preparado!"
  },
  {
    restaurantId: "2",
    restaurantName: "Pizzaria Express",
    restaurantImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop",
    title: "Promoção Especial",
    content: "Pizza grande com 30% de desconto hoje!"
  },
  {
    restaurantId: "3",
    restaurantName: "Sushi Master",
    restaurantImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&h=500&fit=crop",
    title: "Pedido Entregue",
    content: "Seu pedido #456 foi entregue com sucesso!"
  }
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  console.log('NotificationProvider mounted');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    console.log('Adding sample notifications');
    // Add sample notifications when the component mounts
    sampleNotifications.forEach(notification => {
      addNotification(notification);
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  console.log('Current unread count:', unreadCount);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 