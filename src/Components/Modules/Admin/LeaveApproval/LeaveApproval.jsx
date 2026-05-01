import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt,
  faClock,
  faSpinner,
  faFilter,
  faDownload,
  faEye,
  faChevronLeft,
  faChevronRight,
  faSearch,
  faCheck,
  faTimes,
  faPaperclip
} from '@fortawesome/free-solid-svg-icons';
import AdminNavbar from "../../../Pages/Navbar/Navbar";
import './LeaveApproval.css';
import Swal from 'sweetalert2';
import baseURL from '../../ApiUrl/NodeBaseURL';

function LeavesApproval() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  
  // Selected record for details view
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    filterLeaveRequests();
  }, [searchTerm, statusFilter, dateRange, leaveRequests]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/api/all-leave-requests`);
      
      if (response.data && Array.isArray(response.data)) {
        setLeaveRequests(response.data);
        setFilteredData(response.data);
        calculateSummary(response.data);
      } else {
        setLeaveRequests([]);
        setFilteredData([]);
        calculateSummary([]);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch leave requests. Please try again.'
      });
      setLeaveRequests([]);
      setFilteredData([]);
      calculateSummary([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    const summary = {
      total: data.length,
      pending: data.filter(item => item.status === 'Pending').length,
      approved: data.filter(item => item.status === 'Approved').length,
      rejected: data.filter(item => item.status === 'Rejected').length
    };
    setSummary(summary);
  };

  const filterLeaveRequests = () => {
    let filtered = [...leaveRequests];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.salesperson_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.salesperson_id?.toString().includes(searchTerm) ||
        request.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    // Apply date range filter
    if (dateRange.from) {
      filtered = filtered.filter(request => request.start_date >= dateRange.from);
    }
    if (dateRange.to) {
      filtered = filtered.filter(request => request.end_date <= dateRange.to);
    }
    
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Pending': { backgroundColor: '#ffc107', color: '#212529' },
      'Approved': { backgroundColor: '#28a745', color: 'white' },
      'Rejected': { backgroundColor: '#dc3545', color: 'white' }
    };
    
    const style = statusStyles[status] || { backgroundColor: '#6c757d', color: 'white' };
    
    return (
      <span 
        className="status-badge"
        style={style}
      >
        {status}
      </span>
    );
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setRemarks('');
    setShowApproveModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setRemarks('');
    setShowRejectModal(true);
  };

  const confirmApprove = async () => {
    setProcessingAction(true);
    try {
      const response = await axios.patch(`${baseURL}/api/leave-request/${selectedRequest.id}/status`, {
        status: 'Approved'
        // Remove remarks: remarks: remarks || 'Approved'
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Approved!',
          text: 'Leave request has been approved successfully.',
        });
        fetchLeaveRequests();
        setShowApproveModal(false);
        setSelectedRequest(null);
        setRemarks('');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.message || 'Failed to approve leave request.',
        });
      }
    } catch (error) {
      console.error('Error approving request:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to approve leave request.',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const confirmReject = async () => {
    if (!remarks.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Remarks Required',
        text: 'Please provide a reason for rejection.',
      });
      return;
    }

    setProcessingAction(true);
    try {
      const response = await axios.patch(`${baseURL}/api/leave-request/${selectedRequest.id}/status`, {
        status: 'Rejected'
        // Remove remarks: remarks: remarks
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Rejected!',
          text: 'Leave request has been rejected.',
        });
        fetchLeaveRequests();
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRemarks('');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.message || 'Failed to reject leave request.',
        });
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to reject leave request.',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Salesperson ID', 'Salesperson Name', 'Start Date', 'End Date', 
                      'Duration', 'Leave Type', 'Status', 'Description', 'Remarks', 'Submitted On'];
      
      const csvData = filteredData.map(request => {
        const start = new Date(request.start_date);
        const end = new Date(request.end_date);
        const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        return [
          request.salesperson_id || '',
          request.salesperson_name || '',
          formatDate(request.start_date),
          formatDate(request.end_date),
          `${diffDays} day${diffDays > 1 ? 's' : ''}`,
          request.leave_type === 'full_day' ? 'Full Day' : 'Half Day',
          request.status || '',
          request.description || '',
          request.remarks || '',
          request.created_at ? new Date(request.created_at).toLocaleString() : ''
        ];
      });

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leave_requests_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Swal.fire({
        icon: 'success',
        title: 'Exported Successfully',
        text: 'Leave requests data has been exported to CSV',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'Failed to export leave requests data'
      });
    }
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '0 days';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ from: '', to: '' });
  };

  return (
    <>
      <div>
        <AdminNavbar />
        <div className="leaves-approval-container">
          <div className="page-header">
            <h1>
              <FontAwesomeIcon icon={faCalendarAlt} />
              Leaves Approval
            </h1>
            <div className="header-actions">
              <button onClick={handleExportCSV} className="export-btn">
                <FontAwesomeIcon icon={faDownload} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card total">
              <div className="summary-icon">
                <FontAwesomeIcon icon={faCalendarAlt} />
              </div>
              <div className="summary-details">
                <span className="summary-label">Total Requests</span>
                <span className="summary-value">{summary.total}</span>
              </div>
            </div>

            <div className="summary-card pending">
              <div className="summary-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div className="summary-details">
                <span className="summary-label">Pending</span>
                <span className="summary-value">{summary.pending}</span>
              </div>
            </div>

            <div className="summary-card approved">
              <div className="summary-icon">
                <FontAwesomeIcon icon={faCheck} />
              </div>
              <div className="summary-details">
                <span className="summary-label">Approved</span>
                <span className="summary-value">{summary.approved}</span>
              </div>
            </div>

            <div className="summary-card rejected">
              <div className="summary-icon">
                <FontAwesomeIcon icon={faTimes} />
              </div>
              <div className="summary-details">
                <span className="summary-label">Rejected</span>
                <span className="summary-value">{summary.rejected}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, ID or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="status-filter">
              <FontAwesomeIcon icon={faFilter} />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="date-filters">
              <input
                type="date"
                placeholder="From Date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="date-input"
              />
              <input
                type="date"
                placeholder="To Date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="date-input"
              />
            </div>

            {(searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to) && (
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear Filters
              </button>
            )}
          </div>

          {/* Table */}
          <div className="table-container">
            {loading ? (
              <div className="loading-spinner">
                <FontAwesomeIcon icon={faSpinner} spin size="3x" />
                <p>Loading leave requests...</p>
              </div>
            ) : (
              <>
                <table className="leaves-table">
                  <thead>
                    <tr>
                      <th>Sr. No.</th>
                      <th>Salesperson</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Duration</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((request, index) => (
                        <tr key={request.id}>
                          <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                          <td>
                            <div className="salesperson-info">
                              <strong>{request.salesperson_name}</strong>
                              <small>ID: {request.salesperson_id}</small>
                            </div>
                          </td>
                          <td>{formatDate(request.start_date)}</td>
                          <td>{formatDate(request.end_date)}</td>
                          <td>{calculateDuration(request.start_date, request.end_date)}</td>
                          <td>
                            <span className="leave-type-badge">
                              {request.leave_type === 'full_day' ? 'Full Day' : 'Half Day'}
                            </span>
                          </td>
                          <td>{getStatusBadge(request.status)}</td>
                          <td>
                            <div className="description-cell">
                              {request.description?.length > 30 
                                ? request.description.substring(0, 30) + '...' 
                                : request.description || '-'}
                              {request.attachment && (
                                <span className="attachment-indicator" title="Has attachment">
                                  <FontAwesomeIcon icon={faPaperclip} />
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="view-btn"
                                onClick={() => handleViewDetails(request)}
                                title="View Details"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              {request.status === 'Pending' && (
                                <>
                                  <button 
                                    className="approve-btn"
                                    onClick={() => handleApprove(request)}
                                    title="Approve"
                                  >
                                    <FontAwesomeIcon icon={faCheck} />
                                  </button>
                                  <button 
                                    className="reject-btn"
                                    onClick={() => handleReject(request)}
                                    title="Reject"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="no-data">
                          No leave requests found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {filteredData.length > itemsPerPage && (
                  <div className="pagination">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    
                    <span className="page-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedRequest && (
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Leave Request Details</h2>
                <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="details-section">
                  <h3>Salesperson Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedRequest.salesperson_name}</span>
                    </div>
                    <div className="detail-item">
                      <label>ID:</label>
                      <span>{selectedRequest.salesperson_id}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Leave Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Start Date:</label>
                      <span>{formatDate(selectedRequest.start_date)}</span>
                    </div>
                    <div className="detail-item">
                      <label>End Date:</label>
                      <span>{formatDate(selectedRequest.end_date)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Duration:</label>
                      <span>{calculateDuration(selectedRequest.start_date, selectedRequest.end_date)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Leave Type:</label>
                      <span>{selectedRequest.leave_type === 'full_day' ? 'Full Day' : 'Half Day'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span>{getStatusBadge(selectedRequest.status)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Submitted On:</label>
                      <span>{selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Description</h3>
                  <div className="description-box">
                    <p>{selectedRequest.description || 'No description provided'}</p>
                  </div>
                </div>

                {selectedRequest.remarks && (
                  <div className="details-section">
                    <h3>Remarks</h3>
                    <div className="remarks-box">
                      <p>{selectedRequest.remarks}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.attachment && (
                  <div className="details-section">
                    <h3>Attachment</h3>
                    <div className="attachment-box">
                      <FontAwesomeIcon icon={faPaperclip} />
                      <a 
                        href={`${baseURL}/uploads/leaves/${selectedRequest.attachment}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        View Attachment
                      </a>
                    </div>
                  </div>
                )}

                {selectedRequest.status === 'Pending' && (
                  <div className="modal-actions">
                    <button 
                      className="approve-btn-large"
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleApprove(selectedRequest);
                      }}
                    >
                      <FontAwesomeIcon icon={faCheck} /> Approve
                    </button>
                    <button 
                      className="reject-btn-large"
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleReject(selectedRequest);
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedRequest && (
          <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
            <div className="modal-content small-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Approve Leave Request</h2>
                <button className="close-btn" onClick={() => setShowApproveModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <p>Are you sure you want to approve this leave request?</p>
                <p><strong>Salesperson:</strong> {selectedRequest.salesperson_name}</p>
                <p><strong>Duration:</strong> {calculateDuration(selectedRequest.start_date, selectedRequest.end_date)}</p>
                
                <div className="form-group">
                  <label>Remarks (Optional):</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add any remarks..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowApproveModal(false)}
                  disabled={processingAction}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-approve-btn"
                  onClick={confirmApprove}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> Processing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} /> Confirm Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedRequest && (
          <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
            <div className="modal-content small-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Reject Leave Request</h2>
                <button className="close-btn" onClick={() => setShowRejectModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <p>Are you sure you want to reject this leave request?</p>
                <p><strong>Salesperson:</strong> {selectedRequest.salesperson_name}</p>
                <p><strong>Duration:</strong> {calculateDuration(selectedRequest.start_date, selectedRequest.end_date)}</p>
                
                <div className="form-group">
                  <label>Reason for Rejection <span className="required">*</span>:</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowRejectModal(false)}
                  disabled={processingAction}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-reject-btn"
                  onClick={confirmReject}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> Processing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faTimes} /> Confirm Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default LeavesApproval;