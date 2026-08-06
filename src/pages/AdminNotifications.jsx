import React, { useContext } from 'react';
import { Bell, CheckCircle, Package, AlertTriangle, Info } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';

const AdminNotifications = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useContext(ShopContext);

  const getIcon = (type) => {
    switch(type) {
      case 'order': return <Package size={20} className="text-primary" />;
      case 'alert': return <AlertTriangle size={20} style={{ color: '#ef4444' }} />;
      case 'system': return <Info size={20} style={{ color: '#3b82f6' }} />;
      default: return <Bell size={20} />;
    }
  };

  const formatNotifTime = (timestamp, createdAt) => {
    if (timestamp) {
      return new Date(timestamp).toLocaleString('en-IN', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
      });
    }
    if (createdAt) {
      return new Date(createdAt).toLocaleString('en-IN', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
      });
    }
    return 'Just now';
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h1>Notifications</h1>
          <p className="text-muted">Real-time store notifications, new orders, and alerts.</p>
        </div>
        <button className="btn-outline" onClick={markAllNotificationsAsRead}>
          <CheckCircle size={18} /> Mark all as read
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {notifications && notifications.length > 0 ? (
          <div className="notification-list">
            {notifications.map(notification => (
              <div 
                key={notification.id}
                onClick={() => markNotificationAsRead(notification.id)}
                style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  padding: '1.5rem', 
                  borderBottom: '1px solid var(--border-light)',
                  backgroundColor: notification.read ? 'transparent' : 'rgba(16, 185, 129, 0.06)',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--bg-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {getIcon(notification.type || 'order')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: notification.read ? '500' : '700' }}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted">{formatNotifTime(notification.timestamp, notification.createdAt)}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {notification.message}
                  </p>
                  {notification.customerPhone && (
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
                      📞 Customer Contact: {notification.customerPhone} | Payment: <span style={{ color: '#16A34A', fontWeight: 700 }}>{notification.paymentStatus || 'Paid ✅'}</span>
                    </div>
                  )}
                </div>
                {!notification.read && (
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', marginTop: '0.5rem', flexShrink: 0 }} title="Unread" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <h3>No notifications yet</h3>
            <p>New orders and system updates will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
