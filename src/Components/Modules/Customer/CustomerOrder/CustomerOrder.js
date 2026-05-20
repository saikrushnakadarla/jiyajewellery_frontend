// CustomerOrders.js
import React, { useState, useEffect } from 'react';
import CustomerNavbar from "../../../Pages/Navbar/CustomerNavbar";
import './CustomerOrder.css';
import { useNavigate } from 'react-router-dom';
import baseURL from '../../ApiUrl/NodeBaseURL';
import { FaEye, FaDownload, FaSpinner } from 'react-icons/fa';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        setError('Please login to view orders');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userString);
      
      const response = await fetch(`${baseURL}/get/customer-orders/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        throw new Error(data.message || 'Failed to load orders');
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const viewOrderDetails = (estimateNumber) => {
    navigate(`/customer-order-details/${estimateNumber}`);
  };

  const downloadInvoice = async (estimateNumber) => {
    try {
      const response = await fetch(`${baseURL}/get-invoice/${estimateNumber}`);
      if (response.ok) {
        const data = await response.json();
        // Implement PDF download logic here
        alert(`Download invoice for order: ${estimateNumber}`);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  if (loading) {
    return (
      <div>
        <CustomerNavbar />
        <div className="customer-orders-loading-container">
          <div className="customer-orders-loading-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <CustomerNavbar />
        <div className="customer-orders-error-container">
          <p>Error: {error}</p>
          <button onClick={fetchOrders}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-orders-page">
      <CustomerNavbar />
      
      <div className="customer-orders-container">
        <h2 className="customer-orders-title">My Orders</h2>
        
        {orders.length === 0 ? (
          <div className="customer-orders-empty">
            <p>You haven't placed any orders yet.</p>
            <button 
              className="customer-orders-shop-btn"
              onClick={() => navigate('/product-catalog')}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="customer-orders-list">
            {orders.map((order) => (
              <div key={order.estimate_number} className="customer-order-card">
                <div className="customer-order-header">
                  <div className="customer-order-info">
                    <span className="customer-order-label">Order Number:</span>
                    <span className="customer-order-value">{order.order_number || 'N/A'}</span>
                  </div>
                  <div className="customer-order-info">
                    <span className="customer-order-label">Order Date:</span>
                    <span className="customer-order-value">{formatDate(order.order_date)}</span>
                  </div>
                  <div className="customer-order-info">
                    <span className="customer-order-label">Status:</span>
                    <span className={`customer-order-status ${order.estimate_status?.toLowerCase()}`}>
                      {order.estimate_status || 'Processing'}
                    </span>
                  </div>
                </div>
                
                <div className="customer-order-body">
                  <div className="customer-order-items-preview">
                    <span className="customer-order-label">Items:</span>
                    <span className="customer-order-value">
                      {order.item_count || order.product_name || 'Multiple items'}
                    </span>
                  </div>
                  <div className="customer-order-total">
                    <span className="customer-order-label">Total Amount:</span>
                    <span className="customer-order-amount">
                      {formatPrice(order.net_amount || order.total_price || 0)}
                    </span>
                  </div>
                </div>
                
                <div className="customer-order-actions">
                  <button 
                    className="customer-order-view-btn"
                    onClick={() => viewOrderDetails(order.estimate_number)}
                  >
                    <FaEye /> View Details
                  </button>
                  <button 
                    className="customer-order-download-btn"
                    onClick={() => downloadInvoice(order.estimate_number)}
                  >
                    <FaDownload /> Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;