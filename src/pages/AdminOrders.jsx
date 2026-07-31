import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Search, Filter, Download, Check, X, Truck, Package, Printer, FileText, AlertTriangle, Trash2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const AdminOrders = () => {
  const { orders, updateOrderStatus } = useContext(ShopContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isWiping, setIsWiping] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.includes(searchTerm) || 
                          order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer?.phone?.includes(searchTerm) ||
                          order.transactionId?.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (updateOrderStatus) {
      await updateOrderStatus(orderId, newStatus);
    }
  };

  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #EEE; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; }
            .invoice-details { text-align: right; }
            .billing { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { padding: 12px; border-bottom: 1px solid #EEE; text-align: left; }
            .table th { background-color: #F8F9FA; }
            .totals { width: 300px; margin-left: auto; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals-row.grand { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 12px; }
            .footer { margin-top: 50px; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">Noor Wall Arts</div>
              <p>Email: support@noorwallarts.com<br>Phone: +91 89253 25330</p>
            </div>
            <div class="invoice-details">
              <h2>INVOICE</h2>
              <p>Order #: ${order.id}<br>Date: ${formatDate(order.createdAt || order.timestamp)}</p>
              <p>Payment: UPI (${order.transactionId || 'N/A'})</p>
            </div>
          </div>
          
          <div class="billing">
            <div>
              <h3>Billed To:</h3>
              <p>
                <strong>${order.customer?.name}</strong><br>
                ${order.customer?.address}<br>
                ${order.customer?.city ? order.customer.city + ',' : ''} ${order.customer?.state || ''} ${order.customer?.pincode || ''}<br>
                Phone: ${order.customer?.phone}
              </p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.items?.map(item => `
                <tr>
                  <td>${item.title}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price?.toFixed(2)}</td>
                  <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>₹${(order.totalPrice - (order.deliveryCharge || 80)).toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>Shipping:</span>
              <span>₹${(order.deliveryCharge || 80).toFixed(2)}</span>
            </div>
            <div class="totals-row grand">
              <span>Total Paid:</span>
              <span>₹${order.totalPrice?.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            Thank you for shopping with Noor Wall Arts!
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
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
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Processing">Processing</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
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
                  <button onClick={() => handlePrintInvoice(order)} className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} title="Print Invoice">
                    <FileText size={16} />
                    Invoice
                  </button>
                  <button onClick={() => handlePrintInvoice(order)} className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} title="Print Shipping Label">
                    <Printer size={16} />
                    Label
                  </button>
                </div>
              </div>

              {/* Order Body */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', padding: '1.5rem' }}>
                
                {/* Customer & Shipping */}
                <div>
                  <h4 className="font-semibold mb-4 text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer & Delivery Details</h4>
                  <div style={{ marginBottom: '1rem' }}>
                    <p className="font-semibold m-0">{order.customer?.name}</p>
                    <p className="m-0">{order.customer?.phone}</p>
                    {order.customer?.email && <p className="m-0 text-muted">{order.customer?.email}</p>}
                  </div>
                  
                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                    <p className="m-0" style={{ whiteSpace: 'pre-line' }}>{order.customer?.address}</p>
                    {order.customer?.landmark && <p className="m-0 mt-2"><strong>Landmark:</strong> {order.customer.landmark}</p>}
                    <p className="m-0 mt-2">
                      {order.customer?.city && <span>{order.customer.city}, </span>}
                      {order.customer?.state && <span>{order.customer.state} </span>}
                      {order.customer?.pincode && <strong>{order.customer.pincode}</strong>}
                    </p>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h4 className="font-semibold mb-4 text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Information</h4>
                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted">Method</span>
                      <span className="font-semibold">UPI Online Payment</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted">Status</span>
                      <span className="font-semibold text-success">Verified</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted">Transaction ID</span>
                      <span className="font-semibold">{order.transactionId || 'N/A'}</span>
                    </div>
                    {order.upiRef && (
                      <div className="flex justify-between mb-2">
                        <span className="text-muted">UPI Ref</span>
                        <span className="font-semibold">{order.upiRef}</span>
                      </div>
                    )}
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.75rem 0' }} />
                    <div className="flex justify-between font-semibold" style={{ fontSize: '1rem', color: 'var(--primary)' }}>
                      <span>Total Paid</span>
                      <span>₹{order.totalPrice?.toFixed(2)}</span>
                    </div>
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
                          <td>₹{item.price?.toFixed(2)}</td>
                          <td>{item.quantity}</td>
                          <td className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</td>
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
