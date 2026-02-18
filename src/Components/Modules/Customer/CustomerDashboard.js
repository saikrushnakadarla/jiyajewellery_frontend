import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "../../Pages/Navbar/CustomerNavbar";
import "./CustomerDashboard.css";
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
import { FiFileText, FiClock, FiShoppingBag, FiXCircle } from 'react-icons/fi';
import { Button } from "react-bootstrap";

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
  const [currentUser, setCurrentUser] = useState(null);
  const [estimatesCount, setEstimatesCount] = useState({
    pending: 0,
    ordered: 0,
    rejected: 0,
    total: 0
  });
  const [recentEstimates, setRecentEstimates] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Monthly data for charts
  const monthlyData = {
    labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
    estimates: [45, 52, 48, 45, 52, 58],
    orders: [28, 35, 38, 32, 42, 45],
    revenue: [45, 52, 48, 58, 62, 68]
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user from localStorage
        const userData = localStorage.getItem("user");
        if (!userData) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        setCurrentUser(user);
        
        // Try different possible field names for customer ID
        const customerId = user.customer_id || user.id || user.userId || user.customerId;
        
        if (!customerId) {
          console.error("Customer ID not found in user data");
          setLoading(false);
          return;
        }

        // Fetch estimates data
        const estimatesResponse = await fetch("http://localhost:5000/get-unique-estimates");
        if (!estimatesResponse.ok) {
          throw new Error(`HTTP error! status: ${estimatesResponse.status}`);
        }
        const estimates = await estimatesResponse.json();
        
        // Filter estimates for current customer only
        const customerEstimates = estimates.filter(estimate => 
          estimate.customer_id && estimate.customer_id.toString() === customerId.toString()
        );
        
        // Process estimates with the same logic as in EstimateTable
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
        
        // Count estimates by status for current customer
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

        // Get recent estimates (sorted by date, latest first)
        const recentEst = processedEstimates
          .sort((a, b) => {
            const dateA = new Date(a.date || a.created_at || 0);
            const dateB = new Date(b.date || b.created_at || 0);
            return dateB - dateA;
          })
          .slice(0, 5);
        setRecentEstimates(recentEst);

        // Fetch all users to get customer details
        const usersResponse = await fetch('http://localhost:5000/api/users');
        if (usersResponse.ok) {
          const allUsers = await usersResponse.json();
          // Filter to get only the current customer (since this is customer dashboard)
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

  const handleCardClick = (path) => {
    navigate(path);
  };

  const handleEstimateClick = (estimateNumber) => {
    // Navigate to estimate details or open modal
    // You can implement view details modal here if needed
    console.log('View estimate:', estimateNumber);
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
        max: 70,
        grid: {
          color: '#e2e8f0',
          drawBorder: false,
        },
        ticks: {
          stepSize: 15,
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
      <div className="customer-dashboard-container">
        {/* Welcome Message */}
        {currentUser && (
          <div className="welcome-section">
            <div className="welcome-card">
              <div className="welcome-content">
                <h1>Welcome, {currentUser.full_name || currentUser.name || 'User'}!</h1>
                <p>Here's what's happening with your estimates</p>
              </div>
              <Button 
                variant="light" 
                className="add-sale-btn"
                onClick={() => navigate('/customer-estimates')}
              >
                <i className="bi bi-plus-circle"></i>
                Create New Estimate
              </Button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="stats-grid">
          {/* Total Estimates Card */}
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

          {/* Pending Estimates Card */}
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

          {/* Ordered Card */}
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

          {/* Rejected Estimates Card */}
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
            {/* Monthly Overview Chart */}
            <div className="chart-container large">
              <div className="chart-header">
                <h3>Monthly Overview</h3>
                <span className="chart-subtitle">Estimates vs Orders over 6 months</span>
              </div>
              <div className="chart-wrapper">
                <Bar data={monthlyOverviewData} options={barOptions} />
              </div>
            </div>

            {/* Estimate Status Custom Chart */}
            <div className="chart-wrapper custom-chart-wrapper">
              {estimatesCount.total > 0 ? (
                <EstimateStatusChart />
              ) : (
                <div className="no-data">No data available</div>
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
                      style={{ cursor: 'pointer' }}
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
                        <span className={`status-badge ${
                          estimate.processed_status?.toLowerCase() === 'pending' ? 'pending' : 
                          estimate.processed_status?.toLowerCase() === 'ordered' ? 'order' : 
                          estimate.processed_status?.toLowerCase() === 'rejected' ? 'rejected' : ''
                        }`}>
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

        {/* Recent Customers Section */}
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
    </>
  );
}

export default Dashboard;