import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import {
  Download, FileText, ShoppingCart, Users, Package,
  Star, TrendingUp, AlertCircle, CheckCircle, Clock
} from 'lucide-react';

/* ──────────────────────────────────────
   CSV Helper
────────────────────────────────────── */
const downloadCSV = (filename, rows) => {
  if (!rows.length) { alert('No data to export.'); return; }
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(','),
    ...rows.map(row =>
      header.map(h => {
        const v = row[h] == null ? '' : String(row[h]);
        return v.includes(',') || v.includes('"') || v.includes('\n')
          ? `"${v.replace(/"/g, '""')}"`
          : v;
      }).join(',')
    )
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

/* ──────────────────────────────────────
   Date range helpers
────────────────────────────────────── */
const getRangeTimestamps = (range) => {
  const now = new Date();
  let from = null;
  if (range === 'This Month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === 'Last Month') {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    now.setDate(0); // last day of prev month
  } else if (range === 'Last 3 Months') {
    from = new Date(); from.setMonth(from.getMonth() - 3);
  } else if (range === 'This Year') {
    from = new Date(now.getFullYear(), 0, 1);
  }
  return from ? Timestamp.fromDate(from) : null;
};

/* ──────────────────────────────────────
   Report Card component
────────────────────────────────────── */
const ReportCard = ({ icon, iconColor, iconBg, title, description, ranges, onExport }) => {
  const [range, setRange] = useState(ranges[0]);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try { await onExport(range); } catch (e) { alert('Export failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="stat-icon" style={{ backgroundColor: iconBg, color: iconColor, width: 48, height: 48, flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <p className="text-xs text-muted" style={{ margin: 0 }}>{description}</p>
        </div>
      </div>
      {ranges.length > 1 && (
        <div className="form-group" style={{ margin: 0 }}>
          <label>Date Range</label>
          <select value={range} onChange={e => setRange(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-variant)' }}>
            {ranges.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      )}
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        onClick={handleExport}
        disabled={loading}
      >
        <Download size={18} /> {loading ? 'Exporting...' : 'Download CSV'}
      </button>
    </div>
  );
};

/* ──────────────────────────────────────
   Main Page
────────────────────────────────────── */
const AdminReports = () => {
  const [summaryStats, setSummaryStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  /* Live summary stats */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersSnap, productsSnap, customersSnap] = await Promise.all([
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'customers')),
        ]);
        const orders = ordersSnap.docs.map(d => d.data());
        const pending   = orders.filter(o => o.status === 'pending').length;
        const completed = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
        const cancelled = orders.filter(o => o.status === 'cancelled').length;
        const revenue   = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.totalPrice || 0), 0);
        setSummaryStats({
          orders: orders.length, revenue, pending, completed, cancelled,
          products: productsSnap.size, customers: customersSnap.size,
        });
      } catch { /* ignore */ }
      setStatsLoading(false);
    };
    fetchStats();
  }, []);

  /* ── Export functions ── */
  const exportSales = async (range) => {
    const fromTs = getRangeTimestamps(range);
    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    if (fromTs) q = query(collection(db, 'orders'), where('createdAt', '>=', fromTs), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const rows = snap.docs.map(d => {
      const o = d.data();
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('en-IN') : '';
      return {
        'Order ID': d.id,
        'Date': date,
        'Customer': o.customer?.name || '',
        'Phone': o.customer?.phone || '',
        'Items': (o.items || []).length,
        'Subtotal (₹)': (o.cartTotal || 0).toFixed(2),
        'Delivery (₹)': (o.deliveryFee || 0).toFixed(2),
        'Coupon Code': o.couponCode || '',
        'Discount (₹)': (o.couponDiscount || 0).toFixed(2),
        'Total (₹)': (o.totalPrice || 0).toFixed(2),
        'Payment': o.paymentMethod || '',
        'Status': o.status || '',
      };
    });
    downloadCSV(`sales_report_${range.replace(/ /g, '_')}_${Date.now()}.csv`, rows);
  };

  const exportOrders = async (range) => {
    const fromTs = getRangeTimestamps(range);
    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    if (fromTs) q = query(collection(db, 'orders'), where('createdAt', '>=', fromTs), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const rows = [];
    snap.docs.forEach(d => {
      const o = d.data();
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('en-IN') : '';
      (o.items || []).forEach(item => {
        rows.push({
          'Order ID': d.id,
          'Date': date,
          'Customer': o.customer?.name || '',
          'Phone': o.customer?.phone || '',
          'Product': item.title || '',
          'Category': item.category || '',
          'Qty': item.quantity || 1,
          'Unit Price (₹)': (item.price || 0).toFixed(2),
          'Item Total (₹)': ((item.price || 0) * (item.quantity || 1)).toFixed(2),
          'Order Total (₹)': (o.totalPrice || 0).toFixed(2),
          'Payment': o.paymentMethod || '',
          'Status': o.status || '',
        });
      });
    });
    downloadCSV(`orders_report_${range.replace(/ /g, '_')}_${Date.now()}.csv`, rows);
  };

  const exportStock = async () => {
    const snap = await getDocs(collection(db, 'products'));
    const rows = snap.docs.map(d => {
      const p = d.data();
      return {
        'Product ID': d.id,
        'Title': p.title || '',
        'Category': p.category || '',
        'Price (₹)': (p.price || 0).toFixed(2),
        'Stock': p.stock ?? 0,
        'Status': (p.stock ?? 0) === 0 ? 'Out of Stock' : (p.stock ?? 0) < 5 ? 'Low Stock' : 'In Stock',
        'Published': p.isPublished ? 'Yes' : 'No',
        'Created': p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('en-IN') : '',
      };
    });
    rows.sort((a, b) => a['Stock'] - b['Stock']);
    downloadCSV(`stock_report_${Date.now()}.csv`, rows);
  };

  const exportReviews = async () => {
    const snap = await getDocs(collection(db, 'reviews'));
    const rows = snap.docs.map(d => {
      const r = d.data();
      return {
        'Review ID': d.id,
        'Product ID': r.productId || '',
        'Product': r.productTitle || '',
        'Customer': r.userName || '',
        'Rating': r.rating || '',
        'Review': r.comment || '',
        'Date': r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('en-IN') : '',
        'Status': r.status || 'pending',
      };
    });
    downloadCSV(`reviews_report_${Date.now()}.csv`, rows);
  };

  const exportCustomers = async (range) => {
    const snap = await getDocs(collection(db, 'customers'));
    const rows = snap.docs.map(d => {
      const c = d.data();
      return {
        'Customer ID': d.id,
        'Name': c.name || '',
        'Phone': c.phone || '',
        'Email': c.email || '',
        'Total Orders': c.totalOrders || 0,
        'Total Spent (₹)': (c.totalSpent || 0).toFixed(2),
        'Joined': c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('en-IN') : '',
      };
    });
    downloadCSV(`customers_report_${range.replace(/ /g, '_')}_${Date.now()}.csv`, rows);
  };

  const exportCoupons = async () => {
    const snap = await getDocs(collection(db, 'coupons'));
    const rows = snap.docs.map(d => {
      const c = d.data();
      return {
        'Coupon ID': d.id,
        'Code': c.code || '',
        'Type': c.discountType || '',
        'Value': c.discountValue || 0,
        'Min Order (₹)': c.minOrderAmount || 0,
        'Max Uses': c.maxUses || 'Unlimited',
        'Used': c.usedCount || 0,
        'Expiry': c.expiryDate || 'No Expiry',
        'Active': c.isActive ? 'Yes' : 'No',
      };
    });
    downloadCSV(`coupons_report_${Date.now()}.csv`, rows);
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h1>Reports & Export</h1>
          <p className="text-muted">Download your store data as CSV for accounting and analysis.</p>
        </div>
      </div>

      {/* ── Quick Stats Banner ── */}
      {!statsLoading && summaryStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Orders', value: summaryStats.orders, icon: <ShoppingCart size={20}/>, color: '#3B82F6' },
            { label: 'Revenue', value: `₹${summaryStats.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <TrendingUp size={20}/>, color: '#22C55E' },
            { label: 'Pending', value: summaryStats.pending, icon: <Clock size={20}/>, color: '#F59E0B' },
            { label: 'Completed', value: summaryStats.completed, icon: <CheckCircle size={20}/>, color: '#10B981' },
            { label: 'Cancelled', value: summaryStats.cancelled, icon: <AlertCircle size={20}/>, color: '#EF4444' },
            { label: 'Products', value: summaryStats.products, icon: <Package size={20}/>, color: '#8B5CF6' },
            { label: 'Customers', value: summaryStats.customers, icon: <Users size={20}/>, color: '#EC4899' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ color: s.color, marginBottom: '0.5rem' }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Report Cards Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <ReportCard
          icon={<TrendingUp size={24}/>}
          iconColor="#22c55e" iconBg="rgba(34,197,94,0.1)"
          title="Sales Report"
          description="Revenue, discounts, coupons & payment methods"
          ranges={['This Month', 'Last Month', 'Last 3 Months', 'This Year', 'All Time']}
          onExport={exportSales}
        />
        <ReportCard
          icon={<ShoppingCart size={24}/>}
          iconColor="#3b82f6" iconBg="rgba(59,130,246,0.1)"
          title="Orders Report"
          description="Order line items, statuses & fulfilment"
          ranges={['This Month', 'Last Month', 'Last 3 Months', 'This Year', 'All Time']}
          onExport={exportOrders}
        />
        <ReportCard
          icon={<Package size={24}/>}
          iconColor="#f59e0b" iconBg="rgba(245,158,11,0.1)"
          title="Stock Report"
          description="Inventory levels, low-stock & out-of-stock"
          ranges={['All Products']}
          onExport={exportStock}
        />
        <ReportCard
          icon={<Star size={24}/>}
          iconColor="#a855f7" iconBg="rgba(168,85,247,0.1)"
          title="Reviews Report"
          description="Customer reviews, ratings & status"
          ranges={['All Reviews']}
          onExport={exportReviews}
        />
        <ReportCard
          icon={<Users size={24}/>}
          iconColor="#ec4899" iconBg="rgba(236,72,153,0.1)"
          title="Customers Report"
          description="Customer details, order count & LTV"
          ranges={['All Time', 'New This Month']}
          onExport={exportCustomers}
        />
        <ReportCard
          icon={<FileText size={24}/>}
          iconColor="#14b8a6" iconBg="rgba(20,184,166,0.1)"
          title="Coupons Report"
          description="All coupon usage, redemptions & status"
          ranges={['All Coupons']}
          onExport={exportCoupons}
        />
      </div>
    </div>
  );
};

export default AdminReports;
