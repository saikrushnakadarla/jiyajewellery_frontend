import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import SalesNavbar from "../../Pages/Navbar/SalesNavbar";
import { Card, Row, Col, Alert, Spinner, Table, Button, ProgressBar, Dropdown, Badge, Toast, ToastContainer } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./SalesDashboard.css";
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
import baseURL from "../ApiUrl/NodeBaseURL";
import baseURL2 from "../ApiUrl/NodeBaseURL2";
import { FiBell } from 'react-icons/fi';
import Swal from 'sweetalert2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function SalesPersonDashboard() {
  const navigate = useNavigate();
  const sseRef = useRef(null);
  const sseRef2 = useRef(null);
  const pollingIntervalRef = useRef(null);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCustomers: 0,
    totalEstimates: 0,
    pendingEstimates: 0,
    acceptedEstimates: 0,
    completedOrders: 0,
    rejectedEstimates: 0
  });
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentEstimates, setRecentEstimates] = useState([]);
  const [monthlyData, setMonthlyData] = useState({
    labels: [],
    estimates: [],
    orders: [],
    revenue: []
  });
  const [monthlyTarget] = useState(100000);

  // Notification states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  // Connect to SSE for real-time notifications from both servers
  useEffect(() => {
    const setupNotifications = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const salesmanId = user.id || user.userId;
      
      if (!salesmanId) return;
      
      // Connect to SSE from Jiya Jewellery (port 5000)
      const connectSSE = () => {
        try {
          const eventSource = new EventSource(`${baseURL}/api/salesman-notifications/${salesmanId}`);
          
          eventSource.onopen = () => {
            console.log('Salesman SSE connection established (port 5000)');
          };
          
          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              if (data.type === 'connected') {
                console.log('Connected to salesman notification stream (port 5000)');
                return;
              }
              
              if (data.title && data.message) {
                handleNewNotification(data);
              }
            } catch (error) {
              console.error('Error parsing SSE message:', error);
            }
          };
          
          eventSource.onerror = (error) => {
            console.error('SSE connection error (port 5000):', error);
            eventSource.close();
            setTimeout(() => {
              connectSSE();
            }, 5000);
          };
          
          sseRef.current = eventSource;
        } catch (error) {
          console.error('Error setting up SSE (port 5000):', error);
        }
      };
      
      // Connect to SSE from Jiya Jewellery ERP (port 5001)
      const connectSSE2 = () => {
        try {
          const eventSource = new EventSource(`${baseURL2}/api/salesman-notifications/${salesmanId}`);
          
          eventSource.onopen = () => {
            console.log('Salesman SSE connection established (port 5001)');
          };
          
          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              if (data.type === 'connected') {
                console.log('Connected to salesman notification stream (port 5001)');
                return;
              }
              
              if (data.title && data.message) {
                handleNewNotification(data);
              }
            } catch (error) {
              console.error('Error parsing SSE message:', error);
            }
          };
          
          eventSource.onerror = (error) => {
            console.error('SSE connection error (port 5001):', error);
            eventSource.close();
            setTimeout(() => {
              connectSSE2();
            }, 5000);
          };
          
          sseRef2.current = eventSource;
        } catch (error) {
          console.error('Error setting up SSE (port 5001):', error);
        }
      };
      
      connectSSE();
      connectSSE2();
      
      // Fetch initial notifications from both servers
      await fetchNotifications(salesmanId);
      
      // Set up polling as backup (every 30 seconds)
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications(salesmanId, true);
      }, 30000);
    };
    
    setupNotifications();
    
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
      if (sseRef2.current) {
        sseRef2.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Handle new real-time notification
  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    showToastNotification(notification);
  };

  // Fetch notifications from both APIs
  const fetchNotifications = async (userId, silent = false) => {
    try {
      // Fetch from Jiya Jewellery (port 5000)
      const response1 = await fetch(`${baseURL}/api/visit-logs-schedule/notifications/${userId}?userType=salesman&limit=50`);
      let notifications1 = [];
      if (response1.ok) {
        const data = await response1.json();
        if (data.success) {
          notifications1 = data.notifications || [];
        }
      }

      // Fetch from Jiya Jewellery ERP (port 5001)
      const response2 = await fetch(`${baseURL2}/api/visit-logs-warehouse-schedule/notifications/${userId}?userType=salesman&limit=50`);
      let notifications2 = [];
      if (response2.ok) {
        const data = await response2.json();
        if (data.success) {
          notifications2 = data.notifications || [];
        }
      }

      // Merge notifications from both sources
      const allNotifications = [...notifications1, ...notifications2];
      
      // Sort by created_at (newest first)
      allNotifications.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

      // Calculate total unread count
      const totalUnread = allNotifications.filter(n => !n.is_read).length;

      setNotifications(allNotifications);
      setUnreadCount(totalUnread);
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
      await fetch(`${baseURL}/api/visit-logs-schedule/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      await fetch(`${baseURL2}/api/visit-logs-warehouse-schedule/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const userData = localStorage.getItem("user");
    if (!userData) return;
    
    const user = JSON.parse(userData);
    const salesmanId = user.id || user.userId;
    
    if (!salesmanId) return;
    
    try {
      await fetch(`${baseURL}/api/visit-logs-schedule/notifications/mark-all-read/${salesmanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: 'salesman' })
      });
      await fetch(`${baseURL2}/api/visit-logs-warehouse-schedule/notifications/mark-all-read/${salesmanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: 'salesman' })
      });
      
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
      
      Swal.fire({
        icon: 'success',
        title: 'All notifications marked as read',
        timer: 1500,
        showConfirmButton: false
      });
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
    if (msg.includes('warehouse') || type === 'warehouse_schedule') return '📦';
    if (msg.includes('assigned') || msg.includes('Assigned')) return '👤';
    if (msg.includes('Completed')) return '✅';
    if (msg.includes('Cancelled')) return '❌';
    if (msg.includes('Updated')) return '🔄';
    return '🔔';
  };

  useEffect(() => {
    const fetchSalesPersonData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          navigate("/login");
          return;
        }

        const user = JSON.parse(userStr);
        setCurrentUser(user);
        const salesPersonId = user.id.toString();

        const [usersResponse, estimatesResponse] = await Promise.all([
          fetch(`${baseURL}/api/users`),
          fetch(`${baseURL}/get-unique-estimates`)
        ]);

        if (!usersResponse.ok || !estimatesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const allUsers = await usersResponse.json();
        const allEstimates = await estimatesResponse.json();

        // Filter customers (users with role "customer")
        const assignedCustomers = allUsers.filter(u =>
          u.role && u.role.toLowerCase() === "customer"
        );
        setRecentCustomers(assignedCustomers.slice(0, 5));

        // Filter estimates created by this salesperson
        const salespersonCreatedEstimates = allEstimates.filter(estimate =>
          estimate.salesperson_id === salesPersonId ||
          (estimate.source_by !== "customer" && estimate.salesperson_id === salesPersonId)
        );

        // Process estimates with normalized status
        const processedEstimates = salespersonCreatedEstimates.map(estimate => {
          let status = estimate.estimate_status || estimate.status || '';
          status = status.toLowerCase();

          // Normalize status values
          if (status === "order" || status === "ordered") {
            status = "ordered";
          }

          return {
            ...estimate,
            normalized_status: status
          };
        });

        // Calculate total sales
        const totalSales = processedEstimates.reduce((sum, estimate) =>
          sum + (parseFloat(estimate.net_amount) || parseFloat(estimate.total_price) || 0), 0
        );

        // Count estimates by status
        const pending = processedEstimates.filter(estimate =>
          estimate.normalized_status === "pending"
        ).length;

        const accepted = processedEstimates.filter(estimate =>
          estimate.normalized_status === "accepted"
        ).length;

        const completed = processedEstimates.filter(estimate =>
          estimate.normalized_status === "ordered"
        ).length;

        const rejected = processedEstimates.filter(estimate =>
          estimate.normalized_status === "rejected"
        ).length;

        // Process monthly data for charts
        const monthlyStats = processMonthlyData(processedEstimates);
        setMonthlyData(monthlyStats);

        // Get recent estimates
        const recentEst = processedEstimates
          .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
          .slice(0, 5);
        setRecentEstimates(recentEst);

        setStats({
          totalSales,
          totalCustomers: assignedCustomers.length,
          totalEstimates: salespersonCreatedEstimates.length,
          pendingEstimates: pending,
          acceptedEstimates: accepted,
          completedOrders: completed,
          rejectedEstimates: rejected
        });

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSalesPersonData();
  }, [navigate]);

  // Function to process monthly data from estimates
  const processMonthlyData = (estimates) => {
    const months = [];
    const now = new Date();

    // Generate last 6 months labels
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = date.toLocaleString('default', { month: 'short' });
      months.push({
        label: monthYear,
        year: date.getFullYear(),
        month: date.getMonth(),
        estimates: 0,
        orders: 0,
        revenue: 0
      });
    }

    // Count estimates, orders, and revenue per month
    estimates.forEach(estimate => {
      const estimateDate = new Date(estimate.date || estimate.created_at);
      if (isNaN(estimateDate.getTime())) return;

      const monthIndex = months.findIndex(m =>
        m.month === estimateDate.getMonth() &&
        m.year === estimateDate.getFullYear()
      );

      if (monthIndex !== -1) {
        months[monthIndex].estimates++;

        const amount = parseFloat(estimate.net_amount) || parseFloat(estimate.total_price) || 0;

        if (estimate.normalized_status === "ordered") {
          months[monthIndex].orders++;
          months[monthIndex].revenue += amount;
        }
      }
    });

    return {
      labels: months.map(m => m.label),
      estimates: months.map(m => m.estimates),
      orders: months.map(m => m.orders),
      revenue: months.map(m => m.revenue)
    };
  };

  const handleCardClick = (path) => {
    navigate(path);
  };

  const handleEstimateClick = (estimateNumber) => {
    navigate(`/estimation/${estimateNumber}`);
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-badge pending';
      case 'accepted':
        return 'status-badge accepted';
      case 'ordered':
      case 'order':
        return 'status-badge order';
      case 'rejected':
        return 'status-badge rejected';
      default:
        return 'status-badge';
    }
  };

  // Bar chart configuration for Monthly Overview
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

  // Bar chart configuration for Revenue Trend
  const revenueData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Revenue (₹)',
        data: monthlyData.revenue,
        backgroundColor: '#f97316',
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
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.label.includes('Revenue')) {
              label += '₹' + context.parsed.y.toLocaleString('en-IN');
            } else {
              label += context.parsed.y;
            }
            return label;
          }
        }
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
          },
          callback: function (value, index, values) {
            if (this.chart && this.chart.canvas && this.chart.canvas.id === 'revenue-chart') {
              return '₹' + value.toLocaleString('en-IN');
            }
            return value;
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

  const revenueBarOptions = {
    ...barOptions,
    scales: {
      ...barOptions.scales,
      y: {
        ...barOptions.scales.y,
        ticks: {
          ...barOptions.scales.y.ticks,
          callback: function (value) {
            return '₹' + value.toLocaleString('en-IN');
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <>
        <SalesNavbar />
        <div className="container mt-5" style={{ marginTop: '100px' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading your dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SalesNavbar />
        <div className="container mt-5" style={{ marginTop: '100px' }}>
          <Alert variant="danger">
            Error loading dashboard: {error}
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <SalesNavbar />
      
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
              backgroundColor: toastMessage?.type === 'schedule' || toastMessage?.type === 'warehouse_schedule' ? '#eff6ff' : '#f0fdf4',
              borderBottom: '1px solid #e5e7eb',
              borderRadius: '12px 12px 0 0',
              padding: '12px 16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <span style={{ fontSize: '20px' }}>
                {toastMessage?.type === 'schedule' ? '📅' : 
                 toastMessage?.type === 'warehouse_schedule' ? '📦' : '🔔'}
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

      <div className="sales-dashboard-container">
        {/* Welcome Section with Notification Bell */}
        {currentUser && (
          <div className="welcome-section">
            <div className="welcome-card">
              <div className="welcome-content">
                <h1>Welcome, {currentUser.full_name}!</h1>
                <p>Sales Performance Dashboard</p>
                <div className="welcome-badges">
                  <span className="badge">
                    <i className="bi bi-person-badge"></i>
                    {currentUser.designation || 'Sales Person'}
                  </span>
                  <span className="badge">
                    <i className="bi bi-building"></i>
                    {currentUser.company_name || 'Company'}
                  </span>
                  <span className="badge">
                    <i className="bi bi-envelope"></i>
                    {currentUser.email_id}
                  </span>
                </div>
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
                            You'll be notified about new visit assignments and updates here
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

                <Button
                  variant="light"
                  className="add-sale-btn"
                  onClick={() => navigate('/add-sale')}
                >
                  <i className="bi bi-plus-circle"></i>
                  Add New Sale
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="row" style={{marginBottom:'15px'}}>
          <div className="col-md-3">
            <div 
              className="stat-card clickable"
              onClick={() => handleCardClick("/sales-report")}
            >
              <div className="stat-content">
                <span className="stat-label">Total Sales</span>
                <span className="stat-value">₹{stats.totalSales.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div
              className="stat-card clickable"
              onClick={() => handleCardClick("/sales-report")}
            >
              <div className="stat-content">
                <span className="stat-label">Monthly Target</span>
                <span className="stat-value">₹{monthlyTarget.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div
              className="stat-card clickable"
              onClick={() => handleCardClick("/customers")}
            >
              <div className="stat-content">
                <span className="stat-label">Customers</span>
                <span className="stat-value">{stats.totalCustomers}</span>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div
              className="stat-card clickable"
              onClick={() => handleCardClick("/salesperson-estimation")}
            >
              <div className="stat-content">
                <span className="stat-label">Estimates</span>
                <span className="stat-value">{stats.totalEstimates}</span>
              </div>
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
                <span className="breakdown-value">{stats.pendingEstimates}</span>
                <span className="breakdown-percentage">
                  {stats.totalEstimates > 0 ? ((stats.pendingEstimates / stats.totalEstimates) * 100).toFixed(0) : 0}% of total
                </span>
              </div>
            </div>

            <div className="breakdown-card accepted">
              <div className="breakdown-content">
                <span className="breakdown-label">Accepted</span>
                <span className="breakdown-value">{stats.acceptedEstimates}</span>
                <span className="breakdown-percentage">
                  {stats.totalEstimates > 0 ? ((stats.acceptedEstimates / stats.totalEstimates) * 100).toFixed(0) : 0}% of total
                </span>
              </div>
            </div>

            <div className="breakdown-card orders">
              <div className="breakdown-content">
                <span className="breakdown-label">Orders</span>
                <span className="breakdown-value">{stats.completedOrders}</span>
                <span className="breakdown-percentage">
                  {stats.totalEstimates > 0 ? ((stats.completedOrders / stats.totalEstimates) * 100).toFixed(0) : 0}% of total
                </span>
              </div>
            </div>

            <div className="breakdown-card rejected">
              <div className="breakdown-content">
                <span className="breakdown-label">Rejected</span>
                <span className="breakdown-value">{stats.rejectedEstimates}</span>
                <span className="breakdown-percentage">
                  {stats.totalEstimates > 0 ? ((stats.rejectedEstimates / stats.totalEstimates) * 100).toFixed(0) : 0}% of total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-row">
            {/* Monthly Overview Chart */}
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

            {/* Estimate Status Custom Chart */}
            <div className="chart-wrapper custom-chart-wrapper">
              {stats.totalEstimates > 0 ? (
                <EstimateStatusChart
                  pending={stats.pendingEstimates}
                  accepted={stats.acceptedEstimates}
                  ordered={stats.completedOrders}
                  rejected={stats.rejectedEstimates}
                  total={stats.totalEstimates}
                />
              ) : (
                <div className="no-data-message">No estimate data available</div>
              )}
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="chart-container full-width">
            <div className="chart-header">
              <h3>Revenue Trend</h3>
              <span className="chart-subtitle">Monthly revenue from orders (Last 6 months)</span>
            </div>
            <div className="chart-wrapper">
              {monthlyData.revenue.some(val => val > 0) ? (
                <Bar
                  id="revenue-chart"
                  data={revenueData}
                  options={revenueBarOptions}
                />
              ) : (
                <div className="no-data-message">No revenue data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Estimates Table */}
        <div className="recent-section">
          <div className="section-header">
            <h3>Recent Estimates</h3>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => navigate('/salesperson-estimation')}
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
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEstimates.map((estimate, index) => {
                    const date = estimate.date || estimate.created_at;
                    const formattedDate = date ? new Date(date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A';

                    return (
                      <tr
                        key={index}
                        onClick={() => handleEstimateClick(estimate.estimate_number)}
                        className="clickable-row"
                      >
                        <td>{formattedDate}</td>
                        <td className="estimate-number">
                          {estimate.estimate_number || `EST${(index + 1).toString().padStart(3, '0')}`}
                        </td>
                        <td>{estimate.customer_name || 'N/A'}</td>
                        <td className="amount">
                          {formatCurrency(estimate.net_amount || estimate.total_price)}
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(estimate.normalized_status)}>
                            {(estimate.normalized_status || 'PENDING').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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

        {/* Recent Customers Table */}
        <div className="recent-section">
          <div className="section-header">
            <h3>Recent Customers</h3>
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
                    <tr
                      key={customer.id}
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="clickable-row"
                    >
                      <td className="customer-name">{customer.full_name}</td>
                      <td>{customer.email_id}</td>
                      <td>{customer.phone || 'N/A'}</td>
                      <td>{customer.company_name || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${customer.status === 'approved' ? 'accepted' :
                          customer.status === 'pending' ? 'pending' : 'rejected'
                          }`}>
                          {customer.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <i className="bi bi-people"></i>
                <p>No customers found</p>
              </div>
            )}
          </div>
        </div>
      </div>

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

export default SalesPersonDashboard;