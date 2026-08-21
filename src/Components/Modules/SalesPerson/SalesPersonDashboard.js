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
// ADD: Import the notification modal
import SalesmanNotificationModal from '../SalesPerson/SalesmanNotificationModal';

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
  
  // ADD: State for notification modal
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

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

  // State for Today's Sales Visits
  const [todayVisits, setTodayVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(true);

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
      // const connectSSE = () => {
      //   try {
      //     const eventSource = new EventSource(`${baseURL}/api/salesman-notifications/${salesmanId}`);
          
      //     eventSource.onopen = () => {
      //       console.log('Salesman SSE connection established (port 5000)');
      //     };
          
      //     eventSource.onmessage = (event) => {
      //       try {
      //         const data = JSON.parse(event.data);
              
      //         if (data.type === 'connected') {
      //           console.log('Connected to salesman notification stream (port 5000)');
      //           return;
      //         }
              
      //         if (data.title && data.message) {
      //           handleNewNotification(data);
      //         }
      //       } catch (error) {
      //         console.error('Error parsing SSE message:', error);
      //       }
      //     };
          
      //     eventSource.onerror = (error) => {
      //       console.error('SSE connection error (port 5000):', error);
      //       eventSource.close();
      //       setTimeout(() => {
      //         connectSSE();
      //       }, 5000);
      //     };
          
      //     sseRef.current = eventSource;
      //   } catch (error) {
      //     console.error('Error setting up SSE (port 5000):', error);
      //   }
      // };
      
      // Connect to SSE from Jiya Jewellery ERP (port 5001)
      // const connectSSE2 = () => {
      //   try {
      //     const eventSource = new EventSource(`${baseURL2}/api/salesman-notifications/${salesmanId}`);
          
      //     eventSource.onopen = () => {
      //       console.log('Salesman SSE connection established (port 5001)');
      //     };
          
      //     eventSource.onmessage = (event) => {
      //       try {
      //         const data = JSON.parse(event.data);
              
      //         if (data.type === 'connected') {
      //           console.log('Connected to salesman notification stream (port 5001)');
      //           return;
      //         }
              
      //         if (data.title && data.message) {
      //           handleNewNotification(data);
      //         }
      //       } catch (error) {
      //         console.error('Error parsing SSE message:', error);
      //       }
      //     };
          
      //     eventSource.onerror = (error) => {
      //       console.error('SSE connection error (port 5001):', error);
      //       eventSource.close();
      //       setTimeout(() => {
      //         connectSSE2();
      //       }, 5000);
      //     };
          
      //     sseRef2.current = eventSource;
      //   } catch (error) {
      //     console.error('Error setting up SSE (port 5001):', error);
      //   }
      // };
      
      // connectSSE();
      // connectSSE2();
      
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

    // Fetch pending assignments from assigned-salesman API
    // BUT skip if we already have notifications from the other endpoints
    // to avoid duplicates
    const response3 = await fetch(`${baseURL2}/api/assigned-salesman/get-pending-assignments?salesman_id=${userId}`);
    let assignmentNotifications = [];
    if (response3.ok) {
      const data = await response3.json();
      if (Array.isArray(data) && data.length > 0) {
        // Check if we already have these assignments in notifications1 or notifications2
        // to avoid duplicates
        const existingAssignmentNumbers = new Set();
        [...notifications1, ...notifications2].forEach(n => {
          const match = n.message?.match(/#(ASN\d+)/);
          if (match) {
            existingAssignmentNumbers.add(match[1]);
          }
        });
        
        // Only add assignments that don't already have notifications
        assignmentNotifications = data
          .filter(assignment => !existingAssignmentNumbers.has(assignment.assigned_number))
          .map(assignment => ({
            id: `assignment_${assignment.assigned_id}`,
            user_id: userId,
            user_type: 'salesman',
            title: `📦 New Assignment #${assignment.assigned_number}`,
            message: `You have ${assignment.total_items} item(s) assigned from ${assignment.from_stock_point_name || 'Stock Room'}. Please review and accept.`,
            type: 'salesman_assignment',
            related_id: assignment.assigned_id,
            is_read: false,
            created_at: assignment.created_at,
            _isAssignment: true,
            _assignmentData: assignment
          }));
      }
    }

    // Merge all notifications
    const allNotifications = [...notifications1, ...notifications2, ...assignmentNotifications];
    
    // Remove duplicates based on a unique key (title + message combination)
    const uniqueNotifications = [];
    const seenKeys = new Set();
    for (const notif of allNotifications) {
      // Create a unique key for each notification
      const key = `${notif.title || ''}|${notif.message || ''}|${notif.type || ''}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueNotifications.push(notif);
      }
    }
    
    // Sort by created_at (newest first)
    uniqueNotifications.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    // Calculate total unread count
    const totalUnread = uniqueNotifications.filter(n => !n.is_read).length;

    setNotifications(uniqueNotifications);
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
    if (msg.includes('assigned') || msg.includes('Assigned') || type === 'salesman_assignment') return '📋';
    if (msg.includes('Accepted')) return '✅';
    if (msg.includes('Rejected')) return '❌';
    if (msg.includes('Updated')) return '🔄';
    return '🔔';
  };

  // ADD: Handle notification click - open modal for assignment notifications
    // Handle notification click - open modal for assignment notifications
  // Handle notification click - open modal for assignment notifications
const handleNotificationClick = (notification) => {
  // Mark as read
  if (!notification.is_read) {
    markAsRead(notification.id);
  }
  
  // Check if this is a warehouse visit assignment notification
  // Based on the notification message pattern shown in your screenshot
  const isWarehouseAssignment = notification.title && 
    notification.title.includes('Warehouse Visit Assignment') ||
    notification.message && notification.message.includes('assigned to visit') &&
    notification.message.includes('at') &&
    notification.message.includes('item(s)');
  
  // Check if this is a regular salesman assignment
  const isSalesmanAssignment = notification.type === 'salesman_assignment' || 
                               notification._isAssignment === true ||
                               (notification.title && notification.title.includes('Assignment') && !isWarehouseAssignment);
  
  if (isWarehouseAssignment) {
    // For warehouse assignments, show the details in a nice modal or alert
    // Extract details from the notification message
    const message = notification.message || '';
    
    // Extract customer name
    const customerMatch = message.match(/assigned to visit ([^\s]+)/);
    const customerName = customerMatch ? customerMatch[1] : 'Unknown Customer';
    
    // Extract warehouse name
    const warehouseMatch = message.match(/at ([^\s]+(?: [^\s]+)*?)(?:\s+on|$)/);
    const warehouseName = warehouseMatch ? warehouseMatch[1] : 'Unknown Warehouse';
    
    // Extract date
    const dateMatch = message.match(/on ([\w]+, [\w]+ [\d]+, [\d]+ at [\d:]+ [APM]+)/);
    const dateStr = dateMatch ? dateMatch[1] : 'Unknown Date';
    
    // Extract items
    const itemsMatch = message.match(/(\d+) item\(s\): ([^)]+)/);
    const itemCount = itemsMatch ? itemsMatch[1] : '0';
    const items = itemsMatch ? itemsMatch[2].split(', ') : [];
    
    // Extract customer ID
    const customerIdMatch = message.match(/\(([^)]+)\)$/);
    const customerId = customerIdMatch ? customerIdMatch[1] : 'N/A';
    
    // Show the details in a nice modal using Swal
    Swal.fire({
      title: '📦 Warehouse Visit Assignment',
      html: `
        <div style="text-align: left; padding: 10px 0;">
          <div style="margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;">
            <p style="margin: 0 0 6px 0;"><strong>👤 Customer:</strong> ${customerName}</p>
            <p style="margin: 0 0 6px 0;"><strong>🆔 Customer ID:</strong> ${customerId}</p>
            <p style="margin: 0 0 6px 0;"><strong>🏪 Warehouse:</strong> ${warehouseName}</p>
            <p style="margin: 0 0 6px 0;"><strong>📅 Date & Time:</strong> ${dateStr}</p>
            <p style="margin: 0;"><strong>📦 Items (${itemCount}):</strong> ${items.join(', ')}</p>
          </div>
          <div style="padding: 8px 12px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>💡 Note:</strong> Please visit the warehouse at the scheduled time to collect these items.
            </p>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: '✅ Got it',
      confirmButtonColor: '#3b82f6',
      width: '550px'
    });
    return;
  }
  
  if (isSalesmanAssignment) {
    // Regular assignment - show the modal
    setSelectedNotification(notification);
    setShowNotificationModal(true);
  } else {
    // For other notifications, show a toast or alert
    Swal.fire({
      icon: 'info',
      title: notification.title || 'Notification',
      text: notification.message || '',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3b82f6'
    });
  }
};


  // ADD: Handle notification action complete (accept/reject)
  const handleNotificationActionComplete = (action) => {
    // Refresh notifications to update the list
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      const salesmanId = user.id || user.userId;
      if (salesmanId) {
        fetchNotifications(salesmanId);
      }
    }
    
    // Show success message based on action
    if (action === 'accepted') {
      Swal.fire({
        icon: 'success',
        title: 'Assignment Accepted!',
        text: 'You have successfully accepted the assignment.',
        timer: 2000,
        showConfirmButton: false
      });
    } else if (action === 'rejected') {
      Swal.fire({
        icon: 'info',
        title: 'Assignment Rejected',
        text: 'You have rejected the assignment.',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // Fetch Today's Sales Visits (unchanged)
  const fetchTodayVisits = async (salesmanId) => {
    try {
      setVisitsLoading(true);
      
      const scheduleResponse = await fetch(`${baseURL2}/api/visit-logs-warehouse-schedule`);
      if (!scheduleResponse.ok) {
        throw new Error('Failed to fetch schedule visits');
      }
      const scheduleData = await scheduleResponse.json();
      
      const accountResponse = await fetch(`${baseURL2}/get/account-details`);
      if (!accountResponse.ok) {
        throw new Error('Failed to fetch account details');
      }
      const accountData = await accountResponse.json();
      
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      const todayVisitsFiltered = scheduleData.filter(visit => {
        if (!visit.salesman_id || visit.salesman_id !== salesmanId) {
          return false;
        }
        if (visit.status !== 'scheduled') {
          return false;
        }
        if (!visit.scheduled_date) {
          return false;
        }
        const visitDate = new Date(visit.scheduled_date);
        return visitDate >= todayStart && visitDate <= todayEnd;
      });
      
      const groupedVisits = {};
      todayVisitsFiltered.forEach(visit => {
        const customer = accountData.find(acc => 
          acc.customer_id === visit.customer_id || 
          acc.account_id === visit.customer_account_id
        );
        
        const customerKey = visit.customer_account_id || visit.customer_id;
        if (!groupedVisits[customerKey]) {
          groupedVisits[customerKey] = {
            customer_account_id: visit.customer_account_id,
            customer_id: visit.customer_id,
            customer_name: customer?.account_name || visit.customer_name || 'Unknown Customer',
            customer_phone: customer?.phone || visit.customer_phone || 'N/A',
            customer_mobile: customer?.mobile || visit.customer_mobile || 'N/A',
            customer_email: customer?.email || visit.customer_email || 'N/A',
            address1: customer?.address1 || 'N/A',
            address2: customer?.address2 || '',
            city: customer?.city || 'N/A',
            state: customer?.state || 'N/A',
            pincode: customer?.pincode || 'N/A',
            account_name: customer?.account_name || visit.customer_name || 'Unknown Customer',
            visits: []
          };
        }
        groupedVisits[customerKey].visits.push({
          id: visit.id,
          warehouse_name: visit.warehouse_name,
          warehouse_location: visit.warehouse_location,
          barcode: visit.barcode,
          scheduled_date: visit.scheduled_date,
          status: visit.status,
          salesman_name: visit.salesman_name
        });
      });
      
      const groupedVisitsArray = Object.values(groupedVisits);
      setTodayVisits(groupedVisitsArray);
      
    } catch (error) {
      console.error('Error fetching today visits:', error);
      setTodayVisits([]);
    } finally {
      setVisitsLoading(false);
    }
  };

  // Rest of the useEffect and functions remain the same...
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

        await fetchTodayVisits(user.id);

        const [usersResponse, estimatesResponse] = await Promise.all([
          fetch(`${baseURL}/api/users`),
          fetch(`${baseURL}/get-unique-estimates`)
        ]);

        if (!usersResponse.ok || !estimatesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const allUsers = await usersResponse.json();
        const allEstimates = await estimatesResponse.json();

        const assignedCustomers = allUsers.filter(u =>
          u.role && u.role.toLowerCase() === "customer"
        );
        setRecentCustomers(assignedCustomers.slice(0, 5));

        const salespersonCreatedEstimates = allEstimates.filter(estimate =>
          estimate.salesperson_id === salesPersonId ||
          (estimate.source_by !== "customer" && estimate.salesperson_id === salesPersonId)
        );

        const processedEstimates = salespersonCreatedEstimates.map(estimate => {
          let status = estimate.estimate_status || estimate.status || '';
          status = status.toLowerCase();

          if (status === "order" || status === "ordered") {
            status = "ordered";
          }

          return {
            ...estimate,
            normalized_status: status
          };
        });

        const totalSales = processedEstimates.reduce((sum, estimate) =>
          sum + (parseFloat(estimate.net_amount) || parseFloat(estimate.total_price) || 0), 0
        );

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

        const monthlyStats = processMonthlyData(processedEstimates);
        setMonthlyData(monthlyStats);

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
        orders: 0,
        revenue: 0
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
      
      {/* Notification Modal */}
      <SalesmanNotificationModal
        show={showNotificationModal}
        onHide={() => {
          setShowNotificationModal(false);
          setSelectedNotification(null);
        }}
        notification={selectedNotification}
        onActionComplete={handleNotificationActionComplete}
      />
      
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
                 toastMessage?.type === 'warehouse_schedule' ? '📦' : 
                 toastMessage?.type === 'salesman_assignment' ? '📋' : '🔔'}
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
                            onClick={() => handleNotificationClick(notification)}
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
              </div>
            </div>
          </div>
        )}

        {/* TODAY'S SALES VISITS SECTION */}
        <div className="today-visits-section" style={{ marginBottom: '30px' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1e293b' }}>
                <span style={{ marginRight: '8px' }}>📅</span> Today's Sales Visits
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                {formatDate(new Date().toISOString())}
              </p>
            </div>
            <Badge bg="primary" style={{ fontSize: '14px', padding: '8px 16px' }}>
              {todayVisits.length} Customer{todayVisits.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {visitsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" size="sm" />
              <span className="ms-2">Loading visits...</span>
            </div>
          ) : todayVisits.length > 0 ? (
            <Row className="g-4">
              {todayVisits.map((customer, index) => (
                <Col key={index} lg={12} md={6} sm={12}>
                  <Card className="today-visit-card" style={{
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    height: '100%',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                  }}
                  >
                    <Card.Body style={{ padding: '0' }}>
                      {/* Customer Header */}
                      <div style={{ 
                        padding: '16px 20px 12px 20px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#fff',
                          flexShrink: 0
                        }}>
                          {customer.account_name?.charAt(0) || 'C'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h6 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                            {customer.account_name || 'Unknown Customer'}
                          </h6>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            <span>🆔</span> {customer.customer_id || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Customer Details - Compact Grid */}
                      <div style={{ padding: '12px 20px' }}>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '6px 16px',
                          fontSize: '18px'
                        }}>
                          {/* <div>
                            <span style={{ color: '#94a3b8' }}>📞</span>
                            <span style={{ marginLeft: '4px', color: '#334155', fontSize: '18px' }}>{customer.customer_phone || 'N/A'}</span>
                          </div> */}
                          {/* <div>
                            <span style={{ color: '#94a3b8' }}>📱</span>
                            <span style={{ marginLeft: '4px', color: '#334155', fontSize: '18px' }}>{customer.customer_mobile || 'N/A'}</span>
                          </div> */}
                          {/* <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: '#94a3b8' }}>✉️</span>
                            <span style={{ marginLeft: '4px', color: '#334155', fontSize: '18px' }}>{customer.customer_email || 'N/A'}</span>
                          </div> */}
                        <div style={{ gridColumn: '1 / -1' }}>
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
    <span style={{ color: '#94a3b8' }}>📍</span>
    <div style={{ color: '#334155' }}>
      {customer.address1 && customer.address1 !== 'N/A' && (
        <div>
          <span style={{ fontWeight: '600', color: '#1e293b' }}>Address 1: </span>
          {customer.address1}
        </div>
      )}
      {customer.address2 && customer.address2 !== 'N/A' && (
        <div>
          <span style={{ fontWeight: '600', color: '#1e293b' }}>Address 2: </span>
          {customer.address2}
        </div>
      )}
      {customer.city && customer.city !== 'N/A' && (
        <div>
          <span style={{ fontWeight: '600', color: '#1e293b' }}>City: </span>
          {customer.city}
        </div>
      )}
      {customer.state && customer.state !== 'N/A' && (
        <div>
          <span style={{ fontWeight: '600', color: '#1e293b' }}>State: </span>
          {customer.state}
        </div>
      )}
      {customer.pincode && customer.pincode !== 'N/A' && (
        <div>
          <span style={{ fontWeight: '600', color: '#1e293b' }}>Pincode: </span>
          {customer.pincode}
        </div>
      )}
      {(!customer.address1 || customer.address1 === 'N/A') && 
       !customer.address2 && 'No address available'}
    </div>
  </div>
</div>
                        </div>
                      </div>

                      {/* Visits Section */}
                      <div style={{ 
                        backgroundColor: '#f8fafc',
                        padding: '12px 20px',
                        borderTop: '1px solid #f1f5f9',
                        borderBottom: '1px solid #f1f5f9'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          {/* <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                            📋 {customer.visits.length} Visit{customer.visits.length > 1 ? 's' : ''}
                          </span> */}
                        </div>
                        {/* {customer.visits.map((visit, vIndex) => (
                          <div key={vIndex} style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr auto',
                            gap: '4px 12px',
                            padding: '6px 0',
                            borderBottom: vIndex < customer.visits.length - 1 ? '1px solid #e2e8f0' : 'none',
                            fontSize: '12px'
                          }}>
                            <span style={{ color: '#94a3b8' }}>🏪</span>
                            <span style={{ color: '#334155' }}>{visit.warehouse_name || 'N/A'}</span>
                            <span style={{ color: '#64748b' }}>{formatDateTime(visit.scheduled_date)}</span>
                            <span style={{ color: '#94a3b8' }}>📦</span>
                            <span style={{ color: '#3b82f6', fontWeight: 600, fontFamily: 'monospace' }}>
                              {visit.barcode || 'N/A'}
                            </span>
                            <span></span>
                          </div>
                        ))} */}
                      </div>

                      {/* Footer */}
                      <div style={{ 
                        padding: '10px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        color: '#94a3b8'
                      }}>
                        {/* <span>
                          <span style={{ marginRight: '4px' }}>🕐</span>
                          {customer.visits.length} Visit{customer.visits.length > 1 ? 's' : ''}
                        </span> */}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Card style={{ 
              border: '1px dashed #cbd5e1', 
              borderRadius: '16px',
              backgroundColor: '#f8fafc',
              padding: '40px 20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <h5 style={{ color: '#475569', marginBottom: '8px' }}>No Visits Scheduled Today</h5>
              <p style={{ color: '#94a3b8', margin: 0 }}>
                You have no warehouse visits scheduled for today. Enjoy your day! 🎉
              </p>
            </Card>
          )}
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
        </div>

        {/* Recent Estimates Table */}
        <div className="recent-section">
          <div className="section-header">
            <h3>Recent Estimates</h3>
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

        .today-visit-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
      `}</style>
    </>
  );
}

export default SalesPersonDashboard;