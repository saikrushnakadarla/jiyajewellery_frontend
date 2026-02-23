import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import baseURL from '../../ApiUrl/NodeBaseURL';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../Pages/Navbar/SalesNavbar';
import { FaEdit, FaTrash, FaEye, FaClock, FaCheckCircle, FaEnvelope, FaUserCheck, FaCalendarCheck } from 'react-icons/fa';
import './VisitLogs.css';

const VisitLogsForm = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const user = getUserData();
  const salespersonId = user?.id ? String(user.id) : '';
  const sourceBy = user?.role || '';

  // State for customers
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');

  // State for form
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    visit_date: today,
    outcome: 'Follow Up',
    notes: '',
    otp: ''
  });

  // State for OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSending, setOtpSending] = useState(false);

  // State for visit logs list
  const [visitLogs, setVisitLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [loading, setLoading] = useState(false);

  // State for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [editOutcome, setEditOutcome] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // State for view modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingLog, setViewingLog] = useState(null);

  // State for statistics
  const [statistics, setStatistics] = useState({
    total_visits: 0,
    interested_count: 0,
    not_interested_count: 0,
    follow_up_count: 0,
    converted_count: 0,
    other_count: 0,
    unique_customers: 0
  });

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
    fetchVisitLogs();
    fetchStatistics();
  }, []);

  // OTP Timer effect - FIXED: Stop timer when OTP is verified
  useEffect(() => {
    let interval;
    // Only run timer if OTP is sent AND not verified AND timer > 0
    if (otpSent && !otpVerified && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && otpSent && !otpVerified) {
      // Only expire if not verified
      setOtpSent(false);
      setGeneratedOtp('');
      setOtpMessage('OTP expired. Please request a new one.');
    }
    return () => clearInterval(interval);
  }, [otpTimer, otpSent, otpVerified]); // Added otpVerified dependency

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/visit-logs/customers`);
      console.log('Fetched customers:', response.data);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to fetch customers: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch visit logs for this salesperson
  const fetchVisitLogs = async () => {
    try {
      const response = await axios.get(`${baseURL}/visit-logs/salesperson/${salespersonId}`);
      setVisitLogs(response.data);
    } catch (error) {
      console.error('Error fetching visit logs:', error);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${baseURL}/visit-logs/statistics/${salespersonId}`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Handle customer selection
  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    console.log('Selected customer ID:', customerId);
    
    const customer = customers.find(c => c.id.toString() === customerId);
    console.log('Found customer:', customer);

    if (customer) {
      setSelectedCustomer(customer);
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: customer.full_name
      }));
      setCustomerEmail(customer.email || ''); // email comes from backend as 'email' alias
    } else {
      setSelectedCustomer(null);
      setFormData(prev => ({
        ...prev,
        customer_id: '',
        customer_name: ''
      }));
      setCustomerEmail('');
    }

    // Reset OTP state when customer changes
    setOtpSent(false);
    setOtpVerified(false);
    setGeneratedOtp('');
    setOtpTimer(0);
    setOtpMessage('');
    setOtpError('');
    setFormData(prev => ({ ...prev, otp: '' }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Send OTP to customer
  const handleSendOTP = async () => {
    if (!selectedCustomer) {
      setOtpError('Please select a customer first');
      return;
    }

    if (!customerEmail) {
      setOtpError('Customer email not found');
      return;
    }

    try {
      setOtpError('');
      setOtpMessage('Sending OTP...');
      setOtpSending(true);

      const response = await axios.post(`${baseURL}/visit-logs/send-otp`, {
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.full_name,
        email: customerEmail
      });

      if (response.data.success) {
        setOtpSent(true);
        setOtpVerified(false); // Ensure verified is false
        setGeneratedOtp(response.data.otp); // For testing only - remove in production
        setOtpTimer(600); // 10 minutes in seconds
        setOtpMessage(`✅ OTP sent to ${customerEmail}`);
        setFormData(prev => ({ ...prev, otp: '' })); // Clear OTP input
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOtpError('❌ Failed to send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = () => {
    if (!formData.otp) {
      setOtpError('Please enter OTP');
      return;
    }

    if (formData.otp.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    // In production, you should verify OTP on backend
    // For now, we'll verify locally (remove in production)
    if (formData.otp === generatedOtp) {
      setOtpVerified(true);
      setOtpMessage('✅ OTP verified successfully!');
      setOtpError('');
      // Timer will stop automatically due to otpVerified being true in useEffect
    } else {
      setOtpError('❌ Invalid OTP. Please try again.');
    }
  };

  // Log visit (save to database)
  const handleLogVisit = async () => {
    // Validate form
    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }

    if (!otpVerified) {
      alert('Please verify OTP first');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${baseURL}/visit-logs/save-visit-log`, {
        ...formData,
        salesperson_id: salespersonId,
        source_by: sourceBy
      });

      if (response.data.success) {
        alert('✅ Visit logged successfully!');

        // Reset form
        setFormData({
          customer_id: '',
          customer_name: '',
          visit_date: today,
          outcome: 'Follow Up',
          notes: '',
          otp: ''
        });
        setSelectedCustomer(null);
        setCustomerEmail('');
        setOtpSent(false);
        setOtpVerified(false);
        setGeneratedOtp('');
        setOtpTimer(0);
        setOtpMessage('');
        setOtpError('');

        // Refresh logs and statistics
        fetchVisitLogs();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error logging visit:', error);
      alert('❌ Failed to log visit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (log) => {
    setEditingLog(log);
    setEditOutcome(log.outcome);
    setEditNotes(log.notes || '');
    setShowEditModal(true);
  };

  // Update visit log
  const handleUpdate = async () => {
    try {
      const response = await axios.put(`${baseURL}/visit-logs/update/${editingLog.visit_id}`, {
        outcome: editOutcome,
        notes: editNotes
      });

      if (response.data.success) {
        alert('✅ Visit log updated successfully');
        setShowEditModal(false);
        fetchVisitLogs();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error updating visit log:', error);
      alert('❌ Failed to update visit log');
    }
  };

  // Handle delete
  const handleDelete = async (visit_id) => {
    if (window.confirm('Are you sure you want to delete this visit log?')) {
      try {
        const response = await axios.delete(`${baseURL}/visit-logs/delete/${visit_id}`);

        if (response.data.success) {
          alert('✅ Visit log deleted successfully');
          fetchVisitLogs();
          fetchStatistics();
        }
      } catch (error) {
        console.error('Error deleting visit log:', error);
        alert('❌ Failed to delete visit log');
      }
    }
  };

  // View details
  const handleView = (log) => {
    setViewingLog(log);
    setShowViewModal(true);
  };

  // Format timer
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Outcome options
  const outcomeOptions = [
    { value: 'Interested', label: 'Interested', color: 'success', icon: '👍' },
    { value: 'Not Interested', label: 'Not Interested', color: 'danger', icon: '👎' },
    { value: 'Follow Up', label: 'Follow Up', color: 'warning', icon: '🔄' },
    { value: 'Converted', label: 'Converted', color: 'primary', icon: '💰' },
    { value: 'Other', label: 'Other', color: 'secondary', icon: '📝' }
  ];

  return (
    <>
      <Navbar />
      <div className="vl-main-container" style={{ marginTop: '60px' }}>
        <Container className="vl-container">
          {/* Header Card - NEW */}
          <Row className="vl-header-card-row mb-4">
            <Col md={12}>
              <div className="vl-header-card">
                <div className="vl-header-card-content">
                  <div className="vl-header-icon-wrapper">
                    <FaCalendarCheck className="vl-header-icon" />
                  </div>
                  <div className="vl-header-text-wrapper">
                    <h1 className="vl-header-title">Visit Logs Management</h1>
                    <p className="vl-header-subtitle">Track, manage and analyze all customer visits in one place</p>
                  </div>
                </div>
                <div className="vl-header-stats">
                  <div className="vl-header-stat-item">
                    <span className="vl-header-stat-label">Today's Date</span>
                    <span className="vl-header-stat-value">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="vl-header-stat-item">
                    <span className="vl-header-stat-label">Salesperson</span>
                    <span className="vl-header-stat-value">{user?.full_name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Statistics Cards */}
          <Row className="vl-stats-row mb-4">
            <Col lg={2} md={4} sm={6} xs={12} className="vl-stat-col">
              <div className="vl-stat-card vl-stat-total">
                <div className="vl-stat-icon">📊</div>
                <div className="vl-stat-content">
                  <h6>Total Visits</h6>
                  <h3>{statistics.total_visits}</h3>
                </div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={12} className="vl-stat-col">
              <div className="vl-stat-card vl-stat-interested">
                <div className="vl-stat-icon">👍</div>
                <div className="vl-stat-content">
                  <h6>Interested</h6>
                  <h3>{statistics.interested_count}</h3>
                </div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={12} className="vl-stat-col">
              <div className="vl-stat-card vl-stat-not-interested">
                <div className="vl-stat-icon">👎</div>
                <div className="vl-stat-content">
                  <h6>Not Interested</h6>
                  <h3>{statistics.not_interested_count}</h3>
                </div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={12} className="vl-stat-col">
              <div className="vl-stat-card vl-stat-followup">
                <div className="vl-stat-icon">🔄</div>
                <div className="vl-stat-content">
                  <h6>Follow Up</h6>
                  <h3>{statistics.follow_up_count}</h3>
                </div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={12} className="vl-stat-col">
              <div className="vl-stat-card vl-stat-converted">
                <div className="vl-stat-icon">💰</div>
                <div className="vl-stat-content">
                  <h6>Converted</h6>
                  <h3>{statistics.converted_count}</h3>
                </div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={12} className="vl-stat-col">
              <div className="vl-stat-card vl-stat-unique">
                <div className="vl-stat-icon">👥</div>
                <div className="vl-stat-content">
                  <h6>Unique Customers</h6>
                  <h3>{statistics.unique_customers}</h3>
                </div>
              </div>
            </Col>
          </Row>

          {/* Visit Log Form */}
          <Row className="vl-form-section">
            <Col className="vl-form-header">
              <h4 className="vl-form-title">
                <span className="vl-form-title-icon">📝</span> Log New Visit
              </h4>
            </Col>

            <Col md={12} className="vl-form-row">
              <Row>
                <Col lg={4} md={6} className="vl-form-group-col">
                  <Form.Group className="vl-form-group">
                    <Form.Label className="vl-label">
                      Customer Name <span className="vl-required">*</span>
                    </Form.Label>
                    <Form.Select
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleCustomerChange}
                      className="vl-select"
                    >
                      <option value="">-- Select Customer --</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.full_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col lg={2} md={6} className="vl-form-group-col">
                  <Form.Group className="vl-form-group">
                    <Form.Label className="vl-label">
                      Visit Date <span className="vl-required">*</span>
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="visit_date"
                      value={formData.visit_date}
                      onChange={handleInputChange}
                      max={today}
                      className="vl-date-input"
                    />
                  </Form.Group>
                </Col>

                <Col lg={3} md={6} className="vl-form-group-col">
                  <Form.Group className="vl-form-group">
                    <Form.Label className="vl-label">
                      Outcome <span className="vl-required">*</span>
                    </Form.Label>
                    <Form.Select
                      name="outcome"
                      value={formData.outcome}
                      onChange={handleInputChange}
                      className="vl-select"
                    >
                      {outcomeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col lg={3} md={6} className="vl-form-group-col">
                  <Form.Group className="vl-form-group">
                    <Form.Label className="vl-label">Notes</Form.Label>
                    <Form.Control
                      type="text"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Add notes..."
                      className="vl-input"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Col>

            {/* OTP Section */}
            {selectedCustomer && (
              <Col md={12} className="vl-otp-section">
                <Row className="vl-otp-row">
                  <Col lg={4} md={12} className="vl-otp-email-col">
                    <div className="vl-otp-email-display">
                      <FaEnvelope className="vl-email-icon" />
                      <span className="vl-email-text">{customerEmail}</span>
                    </div>
                  </Col>

                  <Col lg={2} md={4} className="vl-otp-button-col">
                    <Button
                      variant="warning"
                      onClick={handleSendOTP}
                      disabled={otpSent || otpVerified || !customerEmail || otpSending}
                      className="vl-otp-send-btn"
                    >
                      {otpSending ? 'Sending...' : otpSent ? (
                        <>
                          <FaClock /> Resend ({formatTimer(otpTimer)})
                        </>
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  </Col>

                  {otpSent && !otpVerified && (
                    <>
                      <Col lg={4} md={5} className="vl-otp-input-col">
                        <Form.Group className="vl-otp-input-group">
                          <Form.Control
                            type="text"
                            name="otp"
                            value={formData.otp}
                            onChange={handleInputChange}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            className="vl-otp-input"
                          />
                        </Form.Group>
                      </Col>

                      <Col lg={2} md={3} className="vl-otp-verify-col">
                        <Button
                          variant="success"
                          onClick={handleVerifyOTP}
                          className="vl-otp-verify-btn"
                          disabled={!formData.otp || formData.otp.length !== 6}
                        >
                          <FaCheckCircle /> Verify
                        </Button>
                      </Col>
                    </>
                  )}
                </Row>

                {/* OTP Messages */}
                {otpMessage && (
                  <Alert variant={otpVerified ? "success" : "info"} className="vl-otp-message">
                    {otpMessage}
                  </Alert>
                )}

                {otpError && (
                  <Alert variant="danger" className="vl-otp-error">
                    {otpError}
                  </Alert>
                )}

                {otpVerified && (
                  <Alert variant="success" className="vl-otp-success">
                    <FaCheckCircle className="vl-success-icon" /> OTP Verified Successfully! You can now log the visit.
                  </Alert>
                )}
              </Col>
            )}

            {/* Action Buttons */}
            <Col md={12} className="vl-action-buttons">
              <Button
                variant="primary"
                onClick={handleLogVisit}
                disabled={!otpVerified || loading}
                className="vl-log-btn"
              >
                {loading ? 'Logging...' : '📝 Log Visit'}
              </Button>

              <Button
                variant="outline-secondary"
                onClick={() => setShowLogs(!showLogs)}
                className="vl-toggle-logs-btn"
              >
                {showLogs ? '📋 Hide Logs' : '📋 View Logs'}
              </Button>
            </Col>
          </Row>

          {/* Visit Logs Table */}
          {showLogs && (
            <Row className="vl-table-section mt-4">
              <Col className="vl-table-header">
                <h4 className="vl-table-title">
                  <span className="vl-table-icon">📋</span> Recent Visit Logs
                </h4>
              </Col>
              <Col md={12} className="vl-table-container">
                <Table bordered hover responsive className="vl-table">
                  <thead className="vl-table-head">
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Outcome</th>
                      <th>Notes</th>
                      <th>OTP Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && !visitLogs.length ? (
                      <tr>
                        <td colSpan="7" className="vl-loading-cell">Loading...</td>
                      </tr>
                    ) : visitLogs.length > 0 ? (
                      visitLogs.map((log, index) => {
                        const outcomeOption = outcomeOptions.find(o => o.value === log.outcome);
                        return (
                          <tr key={log.visit_id} className="vl-table-row">
                            <td>{index + 1}</td>
                            <td>{new Date(log.visit_date).toLocaleDateString()}</td>
                            <td className="vl-customer-name">{log.customer_name}</td>
                            <td>
                              <span className={`vl-badge vl-badge-${outcomeOption?.color || 'secondary'}`}>
                                {outcomeOption?.icon} {log.outcome}
                              </span>
                            </td>
                            <td className="vl-notes-cell">{log.notes || '-'}</td>
                            <td>
                              {log.otp_verified ? (
                                <span className="vl-status-verified">
                                  <FaCheckCircle /> Verified
                                </span>
                              ) : (
                                <span className="vl-status-unverified">
                                  ✗ Not Verified
                                </span>
                              )}
                            </td>
                            <td className="vl-actions-cell">
                              <FaEye
                                className="vl-action-icon vl-view-icon"
                                onClick={() => handleView(log)}
                                title="View Details"
                              />
                              <FaEdit
                                className="vl-action-icon vl-edit-icon"
                                onClick={() => handleEdit(log)}
                                title="Edit"
                              />
                              <FaTrash
                                className="vl-action-icon vl-delete-icon"
                                onClick={() => handleDelete(log.visit_id)}
                                title="Delete"
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="vl-empty-cell">No visit logs found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Col>
            </Row>
          )}
        </Container>
      </div>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered className="vl-modal">
        <Modal.Header closeButton className="vl-modal-header">
          <Modal.Title className="vl-modal-title">
            <FaEdit className="vl-modal-icon" /> Edit Visit Log
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="vl-modal-body">
          <Form.Group className="vl-modal-form-group">
            <Form.Label className="vl-modal-label">Outcome</Form.Label>
            <Form.Select
              value={editOutcome}
              onChange={(e) => setEditOutcome(e.target.value)}
              className="vl-modal-select"
            >
              {outcomeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="vl-modal-form-group">
            <Form.Label className="vl-modal-label">Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="vl-modal-textarea"
              placeholder="Enter notes..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="vl-modal-footer">
          <Button variant="secondary" onClick={() => setShowEditModal(false)} className="vl-modal-cancel">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate} className="vl-modal-update">
            Update
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered className="vl-modal">
        <Modal.Header closeButton className="vl-modal-header">
          <Modal.Title className="vl-modal-title">
            <FaEye className="vl-modal-icon" /> Visit Log Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="vl-modal-body">
          {viewingLog && (
            <div className="vl-details-container">
              <div className="vl-detail-item">
                <span className="vl-detail-label">Customer:</span>
                <span className="vl-detail-value">{viewingLog.customer_name}</span>
              </div>
              <div className="vl-detail-item">
                <span className="vl-detail-label">Visit Date:</span>
                <span className="vl-detail-value">{new Date(viewingLog.visit_date).toLocaleDateString()}</span>
              </div>
              <div className="vl-detail-item">
                <span className="vl-detail-label">Outcome:</span>
                <span className={`vl-detail-badge vl-badge-${outcomeOptions.find(o => o.value === viewingLog.outcome)?.color || 'secondary'}`}>
                  {outcomeOptions.find(o => o.value === viewingLog.outcome)?.icon} {viewingLog.outcome}
                </span>
              </div>
              <div className="vl-detail-item">
                <span className="vl-detail-label">Notes:</span>
                <span className="vl-detail-value">{viewingLog.notes || 'No notes'}</span>
              </div>
              <div className="vl-detail-item">
                <span className="vl-detail-label">Logged By:</span>
                <span className="vl-detail-value">Salesperson ID: {viewingLog.salesperson_id}</span>
              </div>
              <div className="vl-detail-item">
                <span className="vl-detail-label">Created At:</span>
                <span className="vl-detail-value">{new Date(viewingLog.created_at).toLocaleString()}</span>
              </div>
              {viewingLog.otp_verified && (
                <div className="vl-detail-item vl-verified-item">
                  <span className="vl-detail-label">OTP Verified At:</span>
                  <span className="vl-detail-value">{new Date(viewingLog.otp_verified_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="vl-modal-footer">
          <Button variant="secondary" onClick={() => setShowViewModal(false)} className="vl-modal-close">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default VisitLogsForm;