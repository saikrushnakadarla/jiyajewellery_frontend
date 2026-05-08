// CustomerDashboard.jsx (Complete Fixed Version)
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "../../Pages/Navbar/CustomerNavbar";
import "./CustomerDashboard.css";
import Swal from 'sweetalert2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import EstimateStatusChart from "./EstimatePieChart";
import { FiFileText, FiClock, FiShoppingBag, FiXCircle, FiCamera, FiBell, FiCheck } from 'react-icons/fi';
import { Button, Dropdown, Badge, Toast, ToastContainer } from "react-bootstrap";
import baseURL from "../ApiUrl/NodeBaseURL";
import FaceCapture from "../../Modules/Admin/FaceCapture/FaceCapture";
import ScreenshotProtection from "../../../utils/ScreenshotProtection";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Dashboard() {
  const navigate = useNavigate();
  const protectionRef = useRef(null);
  const sseRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [estimatesCount, setEstimatesCount] = useState({
    pending: 0,
    ordered: 0,
    rejected: 0,
    total: 0
  });
  const [recentEstimates, setRecentEstimates] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [monthlyData, setMonthlyData] = useState({
    labels: [],
    estimates: [],
    orders: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [hasFaceRegistered, setHasFaceRegistered] = useState(false);
  const [showFacePrompt, setShowFacePrompt] = useState(false);

  // Notification states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  // Initialize screenshot protection
  useEffect(() => {
    protectionRef.current = new ScreenshotProtection();
    return () => {
      if (protectionRef.current) {
        protectionRef.current.destroy();
      }
      if (sseRef.current) {
        sseRef.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Connect to SSE for real-time notifications
  useEffect(() => {
    const setupNotifications = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const customerId = user.customer_id || user.id || user.userId || user.customerId;
      
      if (!customerId) return;
      
      // Connect to SSE
      const connectSSE = () => {
        try {
          const eventSource = new EventSource(`${baseURL}/api/customer-notifications/${customerId}`);
          
          eventSource.onopen = () => {
            console.log('Customer SSE connection established');
          };
          
          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              if (data.type === 'connected') {
                console.log('Connected to customer notification stream');
                return;
              }
              
              // Handle incoming notification
              if (data.title && data.message) {
                handleNewNotification(data);
              }
            } catch (error) {
              console.error('Error parsing SSE message:', error);
            }
          };
          
          eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            eventSource.close();
            
            // Reconnect after 5 seconds
            setTimeout(() => {
              connectSSE();
            }, 5000);
          };
          
          sseRef.current = eventSource;
        } catch (error) {
          console.error('Error setting up SSE:', error);
        }
      };
      
      connectSSE();
      
      // Fetch initial notifications
      await fetchNotifications(customerId);
      
      // Set up polling as backup (every 30 seconds)
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications(customerId, true);
      }, 30000);
    };
    
    setupNotifications();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const userData = localStorage.getItem("user");
        if (!userData) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        setCurrentUser(user);
        
        const customerId = user.customer_id || user.id || user.userId || user.customerId;
        
        if (!customerId) {
          console.error("Customer ID not found in user data");
          setLoading(false);
          return;
        }

        await checkFaceRegistration(customerId);

        const estimatesResponse = await fetch(`${baseURL}/get-unique-estimates`);
        if (!estimatesResponse.ok) {
          throw new Error(`HTTP error! status: ${estimatesResponse.status}`);
        }
        const estimates = await estimatesResponse.json();
        
        const customerEstimates = estimates.filter(estimate => 
          estimate.customer_id && estimate.customer_id.toString() === customerId.toString()
        );
        
        const processedEstimates = customerEstimates.map(estimate => {
          let status = estimate.estimate_status || estimate.status;
          
          if (!status) {
            if (estimate.source_by === "customer") {
              status = "Ordered";
            } else {
              status = "Pending";
            }
          }
          
          if (status === "Accepted") {
            status = "Ordered";
          }
          
          if (status === "Pending" && estimate.source_by === "customer") {
            status = "Ordered";
          }
          
          return {
            ...estimate,
            processed_status: status
          };
        });
        
        const pending = processedEstimates.filter(estimate => 
          estimate.processed_status === "Pending"
        ).length;
        
        const ordered = processedEstimates.filter(estimate => 
          estimate.processed_status === "Ordered"
        ).length;
        
        const rejected = processedEstimates.filter(estimate => 
          estimate.processed_status === "Rejected"
        ).length;
        
        setEstimatesCount({
          pending,
          ordered,
          rejected,
          total: customerEstimates.length
        });

        const monthlyStats = processMonthlyData(processedEstimates);
        setMonthlyData(monthlyStats);

        const recentEst = processedEstimates
          .sort((a, b) => {
            const dateA = new Date(a.date || a.created_at || 0);
            const dateB = new Date(b.date || b.created_at || 0);
            return dateB - dateA;
          })
          .slice(0, 5);
        setRecentEstimates(recentEst);

        const usersResponse = await fetch(`${baseURL}/api/users`);
        if (usersResponse.ok) {
          const allUsers = await usersResponse.json();
          const currentCustomer = allUsers.filter(u => 
            u.id && u.id.toString() === customerId.toString()
          );
          setRecentCustomers(currentCustomer);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle new real-time notification
  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    showToastNotification(notification);
  };

  // Fetch notifications from API
  const fetchNotifications = async (userId, silent = false) => {
    try {
      const response = await fetch(`${baseURL}/api/visit-logs-schedule/notifications/${userId}?userType=customer&limit=50`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (error) {
      if (!silent) {
        console.error('Error fetching notifications:', error);
      }
    }
  };

  // Show toast notification with queue
  const showToastNotification = (notification) => {
    const toastData = {
      id: Date.now(),
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setToastQueue(prev => [...prev, toastData]);
    
    if (!showToast) {
      setToastMessage(toastData);
      setShowToast(true);
    }
  };

  // Handle toast close and show next in queue
  const handleToastClose = () => {
    setShowToast(false);
    
    setToastQueue(prev => {
      const newQueue = prev.slice(1);
      if (newQueue.length > 0) {
        setTimeout(() => {
          setToastMessage(newQueue[0]);
          setShowToast(true);
        }, 300);
      }
      return newQueue;
    });
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${baseURL}/api/visit-logs-schedule/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const userData = localStorage.getItem("user");
    if (!userData) return;
    
    const user = JSON.parse(userData);
    const customerId = user.customer_id || user.id || user.userId || user.customerId;
    
    if (!customerId) return;
    
    try {
      const response = await fetch(`${baseURL}/api/visit-logs-schedule/notifications/mark-all-read/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: 'customer' })
      });
      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
        setUnreadCount(0);
        
        Swal.fire({
          icon: 'success',
          title: 'All notifications marked as read',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get notification icon
  const getNotificationIcon = (notification) => {
    const msg = notification.message || '';
    const type = notification.type || '';
    if (msg.includes('scheduled') || type === 'schedule') return '📅';
    if (msg.includes('Interested')) return '👍';
    if (msg.includes('Converted')) return '🎉';
    if (msg.includes('Completed')) return '✅';
    if (msg.includes('Cancelled')) return '❌';
    if (msg.includes('Updated')) return '🔄';
    return '🔔';
  };

  const checkFaceRegistration = async (userId) => {
    try {
      const response = await fetch(`${baseURL}/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        const hasFace = userData.face_descriptor && userData.face_descriptor !== 'null' && userData.face_descriptor !== null;
        setHasFaceRegistered(hasFace);
        
        if (!hasFace) {
          setShowFacePrompt(true);
          setTimeout(() => {
            showFaceRegistrationAlert();
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error checking face registration:", error);
    }
  };

  const showFaceRegistrationAlert = () => {
    Swal.fire({
      title: 'Face Login Setup',
      text: 'Would you like to set up Face Login for quick and secure access to your account?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Set Up Now',
      cancelButtonText: 'Remind Me Later',
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed) {
        setShowFaceCapture(true);
        setShowFacePrompt(false);
      } else {
        setShowFacePrompt(false);
        Swal.fire({
          title: 'Reminder Set',
          text: 'You can set up Face Login anytime from the dashboard by clicking the "Register Face" button.',
          icon: 'info',
          timer: 3000,
          showConfirmButton: true
        });
      }
    });
  };

  const handleFaceCaptured = async (faceData) => {
    try {
      const userData = localStorage.getItem("user");
      const user = JSON.parse(userData);
      const userId = user.customer_id || user.id || user.userId || user.customerId;

      const formData = new FormData();
      formData.append('face_descriptor', JSON.stringify(faceData.descriptor));
      
      const base64Image = faceData.image;
      const byteString = atob(base64Image.split(',')[1]);
      const mimeString = base64Image.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], `face-${userId}-${Date.now()}.jpg`, { type: mimeString });
      formData.append('face_photo', file);

      const response = await fetch(`${baseURL}/api/users/${userId}`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        setHasFaceRegistered(true);
        setShowFaceCapture(false);
        
        Swal.fire({
          icon: 'success',
          title: 'Face Registered Successfully!',
          text: 'You can now use Face Login for quick access to your account.',
          confirmButtonColor: '#3085d6',
          timer: 3000
        });
      } else {
        throw new Error('Failed to register face');
      }
    } catch (error) {
      console.error("Error saving face data:", error);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: 'Failed to register face. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleManualFaceRegistration = () => {
    setShowFaceCapture(true);
  };

  const processMonthlyData = (estimates) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = date.toLocaleString('default', { month: 'short' });
      months.push({
        label: monthYear,
        year: date.getFullYear(),
        month: date.getMonth(),
        estimates: 0,
        orders: 0
      });
    }

    estimates.forEach(estimate => {
      const estimateDate = new Date(estimate.date || estimate.created_at);
      if (isNaN(estimateDate.getTime())) return;

      const monthIndex = months.findIndex(m => 
        m.month === estimateDate.getMonth() && 
        m.year === estimateDate.getFullYear()
      );

      if (monthIndex !== -1) {
        months[monthIndex].estimates++;
        
        if (estimate.processed_status === "Ordered") {
          months[monthIndex].orders++;
        }
      }
    });

    return {
      labels: months.map(m => m.label),
      estimates: months.map(m => m.estimates),
      orders: months.map(m => m.orders)
    };
  };

  const handleCardClick = (path) => {
    navigate(path);
  };

  const handleEstimateClick = (estimateNumber) => {
    navigate(`/estimation/${estimateNumber}`);
  };

  const monthlyOverviewData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Estimates',
        data: monthlyData.estimates,
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Orders',
        data: monthlyData.orders,
        backgroundColor: '#22c55e',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 15,
          font: {
            size: 12,
          }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 10,
        cornerRadius: 6,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e2e8f0',
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
          color: '#64748b',
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
          }
        }
      }
    },
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return `₹${num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })}`;
  };

  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return 'status-badge pending';
      case 'ordered':
        return 'status-badge order';
      case 'rejected':
        return 'status-badge rejected';
      default:
        return 'status-badge';
    }
  };

  if (loading) {
    return (
      <>
        <Navbar/>
        <div className="container mt-5">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading dashboard data...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar/>
        <div className="container mt-5">
          <div className="alert alert-danger" role="alert">
            Error loading data: {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar/>
      
      {/* Toast Container for Notifications */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast 
          show={showToast} 
          onClose={handleToastClose} 
          delay={6000} 
          autohide
          style={{
            minWidth: '350px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb'
          }}
        >
          <Toast.Header 
            closeButton={false}
            style={{
              backgroundColor: toastMessage?.type === 'schedule' ? '#eff6ff' : '#f0fdf4',
              borderBottom: '1px solid #e5e7eb',
              borderRadius: '12px 12px 0 0',
              padding: '12px 16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <span style={{ fontSize: '20px' }}>
                {toastMessage?.type === 'schedule' ? '📅' : '🔔'}
              </span>
              <strong className="me-auto" style={{ fontSize: '14px' }}>
                {toastMessage?.title || 'Notification'}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <small style={{ color: '#6b7280' }}>{toastMessage?.time}</small>
              <button 
                onClick={handleToastClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#6b7280',
                  padding: '0 4px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
          </Toast.Header>
          <Toast.Body style={{ 
            padding: '16px',
            fontSize: '14px',
            color: '#374151',
            lineHeight: '1.5'
          }}>
            {toastMessage?.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="customer-dashboard-container screenshot-protected">
        {/* Welcome Message with Notification Bell */}
        {currentUser && (
          <div className="welcome-section">
            <div className="welcome-card">
              <div className="welcome-content">
                <h1>Welcome, {currentUser.full_name || currentUser.name || 'User'} Sir!</h1>
                <p>Here's what's happening with your estimates</p>
              </div>
              <div className="welcome-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Notification Bell with Dropdown */}
                <Dropdown 
                  show={notificationDropdownOpen} 
                  onToggle={setNotificationDropdownOpen}
                  align="end"
                >
                  <Dropdown.Toggle as="div" style={{ cursor: 'pointer' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <FiBell size={24} color="#fff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                      {unreadCount > 0 && (
                        <Badge 
                          pill 
                          bg="danger" 
                          style={{ 
                            position: 'absolute', 
                            top: '-10px', 
                            right: '-15px',
                            fontSize: '11px',
                            padding: '3px 7px',
                            animation: 'pulse 2s infinite',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                          }}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </div>
                  </Dropdown.Toggle>

                  <Dropdown.Menu 
                    style={{ 
                      width: '400px', 
                      maxHeight: '500px', 
                      overflowY: 'auto', 
                      padding: '0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ 
                      padding: '16px 20px', 
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px 12px 0 0',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiBell size={18} color="#3b82f6" />
                        <strong style={{ fontSize: '16px' }}>Notifications</strong>
                      </div>
                      {unreadCount > 0 && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={markAllAsRead}
                          style={{ 
                            fontSize: '13px', 
                            textDecoration: 'none',
                            color: '#3b82f6',
                            fontWeight: 500
                          }}
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>
                    
                    <div className="notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ 
                          padding: '60px 20px', 
                          textAlign: 'center', 
                          color: '#6b7280' 
                        }}>
                          <div style={{ marginBottom: '16px' }}>
                            <FiBell size={48} style={{ opacity: 0.3 }} />
                          </div>
                          <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#374151' }}>No notifications yet</p>
                          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>
                            You'll be notified about scheduled visits and updates here
                          </p>
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <Dropdown.Item 
                            key={notification.id}
                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                            style={{ 
                              padding: '16px 20px',
                              backgroundColor: notification.is_read ? 'white' : '#eff6ff',
                              borderBottom: '1px solid #f3f4f6',
                              borderLeft: notification.is_read ? '4px solid transparent' : '4px solid #3b82f6',
                              whiteSpace: 'normal',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '14px', width: '100%' }}>
                              <div style={{ 
                                fontSize: '24px', 
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {getNotificationIcon(notification)}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                  fontWeight: notification.is_read ? '500' : '600',
                                  marginBottom: '6px',
                                  fontSize: '14px',
                                  color: '#111827',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start'
                                }}>
                                  <span>{notification.title}</span>
                                  {!notification.is_read && (
                                    <span style={{ 
                                      width: '8px', 
                                      height: '8px', 
                                      backgroundColor: '#3b82f6', 
                                      borderRadius: '50%',
                                      flexShrink: 0,
                                      marginTop: '4px'
                                    }}></span>
                                  )}
                                </div>
                                <div style={{ 
                                  fontSize: '13px', 
                                  color: '#6b7280', 
                                  marginBottom: '6px',
                                  lineHeight: '1.4'
                                }}>
                                  {notification.message}
                                </div>
                                <div style={{ 
                                  fontSize: '11px', 
                                  color: '#9ca3af',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <span>🕐</span>
                                  {formatRelativeTime(notification.created_at)}
                                </div>
                              </div>
                            </div>
                          </Dropdown.Item>
                        ))
                      )}
                    </div>
                  </Dropdown.Menu>
                </Dropdown>

                {/* Face Registration Button */}
                <Button 
                  variant="light" 
                  className="face-register-btn"
                  onClick={handleManualFaceRegistration}
                  style={{
                    background: hasFaceRegistered ? '#10b981' : '#f59e0b',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  <FiCamera style={{ marginRight: '8px' }} />
                  {hasFaceRegistered ? 'Face Registered ✓' : 'Register Face for Login'}
                </Button>
                <Button 
                  variant="light" 
                  className="add-sale-btn"
                  onClick={() => navigate('/customer-estimates')}
                  style={{
                    background: 'white',
                    color: '#3b82f6',
                    border: 'none'
                  }}
                >
                  <i className="bi bi-plus-circle"></i>
                  Create New Estimate
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Face Registration Status Banner */}
        {!hasFaceRegistered && (
          <div className="face-registration-banner">
            <div className="banner-content">
              <FiCamera className="banner-icon" />
              <span>Enable Face Login for quick and secure access to your account!</span>
            </div>
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleManualFaceRegistration}
            >
              Set Up Now
            </Button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/customer-estimation")}
          >
            <div className="stat-content">
              <span className="stat-label">Total Estimates</span>
              <span className="stat-value">{estimatesCount.total}</span>
            </div>
            <div className="stat-icon blue">
              <FiFileText />
            </div>
          </div>

          <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/customer-estimation")}
          >
            <div className="stat-content">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{estimatesCount.pending}</span>
            </div>
            <div className="stat-icon orange">
              <FiClock />
            </div>
          </div>

          <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/customer-estimation")}
          >
            <div className="stat-content">
              <span className="stat-label">Ordered</span>
              <span className="stat-value">{estimatesCount.ordered}</span>
            </div>
            <div className="stat-icon blue-light">
              <FiShoppingBag />
            </div>
          </div>

          <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/customer-estimation")}
          >
            <div className="stat-content">
              <span className="stat-label">Rejected</span>
              <span className="stat-value">{estimatesCount.rejected}</span>
            </div>
            <div className="stat-icon red">
              <FiXCircle />
            </div>
          </div>
        </div>

        {/* Estimates Breakdown Section */}
        <div className="breakdown-section">
          <h3 className="section-title">Estimates Breakdown</h3>
          <div className="breakdown-grid">
            <div className="breakdown-card pending">
              <div className="breakdown-content">
                <span className="breakdown-label">Pending</span>
                <span className="breakdown-value">{estimatesCount.pending}</span>
                <span className="breakdown-percentage">
                  {estimatesCount.total > 0 
                    ? ((estimatesCount.pending / estimatesCount.total) * 100).toFixed(0) 
                    : 0}% of total
                </span>
              </div>
            </div>

            <div className="breakdown-card orders">
              <div className="breakdown-content">
                <span className="breakdown-label">Ordered</span>
                <span className="breakdown-value">{estimatesCount.ordered}</span>
                <span className="breakdown-percentage">
                  {estimatesCount.total > 0 
                    ? ((estimatesCount.ordered / estimatesCount.total) * 100).toFixed(0) 
                    : 0}% of total
                </span>
              </div>
            </div>

            <div className="breakdown-card rejected">
              <div className="breakdown-content">
                <span className="breakdown-label">Rejected</span>
                <span className="breakdown-value">{estimatesCount.rejected}</span>
                <span className="breakdown-percentage">
                  {estimatesCount.total > 0 
                    ? ((estimatesCount.rejected / estimatesCount.total) * 100).toFixed(0) 
                    : 0}% of total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-row">
            <div className="chart-container large">
              <div className="chart-header">
                <h3>Monthly Overview</h3>
                <span className="chart-subtitle">Estimates vs Orders (Last 6 months)</span>
              </div>
              <div className="chart-wrapper">
                {monthlyData.estimates.length > 0 ? (
                  <Bar data={monthlyOverviewData} options={barOptions} />
                ) : (
                  <div className="no-data-message">No monthly data available</div>
                )}
              </div>
            </div>

            <div className="chart-wrapper custom-chart-wrapper">
              {estimatesCount.total > 0 ? (
                <EstimateStatusChart 
                  pending={estimatesCount.pending}
                  ordered={estimatesCount.ordered}
                  rejected={estimatesCount.rejected}
                  total={estimatesCount.total}
                />
              ) : (
                <div className="no-data-message">No estimate data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Estimates Section */}
        <div className="recent-section">
          <div className="section-header">
            <h3>Recent Estimates</h3>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => navigate('/customer-estimation')}
            >
              View All
            </Button>
          </div>
          <div className="table-container">
            {recentEstimates.length > 0 ? (
              <table className="recent-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Estimate #</th>
                    <th>Order #</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEstimates.map((estimate, index) => (
                    <tr 
                      key={index} 
                      onClick={() => handleEstimateClick(estimate.estimate_number)}
                      className="clickable-row"
                    >
                      <td>{formatDate(estimate.date || estimate.created_at)}</td>
                      <td className="estimate-number">
                        {estimate.estimate_number || 'N/A'}
                      </td>
                      <td>
                        {estimate.order_number ? (
                          <strong style={{ color: '#17a2b8' }}>{estimate.order_number}</strong>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td className="amount">
                        {formatCurrency(estimate.net_amount || estimate.total_amount)}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(estimate.processed_status)}>
                          {estimate.processed_status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <i className="bi bi-file-text"></i>
                <p>No estimates found</p>
              </div>
            )}
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="recent-section">
          <div className="section-header">
            <h3>Profile Information</h3>
          </div>
          <div className="table-container">
            {recentCustomers.length > 0 ? (
              <table className="recent-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="customer-name">{customer.full_name || customer.name}</td>
                      <td>{customer.email_id || customer.email}</td>
                      <td>{customer.phone || customer.mobile || 'N/A'}</td>
                      <td>{customer.company_name || 'N/A'}</td>
                      <td>
                        <span className="status-badge accepted">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : currentUser ? (
              <table className="recent-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="customer-name">{currentUser.full_name || currentUser.name}</td>
                    <td>{currentUser.email_id || currentUser.email}</td>
                    <td>{currentUser.phone || currentUser.mobile || 'N/A'}</td>
                    <td>{currentUser.company_name || 'N/A'}</td>
                    <td>
                      <span className="status-badge accepted">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <i className="bi bi-person"></i>
                <p>No profile information available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Face Capture Modal */}
      {showFaceCapture && (
        <FaceCapture
          onFaceCaptured={handleFaceCaptured}
          onClose={() => setShowFaceCapture(false)}
          mode="register"
        />
      )}

      {/* Add pulse animation style */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .notification-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .notification-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .notification-list::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        
        .notification-list::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </>
  );
}

export default Dashboard;