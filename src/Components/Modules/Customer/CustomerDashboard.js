import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "../../Pages/Navbar/CustomerNavbar";
import "./CustomerDashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [productsCount, setProductsCount] = useState(0);
  const [estimatesCount, setEstimatesCount] = useState({
    pending: 0,
    order: 0,
    accepted: 0,
    rejected: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <div className="container mt-5">
        {/* Welcome Message */}
        {currentUser && (
          <div className="row mb-4" style={{marginTop:"100px"}}>
            <div className="col-12">
              <div className="card shadow-sm border-0 bg-gradient-primary text-white customer-welcome-card">
                <div className="card-body">
                  <h3 className="card-title mb-1">Welcome, {currentUser.full_name}!</h3>
                  {/* <p className="mb-0">Here's your dashboard overview</p> */}
                  {/* <div className="mt-2 d-flex flex-wrap">
                    <span className="badge bg-light text-dark me-2 mb-1">
                      <i className="bi bi-envelope me-1"></i>{currentUser.email_id}
                    </span>
                    <span className="badge bg-light text-dark me-2 mb-1">
                      <i className="bi bi-person-circle me-1"></i>{currentUser.role}
                    </span>
                    {currentUser.company_name && (
                      <span className="badge bg-light text-dark mb-1">
                        <i className="bi bi-building me-1"></i>{currentUser.company_name}
                      </span>
                    )}
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        )}

        <h2 className="mb-4 text-center text-primary fw-bold">Customer Dashboard</h2>
        
        <div className="row">
          {/* Products Card */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div 
              className="card dashboard-card customer-products-card shadow-sm text-center p-4 border-top border-4 border-warning clickable-card"
              onClick={() => handleCardClick("/product-catalog")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body d-flex flex-column justify-content-between">
                <div>
                  <i className="bi bi-box-seam-fill text-warning mb-3 dashboard-icon"></i>
                  <h5 className="card-title fw-semibold">Products</h5>
                  <p className="display-4 fw-bold text-warning">{productsCount}</p>
                  <p className="text-muted">Available products</p>
                </div>
                <div className="mt-2">
                  <span className="badge bg-warning text-dark">Browse Products</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Estimates Card */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div 
              className="card dashboard-card customer-estimates-card shadow-sm text-center p-4 border-top border-4 border-info clickable-card"
              onClick={() => handleCardClick("/customer-estimation")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body d-flex flex-column justify-content-between">
                <div>
                  <i className="bi bi-file-earmark-text-fill text-info mb-3 dashboard-icon"></i>
                  <h5 className="card-title fw-semibold">My Estimates</h5>
                  <p className="display-4 fw-bold text-info">{estimatesCount.total}</p>
                  <p className="text-muted">All my estimates</p>
                </div>
                <div className="mt-2">
                  <span className="badge bg-info">View All</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Estimates Card */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div 
              className="card dashboard-card customer-pending-card shadow-sm text-center p-4 border-top border-4 border-warning clickable-card"
              onClick={() => handleCardClick("/customer-estimation")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body d-flex flex-column justify-content-between">
                <div>
                  <i className="bi bi-clock-fill text-warning mb-3 dashboard-icon"></i>
                  <h5 className="card-title fw-semibold">Pending</h5>
                  <p className="display-4 fw-bold text-warning">{estimatesCount.pending}</p>
                  <p className="text-muted">Awaiting approval</p>
                </div>
                <div className="mt-2">
                  <span className="badge bg-warning text-dark">View Pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Card */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div 
              className="card dashboard-card customer-orders-card shadow-sm text-center p-4 border-top border-4 border-primary clickable-card"
              onClick={() => handleCardClick("/customer-estimation")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body d-flex flex-column justify-content-between">
                <div>
                  <i className="bi bi-cart-check-fill text-primary mb-3 dashboard-icon"></i>
                  <h5 className="card-title fw-semibold">My Orders</h5>
                  <p className="display-4 fw-bold text-primary">{estimatesCount.order}</p>
                  <p className="text-muted">Confirmed orders</p>
                </div>
                <div className="mt-2">
                  <span className="badge bg-primary">View Orders</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estimates Breakdown Section */}
        <div className="row mt-4">
          <div className="col-12">
            <h4 className="mb-4 text-center text-secondary fw-bold">My Estimates Overview</h4>
            <div className="row">
              {/* Pending Estimates Progress Card */}
              <div className="col-md-6 mb-4">
                <div className="card shadow-sm h-100 customer-pending-progress-card">
                  <div className="card-header bg-warning text-white">
                    <h5 className="card-title mb-0">
                      <i className="bi bi-clock me-2"></i>Pending Estimates
                    </h5>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h2 className="fw-bold text-warning mb-0">{estimatesCount.pending}</h2>
                      <div className="text-end">
                        <small className="text-muted d-block">Awaiting approval</small>
                        <small className="text-muted">
                          {estimatesCount.total > 0 ? Math.round((estimatesCount.pending / estimatesCount.total) * 100) : 0}% of total
                        </small>
                      </div>
                    </div>
                    <div className="progress mb-3" style={{ height: "15px" }}>
                      <div 
                        className="progress-bar bg-warning" 
                        role="progressbar" 
                        style={{ width: `${estimatesCount.total > 0 ? (estimatesCount.pending / estimatesCount.total * 100) : 0}%` }}
                      ></div>
                    </div>
                    <p className="mt-auto mb-0">
                      <small className="text-muted">
                        These estimates are currently under review by our team.
                      </small>
                    </p>
                  </div>
                </div>
              </div>

              {/* Orders Progress Card */}
              <div className="col-md-6 mb-4">
                <div className="card shadow-sm h-100 customer-orders-progress-card">
                  <div className="card-header bg-primary text-white">
                    <h5 className="card-title mb-0">
                      <i className="bi bi-cart-check me-2"></i>My Orders
                    </h5>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h2 className="fw-bold text-primary mb-0">{estimatesCount.order}</h2>
                      <div className="text-end">
                        <small className="text-muted d-block">Confirmed orders</small>
                        <small className="text-muted">
                          {estimatesCount.total > 0 ? Math.round((estimatesCount.order / estimatesCount.total) * 100) : 0}% of total
                        </small>
                      </div>
                    </div>
                    <div className="progress mb-3" style={{ height: "15px" }}>
                      <div 
                        className="progress-bar bg-primary" 
                        role="progressbar" 
                        style={{ width: `${estimatesCount.total > 0 ? (estimatesCount.order / estimatesCount.total * 100) : 0}%` }}
                      ></div>
                    </div>
                    <p className="mt-auto mb-0">
                      <small className="text-muted">
                        These are estimates that have been converted to confirmed orders.
                      </small>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Status Cards */}
        <div className="row mt-4">
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100 customer-accepted-card">
              <div className="card-header bg-success text-white">
                <h5 className="card-title mb-0">
                  <i className="bi bi-check-circle me-2"></i>Accepted Estimates
                </h5>
              </div>
              <div className="card-body d-flex flex-column justify-content-between text-center">
                <div>
                  <h2 className="fw-bold text-success customer-big-count">{estimatesCount.accepted}</h2>
                  <p className="text-muted">Approved by sales team</p>
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    Estimates approved by our sales team for your consideration.
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card shadow-sm h-100 customer-rejected-card">
              <div className="card-header bg-danger text-white">
                <h5 className="card-title mb-0">
                  <i className="bi bi-x-circle me-2"></i>Rejected Estimates
                </h5>
              </div>
              <div className="card-body d-flex flex-column justify-content-between text-center">
                <div>
                  <h2 className="fw-bold text-danger customer-big-count">{estimatesCount.rejected}</h2>
                  <p className="text-muted">Declined estimates</p>
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    Estimates that were not approved by our team.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow-sm customer-summary-card">
              <div className="card-header bg-secondary text-white">
                <h5 className="card-title mb-0">Quick Summary</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <ul className="list-group list-group-flush customer-summary-list">
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <i className="bi bi-box text-warning me-2"></i>
                          Available Products
                        </div>
                        <span className="badge bg-warning rounded-pill">{productsCount}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <i className="bi bi-file-text text-info me-2"></i>
                          Total Estimates
                        </div>
                        <span className="badge bg-info rounded-pill">{estimatesCount.total}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <i className="bi bi-clock text-warning me-2"></i>
                          Pending Review
                        </div>
                        <span className="badge bg-warning rounded-pill">{estimatesCount.pending}</span>
                      </li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <ul className="list-group list-group-flush customer-summary-list">
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <i className="bi bi-cart-check text-primary me-2"></i>
                          My Orders
                        </div>
                        <span className="badge bg-primary rounded-pill">{estimatesCount.order}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <i className="bi bi-check-circle text-success me-2"></i>
                          Accepted
                        </div>
                        <span className="badge bg-success rounded-pill">{estimatesCount.accepted}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <i className="bi bi-x-circle text-danger me-2"></i>
                          Rejected
                        </div>
                        <span className="badge bg-danger rounded-pill">{estimatesCount.rejected}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;