import React, { useContext, useState, useRef, useEffect } from 'react';
import { Navigate, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { 
  LayoutDashboard, ShoppingCart, Package, FolderTree, Users, 
  DollarSign, CreditCard, Phone, Settings, Ticket, Star, 
  Bell, FileText, BarChart, User, LogOut, Menu, Search, X
} from 'lucide-react';
import { isRateLimited } from '../utils/security';
import './Admin.css';

const SIDEBAR_LINKS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Orders', path: '/orders', icon: ShoppingCart },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Categories', path: '/categories', icon: FolderTree },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Revenue', path: '/revenue', icon: DollarSign },
  { name: 'Transactions', path: '/transactions', icon: CreditCard },
  { name: 'Website Settings', path: '/settings', icon: Settings },
  { name: 'Coupons', path: '/coupons', icon: Ticket },
  { name: 'Reviews', path: '/reviews', icon: Star },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Analytics', path: '/analytics', icon: BarChart },
];

const AdminLayout = () => {
  const { user, loading, logout, products, orders, unreadNotificationsCount, isPinVerified, verifyPin, sendPinResetLink } = useContext(ShopContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // PIN Verification Modal State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLocked, setPinLocked] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>Loading Admin Panel...</div>;
  }

  const handleLinkClick = (path) => {
    if (window.innerWidth <= 1024) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (isPinVerified) {
      navigate('/profile');
    } else {
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setPinError('');

    // Rate limit: max 5 PIN attempts per 5 minutes
    if (isRateLimited('admin_pin', 5, 5 * 60 * 1000)) {
      setPinLocked(true);
      setPinError('Too many failed attempts. Please wait 5 minutes or use Forgot PIN.');
      return;
    }

    if (verifyPin(pinInput)) {
      setShowPinModal(false);
      setPinInput('');
      setPinLocked(false);
      navigate('/profile');
    } else {
      setPinError('Incorrect PIN. Please try again or use Forgot PIN.');
      setPinInput('');
    }
  };

  // Search Logic
  const query = searchQuery.toLowerCase().trim();
  const searchProducts = query ? products.filter(p => p.title?.toLowerCase().includes(query) || p.sku?.toLowerCase().includes(query)).slice(0, 5) : [];
  const searchOrders = query ? orders.filter(o => o.id.toLowerCase().includes(query) || o.customer?.name?.toLowerCase().includes(query) || o.customer?.phone?.includes(query)).slice(0, 5) : [];

  return (
    <div className="admin-layout">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-brand" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {isMobileMenuOpen && (
              <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0 0.75rem 0' }}>
            <img
              src="/logo.jpg"
              alt="Noor Wallarts & Gifts"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '16px',
                objectFit: 'contain',
                background: 'transparent',
                display: 'block'
              }}
            />
          </div>
        </div>
        
        <nav className="admin-nav">
          {SIDEBAR_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link 
                key={link.name}
                to={link.path} 
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleLinkClick(link.path)}
              >
                <Icon size={20} />
                {link.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="admin-sidebar-footer">
          <a href="/profile" className={`admin-nav-item ${location.pathname === '/profile' ? 'active' : ''}`} onClick={handleProfileClick} style={{ marginBottom: '0.5rem' }}>
            <User size={20} />
            Profile
          </a>
          <button onClick={logout} className="admin-logout-btn">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <div className="admin-main-wrapper">
        <header className="admin-header">
          <div className="flex items-center gap-4">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="admin-header-search" ref={searchRef} style={{ position: 'relative' }}>
              <Search size={18} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search orders, products, customers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
              {/* Search Dropdown Results */}
              {isSearchFocused && query && (searchProducts.length > 0 || searchOrders.length > 0) && (
                <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 50, maxHeight: '400px', overflowY: 'auto' }}>
                  {searchProducts.length > 0 && (
                    <div style={{ padding: '0.5rem 0' }}>
                      <div className="text-xs font-semibold text-muted" style={{ padding: '0.25rem 1rem', textTransform: 'uppercase' }}>Products</div>
                      {searchProducts.map(p => (
                        <div 
                          key={p.id} 
                          className="hover:bg-gray-50 cursor-pointer" 
                          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'background 0.2s' }}
                          onClick={() => {
                            setSearchQuery('');
                            setIsSearchFocused(false);
                            navigate(`/products/edit/${p.id}`, { state: { product: p } });
                          }}
                        >
                          <Package size={16} className="text-muted" />
                          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{p.title}</span>
                          <span className="text-xs text-muted ml-auto">₹{p.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchProducts.length > 0 && searchOrders.length > 0 && <hr style={{ borderTop: '1px solid var(--border-light)', margin: 0 }} />}
                  {searchOrders.length > 0 && (
                    <div style={{ padding: '0.5rem 0' }}>
                      <div className="text-xs font-semibold text-muted" style={{ padding: '0.25rem 1rem', textTransform: 'uppercase' }}>Orders</div>
                      {searchOrders.map(o => (
                        <div 
                          key={o.id} 
                          className="hover:bg-gray-50 cursor-pointer" 
                          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'background 0.2s' }}
                          onClick={() => {
                            setSearchQuery('');
                            setIsSearchFocused(false);
                            navigate('/orders');
                          }}
                        >
                          <ShoppingCart size={16} className="text-muted" />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Order #{o.id}</span>
                            <span className="text-xs text-muted">{o.customer?.name} - {o.customer?.phone}</span>
                          </div>
                          <span className={`status-badge ${o.status?.toLowerCase() || 'pending'} ml-auto`} style={{ transform: 'scale(0.8)' }}>{o.status || 'Pending'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {isSearchFocused && query && searchProducts.length === 0 && searchOrders.length === 0 && (
                <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', zIndex: 50 }}>
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
          <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/notifications"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-color)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              title="View Store Notifications"
            >
              <Bell size={20} />
              {unreadNotificationsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)'
                }}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </Link>

            <div
              className="admin-profile-btn"
              onClick={handleProfileClick}
              title="Noor Wallarts & Gifts – Admin Profile"
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '50%',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(180,120,80,0.3)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <img
                src="/logo.jpg"
                alt="Noor Wallarts & Gifts"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(180,120,80,0.4)'
                }}
              />
            </div>
          </div>
        </header>

        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>

      {/* 6-DIGIT PIN VERIFICATION MODAL */}
      {showPinModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img
                src="/logo.jpg"
                alt="Noor Wallarts & Gifts"
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  margin: '0 auto 1rem auto',
                  display: 'block',
                  border: '3px solid rgba(180,120,80,0.3)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
                }}
              />
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Security PIN Required</h3>
              <p className="text-sm text-muted">Enter your 6-digit Admin PIN to view secure profile details.</p>
            </div>

            {pinError && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                {pinError}
              </div>
            )}

            <form onSubmit={handlePinSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <input 
                  type="password" 
                  maxLength={6}
                  placeholder="Enter 6-digit PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '0.8rem', fontSize: '1.25rem', textAlign: 'center', letterSpacing: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', opacity: pinLocked ? 0.5 : 1 }}
                  autoFocus
                  disabled={pinLocked}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowPinModal(false); setPinInput(''); setPinError(''); setPinLocked(false); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={pinLocked || pinInput.length !== 6}>
                  Verify PIN
                </button>
              </div>
            </form>


            <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                onClick={() => {
                  sendPinResetLink();
                  setShowPinModal(false);
                }}
              >
                Forgot PIN? Send Reset Link to Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
