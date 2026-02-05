import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import SalesNavbar from "../../Pages/Navbar/SalesNavbar";
import { Card, Row, Col, Alert, Spinner, Table, Button, ProgressBar } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./SalesDashboard.css";

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
    completedOrders: 0
  });
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentEstimates, setRecentEstimates] = useState([]);
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

        const assignedCustomers = allUsers.filter(u => 
          u.role && u.role.toLowerCase() === "customer"
        );
        setRecentCustomers(assignedCustomers.slice(0, 5));

        const salespersonCreatedEstimates = allEstimates.filter(estimate => 
          estimate.salesperson_id === salesPersonId || 
          (estimate.source_by !== "customer" && estimate.salesperson_id === salesPersonId)
        );

        const totalSales = salespersonCreatedEstimates.reduce((sum, estimate) => 
          sum + (parseFloat(estimate.total_price) || 0), 0
        );

        const pending = salespersonCreatedEstimates.filter(estimate => 
          estimate.estimate_status && estimate.estimate_status.toLowerCase() === "pending"
        ).length;

        const accepted = salespersonCreatedEstimates.filter(estimate => 
          estimate.estimate_status && estimate.estimate_status.toLowerCase() === "accepted"
        ).length;

        const completed = salespersonCreatedEstimates.filter(estimate => 
          estimate.estimate_status && estimate.estimate_status.toLowerCase() === "order"
        ).length;

        const recentEst = salespersonCreatedEstimates
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setRecentEstimates(recentEst);

        setStats({
          totalSales,
          totalCustomers: assignedCustomers.length,
          totalEstimates: salespersonCreatedEstimates.length,
          pendingEstimates: pending,
          acceptedEstimates: accepted,
          completedOrders: completed
        });

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSalesPersonData();
  }, [navigate]);

  const calculateProgress = () => {
    return Math.min((stats.totalSales / monthlyTarget) * 100, 100);
  };

  const handleCardClick = (path) => {
    navigate(path);
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
      <div className="container mt-5 sales-dashboard-container">
        {/* Welcome Section */}
        {currentUser && (
          <div className="row mb-4">
            <div className="col-12" style={{marginTop: "-37px"}}>
              <div className="card shadow-sm border-0 bg-gradient-sales text-white sales-welcome-card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="card-title mb-1">Welcome, {currentUser.full_name}!</h3>
                      <p className="mb-0">Sales Performance Dashboard</p>
                      <div className="mt-2 d-flex flex-wrap">
                        <span className="badge bg-light text-dark me-2 mb-1">
                          <i className="bi bi-person-badge me-1"></i>{currentUser.designation || 'Sales Person'}
                        </span>
                        <span className="badge bg-light text-dark me-2 mb-1">
                          <i className="bi bi-building me-1"></i>{currentUser.company_name || 'Company'}
                        </span>
                        <span className="badge bg-light text-dark me-2 mb-1">
                          <i className="bi bi-envelope me-1"></i>{currentUser.email_id}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Button 
                        variant="light" 
                        className="fw-bold"
                        onClick={() => navigate('/add-sale')}
                      >
                        <i className="bi bi-plus-circle me-2"></i>Add New Sale
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <h2 className="mb-4 text-center text-primary fw-bold">Sales Dashboard</h2>
        
        {/* Stats Cards Section */}
        <div className="row">
          {/* Total Sales Card */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div 
              className="card sales-stats-card sales-total-sales-card shadow-sm text-center p-4 border-top border-4 border-primary clickable-card"
              onClick={() => handleCardClick("/sales-report")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body d-flex flex-column justify-content-between">
                <div>
                  <i className="bi bi-currency-rupee text-primary mb-3 sales-dashboard-icon"></i>
                  <h5 className="sales-card-title fw-semibold">Total Sales</h5>
                  <p className="display-4 fw-bold text-primary">₹{stats.totalSales.toLocaleString()}</p>
                
                </div>
                {/* <div className="mt-2">
                  <span className="badge bg-primary">View Report</span>
                </div> */}
              </div>
            </div>
          </div>

          {/* Target Progress Card */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div className="card sales-stats-card sales-target-card shadow-sm text-center p-4 border-top border-4 border-success">
              <div className="card-body d-flex flex-column justify-content-between">
                <div>
                  <i className="bi bi-bullseye text-success mb-3 sales-dashboard-icon"></i>
                  <h5 className="sales-card-title fw-semibold">Monthly Target</h5>
                  <p className="display-4 fw-bold text-success">₹{monthlyTarget.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Customers Card */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div 
              className="card sales-stats-card sales-customers-card shadow-sm text-center p-4 border-top border-4 border-info clickable-card"
              onClick={() => handleCardClick("/customers")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body d-flex flex-column justify-content-between">
                <div>
                  <i className="bi bi-people-fill text-info mb-3 sales-dashboard-icon"></i>
                  <h5 className="sales-card-title fw-semibold">Customers</h5>
                  <p className="display-4 fw-bold text-info">{stats.totalCustomers}</p>
                  {/* <p className="text-muted">Assigned customers</p> */}
                </div>
                {/* <div className="mt-2">
                  <span className="badge bg-info">Manage</span>
                </div> */}
              </div>
            </div>
          </div>

          {/* Total Estimates Card */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div 
              className="card sales-stats-card sales-estimates-card shadow-sm text-center p-4 border-top border-4 border-warning clickable-card"
              onClick={() => handleCardClick("/salesperson-estimation")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body d-flex flex-column justify-content-between">
                <div>
                  <i className="bi bi-file-earmark-text-fill text-warning mb-3 sales-dashboard-icon"></i>
                  <h5 className="sales-card-title fw-semibold">Estimates</h5>
                  <p className="display-4 fw-bold text-warning">{stats.totalEstimates}</p>
                  {/* <p className="text-muted">Total created</p> */}
                </div>
                {/* <div className="mt-2">
                  <span className="badge bg-warning text-dark">View All</span>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Estimates Breakdown - Updated to match image */}

       <div className="row mt-4">
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100 sales-estimate-breakdown-card">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-2">
                <h5 className="card-title mb-0">
                  <i className="bi bi-pie-chart me-2"></i>Estimates Breakdown
                </h5>
              </div>
              <div className="card-body p-2">
                <div className="row g-2">
              
                  <div className="col-6">
                    <div className="estimate-small-box bg-light rounded d-flex align-items-center p-2">
                      <div className="small-box-icon me-2">
                        <div className="small-icon-circle bg-warning-subtle d-flex align-items-center justify-content-center">
                          <i className="bi bi-clock-history text-warning"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h4 className="fw-bold text-warning mb-0">{stats.pendingEstimates}</h4>
                        <p className="small text-muted mb-0">Pending</p>
                        <p className="small text-muted mb-0 opacity-75">Awaiting approval</p>
                      </div>
                    </div>
                  </div>
                  
  
                  <div className="col-6">
                    <div className="estimate-small-box bg-light rounded d-flex align-items-center p-2">
                      <div className="small-box-icon me-2">
                        <div className="small-icon-circle bg-success-subtle d-flex align-items-center justify-content-center">
                          <i className="bi bi-check-circle text-success"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h4 className="fw-bold text-success mb-0">{stats.acceptedEstimates}</h4>
                        <p className="small text-muted mb-0">Accepted</p>
                        <p className="small text-muted mb-0 opacity-75">Approved estimates</p>
                      </div>
                    </div>
                  </div>
                  
        
                  <div className="col-6">
                    <div className="estimate-small-box bg-light rounded d-flex align-items-center p-2">
                      <div className="small-box-icon me-2">
                        <div className="small-icon-circle bg-primary-subtle d-flex align-items-center justify-content-center">
                          <i className="bi bi-cart-check text-primary"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h4 className="fw-bold text-primary mb-0">{stats.completedOrders}</h4>
                        <p className="small text-muted mb-0">Completed Orders</p>
                        <p className="small text-muted mb-0 opacity-75">Converted to orders</p>
                      </div>
                    </div>
                  </div>
                  
      
                  <div className="col-6">
                    <div className="estimate-small-box bg-info rounded d-flex align-items-center p-2 text-white">
                      <div className="small-box-icon me-2">
                        <div className="small-icon-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center">
                          <i className="bi bi-graph-up"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h4 className="fw-bold mb-0">
                          {stats.totalEstimates > 0 ? 
                            Math.round(((stats.acceptedEstimates + stats.completedOrders) / stats.totalEstimates) * 100) : 0}%
                        </h4>
                        <p className="small mb-0 opacity-75">Conversion Rate</p>
                        <p className="small mb-0 opacity-75">Success rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

  
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100 sales-recent-estimates-card">
              <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center py-2">
                <h5 className="card-title mb-0">
                  <i className="bi bi-clock-history me-2"></i>Recent Estimates
                </h5>
                <Button 
                  variant="outline-dark" 
                  size="sm"
                  onClick={() => navigate('/estimation')}
                  className="py-1 px-2"
                >
                  View All
                </Button>
              </div>
              <div className="card-body p-0">
                {recentEstimates.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-borderless mb-0">
                      <thead>
                        <tr className="border-bottom">
                          <th className="text-muted fw-normal small py-2">Estimated #</th>
                          <th className="text-muted fw-normal small py-2">Customer</th>
                          <th className="text-muted fw-normal small py-2">Amount</th>
                          <th className="text-muted fw-normal small py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentEstimates.map((estimate, index) => (
                          <tr 
                            key={index} 
                            className="border-bottom hover-row"
                            style={{ cursor: "pointer" }} 
                            onClick={() => handleCardClick(`/estimation/${estimate.estimate_id}`)}
                          >
                            <td className="py-2 fw-semibold">
                              {estimate.estimate_number || `EST${estimate.estimate_id?.toString().padStart(3, '0')}`}
                            </td>
                            <td className="py-2">{estimate.customer_name || 'N/A'}</td>
                            <td className="py-2 fw-bold">
                              ₹{(parseFloat(estimate.total_price) || 0).toLocaleString('en-IN', { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2 
                              })}
                            </td>
                            <td className="py-2">
                              <span className={`badge rounded-pill px-2 py-1 ${
                                estimate.estimate_status === 'pending' ? 'bg-warning text-dark' : 
                                estimate.estimate_status === 'accepted' ? 'bg-success' : 
                                estimate.estimate_status === 'order' ? 'bg-primary' : 'bg-secondary'
                              }`}>
                                {estimate.estimate_status?.toUpperCase() || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 py-3">
                    <i className="bi bi-file-text text-muted mb-2" style={{ fontSize: '1.5rem' }}></i>
                    <p className="text-muted small">No estimates found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div> 


        {/* Recent Customers */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow-sm sales-recent-customers-card">
              <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  <i className="bi bi-people me-2"></i>Recent Customers
                </h5>
                <Button 
                  variant="outline-light" 
                  size="sm"
                  onClick={() => navigate('/customers')}
                >
                  View All
                </Button>
              </div>
              <div className="card-body p-0">
                {recentCustomers.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0">Name</th>
                          <th className="border-0">Email</th>
                          <th className="border-0">Phone</th>
                          <th className="border-0">Company</th>
                          <th className="border-0">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentCustomers.map((customer) => (
                          <tr key={customer.id} className="border-top">
                            <td className="fw-semibold">{customer.full_name}</td>
                            <td>{customer.email_id}</td>
                            <td>{customer.phone || 'N/A'}</td>
                            <td>{customer.company_name || 'N/A'}</td>
                            <td>
                              <span className={`badge ${
                                customer.status === 'approved' ? 'bg-success' : 
                                customer.status === 'pending' ? 'bg-warning text-dark' : 'bg-secondary'
                              }`}>
                                {customer.status?.toUpperCase() || 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5">
                    <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted mt-3">No customers found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SalesPersonDashboard;