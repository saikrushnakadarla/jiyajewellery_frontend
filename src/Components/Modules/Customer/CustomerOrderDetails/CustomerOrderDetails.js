// CustomerOrderDetails.js
import React, { useState, useEffect } from 'react';
import CustomerNavbar from "../../../Pages/Navbar/CustomerNavbar";
import './CustomerOrderDetails.css';
import { useNavigate, useParams } from 'react-router-dom';
import baseURL from '../../ApiUrl/NodeBaseURL';
import { FaArrowLeft, FaDownload, FaPrint } from 'react-icons/fa';

const CustomerOrderDetails = () => {
  const { estimateNumber } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrderDetails();
  }, [estimateNumber]);

  const fetchOrderDetails = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        setError('Please login to view order details');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userString);
      
      // Fetch order details using the existing endpoint
      const response = await fetch(`${baseURL}/get-estimates/${estimateNumber}?customer_id=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      
      if (data.uniqueData && data.repeatedData) {
        setOrderData(data.uniqueData);
        setItems(data.repeatedData);
      } else {
        throw new Error('Invalid response format');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(parseFloat(price));
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

  const handleBack = () => {
    navigate('/customer-orders');
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await fetch(`${baseURL}/get-invoice/${estimateNumber}`);
      if (response.ok) {
        const data = await response.json();
        // Here you would typically generate and download PDF
        alert(`Download invoice for order: ${estimateNumber}`);
      } else {
        alert('Invoice not available yet');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error downloading invoice');
    }
  };

  if (loading) {
    return (
      <div>
        <CustomerNavbar />
        <div className="order-details-loading-container">
          <div className="order-details-loading-spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <CustomerNavbar />
        <div className="order-details-error-container">
          <p>Error: {error}</p>
          <button onClick={fetchOrderDetails}>Retry</button>
          <button onClick={handleBack}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div>
        <CustomerNavbar />
        <div className="order-details-error-container">
          <p>Order not found</p>
          <button onClick={handleBack}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <CustomerNavbar />
      
      <div className="order-details-container">
        {/* Header with Back Button */}
        <div className="order-details-header">
          <button className="order-details-back-btn" onClick={handleBack}>
            <FaArrowLeft /> Back to Orders
          </button>
          <h2 className="order-details-title">Order Details</h2>
        </div>

        {/* Order Summary Card */}
        <div className="order-summary-card">
          <h3>Order Summary</h3>
          <div className="order-summary-grid">
            <div className="summary-item">
              <span className="summary-label">Order Number:</span>
              <span className="summary-value">{orderData.order_number || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Order Date:</span>
              <span className="summary-value">{formatDate(orderData.order_date)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Status:</span>
              <span className={`order-status ${orderData.estimate_status?.toLowerCase()}`}>
                {orderData.estimate_status || 'Processing'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Estimate Number:</span>
              <span className="summary-value">{orderData.estimate_number}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="order-items-section">
          <h3>Order Items</h3>
          <div className="order-items-table-wrapper">
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Product Name</th>
                  <th>Barcode</th>
                  <th>Metal Type</th>
                  <th>Purity</th>
                  <th>Gross Wt (g)</th>
                  <th>Stone Wt (g)</th>
                  <th>Total Wt (g)</th>
                  <th>Rate (₹)</th>
                  <th>Total Price (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.product_name}</td>
                    <td>{item.code}</td>
                    <td>{item.metal_type}</td>
                    <td>{item.purity}</td>
                    <td>{parseFloat(item.gross_weight).toFixed(3)}</td>
                    <td>{parseFloat(item.stone_weight).toFixed(3)}</td>
                    <td>{parseFloat(item.total_weight_av).toFixed(3)}</td>
                    <td>{parseFloat(item.rate).toFixed(2)}</td>
                    <td>{formatPrice(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Price Summary */}
        <div className="price-summary-section">
          <h3>Price Summary</h3>
          <div className="price-summary-card">
            <div className="price-row">
              <span>Total Amount:</span>
              <span>{formatPrice(orderData.total_amount)}</span>
            </div>
            <div className="price-row">
              <span>Discount:</span>
              <span>{formatPrice(orderData.disscount || 0)}</span>
            </div>
            <div className="price-row">
              <span>Taxable Amount:</span>
              <span>{formatPrice(orderData.taxable_amount)}</span>
            </div>
            <div className="price-row">
              <span>Tax Amount:</span>
              <span>{formatPrice(orderData.tax_amount)}</span>
            </div>
            <div className="price-row total">
              <span>Net Payable Amount:</span>
              <span>{formatPrice(orderData.net_amount)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="order-actions">
          <button className="order-download-btn" onClick={handleDownloadInvoice}>
            <FaDownload /> Download Invoice
          </button>
          <button className="order-print-btn" onClick={() => window.print()}>
            <FaPrint /> Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderDetails;