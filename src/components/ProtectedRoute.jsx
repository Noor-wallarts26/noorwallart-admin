import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useContext(ShopContext);

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
