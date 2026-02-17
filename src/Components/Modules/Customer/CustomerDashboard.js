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
import { FiFileText, FiClock, FiShoppingBag, FiXCircle, FiCheckCircle } from 'react-icons/fi';

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
    order: 0,
    accepted: 0,
    rejected: 0,
    total: 0
  });
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
    // Get current user from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }

    const fetchData = async () => {
      try {
        // Fetch estimates data
        const estimatesResponse = await fetch("http://localhost:5000/get-unique-estimates");
        if (!estimatesResponse.ok) {
          throw new Error(`HTTP error! status: ${estimatesResponse.status}`);
        }
        const estimates = await estimatesResponse.json();
        
        // Get current user ID from localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            const user = JSON.parse(userData);
            const customerId = user.id.toString();
            
            // Filter estimates for current customer only
            const customerEstimates = estimates.filter(estimate => 
              estimate.customer_id && estimate.customer_id.toString() === customerId
            );
            
            // Count estimates by status for current customer
            const pending = customerEstimates.filter(estimate => 
              estimate.estimate_status && estimate.estimate_status.toLowerCase() === "pending"
            ).length;
            
            const order = customerEstimates.filter(estimate => 
              estimate.estimate_status && estimate.estimate_status.toLowerCase() === "order"
            ).length;
            
            const accepted = customerEstimates.filter(estimate => 
              estimate.estimate_status && estimate.estimate_status.toLowerCase() === "accepted"
            ).length;
            
            const rejected = customerEstimates.filter(estimate => 
              estimate.estimate_status && estimate.estimate_status.toLowerCase() === "rejected"
            ).length;
            
            setEstimatesCount({
              pending,
              order,
              accepted,
              rejected,
              total: customerEstimates.length
            });
            
          } catch (err) {
            console.error("Error processing user data:", err);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = (path) => {
    navigate(path);
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
        label: 'Revenue',
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
                <h1>Welcome, {currentUser.full_name}!</h1>
                <p>Here's what's happening with your estimates</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards - Full Width Grid */}
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

          {/* Accepted Estimates Card */}
          {/* <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/customer-estimation")}
          >
            <div className="stat-icon green">
              <FiCheckCircle />
            </div>
            <div className="stat-content">
              <span className="stat-label">Accepted</span>
              <span className="stat-value">{estimatesCount.accepted}</span>
            </div>
          </div> */}

          {/* Orders Card */}
          <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/customer-estimation")}
          >
            <div className="stat-content">
              <span className="stat-label">Orders</span>
              <span className="stat-value">{estimatesCount.order}</span>
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

          {/* Revenue Trend Chart */}
          <div className="chart-container full-width">
            <div className="chart-header">
              <h3>Revenue Trend</h3>
              <span className="chart-subtitle">Monthly revenue growth (in lakhs)</span>
            </div>
            <div className="chart-wrapper">
              <Bar data={revenueData} options={{
                ...barOptions,
                scales: {
                  ...barOptions.scales,
                  y: {
                    ...barOptions.scales.y,
                    max: 80,
                    ticks: {
                      stepSize: 20,
                      color: '#64748b',
                    }
                  }
                }
              }} />
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
                  {estimatesCount.total > 0 ? ((estimatesCount.pending / estimatesCount.total) * 100).toFixed(0) : 0}% of total
                </span>
              </div>
            </div>

            <div className="breakdown-card accepted">
              <div className="breakdown-content">
                <span className="breakdown-label">Accepted</span>
                <span className="breakdown-value">{estimatesCount.accepted}</span>
                <span className="breakdown-percentage">
                  {estimatesCount.total > 0 ? ((estimatesCount.accepted / estimatesCount.total) * 100).toFixed(0) : 0}% of total
                </span>
              </div>
            </div>

            <div className="breakdown-card orders">
              <div className="breakdown-content">
                <span className="breakdown-label">Orders</span>
                <span className="breakdown-value">{estimatesCount.order}</span>
                <span className="breakdown-percentage">
                  {estimatesCount.total > 0 ? ((estimatesCount.order / estimatesCount.total) * 100).toFixed(0) : 0}% of total
                </span>
              </div>
            </div>

            <div className="breakdown-card rejected">
              <div className="breakdown-content">
                <span className="breakdown-label">Rejected</span>
                <span className="breakdown-value">{estimatesCount.rejected}</span>
                <span className="breakdown-percentage">
                  {estimatesCount.total > 0 ? ((estimatesCount.rejected / estimatesCount.total) * 100).toFixed(0) : 0}% of total
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;