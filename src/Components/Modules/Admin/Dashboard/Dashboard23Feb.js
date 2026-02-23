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
import { Button } from 'react-bootstrap';

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
  const [customersCount, setCustomersCount] = useState(124);
  const [salespersonsCount, setSalespersonsCount] = useState(18);
  const [productsCount, setProductsCount] = useState(356);
  const [estimatesCount, setEstimatesCount] = useState({
    pending: 0,
    accepted: 0,
    ordered: 0,
    rejected: 0,
    total: 0
  });
  const [recentEstimates, setRecentEstimates] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        );
        
        setCustomersCount(customers.length);
        
        const salespersons = users.filter(user => 
          user.role && user.role.toLowerCase() === "salesman"
        ).length;
        
        setSalespersonsCount(salespersons);
        
        // Set recent customers (last 5)
        setRecentCustomers(customers.slice(0, 5));

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
        
        // Calculate status counts
        const pending = estimates.filter(estimate => {
          const status = estimate.estimate_status || estimate.status;
          return status === "Pending";
        }).length;
        
        const ordered = estimates.filter(estimate => {
          const status = estimate.estimate_status || estimate.status;
          return status === "Ordered";
        }).length;
        
        const accepted = estimates.filter(estimate => {
          const status = estimate.estimate_status || estimate.status;
          return status === "Accepted";
        }).length;
        
        const rejected = estimates.filter(estimate => {
          const status = estimate.estimate_status || estimate.status;
          return status === "Rejected";
        }).length;
        
        setEstimatesCount({
          pending,
          accepted,
          ordered,
          rejected,
          total: estimates.length
        });

        // Set recent estimates (last 5, sorted by date)
        const sortedEstimates = [...estimates]
          .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
          .slice(0, 5);
        setRecentEstimates(sortedEstimates);
        
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

  const handleViewEstimate = (estimateNumber) => {
    navigate(`/estimation/${estimateNumber}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
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

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Pending':
        return 'status-badge pending';
      case 'Accepted':
        return 'status-badge accepted';
      case 'Ordered':
        return 'status-badge ordered';
      case 'Rejected':
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
                <span className="breakdown-value">{estimatesCount.ordered}</span>
                <span className="breakdown-percentage">
                  {estimatesCount.total > 0 ? ((estimatesCount.ordered / estimatesCount.total) * 100).toFixed(0) : 0}% of total
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

        {/* Recent Estimates Section */}
        <div className="recent-section">
          <div className="section-header">
            <h3>Recent Estimates</h3>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => navigate('/estimation')}
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
                  {recentEstimates.map((estimate, index) => (
                    <tr 
                      key={index} 
                      onClick={() => handleViewEstimate(estimate.estimate_number)}
                      className="clickable-row"
                    >
                      <td>{formatDate(estimate.date || estimate.created_at)}</td>
                      <td className="estimate-number">
                        {estimate.estimate_number}
                      </td>
                      <td>{estimate.customer_name || 'N/A'}</td>
                      <td className="amount">
                        {formatCurrency(estimate.net_amount || estimate.total_amount)}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(estimate.estimate_status || estimate.status)}>
                          {estimate.estimate_status || estimate.status || 'Pending'}
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
            <h3>Recent Customers</h3>
            {/* <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => navigate('/customers')}
            >
              View All
            </Button> */}
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

export default Dashboard;