import React, { useState, useEffect, useContext } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShopContext } from '../context/ShopContext';
import { MessageCircle, Mail, Hash as Instagram, Hash as Facebook, Store, Settings, CreditCard, Shield, Globe, MapPin, Clock, Truck, FileText, Image as ImageIcon, UploadCloud, Trash2, Key, Lock, Eye, EyeOff, Plus, Edit, X, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const AdminSettings = () => {
  const { isPinVerified, verifyPin, sendPinResetLink, banners, categories, brands = [] } = useContext(ShopContext);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Brands State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandFormData, setBrandFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    isActive: true
  });

  const handleOpenBrandModal = (brand = null) => {
    setEditingBrand(brand);
    if (brand) {
      setBrandFormData({
        name: brand.name || '',
        description: brand.description || '',
        logoUrl: brand.logoUrl || '',
        isActive: brand.isActive !== false
      });
    } else {
      setBrandFormData({
        name: '',
        description: '',
        logoUrl: '',
        isActive: true
      });
    }
    setIsBrandModalOpen(true);
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!brandFormData.name.trim()) {
      alert("Please enter brand name.");
      return;
    }
    setBrandSaving(true);
    try {
      if (editingBrand) {
        await updateDoc(doc(db, "brands", editingBrand.id), {
          ...brandFormData,
          updatedAt: Date.now()
        });
      } else {
        await addDoc(collection(db, "brands"), {
          ...brandFormData,
          createdAt: Date.now()
        });
      }
      setIsBrandModalOpen(false);
    } catch (err) {
      console.error("Error saving brand:", err);
      alert("Failed to save brand.");
    } finally {
      setBrandSaving(false);
    }
  };

  const handleDeleteBrand = async (brandId) => {
    if (window.confirm("Are you sure you want to delete this brand?")) {
      try {
        await deleteDoc(doc(db, "brands", brandId));
      } catch (err) {
        console.error("Error deleting brand:", err);
        alert("Failed to delete brand.");
      }
    }
  };

  const handleToggleBrand = async (brand) => {
    try {
      await updateDoc(doc(db, "brands", brand.id), {
        isActive: !brand.isActive
      });
    } catch (err) {
      console.error("Error toggling brand status:", err);
    }
  };

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

  const handleBannerImageChange = async (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setBannerImageFile(file);
      setBannerPreviewURL(URL.createObjectURL(file));
      const isVideo = file.type.startsWith('video/');
      setBannerFormData(prev => ({ ...prev, mediaType: isVideo ? 'video' : 'image', imageURL: '' })); // reset imageURL while uploading
      
      // Auto-upload to make saving faster
      setBannerSaving(true);
      try {
        const url = await uploadBannerImage(file);
        setBannerFormData(prev => ({ ...prev, imageURL: url }));
      } catch (err) {
        console.error(err);
        alert("Failed to upload media.");
      } finally {
        setBannerSaving(false);
      }
    }
  };

  const uploadBannerImage = async (file) => {
    const storage = getStorage();
    const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9.]/g, '_') : 'video.mp4';
    const storageRef = ref(storage, `banners/${Date.now()}_${safeName}`);
    
    // Using uploadBytes instead of resumable to prevent 0% hang issues on some browsers/networks
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    
    if (bannerSaving) {
      alert("Please wait for the media upload to finish before saving.");
      return;
    }

    if (!bannerFormData.imageURL) {
      alert("Please select and upload a banner image or video.");
      return;
    }

    setBannerSaving(true);
    try {
      const bannerDataToSave = {
        ...bannerFormData,
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
                {/* HOMEPAGE IMAGE BANNER UPLOAD */}
                <div className="form-group" style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontWeight: 600, margin: 0 }}>Homepage Image Banner (Old Banner)</label>
                    {settings.homepageVideoUrl && (
                      <button 
                        type="button" 
                        className="btn-outline" 
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', color: '#059669', borderColor: '#059669' }}
                        onClick={async () => {
                          handleChange('homepageVideoUrl', '');
                          await setDoc(doc(db, 'settings', 'storeInfo'), { ...settings, homepageVideoUrl: '' }, { merge: true });
                          alert("Switched back to Image Banner! Video banner removed.");
                        }}
                      >
                        Use Image Banner Instead of Video
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted" style={{ marginBottom: '1rem' }}>Upload your static image banner for the website homepage.</p>
                  {settings.homepageBannerUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <img src={settings.homepageBannerUrl} alt="Homepage Banner" style={{ width: '180px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-light)' }} />
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <label className="btn-outline" style={{ cursor: 'pointer', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <UploadCloud size={16} /> Replace Image Banner
                          <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'homepageBannerUrl')} style={{ display: 'none' }} />
                        </label>
                        <button type="button" className="btn-secondary" style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleChange('homepageBannerUrl', '')}>
                          <Trash2 size={16} /> Delete Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', border: '2px dashed var(--border-light)', borderRadius: '8px', cursor: 'pointer' }}>
                      <ImageIcon size={32} className="text-muted mb-2" />
                      <span className="text-sm font-medium">Click to Upload Homepage Image Banner</span>
                      <span className="text-xs text-muted mt-1">PNG, JPG, WebP up to 5MB</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'homepageBannerUrl')} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>

                {/* HOMEPAGE VIDEO BANNER */}
                <div className="form-group" style={{ marginTop: '2.5rem', padding: '1.5rem', border: '1px solid var(--border-light)', borderRadius: '8px', backgroundColor: 'var(--surface-hover)' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Homepage Video Banner</h3>
                  <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
                    Upload a video to display on the main website homepage instead of images. It will automatically play on loop without sound.
                  </p>
                  
                  {settings.homepageVideoUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ width: '100%', maxWidth: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                        <video src={settings.homepageVideoUrl} autoPlay loop muted playsInline style={{ width: '100%', height: 'auto', display: 'block' }} />
                      </div>
                      
                      {bannerSaving && (
                        <div style={{ width: '100%', maxWidth: '400px', marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span>Uploading Video... This may take a few minutes.</span>
                          </div>
                          <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '6px', backgroundColor: 'var(--primary)', width: `${bannerUploadProgress}%`, transition: 'width 0.2s' }}></div>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <label className="btn-outline" style={{ cursor: bannerSaving ? 'not-allowed' : 'pointer', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: bannerSaving ? 0.6 : 1 }}>
                          <UploadCloud size={16} /> {bannerSaving ? 'Uploading...' : 'Replace Video'}
                          <input type="file" accept="video/*" disabled={bannerSaving} onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 50 * 1024 * 1024) {
                                alert("Video is too large! Please upload a video smaller than 50MB.");
                                return;
                              }
                              setBannerSaving(true);
                              setBannerUploadProgress(0);
                              try {
                                const url = await uploadBannerImage(file);
                                handleChange('homepageVideoUrl', url);
                                await setDoc(doc(db, 'settings', 'storeInfo'), { ...settings, homepageVideoUrl: url }, { merge: true });
                                alert("Video uploaded successfully!");
                              } catch (err) {
                                console.error(err);
                                alert("Failed to upload video: " + (err.message || err.toString()));
                              } finally {
                                setBannerSaving(false);
                              }
                            }
                          }} style={{ display: 'none' }} />
                        </label>
                        <button type="button" className="btn-secondary" disabled={bannerSaving} style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: bannerSaving ? 0.6 : 1 }} onClick={() => {
                          handleChange('homepageVideoUrl', '');
                          setDoc(doc(db, 'settings', 'storeInfo'), { ...settings, homepageVideoUrl: '' }, { merge: true });
                        }}>
                          <Trash2 size={16} /> Remove Video
                        </button>
                      </div>
                      
                      <div style={{ marginTop: '1rem', width: '100%' }}>
                        <label className="text-sm font-medium">Or Paste Direct Video URL:</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <input type="text" className="form-input" placeholder="https://example.com/video.mp4" value={settings.homepageVideoUrl || ''} onChange={(e) => handleChange('homepageVideoUrl', e.target.value)} style={{ flex: 1 }} />
                          <button type="button" className="btn-primary" onClick={() => setDoc(doc(db, 'settings', 'storeInfo'), { ...settings, homepageVideoUrl: settings.homepageVideoUrl }, { merge: true })}>Save URL</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', border: '2px dashed var(--border-light)', borderRadius: '8px', cursor: bannerSaving ? 'not-allowed' : 'pointer', backgroundColor: 'var(--bg-color)', opacity: bannerSaving ? 0.6 : 1 }}>
                      <UploadCloud size={32} className="text-muted mb-2" />
                      <span className="text-sm font-medium">{bannerSaving ? 'Uploading Video...' : 'Click to Upload Video Banner'}</span>
                      <span className="text-xs text-muted mt-1">MP4, WebM (up to 50MB recommended)</span>
                      
                      {bannerSaving && (
                        <div style={{ width: '80%', marginTop: '1.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span>Uploading Video... This may take a few minutes.</span>
                          </div>
                          <div style={{ width: '100%', backgroundColor: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '6px', backgroundColor: 'var(--primary)', width: `${bannerUploadProgress}%`, transition: 'width 0.2s' }}></div>
                          </div>
                        </div>
                      )}

                      <input type="file" accept="video/*" disabled={bannerSaving} onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 50 * 1024 * 1024) {
                            alert("Video is too large! Please upload a video smaller than 50MB.");
                            return;
                          }
                          setBannerSaving(true);
                          setBannerUploadProgress(0);
                          try {
                            const url = await uploadBannerImage(file);
                            handleChange('homepageVideoUrl', url);
                            await setDoc(doc(db, 'settings', 'storeInfo'), { ...settings, homepageVideoUrl: url }, { merge: true });
                            alert("Video uploaded successfully!");
                          } catch (err) {
                            console.error(err);
                            alert("Failed to upload video: " + (err.message || err.toString()));
                          } finally {
                            setBannerSaving(false);
                          }
                        }
                      }} style={{ display: 'none' }} />
                    </label>
                    
                    <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '500px', margin: '1.5rem auto 0 auto' }}>
                      <label className="text-sm font-medium text-center" style={{ display: 'block', marginBottom: '0.5rem' }}>Or Paste Direct Video URL:</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" className="form-input" placeholder="https://example.com/video.mp4" value={settings.homepageVideoUrl || ''} onChange={(e) => handleChange('homepageVideoUrl', e.target.value)} style={{ flex: 1 }} />
                        <button type="button" className="btn-primary" onClick={() => setDoc(doc(db, 'settings', 'storeInfo'), { ...settings, homepageVideoUrl: settings.homepageVideoUrl }, { merge: true })}>Save URL</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* BRAND MANAGEMENT SECTION */}
                <div className="form-group" style={{ marginTop: '2.5rem', padding: '1.5rem', border: '1px solid var(--border-light)', borderRadius: '12px', backgroundColor: 'var(--bg-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Brand Management</h3>
                      <p className="text-xs text-muted" style={{ margin: '0.25rem 0 0 0' }}>Add, edit, enable/disable, or delete product brands for your store.</p>
                    </div>
                    <button type="button" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleOpenBrandModal()}>
                      <Plus size={16} /> Add Brand
                    </button>
                  </div>

                  {brands.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-light)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                      No brands created yet. Click "+ Add Brand" above to create your first brand.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {brands.map((brand) => (
                        <div key={brand.id} style={{ padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '8px', backgroundColor: 'var(--surface-hover)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {brand.logoUrl ? (
                                  <img src={brand.logoUrl} alt={brand.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {brand.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>{brand.name}</h4>
                              </div>
                              <span style={{ 
                                padding: '0.2rem 0.5rem', 
                                borderRadius: '12px', 
                                fontSize: '0.75rem', 
                                fontWeight: 600,
                                backgroundColor: brand.isActive !== false ? '#DCFCE7' : '#FEE2E2',
                                color: brand.isActive !== false ? '#15803D' : '#DC2626'
                              }}>
                                {brand.isActive !== false ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                            {brand.description && (
                              <p className="text-xs text-muted" style={{ margin: '0.5rem 0 1rem 0' }}>{brand.description}</p>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                            <button type="button" className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} onClick={() => handleToggleBrandStatus(brand)}>
                              {brand.isActive !== false ? 'Disable' : 'Enable'}
                            </button>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button type="button" className="btn-icon" onClick={() => handleOpenBrandModal(brand)} title="Edit Brand">
                                <Edit size={16} />
                              </button>
                              <button type="button" className="btn-icon" style={{ color: '#DC2626' }} onClick={() => handleDeleteBrand(brand.id)} title="Delete Brand">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BRANDS MANAGEMENT SECTION */}
                <div style={{ marginTop: '2.5rem', padding: '1.5rem', border: '1px solid var(--border-light)', borderRadius: '12px', backgroundColor: 'var(--bg-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Brand Management</h3>
                      <p className="text-sm text-muted" style={{ margin: '0.25rem 0 0 0' }}>
                        Add, edit, delete, and manage store brands.
                      </p>
                    </div>
                    <button type="button" className="btn-primary" onClick={() => handleOpenBrandModal()} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <Plus size={16} /> Add Brand
                    </button>
                  </div>

                  {brands.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-light)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                      No brands created yet. Click "Add Brand" above to add your first brand.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                      {brands.map(b => (
                        <div key={b.id} style={{ padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '8px', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', itemsCenter: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border-light)', overflow: 'hidden', backgroundColor: '#FFF', flexShrink: 0 }}>
                              <img src={b.logoUrl || '/logo.jpg'} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError="this.src='/logo.jpg'" />
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</h4>
                              <span style={{ fontSize: '0.75rem', color: b.isActive !== false ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                                {b.isActive !== false ? '● Active' : '○ Disabled'}
                              </span>
                            </div>
                          </div>
                          {b.description && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.description}</p>}
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem', marginTop: 'auto' }}>
                            <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }} onClick={() => handleToggleBrand(b)}>
                              {b.isActive !== false ? 'Disable' : 'Enable'}
                            </button>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => handleOpenBrandModal(b)} title="Edit Brand">
                                <Edit size={16} />
                              </button>
                              <button type="button" style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }} onClick={() => handleDeleteBrand(b.id)} title="Delete Brand">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                      Enter your 6-digit Admin PIN to edit UPI ID, replace QR Code, or modify payment configurations.
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
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
                  <Settings size={20} className="text-muted" /> Advanced System Settings
                </h3>

                {/* MAINTENANCE MODE TOGGLE CARD */}
                <div style={{ padding: '1.5rem', border: '1px solid var(--border-light)', borderRadius: '12px', backgroundColor: settings.maintenanceMode ? '#FEF2F2' : '#F0FDF4', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: settings.maintenanceMode ? '#991B1B' : '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={20} />
                        Maintenance Mode: {settings.maintenanceMode ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
                      </h4>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: settings.maintenanceMode ? '#7F1D1D' : '#15803D' }}>
                        {settings.maintenanceMode 
                          ? '⚠️ Public website is currently displaying Maintenance Page to customers. Admin panel remains fully accessible.' 
                          : '✅ Public website is live and operational. Customers can browse and place orders normally.'}
                      </p>
                    </div>

                    <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}>
                      <input 
                        type="checkbox" 
                        checked={!!settings.maintenanceMode} 
                        onChange={async (e) => {
                          const isChecked = e.target.checked;
                          handleChange('maintenanceMode', isChecked);
                          try {
                            await setDoc(doc(db, 'settings', 'storeInfo'), { maintenanceMode: isChecked }, { merge: true });
                            alert(`Maintenance Mode turned ${isChecked ? 'ON (Active)' : 'OFF (Store Live)'}! Setting saved permanently.`);
                          } catch (err) {
                            console.error("Error toggling maintenance mode:", err);
                            alert("Failed to update Maintenance Mode.");
                          }
                        }}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: settings.maintenanceMode ? '#DC2626' : '#16A34A' }}>
                        {settings.maintenanceMode ? 'TURN OFF' : 'TURN ON'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label>Store Status</label>
                  <p className="text-muted text-sm" style={{ marginTop: '0.25rem' }}>
                    Store setting changes take effect immediately across customer website and admin panel.
                  </p>
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
                <label>Banner Image / Video Upload *</label>
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
                    <div style={{ width: '100%', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>Uploading Media...</span>
                        <span>{Math.round(bannerUploadProgress)}%</span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '6px', backgroundColor: 'var(--primary)', width: `${bannerUploadProgress}%`, transition: 'width 0.2s' }}></div>
                      </div>
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

      {/* Brand Modal */}
      {isBrandModalOpen && (
        <div className="modal-overlay" onClick={() => !brandSaving && setIsBrandModalOpen(false)} style={{ zIndex: 9999 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</h2>
              <button className="btn-icon" onClick={() => !brandSaving && setIsBrandModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="modal-body">
              <div className="form-group">
                <label>Brand Name *</label>
                <input 
                  type="text" 
                  required
                  value={brandFormData.name} 
                  onChange={(e) => setBrandFormData({...brandFormData, name: e.target.value})}
                  placeholder="e.g. Noor Wall Arts"
                />
              </div>

              <div className="form-group">
                <label>Brand Description</label>
                <textarea 
                  value={brandFormData.description} 
                  onChange={(e) => setBrandFormData({...brandFormData, description: e.target.value})}
                  placeholder="Short description of the brand"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Brand Logo Image Upload / URL</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {brandFormData.logoUrl && (
                    <img src={brandFormData.logoUrl} alt="Logo Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-light)' }} onError={(e) => e.target.src='/logo.jpg'} />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={async (e) => {
                      if (e.target.files[0]) {
                        setBrandSaving(true);
                        try {
                          const url = await uploadBannerImage(e.target.files[0]);
                          setBrandFormData(prev => ({ ...prev, logoUrl: url }));
                        } catch (err) {
                          alert("Failed to upload brand logo.");
                        } finally {
                          setBrandSaving(false);
                        }
                      }
                    }}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input 
                  type="checkbox" 
                  id="brandIsActive" 
                  checked={brandFormData.isActive} 
                  onChange={(e) => setBrandFormData({...brandFormData, isActive: e.target.checked})}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="brandIsActive" style={{ margin: 0, cursor: 'pointer' }}>Enable Brand</label>
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsBrandModalOpen(false)} disabled={brandSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={brandSaving}>
                  {brandSaving ? 'Saving...' : 'Save Brand'}
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

