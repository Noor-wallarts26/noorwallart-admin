import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Package, IndianRupee, Clock, CheckCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { orders, products, acceptOrder } = useContext(ShopContext);

  const totalRevenue = orders
    .filter(o => o.status === 'Accepted' || o.status === 'Completed' || o.status === 'Processing')
    .reduce((sum, order) => sum + order.totalPrice, 0);

  const pendingOrders = orders.filter(o => o.status === 'Pending');

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
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
            <h3 style={{ color: pendingOrders.length > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>Pending Orders</h3>
            <Clock size={20} color={pendingOrders.length > 0 ? "var(--warning)" : "var(--text-secondary)"} />
          </div>
          <p className="stat-value" style={{ color: pendingOrders.length > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>{pendingOrders.length}</p>
        </div>
      </div>

      <section className="admin-section" style={{ marginTop: '3rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Recent Orders</h2>
        <div className="card admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No orders found</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 'bold' }}>#{order.id}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{formatDate(order.timestamp)}</td>
                    <td>
                      <div>{order.customer?.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.customer?.phone}</div>
                    </td>
                    <td style={{ maxWidth: '200px', fontSize: '0.85rem' }}>{order.itemsSummary}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>₹{order.totalPrice.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {order.status === 'Pending' ? (
                        <button 
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          onClick={() => acceptOrder(order.id)}
                        >
                          <CheckCircle size={14} /> Accept
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>-</span>
                      )}
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
