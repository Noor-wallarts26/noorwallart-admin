import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { ShoppingBag } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to sign in. Please check your email and password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first to reset password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage('Password reset email sent! Check your inbox.');
      setError('');
    } catch (err) {
      setError('Failed to send reset email. Make sure the email is correct.');
      console.error(err);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-container card">
        <div className="auth-header">
          <ShoppingBag color="var(--primary)" size={48} />
          <h2>Welcome Back</h2>
          <p>Sign in to your AmazeShop account</p>
        </div>

        {error && <div className="auth-error" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {resetMessage && <div className="auth-success" style={{ color: 'green', marginBottom: '1rem', textAlign: 'center' }}>{resetMessage}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <button 
              type="button" 
              onClick={handleResetPassword} 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'right', display: 'block', width: '100%' }}
            >
              Forgot Password?
            </button>
          </div>
          
          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
