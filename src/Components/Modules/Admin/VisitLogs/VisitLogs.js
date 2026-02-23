import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Table, Form, InputGroup, Modal, Badge } from 'react-bootstrap';
import axios from 'axios';
import baseURL from '../../ApiUrl/NodeBaseURL';
import Navbar from '../../../Pages/Navbar/Navbar';
import { 
  FaSearch, FaEye, FaFilter, FaFileExport, 
  FaCalendarAlt, FaUser, FaEnvelope, FaCheckCircle, 
  FaTimesCircle, FaClock, FaDownload, FaSync 
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './VisitLogs.css';

const VisitLogs = () => {
  // State for visit logs
  const [visitLogs, setVisitLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [salespersonFilter, setSalespersonFilter] = useState('all');

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

  // State for salespersons data from API
  const [salespersons, setSalespersons] = useState([]);
  const [salespersonMap, setSalespersonMap] = useState({});

  // Fetch visit logs on component mount
  useEffect(() => {
    fetchAllVisitLogs();
    fetchSalespersons();
  }, []);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [visitLogs, searchTerm, dateFilter, outcomeFilter, salespersonFilter]);

  // Fetch all salespersons
  const fetchSalespersons = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      console.log('Fetched users:', response.data);
      
      // Filter only users with role 'salesman'
      const salespersonUsers = response.data.filter(user => 
        user.role?.toLowerCase() === 'salesman' || 
        user.designation?.toLowerCase() === 'salesman'
      );
      
      // Create a map of id to full_name for easy lookup
      const map = {};
      response.data.forEach(user => {
        map[user.id] = user.full_name;
      });
      
      setSalespersonMap(map);
      setSalespersons(salespersonUsers);
    } catch (error) {
      console.error('Error fetching salespersons:', error);
    }
  };

  // Fetch all visit logs
  const fetchAllVisitLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/visit-logs/all`);
      console.log('Fetched visit logs:', response.data);
      setVisitLogs(response.data);
      setFilteredLogs(response.data);
      
      // Calculate statistics
      calculateStatistics(response.data);
      
    } catch (error) {
      console.error('Error fetching visit logs:', error);
      alert('Failed to fetch visit logs');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStatistics = (logs) => {
    const stats = {
      total_visits: logs.length,
      interested_count: logs.filter(log => log.outcome === 'Interested').length,
      not_interested_count: logs.filter(log => log.outcome === 'Not Interested').length,
      follow_up_count: logs.filter(log => log.outcome === 'Follow Up').length,
      converted_count: logs.filter(log => log.outcome === 'Converted').length,
      other_count: logs.filter(log => log.outcome === 'Other').length,
      unique_customers: new Set(logs.map(log => log.customer_id)).size
    };
    setStatistics(stats);
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...visitLogs];

    // Search filter (by customer name or email)
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateFilter.startDate && dateFilter.endDate) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.visit_date);
        const start = new Date(dateFilter.startDate);
        const end = new Date(dateFilter.endDate);
        end.setHours(23, 59, 59, 999);
        return logDate >= start && logDate <= end;
      });
    }

    // Outcome filter
    if (outcomeFilter !== 'all') {
      filtered = filtered.filter(log => log.outcome === outcomeFilter);
    }

    // Salesperson filter - filter by salesperson_id
    if (salespersonFilter !== 'all') {
      filtered = filtered.filter(log => log.salesperson_id == salespersonFilter);
    }

    setFilteredLogs(filtered);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
    setOutcomeFilter('all');
    setSalespersonFilter('all');
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const exportData = filteredLogs.map((log, index) => ({
        'S.No': index + 1,
        'Visit Date': new Date(log.visit_date).toLocaleDateString(),
        'Customer Name': log.customer_name,
        'Customer ID': log.customer_id,
        'Outcome': log.outcome,
        'Notes': log.notes || '-',
        'OTP Verified': log.otp_verified ? 'Yes' : 'No',
        'Salesperson': salespersonMap[log.salesperson_id] || `ID: ${log.salesperson_id}`,
        'Created At': new Date(log.created_at).toLocaleString()
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Visit Logs');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      
      // Download file
      const fileName = `visit_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(data, fileName);
      
      alert(`✅ Exported ${exportData.length} records to Excel`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('❌ Failed to export to Excel');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = [
        'S.No,Visit Date,Customer Name,Customer ID,Outcome,Notes,OTP Verified,Salesperson,Created At'
      ];
      
      const rows = filteredLogs.map((log, index) => {
        const salespersonName = salespersonMap[log.salesperson_id] || `ID: ${log.salesperson_id}`;
        return `${index + 1},${new Date(log.visit_date).toLocaleDateString()},"${log.customer_name}",${log.customer_id},${log.outcome},"${log.notes || '-'}",${log.otp_verified ? 'Yes' : 'No'},"${salespersonName}","${new Date(log.created_at).toLocaleString()}"`;
      });
      
      const csvContent = [...headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const fileName = `visit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      saveAs(blob, fileName);
      
      alert(`✅ Exported ${rows.length} records to CSV`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('❌ Failed to export to CSV');
    }
  };

  // View details
  const handleView = (log) => {
    setViewingLog(log);
    setShowViewModal(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format datetime for display
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get salesperson name by ID
  const getSalespersonName = (id) => {
    return salespersonMap[id] || `Salesperson ${id}`;
  };

  // Outcome options with colors
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
      {/* Added margin-top and proper spacing */}
      <div className="admin-vl-main-container">
        <Container className="admin-vl-container" fluid>
          {/* Header Section */}
          <Row className="admin-vl-header-row mb-4">
            <Col md={8}>
              <h2 className="admin-vl-title">
                <FaEye className="admin-vl-title-icon" /> Admin Visit Logs Management
              </h2>
              <p className="admin-vl-subtitle">
                View and manage all customer visit logs across the system
              </p>
            </Col>
            <Col md={4} className="admin-vl-header-actions">
              <Button 
                variant="success" 
                onClick={exportToExcel}
                className="admin-vl-export-btn me-2"
                title="Export to Excel"
              >
                <FaFileExport /> Excel
              </Button>
              <Button 
                variant="info" 
                onClick={exportToCSV}
                className="admin-vl-export-btn"
                title="Export to CSV"
              >
                <FaDownload /> CSV
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={fetchAllVisitLogs}
                className="admin-vl-refresh-btn ms-2"
                title="Refresh Data"
              >
                <FaSync />
              </Button>
            </Col>
          </Row>

          {/* Statistics Cards */}
          <Row className="admin-vl-stats-row mb-4">
            <Col lg={2} md={4} sm={6} xs={12} className="admin-vl-stat-col">
              <div className="admin-vl-stat-card admin-vl-stat-total">
                <div className="admin-vl-stat-icon">📊</div>
                <div className="admin-vl-stat-content">
                  <h6>Total Visits</h6>
                  <h3>{statistics.total_visits}</h3>
                </div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={12} className="admin-vl-stat-col">
              <div className="admin-vl-stat-card admin-vl-stat-interested">
                <div className="admin-vl-stat-icon">👍</div>
                <div className="admin-vl-stat-content">
                  <h6>Interested</h6>
                  <h3>{statistics.interested_count}</h3>
                </div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={12} className="admin-vl-stat-col">
              <div className="admin-vl-stat-card admin-vl-stat-not-interested">
                <div className="admin-vl-stat-icon">👎</div>
                <div className="admin-vl-stat-content">
                  <h6>Not Interested</h6>
                  <h3>{statistics.not_interested_count}</h3>
                </div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={12} className="admin-vl-stat-col">
              <div className="admin-vl-stat-card admin-vl-stat-followup">
                <div className="admin-vl-stat-icon">🔄</div>
                <div className="admin-vl-stat-content">
                  <h6>Follow Up</h6>
                  <h3>{statistics.follow_up_count}</h3>
                </div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={12} className="admin-vl-stat-col">
              <div className="admin-vl-stat-card admin-vl-stat-converted">
                <div className="admin-vl-stat-icon">💰</div>
                <div className="admin-vl-stat-content">
                  <h6>Converted</h6>
                  <h3>{statistics.converted_count}</h3>
                </div>
              </div>
            </Col>
            <Col lg={2} md={4} sm={6} xs={12} className="admin-vl-stat-col">
              <div className="admin-vl-stat-card admin-vl-stat-unique">
                <div className="admin-vl-stat-icon">👥</div>
                <div className="admin-vl-stat-content">
                  <h6>Unique Customers</h6>
                  <h3>{statistics.unique_customers}</h3>
                </div>
              </div>
            </Col>
          </Row>

          {/* Filters Section */}
          <Row className="admin-vl-filters-section mb-4">
            <Col md={12}>
              <div className="admin-vl-filters-header">
                <FaFilter className="admin-vl-filters-icon" />
                <h5>Filter Visit Logs</h5>
                <Button 
                  variant="link" 
                  onClick={resetFilters}
                  className="admin-vl-reset-filters"
                >
                  Reset Filters
                </Button>
              </div>
            </Col>
            <Col md={4} className="admin-vl-filter-col">
              <Form.Group>
                <Form.Label className="admin-vl-filter-label">
                  <FaSearch /> Search
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search by customer name or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-vl-search-input"
                  />
                  {searchTerm && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setSearchTerm('')}
                      className="admin-vl-clear-search"
                    >
                      ×
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3} className="admin-vl-filter-col">
              <Form.Group>
                <Form.Label className="admin-vl-filter-label">
                  <FaCalendarAlt /> Date Range
                </Form.Label>
                <Row>
                  <Col xs={6}>
                    <Form.Control
                      type="date"
                      placeholder="Start Date"
                      value={dateFilter.startDate}
                      onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                      className="admin-vl-date-input"
                    />
                  </Col>
                  <Col xs={6}>
                    <Form.Control
                      type="date"
                      placeholder="End Date"
                      value={dateFilter.endDate}
                      onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                      className="admin-vl-date-input"
                    />
                  </Col>
                </Row>
              </Form.Group>
            </Col>
            <Col md={2.5} className="admin-vl-filter-col">
              <Form.Group>
                <Form.Label className="admin-vl-filter-label">
                  Outcome
                </Form.Label>
                <Form.Select
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                  className="admin-vl-select"
                >
                  <option value="all">All Outcomes</option>
                  {outcomeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2.5} className="admin-vl-filter-col">
              <Form.Group>
                <Form.Label className="admin-vl-filter-label">
                  <FaUser /> Salesperson
                </Form.Label>
                <Form.Select
                  value={salespersonFilter}
                  onChange={(e) => setSalespersonFilter(e.target.value)}
                  className="admin-vl-select"
                >
                  <option value="all">All Salespersons</option>
                  {/* Show actual salesperson names from API */}
                  {salespersons.map(sp => (
                    <option key={sp.id} value={sp.id}>
                      {sp.full_name} {sp.id ? `(ID: ${sp.id})` : ''}
                    </option>
                  ))}
                  {/* Also include any salesperson IDs from visit logs that might not be in the users list */}
                  {visitLogs
                    .map(log => log.salesperson_id)
                    .filter((id, index, self) => 
                      id && self.indexOf(id) === index && 
                      !salespersons.some(sp => sp.id == id)
                    )
                    .map(id => (
                      <option key={id} value={id}>
                        Salesperson {id} (ID: {id})
                      </option>
                    ))
                  }
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Results Summary */}
          <Row className="admin-vl-summary-row mb-3">
            <Col>
              <p className="admin-vl-summary-text">
                Showing <strong>{filteredLogs.length}</strong> of <strong>{visitLogs.length}</strong> visit logs
              </p>
            </Col>
          </Row>

          {/* Visit Logs Table */}
          <Row className="admin-vl-table-section">
            <Col md={12} className="admin-vl-table-container">
              <Table bordered hover responsive className="admin-vl-table">
                <thead className="admin-vl-table-head">
                  <tr>
                    <th>#</th>
                    <th>Visit Date</th>
                    <th>Customer</th>
                    <th>Outcome</th>
                    <th>Notes</th>
                    <th>OTP Status</th>
                    <th>Salesperson</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="admin-vl-loading-cell">
                        <div className="admin-vl-loading-spinner">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p>Loading visit logs...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.length > 0 ? (
                    filteredLogs.map((log, index) => {
                      const outcomeOption = outcomeOptions.find(o => o.value === log.outcome);
                      return (
                        <tr key={log.visit_id} className="admin-vl-table-row">
                          <td>{index + 1}</td>
                          <td>{formatDate(log.visit_date)}</td>
                          <td>
                            <div className="admin-vl-customer-info">
                              <strong>{log.customer_name}</strong>
                              <br />
                              <small className="text-muted">ID: {log.customer_id}</small>
                            </div>
                          </td>
                          <td>
                            <Badge bg={outcomeOption?.color || 'secondary'} className="admin-vl-outcome-badge">
                              {outcomeOption?.icon} {log.outcome}
                            </Badge>
                          </td>
                          <td className="admin-vl-notes-cell">
                            {log.notes || <span className="text-muted">-</span>}
                          </td>
                          <td>
                            {log.otp_verified ? (
                              <span className="admin-vl-status-verified">
                                <FaCheckCircle /> Verified
                                <br />
                                <small>{log.otp_verified_at ? formatDateTime(log.otp_verified_at) : ''}</small>
                              </span>
                            ) : (
                              <span className="admin-vl-status-unverified">
                                <FaTimesCircle /> Not Verified
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="admin-vl-salesperson-badge" title={`ID: ${log.salesperson_id}`}>
                              {getSalespersonName(log.salesperson_id)}
                            </span>
                          </td>
                          <td>{formatDateTime(log.created_at)}</td>
                          <td className="admin-vl-actions-cell">
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() => handleView(log)}
                              className="admin-vl-view-btn"
                              title="View Details"
                            >
                              <FaEye />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="admin-vl-empty-cell">
                        <div className="admin-vl-empty-state">
                          <FaSearch size={48} className="admin-vl-empty-icon" />
                          <h5>No Visit Logs Found</h5>
                          <p>No visit logs match your current filters. Try adjusting your search criteria.</p>
                          <Button variant="primary" onClick={resetFilters}>
                            Reset Filters
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Col>
          </Row>
        </Container>
      </div>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered className="admin-vl-modal">
        <Modal.Header closeButton className="admin-vl-modal-header">
          <Modal.Title className="admin-vl-modal-title">
            <FaEye className="admin-vl-modal-icon" /> Visit Log Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="admin-vl-modal-body">
          {viewingLog && (
            <div className="admin-vl-details-grid">
              <div className="admin-vl-detail-section">
                <h6 className="admin-vl-detail-section-title">Customer Information</h6>
                <div className="admin-vl-detail-row">
                  <span className="admin-vl-detail-label">Customer Name:</span>
                  <span className="admin-vl-detail-value">{viewingLog.customer_name}</span>
                </div>
                <div className="admin-vl-detail-row">
                  <span className="admin-vl-detail-label">Customer ID:</span>
                  <span className="admin-vl-detail-value">{viewingLog.customer_id}</span>
                </div>
              </div>

              <div className="admin-vl-detail-section">
                <h6 className="admin-vl-detail-section-title">Visit Information</h6>
                <div className="admin-vl-detail-row">
                  <span className="admin-vl-detail-label">Visit Date:</span>
                  <span className="admin-vl-detail-value">{formatDate(viewingLog.visit_date)}</span>
                </div>
                <div className="admin-vl-detail-row">
                  <span className="admin-vl-detail-label">Outcome:</span>
                  <span className="admin-vl-detail-value">
                    <Badge bg={outcomeOptions.find(o => o.value === viewingLog.outcome)?.color || 'secondary'}>
                      {outcomeOptions.find(o => o.value === viewingLog.outcome)?.icon} {viewingLog.outcome}
                    </Badge>
                  </span>
                </div>
                <div className="admin-vl-detail-row">
                  <span className="admin-vl-detail-label">Notes:</span>
                  <span className="admin-vl-detail-value">{viewingLog.notes || 'No notes provided'}</span>
                </div>
              </div>

              <div className="admin-vl-detail-section">
                <h6 className="admin-vl-detail-section-title">Salesperson Information</h6>
                <div className="admin-vl-detail-row">
                  <span className="admin-vl-detail-label">Salesperson:</span>
                  <span className="admin-vl-detail-value">
                    {getSalespersonName(viewingLog.salesperson_id)}
                    <br />
                    <small className="text-muted">ID: {viewingLog.salesperson_id}</small>
                  </span>
                </div>
                <div className="admin-vl-detail-row">
                  <span className="admin-vl-detail-label">Source By:</span>
                  <span className="admin-vl-detail-value">{viewingLog.source_by || 'N/A'}</span>
                </div>
              </div>

              <div className="admin-vl-detail-section">
                <h6 className="admin-vl-detail-section-title">OTP Information</h6>
                <div className="admin-vl-detail-row">
                  <span className="admin-vl-detail-label">OTP Verified:</span>
                  <span className="admin-vl-detail-value">
                    {viewingLog.otp_verified ? (
                      <span className="text-success">
                        <FaCheckCircle /> Yes
                      </span>
                    ) : (
                      <span className="text-danger">
                        <FaTimesCircle /> No
                      </span>
                    )}
                  </span>
                </div>
                {viewingLog.otp_verified && viewingLog.otp_verified_at && (
                  <div className="admin-vl-detail-row">
                    <span className="admin-vl-detail-label">Verified At:</span>
                    <span className="admin-vl-detail-value">{formatDateTime(viewingLog.otp_verified_at)}</span>
                  </div>
                )}
                {viewingLog.otp_sent_at && (
                  <div className="admin-vl-detail-row">
                    <span className="admin-vl-detail-label">OTP Sent At:</span>
                    <span className="admin-vl-detail-value">{formatDateTime(viewingLog.otp_sent_at)}</span>
                  </div>
                )}
              </div>

              <div className="admin-vl-detail-section">
                <h6 className="admin-vl-detail-section-title">System Information</h6>
                <div className="admin-vl-detail-row">
                  <span className="admin-vl-detail-label">Visit ID:</span>
                  <span className="admin-vl-detail-value">{viewingLog.visit_id}</span>
                </div>
                <div className="admin-vl-detail-row">
                  <span className="admin-vl-detail-label">Created At:</span>
                  <span className="admin-vl-detail-value">{formatDateTime(viewingLog.created_at)}</span>
                </div>
                <div className="admin-vl-detail-row">
                  <span className="admin-vl-detail-label">Updated At:</span>
                  <span className="admin-vl-detail-value">{viewingLog.updated_at ? formatDateTime(viewingLog.updated_at) : 'Not updated'}</span>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="admin-vl-modal-footer">
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default VisitLogs;