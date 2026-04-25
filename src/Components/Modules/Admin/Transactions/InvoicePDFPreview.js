// Admin/src/components/Admin/Transactions/InvoicePDFPreview.js

import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { PDFViewer } from '@react-pdf/renderer';
import axios from 'axios';
import InvoicePDF from './InvoicePDF';
import baseURL from "../../ApiUrl/NodeBaseURL";

const InvoicePreviewModal = ({ show, onHide, estimateNumber, isAdmin = false }) => {
  const [loading, setLoading] = useState(false);
  const [estimateData, setEstimateData] = useState(null);
  const [products, setProducts] = useState([]);
  const [customerDetails, setCustomerDetails] = useState(null);

  useEffect(() => {
    if (show && estimateNumber) {
      fetchEstimateData();
    }
  }, [show, estimateNumber]);

  const fetchEstimateData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/get-estimates/${estimateNumber}`);
      const data = response.data;

      setEstimateData(data.uniqueData);
      setProducts(data.repeatedData || []);
      setCustomerDetails({
        customer_name: data.uniqueData?.customer_name,
        mobile: data.uniqueData?.mobile,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching estimate data:', error);
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(
        <InvoicePDF 
          estimateData={estimateData} 
          products={products} 
          customerDetails={customerDetails} 
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${estimateData?.order_number || estimateNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" className="invoice-preview-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          Invoice Preview - {estimateData?.order_number || estimateNumber}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ height: '80vh', padding: 0 }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : estimateData && products.length > 0 ? (
          <PDFViewer width="100%" height="100%" showToolbar={true}>
            <InvoicePDF 
              estimateData={estimateData}
              products={products}
              customerDetails={customerDetails}
            />
          </PDFViewer>
        ) : (
          <div className="text-center py-5">
            <p>No data available for this invoice</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {/* Only Download and Close buttons - No "Save & Generate Order" button */}
        {isAdmin && (
          <Button variant="success" onClick={handleDownload}>
            Download PDF
          </Button>
        )}
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InvoicePreviewModal;