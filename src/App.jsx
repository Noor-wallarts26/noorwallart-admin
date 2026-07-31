import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './context/ShopContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminProductForm from './pages/AdminProductForm';
import AdminSettings from './pages/AdminSettings';
import AdminOrders from './pages/AdminOrders';
import AdminCategories from './pages/AdminCategories';
import AdminCustomers from './pages/AdminCustomers';
import AdminTransactions from './pages/AdminTransactions';
import AdminRevenue from './pages/AdminRevenue';
import AdminCoupons from './pages/AdminCoupons';
import AdminReviews from './pages/AdminReviews';
import AdminNotifications from './pages/AdminNotifications';
import AdminReports from './pages/AdminReports';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminProfile from './pages/AdminProfile';

function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/edit/:id" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminProvider>
  );
}

export default App;
