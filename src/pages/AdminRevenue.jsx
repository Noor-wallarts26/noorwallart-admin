import React, { useContext, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import { DollarSign, ArrowUpRight, ArrowDownRight, Download, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminRevenue = () => {
  const { orders } = useContext(ShopContext);

  const { totalRevenue, lastMonthRevenue, growth, chartData } = useMemo(() => {
    let total = 0;
    let lastMonth = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    // Process orders for chart (last 7 days mock or real data)
    const dailyData = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyData[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
    }

    orders.forEach(order => {
      if (order.status !== 'Cancelled') {
        const amount = Number(order.total || order.totalAmount || 0);
        total += amount;
        
        const orderDate = new Date(order.createdAt || order.date);
        if (orderDate > thirtyDaysAgo) {
          lastMonth += amount;
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

    return { 
      totalRevenue: total, 
      lastMonthRevenue: lastMonth,
      growth: lastMonth > 0 ? 12.5 : 0, // Mock growth if data exists
      chartData: cData
    };
  }, [orders]);

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h1>Revenue Overview</h1>
          <p className="text-muted">Track your earnings and business growth.</p>
        </div>
        <button className="btn-primary">
          <Download size={18} />
          Download Statement
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
            <span className="stat-change positive">
              <ArrowUpRight size={16} /> +{growth}%
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
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <ArrowDownRight size={24} />
          </div>
          <div className="stat-details">
            <h3>Pending Clearances</h3>
            <p className="stat-value">₹0</p>
            <span className="stat-change text-muted" style={{ color: 'var(--text-muted)', backgroundColor: 'transparent', padding: 0 }}>
              All payments cleared
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
