import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCamera, 
  faMapMarkerAlt, 
  faClock, 
  faCheckCircle,
  faHistory,
  faSignOutAlt,
  faInfoCircle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Webcam from 'react-webcam';
import SalesNavbar from "../../../Pages/Navbar/SalesNavbar";
import './Attendance.css';
import Swal from 'sweetalert2';

function Attendance() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState({
    checked_in: false,
    checked_out: false,
    check_in_time: null,
    check_out_time: null,
    working_hours: null,
    status: null
  });
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: '',
    loading: false,
    error: null
  });
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('check-in-out');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historySummary, setHistorySummary] = useState({
    total_days: 0,
    present_days: 0,
    late_days: 0,
    total_working_hours: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [skipPhoto, setSkipPhoto] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        fetchAttendanceStatus(userData.id);
        fetchAttendanceHistory(userData.id);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }

    getUserLocation();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const getUserLocation = () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by your browser'
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          
          setLocation({
            latitude,
            longitude,
            address: response.data.display_name || 'Location retrieved',
            loading: false,
            error: null
          });
        } catch (error) {
          setLocation({
            latitude,
            longitude,
            address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
            loading: false,
            error: null
          });
        }
      },
      (error) => {
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: 'Unable to retrieve your location'
        }));
      }
    );
  };

  const fetchAttendanceStatus = async (salespersonId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/attendance/status/${salespersonId}`
      );
      
      if (response.data.success) {
        setAttendanceStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
    }
  };

  const fetchAttendanceHistory = async (salespersonId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/attendance/history/${salespersonId}?month=${selectedMonth}&year=${selectedYear}`
      );
      
      if (response.data.success) {
        setAttendanceHistory(response.data.data.attendance);
        setHistorySummary(response.data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setPhoto(imageSrc);
      setShowCamera(false);
      setSkipPhoto(false);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    setShowCamera(true);
    setSkipPhoto(false);
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  };

  const handleCheckIn = async () => {
    if (!location.latitude || !location.longitude) {
      Swal.fire({
        icon: 'warning',
        title: 'Location Required',
        text: 'Please enable location services to check in'
      });
      return;
    }

    // Commented out photo requirement
    // if (!photo && !skipPhoto) {
    //   Swal.fire({
    //     icon: 'warning',
    //     title: 'Photo Optional',
    //     text: 'You can take a photo or click "Skip Photo" to continue without photo'
    //   });
    //   return;
    // }

    setLoading(true);

    try {
      const formData = new FormData();
      
      // Only append photo if it exists
      if (photo) {
        const photoFile = dataURLtoFile(photo, `check-in-${Date.now()}.jpg`);
        formData.append('photo', photoFile);
      }
      
      formData.append('salesperson_id', user.id);
      formData.append('salesperson_name', user.full_name || user.name);
      formData.append('location', location.address);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      formData.append('remarks', remarks);
      
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        formData.append('ip_address', ipResponse.data.ip);
      } catch (error) {
        console.log('Could not fetch IP address');
      }

      const response = await axios.post(
        'http://localhost:5000/api/attendance/check-in',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Check-in Successful!',
          text: `You have checked in at ${new Date().toLocaleTimeString()}`,
          timer: 2000,
          showConfirmButton: false
        });

        setAttendanceStatus({
          ...attendanceStatus,
          checked_in: true,
          check_in_time: new Date(),
          status: response.data.data.status
        });
        
        setPhoto(null);
        setRemarks('');
        setSkipPhoto(false);
        fetchAttendanceHistory(user.id);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Check-in Failed',
        text: error.response?.data?.message || 'Failed to check in. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!location.latitude || !location.longitude) {
      Swal.fire({
        icon: 'warning',
        title: 'Location Required',
        text: 'Please enable location services to check out'
      });
      return;
    }

    // Commented out photo requirement
    // if (!photo && !skipPhoto) {
    //   Swal.fire({
    //     icon: 'warning',
    //     title: 'Photo Optional',
    //     text: 'You can take a photo or click "Skip Photo" to continue without photo'
    //   });
    //   return;
    // }

    setLoading(true);

    try {
      const formData = new FormData();
      
      // Only append photo if it exists
      if (photo) {
        const photoFile = dataURLtoFile(photo, `check-out-${Date.now()}.jpg`);
        formData.append('photo', photoFile);
      }
      
      formData.append('salesperson_id', user.id);
      formData.append('location', location.address);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      formData.append('remarks', remarks);
      
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        formData.append('ip_address', ipResponse.data.ip);
      } catch (error) {
        console.log('Could not fetch IP address');
      }

      const response = await axios.post(
        'http://localhost:5000/api/attendance/check-out',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Check-out Successful!',
          text: `You have checked out at ${new Date().toLocaleTimeString()}. Working hours: ${response.data.data.working_hours} hours`,
          timer: 3000,
          showConfirmButton: false
        });

        setAttendanceStatus({
          ...attendanceStatus,
          checked_out: true,
          check_out_time: new Date(),
          working_hours: response.data.data.working_hours
        });
        
        setPhoto(null);
        setRemarks('');
        setSkipPhoto(false);
        fetchAttendanceHistory(user.id);
      }
    } catch (error) {
      console.error('Check-out error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Check-out Failed',
        text: error.response?.data?.message || 'Failed to check out. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPhoto = () => {
    setSkipPhoto(true);
    setShowCamera(false);
    setPhoto(null);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--:--';
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  return (
    <>
      <SalesNavbar />
      <div className="sales-attendance-container" style={{ marginTop: '80px' }}>
        <div className="sales-attendance-header">
          <h1>Attendance Management</h1>
          <div className="sales-current-datetime">
            <FontAwesomeIcon icon={faClock} />
            <span>{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="sales-attendance-tabs">
          <button
            className={`sales-tab-btn ${activeTab === 'check-in-out' ? 'sales-active' : ''}`}
            onClick={() => setActiveTab('check-in-out')}
          >
            Check In/Out
          </button>
          <button
            className={`sales-tab-btn ${activeTab === 'history' ? 'sales-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FontAwesomeIcon icon={faHistory} /> History
          </button>
        </div>

        {activeTab === 'check-in-out' && (
          <div className="sales-check-in-out-container">
            {/* Location Card */}
            <div className="sales-location-card">
              <div className="sales-location-header">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="sales-location-icon" />
                <h3>Your Location</h3>
              </div>
              {location.loading ? (
                <div className="sales-location-loading">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Getting your location...</span>
                </div>
              ) : location.error ? (
                <div className="sales-location-error">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>{location.error}</span>
                  <button onClick={getUserLocation} className="sales-retry-btn">
                    Retry
                  </button>
                </div>
              ) : (
                <div className="sales-location-details">
                  <p className="sales-address">{location.address}</p>
                  <p className="sales-coordinates">
                    Lat: {location.latitude?.toFixed(6)}, Lng: {location.longitude?.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            {/* Status Card */}
            <div className="sales-status-card">
              <h3>Today's Attendance</h3>
              <div className="sales-status-details">
                <div className="sales-status-item">
                  <span className="sales-status-label">Check-in:</span>
                  <span className="sales-status-value">
                    {attendanceStatus.checked_in ? formatTime(attendanceStatus.check_in_time) : 'Not checked in'}
                  </span>
                </div>
                <div className="sales-status-item">
                  <span className="sales-status-label">Check-out:</span>
                  <span className="sales-status-value">
                    {attendanceStatus.checked_out ? formatTime(attendanceStatus.check_out_time) : 'Not checked out'}
                  </span>
                </div>
                {attendanceStatus.working_hours && (
                  <div className="sales-status-item">
                    <span className="sales-status-label">Working Hours:</span>
                    <span className="sales-status-value">{attendanceStatus.working_hours} hrs</span>
                  </div>
                )}
                {attendanceStatus.status && (
                  <div className="sales-status-item">
                    <span className="sales-status-label">Status:</span>
                    <span 
                      className="sales-status-badge"
                      style={{ backgroundColor: getStatusColor(attendanceStatus.status) }}
                    >
                      {attendanceStatus.status.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Camera Section */}
            <div className="sales-camera-section">
              <h3>
                <FontAwesomeIcon icon={faCamera} />
                Take {!attendanceStatus.checked_in ? 'Check-in' : !attendanceStatus.checked_out ? 'Check-out' : ''} Photo (Optional)
              </h3>
              
              {!attendanceStatus.checked_out && (
                <>
                  {showCamera && (
                    <div className="sales-camera-container">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                          width: 640,
                          height: 480,
                          facingMode: "user"
                        }}
                        className="sales-webcam"
                      />
                      <button onClick={capturePhoto} className="sales-capture-btn">
                        Capture Photo
                      </button>
                    </div>
                  )}

                  {photo && (
                    <div className="sales-photo-preview">
                      <img src={photo} alt="Captured" />
                      <button onClick={retakePhoto} className="sales-retake-btn">
                        Retake Photo
                      </button>
                    </div>
                  )}

                  {!showCamera && !photo && !skipPhoto && (
                    <div className="sales-camera-actions">
                      <button 
                        onClick={() => setShowCamera(true)} 
                        className="sales-open-camera-btn"
                      >
                        <FontAwesomeIcon icon={faCamera} />
                        Open Camera
                      </button>
                      <button 
                        onClick={handleSkipPhoto} 
                        className="sales-skip-camera-btn"
                      >
                        Skip Photo
                      </button>
                    </div>
                  )}

                  {skipPhoto && (
                    <div className="sales-skip-message">
                      <p>Proceeding without photo</p>
                      <button 
                        onClick={() => setSkipPhoto(false)} 
                        className="sales-undo-skip-btn"
                      >
                        Take Photo Instead
                      </button>
                    </div>
                  )}

                  <div className="sales-remarks-section">
                    <label>Remarks (Optional):</label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add any remarks..."
                      rows="3"
                    />
                  </div>

                  <div className="sales-action-buttons">
                    {!attendanceStatus.checked_in && (
                      <button
                        onClick={handleCheckIn}
                        disabled={loading || location.loading}
                        className="sales-check-in-btn"
                      >
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheckCircle} />}
                        Check In
                      </button>
                    )}

                    {attendanceStatus.checked_in && !attendanceStatus.checked_out && (
                      <button
                        onClick={handleCheckOut}
                        disabled={loading || location.loading}
                        className="sales-check-out-btn"
                      >
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSignOutAlt} />}
                        Check Out
                      </button>
                    )}

                    {attendanceStatus.checked_in && attendanceStatus.checked_out && (
                      <div className="sales-completed-message">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <p>You have completed your attendance for today</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {attendanceStatus.checked_in && attendanceStatus.checked_out && (
                <div className="sales-completed-message">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <p>You have completed your attendance for today</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="sales-history-container">
            <div className="sales-history-filters">
              <select 
                value={selectedMonth} 
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  fetchAttendanceHistory(user.id);
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>

              <select 
                value={selectedYear} 
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  fetchAttendanceHistory(user.id);
                }}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Summary Cards */}
            <div className="sales-summary-cards">
              <div className="sales-summary-card">
                <div className="sales-summary-title">Total Days</div>
                <div className="sales-summary-value">{historySummary.total_days}</div>
              </div>
              <div className="sales-summary-card">
                <div className="sales-summary-title">Present</div>
                <div className="sales-summary-value">{historySummary.present_days}</div>
              </div>
              <div className="sales-summary-card">
                <div className="sales-summary-title">Late</div>
                <div className="sales-summary-value">{historySummary.late_days}</div>
              </div>
              <div className="sales-summary-card">
                <div className="sales-summary-title">Total Hours</div>
                <div className="sales-summary-value">{historySummary.total_working_hours} hrs</div>
              </div>
            </div>

            {/* History Table */}
            <div className="sales-history-table-container">
              <table className="sales-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.length > 0 ? (
                    attendanceHistory.map((record, index) => (
                      <tr key={index}>
                        <td>{formatDate(record.date)}</td>
                        <td>{formatTime(record.check_in_time)}</td>
                        <td>{formatTime(record.check_out_time)}</td>
                        <td>{record.working_hours || 0} hrs</td>
                        <td>
                          <span 
                            className="sales-status-badge"
                            style={{ backgroundColor: getStatusColor(record.status) }}
                          >
                            {record.status?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="sales-no-data">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Attendance;