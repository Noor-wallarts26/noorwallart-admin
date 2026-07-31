import React, { useContext, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, ShoppingBag } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminAnalytics = () => {
  const { orders, products } = useContext(ShopContext);

  const { topProducts, salesByCategory } = useMemo(() => {
    const productSales = {};
    const categorySales = {};

    orders.forEach(order => {
      if (order.status !== 'Cancelled' && order.items) {
        order.items.forEach(item => {
          // Top Products
          if (productSales[item.id]) {
            productSales[item.id].sales += item.quantity;
            productSales[item.id].revenue += (item.price * item.quantity);
          } else {
            productSales[item.id] = {
              name: item.title,
              sales: item.quantity,
              revenue: (item.price * item.quantity)
            };
          }

          // Category Sales
          const cat = item.category || 'Uncategorized';
          if (categorySales[cat]) {
            categorySales[cat] += (item.price * item.quantity);
          } else {
            categorySales[cat] = (item.price * item.quantity);
          }
        });
      }
    });

    const top = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    const catData = Object.keys(categorySales).map(key => ({
      name: key,
      value: categorySales[key]
    }));

    return { topProducts: top, salesByCategory: catData };
  }, [orders]);

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h1>Analytics</h1>
          <p className="text-muted">Deep dive into your store's performance metrics.</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Top Selling Products */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <TrendingUp size={20} className="text-primary" />
            <h3 style={{ margin: 0 }}>Top Selling Products</h3>
          </div>
          <div style={{ height: '300px' }}>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-light)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12, fill: 'var(--text-primary)' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="sales" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Not enough data
              </div>
            )}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <ShoppingBag size={20} className="text-primary" />
            <h3 style={{ margin: 0 }}>Revenue by Category</h3>
          </div>
          <div style={{ height: '300px' }}>
            {salesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => `₹${value}`}
                    contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Not enough data
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            {salesByCategory.map((entry, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminAnalytics;
