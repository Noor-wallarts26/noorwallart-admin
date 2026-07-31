import React, { useContext, useState, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import { TrendingUp, Users, MapPin, IndianRupee } from 'lucide-react';

const AdminSales = () => {
  const { orders } = useContext(ShopContext);
  
  // Default to today (YYYY-MM-DD)
  const today = new Date();
  // Adjust for local timezone offset manually to avoid UTC date mismatch
  const todayString = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState(todayString);

  // Filter orders by selected date
  const dailyOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order.timestamp) return false;
      const orderDate = new Date(order.timestamp);
      const orderDateString = new Date(orderDate.getTime() - (orderDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      return orderDateString === selectedDate;
    });
  }, [orders, selectedDate]);

  // Calculate metrics
  const totalRevenue = dailyOrders.reduce((sum, order) => {
    // Only count non-rejected orders in revenue
    if (order.status?.toLowerCase() !== 'rejected') {
      return sum + (order.totalPrice || 0);
    }
    return sum;
  }, 0);

  const totalProductsSold = dailyOrders.reduce((sum, order) => {
    if (order.status?.toLowerCase() !== 'rejected') {
      const itemCount = order.items?.reduce((c, item) => c + (item.quantity || 1), 0) || 0;
      return sum + itemCount;
    }
    return sum;
  }, 0);

  return (
    <div className="admin-page animate-fade-in">
      <header className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Daily Sales Report</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Track revenue, products sold, and customer details per day.</p>
        </div>
        <div>
          <label style={{ marginRight: '1rem', fontWeight: 'bold' }}>Select Date:</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ 
              padding: '0.75rem', 
              borderRadius: '8px', 
              border: '1px solid var(--primary)', 
              backgroundColor: 'var(--surface-variant)', 
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-family)',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
        </div>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}>
            <IndianRupee size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Revenue</p>
            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>₹{totalRevenue.toFixed(2)}</h2>
          </div>
        </div>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', color: '#10b981' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Products Sold</p>
            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{totalProductsSold}</h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%', color: '#3b82f6' }}>
            <Users size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Orders</p>
            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{dailyOrders.length}</h2>
          </div>
        </div>
      </div>

      {/* Daily Orders Table */}
      <section className="admin-section">
        <h2 style={{ marginBottom: '1rem' }}>Orders for {new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</h2>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>City / District</th>
                <th>Products Ordered</th>
                <th>Amount</th>
                <th>Txn ID (Ref)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dailyOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No sales recorded for this date.
                  </td>
                </tr>
              ) : (
                dailyOrders.map(order => (
                  <tr key={order.id} style={{ opacity: order.status?.toLowerCase() === 'rejected' ? 0.6 : 1 }}>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{order.customer?.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.customer?.phone}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={14} color="var(--primary)" />
                        {order.customer?.district || order.customer?.area || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.85rem' }}>
                        {order.items?.map((item, idx) => (
                          <li key={idx}>{item.title} <span style={{ color: 'var(--primary)' }}>x{item.quantity}</span></li>
                        ))}
                      </ul>
                    </td>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>₹{order.totalPrice?.toFixed(2)}</td>
                    <td>
                      {order.transactionId ? (
                        <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--surface-variant)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                          {order.transactionId}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${order.status?.toLowerCase()}`}>
                        {order.status}
                      </span>
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

export default AdminSales;
