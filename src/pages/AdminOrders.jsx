import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { CheckCircle } from 'lucide-react';

const AdminOrders = () => {
  const { orders, acceptOrder, rejectOrder, deleteOrder } = useContext(ShopContext);

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
        <h1>Recent Orders & Payments</h1>
      </header>

      <section className="admin-section">
          <div className="orders-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {orders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No orders found at the moment.</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="card order-card" style={{ borderLeft: order.status?.toLowerCase() === 'pending' ? '4px solid var(--warning)' : (order.status?.toLowerCase() === 'accepted' ? '4px solid var(--success)' : '4px solid var(--error)') }}>
                  
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>Order #{order.id}</h3>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatDate(order.timestamp)}</span>
                    </div>
                    <span className={`status-badge ${order.status?.toLowerCase() || 'pending'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                      {order.status}
                    </span>
                  </div>
                  
                  {/* Card Body */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    
                    {/* Section 1: Customer Details */}
                    <div className="order-customer-info">
                      <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer Details</h4>
                      
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                        {order.customer?.name}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '500' }}>
                        <span style={{ fontSize: '1.1rem' }}>📱</span> {order.customer?.phone}
                      </div>
                      
                      <div style={{ 
                        backgroundColor: 'var(--surface-variant)', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        fontSize: '0.9rem', 
                        lineHeight: '1.5',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DELIVERY ADDRESS:</div>
                        <div style={{ whiteSpace: 'pre-line' }}>{order.customer?.address}</div>
                        
                        {order.customer?.lat && order.customer?.lng && (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${order.customer.lat},${order.customer.lng}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ 
                              display: 'inline-block', 
                              marginTop: '0.75rem', 
                              fontSize: '0.8rem', 
                              fontWeight: 'bold', 
                              color: '#fff',
                              backgroundColor: '#4285F4', 
                              padding: '0.4rem 0.8rem', 
                              borderRadius: '4px',
                              textDecoration: 'none'
                            }}
                          >
                            📍 Open Location in Google Maps
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Section 2: Payment Details */}
                    <div className="order-payment-info">
                      <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Value & Payment</h4>
                      
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1rem' }}>
                        ₹{order.totalPrice?.toFixed(2)}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', backgroundColor: 'var(--surface-variant)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Method:</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{order.paymentMethod || 'N/A'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '0.5rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Transaction ID:</span>
                          <strong style={{ color: 'var(--primary)', letterSpacing: '1px' }}>{order.transactionId || 'N/A'}</strong>
                        </div>
                        
                        {order.paymentStatus === 'PAID' && (
                          <div style={{ 
                            color: '#000', 
                            backgroundColor: 'var(--success)', 
                            fontWeight: 'bold', 
                            marginTop: '0.5rem',
                            padding: '0.4rem',
                            borderRadius: '4px',
                            textAlign: 'center'
                          }}>
                            ✓ PAYMENT VERIFIED
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Section 3: Actions */}
                    <div className="order-actions-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Manage Order</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {order.status?.toLowerCase() === 'pending' ? (
                          <>
                            <button 
                              className="btn-primary" 
                              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                              onClick={() => acceptOrder(order.id)}
                            >
                              ✅ Accept Order
                            </button>
                            <button 
                              style={{ 
                                width: '100%', 
                                justifyContent: 'center', 
                                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                color: 'var(--error)', 
                                border: '1px solid var(--error)', 
                                padding: '0.85rem', 
                                borderRadius: '8px', 
                                fontWeight: 'bold', 
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onClick={() => rejectOrder(order.id)}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--error)', e.currentTarget.style.color = '#fff'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)', e.currentTarget.style.color = 'var(--error)'}
                            >
                              ❌ Reject Order
                            </button>
                          </>
                        ) : (
                          <a 
                            href={getWhatsAppLink(order)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ 
                              width: '100%', 
                              textAlign: 'center',
                              padding: '0.85rem', 
                              backgroundColor: '#25D366', 
                              color: '#fff', 
                              border: 'none', 
                              borderRadius: '8px', 
                              textDecoration: 'none',
                              fontWeight: 'bold',
                              display: 'block'
                            }}
                          >
                            💬 Notify Customer on WhatsApp
                          </a>
                        )}
                        
                        <button 
                          onClick={() => deleteOrder(order.id)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--text-secondary)', 
                            fontSize: '0.85rem', 
                            cursor: 'pointer', 
                            textDecoration: 'underline',
                            marginTop: '0.5rem',
                            padding: '0.5rem'
                          }}
                        >
                          🗑️ Delete Order Permanently
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      </section>
    </div>
  );
};

export default AdminOrders;
