import React, { useContext, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import { DollarSign, ArrowUpRight, ArrowDownRight, Download, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminRevenue = () => {
  const { orders } = useContext(ShopContext);

  const { totalRevenue, lastMonthRevenue, pendingClearance, availableBalance, growth, chartData } = useMemo(() => {
    let total = 0;
    let lastMonth = 0;
    let pending = 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    const priorThirtyDaysAgo = new Date(now.setDate(now.getDate() - 30)); // 60 days ago
    
    let previousMonth = 0;

    // Process orders for chart (last 7 days)
    const dailyData = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyData[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
    }

    orders.forEach(order => {
      if (order.status !== 'Cancelled' && order.status !== 'Returned') {
        const amount = Number(order.totalPrice || order.total || order.totalAmount || 0);
        
        // Total Revenue (all time successful/processing orders)
        total += amount;
        
        const orderDate = new Date(order.timestamp || order.createdAt || order.date);
        
        if (orderDate > thirtyDaysAgo) {
          lastMonth += amount;
        } else if (orderDate > priorThirtyDaysAgo) {
          previousMonth += amount;
        }

        // Pending Clearance: COD orders that are not yet Delivered/Paid, or online payments not yet settled (let's assume Shipped/Packed = pending)
        if (order.paymentStatus === 'Pending Verification' || !['Delivered'].includes(order.status)) {
          pending += amount;
        }

        const dayStr = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
        if (dailyData[dayStr] !== undefined) {
          dailyData[dayStr] += amount;
        }
      }
    });

    const cData = Object.keys(dailyData).map(key => ({
      name: key,
      revenue: dailyData[key]
    }));

    let calcGrowth = 0;
    if (previousMonth > 0) {
      calcGrowth = ((lastMonth - previousMonth) / previousMonth) * 100;
    } else if (lastMonth > 0) {
      calcGrowth = 100; // 100% growth if previous was 0
    }

    return { 
      totalRevenue: total, 
      lastMonthRevenue: lastMonth,
      pendingClearance: pending,
      availableBalance: total - pending,
      growth: calcGrowth.toFixed(1),
      chartData: cData
    };
  }, [orders]);

  const handleDownloadCSV = () => {
    // Generate CSV data from orders
    if (orders.length === 0) {
      alert("No data available to export.");
      return;
    }
    
    const headers = ['Order ID', 'Date', 'Customer Name', 'Status', 'Payment Method', 'Payment Status', 'Total Amount'];
    const rows = orders.map(order => {
      const date = new Date(order.timestamp || order.createdAt || Date.now()).toLocaleDateString();
      const customer = order.customer?.name || 'Unknown';
      const amount = order.totalPrice || order.total || 0;
      
      return [
        order.id,
        date,
        `"${customer}"`, // Escape commas in name
        order.status,
        order.paymentMethod || 'N/A',
        order.paymentStatus || 'N/A',
        amount
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `revenue_statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h1>Revenue Overview</h1>
          <p className="text-muted">Track your earnings and business growth.</p>
        </div>
        <button className="btn-primary" onClick={handleDownloadCSV}>
          <Download size={18} />
          Download Statement (CSV)
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Revenue</h3>
            <p className="stat-value">₹{totalRevenue.toLocaleString()}</p>
            <span className={`stat-change ${Number(growth) >= 0 ? 'positive' : 'negative'}`}>
              {Number(growth) >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />} 
              {Math.abs(Number(growth))}%
            </span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <BarChart2 size={24} />
          </div>
          <div className="stat-details">
            <h3>Last 30 Days</h3>
            <p className="stat-value">₹{lastMonthRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <h3>Pending Clearances</h3>
            <p className="stat-value">₹{pendingClearance.toLocaleString()}</p>
            <span className="stat-change text-muted" style={{ color: 'var(--text-muted)', backgroundColor: 'transparent', padding: 0 }}>
              Orders in progress
            </span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <h3>Available Balance</h3>
            <p className="stat-value">₹{availableBalance.toLocaleString()}</p>
            <span className="stat-change text-muted" style={{ color: 'var(--text-muted)', backgroundColor: 'transparent', padding: 0 }}>
              Completed & Settled
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Revenue Trend (Last 7 Days)</h3>
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(value) => `₹${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
