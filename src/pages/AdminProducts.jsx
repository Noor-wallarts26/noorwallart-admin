import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const AdminProducts = () => {
  const { products } = useContext(ShopContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: 'Electronics',
    stock: '',
    description: '',
    rating: 0,
    reviewsCount: 0,
    imageUrl: ''
  });

  const handleOpenModal = (product = null) => {
    setImageFile(null);
    if (product) {
      setEditingProduct(product);
      setImagePreview(product.imageUrl || null);
      setFormData({
        title: product.title,
        price: product.price,
        category: product.category,
        stock: product.stock,
        description: product.description,
        rating: product.rating || 0,
        reviewsCount: product.reviewsCount || 0,
        imageUrl: product.imageUrl || ''
      });
    } else {
      setEditingProduct(null);
      setImagePreview(null);
      setFormData({
        title: '',
        price: '',
        category: 'Electronics',
        stock: '',
        description: '',
        rating: 4.5,
        reviewsCount: 0,
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        
        const response = await fetch('https://api.imgbb.com/1/upload?key=6033b63071c9f62db400a5b8e4b0c199', {
          method: 'POST',
          body: uploadData
        });
        const result = await response.json();
        if (result.success) {
          finalImageUrl = result.data.url;
        } else {
          throw new Error('ImgBB upload failed');
        }
      }

      const productData = {
        ...formData,
        imageUrl: finalImageUrl,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        rating: parseFloat(formData.rating),
        reviewsCount: parseInt(formData.reviewsCount)
      };
      if (editingProduct) {
        // Update
        const docRef = doc(db, "products", editingProduct.id.toString());
        await updateDoc(docRef, productData);
      } else {
        // Add
        const collRef = collection(db, "products");
        // For new products, we generate an ID manually if we want to keep it simple, or let firestore do it
        await addDoc(collRef, productData);
      }
      setIsModalOpen(false);
      // In a real app, ShopContext should have a listener for firestore so it updates automatically
      // But since we are pushing directly, we just alert or rely on the context listener
      alert("Product saved! Refresh page if context hasn't updated.");
    } catch (err) {
      console.error(err);
      alert("Error saving product");
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", id.toString()));
        alert("Deleted!");
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <header className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Manage Products</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={18} /> Add Product
        </button>
      </header>

      <div className="admin-table-container card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.category}</td>
                <td>${p.price.toFixed(2)}</td>
                <td>
                  <span className={p.stock > 0 ? "admin-badge success" : "admin-badge"} style={{ backgroundColor: p.stock === 0 ? 'rgba(239, 68, 68, 0.2)' : undefined, color: p.stock === 0 ? '#ef4444' : undefined }}>
                    {p.stock}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleOpenModal(p)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: '0.5rem' }}><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Price ($)</label>
                  <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Stock</label>
                  <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Books</option>
                  <option>Home</option>
                  <option>Beauty</option>
                </select>
              </div>
              <div className="form-group">
                <label>Product Image (Camera / Gallery)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                  )}
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <button type="submit" className="btn-primary mt-2" disabled={uploading}>
                {uploading ? 'Uploading Image & Saving...' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
