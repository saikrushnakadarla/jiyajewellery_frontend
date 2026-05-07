import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Table, Form, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import baseURL from '../../ApiUrl/NodeBaseURL';
import Navbar from '../../../Pages/Navbar/Navbar';
import { FaPlus, FaEdit, FaTrash, FaCalendarCheck, FaUser, FaUserTie, FaClock, FaCheck, FaTimes } from 'react-icons/fa';
import './VisitLogsSchedule.css';
import Swal from 'sweetalert2';

const VisitLogsSchedule = () => {
  // State for form data
  const [formData, setFormData] = useState({
    scheduled_date: '',
    customer_id: '',
    salesperson_id: ''
  });

  // State for dropdown data
  const [customers, setCustomers] = useState([]);
  const [salespersons, setSalespersons] = useState([]);
  
  // State for scheduled visits list
  const [scheduledVisits, setScheduledVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  // Fetch customers and salespersons on component mount
  useEffect(() => {
    fetchUsers();
    fetchScheduledVisits();
  }, []);

  // Fetch all users and filter by role
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/users`);
      const users = response.data;
      
      // Filter customers (role = "Customer")
      const customerList = users.filter(user => 
        user.role && user.role.toLowerCase() === 'customer'
      );
      
      // Filter salespersons (role = "salesman")
      const salespersonList = users.filter(user => 
        user.role && user.role.toLowerCase() === 'salesman'
      );
      
      setCustomers(customerList);
      setSalespersons(salespersonList);
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch users data'
      });
    }
  };

  // Fetch all scheduled visits
  const fetchScheduledVisits = async () => {
    try {
      setFetchLoading(true);
      const response = await axios.get(`${baseURL}/api/visit-logs-schedule`);
      setScheduledVisits(response.data);
    } catch (error) {
      console.error('Error fetching scheduled visits:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch scheduled visits'
      });
    } finally {
      setFetchLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.scheduled_date || !formData.customer_id || !formData.salesperson_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill all required fields'
      });
      return;
    }

    // Validate that customer and salesperson are different
    if (formData.customer_id === formData.salesperson_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Customer and Salesperson cannot be the same person'
      });
      return;
    }

    try {
      setLoading(true);
      
      let response;
      if (isEditing) {
        // Update existing schedule
        response = await axios.put(`${baseURL}/api/visit-logs-schedule/${editingId}`, formData);
      } else {
        // Create new schedule
        response = await axios.post(`${baseURL}/api/visit-logs-schedule`, formData);
      }
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: isEditing ? 'Updated!' : 'Scheduled!',
          text: isEditing ? 'Visit schedule updated successfully!' : 'Visit scheduled successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Reset form
        resetForm();
        
        // Refresh the list
        fetchScheduledVisits();
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to process request'
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      scheduled_date: '',
      customer_id: '',
      salesperson_id: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  // Handle edit - Populate form with existing data
  const handleEdit = (schedule) => {
    // Format date for input field
    const formattedDate = schedule.scheduled_date 
      ? new Date(schedule.scheduled_date).toISOString().slice(0, 16)
      : '';
    
    setFormData({
      scheduled_date: formattedDate,
      customer_id: schedule.customer_id,
      salesperson_id: schedule.salesperson_id
    });
    
    setIsEditing(true);
    setEditingId(schedule.id);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    resetForm();
  };

  // Handle delete
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This visit schedule will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`${baseURL}/api/visit-logs-schedule/${id}`);
        
        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: 'Visit schedule deleted successfully',
            timer: 2000,
            showConfirmButton: false
          });
          
          // If we were editing the deleted item, reset form
          if (editingId === id) {
            resetForm();
          }
          
          fetchScheduledVisits();
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete visit schedule'
        });
      }
    }
  };


  // Get visit status badge
  const getVisitStatusBadge = (status) => {
    if (!status || status === 'scheduled') {
      return <Badge bg="primary">Scheduled</Badge>;
    }
    if (status === 'completed') {
      return <Badge bg="success">Completed</Badge>;
    }
    if (status === 'cancelled') {
      return <Badge bg="danger">Cancelled</Badge>;
    }
    return <Badge bg="secondary">{status}</Badge>;
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get customer name by ID
  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.full_name : 'Unknown Customer';
  };

  // Get salesperson name by ID
  const getSalespersonName = (salespersonId) => {
    const salesperson = salespersons.find(s => s.id === salespersonId);
    return salesperson ? salesperson.full_name : 'Unknown Salesperson';
  };

  return (
    <>
      <Navbar />
      <div className="vls-main-container">
        <Container className="vls-container">
          {/* Header */}
          <Row className="vls-header-row mb-4">
            <Col md={12}>
              <div className="vls-header-card">
                <div className="vls-header-content">
                  <div className="vls-header-icon-wrapper">
                    <FaCalendarCheck className="vls-header-icon" />
                  </div>
                  <div className="vls-header-text-wrapper">
                    <h1 className="vls-header-title">Visit Logs Schedule</h1>
                    <p className="vls-header-subtitle">
                      Schedule salesperson visits to customers
                    </p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Schedule Form */}
          <Row className="vls-form-section mb-4">
            <Col md={12}>
              <div className="vls-form-card">
                <div className="vls-form-header">
                  {isEditing ? (
                    <>
                      <FaEdit className="vls-form-icon" />
                      <h4>Edit Visit Schedule</h4>
                    </>
                  ) : (
                    <>
                      <FaPlus className="vls-form-icon" />
                      <h4>Schedule New Visit</h4>
                    </>
                  )}
                </div>
                <Form onSubmit={handleSubmit}>
                  <Row className="align-items-end">
                    {/* Date Field */}
                    <Col lg={4} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="vls-label">
                          <FaCalendarCheck className="me-1" /> Visit Date & Time <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="datetime-local"
                          name="scheduled_date"
                          value={formData.scheduled_date}
                          onChange={handleInputChange}
                          min={today + 'T00:00'}
                          className="vls-input"
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Customer Dropdown */}
                    <Col lg={3} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="vls-label">
                          <FaUser className="me-1" /> Customer <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="customer_id"
                          value={formData.customer_id}
                          onChange={handleInputChange}
                          className="vls-select"
                          required
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

                    {/* Salesperson Dropdown */}
                    <Col lg={3} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="vls-label">
                          <FaUserTie className="me-1" /> Sales Person <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="salesperson_id"
                          value={formData.salesperson_id}
                          onChange={handleInputChange}
                          className="vls-select"
                          required
                        >
                          <option value="">-- Select Sales Person --</option>
                          {salespersons.map(salesperson => (
                            <option key={salesperson.id} value={salesperson.id}>
                              {salesperson.full_name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {/* Action Buttons */}
                    <Col lg={2} md={6} className="mb-3">
                      <div className="d-flex gap-2">
                        <Button
                          type="submit"
                          variant="primary"
                          className="vls-submit-btn flex-grow-1"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : isEditing ? (
                            <>
                              <FaCheck className="me-1" /> Update
                            </>
                          ) : (
                            <>
                              <FaPlus className="me-1" /> Schedule
                            </>
                          )}
                        </Button>
                        {isEditing && (
                          <Button
                            variant="outline-secondary"
                            className="vls-cancel-btn"
                            onClick={handleCancelEdit}
                            title="Cancel Edit"
                          >
                            <FaTimes />
                          </Button>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Form>
              </div>
            </Col>
          </Row>

          {/* Info Alert */}
          <Row className="mb-4">
            <Col md={12}>
              <Alert variant="info" className="vls-info-alert">
                <FaClock className="me-2" />
                <strong>Schedule Management:</strong> Use this page to schedule salesperson visits to customers. You can create, edit, and delete schedules as needed.
              </Alert>
            </Col>
          </Row>

          {/* Scheduled Visits Table */}
          <Row className="vls-table-section">
            <Col md={12}>
              <div className="vls-table-card">
                <div className="vls-table-header">
                  <h4>Scheduled Visits</h4>
                  <Badge bg="primary" className="ms-2">
                    Total: {scheduledVisits.length}
                  </Badge>
                </div>
                <div className="vls-table-responsive">
                  <Table bordered hover responsive className="vls-table">
                    <thead className="vls-table-head">
                      <tr>
                        <th>#</th>
                        <th>Scheduled Date & Time</th>
                        <th>Customer</th>
                        <th>Sales Person</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fetchLoading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : scheduledVisits.length > 0 ? (
                        scheduledVisits.map((schedule, index) => (
                          <tr key={schedule.id} className={editingId === schedule.id ? 'vls-editing-row' : ''}>
                            <td>{index + 1}</td>
                            <td>
                              <FaCalendarCheck className="me-2 text-primary" />
                              {formatDateTime(schedule.scheduled_date)}
                            </td>
                            <td>
                              <FaUser className="me-2 text-success" />
                              {getCustomerName(schedule.customer_id)}
                            </td>
                            <td>
                              <FaUserTie className="me-2 text-info" />
                              {getSalespersonName(schedule.salesperson_id)}
                            </td>
                            <td>{getVisitStatusBadge(schedule.status)}</td>
                            <td>{formatDateTime(schedule.created_at)}</td>
                            <td>
                              <div className="vls-action-buttons">
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEdit(schedule)}
                                  title="Edit"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(schedule.id)}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-muted">
                            No scheduled visits found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default VisitLogsSchedule;