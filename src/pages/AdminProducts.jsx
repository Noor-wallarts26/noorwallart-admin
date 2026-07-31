import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { Plus, Edit2, Trash2, Search, Filter, Image as ImageIcon, Copy, Eye, EyeOff, UploadCloud } from 'lucide-react';
import { deleteDoc, doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

const AdminProducts = () => {
  const { products } = useContext(ShopContext);
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenModal = (product = null) => {
    if (product) {
      navigate(`/products/edit/${product.id}`, { state: { product } });
    } else {
      navigate('/products/new');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "products", id.toString()));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDuplicate = async (product) => {
    if (window.confirm(`Duplicate ${product.title}?`)) {
      try {
        const { id, ...productDataWithoutId } = product;
        productDataWithoutId.title = `${product.title} (Copy)`;
        const collRef = collection(db, "products");
        await addDoc(collRef, productDataWithoutId);
        alert("Product duplicated successfully.");
      } catch (err) {
        console.error("Error duplicating product:", err);
      }
    }
  };

  const toggleVisibility = async (id, currentStatus) => {
    try {
      const productRef = doc(db, "products", id.toString());
      await updateDoc(productRef, {
        isHidden: !currentStatus
      });
    } catch (err) {
      console.error("Error updating visibility: ", err);
    }
  };

  const toggleSliderStatus = async (id, currentStatus) => {
    try {
      const productRef = doc(db, "products", id.toString());
      await updateDoc(productRef, {
        showInSlider: !currentStatus
      });
    } catch (err) {
      console.error("Error updating slider status: ", err);
    }
  };

  const updateDeliveryCharge = async (id, newCharge) => {
    try {
      const productRef = doc(db, "products", id.toString());
      await updateDoc(productRef, {
        deliveryCharge: newCharge
      });
    } catch (err) {
      console.error("Error updating delivery charge: ", err);
    }
  };

  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
  
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkLog, setBulkLog] = useState(null);

  const downloadSampleTemplate = () => {
    const csvHeader = "Product Name,Category,Price,Discount,Stock,SKU,Description,Images\n";
    const csvRow1 = '"Ayatul Kursi Metallic Frame","Islamic wall arts",4999,10,15,"NWA-IK-01","Premium laser-cut Islamic calligraphy wall frame.","https://images.unsplash.com/photo-1579783902614-a3fb3927b675"\n';
    const csvRow2 = '"Customized Nikkah Board","Wedding and nikkah collections",3499,0,8,"NWA-NK-02","Personalized acrylic Nikkah certificate board.","https://images.unsplash.com/photo-1513519245088-0e12902e5a38"\n';
    
    const blob = new Blob([csvHeader + csvRow1 + csvRow2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Noor_Wallarts_Bulk_Products_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkLog(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        alert("CSV file is empty or missing data rows.");
        return;
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        // Basic CSV line parsing handling quotes
        const line = lines[i];
        const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());

        const title = cleanCols[0] || '';
        const category = cleanCols[1] || 'Islamic wall arts';
        const price = Number(cleanCols[2]) || 0;
        const discount = Number(cleanCols[3]) || 0;
        const stock = Number(cleanCols[4]) || 0;
        const sku = cleanCols[5] || `NWA-BLK-${Date.now()}-${i}`;
        const description = cleanCols[6] || '';
        const imageUrl = cleanCols[7] || '/logo.jpg';

        const isValid = title.length > 0 && category.length > 0 && price > 0 && stock >= 0;

        rows.push({
          rowNum: i,
          title,
          category,
          price,
          discount,
          stock,
          sku,
          description,
          imageUrl,
          isValid,
          errorMsg: !isValid ? 'Missing mandatory fields (Title, Category, Price > 0, Stock >= 0)' : ''
        });
      }
      setCsvPreviewData(rows);
    };
    reader.readAsText(file);
  };

  const executeBulkImport = async () => {
    const validRows = csvPreviewData.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert("No valid rows available to import. Please check errors.");
      return;
    }

    setBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const collRef = collection(db, "products");
      for (const row of validRows) {
        try {
          await addDoc(collRef, {
            title: row.title,
            category: row.category,
            price: row.price,
            discount: row.discount,
            stock: row.stock,
            sku: row.sku,
            description: row.description,
            imageUrl: row.imageUrl,
            rating: 5,
            reviewsCount: 0,
            createdAt: Date.now()
          });
          successCount++;
        } catch (err) {
          console.error("Bulk upload item error: ", err);
          failCount++;
        }
      }

      setBulkLog({
        total: csvPreviewData.length,
        success: successCount,
        failed: failCount + (csvPreviewData.length - validRows.length)
      });
      alert(`Bulk Import Finished! Successfully added ${successCount} products.`);
    } catch (err) {
      console.error("Bulk Import error:", err);
      alert("Error processing bulk upload.");
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <h1>Products</h1>
        <div className="flex gap-4">
          <button className="btn-secondary" onClick={() => setShowBulkModal(true)}>
            <UploadCloud size={18} /> Bulk Upload
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="admin-header-search" style={{ border: '1px solid var(--border-color)', margin: 0, width: '300px' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}
                style={{ 
                  padding: '0.375rem 0.75rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.75rem',
                  boxShadow: 'none'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card table-container" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>Hero Slider</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price (Offer)</th>
              <th>Stock</th>
              <th>Visibility</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id} style={{ opacity: p.isHidden ? 0.6 : 1 }}>
                <td style={{ textAlign: 'center' }}>
                  <label style={{ display: 'inline-flex', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={p.showInSlider || false} 
                      onChange={() => toggleSliderStatus(p.id, p.showInSlider || false)}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)' }}
                    />
                  </label>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImageIcon size={20} className="text-muted" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-primary block">{p.title}</span>
                      <span className="text-muted text-xs">SKU: {p.sku || 'N/A'}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ backgroundColor: 'var(--bg-color)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', border: '1px solid var(--border-light)' }}>
                    {p.category || 'Uncategorized'}
                  </span>
                </td>
                <td className="font-semibold">
                  ₹{p.offerPrice ? p.offerPrice.toFixed(2) : p.price?.toFixed(2)}
                  {p.regularPrice && p.offerPrice && <span className="text-muted text-xs line-through ml-2">₹{p.regularPrice.toFixed(2)}</span>}
                </td>
                <td>
                  <span className={`status-badge ${p.stock > 0 ? 'accepted' : 'cancelled'}`}>
                    {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                  </span>
                </td>
                <td>
                  <button onClick={() => toggleVisibility(p.id, p.isHidden)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                    {p.isHidden ? <><EyeOff size={14}/> Hidden</> : <><Eye size={14}/> Visible</>}
                  </button>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    onClick={() => handleDuplicate(p)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                    title="Duplicate Product"
                  >
                    <Copy size={18} />
                  </button>
                  <button 
                    onClick={() => handleOpenModal(p)} 
                    style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer', padding: '0.25rem' }}
                    title="Edit Product"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)} 
                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem' }}
                    title="Delete Product"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-muted" style={{ padding: '3rem' }}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* BULK UPLOAD MODAL */}
      {showBulkModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <UploadCloud size={28} className="text-primary" />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Product Bulk Upload</h2>
                  <p className="text-xs text-muted" style={{ margin: 0 }}>Import multiple products instantly via CSV format.</p>
                </div>
              </div>
              <button onClick={() => { setShowBulkModal(false); setCsvPreviewData([]); setBulkLog(null); }} className="btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>Close</button>
            </div>

            {/* INSTRUCTIONS & SAMPLE DOWNLOAD */}
            <div style={{ backgroundColor: 'var(--surface-hover)', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>Bulk Upload Instructions & Mandatory Columns:</h4>
              <ul className="text-xs text-muted" style={{ paddingLeft: '1.25rem', margin: '0 0 1rem 0', lineHeight: '1.6' }}>
                <li>Mandatory columns: <strong>Product Name, Category, Price, Stock</strong>.</li>
                <li>Optional columns: <strong>Discount, SKU, Description, Images</strong> (image URL or DataURL).</li>
                <li>Rows missing mandatory values will be highlighted in red and skipped during import.</li>
              </ul>
              <button onClick={downloadSampleTemplate} className="btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                Download Sample Excel/CSV Template (.csv)
              </button>
            </div>

            {/* FILE INPUT */}
            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '2px dashed var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>
              <input type="file" accept=".csv" onChange={handleCsvFileUpload} id="csvFileInput" style={{ display: 'none' }} />
              <label htmlFor="csvFileInput" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <UploadCloud size={18} /> Select & Parse CSV File
              </label>
            </div>

            {/* BULK REPORT LOG */}
            {bulkLog && (
              <div style={{ padding: '1rem', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#166534' }}>
                <strong>Upload Report:</strong> Processed {bulkLog.total} rows — {bulkLog.success} Successfully Imported, {bulkLog.failed} Errors/Skipped.
              </div>
            )}

            {/* PREVIEW TABLE */}
            {csvPreviewData.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.75rem' }}>CSV Preview & Error Audit ({csvPreviewData.length} rows found)</h4>
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <table className="data-table text-xs" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price (₹)</th>
                        <th>Stock</th>
                        <th>SKU</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreviewData.map((row) => (
                        <tr key={row.rowNum} style={{ backgroundColor: row.isValid ? '#FFFFFF' : '#FEE2E2' }}>
                          <td>#{row.rowNum}</td>
                          <td className="font-semibold">{row.title || <span style={{ color: '#DC2626' }}>MISSING</span>}</td>
                          <td>{row.category}</td>
                          <td>₹{row.price}</td>
                          <td>{row.stock}</td>
                          <td>{row.sku}</td>
                          <td>
                            {row.isValid ? (
                              <span className="status-badge accepted">Valid Row</span>
                            ) : (
                              <span className="status-badge cancelled" title={row.errorMsg}>Error Row</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button className="btn-secondary" onClick={() => setCsvPreviewData([])}>Clear CSV</button>
                  <button 
                    className="btn-primary" 
                    onClick={executeBulkImport}
                    disabled={bulkProcessing || csvPreviewData.filter(r => r.isValid).length === 0}
                  >
                    {bulkProcessing ? 'Importing Products...' : `Import ${csvPreviewData.filter(r => r.isValid).length} Valid Products`}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;

