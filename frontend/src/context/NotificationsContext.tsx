import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createNotificationSocket, notificationsApi } from '../api';
import { useAuth } from './AuthContext';

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  category: string;
  action_url?: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationsContextType = {
  notifications: NotificationItem[];
  unread: number;
  loading: boolean;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  sendTest: () => Promise<void>;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unread: 0,
  loading: false,
  markRead: async () => {},
  markAllRead: async () => {},
  sendTest: async () => {},
  refresh: async () => {},
});

export const useNotifications = () => useContext(NotificationsContext);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.unreadCount(),
      ]);
      setNotifications(listRes.data || []);
      setUnread(countRes.data?.unread || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.username) return;
    refresh();
    const socket = createNotificationSocket(user.username);
    socket.emit('notifications:join', { username: user.username });
    socket.on('notification:new', (item: NotificationItem) => {
      setNotifications((prev) => [item, ...prev].slice(0, 50));
    });
    socket.on('notification:unread_count', (payload: { unread: number }) => {
      setUnread(payload?.unread || 0);
    });
    return () => {
      socket.disconnect();
    };
  }, [user?.username]);

  const markRead = async (id: number) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, is_read: true } : item));
    setUnread((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setUnread(0);
  };

  const sendTest = async () => {
    await notificationsApi.test({ channel: 'both' });
  };

  const value = useMemo(() => ({ notifications, unread, loading, markRead, markAllRead, sendTest, refresh }), [notifications, unread, loading]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
