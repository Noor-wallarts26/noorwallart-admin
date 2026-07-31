import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Star, Search, Trash2, CheckCircle, XCircle } from 'lucide-react';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      await deleteDoc(doc(db, 'reviews', id));
    }
  };

  const toggleApproval = async (review) => {
    await updateDoc(doc(db, 'reviews', review.id), { approved: !review.approved });
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || 
                          (filter === 'Approved' && r.approved) || 
                          (filter === 'Pending' && !r.approved);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h1>Product Reviews</h1>
          <p className="text-muted">Manage customer reviews and ratings.</p>
        </div>
      </div>

      <div className="card">
        <div className="table-header">
          <div className="search-bar">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by customer or product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="table-actions">
            <div className="filter-dropdown">
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="All">All Reviews</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <tr key={review.id}>
                    <td className="font-medium">{review.customerName || 'Anonymous'}</td>
                    <td>{review.productName || 'Unknown Product'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#fbbf24' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < (review.rating || 5) ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {review.comment}
                    </td>
                    <td>
                      <span className={`status-badge ${review.approved ? 'delivered' : 'pending'}`}>
                        {review.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className={`icon-btn ${review.approved ? 'delete' : 'edit'}`} 
                          onClick={() => toggleApproval(review)} 
                          title={review.approved ? "Hide Review" : "Approve Review"}
                        >
                          {review.approved ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDelete(review.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: '3rem' }}>
                    No reviews found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;
