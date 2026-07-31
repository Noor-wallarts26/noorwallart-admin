import React, { useState, useEffect, useContext } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShopContext } from '../context/ShopContext';
import { MessageCircle, Mail, Hash as Instagram, Hash as Facebook, Store, Settings, CreditCard, Shield, Globe, MapPin, Clock, Truck, FileText, Image as ImageIcon, UploadCloud, Trash2, Key, Lock, Eye, EyeOff } from 'lucide-react';

const AdminSettings = () => {
  const { isPinVerified, verifyPin, sendPinResetLink } = useContext(ShopContext);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

                {/* HOMEPAGE BANNER IMAGE UPLOAD */}
                <div className="form-group" style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Homepage Banner</label>
                  {settings.homepageBannerUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <img src={settings.homepageBannerUrl} alt="Homepage Banner" style={{ width: '100%', maxHeight: '180px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-light)' }} />
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <label className="btn-outline" style={{ cursor: 'pointer', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <UploadCloud size={16} /> Replace Banner
                          <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'homepageBannerUrl')} style={{ display: 'none' }} />
                        </label>
                        <button type="button" className="btn-secondary" style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleChange('homepageBannerUrl', '')}>
                          <Trash2 size={16} /> Delete Banner
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', border: '2px dashed var(--border-light)', borderRadius: '8px', cursor: 'pointer' }}>
                      <ImageIcon size={32} className="text-muted mb-2" />
                      <span className="text-sm font-medium">Click to Upload Homepage Banner</span>
                      <span className="text-xs text-muted mt-1">Recommended size: 1200x400px</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageFileUpload(e, 'homepageBannerUrl')} style={{ display: 'none' }} />
                    </label>
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

