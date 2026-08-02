import React, { useState, useEffect, useContext } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShopContext } from '../context/ShopContext';
import { MessageCircle, Mail, Hash as Instagram, Hash as Facebook, Store, Settings, CreditCard, Shield, Globe, MapPin, Clock, Truck, FileText, Image as ImageIcon, UploadCloud, Trash2, Key, Lock, Eye, EyeOff, Plus, Edit, X, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const AdminSettings = () => {
  const { isPinVerified, verifyPin, sendPinResetLink, banners, categories } = useContext(ShopContext);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Banners State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerUploadProgress, setBannerUploadProgress] = useState(0);
  
  const [bannerFormData, setBannerFormData] = useState({
    title: '',
    description: '',
    imageURL: '',
    category: 'All', 
    isActive: true,
    showOnHomepage: true,
    enableAutoSlider: true,
    link: '',
    mediaType: 'image'
  });

  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerPreviewURL, setBannerPreviewURL] = useState('');

  const sortedBanners = [...banners].sort((a, b) => (a.order || 0) - (b.order || 0));

  // PIN Protection State for Payment Settings
  const [isPaymentUnlocked, setIsPaymentUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Settings State
  const [settings, setSettings] = useState({
    // General & Brand
    storeName: 'Noor Wall Arts & Resin Arts',
    logoUrl: '/logo.jpg',
    faviconUrl: '',
    homepageBannerUrl: '/hero_banner.png',
    
    // Contact & Socials
    whatsapp: '8925325330',
    email: 'noorwallartsofficial@gmail.com',
    instagram: '@noor.wallarts',
    facebook: '',
    address: '',
    workingHours: '',
    googleBusinessLink: '',
    
    // SEO
    seoTitle: 'Noor Wall Arts - Premium Islamic Calligraphy & Resin Arts',
    metaDescription: 'Shop premium quality Islamic wall arts, customized frames, and resin arts.',
    metaKeywords: 'islamic art, wall art, resin art, customized gifts',
    
    // Shipping & Tax
    defaultShippingCharge: 80,
    freeShippingThreshold: 2000,
    taxPercentage: 0,
    taxIncludedInPrice: true,

    // Payment Settings
    upiId: 'noorarts@ybl',
    qrCodeUrl: '/qr_code_sample.png'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'storeInfo');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Image Upload Handler (Converts File to DataURL / Upload Preview)
  const handleImageFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size should be less than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUnlockPayment = (e) => {
    e.preventDefault();
    setPinError('');
    if (verifyPin(pinInput)) {
      setIsPaymentUnlocked(true);
      setPinInput('');
    } else {
      setPinError('Incorrect 6-digit Admin PIN.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'storeInfo'), settings, { merge: true });
      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  // Banner Handlers
  const handleOpenBannerModal = (banner = null) => {
    setEditingBanner(banner);
    if (banner) {
      setBannerFormData({
        title: banner.title || '',
        description: banner.description || '',
        imageURL: banner.imageURL || '',
        category: banner.category || 'All',
        isActive: banner.isActive !== false,
        showOnHomepage: banner.showOnHomepage !== false,
        enableAutoSlider: banner.enableAutoSlider !== false,
        link: banner.link || '',
        mediaType: banner.mediaType || 'image'
      });
      setBannerPreviewURL(banner.imageURL || '');
    } else {
      setBannerFormData({
        title: '',
        description: '',
        imageURL: '',
        category: 'All',
        isActive: true,
        showOnHomepage: true,
        enableAutoSlider: true,
        link: '',
        mediaType: 'image'
      });
      setBannerPreviewURL('');
    }
    setBannerImageFile(null);
    setBannerUploadProgress(0);
    setIsBannerModalOpen(true);
  };

  const handleBannerImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setBannerImageFile(file);
      setBannerPreviewURL(URL.createObjectURL(file));
      const isVideo = file.type.startsWith('video/');
      setBannerFormData(prev => ({ ...prev, mediaType: isVideo ? 'video' : 'image' }));
    }
  };

  const uploadBannerImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage();
      const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setBannerUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    setBannerSaving(true);
    try {
      let finalImageURL = bannerFormData.imageURL;
      
      if (bannerImageFile) {
        finalImageURL = await uploadBannerImage(bannerImageFile);
      }

      if (!finalImageURL) {
        alert('Please select a banner image');
        setBannerSaving(false);
        return;
      }

      const bannerDataToSave = {
        ...bannerFormData,
        imageURL: finalImageURL,
        updatedAt: Date.now()
      };

      if (editingBanner) {
        await updateDoc(doc(db, "banners", editingBanner.id), bannerDataToSave);
      } else {
        const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order || 0)) : 0;
        await addDoc(collection(db, "banners"), {
          ...bannerDataToSave,
          order: maxOrder + 1,
          createdAt: Date.now()
        });
      }

      setIsBannerModalOpen(false);
    } catch (err) {
      console.error("Error saving banner:", err);
      alert("Failed to save banner");
    } finally {
      setBannerSaving(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      try {
        await deleteDoc(doc(db, "banners", id));
      } catch (err) {
        console.error("Error deleting banner:", err);
        alert("Failed to delete banner");
      }
    }
  };

  const handleMoveBanner = async (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === sortedBanners.length - 1)
    ) {
      return;
    }

    const currentBanner = sortedBanners[index];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const swapBanner = sortedBanners[targetIndex];

    try {
      const currentOrder = currentBanner.order || index;
      const swapOrder = swapBanner.order || targetIndex;
      
      await updateDoc(doc(db, "banners", currentBanner.id), { order: swapOrder });
      await updateDoc(doc(db, "banners", swapBanner.id), { order: currentOrder });
    } catch (err) {
      console.error("Error reordering banners:", err);
      alert("Failed to reorder banners");
    }
  };

  const toggleBannerStatus = async (banner) => {
    try {
      await updateDoc(doc(db, "banners", banner.id), { isActive: !banner.isActive });
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  if (loading) return <div className="p-8 text-muted">Loading settings...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px' }}>
      <div className="admin-page-header">
        <h1>Website Settings</h1>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Settings Sidebar Menu */}
        <div className="card" style={{ width: '250px', padding: '1rem', flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <button type="button" onClick={() => setActiveTab('general')} className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`} style={getTabStyle(activeTab === 'general')}>
              <Store size={18} /> General & Brand
            </button>
            <button type="button" onClick={() => setActiveTab('contact')} className={`settings-tab-btn ${activeTab === 'contact' ? 'active' : ''}`} style={getTabStyle(activeTab === 'contact')}>
              <MessageCircle size={18} /> Contact & Socials
            </button>
            <button type="button" onClick={() => setActiveTab('seo')} className={`settings-tab-btn ${activeTab === 'seo' ? 'active' : ''}`} style={getTabStyle(activeTab === 'seo')}>
              <Globe size={18} /> SEO & Meta
            </button>
            <button type="button" onClick={() => setActiveTab('shipping')} className={`settings-tab-btn ${activeTab === 'shipping' ? 'active' : ''}`} style={getTabStyle(activeTab === 'shipping')}>
              <Truck size={18} /> Shipping & Tax
            </button>
            <button type="button" onClick={() => setActiveTab('payment')} className={`settings-tab-btn ${activeTab === 'payment' ? 'active' : ''}`} style={getTabStyle(activeTab === 'payment')}>
              <CreditCard size={18} /> Payment Settings
            </button>
            <button type="button" onClick={() => setActiveTab('advanced')} className={`settings-tab-btn ${activeTab === 'advanced' ? 'active' : ''}`} style={getTabStyle(activeTab === 'advanced')}>
              <Settings size={18} /> Advanced
            </button>
          </nav>
        </div>

        {/* Settings Content Area */}
        <div className="card" style={{ flex: 1 }}>
          <form onSubmit={handleSave}>
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="animate-fade-in">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}><Store size={20} className="text-muted" /> Store Information & Brand Images</h3>
                
                <div className="form-group">
                  <label>Store Name</label>
                  <input type="text" value={settings.storeName} onChange={e => handleChange('storeName', e.target.value)} placeholder="Enter store name" />
                </div>

                {/* WEBSITE LOGO IMAGE UPLOAD */}
                <div className="form-group" style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Website Logo</label>
                  {settings.logoUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <img src={settings.logoUrl} alt="Website Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-light)' }} />
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <label className="btn-outline" style={{ cursor: 'pointer', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <UploadCloud size={16} /> Replace Image
                          <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'logoUrl')} style={{ display: 'none' }} />
                        </label>
                        <button type="button" className="btn-secondary" style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleChange('logoUrl', '')}>
                          <Trash2 size={16} /> Delete Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', border: '2px dashed var(--border-light)', borderRadius: '8px', cursor: 'pointer' }}>
                      <ImageIcon size={32} className="text-muted mb-2" />
                      <span className="text-sm font-medium">Click to Upload Website Logo</span>
                      <span className="text-xs text-muted mt-1">PNG, JPG, SVG up to 5MB</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'logoUrl')} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>

                {/* HOMEPAGE BANNER MANAGEMENT */}
                <div className="form-group" style={{ marginTop: '2.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Homepage Banners</h3>
                    <button type="button" className="btn-primary" onClick={() => handleOpenBannerModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                      <Plus size={16} /> Add New Homepage Banner
                    </button>
                  </div>
                  <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
                    Create unlimited banners. If you create more than one, they will automatically appear in a slider on the homepage.
                  </p>

                  <div className="table-responsive" style={{ border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Banner</th>
                          <th>Details</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedBanners.length > 0 ? (
                          sortedBanners.map((banner, index) => (
                            <tr key={banner.id}>
                              <td>
                                <div className="flex flex-col gap-1 items-center justify-center">
                                  <button type="button" className="btn-icon" onClick={() => handleMoveBanner(index, 'up')} disabled={index === 0} style={{ padding: '4px', opacity: index === 0 ? 0.3 : 1 }}>
                                    <ArrowUp size={16} />
                                  </button>
                                  <span className="text-muted text-sm font-medium">{index + 1}</span>
                                  <button type="button" className="btn-icon" onClick={() => handleMoveBanner(index, 'down')} disabled={index === sortedBanners.length - 1} style={{ padding: '4px', opacity: index === sortedBanners.length - 1 ? 0.3 : 1 }}>
                                    <ArrowDown size={16} />
                                  </button>
                                </div>
                              </td>
                              <td>
                                <div style={{ width: '100px', height: '50px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-light)' }}>
                                  {banner.imageURL ? (
                                    banner.mediaType === 'video' ? (
                                      <video src={banner.imageURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                                    ) : (
                                      <img src={banner.imageURL} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )
                                  ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <ImageIcon size={20} color="var(--text-muted)" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="font-medium text-sm">{banner.title || 'Untitled'}</div>
                                {banner.showOnHomepage && <span className="text-xs text-primary" style={{ display: 'inline-block', marginTop: '2px', backgroundColor: '#EFF6FF', padding: '2px 6px', borderRadius: '4px' }}>Shows on Homepage</span>}
                              </td>
                              <td>
                                <span className="status-badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
                                  {banner.category === 'All' ? 'All Categories' : categories.find(c => c.id === banner.category)?.name || banner.category}
                                </span>
                              </td>
                              <td>
                                <button type="button" onClick={() => toggleBannerStatus(banner)} className={`status-badge ${banner.isActive !== false ? 'delivered' : 'cancelled'}`} style={{ cursor: 'pointer', border: 'none' }}>
                                  {banner.isActive !== false ? 'Active' : 'Disabled'}
                                </button>
                              </td>
                              <td>
                                <div className="flex gap-2">
                                  <button type="button" className="btn-icon" onClick={() => handleOpenBannerModal(banner)} title="Edit Banner">
                                    <Edit size={16} />
                                  </button>
                                  <button type="button" className="btn-icon text-danger" onClick={() => handleDeleteBanner(banner.id)} title="Delete Banner">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center text-muted" style={{ padding: '2rem' }}>
                              No banners added yet. Add a banner to display it on your website.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CONTACT TAB */}
            {activeTab === 'contact' && (
              <div className="animate-fade-in">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}><MessageCircle size={20} className="text-muted" /> Contact & Location</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label><Mail size={16} className="inline text-muted mr-1" /> Support Email</label>
                    <input type="email" value={settings.email} onChange={e => handleChange('email', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label><MessageCircle size={16} className="inline text-muted mr-1" /> WhatsApp Number</label>
                    <input type="text" value={settings.whatsapp} onChange={e => handleChange('whatsapp', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label><Instagram size={16} className="inline text-muted mr-1" /> Instagram</label>
                    <input type="text" value={settings.instagram} onChange={e => handleChange('instagram', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label><Facebook size={16} className="inline text-muted mr-1" /> Facebook</label>
                    <input type="text" value={settings.facebook} onChange={e => handleChange('facebook', e.target.value)} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label><MapPin size={16} className="inline text-muted mr-1" /> Store Address</label>
                  <textarea rows="3" value={settings.address} onChange={e => handleChange('address', e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label><Clock size={16} className="inline text-muted mr-1" /> Working Hours</label>
                    <input type="text" placeholder="e.g. Mon-Sat 9AM-8PM" value={settings.workingHours} onChange={e => handleChange('workingHours', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label><Globe size={16} className="inline text-muted mr-1" /> Google Business Link</label>
                    <input type="url" value={settings.googleBusinessLink} onChange={e => handleChange('googleBusinessLink', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* SEO TAB */}
            {activeTab === 'seo' && (
              <div className="animate-fade-in">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}><Globe size={20} className="text-muted" /> Search Engine Optimization</h3>
                
                <div className="form-group">
                  <label>SEO Title (Site-wide)</label>
                  <input type="text" value={settings.seoTitle} onChange={e => handleChange('seoTitle', e.target.value)} />
                </div>

                <div className="form-group mt-4">
                  <label>Meta Description</label>
                  <textarea rows="3" value={settings.metaDescription} onChange={e => handleChange('metaDescription', e.target.value)} />
                </div>

                <div className="form-group mt-4">
                  <label>Meta Keywords (Comma separated)</label>
                  <input type="text" value={settings.metaKeywords} onChange={e => handleChange('metaKeywords', e.target.value)} />
                </div>
              </div>
            )}

            {/* SHIPPING & TAX TAB */}
            {activeTab === 'shipping' && (
              <div className="animate-fade-in">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}><Truck size={20} className="text-muted" /> Shipping & Tax Settings</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Default Shipping Charge (₹)</label>
                    <input type="number" value={settings.defaultShippingCharge} onChange={e => handleChange('defaultShippingCharge', Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Free Shipping Threshold (₹)</label>
                    <input type="number" value={settings.freeShippingThreshold} onChange={e => handleChange('freeShippingThreshold', Number(e.target.value))} />
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT TAB WITH 6-DIGIT PIN SECURITY */}
            {activeTab === 'payment' && (
              <div className="animate-fade-in">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}><CreditCard size={20} className="text-muted" /> Payment Settings & QR Code</h3>

                {(!isPaymentUnlocked && !isPinVerified) ? (
                  <div style={{ padding: '2rem', border: '1px solid var(--border-light)', borderRadius: '12px', textAlign: 'center', backgroundColor: 'var(--surface-hover)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', margin: '0 auto 1rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={32} />
                    </div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Payment Settings Locked</h4>
                    <p className="text-sm text-muted" style={{ marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                      Enter your 6-digit Admin PIN to edit UPI ID, replace QR Code, or modify payment configurations. Default PIN: <strong>252007</strong>
                    </p>

                    {pinError && (
                      <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', maxWidth: '300px', margin: '0 auto 1rem auto' }}>
                        {pinError}
                      </div>
                    )}

                    <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                      <input 
                        type="password"
                        maxLength={6}
                        placeholder="Enter 6-digit PIN"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                        style={{ width: '100%', padding: '0.8rem', fontSize: '1.25rem', textAlign: 'center', letterSpacing: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '1rem' }}
                      />
                      <button type="button" className="btn-primary" style={{ width: '100%', padding: '0.8rem' }} onClick={handleUnlockPayment}>
                        Unlock Payment Settings
                      </button>
                    </div>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                      <button 
                        type="button" 
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                        onClick={sendPinResetLink}
                      >
                        Forgot PIN? Send Reset Link to Email
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                      <div className="flex items-center gap-3">
                        <Shield size={24} className="text-success" />
                        <div>
                          <h4 style={{ margin: 0, color: '#166534' }}>PIN Verified - Payment Editor Unlocked</h4>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#15803D' }}>You can update UPI VPA and payment QR code image below.</p>
                        </div>
                      </div>
                    </div>

                    {/* UPI ID INPUT */}
                    <div className="form-group">
                      <label style={{ fontWeight: 600 }}>UPI ID (VPA)</label>
                      <input 
                        type="text" 
                        value={settings.upiId || ''} 
                        onChange={e => handleChange('upiId', e.target.value)} 
                        placeholder="e.g. noorarts@ybl" 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                      />
                      <p className="text-muted text-xs mt-1">This UPI ID is displayed on customer checkout page for QR payment.</p>
                    </div>

                    {/* QR CODE IMAGE UPLOAD & PREVIEW */}
                    <div className="form-group" style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Payment QR Code Image</label>
                      {settings.qrCodeUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <img src={settings.qrCodeUrl} alt="Payment QR Code" style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'contain', border: '1px solid var(--border-light)', padding: '0.5rem', backgroundColor: '#FFF' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label className="btn-outline" style={{ cursor: 'pointer', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <UploadCloud size={16} /> Upload New QR Code
                              <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'qrCodeUrl')} style={{ display: 'none' }} />
                            </label>
                            <button type="button" className="btn-secondary" style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleChange('qrCodeUrl', '')}>
                              <Trash2 size={16} /> Delete QR Code
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', border: '2px dashed var(--border-light)', borderRadius: '8px', cursor: 'pointer' }}>
                          <ImageIcon size={32} className="text-muted mb-2" />
                          <span className="text-sm font-medium">Click to Upload Payment QR Code</span>
                          <span className="text-xs text-muted mt-1">PNG, JPG up to 5MB</span>
                          <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'qrCodeUrl')} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ADVANCED TAB */}
            {activeTab === 'advanced' && (
              <div className="animate-fade-in">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}><Settings size={20} className="text-muted" /> Advanced Settings</h3>
                <div className="form-group">
                  <label>Maintenance Mode</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <span className="text-muted text-sm">Store is live and accepting orders</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Banner Modal */}
      {isBannerModalOpen && (
        <div className="modal-overlay" onClick={() => !bannerSaving && setIsBannerModalOpen(false)} style={{ zIndex: 9999 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingBanner ? 'Edit Banner' : 'Add New Homepage Banner'}</h2>
              <button className="btn-icon" onClick={() => !bannerSaving && setIsBannerModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBannerSubmit} className="modal-body">
              <div className="form-group">
                <label>Banner Image Upload *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                  {bannerPreviewURL && (
                    <div style={{ width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                      {bannerFormData.mediaType === 'video' ? (
                        <video src={bannerPreviewURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls muted />
                      ) : (
                        <img src={bannerPreviewURL} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*, video/*" 
                    onChange={handleBannerImageChange}
                    style={{ fontSize: '0.9rem' }}
                  />
                  {bannerUploadProgress > 0 && bannerUploadProgress < 100 && (
                    <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '4px', backgroundColor: 'var(--primary)', width: `${bannerUploadProgress}%`, transition: 'width 0.2s' }}></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Banner Title</label>
                <input 
                  type="text" 
                  value={bannerFormData.title} 
                  onChange={(e) => setBannerFormData({...bannerFormData, title: e.target.value})}
                  placeholder="Large Bold Title"
                />
              </div>

              <div className="form-group">
                <label>Banner Description</label>
                <textarea 
                  value={bannerFormData.description} 
                  onChange={(e) => setBannerFormData({...bannerFormData, description: e.target.value})}
                  placeholder="Small Description below the title"
                  rows="2"
                />
              </div>
              
              <div className="form-group">
                <label>Target Link (Optional)</label>
                <input 
                  type="text" 
                  value={bannerFormData.link} 
                  onChange={(e) => setBannerFormData({...bannerFormData, link: e.target.value})}
                  placeholder="e.g. /shop or /product/123"
                />
              </div>

              <div className="form-group">
                <label>Category Selection</label>
                <select 
                  value={bannerFormData.category} 
                  onChange={(e) => setBannerFormData({...bannerFormData, category: e.target.value})}
                >
                  <option value="All">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <small className="text-muted">Display banner when users browse this specific category.</small>
              </div>

              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="showOnHomepage" 
                    checked={bannerFormData.showOnHomepage} 
                    onChange={(e) => setBannerFormData({...bannerFormData, showOnHomepage: e.target.checked})}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="showOnHomepage" style={{ margin: 0, cursor: 'pointer' }}>Show on Homepage</label>
                </div>
                
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="enableAutoSlider" 
                    checked={bannerFormData.enableAutoSlider} 
                    onChange={(e) => setBannerFormData({...bannerFormData, enableAutoSlider: e.target.checked})}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="enableAutoSlider" style={{ margin: 0, cursor: 'pointer' }}>Enable Auto Slider</label>
                </div>
                
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="isActiveBanner" 
                    checked={bannerFormData.isActive} 
                    onChange={(e) => setBannerFormData({...bannerFormData, isActive: e.target.checked})}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="isActiveBanner" style={{ margin: 0, cursor: 'pointer' }}>Enable Banner</label>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsBannerModalOpen(false)} disabled={bannerSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={bannerSaving}>
                  {bannerSaving ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for inline tab styling
function getTabStyle(isActive) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: isActive ? 'var(--surface-hover)' : 'transparent',
    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
    fontWeight: isActive ? 600 : 500,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.2s'
  };
}

export default AdminSettings;

