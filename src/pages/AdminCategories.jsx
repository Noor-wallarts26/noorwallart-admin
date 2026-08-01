import React, { useContext, useState, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Plus, Edit2, Trash2, Image as ImageIcon, Eye, EyeOff, Package, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const AdminCategories = () => {
  const { categories, products } = useContext(ShopContext);
  const navigate = useNavigate();
  
  // States for Category Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    order: 0,
    isEnabled: true
  });

  // States for Manage Products Modal
  const [isManageProductsOpen, setIsManageProductsOpen] = useState(false);
  const [managingCategory, setManagingCategory] = useState(null);
  
  // Search state for main Categories table
  const [searchQuery, setSearchQuery] = useState('');

  // Search state for Manage Products Add Existing dropdown
  const [addExistingQuery, setAddExistingQuery] = useState('');
  
  // Pagination for Categories
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // -------------------- NOTIFICATIONS --------------------
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // -------------------- CATEGORY CRUD --------------------
  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setFormData({
        name: cat.name || '',
        description: cat.description || '',
        imageUrl: cat.imageUrl || '',
        order: cat.order || 0,
        isEnabled: cat.isEnabled !== false
      });
    } else {
      setEditingCat(null);
      setFormData({ 
        name: '', description: '', imageUrl: '', order: categories.length, isEnabled: true
      });
    }
    setIsModalOpen(true);
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification("Image size should be less than 5MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCat && !editingCat.isVirtual) {
        await updateDoc(doc(db, "categories", editingCat.id), formData);
        showNotification("Category updated successfully");
      } else {
        await addDoc(collection(db, "categories"), formData);
        showNotification(editingCat ? "Category converted and updated successfully" : "Category created successfully");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving category", err);
      showNotification("Failed to save category", "error");
    }
  };

  const handleDelete = async (cat) => {
    if (window.confirm("Are you sure you want to delete this category? (Products inside will become uncategorized)")) {
      try {
        if (!cat.isVirtual) {
          await deleteDoc(doc(db, "categories", cat.id));
        }
        showNotification("Category deleted successfully");
        
        // Uncategorize products that belonged to this category
        const productsToUpdate = products.filter(p => p.category === cat.name);
        for (let p of productsToUpdate) {
           await updateDoc(doc(db, "products", p.id), { category: '' });
        }
      } catch (err) {
        console.error("Error deleting category", err);
        showNotification("Failed to delete category", "error");
      }
    }
  };

  const toggleStatus = async (cat) => {
    if (cat.isVirtual) {
        showNotification("Virtual categories are always active. Please edit the category to save it to database first.", "error");
        return;
    }
    try {
      await updateDoc(doc(db, "categories", cat.id), { isEnabled: !cat.isEnabled });
      showNotification(`Category ${!cat.isEnabled ? 'activated' : 'deactivated'}`);
    } catch (err) {
      console.error("Error updating status", err);
      showNotification("Failed to update status", "error");
    }
  };

  // -------------------- MANAGE PRODUCTS --------------------
  const handleOpenManageProducts = (cat) => {
    setManagingCategory(cat);
    setAddExistingQuery('');
    setIsManageProductsOpen(true);
  };

  const removeProductFromCategory = async (productId) => {
    try {
      await updateDoc(doc(db, "products", productId), { category: '' });
      showNotification("Product removed from category");
    } catch (err) {
      showNotification("Failed to remove product", "error");
    }
  };

  const addExistingProductToCategory = async (productId) => {
    try {
      await updateDoc(doc(db, "products", productId), { category: managingCategory.name });
      showNotification("Product added to category");
      setAddExistingQuery('');
    } catch (err) {
      showNotification("Failed to add product", "error");
    }
  };

  // -------------------- DERIVED DATA --------------------
  
  // Combine db categories and virtual categories from products
  const allCategories = useMemo(() => {
    const combined = [...categories];
    const existingNames = new Set(combined.map(c => c.name.toLowerCase()));
    
    products.forEach(p => {
      if (p.category && !existingNames.has(p.category.toLowerCase())) {
        existingNames.add(p.category.toLowerCase());
        combined.push({
          id: 'virtual-' + p.category,
          name: p.category,
          isVirtual: true,
          isEnabled: true,
          imageUrl: ''
        });
      }
    });
    return combined;
  }, [categories, products]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    let list = allCategories;
    if (searchQuery) {
      list = list.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return list.sort((a,b) => (a.order || 0) - (b.order || 0));
  }, [allCategories, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Products belonging to the currently managing category
  const categoryProducts = useMemo(() => {
    if (!managingCategory) return [];
    return products.filter(p => p.category === managingCategory.name);
  }, [products, managingCategory]);

  // Products NOT in the currently managing category (for the Add Existing dropdown)
  const availableProductsToAdd = useMemo(() => {
    if (!managingCategory) return [];
    return products.filter(p => p.category !== managingCategory.name && p.title.toLowerCase().includes(addExistingQuery.toLowerCase()));
  }, [products, managingCategory, addExistingQuery]);


  return (
    <div className="animate-fade-in pb-8" style={{ position: 'relative' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, background: notification.type === 'error' ? '#DC2626' : '#10B981', color: 'white', padding: '1rem 1.5rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 0.3s' }}>
          {notification.message}
        </div>
      )}

      {/* HEADER */}
      <div className="admin-page-header">
        <div>
          <h1>Categories</h1>
          <p className="text-muted">Manage your store's categories and their associated products.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="card mb-6" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search categories by name..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
          />
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="card table-container" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>S.No</th>
              <th>Category Name</th>
              <th style={{ textAlign: 'center' }}>Total Products</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCategories.map((cat, index) => {
              const productCount = products.filter(p => p.category === cat.name).length;
              const sNo = (currentPage - 1) * itemsPerPage + index + 1;
              return (
                <tr key={cat.id} style={{ opacity: cat.isEnabled === false ? 0.6 : 1 }}>
                  <td style={{ textAlign: 'center', fontWeight: '500', color: 'var(--text-muted)' }}>{sNo}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--bg-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)' }}>
                        {cat.imageUrl ? <img src={cat.imageUrl} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={20} className="text-muted" />}
                      </div>
                      <div>
                        <span className="font-semibold text-primary block">{cat.name}</span>
                        {cat.isVirtual && <span className="text-xs" style={{ color: 'var(--info)', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px' }}>Auto-generated</span>}
                        {cat.description && <span className="text-muted text-xs line-clamp-1">{cat.description}</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-color)', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                      <Package size={14} className="text-muted"/> {productCount}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => toggleStatus(cat)} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', margin: '0 auto' }}>
                      {cat.isEnabled === false ? <><EyeOff size={14}/> Inactive</> : <><Eye size={14}/> Active</>}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleOpenManageProducts(cat)} className="btn-secondary" style={{ marginRight: '0.5rem', fontSize: '0.85rem' }}>
                      <Package size={16} /> View Products
                    </button>
                    <button onClick={() => navigate('/products/add', { state: { prefillCategory: cat.name } })} className="btn-secondary" style={{ marginRight: '0.5rem', fontSize: '0.85rem' }} title="Add Product">
                      <Plus size={16} /> Add Product
                    </button>
                    <button onClick={() => handleOpenModal(cat)} style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer', padding: '0.5rem' }} title="Edit Category">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(cat)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.5rem' }} title="Delete Category">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {paginatedCategories.length === 0 && (
              <tr><td colSpan="4" className="text-center text-muted" style={{ padding: '3rem' }}>No categories found.</td></tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)' }}>
            <span className="text-sm text-muted">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCategories.length)} of {filteredCategories.length} categories</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-secondary" style={{ padding: '0.4rem' }}><ChevronLeft size={18}/></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-secondary" style={{ padding: '0.4rem' }}><ChevronRight size={18}/></button>
            </div>
          </div>
        )}
      </div>

      {/* CATEGORY ADD/EDIT MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{editingCat ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-group mb-4">
                <label>Category Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Islamic Wall Arts" />
              </div>

              <div className="form-group mb-4">
                <label>Description (Optional)</label>
                <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief category description" />
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Display Order</label>
                  <input type="number" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Status</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 0' }}>
                    <input type="checkbox" checked={formData.isEnabled} onChange={e => setFormData({...formData, isEnabled: e.target.checked})} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                    Active
                  </label>
                </div>
              </div>

              <div className="form-group mb-6">
                <label>Category Image (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'var(--bg-color)' }}>
                    {formData.imageUrl ? <img src={formData.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={24} className="text-muted" />}
                  </div>
                  <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                    Upload Image
                    <input type="file" accept="image/*" onChange={handleImageFileUpload} style={{ display: 'none' }} />
                  </label>
                  {formData.imageUrl && (
                    <button type="button" onClick={() => setFormData({...formData, imageUrl: ''})} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.85rem' }}>Remove</button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE PRODUCTS MODAL */}
      {isManageProductsOpen && managingCategory && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem 0' }}>View Products</h2>
                <p className="text-muted text-sm m-0">Category: <strong style={{ color: 'var(--primary)' }}>{managingCategory.name}</strong></p>
              </div>
              <button onClick={() => setIsManageProductsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24}/></button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, background: 'var(--bg-color)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', marginBottom: '2rem' }}>
                {/* Add Existing Product Section */}
                <div style={{ flex: 1, background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Add Existing Product</h4>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Search to add products..." 
                      value={addExistingQuery}
                      onChange={(e) => setAddExistingQuery(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.25rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  {addExistingQuery && (
                    <div style={{ marginTop: '0.5rem', border: '1px solid var(--border-light)', borderRadius: '6px', maxHeight: '150px', overflowY: 'auto', background: 'white' }}>
                      {availableProductsToAdd.length > 0 ? (
                        availableProductsToAdd.map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <img src={p.images?.[0] || '/placeholder.png'} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                              <span className="line-clamp-1" style={{ maxWidth: '200px' }}>{p.title}</span>
                            </div>
                            <button onClick={() => addExistingProductToCategory(p.id)} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Add</button>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No products found.</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Or Create New Section */}
                <div style={{ textAlign: 'center', padding: '2rem 1.5rem', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={32} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Can't find it?</p>
                  <button 
                    className="btn-primary" 
                    onClick={() => navigate('/products/add', { state: { prefillCategory: managingCategory.name } })}
                  >
                    <Plus size={16} /> Create New Product
                  </button>
                </div>
              </div>

              {/* Current Products List */}
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Products in this Category <span style={{ background: 'var(--primary)', color: 'white', padding: '0.1rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' }}>{categoryProducts.length}</span>
              </h3>
              
              {categoryProducts.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {categoryProducts.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                      <img src={p.images?.[0] || '/placeholder.png'} alt={p.title} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', marginRight: '1rem' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 className="line-clamp-1" style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>{p.title}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="text-muted text-xs">&#8377;{p.price}</span>
                          <span className="text-xs" style={{ background: p.isEnabled === false ? '#DC2626' : '#10B981', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                            {p.isEnabled === false ? 'Inactive' : 'Active'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                        <button onClick={() => navigate(`/products/edit/${p.id}`)} style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Product">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => removeProductFromCategory(p.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remove from Category">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <Package size={48} color="var(--border-color)" style={{ margin: '0 auto 1rem auto' }} />
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>No products yet</h4>
                  <p className="text-muted text-sm">Add an existing product or create a new one to populate this category.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCategories;

