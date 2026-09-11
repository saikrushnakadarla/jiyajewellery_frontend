import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Badge, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';
import baseURL from '../../Modules/ApiUrl/NodeBaseURL2';
import Swal from 'sweetalert2';

const SalesmanNotificationModal = ({ show, onHide, notification, onActionComplete }) => {
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Helper function to safely format numbers
  const safeToFixed = (value, decimals = 3) => {
    if (value === undefined || value === null) return '0.000';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0.000';
    return num.toFixed(decimals);
  };

  const safeToFixed2 = (value) => safeToFixed(value, 2);

  const extractTransferId = () => {
    if (!notification) return null;
    
    // If related_id exists, use it directly
    if (notification.related_id) return notification.related_id;
    
    // Check if this is a warehouse visit notification (no ASN number)
    const message = notification.message || '';
    const title = notification.title || '';
    
    // If it's a warehouse visit notification, return null
    if (title.includes('Warehouse Visit Assignment') || 
        message.includes('assigned to visit') && message.includes('item(s)')) {
      return null;
    }
    
    // Try to extract from message
    const asnMatch = message.match(/#(ASN\d+)/);
    if (asnMatch) {
      return asnMatch[1];
    }
    
    // If it's an assignment notification with _assignmentData
    if (notification._assignmentData && notification._assignmentData.assigned_id) {
      return notification._assignmentData.assigned_id;
    }
    
    return null;
  };

  useEffect(() => {
    if (show && notification) {
      fetchAssignmentDetails();
    }
  }, [show, notification]);

  const fetchAssignmentDetails = async () => {
    const transferId = extractTransferId();
    if (!transferId) {
      setLoading(false);
      setAssignmentDetails(null);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/api/assigned-salesman/get-assigned-transfers`);
      const transfers = response.data || [];
      
      const matchedTransfer = transfers.find(t => 
        t.assigned_number === transferId || 
        t.assigned_id === parseInt(transferId)
      );
      
      if (matchedTransfer) {
        const detailResponse = await axios.get(
          `${baseURL}/api/assigned-salesman/get-assigned-transfer/${matchedTransfer.assigned_id}`
        );
        setAssignmentDetails(detailResponse.data);
      } else {
        setAssignmentDetails(null);
      }
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      setAssignmentDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!assignmentDetails || !assignmentDetails.transfer_details) return;
    
    setProcessing(true);
    try {
      const transferId = assignmentDetails.transfer_details.assigned_id;
      
      const response = await axios.put(
        `${baseURL}/api/assigned-salesman/update-salesman-status/${transferId}`,
        { status: 'accepted' }
      );
      
      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Accepted!',
          text: `You have accepted the assignment #${assignmentDetails.transfer_details.assigned_number}`,
          timer: 2000,
          showConfirmButton: false
        });
        
        onHide();
        if (onActionComplete) onActionComplete('accepted');
      }
    } catch (error) {
      console.error('Error accepting assignment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to accept assignment. Please try again.'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!assignmentDetails || !assignmentDetails.transfer_details) return;
    
    const confirmResult = await Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to reject this assignment. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, reject it!'
    });

    if (!confirmResult.isConfirmed) return;
    
    setProcessing(true);
    try {
      const transferId = assignmentDetails.transfer_details.assigned_id;
      
      const response = await axios.put(
        `${baseURL}/api/assigned-salesman/update-salesman-status/${transferId}`,
        { status: 'rejected' }
      );
      
      if (response.status === 200) {
        Swal.fire({
          icon: 'info',
          title: 'Rejected',
          text: `You have rejected the assignment #${assignmentDetails.transfer_details.assigned_number}`,
          timer: 2000,
          showConfirmButton: false
        });
        
        onHide();
        if (onActionComplete) onActionComplete('rejected');
      }
    } catch (error) {
      console.error('Error rejecting assignment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to reject assignment. Please try again.'
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge bg="success">Accepted</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge bg="warning" style={{ color: '#000' }}>Pending</Badge>;
    }
  };

  // Check if any item has weight captured
  const hasWeights = (items) => {
    return items.some(item => 
      item.weight_machine_reading && 
      parseFloat(item.weight_machine_reading) > 0
    );
  };

  const transferDetails = assignmentDetails?.transfer_details;
  const items = assignmentDetails?.transfer_items || [];

  // Calculate total weight from items
  const calculatedTotalWeight = items.reduce((sum, item) => sum + (parseFloat(item.weight_machine_reading) || 0), 0).toFixed(3);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <span style={{ marginRight: '10px' }}>📦</span>
          Assignment Review
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading assignment details...</p>
          </div>
        ) : assignmentDetails && transferDetails ? (
          <>
            <Row className="mb-3 align-items-stretch">
                <Col md={6}>
                  <div className="p-3 border rounded h-100" style={{ backgroundColor: '#f8f9fa' }}>
                    <h6 className="mb-2">Assignment Details</h6>
                    <p className="mb-1"><strong>Assignment #:</strong> {transferDetails.assigned_number}</p>
                    <p className="mb-1"><strong>Date:</strong> {formatDate(transferDetails.transfer_date)}</p>
                    <p className="mb-1"><strong>From:</strong> {transferDetails.from_stock_point_name || 'Stock Room'}</p>
                    <p className="mb-1"><strong>Status:</strong> {getStatusBadge(transferDetails.salesman_status || 'pending')}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="p-3 border rounded h-100" style={{ backgroundColor: '#f8f9fa' }}>
                    <h6 className="mb-2">Weight Summary</h6>
                     <p className="mb-0"><strong>Total Items:</strong> {transferDetails.total_items}</p>
                    <p className="mb-1"><strong>Item Gross Total:</strong> {safeToFixed(transferDetails.item_gross_total)} g</p>
                    <p className="mb-1"><strong>Packet Gross Total:</strong> {safeToFixed(transferDetails.packet_gross_total)} g</p>
                    <p className="mb-0"><strong>Total Weight with Bag:</strong> {safeToFixed(transferDetails.total_weight_with_bag)} g</p>
                  </div>
                </Col>
              </Row>

            {/* Weight Captured Summary */}
            {hasWeights(items) && (
              <div className="mt-3">
                <div className="p-3 border rounded" style={{ backgroundColor: '#e8f5e9' }}>
                  <h6 className="mb-2">✅ Weight Capture Summary</h6>
                  <Row className="align-items-center justify-content-between">
                    <Col xs={12} md={3} className="mb-2 mb-md-0">
                      <strong>Total Items:</strong> {items.length}
                    </Col>
                    <Col xs={12} md={4} className="mb-2 mb-md-0">
                      <strong>Weights Captured:</strong> {items.filter(item => item.weight_machine_reading > 0).length} / {items.length}
                    </Col>
                    <Col xs={12} md="auto" className="d-flex align-items-center gap-1" style={{ whiteSpace: 'nowrap' }}>
                      <strong>Total Captured Weight:</strong> {safeToFixed(transferDetails.total_weight_with_bag)} g
                    </Col>
                  </Row>
                </div>
              </div>
            )}

            {transferDetails.remarks && (
              <div className="mt-2">
                <strong>Remarks:</strong> {transferDetails.remarks}
              </div>
            )}

            {transferDetails.salesman_status === 'pending' && (
              <div className="mt-3 d-flex gap-2">
                <Button 
                  variant="success" 
                  onClick={handleAccept}
                  disabled={processing}
                  style={{ flex: 1 }}
                >
                  {processing ? <Spinner as="span" animation="border" size="sm" /> : '✅ Accept'}
                </Button>
                <Button 
                  variant="danger" 
                  onClick={handleReject}
                  disabled={processing}
                  style={{ flex: 1 }}
                >
                  {processing ? <Spinner as="span" animation="border" size="sm" /> : '❌ Reject'}
                </Button>
              </div>
            )}

            {transferDetails.salesman_status === 'accepted' && (
              <div className="mt-3 alert alert-success">
                ✅ You have accepted this assignment.
              </div>
            )}

            {transferDetails.salesman_status === 'rejected' && (
              <div className="mt-3 alert alert-danger">
                ❌ You have rejected this assignment.
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted">No assignment details found.</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SalesmanNotificationModal;