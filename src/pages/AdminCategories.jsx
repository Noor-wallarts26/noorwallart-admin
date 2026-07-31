import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Eye, EyeOff, HelpCircle, UploadCloud, ChevronRight, FolderTree } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AdminCategories = () => {
  const { categories } = useContext(ShopContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(true);
  const [editingCat, setEditingCat] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '', // '' means Parent Category, otherwise holds parent category ID
    imageUrl: '',
    bannerUrl: '',
    isEnabled: true,
    seoTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setFormData({
        name: cat.name || '',
        description: cat.description || '',
        parentId: cat.parentId || '',
        imageUrl: cat.imageUrl || '',
        bannerUrl: cat.bannerUrl || '',
        isEnabled: cat.isEnabled !== false,
        seoTitle: cat.seoTitle || '',
        metaDescription: cat.metaDescription || '',
        metaKeywords: cat.metaKeywords || ''
      });
    } else {
      setEditingCat(null);
      setFormData({ 
        name: '', description: '', parentId: '', imageUrl: '', bannerUrl: '', isEnabled: true,
        seoTitle: '', metaDescription: '', metaKeywords: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleImageFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await updateDoc(doc(db, "categories", editingCat.id), formData);
      } else {
        const order = categories.length;
        await addDoc(collection(db, "categories"), { ...formData, order });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving category", err);
      alert("Failed to save category");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this category? Products in this category will remain intact.")) {
      try {
        await deleteDoc(doc(db, "categories", id));
      } catch (err) {
        console.error("Error deleting category", err);
      }
    }
  };

  const toggleStatus = async (cat) => {
    try {
      await updateDoc(doc(db, "categories", cat.id), { isEnabled: !cat.isEnabled });
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  const moveOrder = async (index, direction) => {
    if (direction === 'up' && index > 0) {
      const current = categories[index];
      const previous = categories[index - 1];
      await updateDoc(doc(db, "categories", current.id), { order: previous.order || index - 1 });
      await updateDoc(doc(db, "categories", previous.id), { order: current.order || index });
    } else if (direction === 'down' && index < categories.length - 1) {
      const current = categories[index];
      const next = categories[index + 1];
      await updateDoc(doc(db, "categories", current.id), { order: next.order || index + 1 });
      await updateDoc(doc(db, "categories", next.id), { order: current.order || index });
    }
  };

  // Helper to find parent name
  const getParentName = (parentId) => {
    if (!parentId) return 'Main Parent Category';
    const parent = categories.find(c => c.id === parentId);
    return parent ? `Child of: ${parent.name}` : 'Main Parent Category';
  };

  return (
    <div className="animate-fade-in pb-8">
      <div className="admin-page-header">
        <div>
          <h1>Categories & Catalog Taxonomy</h1>
          <p className="text-muted">Organize your store into parent and child categories.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => setShowHelpGuide(!showHelpGuide)}>
            <HelpCircle size={18} /> {showHelpGuide ? 'Hide Help Guide' : 'Category Help Guide'}
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Category
          </button>
        </div>
      </div>

      {/* CATEGORY HELP GUIDE BOX */}
      {showHelpGuide && (
        <div className="card mb-6" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <FolderTree size={24} color="#1D4ED8" />
            <h3 style={{ margin: 0, color: '#1E40AF', fontSize: '1.1rem' }}>Category Structure & Help Guide</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="text-sm">
            <div>
              <strong style={{ color: '#1E3A8A' }}>1. Parent vs. Child Categories:</strong>
              <ul className="text-xs text-muted" style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', lineHeight: '1.6' }}>
                <li><strong>Parent Category:</strong> Main top-level groups like <em>"Islamic Wall Arts"</em> or <em>"Resin Arts"</em>.</li>
                <li><strong>Child Category:</strong> Sub-groups linked under a parent, e.g. <em>"Acrylic Calligraphy"</em> under <em>"Islamic Wall Arts"</em>.</li>
              </ul>
            </div>
            <div>
              <strong style={{ color: '#1E3A8A' }}>2. Image & SEO Fields:</strong>
              <ul className="text-xs text-muted" style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', lineHeight: '1.6' }}>
                <li><strong>Category Image:</strong> Displayed on store navigation cards and headers.</li>
                <li><strong>Status:</strong> Enable/Disable to control visibility on the store homepage.</li>
                <li><strong>SEO Meta:</strong> Custom title & descriptions for search engine ranking.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="card table-container" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>Reorder</th>
              <th>Category Details</th>
              <th>Type / Hierarchy</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, index) => (
              <tr key={cat.id} style={{ opacity: cat.isEnabled === false ? 0.6 : 1 }}>
                <td style={{ textAlign: 'center' }}>
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={() => moveOrder(index, 'up')} disabled={index === 0} className="text-muted hover:text-primary disabled:opacity-30"><ArrowUp size={16}/></button>
                    <button onClick={() => moveOrder(index, 'down')} disabled={index === categories.length - 1} className="text-muted hover:text-primary disabled:opacity-30"><ArrowDown size={16}/></button>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--bg-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                      {cat.imageUrl ? <img src={cat.imageUrl} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={20} className="text-muted" />}
                    </div>
                    <div>
                      <span className="font-semibold text-primary block">{cat.name}</span>
                      {cat.description && <span className="text-muted text-xs line-clamp-1">{cat.description}</span>}
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${cat.parentId ? 'pending' : 'accepted'}`} style={{ fontSize: '0.75rem' }}>
                    {getParentName(cat.parentId)}
                  </span>
                </td>
                <td>
                  <button onClick={() => toggleStatus(cat)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                    {cat.isEnabled === false ? <><EyeOff size={14}/> Inactive</> : <><Eye size={14}/> Active</>}
                  </button>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => handleOpenModal(cat)} style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer', padding: '0.25rem' }} title="Edit"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(cat.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem', marginLeft: '0.5rem' }} title="Delete"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan="5" className="text-center text-muted" style={{ padding: '3rem' }}>No categories found. Start by adding one.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CATEGORY ADD/EDIT MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '16px' }}>
            <h2 className="mb-4">{editingCat ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSave}>
              
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Category Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Islamic Wall Arts" />
              </div>

              {/* PARENT / CHILD SELECTION */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label style={{ fontWeight: 600 }}>Category Hierarchy (Parent / Child)</label>
                <select value={formData.parentId} onChange={e => setFormData({...formData, parentId: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <option value="">(None) - Create as Main Parent Category</option>
                  {categories.filter(c => !editingCat || c.id !== editingCat.id).map(c => (
                    <option key={c.id} value={c.id}>Child under: {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label style={{ fontWeight: 600 }}>Description</label>
                <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief category summary" />
              </div>

              {/* CATEGORY IMAGE FILE UPLOAD */}
              <div className="form-group" style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Category Image</label>
                {formData.imageUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={formData.imageUrl} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
                    <label className="btn-outline" style={{ cursor: 'pointer', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      Replace Image
                      <input type="file" accept="image/*" onChange={e => handleImageFileUpload(e, 'imageUrl')} style={{ display: 'none' }} />
                    </label>
                  </div>
                ) : (
                  <label className="btn-outline" style={{ cursor: 'pointer', padding: '0.6rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UploadCloud size={16} /> Upload Category Image
                    <input type="file" accept="image/*" onChange={e => handleImageFileUpload(e, 'imageUrl')} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {/* STATUS TOGGLE */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                  <input type="checkbox" checked={formData.isEnabled} onChange={e => setFormData({...formData, isEnabled: e.target.checked})} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                  Category Status: Active (Visible on Website)
                </label>
              </div>

              {/* SEO OPTIONAL FIELDS */}
              <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '1.5rem', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Optional Category SEO Fields</h4>
                <div className="form-group">
                  <label className="text-xs">SEO Meta Title</label>
                  <input type="text" value={formData.seoTitle} onChange={e => setFormData({...formData, seoTitle: e.target.value})} placeholder="Title for Search Engines" />
                </div>
                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="text-xs">Meta Description</label>
                  <textarea rows="2" value={formData.metaDescription} onChange={e => setFormData({...formData, metaDescription: e.target.value})} placeholder="Summary for Google Search" />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Category</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;

