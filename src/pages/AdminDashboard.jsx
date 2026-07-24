import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Package, IndianRupee, Clock, CheckCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { orders, products, acceptOrder, deleteOrder } = useContext(ShopContext);

  const totalRevenue = orders
    .filter(o => o.status === 'Accepted' || o.status === 'Completed' || o.status === 'Processing')
    .reduce((sum, order) => sum + order.totalPrice, 0);

  const pendingOrders = orders.filter(o => o.status?.toLowerCase() === 'pending');

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getWhatsAppLink = (order) => {
    const phone = order.customer?.phone || '';
    if (!phone) return '#';
    // Format to 91XXXXXXXXXX
    const formattedPhone = phone.replace(/\D/g, '');
    const finalPhone = formattedPhone.length === 10 ? '91' + formattedPhone : formattedPhone;
    
    const message = `Hello ${order.customer?.name},\n\nThank you for your order (#${order.id}) from Noor Wall Arts! We have successfully received your payment of ₹${order.totalPrice.toFixed(2)}. Your order is now confirmed and we will process it shortly.\n\nThank you!`;
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="admin-page animate-fade-in">
      <header className="admin-page-header">
        <h1>Dashboard</h1>
      </header>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Total Revenue</h3>
            <IndianRupee size={20} color="var(--primary)" />
          </div>
          <p className="stat-value">₹{totalRevenue.toFixed(2)}</p>
        </div>
        
        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Total Orders</h3>
            <Package size={20} color="var(--primary)" />
          </div>
          <p className="stat-value">{orders.length}</p>
        </div>

        <div className="admin-stat-card" style={{ borderColor: pendingOrders.length > 0 ? 'var(--warning)' : 'var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: pendingOrders.length > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>Pending Verification</h3>
            <Clock size={20} color={pendingOrders.length > 0 ? "var(--warning)" : "var(--text-secondary)"} />
          </div>
          <p className="stat-value" style={{ color: pendingOrders.length > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>{pendingOrders.length}</p>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
