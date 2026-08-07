import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Search, Filter, Download, Check, X, Truck, Package, Printer, FileText, Trash2, ExternalLink } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { printInvoice, printShippingLabel } from '../utils/invoiceTemplate';
import { sanitizeOrder, formatCurrency, formatDate } from '../utils/orderUtils';

const AdminOrders = () => {
  const { orders, updateOrderStatus, storeSettings } = useContext(ShopContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [isWiping, setIsWiping] = useState(false);

  const filteredOrders = orders.map(o => sanitizeOrder(o)).filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer.phone.includes(searchTerm) ||
                          order.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.razorpayOrderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || 
                           (paymentFilter === 'Paid' && order.paymentStatus.toLowerCase().includes('paid')) ||
                           (paymentFilter === 'Pending' && order.paymentStatus.toLowerCase().includes('pending')) ||
                           (paymentFilter === 'Failed' && order.paymentStatus.toLowerCase().includes('failed'));
    return matchesSearch && matchesStatus && matchesPayment;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const handleStatusChange = async (orderId, newStatus) => {
    if (updateOrderStatus) {
      await updateOrderStatus(orderId, newStatus);
    }
  };

  const wipeAllOrders = async () => {
    const confirmWipe = window.confirm("WARNING: Are you sure you want to delete ALL orders from the database? This cannot be undone.");
    if (!confirmWipe) return;

    const confirmTwice = window.confirm("Are you absolutely sure? This will wipe production data if connected to live DB.");
    if (!confirmTwice) return;

    setIsWiping(true);
    try {
      const ordersRef = collection(db, 'orders');
      const snapshot = await getDocs(ordersRef);
      
      const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, 'orders', document.id)));
      await Promise.all(deletePromises);
      
      alert(`Successfully deleted ${snapshot.size} orders. Order database is now clean.`);
      window.location.reload();
    } catch (err) {
      console.error("Error wiping orders:", err);
      alert("Error wiping orders: " + err.message);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <h1>Orders</h1>
        <div className="flex gap-4">
          <button className="btn-secondary">
            <Download size={18} />
            Export CSV
          </button>
          <button onClick={wipeAllOrders} disabled={isWiping} className="btn-danger flex items-center gap-2">
            <Trash2 size={18} />
            {isWiping ? 'Wiping DB...' : 'Reset Orders DB'}
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="admin-header-search" style={{ border: '1px solid var(--border-color)', margin: 0, width: '350px' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by Order ID, Customer Name, Phone, or TXN ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-muted" />
              <select 
                className="form-group" 
                style={{ marginBottom: 0, padding: '0.5rem 1rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Order Status</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Processing">Processing</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select 
                className="form-group" 
                style={{ marginBottom: 0, padding: '0.5rem 1rem' }}
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="All">All Payment Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex" style={{ flexDirection: 'column', gap: '1.5rem' }}>
        {filteredOrders.length === 0 ? (
          <div className="card text-center" style={{ padding: '4rem 2rem' }}>
            <Package size={48} className="text-muted" style={{ margin: '0 auto 1rem auto' }} />
            <h3 className="font-semibold text-primary mb-2">No Orders Found</h3>
            <p className="text-muted">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Order Header */}
              <div className="flex justify-between items-center" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-color)' }}>
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold m-0" style={{ fontSize: '1.125rem' }}>Order #{order.id}</h3>
                    <p className="text-muted m-0" style={{ fontSize: '0.875rem' }}>{formatDate(order.createdAt || order.timestamp)}</p>
                  </div>
                  <span className={`status-badge ${order.status?.toLowerCase() || 'pending'}`}>
                    {order.status || 'Pending'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => printInvoice(order, storeSettings)} className="btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} title="Print / Download Invoice">
                    <FileText size={16} />
                    Invoice (PDF)
                  </button>
                  <button onClick={() => printShippingLabel(order, storeSettings)} className="btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} title="Print / Download Shipping Label">
                    <Printer size={16} />
                    Label (A6)
                  </button>
                </div>
              </div>

              {/* Order Body */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', padding: '1.5rem' }}>
                
                {/* Customer & Shipping */}
                <div>
                  <h4 className="font-semibold mb-4 text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer & Delivery Details</h4>
                  <div style={{ marginBottom: '1rem' }}>
                    <p className="font-semibold m-0">{order.customer.name}</p>
                    <p className="m-0">📞 {order.customer.phone}</p>
                    {order.customer.email !== 'N/A' && <p className="m-0 text-muted">✉️ {order.customer.email}</p>}
                  </div>
                  
                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                    <p className="m-0" style={{ whiteSpace: 'pre-line' }}>🏠 {order.customer.fullAddress}</p>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h4 className="font-semibold mb-4 text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Information</h4>
                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted">Method</span>
                      <span className="font-semibold">{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted">Status</span>
                      <span className="font-semibold text-success">{order.paymentStatus}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted">Transaction ID</span>
                      <span className="font-semibold">{order.transactionId}</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.75rem 0' }} />
                    <div className="flex justify-between font-semibold" style={{ fontSize: '1rem', color: 'var(--primary)' }}>
                      <span>Grand Total</span>
                      <span>{formatCurrency(order.totalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Courier Selection & Shipping Partner */}
                <div>
                  <h4 className="font-semibold mb-4 text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Courier Service</h4>
                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.8rem', color: '#475569' }}>Select Courier Partner</label>
                    <select
                      value={order.courier || ''}
                      onChange={async (e) => {
                        const newCourier = e.target.value;
                        try {
                          await updateDoc(doc(db, 'orders', order.id), { courier: newCourier });
                        } catch (err) {
                          console.error("Error updating courier:", err);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">No Courier Selected</option>
                      <option value="Delhivery">Delhivery</option>
                      <option value="DTDC">DTDC</option>
                      <option value="ST Cargo">ST Cargo</option>
                      <option value="Professional Couriers">Professional Couriers</option>
                      <option value="Trackon">Trackon</option>
                      <option value="India Post">India Post</option>
                      <option value="Blue Dart">Blue Dart</option>
                      <option value="Shadowfax">Shadowfax</option>
                      <option value="Xpressbees">Xpressbees</option>
                      <option value="Ecom Express">Ecom Express</option>
                    </select>
                    {order.courier && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span>🚚 Assigned:</span> <span>{order.courier}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Update Actions */}
                <div>
                  <h4 className="font-semibold mb-4 text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Status</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} onClick={() => handleStatusChange(order.id, 'Accepted')}>
                      <Check size={16} className="text-success" /> Accept
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} onClick={() => handleStatusChange(order.id, 'Processing')}>
                      Processing
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} onClick={() => handleStatusChange(order.id, 'Packed')}>
                      <Package size={16} /> Packed
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} onClick={() => handleStatusChange(order.id, 'Shipped')}>
                      <Truck size={16} /> Shipped
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem', gridColumn: '1 / -1' }} onClick={() => handleStatusChange(order.id, 'Delivered')}>
                      Delivered
                    </button>
                    <button className="btn-danger" style={{ padding: '0.5rem', fontSize: '0.875rem', gridColumn: '1 / -1' }} onClick={() => handleStatusChange(order.id, 'Cancelled')}>
                      <X size={16} /> Cancel Order
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                <h4 className="font-semibold mb-4 text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ordered Items</h4>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <Package size={20} className="text-muted" style={{ margin: '10px' }} />
                                )}
                              </div>
                              <span className="font-medium">{item.title}</span>
                            </div>
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td className="font-semibold">{formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 1))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
