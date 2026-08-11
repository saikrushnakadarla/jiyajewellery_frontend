// CustomerDashboard.jsx - Fixed with proper API calls

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
import { Button, Dropdown, Badge, Toast, ToastContainer, Modal, Spinner, Form } from "react-bootstrap";
import baseURL from "../ApiUrl/NodeBaseURL";
import baseURL2 from "../ApiUrl/NodeBaseURL2";
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
  const sseRef2 = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Holds the resolved account_details.account_id used for notifications
  const customerAccountIdRef = useRef(null);
  // Holds the user's email for matching estimates
  const userEmailRef = useRef(null);

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

  // Combined Modal states (Salesperson + Visit Details)
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Reschedule Modal states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    reschedule_date: '',
    reschedule_notes: ''
  });
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Cache for salesperson details to avoid repeated API calls
  const salespersonCacheRef = useRef({});

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
      if (sseRef2.current) {
        sseRef2.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Resolve the account_details.account_id for the logged-in customer
  const resolveCustomerAccountId = async (user) => {
    try {
      const response = await fetch(`${baseURL2}/get/account-details`);
      if (!response.ok) return null;

      const accounts = await response.json();
      const customerAccounts = accounts.filter(
        (acc) => acc.account_group && acc.account_group.toUpperCase() === 'CUSTOMERS'
      );

      let matched = null;

      // Priority 1: customer_id match
      if (user.customer_id) {
        matched = customerAccounts.find(
          (acc) => acc.customer_id && acc.customer_id === user.customer_id
        );
      }

      // Priority 2: phone / mobile match
      if (!matched && user.phone) {
        matched = customerAccounts.find(
          (acc) => acc.mobile === user.phone || acc.phone === user.phone
        );
      }

      // Priority 3: email match
      if (!matched) {
        const email = user.email_id || user.email;
        if (email) {
          matched = customerAccounts.find((acc) => acc.email === email);
        }
      }

      if (!matched) {
        console.warn('⚠️ Could not resolve account_details.account_id for this customer.');
        return null;
      }

      console.log(`✅ Resolved customer account_id: ${matched.account_id}`);
      return matched.account_id;
    } catch (error) {
      console.error('❌ Error resolving customer account_id:', error);
      return null;
    }
  };

  // Fetch all salespersons from account_details
  const fetchAllSalespersons = async () => {
    try {
      const response = await fetch(`${baseURL2}/get/account-details`);
      if (!response.ok) {
        console.warn('⚠️ Failed to fetch account details');
        return [];
      }
      const accounts = await response.json();
      // Filter only SALESMAN group
      const salespersons = accounts.filter(
        (acc) => acc.account_group && acc.account_group.toUpperCase() === 'SALESMAN'
      );
      console.log(`✅ Found ${salespersons.length} salespersons`);
      return salespersons;
    } catch (error) {
      console.error('❌ Error fetching salespersons:', error);
      return [];
    }
  };

  // Connect to SSE for real-time notifications - FIXED to handle 404 errors gracefully
  useEffect(() => {
    const setupNotifications = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) return;

      const user = JSON.parse(userData);
      const accountId = await resolveCustomerAccountId(user);

      if (!accountId) return;

      customerAccountIdRef.current = accountId;

      // Pre-fetch salespersons for quick lookup
      const salespersons = await fetchAllSalespersons();
      // Build cache for quick name-based lookup
      salespersons.forEach(sp => {
        if (sp.account_name) {
          // Store multiple variations of the name for better matching
          const normalizedName = sp.account_name.toLowerCase().trim();
          salespersonCacheRef.current[normalizedName] = sp;
          // Also store without extra spaces
          const compactName = normalizedName.replace(/\s+/g, ' ');
          salespersonCacheRef.current[compactName] = sp;
        }
      });
      console.log('📦 Salesperson cache built with', Object.keys(salespersonCacheRef.current).length, 'entries');

      // Connect to SSE from Jiya Jewellery (port 5000) - MAIN SERVER
      const connectSSE = () => {
        try {
          const eventSource = new EventSource(`${baseURL}/api/customer-notifications/${accountId}`);

          eventSource.onopen = () => {
            console.log('✅ Customer SSE connection established (port 5000)');
          };

          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);

              if (data.type === 'connected') {
                console.log('✅ Connected to customer notification stream (port 5000)');
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
            console.warn('⚠️ SSE connection error (port 5000):', error);
            eventSource.close();
            setTimeout(() => {
              console.log('🔄 Reconnecting SSE (port 5000)...');
              connectSSE();
            }, 10000);
          };

          sseRef.current = eventSource;
        } catch (error) {
          console.error('Error setting up SSE (port 5000):', error);
        }
      };

      // Connect to SSE from Jiya Jewellery ERP (port 5001) - SECONDARY SERVER with fallback
      const connectSSE2 = () => {
        try {
          fetch(`${baseURL2}/api/customer-notifications/${accountId}`, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(3000)
          })
          .then(response => {
            if (response.ok) {
              const eventSource = new EventSource(`${baseURL2}/api/customer-notifications/${accountId}`);

              eventSource.onopen = () => {
                console.log('✅ Customer SSE connection established (port 5001)');
              };

              eventSource.onmessage = (event) => {
                try {
                  const data = JSON.parse(event.data);

                  if (data.type === 'connected') {
                    console.log('✅ Connected to customer notification stream (port 5001)');
                    return;
                  }

                  if (data.title && data.message) {
                    handleNewNotification(data);
                  }
                } catch (error) {
                  console.error('Error parsing SSE message (port 5001):', error);
                }
              };

              eventSource.onerror = (error) => {
                console.warn('⚠️ SSE connection error (port 5001):', error);
                eventSource.close();
                setTimeout(() => {
                  console.log('🔄 Reconnecting SSE (port 5001)...');
                  connectSSE2();
                }, 15000);
              };

              sseRef2.current = eventSource;
            } else {
              console.warn('⚠️ Server on port 5001 not responding, skipping SSE connection');
            }
          })
          .catch(() => {
            console.warn('⚠️ Server on port 5001 unreachable, skipping SSE connection');
          });
        } catch (error) {
          console.warn('⚠️ Error setting up SSE (port 5001):', error.message);
        }
      };

      connectSSE();
      connectSSE2();

      // Fetch initial notifications
      await fetchNotifications(accountId);

      // Polling backup (every 30 seconds)
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications(accountId, true);
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

  // Fetch dashboard data
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

        userEmailRef.current = user.email_id || user.email;

        const userId = user.id;
        const customerId = user.customer_id;

        console.log('🔍 User data:', { userId, customerId, email: userEmailRef.current });

        if (!userId) {
          console.error("User ID not found in user data");
          setLoading(false);
          return;
        }

        await checkFaceRegistration(userId);

        const estimatesResponse = await fetch(`${baseURL}/get-unique-estimates`);
        if (!estimatesResponse.ok) {
          throw new Error(`HTTP error! status: ${estimatesResponse.status}`);
        }
        const estimates = await estimatesResponse.json();

        console.log(`📊 Total estimates fetched: ${estimates.length}`);

        const customerEstimates = estimates.filter(estimate => {
          const estimateCustomerId = estimate.customer_id ? estimate.customer_id.toString() : '';
          const userIdStr = userId.toString();
          const customerIdStr = customerId ? customerId.toString() : '';

          const matchesById = estimateCustomerId === userIdStr;
          const matchesByCustomerId = customerIdStr && estimateCustomerId === customerIdStr;
          const matchesByEmail = userEmailRef.current && estimate.customer_name && 
            estimate.customer_name.toLowerCase().includes(user.full_name?.toLowerCase() || '');

          const custIdMatch = estimate.cust_id && estimate.cust_id.toString() === userIdStr;

          return matchesById || matchesByCustomerId || matchesByEmail || custIdMatch;
        });

        console.log(`📊 Found ${customerEstimates.length} estimates for user ${userId}`);

        if (customerEstimates.length === 0 && userEmailRef.current) {
          console.log('🔍 No estimates found by ID, trying to match by email...');
          const emailEstimates = estimates.filter(estimate => {
            if (estimate.customer_name && user.full_name) {
              return estimate.customer_name.toLowerCase().includes(user.full_name.toLowerCase()) ||
                     user.full_name.toLowerCase().includes(estimate.customer_name.toLowerCase());
            }
            return false;
          });
          if (emailEstimates.length > 0) {
            console.log(`📊 Found ${emailEstimates.length} estimates by name/email match`);
            customerEstimates.push(...emailEstimates);
          }
        }

        const uniqueEstimates = [];
        const seenIds = new Set();
        customerEstimates.forEach(est => {
          if (!seenIds.has(est.estimate_id)) {
            seenIds.add(est.estimate_id);
            uniqueEstimates.push(est);
          }
        });

        console.log(`📊 Unique estimates count: ${uniqueEstimates.length}`);

        const processedEstimates = uniqueEstimates.map(estimate => {
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

        console.log(`📊 Counts - Pending: ${pending}, Ordered: ${ordered}, Rejected: ${rejected}, Total: ${processedEstimates.length}`);

        setEstimatesCount({
          pending,
          ordered,
          rejected,
          total: processedEstimates.length
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
            u.id && u.id.toString() === userId.toString()
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

  // Email verification and account status check
  useEffect(() => {
    const checkAuthStatus = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) return;

      const user = JSON.parse(userData);
      const needsVerification = localStorage.getItem("needsEmailVerification");

      if (user.status !== 'approved') {
        localStorage.removeItem("user");
        localStorage.removeItem("needsEmailVerification");
        Swal.fire({
          icon: "warning",
          title: "Account Not Approved",
          text: "Your account has not been approved by admin yet. Please try again later.",
          confirmButtonText: "OK",
          allowOutsideClick: false
        }).then(() => {
          navigate("/");
        });
        return;
      }

      if (needsVerification === 'true' || user.email_verified === 'Not Verified') {
        navigate("/email-verification");
        return;
      }
    };

    checkAuthStatus();
  }, [navigate]);

  // Handle new real-time notification
  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    showToastNotification(notification);
  };

  // Fetch notifications from both APIs
  const fetchNotifications = async (userId, silent = false) => {
    try {
      let notifications1 = [];
      try {
        const response1 = await fetch(`${baseURL}/api/visit-logs-schedule/notifications/${userId}?userType=customer&limit=50`);
        if (response1.ok) {
          const data = await response1.json();
          if (data.success) {
            notifications1 = data.notifications || [];
          }
        }
      } catch (e) {
        if (!silent) console.warn('⚠️ Failed to fetch from port 5000:', e.message);
      }

      let notifications2 = [];
      try {
        const response2 = await fetch(`${baseURL2}/api/visit-logs-warehouse-schedule/notifications/${userId}?userType=customer&limit=50`, {
          signal: AbortSignal.timeout(5000)
        });
        if (response2.ok) {
          const data = await response2.json();
          if (data.success) {
            notifications2 = data.notifications || [];
          }
        }
      } catch (e) {
        if (!silent) console.warn('⚠️ Server on port 5001 not available:', e.message);
      }

      const allNotifications = [...notifications1, ...notifications2];

      allNotifications.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

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

  // Handle toast close
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
      }).catch(() => {});
      
      await fetch(`${baseURL2}/api/visit-logs-warehouse-schedule/notifications/${notificationId}/read`, {
        method: 'PUT'
      }).catch(() => {});

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
    const accountId = customerAccountIdRef.current;

    if (!accountId) {
      console.warn('Cannot mark all as read - customer account_id not resolved yet');
      return;
    }

    try {
      await fetch(`${baseURL}/api/visit-logs-schedule/notifications/mark-all-read/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: 'customer' })
      }).catch(() => {});
      
      await fetch(`${baseURL2}/api/visit-logs-warehouse-schedule/notifications/mark-all-read/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: 'customer' })
      }).catch(() => {});

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
    if (msg.includes('Interested')) return '👍';
    if (msg.includes('Converted')) return '🎉';
    if (msg.includes('Completed')) return '✅';
    if (msg.includes('Cancelled')) return '❌';
    if (msg.includes('Updated')) return '🔄';
    if (msg.includes('assigned') || msg.includes('Assigned')) return '👤';
    return '🔔';
  };

  // Extract photo URL from notification message
  const extractPhotoUrl = (message) => {
    if (!message) return null;
    const match = message.match(/\[Salesperson Photo:\s*([^\]]+)\]/);
    return match ? match[1] : null;
  };

  // Extract salesperson name from notification message
  const extractSalespersonName = (message) => {
    if (!message) return null;
    // Pattern: "Salesperson: [Name]" or "Salesperson Name: [Name]"
    const match = message.match(/Salesperson:\s*([^\n]+)/i) || 
                  message.match(/Salesperson Name:\s*([^\n]+)/i);
    if (match) {
      let name = match[1].trim();
      // Clean up the name - remove any extra text after it
      const cleanMatch = name.match(/^([a-zA-Z\s]+)/);
      return cleanMatch ? cleanMatch[1].trim() : name;
    }
    
    // Try to find name after "Salesperson:" in the message
    const lines = message.split('\n');
    for (const line of lines) {
      if (line.includes('Salesperson:')) {
        const parts = line.split('Salesperson:');
        if (parts.length > 1) {
          let name = parts[1].trim();
          const cleanMatch = name.match(/^([a-zA-Z\s]+)/);
          return cleanMatch ? cleanMatch[1].trim() : name;
        }
      }
    }
    return null;
  };

  // Get salesperson details from cache or fetch from API (without phone and email)
  const getSalespersonDetails = async (salespersonName) => {
    if (!salespersonName) return null;

    const normalizedName = salespersonName.toLowerCase().trim();
    const compactName = normalizedName.replace(/\s+/g, ' ');

    // Check cache first
    if (salespersonCacheRef.current[normalizedName]) {
      const cached = salespersonCacheRef.current[normalizedName];
      console.log(`✅ Found salesperson in cache: ${cached.account_name}`);
      return {
        name: cached.account_name,
        photo: null,
        role: 'Sales Representative',
        title: 'Salesperson Details',
        account_id: cached.account_id,
        account_group: cached.account_group
      };
    }

    if (salespersonCacheRef.current[compactName]) {
      const cached = salespersonCacheRef.current[compactName];
      console.log(`✅ Found salesperson in cache (compact): ${cached.account_name}`);
      return {
        name: cached.account_name,
        photo: null,
        role: 'Sales Representative',
        title: 'Salesperson Details',
        account_id: cached.account_id,
        account_group: cached.account_group
      };
    }

    // If not in cache, try to fetch from API
    console.log(`🔍 Salesperson "${salespersonName}" not in cache, fetching from API...`);
    try {
      const response = await fetch(`${baseURL2}/get/account-details`);
      if (response.ok) {
        const accounts = await response.json();
        const salespersons = accounts.filter(
          (acc) => acc.account_group && acc.account_group.toUpperCase() === 'SALESMAN'
        );

        // Try to find matching salesperson
        for (const sp of salespersons) {
          const spName = sp.account_name?.toLowerCase().trim() || '';
          const spCompact = spName.replace(/\s+/g, ' ');
          
          if (spName === normalizedName || spCompact === compactName ||
              spName.includes(normalizedName) || normalizedName.includes(spName)) {
            // Cache for future use
            salespersonCacheRef.current[normalizedName] = sp;
            salespersonCacheRef.current[compactName] = sp;
            
            console.log(`✅ Found salesperson: ${sp.account_name}`);
            return {
              name: sp.account_name,
              photo: null,
              role: 'Sales Representative',
              title: 'Salesperson Details',
              account_id: sp.account_id,
              account_group: sp.account_group
            };
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error fetching salesperson details from API:', error);
    }

    // Return basic info if no match found
    console.log(`⚠️ No salesperson found for: ${salespersonName}`);
    return {
      name: salespersonName,
      photo: null,
      role: 'Sales Representative',
      title: 'Salesperson Details'
    };
  };

  // ============ COMBINED DETAILS MODAL FUNCTIONS ============

  // Handle click on notification to show combined details
  // Handle click on notification to show combined details - FIXED
const handleViewDetails = async (notification) => {
  setIsLoadingDetails(true);
  setShowDetailsModal(true);
  
  try {
    const visitId = notification.related_id;
    const salespersonName = extractSalespersonName(notification.message);
    const photoUrl = extractPhotoUrl(notification.message);
    
    // Fetch salesperson details
    let salespersonDetails = null;
    if (salespersonName) {
      salespersonDetails = await getSalespersonDetails(salespersonName);
    }
    
    // Fetch visit details - try both ways
    let visitData = null;
    
    // First try: use the related_id directly (if it's a valid schedule ID)
    try {
      const response = await fetch(`${baseURL2}/api/visit-logs-warehouse-schedule/${visitId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success !== false && data.id) {
          visitData = data;
          console.log('✅ Found schedule by ID:', visitId);
        }
      }
    } catch (e) {
      console.warn('⚠️ Failed to fetch by ID:', e.message);
    }
    
    // Second try: If not found by ID, try to find by customer account ID (for backward compatibility)
    if (!visitData && customerAccountIdRef.current) {
      try {
        const response = await fetch(`${baseURL2}/api/visit-logs-warehouse-schedule/customer/${customerAccountIdRef.current}`);
        if (response.ok) {
          const schedules = await response.json();
          // Find the schedule that matches the barcode or date from the notification
          if (schedules && schedules.length > 0) {
            // Try to find matching schedule by barcode
            const barcodeMatch = notification.message.match(/scheduled:\s*([A-Z0-9]+)/);
            if (barcodeMatch) {
              const barcode = barcodeMatch[1];
              const matchedSchedule = schedules.find(s => s.barcode === barcode);
              if (matchedSchedule) {
                visitData = matchedSchedule;
                console.log('✅ Found schedule by barcode:', barcode);
              }
            }
            // If still not found, use the most recent schedule
            if (!visitData) {
              visitData = schedules[0];
              console.log('✅ Using most recent schedule:', visitData.id);
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Failed to fetch by customer:', e.message);
      }
    }
    
    // Build combined details
    let combinedDetails = {
      id: visitId || Date.now(),
      visit: {},
      salesperson: {}
    };
    
    if (visitData) {
      const scheduledDate = new Date(visitData.scheduled_date);
      const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      combinedDetails.visit = {
        id: visitData.id,
        scheduled_date: formattedDate,
        scheduled_time: formattedTime,
        warehouse_name: visitData.warehouse_name || 'Warehouse',
        barcode: visitData.barcode || 'N/A',
        salesman_name: visitData.salesman_name || 'Not assigned',
        customer_status: visitData.customer_status || 'Scheduled',
        reschedule_date: visitData.reschedule_date || null,
        reschedule_notes: visitData.reschedule_notes || null
      };
    } else {
      // Fallback: extract from notification
      const dateMatch = notification.message.match(/on\s+([A-Za-z]+,\s+[A-Za-z]+\s+\d+,\s+\d+)/);
      const timeMatch = notification.message.match(/at\s+(\d+:\d+\s+[AP]M)/);
      const warehouseMatch = notification.message.match(/at\s+([A-Z\s]+)\s+on/);
      const barcodeMatch = notification.message.match(/scheduled:\s*([A-Z0-9]+)/);
      
      combinedDetails.visit = {
        id: visitId || Date.now(),
        scheduled_date: dateMatch ? dateMatch[1] : 'N/A',
        scheduled_time: timeMatch ? timeMatch[1] : 'N/A',
        warehouse_name: warehouseMatch ? warehouseMatch[1].trim() : 'Warehouse',
        barcode: barcodeMatch ? barcodeMatch[1] : 'N/A',
        salesman_name: salespersonName || 'Not assigned',
        customer_status: 'Scheduled',
        reschedule_date: null,
        reschedule_notes: null
      };
    }
    
    // Add salesperson details
    if (salespersonDetails) {
      combinedDetails.salesperson = {
        name: salespersonDetails.name,
        photo: photoUrl || salespersonDetails.photo,
        role: salespersonDetails.role || 'Sales Representative'
      };
    } else {
      combinedDetails.salesperson = {
        name: salespersonName || 'Salesperson',
        photo: photoUrl,
        role: 'Sales Representative'
      };
    }
    
    setSelectedDetails(combinedDetails);
  } catch (error) {
    console.error('Error loading details:', error);
    // Fallback
    setSelectedDetails({
      id: notification.id || Date.now(),
      visit: {
        scheduled_date: 'N/A',
        scheduled_time: 'N/A',
        warehouse_name: 'Warehouse',
        barcode: 'N/A',
        salesman_name: 'Not assigned',
        customer_status: 'Scheduled',
        reschedule_date: null,
        reschedule_notes: null
      },
      salesperson: {
        name: 'Salesperson',
        photo: null,
        role: 'Sales Representative'
      }
    });
  } finally {
    setIsLoadingDetails(false);
  }
};

  // Handle customer status update (Available) - FIXED
  // Handle customer status update (Available) - FIXED
const handleCustomerAvailable = async () => {
  if (!selectedDetails?.visit?.id) return;
  
  const visitId = selectedDetails.visit.id;
  
  try {
    console.log(`📝 Marking visit ${visitId} as Available...`);
    
    const response = await fetch(`${baseURL2}/api/visit-logs-warehouse-schedule/${visitId}/customer-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_status: 'Available'
      })
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: 'You have been marked as available for the visit.',
          timer: 3000,
          showConfirmButton: false
        });
        
        // Update local state
        setSelectedDetails(prev => ({
          ...prev,
          visit: {
            ...prev.visit,
            customer_status: 'Available'
          }
        }));
        
        // Refresh notifications
        if (customerAccountIdRef.current) {
          fetchNotifications(customerAccountIdRef.current);
        }
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server responded with status ${response.status}`);
    }
  } catch (error) {
    console.error('Error updating status:', error);
    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      text: error.message || 'Failed to update your status. Please try again.'
    });
  }
};

  // Handle Not Available - Open reschedule modal
  const handleNotAvailable = () => {
    setShowDetailsModal(false);
    setShowRescheduleModal(true);
    
    // Pre-fill reschedule date with current date + 3 days as default
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    defaultDate.setHours(10, 0, 0, 0);
    
    const formattedDate = defaultDate.toISOString().slice(0, 16);
    setRescheduleData({
      reschedule_date: formattedDate,
      reschedule_notes: ''
    });
  };

  // Submit reschedule request - FIXED
  const handleRescheduleSubmit = async () => {
    if (!selectedDetails?.visit?.id) return;
    
    if (!rescheduleData.reschedule_date) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select a reschedule date and time.'
      });
      return;
    }
    
    setSubmittingReschedule(true);
    
    try {
      const visitId = selectedDetails.visit.id;
      console.log(`📝 Submitting reschedule for visit ${visitId}...`);
      
      const response = await fetch(`${baseURL2}/api/visit-logs-warehouse-schedule/${visitId}/not-available-reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reschedule_date: rescheduleData.reschedule_date,
          reschedule_notes: rescheduleData.reschedule_notes
        })
      });
      
      console.log('Reschedule response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Reschedule response data:', data);
        
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Reschedule Requested',
            text: 'Your reschedule request has been submitted. The salesperson will be notified.',
            timer: 3000,
            showConfirmButton: false
          });
          
          setShowRescheduleModal(false);
          
          // Update local state
          const rescheduleDateTime = new Date(rescheduleData.reschedule_date);
          const formattedReschedule = rescheduleDateTime.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          setSelectedDetails(prev => ({
            ...prev,
            visit: {
              ...prev.visit,
              customer_status: 'Not Available',
              reschedule_date: formattedReschedule
            }
          }));
          
          // Refresh notifications
          if (customerAccountIdRef.current) {
            fetchNotifications(customerAccountIdRef.current);
          }
          
          // Reset form
          setRescheduleData({
            reschedule_date: '',
            reschedule_notes: ''
          });
        } else {
          throw new Error(data.message || 'Failed to submit reschedule request');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error submitting reschedule:', error);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.message || 'Failed to submit reschedule request. Please try again.'
      });
    } finally {
      setSubmittingReschedule(false);
    }
  };

  // ============ END COMBINED DETAILS FUNCTIONS ============

  // Clean notification message (remove photo URL marker)
  const cleanNotificationMessage = (message) => {
    if (!message) return '';
    return message.replace(/\[Salesperson Photo:\s*[^\]]+\]/, '').trim();
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
      const userId = user.id;

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

      <div className="customer-dashboard-container screenshot-protected">
        {/* Welcome Message with Notification Bell */}
        {currentUser && (
          <div className="welcome-section">
            <div className="welcome-content">
              <h1>Welcome, {currentUser.full_name || currentUser.name || 'User'} Sir!</h1>
              <p>Here's what's happening with your estimates</p>
            </div>
            <div className="welcome-card">
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
                      width: '420px',
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
                        notifications.map(notification => {
                          const photoUrl = extractPhotoUrl(notification.message);
                          const cleanMessage = cleanNotificationMessage(notification.message);
                          const salespersonName = extractSalespersonName(notification.message);
                          const isWarehouseSchedule = notification.type === 'warehouse_schedule' || 
                            notification.title?.includes('Warehouse Visit') || 
                            notification.message?.includes('warehouse visit');

                          return (
                            <Dropdown.Item
                              key={notification.id}
                              onClick={() => {
                                if (!notification.is_read) {
                                  markAsRead(notification.id);
                                }
                                // Check if this is a warehouse schedule notification - open combined modal
                                if (isWarehouseSchedule) {
                                  handleViewDetails(notification);
                                }
                              }}
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
                                    {cleanMessage}
                                  </div>
                                  
                                  {/* Display salesman photo with click handler */}
                                  {(photoUrl || salespersonName) && (
                                    <div 
                                      style={{ 
                                        marginTop: '8px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px',
                                        padding: '6px 10px',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetails(notification);
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                                      }}
                                    >
                                      {photoUrl ? (
                                        <img 
                                          src={photoUrl} 
                                          alt="Salesperson" 
                                          style={{ 
                                            width: '40px', 
                                            height: '40px', 
                                            borderRadius: '50%', 
                                            objectFit: 'cover',
                                            border: '2px solid #3b82f6'
                                          }}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            const parent = e.target.parentElement;
                                            if (parent) {
                                              const fallback = document.createElement('span');
                                              fallback.textContent = '👤';
                                              fallback.style.fontSize = '24px';
                                              fallback.style.width = '40px';
                                              fallback.style.height = '40px';
                                              fallback.style.display = 'flex';
                                              fallback.style.alignItems = 'center';
                                              fallback.style.justifyContent = 'center';
                                              fallback.style.backgroundColor = '#d1d5db';
                                              fallback.style.borderRadius = '50%';
                                              parent.insertBefore(fallback, e.target);
                                              e.target.remove();
                                            }
                                          }}
                                        />
                                      ) : (
                                        <div style={{
                                          width: '40px',
                                          height: '40px',
                                          borderRadius: '50%',
                                          backgroundColor: '#3b82f6',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '20px',
                                          color: 'white',
                                          flexShrink: 0
                                        }}>
                                          👤
                                        </div>
                                      )}
                                      <div style={{ flex: 1 }}>
                                        <div style={{ 
                                          fontSize: '13px', 
                                          fontWeight: 600, 
                                          color: '#1f2937'
                                        }}>
                                          {salespersonName || 'Salesperson'}
                                        </div>
                                        <div style={{ 
                                          fontSize: '11px', 
                                          color: '#3b82f6',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}>
                                          <span>👆</span> Click to view details
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div style={{
                                    fontSize: '11px',
                                    color: '#9ca3af',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginTop: '4px'
                                  }}>
                                    <span>🕐</span>
                                    {formatRelativeTime(notification.created_at)}
                                  </div>
                                </div>
                              </div>
                            </Dropdown.Item>
                          );
                        })
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
        <div className="recent-section-footer">
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

      {/* Combined Details Modal - Salesperson + Visit Details */}
      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        centered
        size="lg"
        style={{ zIndex: 9999 }}
      >
        <Modal.Header closeButton style={{
          backgroundColor: '#f8fafc',
          borderBottom: '2px solid #e5e7eb',
          padding: '20px 24px'
        }}>
          <Modal.Title style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '20px',
            fontWeight: 600,
            color: '#1f2937'
          }}>
            <span style={{ fontSize: '28px' }}>📦</span>
            Warehouse Visit Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{
          padding: '24px',
          backgroundColor: 'white'
        }}>
          {isLoadingDetails ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spinner animation="border" variant="primary" />
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading details...</p>
            </div>
          ) : selectedDetails && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Salesperson Profile Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #3b82f6',
                  flexShrink: 0,
                  backgroundColor: '#e5e7eb'
                }}>
                  {selectedDetails.salesperson?.photo ? (
                    <img
                      src={selectedDetails.salesperson.photo}
                      alt={selectedDetails.salesperson.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div style="
                            width: 100%;
                            height: 100%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 40px;
                            color: #9ca3af;
                          ">👤</div>
                        `;
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '40px',
                      color: '#9ca3af'
                    }}>
                      👤
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#1f2937',
                    marginBottom: '2px'
                  }}>
                    {selectedDetails.salesperson?.name || 'Salesperson'}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '6px'
                  }}>
                    {selectedDetails.salesperson?.role || 'Sales Representative'}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      <span>✅</span> Verified
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      <span>⭐</span> Top Rated
                    </span>
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <div style={{
                  padding: '14px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, marginBottom: '2px' }}>
                    📅 Date
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: '#1f2937' }}>
                    {selectedDetails.visit?.scheduled_date || 'N/A'}
                  </div>
                </div>
                <div style={{
                  padding: '14px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, marginBottom: '2px' }}>
                    🕐 Time
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: '#1f2937' }}>
                    {selectedDetails.visit?.scheduled_time || 'N/A'}
                  </div>
                </div>
                <div style={{
                  padding: '14px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, marginBottom: '2px' }}>
                    🏢 Warehouse
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: '#1f2937' }}>
                    {selectedDetails.visit?.warehouse_name || 'N/A'}
                  </div>
                </div>
                <div style={{
                  padding: '14px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  {/* <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, marginBottom: '2px' }}>
                    🔢 Barcode
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: '#1f2937', fontFamily: 'monospace' }}>
                    {selectedDetails.visit?.barcode || 'N/A'}
                  </div> */}
                </div>
              </div>

              {/* Customer Status Section */}
              {/* Customer Status Section - FIXED to handle Pending status */}
<div style={{
  padding: '16px',
  backgroundColor: '#f8fafc',
  borderRadius: '10px',
  border: '1px solid #e5e7eb'
}}>
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  }}>
    <span style={{
      fontSize: '14px',
      fontWeight: 600,
      color: '#374151'
    }}>
      Your Status
    </span>
    <span style={{
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 500,
      backgroundColor: selectedDetails.visit?.customer_status === 'Available' ? '#d1fae5' :
                     selectedDetails.visit?.customer_status === 'Not Available' ? '#fee2e2' :
                     selectedDetails.visit?.customer_status === 'Pending' ? '#fef3c7' :
                     '#fef3c7',
      color: selectedDetails.visit?.customer_status === 'Available' ? '#065f46' :
             selectedDetails.visit?.customer_status === 'Not Available' ? '#991b1b' :
             selectedDetails.visit?.customer_status === 'Pending' ? '#92400e' :
             '#92400e'
    }}>
      {selectedDetails.visit?.customer_status || 'Pending'}
    </span>
  </div>
  
  {/* Show buttons when status is Pending OR Scheduled - FIXED */}
  {(selectedDetails.visit?.customer_status === 'Pending' || 
    selectedDetails.visit?.customer_status === 'Scheduled') && (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Button
        variant="success"
        onClick={handleCustomerAvailable}
        style={{
          flex: 1,
          padding: '10px',
          fontWeight: 500,
          backgroundColor: '#22c55e',
          border: 'none'
        }}
      >
        ✅ Available
      </Button>
      <Button
        variant="danger"
        onClick={handleNotAvailable}
        style={{
          flex: 1,
          padding: '10px',
          fontWeight: 500,
          backgroundColor: '#ef4444',
          border: 'none'
        }}
      >
        ❌ Not Available
      </Button>
    </div>
  )}
  
  {selectedDetails.visit?.customer_status === 'Available' && (
    <div style={{
      padding: '12px',
      backgroundColor: '#d1fae5',
      borderRadius: '8px',
      color: '#065f46',
      textAlign: 'center',
      fontSize: '14px'
    }}>
      ✅ You are marked as available for this visit. The salesperson will be notified.
    </div>
  )}
  
  {selectedDetails.visit?.customer_status === 'Not Available' && (
    <div style={{
      padding: '12px',
      backgroundColor: '#fee2e2',
      borderRadius: '8px',
      color: '#991b1b',
      fontSize: '14px'
    }}>
      <div>❌ You are marked as not available for this visit.</div>
      {selectedDetails.visit?.reschedule_date && (
        <div style={{ marginTop: '8px', fontSize: '13px' }}>
          Reschedule requested for: {selectedDetails.visit.reschedule_date}
        </div>
      )}
    </div>
  )}
</div>

              {/* Context Note */}
              <div style={{
                padding: '10px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
                color: '#6b7280'
              }}>
                <span style={{ fontWeight: 500, color: '#374151' }}>📌 Context: </span>
                Salesperson assigned for your warehouse visit
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <Button
            variant="secondary"
            onClick={() => setShowDetailsModal(false)}
            style={{
              backgroundColor: '#6b7280',
              border: 'none',
              padding: '8px 24px',
              fontWeight: 500
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        show={showRescheduleModal}
        onHide={() => setShowRescheduleModal(false)}
        centered
        size="md"
        style={{ zIndex: 9999 }}
      >
        <Modal.Header closeButton style={{
          backgroundColor: '#f8fafc',
          borderBottom: '2px solid #e5e7eb',
          padding: '20px 24px'
        }}>
          <Modal.Title style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '20px',
            fontWeight: 600,
            color: '#1f2937'
          }}>
            <span style={{ fontSize: '28px' }}>📅</span>
            Reschedule Visit
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{
          padding: '24px',
          backgroundColor: 'white'
        }}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 500 }}>
                Select New Date & Time <span style={{ color: '#ef4444' }}>*</span>
              </Form.Label>
              <Form.Control
                type="datetime-local"
                value={rescheduleData.reschedule_date}
                onChange={(e) => setRescheduleData(prev => ({
                  ...prev,
                  reschedule_date: e.target.value
                }))}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db'
                }}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: 500 }}>
                Additional Notes
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rescheduleData.reschedule_notes}
                onChange={(e) => setRescheduleData(prev => ({
                  ...prev,
                  reschedule_notes: e.target.value
                }))}
                placeholder="Please provide any additional information about the reschedule request..."
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  resize: 'vertical'
                }}
              />
            </Form.Group>
            
            <div style={{
              padding: '12px',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fcd34d',
              fontSize: '13px',
              color: '#92400e'
            }}>
              <span style={{ fontWeight: 600 }}>📌 Note:</span> The salesperson will be notified of your reschedule request. They will confirm the new time with you.
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <Button
            variant="secondary"
            onClick={() => setShowRescheduleModal(false)}
            style={{
              backgroundColor: '#6b7280',
              border: 'none',
              padding: '8px 20px',
              fontWeight: 500
            }}
            disabled={submittingReschedule}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRescheduleSubmit}
            style={{
              backgroundColor: '#3b82f6',
              border: 'none',
              padding: '8px 20px',
              fontWeight: 500
            }}
            disabled={submittingReschedule || !rescheduleData.reschedule_date}
          >
            {submittingReschedule ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              'Submit Reschedule Request'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

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

        /* Modal overlay fix */
        .modal-backdrop.show {
          opacity: 0.7;
        }
      `}</style>
    </>
  );
}

export default Dashboard;