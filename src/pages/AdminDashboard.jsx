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

      <section className="admin-section" style={{ marginTop: '3rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Recent Orders & Payments</h2>
        <div className="card admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID & Date</th>
                <th>Customer</th>
                <th>Payment Info</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No orders found</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>#{order.id}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>{formatDate(order.timestamp)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{order.customer?.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.customer?.phone}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>Method: <strong>{order.paymentMethod || 'N/A'}</strong></div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '2px' }}>Txn ID: {order.transactionId || 'N/A'}</div>
                      {order.paymentStatus === 'PAID' && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px', fontWeight: 'bold' }}>✓ PAID</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>₹{order.totalPrice.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {order.status?.toLowerCase() === 'pending' ? (
                        <button 
                          className="btn-primary" 
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          onClick={() => acceptOrder(order.id)}
                        >
                          Verify & Mark PAID
                        </button>
                      ) : (
                        <a 
                          href={getWhatsAppLink(order)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary" 
                          style={{ 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.85rem', 
                            backgroundColor: '#25D366', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '8px', 
                            display: 'inline-block',
                            textDecoration: 'none'
                          }}
                        >
                          Notify via WhatsApp
                        </a>
                      )}
                      <div style={{ marginTop: '0.5rem' }}>
                        <button 
                          onClick={() => deleteOrder(order.id)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--error)', 
                            fontSize: '0.8rem', 
                            cursor: 'pointer', 
                            textDecoration: 'underline' 
                          }}
                        >
                          Delete Order
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
