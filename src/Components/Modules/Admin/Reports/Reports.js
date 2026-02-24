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
import Navbar from '../../../Pages/Navbar/Navbar';
import './Reports.css';

// PDF Styles - Using standard fonts instead of custom font registration
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

// PDF Document Component for SalesPerson Report
const SalesPersonPDFDocument = ({ data, fromDate, toDate }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.companyName}>JIYAA JEWELS</Text>
        <Text style={pdfStyles.title}>SalesPerson-Wise Report</Text>
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

// PDF Document Component for Customer Report
const CustomerPDFDocument = ({ data, fromDate, toDate }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.companyName}>JIYAA JEWELS</Text>
        <Text style={pdfStyles.title}>Customer-Wise Report</Text>
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

// PDF Document Component for Product Report
const ProductPDFDocument = ({ data, fromDate, toDate }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.companyName}>JIYAA JEWELS</Text>
        <Text style={pdfStyles.title}>Product-Wise Report</Text>
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

const Reports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('salesperson');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsData, setDetailsData] = useState([]);
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchProducts();
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'salesperson') {
      fetchSalesPersonWiseData();
    } else if (activeTab === 'customer') {
      fetchCustomerWiseData();
    } else if (activeTab === 'product') {
      fetchProductWiseData();
    }
  }, [activeTab]);

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
      const response = await axios.get(`${baseURL}/api/products`);
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
    const product = products.find(p => p.id === parseInt(productId));
    return product ? product.product_name : `ID: ${productId}`;
  };

  // Fetch SalesPerson-wise data
  const fetchSalesPersonWiseData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/get-unique-estimates`);
      const estimates = response.data || [];
      
      let filteredEstimates = estimates;
      if (dateRange.fromDate && dateRange.toDate) {
        filteredEstimates = estimates.filter(item => {
          const itemDate = new Date(item.date).setHours(0, 0, 0, 0);
          const from = new Date(dateRange.fromDate).setHours(0, 0, 0, 0);
          const to = new Date(dateRange.toDate).setHours(0, 0, 0, 0);
          return itemDate >= from && itemDate <= to;
        });
      }

      const groupedData = {};
      
      filteredEstimates.forEach(estimate => {
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

  // Fetch Customer-wise data
  const fetchCustomerWiseData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/get-unique-estimates`);
      const estimates = response.data || [];
      
      let filteredEstimates = estimates;
      if (dateRange.fromDate && dateRange.toDate) {
        filteredEstimates = estimates.filter(item => {
          const itemDate = new Date(item.date).setHours(0, 0, 0, 0);
          const from = new Date(dateRange.fromDate).setHours(0, 0, 0, 0);
          const to = new Date(dateRange.toDate).setHours(0, 0, 0, 0);
          return itemDate >= from && itemDate <= to;
        });
      }

      const groupedData = {};
      
      filteredEstimates.forEach(estimate => {
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

  // Fetch Product-wise data
  const fetchProductWiseData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/get/estimates`);
      const estimates = response.data || [];
      
      let filteredEstimates = estimates;
      if (dateRange.fromDate && dateRange.toDate) {
        filteredEstimates = estimates.filter(item => {
          const itemDate = new Date(item.date).setHours(0, 0, 0, 0);
          const from = new Date(dateRange.fromDate).setHours(0, 0, 0, 0);
          const to = new Date(dateRange.toDate).setHours(0, 0, 0, 0);
          return itemDate >= from && itemDate <= to;
        });
      }

      const groupedData = {};
      
      filteredEstimates.forEach(estimate => {
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
    setSelectedItem(item);
    
    try {
      const response = await axios.get(`${baseURL}/get/estimates`);
      const allEstimates = response.data || [];
      
      let filteredEstimates = [];
      if (activeTab === 'salesperson') {
        filteredEstimates = allEstimates.filter(est => est.salesperson_id === item.salesperson_id);
      } else if (activeTab === 'customer') {
        filteredEstimates = allEstimates.filter(est => est.customer_id === item.customer_id);
      } else if (activeTab === 'product') {
        filteredEstimates = allEstimates.filter(est => est.product_id === item.product_id);
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
    } else if (activeTab === 'customer') {
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

  // Handle actions
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
      fileName = 'salesperson_report.xlsx';
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
    } else if (activeTab === 'customer') {
      fileName = 'customer_report.xlsx';
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
      fileName = 'product_report.xlsx';
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
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    if (reportData.length === 0) {
      return (
        <div className="text-center py-5">
          <p className="text-muted">No data available for selected period</p>
        </div>
      );
    }

    if (activeTab === 'salesperson') {
      return (
        <div className="table-responsive">
          <table className="table table-hover reports-table">
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
                      className="action-icon" 
                      size={18}
                      onClick={() => handleViewDetails(item)}
                      title="View Details"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-info">
                <td colSpan="4" className="text-end fw-bold">Grand Total:</td>
                <td className="fw-bold">₹{reportData.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    } else if (activeTab === 'customer') {
      return (
        <div className="table-responsive">
          <table className="table table-hover reports-table">
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
                      className="action-icon" 
                      size={18}
                      onClick={() => handleViewDetails(item)}
                      title="View Details"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-info">
                <td colSpan="4" className="text-end fw-bold">Grand Total:</td>
                <td className="fw-bold">₹{reportData.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    } else if (activeTab === 'product') {
      return (
        <div className="table-responsive">
          <table className="table table-hover reports-table">
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
                      className="action-icon" 
                      size={18}
                      onClick={() => handleViewDetails(item)}
                      title="View Details"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-info">
                <td colSpan="6" className="text-end fw-bold">Grand Total:</td>
                <td className="fw-bold">₹{reportData.reduce((sum, item) => sum + item.total_amount, 0).toFixed(2)}</td>
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
      <Navbar />
      <div className="reports-main-container">
        <div className="reports-content-container">

          {/* Header with Title and Action Buttons */}
          <Row className="reports-header">
            <Col md={8}>
              <h2 className="reports-title">Reports</h2>
              <p className="reports-subtitle">View and analyze your business reports</p>
            </Col>
            <Col md={4} className="reports-actions">
              <Button 
                variant="outline-secondary" 
                className="reports-action-btn"
                onClick={handlePrint}
              >
                <FaPrint /> Print
              </Button>
              
              {/* PDF Download Buttons - Always visible when data exists */}
              {reportData.length > 0 && (
                <>
                  {activeTab === 'salesperson' && (
                    <PDFDownloadLink
                      document={<SalesPersonPDFDocument data={reportData} fromDate={dateRange.fromDate} toDate={dateRange.toDate} />}
                      fileName="salesperson_report.pdf"
                    >
                      {({ loading }) => (
                        <Button 
                          variant="outline-secondary" 
                          className="reports-action-btn"
                          disabled={loading}
                        >
                          <FaFilePdf /> {loading ? 'Preparing...' : 'Export PDF'}
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                  {activeTab === 'customer' && (
                    <PDFDownloadLink
                      document={<CustomerPDFDocument data={reportData} fromDate={dateRange.fromDate} toDate={dateRange.toDate} />}
                      fileName="customer_report.pdf"
                    >
                      {({ loading }) => (
                        <Button 
                          variant="outline-secondary" 
                          className="reports-action-btn"
                          disabled={loading}
                        >
                          <FaFilePdf /> {loading ? 'Preparing...' : 'Export PDF'}
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                  {activeTab === 'product' && (
                    <PDFDownloadLink
                      document={<ProductPDFDocument data={reportData} fromDate={dateRange.fromDate} toDate={dateRange.toDate} />}
                      fileName="product_report.pdf"
                    >
                      {({ loading }) => (
                        <Button 
                          variant="outline-secondary" 
                          className="reports-action-btn"
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
                  className="reports-action-btn"
                  disabled
                >
                  <FaFilePdf /> Export PDF
                </Button>
              )}
              
              <Button 
                variant="outline-secondary" 
                className="reports-action-btn"
                onClick={handleDownload}
                disabled={reportData.length === 0}
              >
                <FaDownload /> Download Excel
              </Button>
            </Col>
          </Row>

          {/* Three Main Report Tabs */}
          <div className="report-tabs-container">
            <button
              className={`report-tab-btn ${activeTab === 'salesperson' ? 'active' : ''}`}
              onClick={() => setActiveTab('salesperson')}
            >
              SalesPerson-Wise
            </button>
            <button
              className={`report-tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
              onClick={() => setActiveTab('customer')}
            >
              Customer-Wise
            </button>
            <button
              className={`report-tab-btn ${activeTab === 'product' ? 'active' : ''}`}
              onClick={() => setActiveTab('product')}
            >
              Product-Wise
            </button>
          </div>

          {/* Date Filter */}
          <div className="reports-filter-container">
            <div className="row align-items-center">
              <div className="col-auto">
                <label className="reports-filter-label">From Date:</label>
              </div>
              <div className="col-auto">
                <input
                  type="date"
                  className="form-control reports-date-input"
                  value={dateRange.fromDate}
                  onChange={(e) => setDateRange({...dateRange, fromDate: e.target.value})}
                />
              </div>
              <div className="col-auto">
                <label className="reports-filter-label">To Date:</label>
              </div>
              <div className="col-auto">
                <input
                  type="date"
                  className="form-control reports-date-input"
                  value={dateRange.toDate}
                  onChange={(e) => setDateRange({...dateRange, toDate: e.target.value})}
                />
              </div>
              <div className="col-auto">
                <button 
                  className="btn reports-filter-btn"
                  onClick={handleDateFilter}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="reports-table-wrapper">
            {renderTable()}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="xl" className="reports-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {activeTab === 'salesperson' && `SalesPerson: ${selectedItem?.salesperson_name}`}
            {activeTab === 'customer' && `Customer: ${selectedItem?.customer_name}`}
            {activeTab === 'product' && `Product: ${selectedItem?.product_name}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsData.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered reports-details-table">
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
                        <span className={`status-badge status-${(item.estimate_status || 'Pending').toLowerCase()}`}>
                          {item.estimate_status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={activeTab === 'product' ? 8 : 5} className="text-end fw-bold">
                      Total Amount:
                    </td>
                    <td className="fw-bold" colSpan="2">
                      ₹{detailsData.reduce((sum, item) => 
                        sum + parseFloat(item.net_amount || item.total_price || 0), 0
                      ).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-center py-3">No details available</p>
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

export default Reports;