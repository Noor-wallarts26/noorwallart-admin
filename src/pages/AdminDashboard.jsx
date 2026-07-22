import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

const AdminDashboard = () => {
  const { orders, products } = useContext(ShopContext);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  // Helper to push mock products to Firestore
  const seedProductsToFirestore = async () => {
    setSeeding(true);
    setSeedMessage('');
    try {
      const batch = writeBatch(db);
      products.forEach(product => {
        // use string ID to make it easier, or let firestore generate. We will use the existing ID as string
        const docRef = doc(collection(db, "products"), product.id.toString());
        batch.set(docRef, product);
      });
      await batch.commit();
      setSeedMessage('Successfully uploaded all products to Firestore!');
    } catch (error) {
      console.error(error);
      setSeedMessage('Error uploading products: ' + error.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <header className="admin-page-header">
        <h1>Dashboard Overview</h1>
      </header>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">
            ${orders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)}
          </p>
        </div>
        <div className="admin-stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{orders.length}</p>
        </div>
        <div className="admin-stat-card">
          <h3>Total Products</h3>
          <p className="stat-value">{products.length}</p>
        </div>
      </div>

      <div className="admin-section card mt-4">
        <h2>Database Management</h2>
        <p>If your Firestore database is empty, you can upload the initial products catalog here.</p>
        <button 
          className="btn-primary mt-2" 
          onClick={seedProductsToFirestore}
          disabled={seeding}
        >
          {seeding ? 'Uploading...' : 'Seed Products to Firestore'}
        </button>
        {seedMessage && <p className="seed-msg mt-2">{seedMessage}</p>}
      </div>

      <div className="admin-section mt-4">
        <h2>Recent Orders</h2>
        <div className="admin-table-container card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>No orders found</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{new Date(order.timestamp).toLocaleDateString()}</td>
                    <td><span className="admin-badge success">{order.status}</span></td>
                    <td>${order.totalPrice.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
