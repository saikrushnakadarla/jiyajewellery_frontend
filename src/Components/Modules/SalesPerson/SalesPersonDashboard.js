import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import SalesNavbar from "../../Pages/Navbar/SalesNavbar";
import { Card, Row, Col, Alert, Spinner, Table, Button, ProgressBar } from "react-bootstrap";
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
          fetch('http://localhost:5000/api/users'),
          fetch('http://localhost:5000/get-unique-estimates')
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
        } else if (estimate.normalized_status === "accepted" || estimate.normalized_status === "pending") {
          // You can decide if accepted/pending estimates should contribute to revenue
          // For now, only ordered estimates contribute to revenue
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
    switch(status?.toLowerCase()) {
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
          label: function(context) {
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
          callback: function(value, index, values) {
            if (this.chart.canvas.id === 'revenue-chart') {
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
          callback: function(value) {
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
      <div className="sales-dashboard-container">
        {/* Welcome Section */}
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
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/sales-report")}
          >
            <div className="stat-content">
              <span className="stat-label">Total Sales</span>
              <span className="stat-value">₹{stats.totalSales.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/sales-report")}
          >
            <div className="stat-content">
              <span className="stat-label">Monthly Target</span>
              <span className="stat-value">₹{monthlyTarget.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/customers")}
          >
            <div className="stat-content">
              <span className="stat-label">Customers</span>
              <span className="stat-value">{stats.totalCustomers}</span>
            </div>
          </div>

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
                        <span className={`status-badge ${
                          customer.status === 'approved' ? 'accepted' : 
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
    </>
  );
}

export default SalesPersonDashboard;