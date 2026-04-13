import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  faSpinner,
  faExclamationTriangle,
  faLocationDot,
  faLocationCrosshairs
} from '@fortawesome/free-solid-svg-icons';
import Webcam from 'react-webcam';
import SalesNavbar from "../../../Pages/Navbar/SalesNavbar";
import './Attendance.css';
import Swal from 'sweetalert2';
import baseURL from '../../ApiUrl/NodeBaseURL';

function Attendance() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [companyLocation, setCompanyLocation] = useState(null);
  const companyLocationRef = useRef(null); // ✅ Ref to always have latest companyLocation
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
    error: null,
    withinRange: false,
    distance: null,
    lastUpdated: null
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
  const [isLocationServiceAvailable, setIsLocationServiceAvailable] = useState(true);

  // Constants
  const MAX_DISTANCE_METERS = 50;

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get address from coordinates using backend proxy
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `${baseURL}/api/attendance/geocode?lat=${latitude}&lon=${longitude}`,
        { timeout: 5000 }
      );
      if (response.data.success && response.data.data.display_name) {
        return response.data.data.display_name;
      }
    } catch (error) {
      console.log('Geocoding via backend failed:', error.message);
    }
    return `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  };

  // Ref to track active watchPosition watcher so we can clear it
  const watchIdRef = useRef(null);

  // ✅ Core: uses watchPosition to keep updating until accuracy is good enough
  const getUserLocation = useCallback((companyLoc) => {
    const company = companyLoc || companyLocationRef.current;

    // Clear any existing watcher
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by your browser'
      }));
      setIsLocationServiceAvailable(false);
      return;
    }

    setIsLocationServiceAvailable(true);

    // Target accuracy: if within this many meters, stop watching
    const TARGET_ACCURACY = 30; // meters
    // Hard timeout: stop watching after this long regardless
    const MAX_WATCH_TIME = 15000; // 15 seconds

    let bestPosition = null;
    let resolved = false;

    const finalize = async (position) => {
      if (resolved) return;
      resolved = true;

      // Stop watching
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      const { latitude, longitude, accuracy } = position.coords;
      console.log(`Using position: lat=${latitude}, lng=${longitude}, accuracy=${accuracy}m`);

      let withinRange = false;
      let distance = null;

      if (company?.latitude && company?.longitude) {
        distance = calculateDistance(latitude, longitude, company.latitude, company.longitude);
        withinRange = distance <= MAX_DISTANCE_METERS;
        console.log(`Distance from company: ${distance.toFixed(2)}m, Within range: ${withinRange}`);
      }

      const address = await getAddressFromCoordinates(latitude, longitude);

      setLocation({
        latitude,
        longitude,
        address,
        loading: false,
        error: null,
        withinRange,
        distance: distance ? distance.toFixed(2) : null,
        lastUpdated: new Date().toISOString()
      });
    };

    // Force-finalize after MAX_WATCH_TIME using best position so far
    const timeoutId = setTimeout(() => {
      if (!resolved && bestPosition) {
        console.log(`Max watch time reached, using best position (accuracy: ${bestPosition.coords.accuracy}m)`);
        finalize(bestPosition);
      } else if (!resolved) {
        resolved = true;
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: 'Could not get accurate location. Please try again outdoors or near a window.'
        }));
      }
    }, MAX_WATCH_TIME);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { accuracy } = position.coords;
        console.log(`watchPosition update: accuracy=${accuracy}m`);

        // Always keep the best (most accurate) position seen so far
        if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        // If accuracy is good enough, finalize immediately
        if (accuracy <= TARGET_ACCURACY) {
          clearTimeout(timeoutId);
          finalize(position);
        }
        // Otherwise keep watching — next update may be more accurate
      },
      (error) => {
        clearTimeout(timeoutId);
        if (resolved) return;
        resolved = true;

        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        let errorMessage = 'Unable to retrieve your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location permissions in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Make sure GPS/WiFi is enabled.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'Please try again.';
        }
        console.error('Geolocation error:', error);
        setLocation(prev => ({ ...prev, loading: false, error: errorMessage }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, []);

  // ✅ Fetch company location, then immediately get user location passing company data directly
  const fetchCompanyLocation = async () => {
    try {
      const response = await axios.get(`${baseURL}/get/companies`);

      if (response.data && response.data.length > 0) {
        const company = response.data[0];
        const latitude = parseFloat(company.latitude);
        const longitude = parseFloat(company.longitude);

        if (isNaN(latitude) || isNaN(longitude)) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid Company Location',
            text: 'Company coordinates are invalid. Please contact administrator.'
          });
          return;
        }

        const companyLoc = {
          latitude,
          longitude,
          address: company.address || 'Address not available',
          company_name: company.company_name || 'Company'
        };

        companyLocationRef.current = companyLoc; // ✅ Store in ref immediately
        setCompanyLocation(companyLoc);

        // ✅ Pass companyLoc directly so getUserLocation doesn't depend on stale state
        getUserLocation(companyLoc);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Company Location Not Found',
          text: 'Company location data is not available. Please contact administrator.'
        });
      }
    } catch (error) {
      console.error('Error fetching company location:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch company location. Please try again.'
      });
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        fetchAttendanceStatus(userData.id);
        fetchAttendanceHistory(userData.id);
        fetchCompanyLocation();
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(timer);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [navigate]);

  // ✅ Recalculate distance if either location or companyLocation changes (safety net)
  useEffect(() => {
    if (
      companyLocation?.latitude && companyLocation?.longitude &&
      location?.latitude && location?.longitude
    ) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        companyLocation.latitude,
        companyLocation.longitude
      );
      const withinRange = distance <= MAX_DISTANCE_METERS;

      setLocation(prev => {
        // Only update if values actually changed to avoid infinite loop
        if (
          prev.distance === distance.toFixed(2) &&
          prev.withinRange === withinRange
        ) return prev;

        return {
          ...prev,
          distance: distance.toFixed(2),
          withinRange,
          lastUpdated: prev.lastUpdated || new Date().toISOString()
        };
      });
    }
  }, [companyLocation]);
  // Note: We intentionally only react to companyLocation changes here,
  // not location.latitude/longitude, because getUserLocation already
  // calculates distance when getting fresh position.

  const fetchAttendanceStatus = async (salespersonId) => {
    try {
      const response = await axios.get(`${baseURL}/api/attendance/status/${salespersonId}`);
      if (response.data.success) {
        setAttendanceStatus(response.data.data);
        if (response.data.data.checked_in) {
          sessionStorage.setItem('attendanceChecked', 'true');
          sessionStorage.setItem('lastCheckInDate', new Date().toDateString());
        }
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
    }
  };

  const fetchAttendanceHistory = async (salespersonId) => {
    try {
      const response = await axios.get(
        `${baseURL}/api/attendance/history/${salespersonId}?month=${selectedMonth}&year=${selectedYear}`
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
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const validateLocationBeforeCheckIn = () => {
    if (!location.latitude || !location.longitude) {
      Swal.fire({ icon: 'warning', title: 'Location Required', text: 'Please enable location services to check in' });
      return false;
    }

    if (!companyLocation) {
      Swal.fire({ icon: 'error', title: 'Company Location Not Found', text: 'Company location data is not available. Please contact administrator.' });
      return false;
    }

    // ✅ Always recalculate fresh at the moment of check-in
    const distance = calculateDistance(
      location.latitude, location.longitude,
      companyLocation.latitude, companyLocation.longitude
    );
    const withinRange = distance <= MAX_DISTANCE_METERS;

    console.log('Pre-check validation:', { distance: distance.toFixed(2), withinRange });

    if (!withinRange) {
      Swal.fire({
        icon: 'error',
        title: 'Outside Allowed Range',
        html: `
          <div style="text-align: left;">
            <p><strong>You are not within the allowed check-in range.</strong></p>
            <p>You must be within <strong>${MAX_DISTANCE_METERS} meters</strong> of the company location.</p>
            <p><strong>Distance: ${distance.toFixed(2)} meters</strong></p>
            <hr>
            <p><strong>Company Location:</strong></p>
            <p style="font-size: 0.9em; color: #666;">Lat: ${companyLocation.latitude.toFixed(6)}, Lng: ${companyLocation.longitude.toFixed(6)}</p>
            <p><strong>Your Location:</strong></p>
            <p style="font-size: 0.9em; color: #666;">Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}</p>
            <p><strong>Last Updated:</strong> ${location.lastUpdated ? new Date(location.lastUpdated).toLocaleTimeString() : 'Unknown'}</p>
          </div>
        `,
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'Refresh Location',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          getUserLocation(); // Refresh with ref-based company location
        }
      });
      return false;
    }

    return true;
  };

  const handleCheckIn = async () => {
    if (!validateLocationBeforeCheckIn()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      if (photo) {
        const photoFile = dataURLtoFile(photo, `check-in-${Date.now()}.jpg`);
        formData.append('photo', photoFile);
      }
      formData.append('salesperson_id', user.id);
      formData.append('salesperson_name', user.full_name || user.name);
      formData.append('location', location.address);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      formData.append('distance_from_company', location.distance);
      formData.append('remarks', remarks);

      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        formData.append('ip_address', ipResponse.data.ip);
      } catch {
        formData.append('ip_address', 'unknown');
      }

      const response = await axios.post(`${baseURL}/api/attendance/check-in`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        sessionStorage.setItem('attendanceChecked', 'true');
        sessionStorage.setItem('lastCheckInDate', new Date().toDateString());

        Swal.fire({
          icon: 'success',
          title: 'Check-in Successful!',
          html: `
            <p>You have checked in at ${new Date().toLocaleTimeString()}</p>
            <p style="font-size: 0.9em; color: #28a745;">Location verified: ${location.distance} meters from company</p>
          `,
          timer: 2000,
          showConfirmButton: false
        });

        setAttendanceStatus({ ...attendanceStatus, checked_in: true, check_in_time: new Date(), status: response.data.data.status });
        setPhoto(null);
        setRemarks('');
        setSkipPhoto(false);
        fetchAttendanceHistory(user.id);

        setTimeout(() => {
          Swal.fire({
            title: 'Log a Visit?',
            text: 'Would you like to log a customer visit now?',
            icon: 'question',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            denyButtonColor: '#3b82f6',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Log Visit',
            denyButtonText: 'Skip for Now',
            cancelButtonText: 'Go to Dashboard'
          }).then((result) => {
            if (result.isConfirmed) navigate('/visit-logs');
            else if (result.isDenied) { sessionStorage.setItem('visitLogSkipped', 'true'); navigate('/salesperson-dashboard'); }
            else if (result.dismiss === Swal.DismissReason.cancel) navigate('/salesperson-dashboard');
          });
        }, 500);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      Swal.fire({ icon: 'error', title: 'Check-in Failed', text: error.response?.data?.message || 'Failed to check in. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!location.latitude || !location.longitude) {
      Swal.fire({ icon: 'warning', title: 'Location Required', text: 'Please enable location services to check out' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
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
      } catch {
        formData.append('ip_address', 'unknown');
      }

      const response = await axios.post(`${baseURL}/api/attendance/check-out`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Check-out Successful!',
          text: `You have checked out at ${new Date().toLocaleTimeString()}. Working hours: ${response.data.data.working_hours} hours`,
          timer: 3000,
          showConfirmButton: false
        });

        setAttendanceStatus({ ...attendanceStatus, checked_out: true, check_out_time: new Date(), working_hours: response.data.data.working_hours });
        setPhoto(null);
        setRemarks('');
        setSkipPhoto(false);
        fetchAttendanceHistory(user.id);
      }
    } catch (error) {
      console.error('Check-out error:', error);
      Swal.fire({ icon: 'error', title: 'Check-out Failed', text: error.response?.data?.message || 'Failed to check out. Please try again.' });
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
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#28a745';
      case 'late': return '#ffc107';
      case 'half_day': return '#17a2b8';
      case 'absent': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const renderLocationStatus = () => {
    if (location.loading) {
      return (
        <div className="sales-location-loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>Getting your location...</span>
        </div>
      );
    }

    if (location.error) {
      return (
        <div className="sales-location-error">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{location.error}</span>
          <button onClick={() => getUserLocation()} className="sales-retry-btn">
            <FontAwesomeIcon icon={faLocationCrosshairs} /> Retry
          </button>
        </div>
      );
    }

    if (!companyLocation) {
      return (
        <div className="sales-location-warning">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>Company location not available</span>
        </div>
      );
    }

    if (!location.latitude || !location.longitude) {
      return (
        <div className="sales-location-warning">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>Waiting for location...</span>
          <button onClick={() => getUserLocation()} className="sales-retry-btn">
            <FontAwesomeIcon icon={faLocationCrosshairs} /> Get Location
          </button>
        </div>
      );
    }

    return (
      <div className="sales-location-details">
        <p className="sales-address">
          <FontAwesomeIcon icon={faLocationDot} /> {location.address}
        </p>
        <p className="sales-coordinates">
          Lat: {location.latitude?.toFixed(6)}, Lng: {location.longitude?.toFixed(6)}
        </p>
        {location.distance && (
          <div className={`sales-distance-indicator ${location.withinRange ? 'within-range' : 'outside-range'}`}>
            <FontAwesomeIcon icon={location.withinRange ? faCheckCircle : faExclamationTriangle} />
            <span>
              Distance from company: {location.distance} meters
              {location.withinRange
                ? ` ✓ (Within ${MAX_DISTANCE_METERS}m range)`
                : ` ✗ (Outside ${MAX_DISTANCE_METERS}m range)`}
            </span>
          </div>
        )}
        {location.lastUpdated && (
          <p className="sales-location-timestamp">
            <FontAwesomeIcon icon={faClock} />
            Updated: {new Date(location.lastUpdated).toLocaleTimeString()}
          </p>
        )}
        {!attendanceStatus.checked_in && !location.withinRange && location.latitude && (
          <div className="sales-location-warning-message">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>You must be within {MAX_DISTANCE_METERS}m of the company to check in</span>
            <button onClick={() => getUserLocation()} className="sales-refresh-location-btn">
              <FontAwesomeIcon icon={faLocationCrosshairs} /> Refresh Location
            </button>
          </div>
        )}
      </div>
    );
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
          <button className={`sales-tab-btn ${activeTab === 'check-in-out' ? 'sales-active' : ''}`} onClick={() => setActiveTab('check-in-out')}>
            Check In/Out
          </button>
          <button className={`sales-tab-btn ${activeTab === 'history' ? 'sales-active' : ''}`} onClick={() => setActiveTab('history')}>
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
                <button onClick={() => getUserLocation()} className="sales-refresh-location-btn" title="Refresh Location" disabled={location.loading}>
                  <FontAwesomeIcon icon={faLocationCrosshairs} spin={location.loading} />
                </button>
              </div>
              {renderLocationStatus()}

              {companyLocation && (
                <div className="sales-company-location-info">
                  <p><strong>Company:</strong> {companyLocation.company_name}</p>
                  <p><strong>Company Address:</strong> {companyLocation.address}</p>
                  <p><strong>Company Coordinates:</strong> {companyLocation.latitude?.toFixed(6)}, {companyLocation.longitude?.toFixed(6)}</p>
                </div>
              )}
            </div>

            {/* Status Card */}
            <div className="sales-status-card">
              <h3>Today's Attendance</h3>
              <div className="sales-status-details">
                <div className="sales-status-item">
                  <span className="sales-status-label">Check-in:</span>
                  <span className="sales-status-value">{attendanceStatus.checked_in ? formatTime(attendanceStatus.check_in_time) : 'Not checked in'}</span>
                </div>
                <div className="sales-status-item">
                  <span className="sales-status-label">Check-out:</span>
                  <span className="sales-status-value">{attendanceStatus.checked_out ? formatTime(attendanceStatus.check_out_time) : 'Not checked out'}</span>
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
                    <span className="sales-status-badge" style={{ backgroundColor: getStatusColor(attendanceStatus.status) }}>
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
                        videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                        className="sales-webcam"
                      />
                      <button onClick={capturePhoto} className="sales-capture-btn">Capture Photo</button>
                    </div>
                  )}

                  {photo && (
                    <div className="sales-photo-preview">
                      <img src={photo} alt="Captured" />
                      <button onClick={retakePhoto} className="sales-retake-btn">Retake Photo</button>
                    </div>
                  )}

                  {!showCamera && !photo && !skipPhoto && (
                    <div className="sales-camera-actions">
                      <button onClick={() => setShowCamera(true)} className="sales-open-camera-btn">
                        <FontAwesomeIcon icon={faCamera} /> Open Camera
                      </button>
                      <button onClick={handleSkipPhoto} className="sales-skip-camera-btn">Skip Photo</button>
                    </div>
                  )}

                  {skipPhoto && (
                    <div className="sales-skip-message">
                      <p>Proceeding without photo</p>
                      <button onClick={() => setSkipPhoto(false)} className="sales-undo-skip-btn">Take Photo Instead</button>
                    </div>
                  )}

                  <div className="sales-remarks-section">
                    <label>Remarks (Optional):</label>
                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add any remarks..." rows="3" />
                  </div>

                  <div className="sales-action-buttons">
                    {!attendanceStatus.checked_in && (
                      <button
                        onClick={handleCheckIn}
                        disabled={loading || location.loading || !location.withinRange}
                        className={`sales-check-in-btn ${!location.withinRange ? 'disabled' : ''}`}
                        title={!location.withinRange ? `You must be within ${MAX_DISTANCE_METERS}m of the company` : ''}
                      >
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheckCircle} />}
                        Check In
                      </button>
                    )}

                    {attendanceStatus.checked_in && !attendanceStatus.checked_out && (
                      <button onClick={handleCheckOut} disabled={loading || location.loading} className="sales-check-out-btn">
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSignOutAlt} />}
                        Check Out
                      </button>
                    )}
                  </div>
                </>
              )}

              {attendanceStatus.checked_in && attendanceStatus.checked_out && (
                <div className="sales-completed-message">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <p>You have completed your attendance for today</p>
                  <button onClick={() => navigate('/salesperson-dashboard')} className="sales-go-to-dashboard-btn">
                    Go to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="sales-history-container">
            <div className="sales-history-filters">
              <select value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); if (user) fetchAttendanceHistory(user.id); }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); if (user) fetchAttendanceHistory(user.id); }}>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="sales-summary-cards">
              <div className="sales-summary-card"><div className="sales-summary-title">Total Days</div><div className="sales-summary-value">{historySummary.total_days}</div></div>
              <div className="sales-summary-card"><div className="sales-summary-title">Present</div><div className="sales-summary-value">{historySummary.present_days}</div></div>
              <div className="sales-summary-card"><div className="sales-summary-title">Late</div><div className="sales-summary-value">{historySummary.late_days}</div></div>
              <div className="sales-summary-card"><div className="sales-summary-title">Total Hours</div><div className="sales-summary-value">{historySummary.total_working_hours} hrs</div></div>
            </div>

            <div className="sales-history-table-container">
              <table className="sales-history-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Check In</th><th>Check Out</th><th>Working Hours</th><th>Status</th>
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
                          <span className="sales-status-badge" style={{ backgroundColor: getStatusColor(record.status) }}>
                            {record.status?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="sales-no-data">No attendance records found</td></tr>
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