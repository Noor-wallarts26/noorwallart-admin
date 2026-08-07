import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, runTransaction, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShopContext } from '../context/ShopContext';
import { Ticket, Plus, Trash2, Search, Edit2, ShieldAlert, X, ChevronDown, Check, Sparkles, RotateCcw, Clock, CheckCircle2, AlertTriangle, Filter, RefreshCw } from 'lucide-react';

// Atomic Sequential Coupon ID Generator (CPN-0001, CPN-0002, ...)
const generateNextCouponId = async (firestoreDb) => {
  const counterRef = doc(firestoreDb, 'system', 'counters');
  try {
    const nextNum = await runTransaction(firestoreDb, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let currentVal = 0;
      if (counterSnap.exists()) {
        currentVal = Number(counterSnap.data().lastCouponNumber) || 0;
      }
      const nextVal = currentVal + 1;
      transaction.set(counterRef, { lastCouponNumber: nextVal }, { merge: true });
      return nextVal;
    });
    return `CPN-${String(nextNum).padStart(4, '0')}`;
  } catch (err) {
    console.error("Error generating couponId transaction:", err);
    return `CPN-${String(Math.floor(Math.random() * 8999) + 1000)}`;
  }
};

// Reorder remaining coupons sequentially (CPN-0001, CPN-0002, ...) and reset counter
const reorderCouponNumbers = async (firestoreDb, remainingCoupons) => {
  if (!Array.isArray(remainingCoupons)) return;

  const sorted = [...remainingCoupons].sort((a, b) => {
    const numA = parseInt((a.couponId || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt((b.couponId || '').replace(/\D/g, ''), 10) || 0;
    if (numA !== numB) return numA - numB;
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });

  try {
    const batch = writeBatch(firestoreDb);

    sorted.forEach((coupon, index) => {
      const newCouponId = `CPN-${String(index + 1).padStart(4, '0')}`;
      if (coupon.couponId !== newCouponId) {
        const couponRef = doc(firestoreDb, 'coupons', coupon.id);
        batch.update(couponRef, { 
          couponId: newCouponId,
          updatedAt: new Date().toISOString()
        });
      }
    });

    const counterRef = doc(firestoreDb, 'system', 'counters');
    batch.set(counterRef, { lastCouponNumber: sorted.length }, { merge: true });

    await batch.commit();
  } catch (err) {
    console.error("Error in reorderCouponNumbers:", err);
  }
};

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

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.25rem 0.4rem 0.25rem', fontSize: '0.75rem', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
            <button type="button" onClick={handleSelectAllFiltered} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 600 }}>Select Filtered</button>
            <button type="button" onClick={handleClearAll} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>Reset to {allLabel}</button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.35rem' }}>
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
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const codeInputRef = useRef(null);
  
  const categoryOptions = useMemo(() => {
    const catSet = new Set();
    if (Array.isArray(categories)) {
      categories.forEach(c => {
        const catName = typeof c === 'string' ? c : (c?.name || c?.title || c?.category);
        if (catName && typeof catName === 'string' && catName.trim()) catSet.add(catName.trim());
      });
    }
    if (Array.isArray(products)) {
      products.forEach(p => {
        if (p?.category && typeof p.category === 'string' && p.category.trim()) catSet.add(p.category.trim());
        if (Array.isArray(p?.categories)) {
          p.categories.forEach(cat => {
            if (cat && typeof cat === 'string' && cat.trim()) catSet.add(cat.trim());
          });
        }
      });
    }
    return Array.from(catSet).sort((a, b) => a.localeCompare(b));
  }, [categories, products]);

  const productOptions = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.map(p => (p?.title || p?.name || '').trim()).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const [formData, setFormData] = useState({
    couponId: '',
    code: '',
    discountType: 'percentage',
    discountValue: '',
    usageMode: 'multi', // multi or one_time
    startDate: '',
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

  const getLastCouponConfig = () => {
    let lastCoupon = null;
    try {
      const cached = localStorage.getItem('last_coupon_config');
      if (cached) lastCoupon = JSON.parse(cached);
    } catch (e) {}

    if (!lastCoupon && Array.isArray(coupons) && coupons.length > 0) {
      const sorted = [...coupons].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      lastCoupon = sorted[0];
    }

    if (!lastCoupon) return null;

    let catArr = ['All Categories'];
    if (Array.isArray(lastCoupon.assignedCategories) && lastCoupon.assignedCategories.length > 0) {
      catArr = lastCoupon.assignedCategories;
    } else if (Array.isArray(lastCoupon.categoryIds) && lastCoupon.categoryIds.length > 0) {
      catArr = lastCoupon.categoryIds;
    }

    let prodArr = ['All Products'];
    if (Array.isArray(lastCoupon.assignedProducts) && lastCoupon.assignedProducts.length > 0) {
      prodArr = lastCoupon.assignedProducts;
    } else if (Array.isArray(lastCoupon.productIds) && lastCoupon.productIds.length > 0) {
      prodArr = lastCoupon.productIds;
    }

    return {
      discountType: lastCoupon.discountType || 'percentage',
      discountValue: lastCoupon.discountValue || '',
      usageMode: lastCoupon.usageMode || 'multi',
      startDate: lastCoupon.startDate || '',
      expiryDate: lastCoupon.expiryDate || '',
      minOrderAmount: lastCoupon.minOrderAmount || 0,
      usageLimit: lastCoupon.usageLimit || 0,
      assignedCategories: catArr,
      assignedProducts: prodArr,
      isActive: lastCoupon.isActive !== false
    };
  };

  const handleOpenModal = (coupon = null) => {
    setIsSaving(false);
    if (coupon) {
      let catArr = ['All Categories'];
      if (Array.isArray(coupon.assignedCategories) && coupon.assignedCategories.length > 0) {
        catArr = coupon.assignedCategories;
      } else if (coupon.assignedCategory) {
        catArr = coupon.assignedCategory.split(',').map(s => s.trim()).filter(Boolean);
        if (catArr.length === 0) catArr = ['All Categories'];
      }

      let prodArr = ['All Products'];
      if (Array.isArray(coupon.assignedProducts) && coupon.assignedProducts.length > 0) {
        prodArr = coupon.assignedProducts;
      } else if (coupon.assignedProduct) {
        prodArr = coupon.assignedProduct.split(',').map(s => s.trim()).filter(Boolean);
        if (prodArr.length === 0) prodArr = ['All Products'];
      }

      setFormData({
        couponId: coupon.couponId || '',
        code: coupon.code || '',
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountValue || '',
        usageMode: coupon.usageMode || 'multi',
        startDate: coupon.startDate || '',
        expiryDate: coupon.expiryDate || '',
        minOrderAmount: coupon.minOrderAmount || 0,
        usageLimit: coupon.usageLimit || 0,
        assignedCategories: catArr,
        assignedProducts: prodArr,
        isActive: coupon.isActive !== false
      });
      setEditingId(coupon.id);
    } else {
      const lastConfig = getLastCouponConfig();
      if (lastConfig) {
        setFormData({
          couponId: '',
          code: '',
          discountType: lastConfig.discountType,
          discountValue: lastConfig.discountValue,
          usageMode: lastConfig.usageMode,
          startDate: lastConfig.startDate,
          expiryDate: lastConfig.expiryDate,
          minOrderAmount: lastConfig.minOrderAmount,
          usageLimit: lastConfig.usageLimit,
          assignedCategories: lastConfig.assignedCategories,
          assignedProducts: lastConfig.assignedProducts,
          isActive: lastConfig.isActive
        });
      } else {
        setFormData({
          couponId: '',
          code: '', 
          discountType: 'percentage', 
          discountValue: '', 
          usageMode: 'multi',
          startDate: '',
          expiryDate: '',
          minOrderAmount: 0, 
          usageLimit: 0, 
          assignedCategories: ['All Categories'], 
          assignedProducts: ['All Products'],
          isActive: true
        });
      }
      setEditingId(null);
    }
    setIsModalOpen(true);
    // Auto-focus on Coupon Code input field
    setTimeout(() => {
      if (codeInputRef.current) {
        codeInputRef.current.focus();
        codeInputRef.current.select();
      }
    }, 150);
  };

  const handleUseLastSettings = () => {
    const lastConfig = getLastCouponConfig();
    if (lastConfig) {
      setFormData(prev => ({
        ...prev,
        discountType: lastConfig.discountType,
        discountValue: lastConfig.discountValue,
        usageMode: lastConfig.usageMode,
        startDate: lastConfig.startDate,
        expiryDate: lastConfig.expiryDate,
        minOrderAmount: lastConfig.minOrderAmount,
        usageLimit: lastConfig.usageLimit,
        assignedCategories: lastConfig.assignedCategories,
        assignedProducts: lastConfig.assignedProducts,
        isActive: lastConfig.isActive
      }));
    } else {
      alert("No previous coupon configuration found.");
    }
  };

  const handleClearAll = () => {
    setFormData({
      couponId: editingId ? formData.couponId : '',
      code: '',
      discountType: 'percentage',
      discountValue: '',
      usageMode: 'multi',
      startDate: '',
      expiryDate: '',
      minOrderAmount: 0,
      usageLimit: 0,
      assignedCategories: ['All Categories'],
      assignedProducts: ['All Products'],
      isActive: true
    });
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    const codeTrimmed = (formData.code || '').trim().toUpperCase();
    if (!codeTrimmed) {
      alert("Please enter a valid Coupon Code.");
      if (codeInputRef.current) codeInputRef.current.focus();
      return;
    }

    // Duplicate Coupon Code check
    const isDuplicate = coupons.some(c => (c.code || '').toUpperCase() === codeTrimmed && c.id !== editingId);
    if (isDuplicate) {
      alert(`Coupon code "${codeTrimmed}" already exists! Please use a unique coupon code.`);
      if (codeInputRef.current) codeInputRef.current.focus();
      return;
    }

    setIsSaving(true);

    const catArr = Array.isArray(formData.assignedCategories) && formData.assignedCategories.length > 0
      ? formData.assignedCategories
      : ['All Categories'];

    const prodArr = Array.isArray(formData.assignedProducts) && formData.assignedProducts.length > 0
      ? formData.assignedProducts
      : ['All Products'];

    let couponIdToSave = formData.couponId;
    if (!editingId && !couponIdToSave) {
      couponIdToSave = await generateNextCouponId(db);
    }

    const dataToSave = {
      ...formData,
      couponId: couponIdToSave || 'CPN-0001',
      code: codeTrimmed,
      discountValue: Number(formData.discountValue),
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      usageLimit: Number(formData.usageLimit) || 0,
      usageMode: formData.usageMode || 'multi',
      assignedCategories: catArr,
      categoryIds: catArr,
      assignedCategory: catArr.join(', '),
      assignedProducts: prodArr,
      productIds: prodArr,
      assignedProduct: prodArr.join(', '),
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('last_coupon_config', JSON.stringify({
        discountType: dataToSave.discountType,
        discountValue: dataToSave.discountValue,
        usageMode: dataToSave.usageMode,
        startDate: dataToSave.startDate,
        expiryDate: dataToSave.expiryDate,
        minOrderAmount: dataToSave.minOrderAmount,
        usageLimit: dataToSave.usageLimit,
        assignedCategories: catArr,
        assignedProducts: prodArr,
        isActive: dataToSave.isActive
      }));
    } catch (e) {}

    try {
      if (editingId) {
        await updateDoc(doc(db, 'coupons', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'coupons'), {
          ...dataToSave,
          createdAt: new Date().toISOString(),
          usedCount: 0
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      alert(`Coupon ${editingId ? 'updated' : 'created'} successfully! Coupon ID: ${dataToSave.couponId}`);
    } catch (err) {
      console.error("Error saving coupon", err);
      alert("Failed to save coupon. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const targetCoupon = coupons.find(c => c.id === id);
    const targetDisplay = targetCoupon ? (targetCoupon.couponId || targetCoupon.code) : '';

    if (window.confirm(`Are you sure you want to delete coupon ${targetDisplay}? All remaining coupons will be automatically renumbered sequentially (CPN-0001, CPN-0002, ...).`)) {
      try {
        await deleteDoc(doc(db, 'coupons', id));
        const remaining = coupons.filter(c => c.id !== id);
        await reorderCouponNumbers(db, remaining);
      } catch (err) {
        console.error("Error deleting coupon:", err);
        alert("Failed to delete coupon.");
      }
    }
  };

  const [isResettingNumbering, setIsResettingNumbering] = useState(false);

  const handleResetCouponNumbering = async () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset all coupon numbering? This action will renumber every coupon sequentially starting from CPN-0001."
    );
    if (!confirmReset) return;

    setIsResettingNumbering(true);
    try {
      await reorderCouponNumbers(db, coupons);
      alert("Coupon numbering has been reset successfully.");
    } catch (err) {
      console.error("Error resetting coupon numbering:", err);
      alert("Failed to reset coupon numbering.");
    } finally {
      setIsResettingNumbering(false);
    }
  };

  const toggleStatus = async (coupon) => {
    await updateDoc(doc(db, 'coupons', coupon.id), { isActive: !coupon.isActive });
  };

  // Helper to compute Status Badge
  const getCouponStatusBadge = (coupon) => {
    if (coupon.isActive === false || coupon.status === 'Disabled') {
      return { label: 'Disabled', color: '#475569', bg: '#f1f5f9' };
    }

    if (coupon.usageMode === 'one_time' && (coupon.usedCount > 0 || coupon.redeemedAt || coupon.status === 'Expired')) {
      return { label: 'Expired', color: '#dc2626', bg: '#fef2f2' };
    }

    if (coupon.expiryDate) {
      const expTime = new Date(coupon.expiryDate).getTime();
      const today = new Date().setHours(0, 0, 0, 0);
      if (expTime < today) {
        return { label: 'Expired', color: '#dc2626', bg: '#fef2f2' };
      }
    }

    if (coupon.startDate) {
      const startTime = new Date(coupon.startDate).getTime();
      const today = new Date().setHours(0, 0, 0, 0);
      if (startTime > today) {
        return { label: 'Scheduled', color: '#2563eb', bg: '#eff6ff' };
      }
    }

    if (coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit) {
      return { label: 'Expired', color: '#dc2626', bg: '#fef2f2' };
    }

    return { label: 'Active', color: '#16a34a', bg: '#dcfce7' };
  };

  // Filter & Sort Coupons
  const processedCoupons = useMemo(() => {
    let result = coupons.filter(c => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        (c.couponId || '').toLowerCase().includes(term) ||
        (c.code || '').toLowerCase().includes(term) ||
        (c.assignedCategory || '').toLowerCase().includes(term) ||
        (c.assignedProduct || '').toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (selectedStatusFilter === 'All') return true;

      const badge = getCouponStatusBadge(c);
      return badge.label.toLowerCase() === selectedStatusFilter.toLowerCase();
    });

    return result.sort((a, b) => {
      const numA = parseInt((a.couponId || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.couponId || '').replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [coupons, searchTerm, selectedStatusFilter]);

  const hasLastConfig = !!getLastCouponConfig();

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h1>Coupon System & Discount Manager</h1>
          <p className="text-muted">Manage sequential Coupon IDs, One-Time Use rules, and product discounts.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className="btn-secondary" 
            onClick={handleResetCouponNumbering}
            disabled={isResettingNumbering}
            title="Reset all coupon numbering sequentially starting from CPN-0001"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <RotateCcw size={16} className={isResettingNumbering ? 'animate-spin' : ''} />
            {isResettingNumbering ? 'Resetting...' : 'Reset Coupon Numbering'}
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Coupon
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1rem' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by Coupon ID (e.g. CPN-0001) or Code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} style={{ color: '#64748b' }} />
            <select 
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table text-xs">
            <thead>
              <tr>
                <th>Coupon ID</th>
                <th>Code</th>
                <th>Mode</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Assignment</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedCoupons.length > 0 ? (
                processedCoupons.map((coupon, index) => {
                  const badge = getCouponStatusBadge(coupon);
                  const displayId = coupon.couponId || `CPN-${String(index + 1).padStart(4, '0')}`;

                  const cats = Array.isArray(coupon.assignedCategories)
                    ? coupon.assignedCategories
                    : (coupon.assignedCategory ? coupon.assignedCategory.split(',').map(s => s.trim()) : ['All Categories']);

                  const prods = Array.isArray(coupon.assignedProducts)
                    ? coupon.assignedProducts
                    : (coupon.assignedProduct ? coupon.assignedProduct.split(',').map(s => s.trim()) : ['All Products']);

                  const isAllCat = cats.length === 0 || cats.includes('All Categories');
                  const isAllProd = prods.length === 0 || prods.includes('All Products');

                  return (
                    <tr key={coupon.id}>
                      <td>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 700, 
                          color: '#4f46e5', 
                          backgroundColor: '#e0e7ff', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '6px', 
                          fontSize: '0.8rem' 
                        }}>
                          {displayId}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Ticket size={16} className="text-primary" />
                          <span className="font-semibold">{coupon.code}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: coupon.usageMode === 'one_time' ? '#9333ea' : '#0284c7' }}>
                          {coupon.usageMode === 'one_time' ? '⚡ One-Time' : '🔄 Multi-Use'}
                        </span>
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
                        <span style={{ 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          color: badge.color, 
                          backgroundColor: badge.bg,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badge.color }}></span>
                          {badge.label}
                        </span>
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
                  <td colSpan="9" className="text-center text-muted" style={{ padding: '3rem' }}>
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
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-light, #e2e8f0)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                  {editingId ? `Edit Coupon (${formData.couponId || 'CPN-#'})` : 'Create Coupon'}
                </h2>
              </div>
              
              {!editingId && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {hasLastConfig && (
                    <button 
                      type="button" 
                      onClick={handleUseLastSettings} 
                      className="btn-outline" 
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#4f46e5', borderColor: '#c7d2fe' }}
                      title="Reload settings from last created coupon"
                    >
                      <Sparkles size={14} /> Use Last Settings
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={handleClearAll} 
                    className="btn-outline" 
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', borderColor: '#fecaca' }}
                    title="Reset all form fields to default"
                  >
                    <RotateCcw size={14} /> Clear All
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveCoupon} style={{ marginTop: '1rem' }}>
              {!editingId && (
                <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '6px', fontSize: '0.78rem', color: '#3730a3', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} style={{ color: '#4f46e5', flexShrink: 0 }} />
                  <span>Sequential Coupon ID (e.g. CPN-0001) will be generated automatically upon saving.</span>
                </div>
              )}

              {/* READ-ONLY COUPON ID FOR EDITING */}
              {editingId && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Sequential Coupon ID (Read-Only)</label>
                  <input 
                    type="text" 
                    disabled 
                    value={formData.couponId || 'CPN-0001'}
                    style={{ backgroundColor: '#f1f5f9', fontWeight: 700, color: '#4f46e5', fontFamily: 'monospace' }}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Coupon Code</label>
                <input 
                  ref={codeInputRef}
                  type="text" 
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="e.g. WELCOME20"
                />
              </div>

              {/* FEATURE 2: USAGE MODE (MULTI-USE VS ONE-TIME USE) */}
              <div className="form-group" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px' }}>
                <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem', color: '#6b21a8' }}>Usage Mode</label>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input 
                      type="radio" 
                      name="usageMode" 
                      value="multi"
                      checked={formData.usageMode === 'multi'}
                      onChange={(e) => setFormData({...formData, usageMode: e.target.value})}
                      style={{ accentColor: '#7e22ce', width: '16px', height: '16px' }}
                    />
                    <span><strong>Multi-Use</strong> (Can be used multiple times)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input 
                      type="radio" 
                      name="usageMode" 
                      value="one_time"
                      checked={formData.usageMode === 'one_time'}
                      onChange={(e) => setFormData({...formData, usageMode: e.target.value})}
                      style={{ accentColor: '#7e22ce', width: '16px', height: '16px' }}
                    />
                    <span><strong>One-Time Use</strong> (Auto-expires after 1st redemption)</span>
                  </label>
                </div>
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
                    placeholder={formData.usageMode === 'one_time' ? '1 (One-Time)' : 'e.g. 50 (0 for unlimited)'}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Start Date (Optional)</label>
                  <input 
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
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

              <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {!editingId && (
                  <button type="button" className="btn-outline" onClick={handleClearAll} style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Reset Form
                  </button>
                )}
                <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
                  <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={isSaving}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.4rem', 
                      opacity: isSaving ? 0.7 : 1, 
                      cursor: isSaving ? 'not-allowed' : 'pointer' 
                    }}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Saving Coupon...
                      </>
                    ) : (
                      editingId ? 'Update Coupon' : 'Save Coupon'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
