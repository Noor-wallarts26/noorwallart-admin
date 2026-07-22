import React, { useContext } from 'react';
import { Navigate, Link, Outlet, useLocation } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { LayoutDashboard, Package, Settings, LogOut } from 'lucide-react';
import './Admin.css';

const AdminLayout = () => {
  const { user, loading, logout } = useContext(ShopContext);
  const location = useLocation();

  if (loading) {
    return <div className="admin-loading">Loading Admin Panel...</div>;
  }

  // Very simple admin check for prototype
  const isAdmin = user && user.email === 'admin@amazeshop.com';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>AmazeShop Admin</h2>
        </div>
        <nav className="admin-nav">
          <Link 
            to="/admin" 
            className={`admin-nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link 
            to="/admin/products" 
            className={`admin-nav-item ${location.pathname === '/admin/products' ? 'active' : ''}`}
          >
            <Package size={20} />
            Products
          </Link>
          <Link 
            to="/admin/settings" 
            className={`admin-nav-item ${location.pathname === '/admin/settings' ? 'active' : ''}`}
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
