import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { Camera, Image as ImageIcon, ArrowLeft, UploadCloud, Plus, Trash2, Tag } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const AdminProductForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { products } = useContext(ShopContext);
  
  const existingProduct = location.state?.product || (id ? products.find(p => p.id === id) : null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(existingProduct?.imageUrl || null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: existingProduct?.title || '',
    sku: existingProduct?.sku || '',
    regularPrice: existingProduct?.regularPrice || '',
    offerPrice: existingProduct?.offerPrice || existingProduct?.price || '',
    category: existingProduct?.category || 'Islamic wall arts',
    stock: existingProduct?.stock || '',
    deliveryCharge: existingProduct?.deliveryCharge !== undefined ? existingProduct.deliveryCharge : 80,
    description: existingProduct?.description || '',
    tags: existingProduct?.tags || '',
    seoTitle: existingProduct?.seoTitle || '',
    seoDescription: existingProduct?.seoDescription || '',
    rating: existingProduct?.rating || 4.5,
    reviewsCount: existingProduct?.reviewsCount || 0,
    imageUrl: existingProduct?.imageUrl || '',
    showInSlider: existingProduct?.showInSlider || false,
    isHidden: existingProduct?.isHidden || false
  });

  const [specifications, setSpecifications] = useState(existingProduct?.specifications || [{ name: '', value: '' }]);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCouponId, setSelectedCouponId] = useState(existingProduct?.couponId || '');

  // Load active coupons for assignment
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'coupons'), where('isActive', '==', true)));
        setAvailableCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { /* ignore */ }
    };
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (id && !existingProduct && products.length > 0) {
      const p = products.find(p => p.id === id);
      if (p) {
        setImagePreview(p.imageUrl || null);
        setFormData({
          title: p.title || '',
          sku: p.sku || '',
          regularPrice: p.regularPrice || '',
          offerPrice: p.offerPrice || p.price || '',
          category: p.category || 'Islamic wall arts',
          stock: p.stock || '',
          deliveryCharge: p.deliveryCharge !== undefined ? p.deliveryCharge : 80,
          description: p.description || '',
          tags: p.tags || '',
          seoTitle: p.seoTitle || '',
          seoDescription: p.seoDescription || '',
          rating: p.rating || 0,
          reviewsCount: p.reviewsCount || 0,
          imageUrl: p.imageUrl || '',
          showInSlider: p.showInSlider || false,
          isHidden: p.isHidden || false
        });
        if (p.specifications && p.specifications.length > 0) {
          setSpecifications(p.specifications);
        }
      }
    }
  }, [id, products, existingProduct]);

  const handleAddSpec = () => setSpecifications([...specifications, { name: '', value: '' }]);
  
  const handleSpecChange = (index, field, val) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = val;
    setSpecifications(newSpecs);
  };

  const handleRemoveSpec = (index) => {
    const newSpecs = [...specifications];
    newSpecs.splice(index, 1);
    setSpecifications(newSpecs);
  };

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

      // Filter out empty specifications
      const validSpecs = specifications.filter(s => s.name.trim() !== '' && s.value.trim() !== '');

      const productData = {
        ...formData,
        imageUrl: finalImageUrl,
        price: parseFloat(formData.offerPrice || formData.regularPrice),
        offerPrice: parseFloat(formData.offerPrice) || 0,
        regularPrice: parseFloat(formData.regularPrice) || 0,
        stock: parseInt(formData.stock),
        deliveryCharge: parseFloat(formData.deliveryCharge),
        rating: parseFloat(formData.rating),
        reviewsCount: parseInt(formData.reviewsCount),
        specifications: validSpecs,
        couponId: selectedCouponId || null,
      };

      if (id || existingProduct) {
        const docId = id || existingProduct.id;
        const docRef = doc(db, "products", docId.toString());
        await updateDoc(docRef, productData);
      } else {
        const collRef = collection(db, "products");
        await addDoc(collRef, productData);
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
    <div className="animate-fade-in pb-8">
      <div className="admin-page-header">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/products')} 
            className="btn-secondary"
            style={{ padding: '0.5rem' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="m-0">{(id || existingProduct) ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/products')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" form="product-form" className="btn-primary" disabled={uploading}>
            {uploading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      <form id="product-form" onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* General Information */}
          <div className="card">
            <h3 className="mb-4">General Information</h3>
            <div className="form-group">
              <label>Product Title</label>
              <input type="text" placeholder="e.g. Modern Calligraphy Canvas" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Product Description</label>
              <textarea 
                rows="8" 
                placeholder="Describe the product details, material, dimensions, etc..."
                required 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                style={{ resize: 'vertical' }} 
              />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="card">
            <h3 className="mb-4">Pricing & Inventory</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Regular Price (₹)</label>
                <input type="number" step="0.01" placeholder="0.00" value={formData.regularPrice} onChange={e => setFormData({...formData, regularPrice: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Offer Price (₹)</label>
                <input type="number" step="0.01" required placeholder="0.00" value={formData.offerPrice} onChange={e => setFormData({...formData, offerPrice: e.target.value})} />
              </div>
              <div className="form-group">
                <label>SKU (Stock Keeping Unit)</label>
                <input type="text" placeholder="e.g. NWA-1001" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input type="number" required placeholder="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0">Specifications</h3>
              <button type="button" onClick={handleAddSpec} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                <Plus size={14} /> Add Row
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {specifications.map((spec, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <input type="text" placeholder="Name (e.g. Material)" value={spec.name} onChange={e => handleSpecChange(index, 'name', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 2, margin: 0 }}>
                    <input type="text" placeholder="Value (e.g. Premium Canvas)" value={spec.value} onChange={e => handleSpecChange(index, 'value', e.target.value)} />
                  </div>
                  <button type="button" onClick={() => handleRemoveSpec(index)} className="btn-secondary text-error" style={{ padding: '0.6rem' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SEO & Search */}
          <div className="card">
            <h3 className="mb-4">SEO & Search</h3>
            <div className="form-group">
              <label>Search Tags (Comma separated)</label>
              <input type="text" placeholder="e.g. wall art, islamic, resin, gift" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
            </div>
            <div className="form-group">
              <label>SEO Title (Optional)</label>
              <input type="text" placeholder={formData.title || "Meta title for search engines"} value={formData.seoTitle} onChange={e => setFormData({...formData, seoTitle: e.target.value})} />
            </div>
            <div className="form-group">
              <label>SEO Description (Optional)</label>
              <textarea rows="3" placeholder="Meta description for search engines" value={formData.seoDescription} onChange={e => setFormData({...formData, seoDescription: e.target.value})} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Media */}
          <div className="card">
            <h3 className="mb-4">Product Image</h3>
            <div style={{ 
              border: '2px dashed var(--border-color)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '2rem 1rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-color)',
            }}>
              {imagePreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', maxWidth: '200px', aspectRatio: '1', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                  <div className="flex gap-2 justify-center mt-4">
                    <label className="btn-secondary text-sm cursor-pointer w-full justify-center">
                      <Camera size={16} /> Replace
                      <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <UploadCloud size={48} className="text-muted mb-4" />
                  <p className="text-muted text-sm mb-4">Upload a high-quality image of the product.</p>
                  <label className="btn-secondary cursor-pointer">
                    <ImageIcon size={16} /> Select File
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Organization */}
          <div className="card">
            <h3 className="mb-4">Organization</h3>
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
                <option>Resin Arts</option>
              </select>
            </div>
            
            <div className="form-group mt-4">
              <label>Delivery Charge (₹)</label>
              <input type="number" required value={formData.deliveryCharge} onChange={e => setFormData({...formData, deliveryCharge: e.target.value === '' ? '' : e.target.value})} />
            </div>
          </div>

          {/* Assign Coupon */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Tag size={18} color="var(--primary)" />
              <h3 className="m-0">Assign Coupon</h3>
            </div>
            <p className="text-xs text-muted" style={{ marginBottom: '1rem' }}>
              Optionally link an active coupon to this product. Customers will see it on the product page.
            </p>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Select Coupon (Optional)</label>
              <select
                value={selectedCouponId}
                onChange={e => setSelectedCouponId(e.target.value)}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-variant)' }}
              >
                <option value="">-- No Coupon --</option>
                {availableCoupons.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} &nbsp;–&nbsp;
                    {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    {c.minOrderAmount ? ` (Min ₹${c.minOrderAmount})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {selectedCouponId && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#16A34A', fontWeight: 500 }}>
                ✅ Coupon will be shown on the product page.
              </p>
            )}
          </div>

          {/* Visibility */}
          <div className="card">
            <h3 className="mb-4">Visibility</h3>
            
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
              <input 
                type="checkbox" 
                id="isHidden"
                checked={formData.isHidden}
                onChange={e => setFormData({...formData, isHidden: e.target.checked})}
                style={{ width: '1.25rem', height: '1.25rem', margin: 0, accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <label htmlFor="isHidden" style={{ margin: 0, cursor: 'pointer', fontWeight: 500 }}>Hide from Store</label>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', margin: 0 }}>
              <input 
                type="checkbox" 
                id="showInSlider"
                checked={formData.showInSlider}
                onChange={e => setFormData({...formData, showInSlider: e.target.checked})}
                style={{ width: '1.25rem', height: '1.25rem', margin: 0, accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <label htmlFor="showInSlider" style={{ margin: 0, cursor: 'pointer', fontWeight: 500 }}>Feature on Slider</label>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default AdminProductForm;
