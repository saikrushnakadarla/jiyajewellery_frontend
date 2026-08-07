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
    
    // Try to extract from message
    const message = notification.message || '';
    // Look for ASN number
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
        Swal.fire({
          icon: 'warning',
          title: 'Not Found',
          text: 'Assignment details could not be found.'
        });
      }
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load assignment details.'
      });
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
            <Row className="mb-3">
              <Col md={6}>
                <div className="p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                  <h6 className="mb-2">Assignment Details</h6>
                  <p className="mb-1"><strong>Assignment #:</strong> {transferDetails.assigned_number}</p>
                  <p className="mb-1"><strong>Date:</strong> {formatDate(transferDetails.transfer_date)}</p>
                  <p className="mb-1"><strong>From:</strong> {transferDetails.from_stock_point_name || 'Stock Room'}</p>
                  <p className="mb-1"><strong>Status:</strong> {getStatusBadge(transferDetails.salesman_status || 'pending')}</p>
                  <p className="mb-0"><strong>Total Items:</strong> {transferDetails.total_items}</p>
                </div>
              </Col>
              <Col md={6}>
                <div className="p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                  <h6 className="mb-2">Weight Summary</h6>
                  <p className="mb-1"><strong>Item Gross Total:</strong> {safeToFixed(transferDetails.item_gross_total)} g</p>
                  <p className="mb-1"><strong>Packet Gross Total:</strong> {safeToFixed(transferDetails.packet_gross_total)} g</p>
                  <p className="mb-0"><strong>Total Weight with Bag:</strong> {safeToFixed(transferDetails.total_weight_with_bag)} g</p>
                </div>
              </Col>
            </Row>

            <h6 className="mb-2">Items</h6>
            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Table bordered hover size="sm">
                <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                  <tr>
                    <th>#</th>
                    <th>Barcode</th>
                    <th>Product</th>
                    <th>Metal</th>
                    <th>Purity</th>
                    <th>Gross Wt</th>
                    <th>Net Wt</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Total Price</th>
                    <th>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((item, index) => {
                      const hasWeight = item.weight_machine_reading && parseFloat(item.weight_machine_reading) > 0;
                      return (
                        <tr key={item.item_id || index}>
                          <td>{index + 1}</td>
                          <td><Badge bg="dark">{item.PCode_BarCode}</Badge></td>
                          <td>{item.product_name || 'N/A'}</td>
                          <td>{item.metal_type || 'N/A'}</td>
                          <td>{item.purity || 'N/A'}</td>
                          <td>{safeToFixed(item.gross_weight)}</td>
                          <td>{safeToFixed(item.net_weight)}</td>
                          <td>{safeToFixed(item.qty, 0)}</td>
                          <td>{safeToFixed2(item.rate)}</td>
                          <td>{safeToFixed2(item.total_price)}</td>
                          <td>
                            {hasWeight ? (
                              <Badge bg="success" style={{ fontSize: '12px' }}>
                                ✅ {safeToFixed(item.weight_machine_reading)} g
                                <br />
                                <small style={{ fontSize: '9px', opacity: 0.8 }}>
                                  ({item.weight_machine_grams || 0}g / {item.weight_machine_milligrams || 0}mg)
                                </small>
                              </Badge>
                            ) : (
                              <Badge bg="secondary" style={{ fontSize: '12px' }}>
                                ⏳ Pending
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="11" className="text-center text-muted">No items found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Weight Captured Summary */}
            {hasWeights(items) && (
              <div className="mt-3">
                <div className="p-3 border rounded" style={{ backgroundColor: '#e8f5e9' }}>
                  <h6 className="mb-2">✅ Weight Capture Summary</h6>
                  <Row>
                    <Col md={4}>
                      <strong>Total Items:</strong> {items.length}
                    </Col>
                    <Col md={4}>
                      <strong>Weights Captured:</strong> {items.filter(item => item.weight_machine_reading > 0).length} / {items.length}
                    </Col>
                    <Col md={4}>
                      <strong>Total Captured Weight:</strong> {
                        items.reduce((sum, item) => sum + (parseFloat(item.weight_machine_reading) || 0), 0).toFixed(3)
                      } g
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