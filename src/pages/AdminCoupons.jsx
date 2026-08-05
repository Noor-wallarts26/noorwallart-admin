import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShopContext } from '../context/ShopContext';
import { Ticket, Plus, Trash2, Search, Edit2, ShieldAlert, X, ChevronDown, Check } from 'lucide-react';

// Custom Searchable Multi-Select Dropdown Component with Chips/Tags
const MultiSelectDropdown = ({ 
  label, 
  options, 
  selectedValues = [], 
  onChange, 
  placeholder = "Search...",
  allLabel = "All Categories" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    String(opt).toLowerCase().includes(search.toLowerCase())
  );

  const isAllSelected = !selectedValues || selectedValues.length === 0 || selectedValues.includes(allLabel);

  const handleToggleOption = (val) => {
    if (val === allLabel) {
      onChange([allLabel]);
      return;
    }

    let nextValues = selectedValues.filter(v => v !== allLabel);
    if (nextValues.includes(val)) {
      nextValues = nextValues.filter(v => v !== val);
    } else {
      nextValues.push(val);
    }

    if (nextValues.length === 0) {
      nextValues = [allLabel];
    }
    onChange(nextValues);
  };

  const handleRemoveChip = (val, e) => {
    e.stopPropagation();
    if (val === allLabel) return;
    const nextValues = selectedValues.filter(v => v !== val);
    onChange(nextValues.length === 0 ? [allLabel] : nextValues);
  };

  const handleSelectAllFiltered = () => {
    const nextValues = Array.from(new Set([...selectedValues.filter(v => v !== allLabel), ...filteredOptions]));
    onChange(nextValues.length === 0 ? [allLabel] : nextValues);
  };

  const handleClearAll = () => {
    onChange([allLabel]);
  };

  return (
    <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
      <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>{label}</label>
      
      {/* Clickable Header Box showing Chips */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          minHeight: '44px',
          padding: '0.4rem 0.75rem',
          border: '1px solid var(--border-light, #cbd5e1)',
          borderRadius: '8px',
          backgroundColor: 'var(--surface-color, #ffffff)',
          cursor: 'pointer',
          display: 'flex',
          gap: '0.4rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
          borderColor: isOpen ? 'var(--primary, #4f46e5)' : 'var(--border-light, #cbd5e1)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', flex: 1 }}>
          {isAllSelected ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #64748b)', padding: '0.2rem 0.6rem', backgroundColor: '#f1f5f9', borderRadius: '6px', fontWeight: 500 }}>
              {allLabel}
            </span>
          ) : (
            selectedValues.map(val => (
              <span 
                key={val} 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.35rem', 
                  fontSize: '0.8rem', 
                  fontWeight: 500,
                  color: '#0f172a', 
                  backgroundColor: '#e2e8f0', 
                  padding: '0.25rem 0.6rem', 
                  borderRadius: '16px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <span>{val}</span>
                <button 
                  type="button" 
                  onClick={(e) => handleRemoveChip(val, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: '1px', borderRadius: '50%' }}
                  title="Remove"
                >
                  <X size={13} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown size={18} style={{ color: '#64748b', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </div>

      {/* Dropdown Popup Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '6px',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          boxShadow: '0 12px 28px -5px rgba(0, 0, 0, 0.15)',
          zIndex: 999,
          padding: '0.6rem',
          maxHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                padding: '0.45rem 0.5rem 0.45rem 2rem',
                fontSize: '0.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                outline: 'none'
              }}
            />
          </div>

          {/* Quick Actions Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.25rem 0.4rem 0.25rem', fontSize: '0.75rem', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
            <button type="button" onClick={handleSelectAllFiltered} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 600 }}>Select Filtered</button>
            <button type="button" onClick={handleClearAll} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>Reset to {allLabel}</button>
          </div>

          {/* Checkbox Options List */}
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.35rem' }}>
            {/* All Option */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', backgroundColor: isAllSelected ? '#f1f5f9' : 'transparent' }}>
              <input 
                type="checkbox"
                checked={isAllSelected}
                onChange={() => onChange([allLabel])}
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#4f46e5' }}
              />
              <span style={{ fontWeight: isAllSelected ? 600 : 400, color: isAllSelected ? '#0f172a' : '#334155' }}>{allLabel}</span>
            </label>

            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => {
                const checked = !isAllSelected && selectedValues.includes(opt);
                return (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', backgroundColor: checked ? '#eff6ff' : 'transparent' }}>
                    <input 
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleOption(opt)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#4f46e5' }}
                    />
                    <span style={{ fontWeight: checked ? 600 : 400, color: checked ? '#1e40af' : '#334155' }}>{opt}</span>
                  </label>
                );
              })
            ) : (
              <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                No options match "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminCoupons = () => {
  const { categories, products } = useContext(ShopContext);
  const [coupons, setCoupons] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dynamically load all available category names from database
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

  // Dynamically load all available product titles from database
  const productOptions = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products
      .map(p => (p?.title || p?.name || '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [products]);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    expiryDate: '',
    minOrderAmount: 0,
    usageLimit: 0,
    assignedCategories: ['All Categories'],
    assignedProducts: ['All Products'],
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
      // Parse assignedCategories
      let catArr = ['All Categories'];
      if (Array.isArray(coupon.assignedCategories) && coupon.assignedCategories.length > 0) {
        catArr = coupon.assignedCategories;
      } else if (Array.isArray(coupon.categoryIds) && coupon.categoryIds.length > 0) {
        catArr = coupon.categoryIds;
      } else if (coupon.assignedCategory && typeof coupon.assignedCategory === 'string') {
        catArr = coupon.assignedCategory.split(',').map(s => s.trim()).filter(Boolean);
        if (catArr.length === 0) catArr = ['All Categories'];
      }

      // Parse assignedProducts
      let prodArr = ['All Products'];
      if (Array.isArray(coupon.assignedProducts) && coupon.assignedProducts.length > 0) {
        prodArr = coupon.assignedProducts;
      } else if (Array.isArray(coupon.productIds) && coupon.productIds.length > 0) {
        prodArr = coupon.productIds;
      } else if (coupon.assignedProduct && typeof coupon.assignedProduct === 'string') {
        prodArr = coupon.assignedProduct.split(',').map(s => s.trim()).filter(Boolean);
        if (prodArr.length === 0) prodArr = ['All Products'];
      }

      setFormData({
        code: coupon.code || '',
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountValue || '',
        expiryDate: coupon.expiryDate || '',
        minOrderAmount: coupon.minOrderAmount || 0,
        usageLimit: coupon.usageLimit || 0,
        assignedCategories: catArr,
        assignedProducts: prodArr,
        isActive: coupon.isActive !== false
      });
      setEditingId(coupon.id);
    } else {
      setFormData({
        code: '', 
        discountType: 'percentage', 
        discountValue: '', 
        expiryDate: '',
        minOrderAmount: 0, 
        usageLimit: 0, 
        assignedCategories: ['All Categories'], 
        assignedProducts: ['All Products'],
        isActive: true
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();

    const catArr = Array.isArray(formData.assignedCategories) && formData.assignedCategories.length > 0
      ? formData.assignedCategories
      : ['All Categories'];

    const prodArr = Array.isArray(formData.assignedProducts) && formData.assignedProducts.length > 0
      ? formData.assignedProducts
      : ['All Products'];

    const dataToSave = {
      ...formData,
      code: formData.code.toUpperCase(),
      discountValue: Number(formData.discountValue),
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      usageLimit: Number(formData.usageLimit) || 0,
      assignedCategories: catArr,
      categoryIds: catArr,
      assignedCategory: catArr.join(', '),
      assignedProducts: prodArr,
      productIds: prodArr,
      assignedProduct: prodArr.join(', '),
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

  const filteredCoupons = coupons.filter(c => (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()));

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
                filteredCoupons.map((coupon) => {
                  const cats = Array.isArray(coupon.assignedCategories)
                    ? coupon.assignedCategories
                    : (Array.isArray(coupon.categoryIds)
                      ? coupon.categoryIds
                      : (coupon.assignedCategory ? coupon.assignedCategory.split(',').map(s => s.trim()) : ['All Categories']));

                  const prods = Array.isArray(coupon.assignedProducts)
                    ? coupon.assignedProducts
                    : (Array.isArray(coupon.productIds)
                      ? coupon.productIds
                      : (coupon.assignedProduct ? coupon.assignedProduct.split(',').map(s => s.trim()) : ['All Products']));

                  const isAllCat = cats.length === 0 || cats.includes('All Categories');
                  const isAllProd = prods.length === 0 || prods.includes('All Products');

                  return (
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
                        <span className="text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                          {isAllCat && isAllProd ? (
                            'All Catalog'
                          ) : !isAllCat && !isAllProd ? (
                            `Cats (${cats.length}), Prods (${prods.length})`
                          ) : !isAllCat ? (
                            `Cat: ${cats.join(', ')}`
                          ) : (
                            `Prod: ${prods.join(', ')}`
                          )}
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
                  );
                })
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
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

              {/* SEARCHABLE MULTI-SELECT CATEGORIES & PRODUCTS */}
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <MultiSelectDropdown 
                  label="Assigned Categories (Multi-Select)"
                  options={categoryOptions}
                  selectedValues={formData.assignedCategories}
                  onChange={(nextVals) => setFormData({...formData, assignedCategories: nextVals})}
                  placeholder="Search categories..."
                  allLabel="All Categories"
                />

                <MultiSelectDropdown 
                  label="Assigned Specific Products (Multi-Select)"
                  options={productOptions}
                  selectedValues={formData.assignedProducts}
                  onChange={(nextVals) => setFormData({...formData, assignedProducts: nextVals})}
                  placeholder="Search products..."
                  allLabel="All Products"
                />
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
