import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "../../../Pages/Navbar/Navbar";
import "./Dashboard.css";
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
import { FiUsers, FiUserCheck, FiPackage, FiFileText } from 'react-icons/fi';
import { HiOutlineTrendingUp } from 'react-icons/hi';

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
  const [customersCount, setCustomersCount] = useState(124); // Default to match image
  const [salespersonsCount, setSalespersonsCount] = useState(18); // Default to match image
  const [productsCount, setProductsCount] = useState(356); // Default to match image
  const [estimatesCount, setEstimatesCount] = useState({
    pending: 0,
    accepted: 0,
    order: 0,
    rejected: 0,
    total: 143 // Default to match image
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Monthly data for charts matching the image
  const monthlyData = {
    labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
    estimates: [45, 52, 48, 45, 52, 58],
    orders: [28, 35, 38, 32, 42, 45],
    revenue: [45, 52, 48, 58, 62, 68]
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users data
        const usersResponse = await fetch("http://localhost:5000/api/users");
        if (!usersResponse.ok) {
          throw new Error(`HTTP error! status: ${usersResponse.status}`);
        }
        const users = await usersResponse.json();
        
        const customers = users.filter(user => 
          user.role && user.role.toLowerCase() === "customer"
        ).length;
        
        const salespersons = users.filter(user => 
          user.role && user.role.toLowerCase() === "salesman"
        ).length;
        
        setCustomersCount(customers);
        setSalespersonsCount(salespersons);

        // Fetch products data
        const productsResponse = await fetch("http://localhost:5000/get/products");
        if (!productsResponse.ok) {
          throw new Error(`HTTP error! status: ${productsResponse.status}`);
        }
        const products = await productsResponse.json();
        setProductsCount(products.length);

        // Fetch estimates data
        const estimatesResponse = await fetch("http://localhost:5000/get-unique-estimates");
        if (!estimatesResponse.ok) {
          throw new Error(`HTTP error! status: ${estimatesResponse.status}`);
        }
        const estimates = await estimatesResponse.json();
        
        const pending = estimates.filter(estimate => 
          estimate.estimate_status && estimate.estimate_status.toLowerCase() === "pending"
        ).length;
        
        const order = estimates.filter(estimate => 
          estimate.estimate_status && estimate.estimate_status.toLowerCase() === "order"
        ).length;
        
        const accepted = estimates.filter(estimate => 
          estimate.estimate_status && estimate.estimate_status.toLowerCase() === "accepted"
        ).length;
        
        const rejected = estimates.filter(estimate => 
          estimate.estimate_status && estimate.estimate_status.toLowerCase() === "rejected"
        ).length;
        
        setEstimatesCount({
          pending,
          accepted,
          order,
          rejected,
          total: estimates.length
        });
        
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

  // Bar chart configuration for Estimates vs Orders
  const estimatesVsOrdersData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Estimates',
        data: monthlyData.estimates,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: 'Orders',
        data: monthlyData.orders,
        backgroundColor: '#22c55e',
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      }
    ]
  };

  // Bar chart configuration for Revenue
  const revenueData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Revenue (in lakhs)',
        data: monthlyData.revenue,
        backgroundColor: '#f97316',
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
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
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
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
            weight: '500'
          }
        }
      }
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10
      }
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
      <div className="container-fluid dashboard-container">
        {/* Top Cards Row */}
        <div className="cards-grid">
          {/* Customers Card */}
          <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/customers")}
          >
            <div className="stat-card-content">
              <div className="stat-left">
                <span className="stat-label">Customers</span>
                <span className="stat-value">{customersCount}</span>
                <span className="stat-trend">
                  <HiOutlineTrendingUp className="trend-icon" />
                  +12% this month
                </span>
              </div>
              <div className="stat-icon">
                <FiUsers />
              </div>
            </div>
          </div>

          {/* Sales Persons Card */}
          <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/salespersontable")}
          >
            <div className="stat-card-content">
              <div className="stat-left">
                <span className="stat-label">Sales Persons</span>
                <span className="stat-value">{salespersonsCount}</span>
                <span className="stat-trend">
                  <HiOutlineTrendingUp className="trend-icon" />
                  +2 new
                </span>
              </div>
              <div className="stat-icon">
                <FiUserCheck />
              </div>
            </div>
          </div>

          {/* Products Card */}
          <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/productmaster")}
          >
            <div className="stat-card-content">
              <div className="stat-left">
                <span className="stat-label">Products</span>
                <span className="stat-value">{productsCount}</span>
                <span className="stat-trend">
                  <HiOutlineTrendingUp className="trend-icon" />
                  +8% this month
                </span>
              </div>
              <div className="stat-icon">
                <FiPackage />
              </div>
            </div>
          </div>

          {/* Total Estimates Card */}
          <div 
            className="stat-card clickable"
            onClick={() => handleCardClick("/estimation")}
          >
            <div className="stat-card-content">
              <div className="stat-left">
                <span className="stat-label">Total Estimates</span>
                <span className="stat-value">{estimatesCount.total}</span>
                <span className="stat-trend">
                  <HiOutlineTrendingUp className="trend-icon" />
                  +18% this month
                </span>
              </div>
              <div className="stat-icon">
                <FiFileText />
              </div>
            </div>
          </div>
        </div>

        {/* Rest of your component remains the same */}
        {/* Monthly Overview and Custom Pie Chart Row */}
        <div className="charts-row">
          <div className="chart-container large">
            <div className="chart-header">
              <h3>Monthly Overview</h3>
              <span className="chart-subtitle">Estimates vs Orders over 6 months</span>
            </div>
            <div className="chart-wrapper">
              <Bar data={estimatesVsOrdersData} options={barOptions} />
            </div>
          </div>
          
          <div className="chart-wrapper custom-chart-wrapper">
            {estimatesCount.total > 0 ? (
              <EstimateStatusChart />
            ) : (
              <div className="no-data-message">No data available</div>
            )}
          </div>
        </div>

        {/* Estimates Breakdown Cards */}
        <div className="estimates-breakdown">
          <div className="estimate-breakdown-card pending">
            <div className="estimate-breakdown-content">
              <span className="estimate-breakdown-label">Pending</span>
              <span className="estimate-breakdown-value">{estimatesCount.pending}</span>
              <span className="estimate-breakdown-percentage">
                {estimatesCount.total > 0 ? ((estimatesCount.pending / estimatesCount.total) * 100).toFixed(0) : 0}% of total
              </span>
            </div>
          </div>

          <div className="estimate-breakdown-card accepted">
            <div className="estimate-breakdown-content">
              <span className="estimate-breakdown-label">Accepted</span>
              <span className="estimate-breakdown-value">{estimatesCount.accepted}</span>
              <span className="estimate-breakdown-percentage">
                {estimatesCount.total > 0 ? ((estimatesCount.accepted / estimatesCount.total) * 100).toFixed(0) : 0}% of total
              </span>
            </div>
          </div>

          <div className="estimate-breakdown-card orders">
            <div className="estimate-breakdown-content">
              <span className="estimate-breakdown-label">Orders</span>
              <span className="estimate-breakdown-value">{estimatesCount.order}</span>
              <span className="estimate-breakdown-percentage">
                {estimatesCount.total > 0 ? ((estimatesCount.order / estimatesCount.total) * 100).toFixed(0) : 0}% of total
              </span>
            </div>
          </div>

          <div className="estimate-breakdown-card rejected">
            <div className="estimate-breakdown-content">
              <span className="estimate-breakdown-label">Rejected</span>
              <span className="estimate-breakdown-value">{estimatesCount.rejected}</span>
              <span className="estimate-breakdown-percentage">
                {estimatesCount.total > 0 ? ((estimatesCount.rejected / estimatesCount.total) * 100).toFixed(0) : 0}% of total
              </span>
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="revenue-chart-container">
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
                    font: {
                      size: 11
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;