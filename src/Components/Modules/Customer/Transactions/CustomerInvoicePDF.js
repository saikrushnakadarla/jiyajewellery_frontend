import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { FaDownload, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import CustomerNavbar from '../../../Pages/Navbar/CustomerNavbar';
import InvoicePDF from '../../Admin/Transactions/InvoicePDF';
import { PDFDownloadLink } from '@react-pdf/renderer';
import baseURL from "../../ApiUrl/NodeBaseURL";

const CustomerInvoice = () => {
  const { estimateNumber } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [estimateData, setEstimateData] = useState(null);
  const [products, setProducts] = useState([]);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [error, setError] = useState(null);

  const fetchInvoiceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user from localStorage
      const userDataStr = localStorage.getItem('user');
      if (!userDataStr) {
        setError('Please login to view your invoices');
        setLoading(false);
        return;
      }

      const userData = JSON.parse(userDataStr);
      const customerId = userData?.customer_id || userData?.id || userData?.userId;

      if (!customerId) {
        setError('User data not found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('Fetching invoice for estimate:', estimateNumber);
      console.log('Customer ID:', customerId);

      const response = await axios.get(`${baseURL}/get-estimates/${estimateNumber}`);
      const data = response.data;

      console.log('Invoice data:', data);

      if (!data || !data.uniqueData) {
        setError('Invoice data not found');
        setLoading(false);
        return;
      }

      // Verify the estimate belongs to this customer
      const estimateCustomerId = data.uniqueData?.customer_id;
      if (estimateCustomerId && String(estimateCustomerId) !== String(customerId)) {
        setError('You do not have permission to view this invoice');
        setLoading(false);
        return;
      }

      setEstimateData(data.uniqueData);
      setProducts(data.repeatedData || []);
      setCustomerDetails({
        customer_name: data.uniqueData?.customer_name || userData.name || 'N/A',
        mobile: userData?.mobile || 'N/A',
        customer_id: customerId,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      if (error.response?.status === 404) {
        setError('Invoice not found');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view this invoice');
      } else {
        setError('Failed to load invoice data. Please try again.');
      }
      setLoading(false);
    }
  }, [estimateNumber]);

  useEffect(() => {
    if (estimateNumber) {
      fetchInvoiceData();
    }
  }, [estimateNumber, fetchInvoiceData]);

  if (loading) {
    return (
      <>
        <CustomerNavbar />
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading invoice...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <CustomerNavbar />
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-primary" onClick={() => navigate('/customer-transactions')}>
              <FaArrowLeft /> Back to Transactions
            </Button>
          </Alert>
        </Container>
      </>
    );
  }

  if (!estimateData) {
    return (
      <>
        <CustomerNavbar />
        <Container className="py-5">
          <Alert variant="warning">
            <p>No invoice data found</p>
            <Button variant="outline-primary" onClick={() => navigate('/customer-transactions')}>
              <FaArrowLeft /> Back to Transactions
            </Button>
          </Alert>
        </Container>
      </>
    );
  }

  const invoiceData = {
    ...estimateData,
    products: products,
    customerDetails: customerDetails,
  };

  return (
    <>
      <CustomerNavbar />
      <Container className="py-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/customer-transactions')}
          className="mb-3"
        >
          <FaArrowLeft /> Back to Transactions
        </Button>

        <Card>
          <Card.Header className="bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                Invoice: {estimateData?.order_number || estimateNumber}
              </h4>
              <PDFDownloadLink
                document={
                  <InvoicePDF 
                    estimateData={invoiceData}
                    products={products}
                    customerDetails={customerDetails}
                  />
                }
                fileName={`Invoice_${estimateData?.order_number || estimateNumber}.pdf`}
                className="btn btn-light"
              >
                {({ loading: pdfLoading, error: pdfError }) => (
                  <Button 
                    variant="light" 
                    disabled={pdfLoading}
                    className="d-flex align-items-center gap-2"
                  >
                    {pdfLoading ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <FaDownload /> Download Invoice
                      </>
                    )}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="row mb-4">
              <div className="col-md-6">
                <h5>Customer Details</h5>
                <p><strong>Name:</strong> {customerDetails?.customer_name || 'N/A'}</p>
                <p><strong>Mobile:</strong> {customerDetails?.mobile || 'N/A'}</p>
              </div>
              <div className="col-md-6 text-md-end">
                <h5>Invoice Details</h5>
                <p><strong>Invoice No:</strong> {estimateData?.order_number || estimateNumber}</p>
                <p><strong>Date:</strong> {estimateData?.order_date ? new Date(estimateData.order_date).toLocaleDateString('en-IN') : 
                                          estimateData?.date ? new Date(estimateData.date).toLocaleDateString('en-IN') : 'N/A'}</p>
                <p><strong>Status:</strong> <span className="badge bg-success">Ordered</span></p>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead className="table-dark">
                    <tr>
                      <th>S.No</th>
                      <th>Product Name</th>
                      <th>Metal Type</th>
                      <th>Purity</th>
                      <th>Gross Wt</th>
                      <th>Net Wt</th>
                      <th>Rate</th>
                      <th>Making</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.product_name || 'N/A'}</td>
                        <td>{item.metal_type || 'N/A'}</td>
                        <td>{item.purity || 'N/A'}</td>
                        <td>{item.gross_weight || 0}</td>
                        <td>{item.total_weight_av || 0}</td>
                        <td>₹{Number(item.rate || 0).toFixed(2)}</td>
                        <td>₹{Number(item.making_charges || 0).toFixed(2)}</td>
                        <td>₹{Number(item.total_price || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-info">
                      <td colSpan="8" className="text-end"><strong>Total Amount:</strong></td>
                      <td><strong>₹{Number(estimateData?.net_amount || 0).toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <Alert variant="info">No products found in this invoice.</Alert>
            )}

            <div className="row mt-3">
              <div className="col-md-6">
                <div className="card bg-light">
                  <div className="card-body">
                    <h6>Payment Summary</h6>
                    {estimateData?.discount > 0 && (
                      <p className="mb-1">Discount: ₹{Number(estimateData.discount).toFixed(2)}</p>
                    )}
                    <p className="mb-1">Tax Amount: ₹{Number(estimateData?.tax_amount || 0).toFixed(2)}</p>
                    <h6 className="mt-2">Net Payable: ₹{Number(estimateData?.net_amount || 0).toFixed(2)}</h6>
                  </div>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default CustomerInvoice;