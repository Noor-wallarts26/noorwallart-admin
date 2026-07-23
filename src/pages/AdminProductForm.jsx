import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { Camera, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const AdminProductForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { products } = useContext(ShopContext);
  
  // Try to get product from router state, or find it by ID if editing
  const existingProduct = location.state?.product || (id ? products.find(p => p.id === id) : null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(existingProduct?.imageUrl || null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: existingProduct?.title || '',
    price: existingProduct?.price || '',
    category: existingProduct?.category || 'Islamic wall arts',
    stock: existingProduct?.stock || '',
    description: existingProduct?.description || '',
    rating: existingProduct?.rating || 4.5,
    reviewsCount: existingProduct?.reviewsCount || 0,
    imageUrl: existingProduct?.imageUrl || ''
  });

  useEffect(() => {
    // If we're on edit route but didn't have product in state, wait for products context to load it
    if (id && !existingProduct && products.length > 0) {
      const p = products.find(p => p.id === id);
      if (p) {
        setImagePreview(p.imageUrl || null);
        setFormData({
          title: p.title,
          price: p.price,
          category: p.category,
          stock: p.stock,
          description: p.description,
          rating: p.rating || 0,
          reviewsCount: p.reviewsCount || 0,
          imageUrl: p.imageUrl || ''
        });
      }
    }
  }, [id, products, existingProduct]);

  const handleSave = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        
        const response = await fetch('https://api.imgbb.com/1/upload?key=a83109541379cee03db02b491fb98c17', {
          method: 'POST',
          body: uploadData
        });
        const result = await response.json();
        if (result.success) {
          finalImageUrl = result.data.url;
        } else {
          throw new Error('ImgBB upload failed: ' + (result.error?.message || 'Unknown error'));
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

      if (id || existingProduct) {
        // Update
        const docId = id || existingProduct.id;
        const docRef = doc(db, "products", docId.toString());
        await updateDoc(docRef, productData);
        alert("Product updated successfully!");
      } else {
        // Add
        const collRef = collection(db, "products");
        await addDoc(collRef, productData);
        alert("Product added successfully!");
      }
      
      setUploading(false);
      navigate('/products');
    } catch (err) {
      console.error(err);
      setUploading(false);
      alert("Error: " + err.message);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <header className="admin-page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate('/products')} 
          style={{ background: 'var(--surface-variant)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0 }}>{(id || existingProduct) ? 'Edit Product' : 'Add New Product'}</h1>
      </header>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label>Title</label>
            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
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
              <option>Islamic wall arts</option>
              <option>Customized Frames</option>
              <option>Wedding and nikkah collections</option>
              <option>Customized Gifts</option>
              <option>Acrylic & Glass works</option>
              <option>Home decor</option>
              <option>Wall stickers & Decals</option>
              <option>Custom printing</option>
              <option>Corporate and event products</option>
              <option>Personalized products</option>
            </select>
          </div>

          <div className="form-group">
            <label>Product Image</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {imagePreview && (
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-dark)', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'inline-block', width: 'fit-content' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '15px', maxWidth: '400px' }}>
                {/* Camera Button */}
                <label style={{ flex: 1, height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 15px', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '1rem', whiteSpace: 'nowrap', margin: 0, transition: 'background 0.2s' }}>
                  <Camera size={20} /> Take Photo
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>

                {/* Gallery Button */}
                <label style={{ flex: 1, height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 15px', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '1rem', whiteSpace: 'nowrap', margin: 0, transition: 'background 0.2s' }}>
                  <ImageIcon size={20} /> Gallery
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea rows="4" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => navigate('/products')} className="btn-secondary" style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={uploading} style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
              {uploading ? 'Uploading & Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductForm;
