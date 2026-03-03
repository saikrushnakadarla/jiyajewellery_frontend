import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Button, Row, Col, Modal } from 'react-bootstrap';
import { FaFilePdf, FaEye, FaDownload, FaPrint } from 'react-icons/fa';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import baseURL from "../../ApiUrl/NodeBaseURL";
import SalespersonNavbar from '../../../Pages/Navbar/SalesNavbar';
import './SalespersonReports.css';

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: '2 solid #a36e29',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a36e29',
    marginBottom: 10,
  },
  dateRange: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
  },
  salespersonInfo: {
    fontSize: 12,
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e9edf2',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e9edf2',
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 8,
    fontSize: 10,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#e9edf2',
    flex: 1,
  },
  lastTableCell: {
    padding: 8,
    fontSize: 10,
    textAlign: 'left',
    flex: 1,
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#64748b',
  },
});

// PDF Document Component for Customer Report (Salesperson-specific)
const SalespersonCustomerPDFDocument = ({ data, fromDate, toDate, salespersonName }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.companyName}>JIYAA JEWELS</Text>
        <Text style={pdfStyles.title}>My Customer-Wise Report</Text>
        <Text style={pdfStyles.salespersonInfo}>SalesPerson: {salespersonName}</Text>
        <Text style={pdfStyles.dateRange}>
          Period: {fromDate || 'Start'} to {toDate || 'End'}
        </Text>
      </View>

      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={pdfStyles.tableCell}>Sr. No.</Text>
          <Text style={pdfStyles.tableCell}>Customer ID</Text>
          <Text style={pdfStyles.tableCell}>Customer Name</Text>
          <Text style={pdfStyles.tableCell}>Total Estimates</Text>
          <Text style={pdfStyles.lastTableCell}>Total Amount (₹)</Text>
        </View>

        {data.map((item, index) => (
          <View key={index} style={pdfStyles.tableRow}>
            <Text style={pdfStyles.tableCell}>{index + 1}</Text>
            <Text style={pdfStyles.tableCell}>{item.customer_id}</Text>
            <Text style={pdfStyles.tableCell}>{item.customer_name}</Text>
            <Text style={pdfStyles.tableCell}>{item.total_estimates}</Text>
            <Text style={pdfStyles.lastTableCell}>₹{item.total_amount.toFixed(2)}</Text>
          </View>
        ))}

        <View style={[pdfStyles.tableRow, { backgroundColor: '#f8fafc' }]}>
          <Text style={pdfStyles.tableCell}></Text>
          <Text style={pdfStyles.tableCell}></Text>
          <Text style={pdfStyles.tableCell}></Text>
          <Text style={pdfStyles.tableCell}>Grand Total:</Text>
          <Text style={pdfStyles.lastTableCell}>
            ₹{data.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2)}
          </Text>
        </View>
      </View>

      <Text style={pdfStyles.footer}>
        Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
      </Text>
    </Page>
  </Document>
);

// PDF Document Component for Product Report (Salesperson-specific)
const SalespersonProductPDFDocument = ({ data, fromDate, toDate, salespersonName }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.companyName}>JIYAA JEWELS</Text>
        <Text style={pdfStyles.title}>My Product-Wise Report</Text>
        <Text style={pdfStyles.salespersonInfo}>SalesPerson: {salespersonName}</Text>
        <Text style={pdfStyles.dateRange}>
          Period: {fromDate || 'Start'} to {toDate || 'End'}
        </Text>
      </View>

      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={pdfStyles.tableCell}>Sr. No.</Text>
          <Text style={pdfStyles.tableCell}>Product ID</Text>
          <Text style={pdfStyles.tableCell}>Product Name</Text>
          <Text style={pdfStyles.tableCell}>Metal Type</Text>
          <Text style={pdfStyles.tableCell}>Purity</Text>
          <Text style={pdfStyles.tableCell}>Total Qty</Text>
          <Text style={pdfStyles.lastTableCell}>Total Amount (₹)</Text>
        </View>

        {data.map((item, index) => (
          <View key={index} style={pdfStyles.tableRow}>
            <Text style={pdfStyles.tableCell}>{index + 1}</Text>
            <Text style={pdfStyles.tableCell}>{item.product_id}</Text>
            <Text style={pdfStyles.tableCell}>{item.product_name}</Text>
            <Text style={pdfStyles.tableCell}>{item.metal_type}</Text>
            <Text style={pdfStyles.tableCell}>{item.purity}</Text>
            <Text style={pdfStyles.tableCell}>{item.total_quantity}</Text>
            <Text style={pdfStyles.lastTableCell}>₹{item.total_amount.toFixed(2)}</Text>
          </View>
        ))}

        <View style={[pdfStyles.tableRow, { backgroundColor: '#f8fafc' }]}>
          <Text style={pdfStyles.tableCell}></Text>
          <Text style={pdfStyles.tableCell}></Text>
          <Text style={pdfStyles.tableCell}></Text>
          <Text style={pdfStyles.tableCell}></Text>
          <Text style={pdfStyles.tableCell}></Text>
          <Text style={pdfStyles.tableCell}>Grand Total:</Text>
          <Text style={pdfStyles.lastTableCell}>
            ₹{data.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2)}
          </Text>
        </View>
      </View>

      <Text style={pdfStyles.footer}>
        Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
      </Text>
    </Page>
  </Document>
);

const SalespersonReports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsData, setDetailsData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });

  // Get logged-in user from localStorage on component mount
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        Swal.fire('Error', 'Failed to load user information', 'error');
        navigate('/salesperson-login');
      }
    } else {
      Swal.fire('Please Login', 'You need to login to view reports', 'info');
      navigate('/salesperson-login');
    }
  }, [navigate]);

  // Fetch users on component mount
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchProducts();
    }
  }, [currentUser]);

  // Fetch data when tab changes
  useEffect(() => {
    if (currentUser) {
      if (activeTab === 'customer') {
        fetchCustomerWiseData();
      } else if (activeTab === 'product') {
        fetchProductWiseData();
      }
    }
  }, [activeTab, currentUser]);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${baseURL}/get/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  // Get user name by ID
  const getUserName = (userId) => {
    if (!userId) return 'N/A';
    const user = users.find(u => u.id === parseInt(userId));
    return user ? user.full_name : `ID: ${userId}`;
  };

  // Get product name by ID
  const getProductName = (productId) => {
    if (!productId) return 'N/A';
    const product = products.find(p => p.product_id === parseInt(productId));
    return product ? product.product_name : `ID: ${productId}`;
  };

  // Fetch Customer-wise data filtered by current salesperson
  const fetchCustomerWiseData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/get-unique-estimates`);
      const estimates = response.data || [];
      
      // Filter estimates by current salesperson ID
      let salespersonEstimates = estimates.filter(item => 
        parseInt(item.salesperson_id) === parseInt(currentUser.id)
      );
      
      // Apply date filter if selected
      if (dateRange.fromDate && dateRange.toDate) {
        salespersonEstimates = salespersonEstimates.filter(item => {
          const itemDate = new Date(item.date).setHours(0, 0, 0, 0);
          const from = new Date(dateRange.fromDate).setHours(0, 0, 0, 0);
          const to = new Date(dateRange.toDate).setHours(0, 0, 0, 0);
          return itemDate >= from && itemDate <= to;
        });
      }

      // Group by customer
      const groupedData = {};
      
      salespersonEstimates.forEach(estimate => {
        const customerId = estimate.customer_id;
        if (!customerId) return;
        
        if (!groupedData[customerId]) {
          groupedData[customerId] = {
            customer_id: customerId,
            customer_name: estimate.customer_name || getUserName(customerId),
            total_estimates: 0,
            total_amount: 0,
            estimates: []
          };
        }
        
        groupedData[customerId].total_estimates += 1;
        groupedData[customerId].total_amount += parseFloat(estimate.net_amount || 0);
      });

      const result = Object.values(groupedData).sort((a, b) => b.total_amount - a.total_amount);
      setReportData(result);
    } catch (error) {
      console.error('Error fetching customer-wise data:', error);
      Swal.fire('Error', 'Failed to load customer-wise data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Product-wise data filtered by current salesperson
  const fetchProductWiseData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/get/estimates`);
      const estimates = response.data || [];
      
      // Filter estimates by current salesperson ID
      let salespersonEstimates = estimates.filter(item => 
        parseInt(item.salesperson_id) === parseInt(currentUser.id)
      );
      
      // Apply date filter if selected
      if (dateRange.fromDate && dateRange.toDate) {
        salespersonEstimates = salespersonEstimates.filter(item => {
          const itemDate = new Date(item.date).setHours(0, 0, 0, 0);
          const from = new Date(dateRange.fromDate).setHours(0, 0, 0, 0);
          const to = new Date(dateRange.toDate).setHours(0, 0, 0, 0);
          return itemDate >= from && itemDate <= to;
        });
      }

      // Group by product
      const groupedData = {};
      
      salespersonEstimates.forEach(estimate => {
        const productId = estimate.product_id;
        if (!productId) return;
        
        if (!groupedData[productId]) {
          groupedData[productId] = {
            product_id: productId,
            product_name: estimate.product_name || getProductName(productId),
            metal_type: estimate.metal_type || 'N/A',
            purity: estimate.purity || 'N/A',
            total_quantity: 0,
            total_amount: 0,
            estimates: []
          };
        }
        
        groupedData[productId].total_quantity += parseInt(estimate.qty || 1);
        groupedData[productId].total_amount += parseFloat(estimate.total_price || 0);
      });

      const result = Object.values(groupedData).sort((a, b) => b.total_amount - a.total_amount);
      setReportData(result);
    } catch (error) {
      console.error('Error fetching product-wise data:', error);
      Swal.fire('Error', 'Failed to load product-wise data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle view details
  const handleViewDetails = async (item) => {
    if (!currentUser) return;
    
    setSelectedItem(item);
    
    try {
      const response = await axios.get(`${baseURL}/get/estimates`);
      const allEstimates = response.data || [];
      
      let filteredEstimates = [];
      if (activeTab === 'customer') {
        filteredEstimates = allEstimates.filter(est => 
          parseInt(est.customer_id) === parseInt(item.customer_id) &&
          parseInt(est.salesperson_id) === parseInt(currentUser.id)
        );
      } else if (activeTab === 'product') {
        filteredEstimates = allEstimates.filter(est => 
          parseInt(est.product_id) === parseInt(item.product_id) &&
          parseInt(est.salesperson_id) === parseInt(currentUser.id)
        );
      }
      
      setDetailsData(filteredEstimates);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching details:', error);
      Swal.fire('Error', 'Failed to load details', 'error');
    }
  };

  // Handle date filter
  const handleDateFilter = () => {
    if (activeTab === 'customer') {
      fetchCustomerWiseData();
    } else if (activeTab === 'product') {
      fetchProductWiseData();
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle Excel Download
  const handleDownload = () => {
    if (reportData.length === 0) {
      Swal.fire('Info', 'No data to export', 'info');
      return;
    }

    let worksheetData = [];
    let fileName = '';

    if (activeTab === 'customer') {
      fileName = 'my_customer_report.xlsx';
      worksheetData = [
        ['Sr. No.', 'Customer ID', 'Customer Name', 'Total Estimates', 'Total Amount (₹)'],
        ...reportData.map((item, index) => [
          index + 1,
          item.customer_id,
          item.customer_name,
          item.total_estimates,
          item.total_amount.toFixed(2)
        ]),
        [],
        ['Grand Total', '', '', '', reportData.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2)]
      ];
    } else if (activeTab === 'product') {
      fileName = 'my_product_report.xlsx';
      worksheetData = [
        ['Sr. No.', 'Product ID', 'Product Name', 'Metal Type', 'Purity', 'Total Quantity', 'Total Amount (₹)'],
        ...reportData.map((item, index) => [
          index + 1,
          item.product_id,
          item.product_name,
          item.metal_type,
          item.purity,
          item.total_quantity,
          item.total_amount.toFixed(2)
        ]),
        [],
        ['Grand Total', '', '', '', '', '', reportData.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2)]
      ];
    }

    worksheetData.push([]);
    worksheetData.push([`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`]);
    worksheetData.push([`Period: ${dateRange.fromDate || 'Start'} to ${dateRange.toDate || 'End'}`]);
    worksheetData.push([`SalesPerson: ${currentUser?.name || currentUser?.full_name || 'N/A'}`]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, fileName);

    Swal.fire('Success', 'Excel file downloaded successfully!', 'success');
  };

  // Render table based on active tab
  const renderTable = () => {
    if (loading) {
      return (
        <div className="salesperson-reports-loading-container">
          <div className="salesperson-reports-loading-spinner"></div>
          <p>Loading reports...</p>
        </div>
      );
    }

    if (reportData.length === 0) {
      return (
        <div className="salesperson-reports-empty-container">
          <p className="salesperson-reports-empty-message">No data available for selected period</p>
        </div>
      );
    }

    if (activeTab === 'customer') {
      return (
        <div className="salesperson-reports-table-responsive">
          <table className="salesperson-reports-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Total Estimates</th>
                <th>Total Amount (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => (
                <tr key={item.customer_id}>
                  <td>{index + 1}</td>
                  <td>{item.customer_id}</td>
                  <td>{item.customer_name}</td>
                  <td>{item.total_estimates}</td>
                  <td>₹{item.total_amount.toFixed(2)}</td>
                  <td>
                    <FaEye 
                      className="salesperson-reports-action-icon" 
                      size={18}
                      onClick={() => handleViewDetails(item)}
                      title="View Details"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="salesperson-reports-table-footer">
                <td colSpan="4" className="salesperson-reports-text-end salesperson-reports-fw-bold">Grand Total:</td>
                <td className="salesperson-reports-fw-bold">₹{reportData.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    } else if (activeTab === 'product') {
      return (
        <div className="salesperson-reports-table-responsive">
          <table className="salesperson-reports-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Metal Type</th>
                <th>Purity</th>
                <th>Total Quantity</th>
                <th>Total Amount (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => (
                <tr key={item.product_id}>
                  <td>{index + 1}</td>
                  <td>{item.product_id}</td>
                  <td>{item.product_name}</td>
                  <td>{item.metal_type}</td>
                  <td>{item.purity}</td>
                  <td>{item.total_quantity}</td>
                  <td>₹{item.total_amount.toFixed(2)}</td>
                  <td>
                    <FaEye 
                      className="salesperson-reports-action-icon" 
                      size={18}
                      onClick={() => handleViewDetails(item)}
                      title="View Details"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="salesperson-reports-table-footer">
                <td colSpan="6" className="salesperson-reports-text-end salesperson-reports-fw-bold">Grand Total:</td>
                <td className="salesperson-reports-fw-bold">₹{reportData.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }
  };

  return (
    <>
      <SalespersonNavbar />
      <div className="salesperson-reports-main-container">
        <div className="salesperson-reports-content-container">

          {/* Header with Title and Action Buttons */}
          <Row className="salesperson-reports-header">
            <Col md={8}>
              <h2 className="salesperson-reports-title">My Reports</h2>
              <p className="salesperson-reports-subtitle">
                Welcome, {currentUser?.name || currentUser?.full_name || 'SalesPerson'}! View your sales reports
              </p>
            </Col>
            <Col md={4} className="salesperson-reports-actions">
              <Button 
                variant="outline-secondary" 
                className="salesperson-reports-action-btn"
                onClick={handlePrint}
              >
                <FaPrint /> Print
              </Button>
              
              {/* PDF Download Buttons */}
              {reportData.length > 0 && (
                <>
                  {activeTab === 'customer' && (
                    <PDFDownloadLink
                      document={<SalespersonCustomerPDFDocument 
                        data={reportData} 
                        fromDate={dateRange.fromDate} 
                        toDate={dateRange.toDate}
                        salespersonName={currentUser?.name || currentUser?.full_name || 'SalesPerson'}
                      />}
                      fileName="my_customer_report.pdf"
                    >
                      {({ loading }) => (
                        <Button 
                          variant="outline-secondary" 
                          className="salesperson-reports-action-btn"
                          disabled={loading}
                        >
                          <FaFilePdf /> {loading ? 'Preparing...' : 'Export PDF'}
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                  {activeTab === 'product' && (
                    <PDFDownloadLink
                      document={<SalespersonProductPDFDocument 
                        data={reportData} 
                        fromDate={dateRange.fromDate} 
                        toDate={dateRange.toDate}
                        salespersonName={currentUser?.name || currentUser?.full_name || 'SalesPerson'}
                      />}
                      fileName="my_product_report.pdf"
                    >
                      {({ loading }) => (
                        <Button 
                          variant="outline-secondary" 
                          className="salesperson-reports-action-btn"
                          disabled={loading}
                        >
                          <FaFilePdf /> {loading ? 'Preparing...' : 'Export PDF'}
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                </>
              )}
              
              {/* Show disabled button when no data */}
              {reportData.length === 0 && (
                <Button 
                  variant="outline-secondary" 
                  className="salesperson-reports-action-btn"
                  disabled
                >
                  <FaFilePdf /> Export PDF
                </Button>
              )}
              
              <Button 
                variant="outline-secondary" 
                className="salesperson-reports-action-btn"
                onClick={handleDownload}
                disabled={reportData.length === 0}
              >
                <FaDownload /> Download Excel
              </Button>
            </Col>
          </Row>

          {/* Two Main Report Tabs */}
          <div className="salesperson-reports-tabs-container">
            <button
              className={`salesperson-reports-tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
              onClick={() => setActiveTab('customer')}
            >
              Customer-Wise
            </button>
            <button
              className={`salesperson-reports-tab-btn ${activeTab === 'product' ? 'active' : ''}`}
              onClick={() => setActiveTab('product')}
            >
              Product-Wise
            </button>
          </div>

          {/* Date Filter */}
          <div className="salesperson-reports-filter-container">
            <div className="salesperson-reports-filter-row">
              <div className="salesperson-reports-filter-group">
                <label className="salesperson-reports-filter-label">From Date:</label>
                <input
                  type="date"
                  className="salesperson-reports-date-input"
                  value={dateRange.fromDate}
                  onChange={(e) => setDateRange({...dateRange, fromDate: e.target.value})}
                />
              </div>
              <div className="salesperson-reports-filter-group">
                <label className="salesperson-reports-filter-label">To Date:</label>
                <input
                  type="date"
                  className="salesperson-reports-date-input"
                  value={dateRange.toDate}
                  onChange={(e) => setDateRange({...dateRange, toDate: e.target.value})}
                />
              </div>
              <div className="salesperson-reports-filter-group">
                <button 
                  className="salesperson-reports-filter-btn"
                  onClick={handleDateFilter}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="salesperson-reports-table-wrapper">
            {renderTable()}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="xl" className="salesperson-reports-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {activeTab === 'customer' && `Customer: ${selectedItem?.customer_name}`}
            {activeTab === 'product' && `Product: ${selectedItem?.product_name}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsData.length > 0 ? (
            <div className="salesperson-reports-table-responsive">
              <table className="salesperson-reports-details-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Estimate No.</th>
                    <th>Order No.</th>
                    <th>Customer Name</th>
                    {activeTab === 'product' && (
                      <>
                        <th>Product Name</th>
                        <th>Metal Type</th>
                        <th>Purity</th>
                        <th>Qty</th>
                      </>
                    )}
                    <th>Amount (₹)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailsData.map((item, index) => (
                    <tr key={index}>
                      <td>{formatDate(item.date)}</td>
                      <td>{item.estimate_number}</td>
                      <td>{item.order_number || 'N/A'}</td>
                      <td>{item.customer_name || getUserName(item.customer_id)}</td>
                      {activeTab === 'product' && (
                        <>
                          <td>{item.product_name}</td>
                          <td>{item.metal_type}</td>
                          <td>{item.purity}</td>
                          <td>{item.qty || 1}</td>
                        </>
                      )}
                      <td>₹{parseFloat(item.net_amount || item.total_price || 0).toFixed(2)}</td>
                      <td>
                        <span className={`salesperson-reports-status-badge salesperson-reports-status-${(item.estimate_status || 'Pending').toLowerCase()}`}>
                          {item.estimate_status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="salesperson-reports-details-footer">
                    <td colSpan={activeTab === 'product' ? 8 : 5} className="salesperson-reports-text-end salesperson-reports-fw-bold">
                      Total Amount:
                    </td>
                    <td className="salesperson-reports-fw-bold" colSpan="2">
                      ₹{detailsData.reduce((sum, item) => 
                        sum + parseFloat(item.net_amount || item.total_price || 0), 0
                      ).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="salesperson-reports-text-center salesperson-reports-py-3">No details available</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SalespersonReports;