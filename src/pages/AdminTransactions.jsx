import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { CreditCard, Search, Download, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const AdminTransactions = () => {
  const { orders } = useContext(ShopContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  // Derive transactions from orders
  const transactions = orders.map(order => ({
    id: `TXN-${order.id.substring(0, 8).toUpperCase()}`,
    orderId: order.id,
    customerName: order.customer?.name || 'Guest',
    amount: order.totalPrice || order.total || order.totalAmount || 0,
    date: order.timestamp || order.createdAt || order.date || new Date().getTime(),
    method: order.paymentMethod || 'UPI / Online',
    status: order.status === 'Cancelled' || order.status === 'Returned' ? 'Failed' : 'Success',
    type: 'Credit' // All customer orders are incoming credit
  }));

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalCredit = filteredTransactions.filter(t => t.status === 'Success').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalFailed = filteredTransactions.filter(t => t.status === 'Failed').reduce((sum, t) => sum + Number(t.amount), 0);
  const successCount = filteredTransactions.filter(t => t.status === 'Success').length;
  const failedCount = filteredTransactions.filter(t => t.status === 'Failed').length;

  const handleDownloadCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No data available to export.");
      return;
    }
    
    const headers = ['Transaction ID', 'Order ID', 'Customer Name', 'Date', 'Method', 'Status', 'Amount'];
    const rows = filteredTransactions.map(txn => {
      const date = new Date(txn.date).toLocaleDateString();
      return [
        txn.id,
        txn.orderId,
        `"${txn.customerName}"`,
        date,
        txn.method,
        txn.status,
        txn.amount
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h1>Transactions</h1>
          <p className="text-muted">Monitor all incoming payments and refunds.</p>
        </div>
        <button className="btn-outline" onClick={handleDownloadCSV}>
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <ArrowDownRight size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Inflow (Success)</h3>
            <p className="stat-value text-success">₹{totalCredit.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Outflow / Failed</h3>
            <p className="stat-value text-danger" style={{ color: '#ef4444' }}>₹{totalFailed.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <CreditCard size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Transactions</h3>
            <p className="stat-value">{filteredTransactions.length}</p>
            <span className="stat-change text-muted" style={{ color: 'var(--text-muted)', backgroundColor: 'transparent', padding: 0 }}>
              {successCount} Success, {failedCount} Failed
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-header">
          <div className="search-bar">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by TXN ID, Order ID or Customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="table-actions">
            <div className="filter-dropdown">
              <Filter size={18} className="text-muted" />
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed / Refunded</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn, index) => (
                  <tr key={index}>
                    <td className="font-medium">{txn.id}</td>
                    <td className="text-muted">#{txn.orderId.substring(0,6)}</td>
                    <td>{txn.customerName}</td>
                    <td>{new Date(txn.date).toLocaleDateString()}</td>
                    <td>{txn.method}</td>
                    <td className="font-semibold" style={{ color: txn.status === 'Success' ? '#22c55e' : 'var(--text-primary)' }}>
                      {txn.status === 'Success' ? '+' : ''}₹{txn.amount}
                    </td>
                    <td>
                      <span className={`status-badge ${txn.status === 'Success' ? 'delivered' : 'cancelled'}`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted" style={{ padding: '3rem' }}>
                    No transactions found.
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

export default AdminTransactions;
