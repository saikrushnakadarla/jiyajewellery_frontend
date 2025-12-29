import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import CustomerNavbar from "../../Pages/Navbar/CustomerNavbar";
import { Card, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function CustomerDashboard() {
  const navigate = useNavigate();
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        // Get current logged-in user from localStorage
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          navigate("/login");
          return;
        }

        const user = JSON.parse(userStr);
        
        // Fetch customer-specific data
        const response = await fetch(`http://localhost:5000/api/users/${user.id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const customer = await response.json();
        setCustomerData(customer);

        // In a real application, you would fetch orders from a separate API
        // For now, we'll simulate or fetch from your orders endpoint if it exists
        // Example: const ordersResponse = await fetch(`http://localhost:5000/api/orders?customerId=${user.id}`);
        
        // Simulated data for demo
        setPendingOrders(3); // You would get this from API
        setTotalOrders(12); // You would get this from API
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <Alert variant="danger">
          Error loading dashboard: {error}
        </Alert>
      </div>
    );
  }

  return (
    <>
      <CustomerNavbar />
      <div className="container mt-5" style={{ marginTop: '80px' }}>
        <h2 className="mb-4">Customer Dashboard</h2>
        
        {/* Welcome Section */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <h4>Welcome, {customerData?.full_name}!</h4>
            <p className="text-muted">
              Email: {customerData?.email_id} | Phone: {customerData?.phone || 'Not provided'}
            </p>
          </Card.Body>
        </Card>

        {/* Stats Section */}
        <Row className="mb-4">
          <Col md={4} className="mb-3">
            <Card className="text-center shadow-sm h-100">
              <Card.Body>
                <Card.Title>Total Orders</Card.Title>
                <Card.Text className="display-4 fw-bold text-primary">
                  {totalOrders}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} className="mb-3">
            <Card className="text-center shadow-sm h-100">
              <Card.Body>
                <Card.Title>Pending Orders</Card.Title>
                <Card.Text className="display-4 fw-bold text-warning">
                  {pendingOrders}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} className="mb-3">
            <Card className="text-center shadow-sm h-100">
              <Card.Body>
                <Card.Title>Account Status</Card.Title>
                <Card.Text>
                  <span className={`badge bg-${customerData?.status === 'approved' ? 'success' : 'warning'} p-2`}>
                    {customerData?.status?.toUpperCase() || 'PENDING'}
                  </span>
                </Card.Text>
                <small className="text-muted">
                  {customerData?.status === 'approved' 
                    ? 'Your account is active' 
                    : 'Waiting for approval'}
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <Card.Body>
            <Card.Title>Quick Actions</Card.Title>
            <Row>
              <Col md={3} className="mb-2">
                <button 
                  className="btn btn-outline-primary w-100"
                  onClick={() => navigate('/products')} // Update this path
                >
                  Browse Products
                </button>
              </Col>
              <Col md={3} className="mb-2">
                <button 
                  className="btn btn-outline-success w-100"
                  onClick={() => navigate('/my-orders')} // Update this path
                >
                  My Orders
                </button>
              </Col>
              <Col md={3} className="mb-2">
                <button 
                  className="btn btn-outline-info w-100"
                  onClick={() => navigate('/profile')} // Update this path
                >
                  Update Profile
                </button>
              </Col>
              <Col md={3} className="mb-2">
                <button 
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    localStorage.removeItem('user');
                    navigate('/login');
                  }}
                >
                  Logout
                </button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    </>
  );
}

export default CustomerDashboard;