import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { User, Mail, Shield, Key, Lock, Eye, EyeOff } from 'lucide-react';

const AdminProfile = () => {
  const { user, isPinVerified, verifyPin, updateAdminPin, sendPinResetLink } = useContext(ShopContext);
  
  // Local PIN lock check if accessed directly via URL
  const [pinPromptInput, setPinPromptInput] = useState('');
  const [pinPromptError, setPinPromptError] = useState('');

  // PIN Change State
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState({ text: '', isError: false });

  const handleLocalPinSubmit = (e) => {
    e.preventDefault();
    setPinPromptError('');
    if (!verifyPin(pinPromptInput)) {
      setPinPromptError('Incorrect 6-digit PIN.');
    }
  };

  const handlePinUpdateSubmit = async (e) => {
    e.preventDefault();
    setPinChangeMsg({ text: '', isError: false });
    
    if (newPin.length !== 6 || isNaN(newPin)) {
      setPinChangeMsg({ text: 'PIN must be exactly 6 numeric digits.', isError: true });
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMsg({ text: 'New PIN and Confirm PIN do not match.', isError: true });
      return;
    }

    const success = await updateAdminPin(newPin);
    if (success) {
      setNewPin('');
      setConfirmPin('');
      setPinChangeMsg({ text: 'Admin PIN changed successfully!', isError: false });
    }
  };

  if (!isPinVerified) {
    return (
      <div className="admin-page animate-fade-in" style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', textAlign: 'center', borderRadius: '16px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)', margin: '0 auto 1.5rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Lock size={36} />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Secure Profile Locked</h2>
          <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
            Please enter your 6-digit Admin PIN to view sensitive profile details and account credentials.
          </p>

          {pinPromptError && (
            <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {pinPromptError}
            </div>
          )}

          <form onSubmit={handleLocalPinSubmit}>
            <input 
              type="password"
              maxLength={6}
              placeholder="Enter 6-digit PIN"
              value={pinPromptInput}
              onChange={(e) => setPinPromptInput(e.target.value.replace(/\D/g, ''))}
              style={{ width: '100%', padding: '0.8rem', fontSize: '1.25rem', textAlign: 'center', letterSpacing: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}
              autoFocus
            />
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
              Unlock Profile
            </button>
          </form>

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
      </div>
    );
  }

  const adminEmail = user?.email || 'noorwallartsofficial@gmail.com';
  const adminId = user?.uid || 'NWA-ADMIN-001';

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h1>Admin Profile & Security</h1>
          <p className="text-muted">Manage your secure credentials, PIN, and account details.</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Profile Details Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
          <img src="/logo.jpg" alt="Noor Wallarts Admin" style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1.5rem', border: '3px solid var(--primary)' }} />
          <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Noor Wallarts Super Admin</h2>
          <span className="status-badge delivered" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
            <Shield size={14} /> Full Access Verified
          </span>

          <div style={{ width: '100%', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', textAlign: 'left' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase' }}>Admin Account ID</span>
              <p className="font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)', marginTop: '0.25rem' }}>{adminId}</p>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase' }}>Registered Email</span>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)', marginTop: '0.25rem' }}>{adminEmail}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase' }}>Account Role</span>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)', marginTop: '0.25rem' }}>Primary Store Administrator</p>
            </div>
          </div>
        </div>

        {/* Security & PIN Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Change 6-Digit PIN */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={20} className="text-primary" /> Admin Security PIN (6-Digit)
            </h3>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
              This PIN protects access to Payment Settings, Store Settings, and Admin Profile. Default PIN: <strong>252007</strong>
            </p>

            {pinChangeMsg.text && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem', backgroundColor: pinChangeMsg.isError ? '#FEE2E2' : '#DCFCE7', color: pinChangeMsg.isError ? '#DC2626' : '#166534' }}>
                {pinChangeMsg.text}
              </div>
            )}

            <form onSubmit={handlePinUpdateSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>New 6-Digit PIN</label>
                <input 
                  type="password"
                  maxLength={6}
                  placeholder="Enter 6 digits"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New PIN</label>
                <input 
                  type="password"
                  maxLength={6}
                  placeholder="Confirm 6 digits"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                  Update Admin PIN
                </button>
              </div>
            </form>
          </div>

          {/* Email Recovery & Password Reset */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={20} className="text-primary" /> Reset Link & Email Security
            </h3>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
              If you forget your PIN or password, a secure reset link will be dispatched to your registered admin email address: <strong>{adminEmail}</strong>
            </p>

            <button 
              type="button"
              className="btn-outline" 
              onClick={sendPinResetLink}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Send Reset Link to Email ({adminEmail})
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminProfile;

