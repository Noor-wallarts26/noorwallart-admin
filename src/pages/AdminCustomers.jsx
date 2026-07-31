import React, { useContext, useMemo, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Search, MapPin, Phone, Mail, ShoppingBag } from 'lucide-react';

const AdminCustomers = () => {
  const { orders } = useContext(ShopContext);
  const [searchTerm, setSearchTerm] = useState('');

  const customersData = useMemo(() => {
    const custMap = new Map();

    orders.forEach(order => {
      if (order.customer && order.customer.phone) {
        const phone = order.customer.phone;
        if (!custMap.has(phone)) {
          custMap.set(phone, {
            name: order.customer.name,
            phone: phone,
            email: order.customer.email || 'N/A',
            address: `${order.customer.address}, ${order.customer.city || ''} ${order.customer.state || ''} ${order.customer.pincode || ''}`,
            totalPurchase: 0,
            orderCount: 0,
            lastOrderDate: 0,
            orders: []
          });
        }
        
        const cust = custMap.get(phone);
        if (['Accepted', 'Processing', 'Packed', 'Shipped', 'Delivered'].includes(order.status)) {
          cust.totalPurchase += (order.totalPrice || 0);
        }
        cust.orderCount += 1;
        const orderTime = order.timestamp || order.createdAt;
        if (orderTime > cust.lastOrderDate) {
          cust.lastOrderDate = orderTime;
        }
        cust.orders.push(order);
      }
    });

    return Array.from(custMap.values()).sort((a, b) => b.lastOrderDate - a.lastOrderDate);
  }, [orders]);

  const filteredCustomers = customersData.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in pb-8">
      <div className="admin-page-header">
        <h1>Customers</h1>
        <div className="admin-header-search" style={{ border: '1px solid var(--border-color)', margin: 0, width: '300px' }}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card table-container" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact Details</th>
              <th>Total Orders</th>
              <th>Total Spend</th>
              <th>Last Order</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(cust => (
              <tr key={cust.phone}>
                <td>
                  <div className="flex items-center gap-3">
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)', flexShrink: 0 }}>
                      {cust.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <span className="font-semibold text-primary block">{cust.name}</span>
                      <span className="text-muted text-xs line-clamp-1" title={cust.address}><MapPin size={10} className="inline mr-1"/> {cust.address}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="text-sm">
                    <div className="flex items-center gap-2"><Phone size={14} className="text-muted"/> {cust.phone}</div>
                    <div className="flex items-center gap-2 mt-1"><Mail size={14} className="text-muted"/> {cust.email}</div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2 font-medium">
                    <ShoppingBag size={16} className="text-muted"/> {cust.orderCount} Orders
                  </div>
                </td>
                <td className="font-bold text-success">
                  ₹{cust.totalPurchase.toFixed(2)}
                </td>
                <td className="text-sm text-muted">
                  {cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr><td colSpan="5" className="text-center text-muted" style={{ padding: '3rem' }}>No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCustomers;
