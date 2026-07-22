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



  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>AmazeShop Admin</h2>
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
