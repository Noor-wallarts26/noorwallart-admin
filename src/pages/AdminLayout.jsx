import React, { useContext } from 'react';
import { Navigate, Link, Outlet, useLocation } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { LayoutDashboard, Package, Settings, LogOut, ShoppingCart, TrendingUp } from 'lucide-react';
import './Admin.css';

const AdminLayout = () => {
  const { user, loading, logout } = useContext(ShopContext);
  const location = useLocation();

  if (loading) {
    return <div className="admin-loading">Loading Admin Panel...</div>;
  }



  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2 style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0 }}>Noor Wall Arts</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Admin Panel</p>
        </div>
        <nav className="admin-nav">
          <Link 
            to="/" 
            className={`admin-nav-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link 
            to="/orders" 
            className={`admin-nav-item ${location.pathname === '/orders' ? 'active' : ''}`}
          >
            <ShoppingCart size={20} />
            Orders
          </Link>
          <Link 
            to="/sales" 
            className={`admin-nav-item ${location.pathname === '/sales' ? 'active' : ''}`}
          >
            <TrendingUp size={20} />
            Daily Sales
          </Link>
          <Link 
            to="/products" 
            className={`admin-nav-item ${location.pathname === '/products' ? 'active' : ''}`}
          >
            <Package size={20} />
            Products
          </Link>
          <Link 
            to="/settings" 
            className={`admin-nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            <Settings size={20} />
            Settings
          </Link>
        </nav>
        <div className="admin-sidebar-footer">
          <p className="admin-email">{user.email}</p>
          <button onClick={logout} className="admin-logout-btn">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
