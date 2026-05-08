import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import baseURL from '../../ApiUrl/NodeBaseURL';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../Pages/Navbar/SalesNavbar';
import { 
  FaEdit, FaTrash, FaEye, FaClock, FaCheckCircle, FaEnvelope, 
  FaUserCheck, FaCalendarCheck, FaMapMarkerAlt, FaCrosshairs,
  FaSpinner, FaExclamationTriangle, FaUser, FaPhone, FaBuilding,
  FaCity, FaCalendarDay, FaInfoCircle
} from 'react-icons/fa';
import './VisitLogs.css';
import Swal from 'sweetalert2';

const VisitLogsForm = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date().toDateString();

  // Constants
  const MAX_DISTANCE_METERS = 50;

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
  const loggedInSalesPersonName = user?.full_name || '';

  // State for customers
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');

  // Location state
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
  const watchIdRef = useRef(null);
  const [isLocationServiceAvailable, setIsLocationServiceAvailable] = useState(true);

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

  // State for scheduled visits and user details
  const [scheduledVisits, setScheduledVisits] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [todayScheduledVisits, setTodayScheduledVisits] = useState([]);
  const [loadingScheduleData, setLoadingScheduleData] = useState(false);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
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
      console.log('Geocoding failed:', error.message);
    }
    return `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  };

  // Get current location with high accuracy
  const getCurrentLocation = useCallback(() => {
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

    const TARGET_ACCURACY = 30;
    const MAX_WATCH_TIME = 15000;
    let bestPosition = null;
    let resolved = false;

    const finalize = async (position) => {
      if (resolved) return;
      resolved = true;

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      const { latitude, longitude, accuracy } = position.coords;

      let withinRange = false;
      let distance = null;

      if (selectedCustomer?.latitude && selectedCustomer?.longitude) {
        distance = calculateDistance(
          latitude, longitude,
          parseFloat(selectedCustomer.latitude), 
          parseFloat(selectedCustomer.longitude)
        );
        withinRange = distance <= MAX_DISTANCE_METERS;
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

    const timeoutId = setTimeout(() => {
      if (!resolved && bestPosition) {
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
          error: 'Could not get accurate location. Please try again.'
        }));
      }
    }, MAX_WATCH_TIME);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { accuracy } = position.coords;

        if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        if (accuracy <= TARGET_ACCURACY) {
          clearTimeout(timeoutId);
          finalize(position);
        }
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
            errorMessage += 'Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please try again.';
        }
        setLocation(prev => ({ ...prev, loading: false, error: errorMessage }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, [selectedCustomer]);

  // Fetch scheduled visits and users data
  const fetchScheduledVisitsAndUsers = async () => {
    try {
      setLoadingScheduleData(true);
      const [visitLogsScheduleRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/visit-logs-schedule/'),
        axios.get('http://localhost:5000/api/users/')
      ]);

      const visitLogsScheduleData = visitLogsScheduleRes.data;
      const usersData = usersRes.data;

      setScheduledVisits(visitLogsScheduleData);
      setUsersData(usersData);

      // Filter visits for logged-in salesperson AND today's date
      const todayFiltered = visitLogsScheduleData.filter(visit => {
        const visitDate = new Date(visit.scheduled_date).toDateString();
        const isToday = visitDate === todayDate;
        const isMatchingSalesPerson = visit.salesperson_name === loggedInSalesPersonName;
        return isMatchingSalesPerson && isToday;
      });

      setTodayScheduledVisits(todayFiltered);
    } catch (error) {
      console.error('Error fetching scheduled visits or users:', error);
    } finally {
      setLoadingScheduleData(false);
    }
  };

  // Get user details by name
  const getUserDetailsByName = (fullName) => {
    if (!fullName || !usersData.length) return null;
    return usersData.find(user => user.full_name === fullName) || null;
  };

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
    fetchVisitLogs();
    fetchStatistics();
    fetchScheduledVisitsAndUsers();
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Recalculate distance when location or selected customer changes
  useEffect(() => {
    if (location.latitude && location.longitude && selectedCustomer?.latitude && selectedCustomer?.longitude) {
      const distance = calculateDistance(
        location.latitude, location.longitude,
        parseFloat(selectedCustomer.latitude), 
        parseFloat(selectedCustomer.longitude)
      );
      const withinRange = distance <= MAX_DISTANCE_METERS;

      setLocation(prev => {
        if (prev.distance === distance?.toFixed(2) && prev.withinRange === withinRange) {
          return prev;
        }
        return {
          ...prev,
          distance: distance ? distance.toFixed(2) : null,
          withinRange,
          lastUpdated: prev.lastUpdated || new Date().toISOString()
        };
      });
    }
  }, [location.latitude, location.longitude, selectedCustomer]);

  // OTP Timer effect
  useEffect(() => {
    let interval;
    if (otpSent && !otpVerified && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && otpSent && !otpVerified) {
      setOtpSent(false);
      setGeneratedOtp('');
      setOtpMessage('OTP expired. Please request a new one.');
    }
    return () => clearInterval(interval);
  }, [otpTimer, otpSent, otpVerified]);

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/visit-logs/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
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
    
    const customer = customers.find(c => c.id.toString() === customerId);

    if (customer) {
      setSelectedCustomer(customer);
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: customer.full_name
      }));
      setCustomerEmail(customer.email || '');
      
      setLocation({
        latitude: null,
        longitude: null,
        address: '',
        loading: false,
        error: null,
        withinRange: false,
        distance: null,
        lastUpdated: null
      });
      
      setTimeout(() => getCurrentLocation(), 100);
    } else {
      setSelectedCustomer(null);
      setFormData(prev => ({
        ...prev,
        customer_id: '',
        customer_name: ''
      }));
      setCustomerEmail('');
    }

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

  // Validate location before sending OTP or logging visit
  const validateLocation = () => {
    if (!location.latitude || !location.longitude) {
      Swal.fire({
        icon: 'warning',
        title: 'Location Required',
        text: 'Please enable location services to proceed.'
      });
      return false;
    }

    if (!selectedCustomer?.latitude || !selectedCustomer?.longitude) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer Location Missing',
        text: 'This customer does not have location data. Please contact administrator.'
      });
      return false;
    }

    const distance = calculateDistance(
      location.latitude, location.longitude,
      parseFloat(selectedCustomer.latitude), 
      parseFloat(selectedCustomer.longitude)
    );
    const withinRange = distance <= MAX_DISTANCE_METERS;

    if (!withinRange) {
      Swal.fire({
        icon: 'error',
        title: 'Outside Allowed Range',
        html: `
          <div style="text-align: left;">
            <p><strong>You are not within the allowed visit range.</strong></p>
            <p>You must be within <strong>${MAX_DISTANCE_METERS} meters</strong> of the customer's location to log a visit.</p>
            <p><strong>Distance: ${distance?.toFixed(2)} meters</strong></p>
            <hr>
            <p><strong>Customer Location:</strong></p>
            <p style="font-size: 0.9em; color: #666;">Lat: ${parseFloat(selectedCustomer.latitude).toFixed(6)}, Lng: ${parseFloat(selectedCustomer.longitude).toFixed(6)}</p>
            <p><strong>Your Location:</strong></p>
            <p style="font-size: 0.9em; color: #666;">Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}</p>
          </div>
        `,
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'Refresh Location',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          getCurrentLocation();
        }
      });
      return false;
    }

    return true;
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

    if (!validateLocation()) {
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
        setOtpVerified(false);
        setGeneratedOtp(response.data.otp);
        setOtpTimer(600);
        setOtpMessage(`✅ OTP sent to ${customerEmail}`);
        setFormData(prev => ({ ...prev, otp: '' }));
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

    if (formData.otp === generatedOtp) {
      setOtpVerified(true);
      setOtpMessage('✅ OTP verified successfully!');
      setOtpError('');
    } else {
      setOtpError('❌ Invalid OTP. Please try again.');
    }
  };

  // Log visit (save to database)
  const handleLogVisit = async () => {
    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }

    if (!otpVerified) {
      alert('Please verify OTP first');
      return;
    }

    if (!validateLocation()) {
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${baseURL}/visit-logs/save-visit-log`, {
        ...formData,
        salesperson_id: salespersonId,
        source_by: sourceBy,
        salesperson_latitude: location.latitude,
        salesperson_longitude: location.longitude,
        customer_latitude: selectedCustomer.latitude,
        customer_longitude: selectedCustomer.longitude,
        distance_meters: location.distance,
        location_verified: location.withinRange
      });

      if (response.data.success) {
        sessionStorage.setItem('visitLogCompleted', 'true');
        
        Swal.fire({
          title: 'Visit Logged Successfully!',
          text: 'What would you like to do next?',
          icon: 'success',
          showDenyButton: true,
          confirmButtonColor: '#f59e0b',
          denyButtonColor: '#3b82f6',
          confirmButtonText: 'Go to Dashboard',
          denyButtonText: 'Log Another Visit'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/salesperson-dashboard');
          }
        });

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
        setLocation({
          latitude: null,
          longitude: null,
          address: '',
          loading: false,
          error: null,
          withinRange: false,
          distance: null,
          lastUpdated: null
        });

        fetchVisitLogs();
        fetchStatistics();
        fetchScheduledVisitsAndUsers();
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
        Swal.fire({
          icon: 'success',
          title: 'Updated',
          text: 'Visit log updated successfully',
          timer: 1500,
          showConfirmButton: false
        });
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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`${baseURL}/visit-logs/delete/${visit_id}`);

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: 'Visit log deleted successfully',
            timer: 1500,
            showConfirmButton: false
          });
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

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format time only
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get today's date in readable format
  const getTodayDateFormatted = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Outcome options
  const outcomeOptions = [
    { value: 'Interested', label: 'Interested', color: 'success', icon: '👍' },
    { value: 'Not Interested', label: 'Not Interested', color: 'danger', icon: '👎' },
    { value: 'Follow Up', label: 'Follow Up', color: 'warning', icon: '🔄' },
    { value: 'Converted', label: 'Converted', color: 'primary', icon: '💰' },
    { value: 'Other', label: 'Other', color: 'secondary', icon: '📝' }
  ];

  // Render location status
  const renderLocationStatus = () => {
    if (location.loading) {
      return (
        <div className="vl-location-loading">
          <FaSpinner className="fa-spin" />
          <span>Getting your location...</span>
        </div>
      );
    }

    if (location.error) {
      return (
        <div className="vl-location-error">
          <FaExclamationTriangle />
          <span>{location.error}</span>
          <button onClick={getCurrentLocation} className="vl-retry-btn">
            <FaCrosshairs /> Retry
          </button>
        </div>
      );
    }

    if (!selectedCustomer) {
      return (
        <div className="vl-location-info">
          <FaMapMarkerAlt />
          <span>Select a customer to verify location</span>
        </div>
      );
    }

    if (!selectedCustomer?.latitude || !selectedCustomer?.longitude) {
      return (
        <div className="vl-location-warning">
          <FaExclamationTriangle />
          <span>Customer location not available</span>
        </div>
      );
    }

    if (!location.latitude || !location.longitude) {
      return (
        <div className="vl-location-warning">
          <FaExclamationTriangle />
          <span>Waiting for your location...</span>
          <button onClick={getCurrentLocation} className="vl-retry-btn">
            <FaCrosshairs /> Get Location
          </button>
        </div>
      );
    }

    return (
      <div className="vl-location-details">
        <p className="vl-address">
          <FaMapMarkerAlt /> {location.address}
        </p>
        <p className="vl-coordinates">
          Your Location: {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
        </p>
        <p className="vl-coordinates">
          Customer Location: {parseFloat(selectedCustomer.latitude).toFixed(6)}, {parseFloat(selectedCustomer.longitude).toFixed(6)}
        </p>
        {location.distance && (
          <div className={`vl-distance-indicator ${location.withinRange ? 'within-range' : 'outside-range'}`}>
            <FaCheckCircle className={location.withinRange ? 'text-success' : 'text-danger'} />
            <span>
              Distance: {location.distance} meters
              {location.withinRange
                ? ` ✓ (Within ${MAX_DISTANCE_METERS}m range)`
                : ` ✗ (Outside ${MAX_DISTANCE_METERS}m range)`}
            </span>
          </div>
        )}
        {!location.withinRange && location.latitude && (
          <div className="vl-location-warning-message">
            <FaExclamationTriangle />
            <span>You must be within {MAX_DISTANCE_METERS}m of the customer to log a visit</span>
            <button onClick={getCurrentLocation} className="vl-refresh-btn">
              <FaCrosshairs /> Refresh Location
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="vl-main-container" style={{ marginTop: '60px' }}>
        <Container className="vl-container">
          {/* Header Card */}
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
                    <span className="vl-header-stat-value">{getTodayDateFormatted()}</span>
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

          {/* Today's Scheduled Visits Section */}
          <Row className="vl-scheduled-visits-section mb-4">
            <Col md={12}>
              <div className="vl-scheduled-visits-card">
                <div className="vl-scheduled-visits-header">
                  <div className="vl-scheduled-visits-header-content">
                    <div className="vl-scheduled-visits-title-wrapper">
                      <FaCalendarDay className="vl-section-icon" />
                      <div>
                        <h4 className="vl-scheduled-visits-title">Today's Scheduled Visits</h4>
                        <p className="vl-scheduled-visits-subtitle">
                          {getTodayDateFormatted()} • {todayScheduledVisits.length} Visit{todayScheduledVisits.length !== 1 ? 's' : ''} Scheduled
                        </p>
                      </div>
                    </div>
                    <div className="vl-scheduled-visits-count-badge">
                      <span className="vl-count-number">{todayScheduledVisits.length}</span>
                      <span className="vl-count-label">Today's Visits</span>
                    </div>
                  </div>
                </div>

                {loadingScheduleData ? (
                  <div className="vl-schedule-loading">
                    <FaSpinner className="fa-spin" />
                    <span>Loading today's schedule...</span>
                  </div>
                ) : todayScheduledVisits.length > 0 ? (
                  <div className="vl-scheduled-visits-grid">
                    {todayScheduledVisits.map((visit, index) => {
                      const customerDetails = getUserDetailsByName(visit.customer_name);
                      const salesPersonDetails = getUserDetailsByName(visit.salesperson_name);
                      
                      return (
                        <div key={visit.id || index} className="vl-scheduled-visit-card">
                          <div className="vl-scheduled-visit-card-header">
                            <div className="vl-visit-time-badge">
                              <FaClock />
                              {formatTime(visit.scheduled_date)}
                            </div>
                            <div className={`vl-status-indicator vl-status-${visit.status}`}>
                              <span className="vl-status-dot"></span>
                              {visit.status}
                            </div>
                          </div>
                          
                          <div className="vl-scheduled-visit-body">
                            <div className="vl-visit-detail-section">
                              <h5 className="vl-detail-section-title">
                                <FaUser className="vl-detail-section-icon" /> Customer Details
                              </h5>
                              <div className="vl-detail-grid">
                                <div className="vl-detail-item-enhanced">
                                  <FaUser className="vl-detail-item-icon" />
                                  <div className="vl-detail-item-content">
                                    <span className="vl-detail-label">Full Name</span>
                                    <span className="vl-detail-value">{visit.customer_name}</span>
                                  </div>
                                </div>
                                {customerDetails && (
                                  <>
                                    <div className="vl-detail-item-enhanced">
                                      <FaEnvelope className="vl-detail-item-icon" />
                                      <div className="vl-detail-item-content">
                                        <span className="vl-detail-label">Email</span>
                                        <span className="vl-detail-value">{customerDetails.email_id}</span>
                                      </div>
                                    </div>
                                    {customerDetails.phone && (
                                      <div className="vl-detail-item-enhanced">
                                        <FaPhone className="vl-detail-item-icon" />
                                        <div className="vl-detail-item-content">
                                          <span className="vl-detail-label">Phone</span>
                                          <span className="vl-detail-value">{customerDetails.phone}</span>
                                        </div>
                                      </div>
                                    )}
                                    {customerDetails.company_name && (
                                      <div className="vl-detail-item-enhanced">
                                        <FaBuilding className="vl-detail-item-icon" />
                                        <div className="vl-detail-item-content">
                                          <span className="vl-detail-label">Company</span>
                                          <span className="vl-detail-value">{customerDetails.company_name}</span>
                                        </div>
                                      </div>
                                    )}
                                    <div className="vl-detail-item-enhanced">
                                      <FaCity className="vl-detail-item-icon" />
                                      <div className="vl-detail-item-content">
                                        <span className="vl-detail-label">Location</span>
                                        <span className="vl-detail-value">
                                          {[customerDetails.city, customerDetails.state, customerDetails.country]
                                            .filter(Boolean)
                                            .join(', ')}
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="vl-visit-divider-enhanced"></div>

                            <div className="vl-visit-detail-section">
                              <h5 className="vl-detail-section-title">
                                <FaUserCheck className="vl-detail-section-icon" /> Sales Person Details
                              </h5>
                              <div className="vl-detail-grid">
                                <div className="vl-detail-item-enhanced">
                                  <FaUser className="vl-detail-item-icon" />
                                  <div className="vl-detail-item-content">
                                    <span className="vl-detail-label">Full Name</span>
                                    <span className="vl-detail-value">{visit.salesperson_name}</span>
                                  </div>
                                </div>
                                {salesPersonDetails && (
                                  <>
                                    <div className="vl-detail-item-enhanced">
                                      <FaEnvelope className="vl-detail-item-icon" />
                                      <div className="vl-detail-item-content">
                                        <span className="vl-detail-label">Email</span>
                                        <span className="vl-detail-value">{salesPersonDetails.email_id}</span>
                                      </div>
                                    </div>
                                    {salesPersonDetails.phone && (
                                      <div className="vl-detail-item-enhanced">
                                        <FaPhone className="vl-detail-item-icon" />
                                        <div className="vl-detail-item-content">
                                          <span className="vl-detail-label">Phone</span>
                                          <span className="vl-detail-value">{salesPersonDetails.phone}</span>
                                        </div>
                                      </div>
                                    )}
                                    <div className="vl-detail-item-enhanced">
                                      <FaInfoCircle className="vl-detail-item-icon" />
                                      <div className="vl-detail-item-content">
                                        <span className="vl-detail-label">Designation</span>
                                        <span className="vl-detail-value">{salesPersonDetails.designation}</span>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="vl-visit-divider-enhanced"></div>

                            <div className="vl-visit-detail-section">
                              <h5 className="vl-detail-section-title">
                                <FaCalendarDay className="vl-detail-section-icon" /> Visit Schedule
                              </h5>
                              <div className="vl-detail-grid">
                                <div className="vl-detail-item-enhanced">
                                  <FaCalendarCheck className="vl-detail-item-icon" />
                                  <div className="vl-detail-item-content">
                                    <span className="vl-detail-label">Date & Time</span>
                                    <span className="vl-detail-value">{formatDate(visit.scheduled_date)}</span>
                                  </div>
                                </div>
                                <div className="vl-detail-item-enhanced">
                                  <FaInfoCircle className="vl-detail-item-icon" />
                                  <div className="vl-detail-item-content">
                                    <span className="vl-detail-label">Status</span>
                                    <span className={`vl-status-badge-enhanced vl-status-${visit.status}`}>
                                      {visit.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="vl-no-visits-container">
                    <div className="vl-no-visits-icon-wrapper">
                      <FaCalendarDay className="vl-no-visits-icon" />
                    </div>
                    <h5 className="vl-no-visits-title">No Visits Scheduled for Today</h5>
                    <p className="vl-no-visits-message">
                      You don't have any customer visits scheduled for today. 
                      Use the form below to log a new visit or check back later for updates.
                    </p>
                  </div>
                )}
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
                          {customer.full_name} {customer.latitude ? '📍' : '⚠️'}
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

            {/* Location Section */}
            <Col md={12} className="vl-location-section">
              <div className="vl-location-card">
                <div className="vl-location-header">
                  <FaMapMarkerAlt className="vl-location-icon" />
                  <h4>Location Verification</h4>
                  <button 
                    onClick={getCurrentLocation} 
                    className="vl-refresh-location-btn" 
                    title="Refresh Location" 
                    disabled={location.loading}
                  >
                    <FaCrosshairs spin={location.loading} />
                  </button>
                </div>
                {renderLocationStatus()}
              </div>
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
                      disabled={otpSent || otpVerified || !customerEmail || otpSending || !location.withinRange}
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
                disabled={!otpVerified || loading || !location.withinRange}
                className="vl-log-btn"
                title={!location.withinRange ? 'You must be within range of the customer' : ''}
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
                      <th>Distance</th>
                      <th>Notes</th>
                      <th>OTP Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && !visitLogs.length ? (
                      <tr>
                        <td colSpan="8" className="vl-loading-cell">Loading...</td>
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
                            <td>
                              {log.distance_meters ? (
                                <span className={log.distance_meters <= MAX_DISTANCE_METERS ? 'text-success' : 'text-danger'}>
                                  {log.distance_meters}m
                                </span>
                              ) : '-'}
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
                        <td colSpan="8" className="vl-empty-cell">No visit logs found</td>
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
              {viewingLog.distance_meters && (
                <div className="vl-detail-item">
                  <span className="vl-detail-label">Distance:</span>
                  <span className="vl-detail-value">{viewingLog.distance_meters} meters</span>
                </div>
              )}
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