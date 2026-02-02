import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "../../../Pages/Navbar/Navbar";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [customersCount, setCustomersCount] = useState(0);
  const [salespersonsCount, setSalespersonsCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [estimatesCount, setEstimatesCount] = useState({
    pending: 0,
    accepted: 0,
    order: 0,
    rejected: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users data
        const usersResponse = await fetch("http://localhost:5000/api/users");
        if (!usersResponse.ok) {
          throw new Error(`HTTP error! status: ${usersResponse.status}`);
        }
        const users = await usersResponse.json();
        
        // Count users by role with case-insensitive matching
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
        
        // Count estimates by status with proper separation
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
        <h2 className="mb-4 text-center text-primary fw-bold">Admin Dashboard</h2>
        
        <div className="row">
          {/* Customers Card */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div 
              className="card dashboard-card shadow-sm text-center p-4 border-top border-4 border-primary clickable-card"
              onClick={() => handleCardClick("/customers")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body">
                <i className="bi bi-people-fill text-primary mb-3 dashboard-icon"></i>
                <h5 className="card-title fw-semibold">Customers</h5>
                <p className="display-4 fw-bold text-primary">{customersCount}</p>
                {/* <p className="text-muted">Total registered customers</p>
                <div className="mt-2">
                  <span className="badge bg-primary">Click to view</span>
                </div> */}
              </div>
            </div>
          </div>

          {/* Salespersons Card */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div 
              className="card dashboard-card shadow-sm text-center p-4 border-top border-4 border-success clickable-card"
              onClick={() => handleCardClick("/salespersontable")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body">
                <i className="bi bi-person-badge-fill text-success mb-3 dashboard-icon"></i>
                <h5 className="card-title fw-semibold">Salespersons</h5>
                <p className="display-4 fw-bold text-success">{salespersonsCount}</p>
                {/* <p className="text-muted">Active sales team</p>
                <div className="mt-2">
                  <span className="badge bg-success">Click to view</span>
                </div> */}
              </div>
            </div>
          </div>

          {/* Products Card */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div 
              className="card dashboard-card shadow-sm text-center p-4 border-top border-4 border-warning clickable-card"
              onClick={() => handleCardClick("/productmaster")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body">
                <i className="bi bi-box-seam-fill text-warning mb-3 dashboard-icon"></i>
                <h5 className="card-title fw-semibold">Products</h5>
                <p className="display-4 fw-bold text-warning">{productsCount}</p>
                {/* <p className="text-muted">Available products</p>
                <div className="mt-2">
                  <span className="badge bg-warning text-dark">Click to view</span>
                </div> */}
              </div>
            </div>
          </div>

          {/* Total Estimates Card */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div 
              className="card dashboard-card shadow-sm text-center p-4 border-top border-4 border-info clickable-card"
              onClick={() => handleCardClick("/estimation")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body">
                <i className="bi bi-file-earmark-text-fill text-info mb-3 dashboard-icon"></i>
                <h5 className="card-title fw-semibold">Total Estimates</h5>
                <p className="display-4 fw-bold text-info">{estimatesCount.total}</p>
                {/* <p className="text-muted">All estimates created</p>
                <div className="mt-2">
                  <span className="badge bg-info">Click to view</span>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Estimates Breakdown Section - Now as Cards */}
        <div className="row mt-4">
          <div className="col-12">
            <h4 className="mb-4 text-center text-secondary fw-bold">Estimates Overview</h4>
            <div className="row">
              {/* Pending Estimates Card */}
              <div className="col-md-6 col-lg-3 mb-4">
                <div className="card shadow-sm text-center p-4 border-top border-4 border-warning">
                  <div className="card-body">
                    <i className="bi bi-clock-fill text-warning mb-3 dashboard-icon"></i>
                    <h5 className="card-title fw-semibold">Pending</h5>
                    <p className="display-4 fw-bold text-warning">{estimatesCount.pending}</p>
                    <div className="progress mt-2" style={{ height: "10px" }}>
                      <div 
                        className="progress-bar bg-warning" 
                        role="progressbar" 
                        style={{ width: `${estimatesCount.total > 0 ? (estimatesCount.pending / estimatesCount.total * 100) : 0}%` }}
                      ></div>
                    </div>
                    <small className="text-muted d-block mt-2">
                      {estimatesCount.total > 0 ? Math.round((estimatesCount.pending / estimatesCount.total) * 100) : 0}% of total
                    </small>
                  </div>
                </div>
              </div>

              {/* Accepted Estimates Card */}
              <div className="col-md-6 col-lg-3 mb-4">
                <div className="card shadow-sm text-center p-4 border-top border-4 border-success">
                  <div className="card-body">
                    <i className="bi bi-check-circle-fill text-success mb-3 dashboard-icon"></i>
                    <h5 className="card-title fw-semibold">Accepted</h5>
                    <p className="display-4 fw-bold text-success">{estimatesCount.accepted}</p>
                    <div className="progress mt-2" style={{ height: "10px" }}>
                      <div 
                        className="progress-bar bg-success" 
                        role="progressbar" 
                        style={{ width: `${estimatesCount.total > 0 ? (estimatesCount.accepted / estimatesCount.total * 100) : 0}%` }}
                      ></div>
                    </div>
                    <small className="text-muted d-block mt-2">
                      {estimatesCount.total > 0 ? Math.round((estimatesCount.accepted / estimatesCount.total) * 100) : 0}% of total
                    </small>
                  </div>
                </div>
              </div>

              {/* Order Estimates Card */}
              <div className="col-md-6 col-lg-3 mb-4">
                <div className="card shadow-sm text-center p-4 border-top border-4 border-primary">
                  <div className="card-body">
                    <i className="bi bi-cart-check-fill text-primary mb-3 dashboard-icon"></i>
                    <h5 className="card-title fw-semibold">Orders</h5>
                    <p className="display-4 fw-bold text-primary">{estimatesCount.order}</p>
                    <div className="progress mt-2" style={{ height: "10px" }}>
                      <div 
                        className="progress-bar bg-primary" 
                        role="progressbar" 
                        style={{ width: `${estimatesCount.total > 0 ? (estimatesCount.order / estimatesCount.total * 100) : 0}%` }}
                      ></div>
                    </div>
                    <small className="text-muted d-block mt-2">
                      {estimatesCount.total > 0 ? Math.round((estimatesCount.order / estimatesCount.total) * 100) : 0}% of total
                    </small>
                  </div>
                </div>
              </div>

              {/* Rejected Estimates Card */}
              <div className="col-md-6 col-lg-3 mb-4">
                <div className="card shadow-sm text-center p-4 border-top border-4 border-danger">
                  <div className="card-body">
                    <i className="bi bi-x-circle-fill text-danger mb-3 dashboard-icon"></i>
                    <h5 className="card-title fw-semibold">Rejected</h5>
                    <p className="display-4 fw-bold text-danger">{estimatesCount.rejected}</p>
                    <div className="progress mt-2" style={{ height: "10px" }}>
                      <div 
                        className="progress-bar bg-danger" 
                        role="progressbar" 
                        style={{ width: `${estimatesCount.total > 0 ? (estimatesCount.rejected / estimatesCount.total * 100) : 0}%` }}
                      ></div>
                    </div>
                    <small className="text-muted d-block mt-2">
                      {estimatesCount.total > 0 ? Math.round((estimatesCount.rejected / estimatesCount.total) * 100) : 0}% of total
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-gradient-primary text-white">
                <h5 className="card-title mb-0">Quick Summary</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <div className="summary-card p-3 bg-light rounded">
                      <h6 className="text-muted">Total Users</h6>
                      <h3 className="fw-bold text-primary">{customersCount + salespersonsCount}</h3>
                      <div className="d-flex justify-content-between mt-2">
                        <small className="text-muted">Customers: {customersCount}</small>
                        <small className="text-muted">Salespersons: {salespersonsCount}</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="summary-card p-3 bg-light rounded">
                      <h6 className="text-muted">Products & Estimates</h6>
                      <h3 className="fw-bold text-warning">{productsCount + estimatesCount.total}</h3>
                      <div className="d-flex justify-content-between mt-2">
                        <small className="text-muted">Products: {productsCount}</small>
                        <small className="text-muted">Estimates: {estimatesCount.total}</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="summary-card p-3 bg-light rounded">
                      <h6 className="text-muted">Conversion Rate</h6>
                      <h3 className="fw-bold text-success">
                        {estimatesCount.total > 0 ? 
                          Math.round(((estimatesCount.accepted + estimatesCount.order) / estimatesCount.total) * 100) : 0}%
                      </h3>
                      <div className="d-flex justify-content-between mt-2">
                        <small className="text-success">Accepted: {estimatesCount.accepted}</small>
                        <small className="text-primary">Orders: {estimatesCount.order}</small>
                      </div>
                    </div>
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