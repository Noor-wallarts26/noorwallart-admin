import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MessageCircle } from 'lucide-react';
import './Admin.css';

const AdminSettings = () => {
  const [whatsapp, setWhatsapp] = useState('8525325330');
  const [email, setEmail] = useState('noorwallartsofficial@gmail.com');
  const [instagram, setInstagram] = useState('@noor.wallarts');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'storeInfo');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.whatsapp) setWhatsapp(data.whatsapp);
          if (data.email) setEmail(data.email);
          if (data.instagram) setInstagram(data.instagram);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'storeInfo'), {
        whatsapp,
        email,
        instagram
      }, { merge: true });
      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="admin-page animate-fade-in">
      <header className="admin-header">
        <h1>Store Settings</h1>
      </header>

      <div className="admin-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <MessageCircle color="#25D366" /> Manage Contact Info
        </h3>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>WhatsApp Number (e.g. 919876543210)</label>
            <input 
              type="text" 
              value={whatsapp} 
              onChange={e => setWhatsapp(e.target.value)} 
              placeholder="Include country code without +"
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Store contact email"
            />
          </div>
          <div className="form-group">
            <label>Instagram Handle</label>
            <input 
              type="text" 
              value={instagram} 
              onChange={e => setInstagram(e.target.value)} 
              placeholder="e.g. @noor.wallarts"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
