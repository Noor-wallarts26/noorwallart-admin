import React, { useContext, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Package, IndianRupee, Clock, CheckCircle, Users, AlertTriangle, TrendingUp, XCircle, Grid, BarChart3, Calendar, ShoppingCart } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

const AdminDashboard = () => {
  const { orders, products } = useContext(ShopContext);

  // Derived metrics
  const validOrders = orders.filter(o => ['Accepted', 'Processing', 'Packed', 'Shipped', 'Delivered'].includes(o.status));
  const totalRevenue = validOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  
  // Assuming a static split for demo purposes since we don't have historical real dates yet
  const todayRevenue = totalRevenue * 0.15;
  const weeklyRevenue = totalRevenue * 0.4;
  const monthlyRevenue = totalRevenue * 0.8;

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const completedOrders = orders.filter(o => o.status === 'Delivered');
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled' || o.status === 'Rejected');
  
  const todayOrdersCount = Math.floor(orders.length * 0.2); // Demo calculation

  // Customers calculation based on unique phone numbers
  const customersMap = new Map();
  orders.forEach(o => {
    if (o.customer?.phone) {
      customersMap.set(o.customer.phone, o.customer);
    }
  });
  const totalCustomers = customersMap.size;
  const latestCustomers = Array.from(customersMap.values()).slice(0, 5);

  const lowStockProducts = products.filter(p => p.stock <= 5);

  // Charts Data
  const revenueData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  const ordersData = [
    { name: 'Mon', orders: 24 },
    { name: 'Tue', orders: 13 },
    { name: 'Wed', orders: 98 },
    { name: 'Thu', orders: 39 },
    { name: 'Fri', orders: 48 },
    { name: 'Sat', orders: 38 },
    { name: 'Sun', orders: 43 },
  ];

  const monthlySalesData = [
    { name: 'Jan', sales: 4000 },
    { name: 'Feb', sales: 3000 },
    { name: 'Mar', sales: 2000 },
    { name: 'Apr', sales: 2780 },
    { name: 'May', sales: 1890 },
    { name: 'Jun', sales: 2390 },
    { name: 'Jul', sales: 3490 },
  ];

  const categoryData = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [products]);

  const recentOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  const handleGenerateReport = () => {
    const reportDate = new Date().toLocaleString();
    const categoriesCount = new Set(products.map(p => p.category).filter(Boolean)).size;

    const reportContent = `==================================================
NOOR WALLARTS & GIFTS - DASHBOARD SUMMARY REPORT
Generated On: ${reportDate}
==================================================

1. KEY METRICS SUMMARY
--------------------------------------------------
Total Orders: ${orders.length}
Total Revenue: ₹${totalRevenue.toFixed(2)}
Total Customers: ${totalCustomers}
Total Products: ${products.length}
Total Categories: ${categoriesCount}

2. ORDER STATUS BREAKDOWN
--------------------------------------------------
Pending Orders: ${pendingOrders.length}
Completed Orders (Delivered): ${completedOrders.length}
Cancelled Orders: ${cancelledOrders.length}

3. FINANCIAL SUMMARY
--------------------------------------------------
Today's Estimated Revenue: ₹${todayRevenue.toFixed(2)}
Weekly Estimated Revenue: ₹${weeklyRevenue.toFixed(2)}
Monthly Estimated Revenue: ₹${monthlyRevenue.toFixed(2)}
Overall Total Revenue: ₹${totalRevenue.toFixed(2)}

==================================================
Report Generated Automatically by Noor Wallarts Admin
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Noor_Wallarts_Dashboard_Report_${new Date().toISOString().slice(0, 10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in pb-8">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <div className="flex items-center gap-4">
          <button className="btn-primary" onClick={handleGenerateReport} style={{ padding: '0.5rem 1rem' }}>
            Generate Report
          </button>
        </div>
      </div>

      {/* 10 METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="admin-stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}><IndianRupee size={20} /></div>
            <div>
              <p className="text-muted text-sm font-medium">Today's Revenue</p>
              <h3 className="font-bold text-lg">₹{todayRevenue.toFixed(0)}</h3>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon" style={{ backgroundColor: '#F3E8FF', color: '#7E22CE' }}><ShoppingCart size={20} /></div>
            <div>
              <p className="text-muted text-sm font-medium">Today's Orders</p>
              <h3 className="font-bold text-lg">{todayOrdersCount}</h3>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}><Clock size={20} /></div>
            <div>
              <p className="text-muted text-sm font-medium">Pending Orders</p>
              <h3 className="font-bold text-lg">{pendingOrders.length}</h3>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}><CheckCircle size={20} /></div>
            <div>
              <p className="text-muted text-sm font-medium">Completed Orders</p>
              <h3 className="font-bold text-lg">{completedOrders.length}</h3>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}><XCircle size={20} /></div>
            <div>
              <p className="text-muted text-sm font-medium">Cancelled Orders</p>
              <h3 className="font-bold text-lg">{cancelledOrders.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon" style={{ backgroundColor: '#E0E7FF', color: '#4338CA' }}><Users size={20} /></div>
            <div>
              <p className="text-muted text-sm font-medium">Total Customers</p>
              <h3 className="font-bold text-lg">{totalCustomers}</h3>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon" style={{ backgroundColor: '#FCE7F3', color: '#BE185D' }}><Package size={20} /></div>
            <div>
              <p className="text-muted text-sm font-medium">Total Products</p>
              <h3 className="font-bold text-lg">{products.length}</h3>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}><Calendar size={20} /></div>
            <div>
              <p className="text-muted text-sm font-medium">Monthly Revenue</p>
              <h3 className="font-bold text-lg">₹{monthlyRevenue.toFixed(0)}</h3>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="flex items-center gap-3">
            <div className="stat-icon" style={{ backgroundColor: '#ECFCCB', color: '#4D7C0F' }}><TrendingUp size={20} /></div>
            <div>
              <p className="text-muted text-sm font-medium">Weekly Revenue</p>
              <h3 className="font-bold text-lg">₹{weeklyRevenue.toFixed(0)}</h3>
            </div>
          </div>
        </div>
        <div className="admin-stat-card" style={{ border: '2px solid var(--primary)' }}>
          <div className="flex items-center gap-3">
            <div className="stat-icon" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}><IndianRupee size={20} /></div>
            <div>
              <p className="text-muted text-sm font-medium">Overall Revenue</p>
              <h3 className="font-bold text-lg" style={{ color: 'var(--primary)' }}>₹{totalRevenue.toFixed(0)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Weekly Revenue Area Chart */}
        <div className="admin-section">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18}/> Weekly Revenue</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Orders Bar Chart */}
        <div className="admin-section">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart3 size={18}/> Orders Volume</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} cursor={{ fill: '#F3F4F6' }} />
                <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Sales Area Chart */}
        <div className="admin-section">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={18}/> Monthly Sales Growth</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySalesData}>
                <defs>
                  <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="sales" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorMonthly)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="admin-section">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Grid size={18}/> Category Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* LISTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        
        {/* Recent Orders */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Recent Orders</h2>
            <button className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>View All</button>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="font-medium text-xs">#{order.id.slice(0, 6)}</td>
                    <td className="text-sm">{order.customer?.name}</td>
                    <td>
                      <span className={`status-badge ${order.status?.toLowerCase() || 'pending'}`}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                    <td className="font-semibold text-sm">₹{order.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Customers */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Latest Customers</h2>
            <button className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>View All</button>
          </div>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {latestCustomers.length === 0 ? <p className="text-muted text-center py-4">No customers found.</p> : latestCustomers.map((cust, i) => (
              <div key={i} className="flex items-center gap-3">
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {cust.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-sm">{cust.name}</p>
                  <p className="text-muted text-xs">{cust.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Low Stock Alerts</h2>
          </div>
          <div style={{ padding: '1rem' }}>
            {lowStockProducts.length === 0 ? (
              <div className="flex items-center justify-center gap-2 text-muted" style={{ padding: '2rem' }}>
                <CheckCircle size={20} className="text-success" />
                <span>All products have good stock.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {lowStockProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex justify-between items-center" style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: '#fff', overflow: 'hidden' }}>
                        <img src={p.imageUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <p className="font-medium" style={{ fontSize: '0.875rem' }}>{p.title}</p>
                        <p className="text-error" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Only {p.stock} left!</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
