import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Star, Search, Trash2, CheckCircle, EyeOff, ShieldCheck, Image as ImageIcon, Filter, CheckCircle2 } from 'lucide-react';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [verifiedFilter, setVerifiedFilter] = useState('All');
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setReviews(data);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this review?")) {
      try {
        await deleteDoc(doc(db, 'reviews', id));
      } catch (err) {
        console.error("Error deleting review:", err);
      }
    }
  };

  const handleUpdateStatus = async (reviewId, newStatus) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status: newStatus,
        approved: newStatus === 'Approved'
      });
    } catch (err) {
      console.error("Error updating review status:", err);
    }
  };

  const filteredReviews = reviews.filter(r => {
    const nameStr = r.userName || r.customerName || '';
    const prodStr = r.productTitle || r.productName || '';
    const orderStr = r.orderId || '';
    const commentStr = r.comment || '';
    const titleStr = r.title || '';

    const matchesSearch = 
      nameStr.toLowerCase().includes(searchTerm.toLowerCase()) || 
      prodStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orderStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commentStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      titleStr.toLowerCase().includes(searchTerm.toLowerCase());

    const rStatus = r.status || (r.approved ? 'Approved' : 'Pending');
    const matchesStatus = statusFilter === 'All' || rStatus === statusFilter;

    const matchesRating = ratingFilter === 'All' || String(r.rating) === String(ratingFilter);

    const isVerified = r.isVerifiedPurchase !== false;
    const matchesVerified = 
      verifiedFilter === 'All' || 
      (verifiedFilter === 'Verified' && isVerified) ||
      (verifiedFilter === 'Unverified' && !isVerified);

    return matchesSearch && matchesStatus && matchesRating && matchesVerified;
  });

  const totalReviews = reviews.length;
  const verifiedCount = reviews.filter(r => r.isVerifiedPurchase !== false).length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalReviews).toFixed(1) : '5.0';
  const reviewsWithPhotos = reviews.filter(r => Array.isArray(r.imageUrls) && r.imageUrls.length > 0).length;

  return (
    <div className="admin-page animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="admin-page-header">
        <div>
          <h1>Customer Reviews Management</h1>
          <p className="text-muted">Monitor verified buyer ratings, customer feedback, and uploaded photos.</p>
        </div>
      </div>

      {/* SUMMARY STATS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #4f46e5' }}>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>Total Reviews</p>
          <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: 700 }}>{totalReviews}</h2>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>Verified Buyers</p>
          <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: 700, color: '#16a34a' }}>{verifiedCount}</h2>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>Average Rating</p>
          <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: 700, color: '#d97706' }}>{avgRating} ★</h2>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #06b6d4' }}>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>Reviews with Photos</p>
          <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: 700, color: '#0891b2' }}>{reviewsWithPhotos}</h2>
        </div>
      </div>

      <div className="card">
        {/* TOOLBAR: SEARCH & FILTERS */}
        <div className="table-header" style={{ flexWrap: 'wrap', gap: '1rem', padding: '1rem 1.25rem' }}>
          <div className="search-bar" style={{ minWidth: '240px', flex: 1 }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by customer, product, order ID, comment..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="filter-dropdown">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Hidden">Hidden</option>
              </select>
            </div>

            <div className="filter-dropdown">
              <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                <option value="All">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <div className="filter-dropdown">
              <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
                <option value="All">All Buyers</option>
                <option value="Verified">Verified Only</option>
                <option value="Unverified">Unverified Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* REVIEWS TABLE */}
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer & Order</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Title & Comment</th>
                <th>Photos</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => {
                  const rStatus = review.status || (review.approved ? 'Approved' : 'Pending');
                  const isVerified = review.isVerifiedPurchase !== false;

                  return (
                    <tr key={review.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{review.userName || review.customerName || 'Customer'}</div>
                        {isVerified && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                            <CheckCircle2 size={12} color="#16a34a" /> Verified Buyer
                          </span>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          Order #{review.orderId || 'N/A'}
                        </div>
                      </td>

                      <td style={{ maxWidth: '180px' }}>
                        <div style={{ fontWeight: 500, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {review.productTitle || review.productName || 'Product'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          ID: {review.productId}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#fbbf24' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < (review.rating || 5) ? 'currentColor' : 'none'} color={i < (review.rating || 5) ? '#fbbf24' : '#cbd5e1'} />
                          ))}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706', marginTop: '2px' }}>
                          {review.rating} / 5
                        </div>
                      </td>

                      <td style={{ maxWidth: '280px' }}>
                        {review.title && <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>{review.title}</div>}
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {review.comment}
                        </p>
                        <small style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                          {new Date(review.timestamp || Date.now()).toLocaleDateString()}
                        </small>
                      </td>

                      <td>
                        {Array.isArray(review.imageUrls) && review.imageUrls.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {review.imageUrls.map((img, i) => (
                              <img 
                                key={i} 
                                src={img} 
                                alt="Review attachment" 
                                onClick={() => setPreviewImage(img)}
                                style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', cursor: 'zoom-in', border: '1px solid #cbd5e1' }}
                              />
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>None</span>
                        )}
                      </td>

                      <td>
                        <span className={`status-badge ${rStatus === 'Approved' ? 'delivered' : rStatus === 'Hidden' ? 'cancelled' : 'pending'}`}>
                          {rStatus}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons" style={{ display: 'flex', gap: '4px' }}>
                          {rStatus !== 'Approved' && (
                            <button 
                              className="icon-btn edit" 
                              onClick={() => handleUpdateStatus(review.id, 'Approved')} 
                              title="Approve Review"
                              style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {rStatus !== 'Hidden' && (
                            <button 
                              className="icon-btn" 
                              onClick={() => handleUpdateStatus(review.id, 'Hidden')} 
                              title="Hide Review"
                              style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}
                            >
                              <EyeOff size={16} />
                            </button>
                          )}
                          <button className="icon-btn delete" onClick={() => handleDelete(review.id)} title="Delete Review">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted" style={{ padding: '3rem' }}>
                    No reviews matching criteria found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Enlarged review photo" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
