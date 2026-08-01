import React, { useContext, useMemo, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Search, MapPin, Phone, Mail, ShoppingBag, MessageCircle, Gift, X, Calendar, User, ChevronRight } from 'lucide-react';

const AdminCustomers = () => {
  const { orders, products } = useContext(ShopContext);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerSearchTerm, setOfferSearchTerm] = useState('');

  const customersData = useMemo(() => {
    const custMap = new Map();

    orders.forEach(order => {
      if (order.customer && order.customer.phone) {
        const phone = order.customer.phone;
        const orderTime = order.timestamp || order.createdAt || Date.now();

        if (!custMap.has(phone)) {
          custMap.set(phone, {
            name: order.customer.name || 'Unknown',
            phone: phone,
            email: order.customer.email || 'N/A',
            address: order.customer.address || '',
            city: order.customer.city || '',
            state: order.customer.state || '',
            pincode: order.customer.pincode || '',
            fullAddress: `${order.customer.address || ''}, ${order.customer.city || ''} ${order.customer.state || ''} ${order.customer.pincode || ''}`,
            photoURL: order.customer.photoURL || null,
            totalPurchase: 0,
            orderCount: 0,
            lastOrderDate: orderTime,
            firstOrderDate: orderTime,
            orders: []
          });
        }
        
        const cust = custMap.get(phone);
        
        // Update total spend if valid order
        if (['Accepted', 'Processing', 'Packed', 'Shipped', 'Delivered'].includes(order.status)) {
          cust.totalPurchase += (order.totalPrice || 0);
        }
        
        cust.orderCount += 1;
        
        if (orderTime > cust.lastOrderDate) {
          cust.lastOrderDate = orderTime;
        }
        if (orderTime < cust.firstOrderDate) {
          cust.firstOrderDate = orderTime;
        }
        
        // Update photoURL if a newer order has it
        if (order.customer.photoURL) {
          cust.photoURL = order.customer.photoURL;
        }

        cust.orders.push(order);
      }
    });

    // Sort by last order date
    return Array.from(custMap.values()).sort((a, b) => b.lastOrderDate - a.lastOrderDate);
  }, [orders]);

  const filteredCustomers = customersData.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p => p.title?.toLowerCase().includes(offerSearchTerm.toLowerCase()));

  // --- Actions ---

  const handleWhatsAppContact = (customer) => {
    // Format phone number (remove spaces, ensure country code)
    let phone = customer.phone.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone; // Default to India if 10 digits
    
    const message = `Hi ${customer.name},\n\nThank you for choosing Noor Wallarts! We're reaching out regarding...`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleShareOffer = (customer, product) => {
    let phone = customer.phone.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;

    // Use current origin for links. If production domain is known, could hardcode it.
    const productUrl = `https://noorwallarts.com/product/${product.id}`;
    const priceText = product.discount ? `₹${product.price} (Original: ₹${product.discount})` : `₹${product.price}`;
    
    const message = `Hi ${customer.name}! 🎉\n\nWe have an exclusive offer just for you!\n\n*${product.title}*\nPrice: ${priceText}\n\nCheck it out here:\n${productUrl}\n\nLet us know if you'd like to place an order!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setIsOfferModalOpen(false);
  };

  const openShareOffer = (e, customer) => {
    e.stopPropagation(); // prevent row click
    setSelectedCustomer(customer);
    setIsOfferModalOpen(true);
  };

  const openWhatsApp = (e, customer) => {
    e.stopPropagation();
    handleWhatsAppContact(customer);
  };

  return (
    <div className="animate-fade-in pb-8">
      
      {/* HEADER */}
      <div className="admin-page-header">
        <div>
          <h1>Customers</h1>
          <p className="text-muted">Manage your registered customers and track their order history.</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="card mb-6" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by name, mobile, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
          />
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="card table-container" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Profile</th>
              <th>Customer</th>
              <th>Contact Details</th>
              <th>Location</th>
              <th style={{ textAlign: 'center' }}>Total Orders</th>
              <th>Last Order</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(cust => (
              <tr key={cust.phone} onClick={() => setSelectedCustomer(cust)} style={{ cursor: 'pointer' }} className="hover-row">
                <td>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                    {cust.photoURL ? (
                      <img src={cust.photoURL} alt={cust.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{cust.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="font-semibold text-primary block">{cust.name}</span>
                  <span className="text-muted text-xs">Customer since {new Date(cust.firstOrderDate).toLocaleDateString()}</span>
                </td>
                <td>
                  <div className="text-sm">
                    <div className="flex items-center gap-2"><Phone size={14} className="text-muted"/> {cust.phone}</div>
                    <div className="flex items-center gap-2 mt-1"><Mail size={14} className="text-muted"/> {cust.email}</div>
                  </div>
                </td>
                <td>
                  <div className="text-sm">
                    <span className="block font-medium">{cust.city || 'N/A'} {cust.state ? `, ${cust.state}` : ''}</span>
                    <span className="text-muted text-xs line-clamp-1" title={cust.fullAddress}>{cust.fullAddress}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-color)', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                    <ShoppingBag size={14} className="text-muted"/> {cust.orderCount}
                  </span>
                </td>
                <td className="text-sm text-muted">
                  {cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString() : 'N/A'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={(e) => openWhatsApp(e, cust)} className="btn-secondary" style={{ padding: '0.4rem', color: '#10B981', borderColor: '#10B981' }} title="Contact via WhatsApp">
                      <MessageCircle size={16} />
                    </button>
                    <button onClick={(e) => openShareOffer(e, cust)} className="btn-secondary" style={{ padding: '0.4rem', color: 'var(--primary)' }} title="Share Offer">
                      <Gift size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr><td colSpan="7" className="text-center text-muted" style={{ padding: '3rem' }}>No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CUSTOMER PROFILE SLIDE PANEL / MODAL */}
      {selectedCustomer && !isOfferModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 }} onClick={() => setSelectedCustomer(null)}>
          <div className="animate-fade-in" style={{ width: '100%', maxWidth: '450px', backgroundColor: 'var(--surface-color)', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Profile Header */}
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-color)' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '2.5rem', color: 'var(--primary)', overflow: 'hidden', border: '2px solid var(--border-light)', flexShrink: 0 }}>
                  {selectedCustomer.photoURL ? (
                    <img src={selectedCustomer.photoURL} alt={selectedCustomer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{selectedCustomer.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>{selectedCustomer.name}</h2>
                  <p className="text-muted text-sm m-0" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14}/> Since {new Date(selectedCustomer.firstOrderDate).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem' }}><X size={24}/></button>
            </div>

            {/* Profile Body */}
            <div style={{ padding: '2rem', flex: 1 }}>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ flex: 1, padding: '1rem', textAlign: 'center' }}>
                  <p className="text-muted text-sm m-0">Total Orders</p>
                  <h3 style={{ margin: '0.25rem 0 0 0', color: 'var(--primary)' }}>{selectedCustomer.orderCount}</h3>
                </div>
                <div className="card" style={{ flex: 1, padding: '1rem', textAlign: 'center' }}>
                  <p className="text-muted text-sm m-0">Total Spent</p>
                  <h3 style={{ margin: '0.25rem 0 0 0', color: 'var(--success)' }}>₹{selectedCustomer.totalPurchase.toFixed(2)}</h3>
                </div>
              </div>

              <div className="card mb-6" style={{ padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={18}/> Contact Information</h4>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <Phone size={18} className="text-muted" style={{ marginTop: '2px' }}/>
                    <div>
                      <span className="block font-medium">{selectedCustomer.phone}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <Mail size={18} className="text-muted" style={{ marginTop: '2px' }}/>
                    <div>
                      <span className="block font-medium">{selectedCustomer.email}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <MapPin size={18} className="text-muted" style={{ marginTop: '2px' }}/>
                    <div>
                      <span className="block font-medium">{selectedCustomer.fullAddress}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                  <button onClick={() => handleWhatsAppContact(selectedCustomer)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', color: '#10B981', borderColor: '#10B981' }}>
                    <MessageCircle size={16} style={{ marginRight: '6px' }}/> WhatsApp
                  </button>
                  <button onClick={() => setIsOfferModalOpen(true)} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    <Gift size={16} style={{ marginRight: '6px' }}/> Share Offer
                  </button>
                </div>
              </div>

              <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingBag size={18}/> Order History</h4>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {selectedCustomer.orders.map((order, idx) => (
                  <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: idx !== selectedCustomer.orders.length - 1 ? '1px solid var(--border-light)' : 'none', background: 'var(--bg-color)' }}>
                    <div>
                      <span className="block font-medium text-primary">Order #{order.id.slice(-6).toUpperCase()}</span>
                      <span className="text-xs text-muted">{new Date(order.timestamp || order.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="block font-bold">₹{order.totalPrice}</span>
                      <span className="text-xs" style={{ 
                        color: ['Delivered', 'Completed'].includes(order.status) ? 'var(--success)' : (['Cancelled'].includes(order.status) ? 'var(--error)' : 'var(--warning)'),
                        fontWeight: '600'
                      }}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SHARE OFFER MODAL */}
      {isOfferModalOpen && selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }} onClick={() => setIsOfferModalOpen(false)}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '16px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem 0' }}>Share Offer via WhatsApp</h2>
                <p className="text-muted text-sm m-0">Select a product to share with <strong style={{ color: 'var(--primary)' }}>{selectedCustomer.name}</strong></p>
              </div>
              <button onClick={() => setIsOfferModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem' }}><X size={24}/></button>
            </div>

            <div style={{ padding: '1.5rem', background: 'var(--bg-color)' }}>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={offerSearchTerm}
                  onChange={(e) => setOfferSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.25rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white' }}>
                {filteredProducts.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={p.images?.[0] || '/placeholder.png'} alt={p.title} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div>
                        <h4 className="line-clamp-1" style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>{p.title}</h4>
                        <span className="font-semibold text-primary">₹{p.price}</span>
                        {p.discount && <span className="text-xs text-muted" style={{ marginLeft: '0.5rem', textDecoration: 'line-through' }}>₹{p.discount}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleShareOffer(selectedCustomer, p)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      Send <ChevronRight size={14} style={{ marginLeft: '4px' }}/>
                    </button>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No products found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCustomers;
