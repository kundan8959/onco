import { useState } from 'react';
import { useNotifications } from '../context/NotificationsContext';

export default function NotificationBell() {
  const { notifications, unread, markRead, markAllRead, sendTest, loading } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="notification-shell">
      <button className="ghost-button notification-trigger" onClick={() => setOpen((value) => !value)}>
        <i className="fas fa-bell"></i>
        {unread > 0 && <span className="notification-badge">{unread}</span>}
      </button>

      {open && (
        <div className="notification-panel premium-notification-panel">
          <div className="notification-panel-header premium-notification-header">
            <div>
              <span className="eyebrow">Realtime updates</span>
              <strong>Notifications</strong>
              <p>{loading ? 'Refreshing…' : unread > 0 ? `${unread} unread · ${notifications.length} total` : `${notifications.length} items`}</p>
            </div>
            <div className="notification-panel-actions">
              <button className="ghost-button" onClick={() => sendTest()}>Test</button>
              <button className="ghost-button" onClick={() => markAllRead()}>Read all</button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 && <div className="notification-empty">No notifications yet.</div>}
            {notifications.map((item) => (
              <button
                key={item.id}
                className={`notification-item ${item.is_read ? 'read' : 'unread'} type-${item.type}`}
                onClick={() => markRead(item.id)}
              >
                <div className="notification-item-topline">
                  <span className={`badge ${item.is_read ? 'badge-secondary' : 'badge-info'}`}>{item.category}</span>
                  <span className="notification-time">{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <div className="notification-item-title">{item.title}</div>
                <div className="notification-item-message">{item.message}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
