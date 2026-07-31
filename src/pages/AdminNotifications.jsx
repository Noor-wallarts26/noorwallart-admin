import React, { useState } from 'react';
import { Bell, CheckCircle, Package, AlertTriangle, Info } from 'lucide-react';

const AdminNotifications = () => {
  // Mock notifications since we don't have a notifications collection yet
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'order', title: 'New Order Received', message: 'Order #ORD-8923 from John Doe.', time: '10 mins ago', read: false },
    { id: 2, type: 'alert', title: 'Low Stock Warning', message: 'Islamic Wall Art - Ayatul Kursi is running low on stock (2 left).', time: '1 hour ago', read: false },
    { id: 3, type: 'system', title: 'System Update', message: 'Admin panel was updated to v2.0 successfully.', time: '1 day ago', read: true },
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type) => {
    switch(type) {
      case 'order': return <Package size={20} className="text-primary" />;
      case 'alert': return <AlertTriangle size={20} style={{ color: '#ef4444' }} />;
      case 'system': return <Info size={20} style={{ color: '#3b82f6' }} />;
      default: return <Bell size={20} />;
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h1>Notifications</h1>
          <p className="text-muted">View alerts, system updates, and new activity.</p>
        </div>
        <button className="btn-outline" onClick={markAllAsRead}>
          <CheckCircle size={18} /> Mark all as read
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.length > 0 ? (
          <div className="notification-list">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  padding: '1.5rem', 
                  borderBottom: '1px solid var(--border-light)',
                  backgroundColor: notification.read ? 'transparent' : 'rgba(var(--primary-rgb), 0.03)',
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
                  {getIcon(notification.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: notification.read ? '500' : '600' }}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted">{notification.time}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginTop: '0.5rem' }} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
