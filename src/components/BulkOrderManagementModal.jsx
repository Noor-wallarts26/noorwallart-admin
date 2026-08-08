import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Check, Package, Truck, Clock, AlertTriangle, RefreshCw, CheckCircle, AlertCircle, Play, Pause, Square, CheckSquare } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { sanitizeOrder, formatCurrency, formatDate } from '../utils/orderUtils';

const COURIER_OPTIONS = [
  'Delhivery',
  'DTDC',
  'Blue Dart',
  'ST Cargo',
  'Professional Couriers',
  'Trackon',
  'India Post',
  'Shadowfax',
  'Xpressbees',
  'Ecom Express'
];

const VALID_TRANSITIONS = {
  'Accepted': ['Pending'],
  'Processing': ['Accepted'],
  'Packed': ['Processing'],
  'Shipped': ['Packed'],
  'Delivered': ['Shipped'],
  'Cancelled': ['Pending', 'Accepted', 'Processing', 'Packed']
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

const generateWhatsAppMessage = (newStatus, order, courierName = '') => {
  const customerName = (order.customer?.name && order.customer.name !== 'N/A' ? order.customer.name : 'Customer').trim();
  const orderId = order.id || 'N/A';
  const productsText = getFormattedProductsList(order.items);
  const amountVal = order.totalPrice !== undefined && order.totalPrice !== null ? order.totalPrice : 0;
  const supportNumber = '+91 89253 25330';

  if (newStatus === 'Accepted') {
    return `🎉 Hello ${customerName}!\n\nYour order has been accepted successfully. ✅\n\nOrder ID: #${orderId}\n\nWe’ll process your order shortly.`;
  } else if (newStatus === 'Processing') {
    return `⚙️ Hello ${customerName}!\n\nYour order is now being processed.\n\nOrder ID: #${orderId}`;
  } else if (newStatus === 'Packed') {
    return `📦 Hello ${customerName}!\n\nYour order has been packed and is ready to ship. ✅\n\nOrder ID: #${orderId}`;
  } else if (newStatus === 'Shipped') {
    const courierLine = courierName ? `\n\nShipped via: ${courierName}` : '';
    return `🚚 Hello ${customerName}!\n\nYour order has been shipped successfully. 📦\n\nOrder ID: #${orderId}${courierLine}`;
  } else if (newStatus === 'Delivered') {
    return `🎉 Hello ${customerName}!\n\nYour order has been delivered successfully. ✅\n\nOrder ID: #${orderId}\nProduct: ${productsText}\nAmount: ₹${amountVal}\n\nThank you for shopping with Noor Karts! ❤️`;
  } else if (newStatus === 'Cancelled') {
    return `❌ Hello ${customerName}!\n\nYour order #${orderId} has been cancelled.\n\nIf you have any questions or need assistance, please contact our customer support:\n\n📞 ${supportNumber}\n\nThank you for choosing Noor Karts.`;
  }
  return `⚙️ Hello ${customerName}!\n\nYour order status has been updated to ${newStatus}.\n\nOrder ID: #${orderId}`;
};

const BulkOrderManagementModal = ({ isOpen, onClose, orders = [], updateOrderStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);
  const [delaySeconds, setDelaySeconds] = useState(5);

  // Action flow state
  const [pendingAction, setPendingAction] = useState(null); // { targetStatus, courier: '' }
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState('Delhivery');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [eligibilitySummary, setEligibilitySummary] = useState(null);

  // Queue Processing state
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [queueItems, setQueueItems] = useState([]); // [{ order, targetStatus, courier, status: 'pending'|'sending'|'sent'|'skipped'|'failed', error: '' }]
  const [queueProgress, setQueueProgress] = useState({ current: 0, total: 0 });
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Reset or initialize state
  useEffect(() => {
    if (isOpen) {
      // Check if there is an interrupted queue in localStorage
      const savedQueue = localStorage.getItem('noorkarts_bulk_wa_queue');
      if (savedQueue) {
        try {
          const parsed = JSON.parse(savedQueue);
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0 && !parsed.completed) {
            setQueueItems(parsed.items);
            setQueueProgress({ current: parsed.current || 0, total: parsed.items.length });
          }
        } catch (e) {
          console.error("Error reading saved queue:", e);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtered orders list
  const sanitizedOrdersList = orders.map(o => sanitizeOrder(o)).sort((a, b) => b.timestamp - a.timestamp);
  const filteredOrders = sanitizedOrdersList.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isAllFilteredSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.includes(o.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredOrders.some(o => o.id === id)));
    } else {
      const allFilteredIds = filteredOrders.map(o => o.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredOrders.map(o => o.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  // Initiate a status change action
  const initiateBulkAction = (targetStatus) => {
    const selectedOrders = sanitizedOrdersList.filter(o => selectedIds.includes(o.id));
    if (selectedOrders.length === 0) {
      alert("Please select at least one order to perform this action.");
      return;
    }

    if (targetStatus === 'Shipped') {
      setPendingAction({ targetStatus, courier: selectedCourier });
      setShowCourierModal(true);
      return;
    }

    prepareConfirmation(targetStatus, '');
  };

  const handleCourierConfirm = () => {
    setShowCourierModal(false);
    prepareConfirmation('Shipped', selectedCourier);
  };

  const prepareConfirmation = (targetStatus, courierName = '') => {
    const selectedOrders = sanitizedOrdersList.filter(o => selectedIds.includes(o.id));
    const eligibleOrders = [];
    const skippedOrders = [];

    selectedOrders.forEach(order => {
      const currentStatus = order.status || 'Pending';
      const allowedPrereqs = VALID_TRANSITIONS[targetStatus] || [];
      
      // Check if current status is allowed to transition to targetStatus
      const isAllowedTransition = allowedPrereqs.includes(currentStatus);

      if (!isAllowedTransition && currentStatus !== targetStatus) {
        skippedOrders.push({
          order,
          reason: `Cannot change status from ${currentStatus} to ${targetStatus}`
        });
      } else {
        eligibleOrders.push(order);
      }
    });

    setEligibilitySummary({
      targetStatus,
      courierName,
      totalSelected: selectedOrders.length,
      eligible: eligibleOrders,
      skipped: skippedOrders
    });
    setShowConfirmationModal(true);
  };

  const handleConfirmAndStartQueue = async () => {
    setShowConfirmationModal(false);
    if (!eligibilitySummary || eligibilitySummary.eligible.length === 0) {
      alert("No eligible orders to process.");
      return;
    }

    const { targetStatus, courierName, eligible } = eligibilitySummary;

    // Create initial queue items list
    const items = eligible.map(order => {
      const waHistory = order.waHistory || {};
      const alreadySent = waHistory[targetStatus]?.status === 'Sent';

      return {
        order,
        targetStatus,
        courierName,
        status: alreadySent ? 'skipped' : 'pending',
        skipReason: alreadySent ? 'Already Sent — Skipped' : '',
        error: ''
      };
    });

    setQueueItems(items);
    setQueueProgress({ current: 0, total: items.length });
    setIsProcessingQueue(true);

    // Save initial queue state to localStorage
    localStorage.setItem('noorkarts_bulk_wa_queue', JSON.stringify({
      items,
      current: 0,
      completed: false
    }));

    // Start sequential processing loop
    executeQueueLoop(items, delaySeconds);
  };

  const executeQueueLoop = async (initialItems, delaySec) => {
    let currentItems = [...initialItems];

    for (let i = 0; i < currentItems.length; i++) {
      const item = currentItems[i];
      setQueueProgress({ current: i + 1, total: currentItems.length });

      if (item.status === 'skipped') {
        // Update order status in DB even if WhatsApp notification was previously sent
        try {
          const updatePayload = {
            status: item.targetStatus,
            updatedAt: Date.now()
          };
          if (item.targetStatus === 'Shipped' && item.courierName) {
            updatePayload.courier = item.courierName;
          }
          await updateDoc(doc(db, 'orders', item.order.id), updatePayload);
          if (updateOrderStatus) {
            await updateOrderStatus(item.order.id, item.targetStatus);
          }
        } catch (e) {
          console.error("DB update error on skipped item:", e);
        }
        continue;
      }

      // Mark current item as sending
      currentItems[i].status = 'sending';
      setQueueItems([...currentItems]);

      // 1. Update Order Status in Firestore DB
      try {
        const updatePayload = {
          status: item.targetStatus,
          updatedAt: Date.now()
        };
        if (item.targetStatus === 'Shipped' && item.courierName) {
          updatePayload.courier = item.courierName;
        }
        await updateDoc(doc(db, 'orders', item.order.id), updatePayload);
        if (updateOrderStatus) {
          await updateOrderStatus(item.order.id, item.targetStatus);
        }
      } catch (err) {
        console.error("Failed to update status in DB:", err);
        currentItems[i].status = 'failed';
        currentItems[i].error = "DB Update Failed: " + err.message;
        setQueueItems([...currentItems]);
        continue;
      }

      // 2. Prepare & Trigger WhatsApp Notification
      const waNumber = sanitizePhoneForWhatsApp(item.order.customer?.phone);
      if (!waNumber) {
        currentItems[i].status = 'failed';
        currentItems[i].error = 'Missing or invalid WhatsApp phone number';
        setQueueItems([...currentItems]);
      } else {
        const messageText = generateWhatsAppMessage(item.targetStatus, item.order, item.courierName);
        const encodedText = encodeURIComponent(messageText);
        const waUrl = `https://wa.me/${waNumber}?text=${encodedText}`;

        try {
          window.open(waUrl, '_blank');

          // Update waHistory in Firestore Document
          const existingHistory = item.order.waHistory || {};
          const updatedHistory = {
            ...existingHistory,
            [item.targetStatus]: {
              status: 'Sent',
              timestamp: Date.now(),
              message: messageText
            }
          };

          await updateDoc(doc(db, 'orders', item.order.id), {
            waHistory: updatedHistory,
            lastWhatsAppStatus: 'Sent',
            lastWhatsAppSentAt: Date.now()
          });

          currentItems[i].status = 'sent';
        } catch (err) {
          console.error("WhatsApp window.open failed:", err);
          currentItems[i].status = 'failed';
          currentItems[i].error = err.message || 'Popup blocked or window failed';
        }
      }

      setQueueItems([...currentItems]);

      // Save progress to localStorage
      localStorage.setItem('noorkarts_bulk_wa_queue', JSON.stringify({
        items: currentItems,
        current: i + 1,
        completed: i === currentItems.length - 1
      }));

      // Wait delay before processing next item in queue (if not last item)
      if (i < currentItems.length - 1 && delaySec > 0) {
        await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
      }
    }

    setIsProcessingQueue(false);
    setShowSummaryModal(true);
  };

  const handleRetryFailed = () => {
    const failedItems = queueItems.filter(item => item.status === 'failed');
    if (failedItems.length === 0) {
      alert("No failed items to retry.");
      return;
    }

    const resetItems = queueItems.map(item => {
      if (item.status === 'failed') {
        return { ...item, status: 'pending', error: '' };
      }
      return item;
    });

    setShowSummaryModal(false);
    setQueueItems(resetItems);
    setIsProcessingQueue(true);
    executeQueueLoop(resetItems, delaySeconds);
  };

  const getWaBadge = (order) => {
    const history = order.waHistory || {};
    const lastSentStatus = order.lastWhatsAppStatus || (order.status && history[order.status]?.status);
    
    if (lastSentStatus === 'Sent' || (order.status && history[order.status]?.status === 'Sent')) {
      return <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', backgroundColor: '#DEF7EC', color: '#03543F' }}>WhatsApp Sent ✅</span>;
    }
    if (order.status && history[order.status]?.status === 'Failed') {
      return <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', backgroundColor: '#FDE8E8', color: '#9B1C1C' }}>WhatsApp Failed ❌</span>;
    }
    return <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', backgroundColor: '#F3F4F6', color: '#6B7280' }}>Not Sent ⚪</span>;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div className="animate-fade-in" style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
        
        {/* MODAL HEADER */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAF9F6' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📋 Order Status for Recent Orders
            </h2>
            <p className="text-muted text-xs" style={{ margin: '0.2rem 0 0 0' }}>
              Manage bulk order status transitions & automatic WhatsApp notifications sequentially
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.4rem', borderRadius: '8px' }}>
            <X size={22} />
          </button>
        </div>

        {/* CONTROLS BAR */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div className="admin-header-search" style={{ border: '1px solid var(--border-color)', margin: 0, width: '280px' }}>
              <Search size={16} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search Order ID, Customer, Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={16} className="text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600 }}
              >
                <option value="All">All Statuses</option>
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

          {/* Selection controls & WhatsApp Delay */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
              <Clock size={16} color="var(--primary)" />
              <span>WhatsApp Delay:</span>
              <select
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
                style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700 }}
              >
                <option value={3}>3 Seconds</option>
                <option value={5}>5 Seconds (Default)</option>
                <option value={10}>10 Seconds</option>
                <option value={15}>15 Seconds</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSelectAll} className="btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                Select All ({filteredOrders.length})
              </button>
              <button onClick={handleClearSelection} className="btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        {/* BULK ACTION TOOLBAR (Visible when selected > 0) */}
        {selectedIds.length > 0 && (
          <div style={{ backgroundColor: 'rgba(79, 70, 229, 0.06)', padding: '0.85rem 1.5rem', borderBottom: '1px solid rgba(79, 70, 229, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>
              Selected: {selectedIds.length} {selectedIds.length === 1 ? 'Order' : 'Orders'}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => initiateBulkAction('Accepted')} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 700 }}>
                <Check size={14} className="text-success" /> Accept
              </button>
              <button onClick={() => initiateBulkAction('Processing')} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 700 }}>
                Processing
              </button>
              <button onClick={() => initiateBulkAction('Packed')} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 700 }}>
                <Package size={14} /> Packed
              </button>
              <button onClick={() => initiateBulkAction('Shipped')} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 700 }}>
                <Truck size={14} /> Shipped
              </button>
              <button onClick={() => initiateBulkAction('Delivered')} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 700 }}>
                Delivered
              </button>
              <button onClick={() => initiateBulkAction('Cancelled')} className="btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 700 }}>
                <X size={14} /> Cancelled
              </button>
            </div>
          </div>
        )}

        {/* PROGRESS PANEL DURING QUEUE PROCESSING */}
        {isProcessingQueue && (
          <div style={{ padding: '1rem 1.5rem', backgroundColor: '#EFF6FF', borderBottom: '1px solid #BFDBFE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={16} className="animate-spin" /> Processing Orders Queue ({queueProgress.current} / {queueProgress.total} Completed)
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E40AF' }}>
                {Math.round((queueProgress.current / (queueProgress.total || 1)) * 100)}%
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#DBEAFE', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(queueProgress.current / (queueProgress.total || 1)) * 100}%`, height: '100%', backgroundColor: '#2563EB', transition: 'width 0.3s ease' }}></div>
            </div>
          </div>
        )}

        {/* RECENT ORDERS TABLE */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          <table className="data-table" style={{ margin: 0, width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#FAF9F6', zIndex: 10 }}>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={handleToggleSelectAll}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </th>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Customer Phone</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Current Status</th>
                <th>Order Date</th>
                <th>WhatsApp Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center text-muted" style={{ padding: '3rem' }}>
                    No orders match the current filter or search term.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isSelected = selectedIds.includes(order.id);
                  const productsText = getFormattedProductsList(order.items);
                  const totalItems = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

                  return (
                    <tr
                      key={order.id}
                      style={{ backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.04)' : 'transparent', cursor: 'pointer' }}
                      onClick={() => handleToggleSelectOne(order.id)}
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(order.id)}
                          style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </td>
                      <td><strong style={{ fontSize: '0.85rem' }}>#{order.id}</strong></td>
                      <td><span className="font-semibold text-primary">{order.customer?.name}</span></td>
                      <td><span className="text-sm">📞 {order.customer?.phone}</span></td>
                      <td>
                        <span className="text-xs truncate block" style={{ maxWidth: '200px' }} title={productsText}>
                          {productsText}
                        </span>
                      </td>
                      <td><span className="font-semibold">{totalItems}</span></td>
                      <td><span className="font-semibold">{formatCurrency(order.totalPrice)}</span></td>
                      <td>
                        <span className={`status-badge ${order.status?.toLowerCase() || 'pending'}`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td><span className="text-xs text-muted">{formatDate(order.createdAt || order.timestamp)}</span></td>
                      <td>{getWaBadge(order)}</td>
                      <td><span className="text-xs text-muted">{formatDate(order.updatedAt || order.timestamp)}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COURIER SELECTION MODAL (FOR SHIPPED ACTION) */}
      {showCourierModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '14px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800 }}>🚚 Select Courier Partner</h3>
            <p className="text-muted text-xs" style={{ marginBottom: '1rem' }}>
              Choose courier for the selected {selectedIds.length} shipped orders:
            </p>

            <select
              value={selectedCourier}
              onChange={(e) => setSelectedCourier(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.25rem' }}
            >
              {COURIER_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowCourierModal(false)} className="btn-outline" style={{ padding: '0.5rem 1rem' }}>
                Cancel
              </button>
              <button onClick={handleCourierConfirm} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                Ship Selected Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUMMARY MODAL */}
      {showConfirmationModal && eligibilitySummary && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '520px', backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '14px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 800, color: eligibilitySummary.targetStatus === 'Cancelled' ? '#DC2626' : '#0f172a' }}>
              {eligibilitySummary.targetStatus === 'Cancelled' ? '⚠️ Confirm Orders Cancellation' : `Confirm Bulk Action: ${eligibilitySummary.targetStatus}`}
            </h3>

            <p className="text-sm" style={{ marginBottom: '1rem', color: '#475569' }}>
              You are about to update <strong>{eligibilitySummary.totalSelected} selected orders</strong> to status: <strong style={{ color: 'var(--primary)' }}>{eligibilitySummary.targetStatus}</strong>.
            </p>

            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span>Eligible for Status Change:</span>
                <strong style={{ color: '#16a34a' }}>{eligibilitySummary.eligible.length} Orders</strong>
              </div>
              {eligibilitySummary.skipped.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                  <span>Ineligible (Will be skipped):</span>
                  <strong>{eligibilitySummary.skipped.length} Orders</strong>
                </div>
              )}
              {eligibilitySummary.courierName && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid #E2E8F0' }}>
                  <span>Assigned Courier:</span>
                  <strong style={{ color: '#0f172a' }}>{eligibilitySummary.courierName}</strong>
                </div>
              )}
            </div>

            {eligibilitySummary.skipped.length > 0 && (
              <div style={{ maxHeight: '120px', overflowY: 'auto', backgroundColor: '#FFFBEB', padding: '0.75rem', borderRadius: '6px', border: '1px solid #FCD34D', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
                <strong style={{ color: '#92400E', display: 'block', marginBottom: '0.2rem' }}>Skipped Items Details:</strong>
                {eligibilitySummary.skipped.map((s, idx) => (
                  <div key={idx} style={{ color: '#B45309' }}>• #{s.order.id}: {s.reason}</div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowConfirmationModal(false)} className="btn-outline" style={{ padding: '0.5rem 1rem' }}>
                Go Back
              </button>
              <button
                onClick={handleConfirmAndStartQueue}
                className={eligibilitySummary.targetStatus === 'Cancelled' ? 'btn-danger' : 'btn-primary'}
                style={{ padding: '0.5rem 1.25rem', fontWeight: 700 }}
              >
                Confirm & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETION SUMMARY MODAL */}
      {showSummaryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '550px', backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '14px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a' }}>
              <CheckCircle size={22} /> Bulk Action Completed
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', margin: '1rem 0', textAlign: 'center' }}>
              <div style={{ backgroundColor: '#F0FDF4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                <div style={{ fontSize: '0.7rem', color: '#15803D', fontWeight: 700 }}>UPDATED</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#166534' }}>{queueItems.length}</div>
              </div>
              <div style={{ backgroundColor: '#F0FDF4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                <div style={{ fontSize: '0.7rem', color: '#15803D', fontWeight: 700 }}>SENT</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#166534' }}>{queueItems.filter(i => i.status === 'sent').length}</div>
              </div>
              <div style={{ backgroundColor: '#FEF3C7', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 700 }}>SKIPPED</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#78350F' }}>{queueItems.filter(i => i.status === 'skipped').length}</div>
              </div>
              <div style={{ backgroundColor: '#FEE2E2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
                <div style={{ fontSize: '0.7rem', color: '#991B1B', fontWeight: 700 }}>FAILED</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#991B1B' }}>{queueItems.filter(i => i.status === 'failed').length}</div>
              </div>
            </div>

            {/* Queue Item Log List */}
            <div style={{ maxHeight: '180px', overflowY: 'auto', backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              {queueItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span><strong>#{item.order.id}</strong> ({item.order.customer?.name}):</span>
                  {item.status === 'sent' && <span style={{ color: '#16a34a', fontWeight: 700 }}>✅ WhatsApp Sent</span>}
                  {item.status === 'skipped' && <span style={{ color: '#d97706', fontWeight: 700 }}>⏩ {item.skipReason || 'Skipped'}</span>}
                  {item.status === 'failed' && <span style={{ color: '#dc2626', fontWeight: 700 }}>❌ {item.error || 'Failed'}</span>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              {queueItems.some(i => i.status === 'failed') && (
                <button onClick={handleRetryFailed} className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <RefreshCw size={14} /> Retry Failed ({queueItems.filter(i => i.status === 'failed').length})
                </button>
              )}
              <button onClick={() => { setShowSummaryModal(false); localStorage.removeItem('noorkarts_bulk_wa_queue'); }} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOrderManagementModal;
