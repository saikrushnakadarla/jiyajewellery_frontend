import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt,
  faUser,
  faClock,
  faMapMarkerAlt,
  faImage,
  faSpinner,
  faFilter,
  faDownload,
  faEye,
  faChevronLeft,
  faChevronRight,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import AdminNavbar from "../../../Pages/Navbar/Navbar";
import './AllSalesPersonAttendance.css';
import Swal from 'sweetalert2';

function AllAttendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({
    total_salespersons: 0,
    present: 0,
    late: 0,
    half_day: 0,
    absent: 0
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Selected record for details view
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchDailyAttendance();
  }, [selectedDate]);

  useEffect(() => {
    filterAttendance();
  }, [searchTerm, statusFilter, attendanceData]);

  const fetchDailyAttendance = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/attendance/admin/daily/${selectedDate}`
      );
      
      if (response.data.success) {
        setAttendanceData(response.data.data.attendance);
        setFilteredData(response.data.data.attendance);
        setSummary(response.data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch attendance data'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAttendance = () => {
    let filtered = [...attendanceData];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.salesperson_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.phone?.includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }
    
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handlePrevDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay.toISOString().split('T')[0]);
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowDetailsModal(true);
  };

  const handleExportCSV = () => {
    try {
      // Prepare CSV data
      const headers = ['Salesperson', 'Email', 'Phone', 'Check In Time', 'Check Out Time', 
                      'Working Hours', 'Status', 'Check In Location', 'Check Out Location'];
      
      const csvData = filteredData.map(record => [
        record.salesperson_name || record.user_full_name,
        record.email || '',
        record.phone || '',
        record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : 'Not checked in',
        record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : 'Not checked out',
        record.working_hours ? `${record.working_hours} hrs` : '0 hrs',
        record.status ? record.status.toUpperCase() : 'Absent',
        record.check_in_location || 'N/A',
        record.check_out_location || 'N/A'
      ]);

      // Combine headers and data
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_${selectedDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Swal.fire({
        icon: 'success',
        title: 'Exported Successfully',
        text: 'Attendance data has been exported to CSV',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'Failed to export attendance data'
      });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return '#28a745';
      case 'late': return '#ffc107';
      case 'half_day': return '#17a2b8';
      case 'absent': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      present: '#28a745',
      late: '#ffc107',
      half_day: '#17a2b8',
      absent: '#dc3545'
    };
    
    return (
      <span 
        className="status-badge"
        style={{ 
          backgroundColor: colors[status] || '#6c757d',
          color: status === 'late' ? '#000' : '#fff'
        }}
      >
        {status ? status.toUpperCase() : 'ABSENT'}
      </span>
    );
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--:--';
    return new Date(dateString).toLocaleTimeString();
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <>
      <AdminNavbar />
      <div className="all-attendance-container" style={{ marginTop: '80px' }}>
        <div className="attendance-header">
          <h1>
            <FontAwesomeIcon icon={faCalendarAlt} />
            Daily Attendance Overview
          </h1>
          <div className="header-actions">
            <button onClick={handleExportCSV} className="export-btn">
              <FontAwesomeIcon icon={faDownload} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="date-navigation">
          <button onClick={handlePrevDay} className="nav-btn">
            <FontAwesomeIcon icon={faChevronLeft} />
            Previous Day
          </button>
          
          <div className="date-picker">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <button 
            onClick={handleNextDay} 
            className="nav-btn"
            disabled={new Date(selectedDate) >= new Date(new Date().setHours(0,0,0,0))}
          >
            Next Day
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card total">
            <div className="summary-icon">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className="summary-details">
              <span className="summary-label">Total Salespersons</span>
              <span className="summary-value">{summary.total_salespersons}</span>
            </div>
          </div>

          <div className="summary-card present">
            <div className="summary-icon">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div className="summary-details">
              <span className="summary-label">Present</span>
              <span className="summary-value">{summary.present}</span>
            </div>
          </div>

          <div className="summary-card late">
            <div className="summary-icon">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div className="summary-details">
              <span className="summary-label">Late</span>
              <span className="summary-value">{summary.late}</span>
            </div>
          </div>

          <div className="summary-card half-day">
            <div className="summary-icon">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div className="summary-details">
              <span className="summary-label">Half Day</span>
              <span className="summary-value">{summary.half_day}</span>
            </div>
          </div>

          <div className="summary-card absent">
            <div className="summary-icon">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className="summary-details">
              <span className="summary-label">Absent</span>
              <span className="summary-value">{summary.absent}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
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
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner">
              <FontAwesomeIcon icon={faSpinner} spin size="3x" />
              <p>Loading attendance data...</p>
            </div>
          ) : (
            <>
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Salesperson</th>
                    <th>Contact</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                    {/* <th>Location</th> */}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((record, index) => (
                      <tr key={record.id || index}>
                        <td>
                          <div className="salesperson-info">
                            <strong>{record.salesperson_name || record.user_full_name}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="contact-info">
                            <div>{record.email || 'N/A'}</div>
                            <small>{record.phone || 'N/A'}</small>
                          </div>
                        </td>
                        <td>
                          <div className="time-info">
                            <FontAwesomeIcon icon={faClock} />
                            {formatTime(record.check_in_time)}
                            {record.check_in_photo && (
                              <span className="photo-indicator" title="Photo available">
                                <FontAwesomeIcon icon={faImage} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="time-info">
                            <FontAwesomeIcon icon={faClock} />
                            {formatTime(record.check_out_time)}
                            {record.check_out_photo && (
                              <span className="photo-indicator" title="Photo available">
                                <FontAwesomeIcon icon={faImage} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="working-hours">
                            {record.working_hours ? `${record.working_hours} hrs` : '0 hrs'}
                          </span>
                        </td>
                        <td>{getStatusBadge(record.status)}</td>
                        {/* <td>
                          {(record.check_in_location || record.check_out_location) ? (
                            <div className="location-info">
                              <FontAwesomeIcon icon={faMapMarkerAlt} />
                              <span title={record.check_in_location || record.check_out_location}>
                                {record.check_in_location 
                                  ? record.check_in_location.substring(0, 30) + '...' 
                                  : record.check_out_location?.substring(0, 30) + '...'}
                              </span>
                            </div>
                          ) : (
                            <span className="no-location">No location</span>
                          )}
                        </td> */}
                        <td>
                          <button 
                            className="view-btn"
                            onClick={() => handleViewDetails(record)}
                            title="View Details"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-data">
                        No attendance records found for this date
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

        {/* Details Modal */}
        {showDetailsModal && selectedRecord && (
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Attendance Details</h2>
                <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="details-section">
                  <h3>Salesperson Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedRecord.salesperson_name || selectedRecord.user_full_name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{selectedRecord.email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Phone:</label>
                      <span>{selectedRecord.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Attendance Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Date:</label>
                      <span>{new Date(selectedRecord.date).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span>{getStatusBadge(selectedRecord.status)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Check In Time:</label>
                      <span>{formatTime(selectedRecord.check_in_time)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Check Out Time:</label>
                      <span>{formatTime(selectedRecord.check_out_time)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Working Hours:</label>
                      <span>{selectedRecord.working_hours || 0} hrs</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Location Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Check In Location:</label>
                      <span>{selectedRecord.check_in_location || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Check Out Location:</label>
                      <span>{selectedRecord.check_out_location || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Remarks</h3>
                  <div className="remarks-box">
                    <div className="remark-item">
                      <label>Check In Remarks:</label>
                      <p>{selectedRecord.check_in_remarks || 'No remarks'}</p>
                    </div>
                    <div className="remark-item">
                      <label>Check Out Remarks:</label>
                      <p>{selectedRecord.check_out_remarks || 'No remarks'}</p>
                    </div>
                  </div>
                </div>

                {(selectedRecord.check_in_photo || selectedRecord.check_out_photo) && (
                  <div className="details-section">
                    <h3>Photos</h3>
                    <div className="photos-container">
                      {selectedRecord.check_in_photo && (
                        <div className="photo-item">
                          <label>Check In Photo</label>
                          <img 
                            src={`http://localhost:5000/api/attendance/photos/${selectedRecord.check_in_photo}`}
                            alt="Check In"
                            onClick={() => window.open(`http://localhost:5000/api/attendance/photos/${selectedRecord.check_in_photo}`, '_blank')}
                          />
                        </div>
                      )}
                      {selectedRecord.check_out_photo && (
                        <div className="photo-item">
                          <label>Check Out Photo</label>
                          <img 
                            src={`http://localhost:5000/api/attendance/photos/${selectedRecord.check_out_photo}`}
                            alt="Check Out"
                            onClick={() => window.open(`http://localhost:5000/api/attendance/photos/${selectedRecord.check_out_photo}`, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AllAttendance;