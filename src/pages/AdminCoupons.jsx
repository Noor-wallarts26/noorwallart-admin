import React, { useState, useEffect, useContext, useMemo } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShopContext } from '../context/ShopContext';
import { Ticket, Plus, Trash2, Search, Edit2, ShieldAlert } from 'lucide-react';

const AdminCoupons = () => {
  const { categories, products } = useContext(ShopContext);
  const [coupons, setCoupons] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dynamically load every category from database (both categories collection and existing product categories)
  const categoryOptions = useMemo(() => {
    const catSet = new Set();

    if (Array.isArray(categories)) {
      categories.forEach(c => {
        const catName = typeof c === 'string' ? c : (c?.name || c?.title || c?.category);
        if (catName && typeof catName === 'string' && catName.trim()) {
          catSet.add(catName.trim());
        }
      });
    }

    if (Array.isArray(products)) {
      products.forEach(p => {
        if (p?.category && typeof p.category === 'string' && p.category.trim()) {
          catSet.add(p.category.trim());
        }
        if (Array.isArray(p?.categories)) {
          p.categories.forEach(cat => {
            if (cat && typeof cat === 'string' && cat.trim()) {
              catSet.add(cat.trim());
            }
          });
        }
      });
    }

    return Array.from(catSet).sort((a, b) => a.localeCompare(b));
  }, [categories, products]);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage', // percentage or flat
    discountValue: '',
    expiryDate: '',
    minOrderAmount: 0,
    usageLimit: 0,
    assignedCategory: 'All Categories',
    assignedProduct: 'All Products',
    isActive: true
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoupons(data);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setFormData({
        code: coupon.code || '',
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountValue || '',
        expiryDate: coupon.expiryDate || '',
        minOrderAmount: coupon.minOrderAmount || 0,
        usageLimit: coupon.usageLimit || 0,
        assignedCategory: coupon.assignedCategory || 'All Categories',
        assignedProduct: coupon.assignedProduct || 'All Products',
        isActive: coupon.isActive !== false
      });
      setEditingId(coupon.id);
    } else {
      setFormData({
        code: '', discountType: 'percentage', discountValue: '', expiryDate: '',
        minOrderAmount: 0, usageLimit: 0, assignedCategory: 'All Categories', assignedProduct: 'All Products',
        isActive: true
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      code: formData.code.toUpperCase(),
      discountValue: Number(formData.discountValue),
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      usageLimit: Number(formData.usageLimit) || 0,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'coupons', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'coupons'), {
          ...dataToSave,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving coupon", err);
      alert("Failed to save coupon");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      await deleteDoc(doc(db, 'coupons', id));
    }
  };

  const toggleStatus = async (coupon) => {
    await updateDoc(doc(db, 'coupons', coupon.id), { isActive: !coupon.isActive });
  };

  const filteredCoupons = coupons.filter(c => c.code.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h1>Coupon System & Discount Manager</h1>
          <p className="text-muted">Manage promotional codes, product/category rules, and order thresholds.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Coupon
        </button>
      </div>

      <div className="card">
        <div className="table-header">
          <div className="search-bar">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search coupons..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table text-xs">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Assignment</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.length > 0 ? (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Ticket size={18} className="text-primary" />
                        <span className="font-semibold">{coupon.code}</span>
                      </div>
                    </td>
                    <td>
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                    </td>
                    <td>
                      {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : 'No Min'}
                    </td>
                    <td>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {coupon.assignedCategory !== 'All Categories' ? `Cat: ${coupon.assignedCategory}` : coupon.assignedProduct !== 'All Products' ? `Prod: ${coupon.assignedProduct}` : 'All Catalog'}
                      </span>
                    </td>
                    <td>
                      {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No Expiry'}
                    </td>
                    <td>
                      <button onClick={() => toggleStatus(coupon)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button className="icon-btn edit" onClick={() => handleOpenModal(coupon)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDelete(coupon.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted" style={{ padding: '3rem' }}>
                    No coupons found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Coupon' : 'Create Coupon'}</h2>
            </div>
            <form onSubmit={handleSaveCoupon}>
              <div className="form-group">
                <label>Coupon Code</label>
                <input 
                  type="text" 
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="e.g. WELCOME20"
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Discount Type</label>
                  <select 
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    placeholder={formData.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Min Order Amount (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                    placeholder="e.g. 999 (0 for none)"
                  />
                </div>
                <div className="form-group">
                  <label>Usage Limit (Times)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                    placeholder="e.g. 50 (0 for unlimited)"
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Assigned Category</label>
                  <select value={formData.assignedCategory} onChange={e => setFormData({...formData, assignedCategory: e.target.value})}>
                    <option value="All Categories">All Categories</option>
                    {categoryOptions.map(catName => (
                      <option key={catName} value={catName}>{catName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigned Specific Product</label>
                  <select value={formData.assignedProduct} onChange={e => setFormData({...formData, assignedProduct: e.target.value})}>
                    <option value="All Products">All Products</option>
                    {products.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Expiry Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;

