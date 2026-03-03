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
import CustomerNavbar from '../../../Pages/Navbar/CustomerNavbar';
import './CustomerReports.css';

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
  customerInfo: {
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

// PDF Document Component for SalesPerson Report (Customer-specific)
const CustomerSalesPersonPDFDocument = ({ data, fromDate, toDate, customerName }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.companyName}>JIYAA JEWELS</Text>
        <Text style={pdfStyles.title}>My SalesPerson-Wise Report</Text>
        <Text style={pdfStyles.customerInfo}>Customer: {customerName}</Text>
        <Text style={pdfStyles.dateRange}>
          Period: {fromDate || 'Start'} to {toDate || 'End'}
        </Text>
      </View>

      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={pdfStyles.tableCell}>Sr. No.</Text>
          <Text style={pdfStyles.tableCell}>SalesPerson ID</Text>
          <Text style={pdfStyles.tableCell}>SalesPerson Name</Text>
          <Text style={pdfStyles.tableCell}>Total Estimates</Text>
          <Text style={pdfStyles.lastTableCell}>Total Amount (₹)</Text>
        </View>

        {data.map((item, index) => (
          <View key={index} style={pdfStyles.tableRow}>
            <Text style={pdfStyles.tableCell}>{index + 1}</Text>
            <Text style={pdfStyles.tableCell}>{item.salesperson_id}</Text>
            <Text style={pdfStyles.tableCell}>{item.salesperson_name}</Text>
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

// PDF Document Component for Product Report (Customer-specific)
const CustomerProductPDFDocument = ({ data, fromDate, toDate, customerName }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.companyName}>JIYAA JEWELS</Text>
        <Text style={pdfStyles.title}>My Product-Wise Report</Text>
        <Text style={pdfStyles.customerInfo}>Customer: {customerName}</Text>
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

const CustomerReports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('salesperson');
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
        navigate('/customer-login');
      }
    } else {
      Swal.fire('Please Login', 'You need to login to view reports', 'info');
      navigate('/customer-login');
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
      if (activeTab === 'salesperson') {
        fetchSalesPersonWiseData();
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

  // Fetch SalesPerson-wise data filtered by current customer
  const fetchSalesPersonWiseData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/get-unique-estimates`);
      const estimates = response.data || [];
      
      // Filter estimates by current customer ID
      let customerEstimates = estimates.filter(item => 
        parseInt(item.customer_id) === parseInt(currentUser.id)
      );
      
      // Apply date filter if selected
      if (dateRange.fromDate && dateRange.toDate) {
        customerEstimates = customerEstimates.filter(item => {
          const itemDate = new Date(item.date).setHours(0, 0, 0, 0);
          const from = new Date(dateRange.fromDate).setHours(0, 0, 0, 0);
          const to = new Date(dateRange.toDate).setHours(0, 0, 0, 0);
          return itemDate >= from && itemDate <= to;
        });
      }

      // Group by salesperson
      const groupedData = {};
      
      customerEstimates.forEach(estimate => {
        const salespersonId = estimate.salesperson_id;
        if (!salespersonId) return;
        
        if (!groupedData[salespersonId]) {
          groupedData[salespersonId] = {
            salesperson_id: salespersonId,
            salesperson_name: getUserName(salespersonId),
            total_estimates: 0,
            total_amount: 0,
            estimates: []
          };
        }
        
        groupedData[salespersonId].total_estimates += 1;
        groupedData[salespersonId].total_amount += parseFloat(estimate.net_amount || 0);
      });

      const result = Object.values(groupedData).sort((a, b) => b.total_amount - a.total_amount);
      setReportData(result);
    } catch (error) {
      console.error('Error fetching salesperson-wise data:', error);
      Swal.fire('Error', 'Failed to load salesperson-wise data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Product-wise data filtered by current customer
  const fetchProductWiseData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/get/estimates`);
      const estimates = response.data || [];
      
      // Filter estimates by current customer ID
      let customerEstimates = estimates.filter(item => 
        parseInt(item.customer_id) === parseInt(currentUser.id)
      );
      
      // Apply date filter if selected
      if (dateRange.fromDate && dateRange.toDate) {
        customerEstimates = customerEstimates.filter(item => {
          const itemDate = new Date(item.date).setHours(0, 0, 0, 0);
          const from = new Date(dateRange.fromDate).setHours(0, 0, 0, 0);
          const to = new Date(dateRange.toDate).setHours(0, 0, 0, 0);
          return itemDate >= from && itemDate <= to;
        });
      }

      // Group by product
      const groupedData = {};
      
      customerEstimates.forEach(estimate => {
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
      if (activeTab === 'salesperson') {
        filteredEstimates = allEstimates.filter(est => 
          parseInt(est.salesperson_id) === parseInt(item.salesperson_id) &&
          parseInt(est.customer_id) === parseInt(currentUser.id)
        );
      } else if (activeTab === 'product') {
        filteredEstimates = allEstimates.filter(est => 
          parseInt(est.product_id) === parseInt(item.product_id) &&
          parseInt(est.customer_id) === parseInt(currentUser.id)
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
    if (activeTab === 'salesperson') {
      fetchSalesPersonWiseData();
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

    if (activeTab === 'salesperson') {
      fileName = 'my_salesperson_report.xlsx';
      worksheetData = [
        ['Sr. No.', 'SalesPerson ID', 'SalesPerson Name', 'Total Estimates', 'Total Amount (₹)'],
        ...reportData.map((item, index) => [
          index + 1,
          item.salesperson_id,
          item.salesperson_name,
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
    worksheetData.push([`Customer: ${currentUser?.name || currentUser?.full_name || 'N/A'}`]);

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
        <div className="customer-reports-loading-container">
          <div className="customer-reports-loading-spinner"></div>
          <p>Loading reports...</p>
        </div>
      );
    }

    if (reportData.length === 0) {
      return (
        <div className="customer-reports-empty-container">
          <p className="customer-reports-empty-message">No data available for selected period</p>
        </div>
      );
    }

    if (activeTab === 'salesperson') {
      return (
        <div className="customer-reports-table-responsive">
          <table className="customer-reports-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>SalesPerson ID</th>
                <th>SalesPerson Name</th>
                <th>Total Estimates</th>
                <th>Total Amount (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => (
                <tr key={item.salesperson_id}>
                  <td>{index + 1}</td>
                  <td>{item.salesperson_id}</td>
                  <td>{item.salesperson_name}</td>
                  <td>{item.total_estimates}</td>
                  <td>₹{item.total_amount.toFixed(2)}</td>
                  <td>
                    <FaEye 
                      className="customer-reports-action-icon" 
                      size={18}
                      onClick={() => handleViewDetails(item)}
                      title="View Details"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="customer-reports-table-footer">
                <td colSpan="4" className="customer-reports-text-end customer-reports-fw-bold">Grand Total:</td>
                <td className="customer-reports-fw-bold">₹{reportData.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    } else if (activeTab === 'product') {
      return (
        <div className="customer-reports-table-responsive">
          <table className="customer-reports-table">
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
                      className="customer-reports-action-icon" 
                      size={18}
                      onClick={() => handleViewDetails(item)}
                      title="View Details"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="customer-reports-table-footer">
                <td colSpan="6" className="customer-reports-text-end customer-reports-fw-bold">Grand Total:</td>
                <td className="customer-reports-fw-bold">₹{reportData.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2)}</td>
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
      <CustomerNavbar />
      <div className="customer-reports-main-container">
        <div className="customer-reports-content-container">

          {/* Header with Title and Action Buttons */}
          <Row className="customer-reports-header">
            <Col md={8}>
              <h2 className="customer-reports-title">My Reports</h2>
              <p className="customer-reports-subtitle">
                Welcome, {currentUser?.name || currentUser?.full_name || 'Customer'}! View your personalized reports
              </p>
            </Col>
            <Col md={4} className="customer-reports-actions">
              <Button 
                variant="outline-secondary" 
                className="customer-reports-action-btn"
                onClick={handlePrint}
              >
                <FaPrint /> Print
              </Button>
              
              {/* PDF Download Buttons */}
              {reportData.length > 0 && (
                <>
                  {activeTab === 'salesperson' && (
                    <PDFDownloadLink
                      document={<CustomerSalesPersonPDFDocument 
                        data={reportData} 
                        fromDate={dateRange.fromDate} 
                        toDate={dateRange.toDate}
                        customerName={currentUser?.name || currentUser?.full_name || 'Customer'}
                      />}
                      fileName="my_salesperson_report.pdf"
                    >
                      {({ loading }) => (
                        <Button 
                          variant="outline-secondary" 
                          className="customer-reports-action-btn"
                          disabled={loading}
                        >
                          <FaFilePdf /> {loading ? 'Preparing...' : 'Export PDF'}
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                  {activeTab === 'product' && (
                    <PDFDownloadLink
                      document={<CustomerProductPDFDocument 
                        data={reportData} 
                        fromDate={dateRange.fromDate} 
                        toDate={dateRange.toDate}
                        customerName={currentUser?.name || currentUser?.full_name || 'Customer'}
                      />}
                      fileName="my_product_report.pdf"
                    >
                      {({ loading }) => (
                        <Button 
                          variant="outline-secondary" 
                          className="customer-reports-action-btn"
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
                  className="customer-reports-action-btn"
                  disabled
                >
                  <FaFilePdf /> Export PDF
                </Button>
              )}
              
              <Button 
                variant="outline-secondary" 
                className="customer-reports-action-btn"
                onClick={handleDownload}
                disabled={reportData.length === 0}
              >
                <FaDownload /> Download Excel
              </Button>
            </Col>
          </Row>

          {/* Two Main Report Tabs */}
          <div className="customer-reports-tabs-container">
            <button
              className={`customer-reports-tab-btn ${activeTab === 'salesperson' ? 'active' : ''}`}
              onClick={() => setActiveTab('salesperson')}
            >
              SalesPerson-Wise
            </button>
            <button
              className={`customer-reports-tab-btn ${activeTab === 'product' ? 'active' : ''}`}
              onClick={() => setActiveTab('product')}
            >
              Product-Wise
            </button>
          </div>

          {/* Date Filter */}
          <div className="customer-reports-filter-container">
            <div className="customer-reports-filter-row">
              <div className="customer-reports-filter-group">
                <label className="customer-reports-filter-label">From Date:</label>
                <input
                  type="date"
                  className="customer-reports-date-input"
                  value={dateRange.fromDate}
                  onChange={(e) => setDateRange({...dateRange, fromDate: e.target.value})}
                />
              </div>
              <div className="customer-reports-filter-group">
                <label className="customer-reports-filter-label">To Date:</label>
                <input
                  type="date"
                  className="customer-reports-date-input"
                  value={dateRange.toDate}
                  onChange={(e) => setDateRange({...dateRange, toDate: e.target.value})}
                />
              </div>
              <div className="customer-reports-filter-group">
                <button 
                  className="customer-reports-filter-btn"
                  onClick={handleDateFilter}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="customer-reports-table-wrapper">
            {renderTable()}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="xl" className="customer-reports-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {activeTab === 'salesperson' && `SalesPerson: ${selectedItem?.salesperson_name}`}
            {activeTab === 'product' && `Product: ${selectedItem?.product_name}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsData.length > 0 ? (
            <div className="customer-reports-table-responsive">
              <table className="customer-reports-details-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Estimate No.</th>
                    <th>Order No.</th>
                    <th>SalesPerson</th>
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
                      <td>{getUserName(item.salesperson_id)}</td>
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
                        <span className={`customer-reports-status-badge customer-reports-status-${(item.estimate_status || 'Pending').toLowerCase()}`}>
                          {item.estimate_status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="customer-reports-details-footer">
                    <td colSpan={activeTab === 'product' ? 8 : 5} className="customer-reports-text-end customer-reports-fw-bold">
                      Total Amount:
                    </td>
                    <td className="customer-reports-fw-bold" colSpan="2">
                      ₹{detailsData.reduce((sum, item) => 
                        sum + parseFloat(item.net_amount || item.total_price || 0), 0
                      ).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="customer-reports-text-center customer-reports-py-3">No details available</p>
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

export default CustomerReports;