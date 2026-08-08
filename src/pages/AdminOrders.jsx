import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Search, Filter, Download, Check, X, Truck, Package, Printer, FileText, Trash2, ListOrdered, CheckSquare, Square, History } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { printInvoice, printShippingLabel, printBatchShippingLabels } from '../utils/invoiceTemplate';
import { sanitizeOrder, formatCurrency, formatDate } from '../utils/orderUtils';
import BulkOrderManagementModal from '../components/BulkOrderManagementModal';

const AdminOrders = () => {
  const { orders, updateOrderStatus, storeSettings } = useContext(ShopContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [isWiping, setIsWiping] = useState(false);

  // Bulk Order Status Modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Selection state for Batch Label Printing
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Filtered orders list for order management table
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

  // Accepted orders ready/pending for label printing
  const acceptedOrders = orders
    .map(o => sanitizeOrder(o))
    .filter(o => (o.status || '').toLowerCase() === 'accepted')
    .sort((a, b) => b.timestamp - a.timestamp);

  const toggleSelectOrder = (id) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllAccepted = () => {
    setSelectedOrderIds(acceptedOrders.map(o => o.id));
  };

  const handleUnselectAllAccepted = () => {
    setSelectedOrderIds([]);
  };

  const handlePrintSelectedLabels = async () => {
    const ordersToPrint = acceptedOrders.filter(o => selectedOrderIds.includes(o.id));
    if (ordersToPrint.length === 0) {
      alert("Please select at least one accepted order to print.");
      return;
    }

    try {
      const updatePromises = ordersToPrint.map(o =>
        updateDoc(doc(db, 'orders', o.id), {
          labelStatus: 'Printed',
          labelPrintedAt: Date.now()
        })
      );
      await Promise.all(updatePromises);
    } catch (err) {
      console.error("Error updating label status:", err);
    }

    printBatchShippingLabels(ordersToPrint, storeSettings);
  };

  const handlePrintAllLabels = async () => {
    if (acceptedOrders.length === 0) {
      alert("No accepted orders available for batch label printing.");
      return;
    }

    const allAcceptedIds = acceptedOrders.map(o => o.id);
    setSelectedOrderIds(allAcceptedIds);

    try {
      const updatePromises = acceptedOrders.map(o =>
        updateDoc(doc(db, 'orders', o.id), {
          labelStatus: 'Printed',
          labelPrintedAt: Date.now()
        })
      );
      await Promise.all(updatePromises);
    } catch (err) {
      console.error("Error updating label status:", err);
    }

    printBatchShippingLabels(acceptedOrders, storeSettings);
  };

  const handlePrintIndividualLabel = async (order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        labelStatus: 'Printed',
        labelPrintedAt: Date.now()
      });
    } catch (err) {
      console.error("Error updating label status:", err);
    }
    printShippingLabel(order, storeSettings);
  };

  const sanitizePhoneForWhatsApp = (phoneStr) => {
    if (!phoneStr) return null;
    let digits = String(phoneStr).replace(/\D/g, '');
    if (!digits) return null;

    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    if (digits.length === 10) {
      return `91${digits}`;
    }

    if (digits.length === 12 && digits.startsWith('91')) {
      return digits;
    }

    if (digits.length > 10) {
      return digits.startsWith('91') ? digits : `91${digits}`;
    }

    return null;
  };

  const getFormattedProductsList = (items) => {
    if (!Array.isArray(items) || items.length === 0) return 'Product Item';
    return items
      .map(item => {
        const title = (item.title || item.name || 'Product').trim();
        const qty = item.quantity || 1;
        return `${title} (x${qty})`;
      })
      .join(', ');
  };

  const handleStatusChangeWithNotification = async (order, newStatus) => {
    if (order.status === newStatus) {
      alert(`Order #${order.id} is already in status: ${newStatus}`);
      return;
    }

    // Check duplicate notification prevention
    const waHistory = order.waHistory || {};
    const alreadySentWA = waHistory[newStatus]?.status === 'Sent';

    // 1. Save updated status in Firestore database
    try {
      const updatePayload = {
        status: newStatus,
        lastNotificationStatus: newStatus,
        updatedAt: Date.now()
      };

      if (newStatus === 'Accepted' && !order.labelStatus) {
        updatePayload.labelStatus = 'Pending';
      }

      await updateDoc(doc(db, 'orders', order.id), updatePayload);

      if (updateOrderStatus) {
        await updateOrderStatus(order.id, newStatus);
      }
    } catch (err) {
      console.error("Error updating status in DB:", err);
      alert("Failed to update status in database: " + err.message);
      return;
    }

    // 2. Prepare WhatsApp Notification if not already sent
    if (alreadySentWA) {
      alert(`Order #${order.id} updated to ${newStatus}. Note: WhatsApp notification was already sent previously for this status.`);
      return;
    }

    const waNumber = sanitizePhoneForWhatsApp(order.customer?.phone);
    if (!waNumber) {
      alert(`Order status updated to ${newStatus}. Note: Customer WhatsApp number is missing or invalid.`);
      return;
    }

    const customerName = (order.customer?.name && order.customer.name !== 'N/A' ? order.customer.name : 'Customer').trim();
    const orderId = order.id || 'N/A';
    const productsText = getFormattedProductsList(order.items);
    const amountVal = order.totalPrice !== undefined && order.totalPrice !== null ? order.totalPrice : 0;
    const courierName = (order.courier && typeof order.courier === 'string' && order.courier !== 'N/A' && order.courier !== 'undefined' && order.courier !== 'null') ? order.courier.trim() : '';
    const supportNumber = '+91 89253 25330';

    const siteUrl = storeSettings?.domain || 'https://noorkarts.in';
    let message = '';
    if (newStatus === 'Accepted') {
      message = `Hello ${customerName}!\n\nYour order has been accepted successfully.\n\nOrder ID: #${orderId}\n\nWe’ll process your order shortly.`;
    } else if (newStatus === 'Processing') {
      message = `Hello ${customerName}!\n\nYour order is now being processed.\n\nOrder ID: #${orderId}`;
    } else if (newStatus === 'Packed') {
      message = `Hello ${customerName}!\n\nYour order has been packed and is ready to ship.\n\nOrder ID: #${orderId}`;
    } else if (newStatus === 'Shipped') {
      const courierLine = courierName ? `\n\nShipped via: ${courierName}` : '';
      message = `Hello ${customerName}!\n\nYour order has been shipped successfully.\n\nOrder ID: #${orderId}${courierLine}`;
    } else if (newStatus === 'Delivered') {
      message = `Hello ${customerName}!\n\nYour order has been delivered successfully.\n\nOrder ID: #${orderId}\nProduct: ${productsText}\nAmount: ₹${amountVal}\n\nVisit Again:\n${siteUrl}\n\nThank you for shopping with Noor Karts.`;
    } else if (newStatus === 'Cancelled') {
      message = `Hello ${customerName}!\n\nYour order #${orderId} has been cancelled.\n\nIf you have any questions or need assistance, please contact our customer support:\n\nContact: ${supportNumber}\n\nThank you for choosing Noor Karts.`;
    } else {
      message = `Hello ${customerName}!\n\nYour order status has been updated to ${newStatus}.\n\nOrder ID: #${orderId}`;
    }

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/${waNumber}?text=${encodedText}`;

    window.open(waUrl, '_blank');

    // Update waHistory in Firestore Document
    try {
      const updatedHistory = {
        ...waHistory,
        [newStatus]: {
          status: 'Sent',
          timestamp: Date.now(),
          message
        }
      };
      await updateDoc(doc(db, 'orders', order.id), {
        waHistory: updatedHistory,
        lastWhatsAppStatus: 'Sent',
        lastWhatsAppSentAt: Date.now()
      });
    } catch (e) {
      console.error("Error saving waHistory:", e);
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
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="btn-primary flex items-center gap-2"
            style={{ fontWeight: 700, boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
          >
            <ListOrdered size={18} />
            📋 Order Status for Recent Orders
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download size={18} />
            Export CSV
          </button>
          <button onClick={wipeAllOrders} disabled={isWiping} className="btn-danger flex items-center gap-2">
            <Trash2 size={18} />
            {isWiping ? 'Wiping DB...' : 'Reset Orders DB'}
          </button>
        </div>
      </div>

      {/* BULK ORDER MANAGEMENT MODAL VIEW */}
      <BulkOrderManagementModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        orders={orders}
        updateOrderStatus={updateOrderStatus}
      />

      {/* BATCH LABEL PRINTING SECTION */}
      <div className="card mb-4" style={{ border: '1.5px solid var(--border-color)', backgroundColor: 'var(--card-bg, #ffffff)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Printer size={20} color="var(--primary)" />
              Label Printing System (Accepted Orders)
            </h3>
            <p className="text-muted text-xs" style={{ margin: 0 }}>
              Accepted Orders Pending Label Printing: <strong style={{ color: 'var(--primary)' }}>{acceptedOrders.length}</strong>
            </p>
          </div>

          {acceptedOrders.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleSelectAllAccepted}
                className="btn-outline"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                Select All ({acceptedOrders.length})
              </button>
              <button
                type="button"
                onClick={handleUnselectAllAccepted}
                className="btn-outline"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                Unselect All
              </button>
              <button
                type="button"
                onClick={handlePrintSelectedLabels}
                disabled={selectedOrderIds.length === 0}
                className="btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Printer size={16} />
                Print Selected Labels ({selectedOrderIds.length})
              </button>
              <button
                type="button"
                onClick={handlePrintAllLabels}
                className="btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Printer size={16} />
                Print All Labels
              </button>
            </div>
          )}
        </div>

        {/* CHECKBOX SELECTION LIST OF ACCEPTED ORDERS */}
        {acceptedOrders.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
            {acceptedOrders.map(order => {
              const isSelected = selectedOrderIds.includes(order.id);
              const isPrinted = order.labelStatus === 'Printed';
              return (
                <label
                  key={order.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.05)' : '#FAF9F6',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectOrder(order.id)}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="font-semibold" style={{ fontSize: '0.85rem' }}>#{order.id}</span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: isPrinted ? '#DEF7EC' : '#FEF08A',
                          color: isPrinted ? '#03543F' : '#713F12'
                        }}
                      >
                        {isPrinted ? 'Printed' : 'Pending'}
                      </span>
                    </div>
                    <span className="text-muted text-xs block truncate" style={{ fontSize: '0.75rem' }}>
                      {order.customer?.name}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '0.75rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            No accepted orders currently pending batch label printing. Click <strong>Accept</strong> on an order to queue it here.
          </div>
        )}
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
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: order.labelStatus === 'Printed' ? '#DEF7EC' : '#F3E8FF',
                      color: order.labelStatus === 'Printed' ? '#03543F' : '#6B21A8',
                      border: `1px solid ${order.labelStatus === 'Printed' ? '#84E1BC' : '#D8B4FE'}`
                    }}
                  >
                    {order.labelStatus === 'Printed' ? 'Label Printed ✅' : 'Label Pending 📦'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => printInvoice(order, storeSettings)} className="btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} title="Print / Download Invoice">
                    <FileText size={16} />
                    Invoice (PDF)
                  </button>
                  <button onClick={() => handlePrintIndividualLabel(order)} className="btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} title="Print / Download Shipping Label">
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
                    <button className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} onClick={() => handleStatusChangeWithNotification(order, 'Accepted')}>
                      <Check size={16} className="text-success" /> Accept
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} onClick={() => handleStatusChangeWithNotification(order, 'Processing')}>
                      Processing
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} onClick={() => handleStatusChangeWithNotification(order, 'Packed')}>
                      <Package size={16} /> Packed
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem' }} onClick={() => handleStatusChangeWithNotification(order, 'Shipped')}>
                      <Truck size={16} /> Shipped
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.5rem', fontSize: '0.875rem', gridColumn: '1 / -1' }} onClick={() => handleStatusChangeWithNotification(order, 'Delivered')}>
                      Delivered
                    </button>
                    <button className="btn-danger" style={{ padding: '0.5rem', fontSize: '0.875rem', gridColumn: '1 / -1' }} onClick={() => handleStatusChangeWithNotification(order, 'Cancelled')}>
                      <X size={16} /> Cancel Order
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Status History Timeline & Notification Log */}
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#FAF9F6', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                <h4 className="font-semibold text-muted mb-2" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <History size={14} /> Status History & Notification Log
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {['Accepted', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map(st => {
                    const historyItem = order.waHistory?.[st];
                    const isCurrent = order.status === st;
                    const isCompleted = historyItem?.status === 'Sent' || isCurrent;
                    if (!isCompleted && !historyItem) return null;

                    return (
                      <div key={st} style={{ backgroundColor: '#ffffff', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 700, color: isCurrent ? 'var(--primary)' : '#475569' }}>{st}:</span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{formatDate(historyItem?.timestamp || order.updatedAt || order.timestamp)}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: historyItem?.status === 'Sent' ? '#16a34a' : '#d97706' }}>
                          {historyItem?.status === 'Sent' ? 'WhatsApp Sent ✅' : 'Updated'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Items Table */}
              <div style={{ padding: '1.5rem' }}>
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
