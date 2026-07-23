import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const AdminProducts = () => {
  const { products } = useContext(ShopContext);
  const navigate = useNavigate();

  const handleOpenModal = (product = null) => {
    if (product) {
      navigate(`/products/edit/${product.id}`, { state: { product } });
    } else {
      navigate('/products/new');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", id.toString()));
        alert("Deleted!");
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <header className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Manage Products</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={18} /> Add Product
        </button>
      </header>

      <div className="admin-table-container card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.category}</td>
                <td>${p.price.toFixed(2)}</td>
                <td>
                  <span className={p.stock > 0 ? "admin-badge success" : "admin-badge"} style={{ backgroundColor: p.stock === 0 ? 'rgba(239, 68, 68, 0.2)' : undefined, color: p.stock === 0 ? '#ef4444' : undefined }}>
                    {p.stock}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleOpenModal(p)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: '0.5rem' }}><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;
