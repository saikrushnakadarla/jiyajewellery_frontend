import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import SalesNavbar from "../../Pages/Navbar/SalesNavbar";
import { Card, Row, Col, Alert, Spinner, Table, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function SalesPersonDashboard() {
  const navigate = useNavigate();
  const [salesPersonData, setSalesPersonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalSales, setTotalSales] = useState(0);
  const [monthlyTarget, setMonthlyTarget] = useState(100000); // Example target
  const [recentCustomers, setRecentCustomers] = useState([]);

  useEffect(() => {
    const fetchSalesPersonData = async () => {
      try {
        // Get current logged-in user from localStorage
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          navigate("/login");
          return;
        }

        const user = JSON.parse(userStr);
        
        // Fetch salesperson-specific data
        const response = await fetch(`http://localhost:5000/api/users/${user.id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const salesPerson = await response.json();
        setSalesPersonData(salesPerson);

        // Fetch sales data for this salesperson
        // In a real app, you would have APIs like:
        // - /api/sales?salesPersonId={id}
        // - /api/customers?assignedTo={id}
        
        // For demo, we'll simulate data
        setTotalSales(75000);
        
        // Fetch recent assigned customers
        const usersResponse = await fetch('http://localhost:5000/api/users');
        const allUsers = await usersResponse.json();
        const customers = allUsers.filter(u => 
          u.role && u.role.toLowerCase() === "customer"
        ).slice(0, 5); // Get first 5 customers
        setRecentCustomers(customers);
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSalesPersonData();
  }, [navigate]);

  const calculateProgress = () => {
    return Math.min((totalSales / monthlyTarget) * 100, 100);
  };

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
      <SalesNavbar />
      <div className="container mt-5" style={{ marginTop: '80px' }}>
        <h2 className="mb-4">Sales Person Dashboard</h2>
        
        {/* Welcome Section */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row>
              <Col md={8}>
                <h4>Welcome, {salesPersonData?.full_name}!</h4>
                <p className="text-muted">
                  {salesPersonData?.designation} | {salesPersonData?.company_name}
                </p>
                <p>
                  Email: {salesPersonData?.email_id} | Phone: {salesPersonData?.phone || 'Not provided'}
                </p>
              </Col>
              <Col md={4} className="text-end">
                <Button 
                  variant="primary"
                  onClick={() => navigate('/add-sale')} // Update this path
                >
                  + Add New Sale
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Stats Section */}
        <Row className="mb-4">
          <Col md={4} className="mb-3">
            <Card className="text-center shadow-sm h-100">
              <Card.Body>
                <Card.Title>Monthly Sales</Card.Title>
                <Card.Text className="display-4 fw-bold text-primary">
                  ₹{totalSales.toLocaleString()}
                </Card.Text>
                <small className="text-muted">Current month</small>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} className="mb-3">
            <Card className="text-center shadow-sm h-100">
              <Card.Body>
                <Card.Title>Monthly Target</Card.Title>
                <Card.Text className="display-4 fw-bold text-success">
                  ₹{monthlyTarget.toLocaleString()}
                </Card.Text>
                <div className="progress mt-2">
                  <div 
                    className="progress-bar bg-success" 
                    role="progressbar" 
                    style={{ width: `${calculateProgress()}%` }}
                    aria-valuenow={calculateProgress()} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  >
                    {calculateProgress().toFixed(1)}%
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} className="mb-3">
            <Card className="text-center shadow-sm h-100">
              <Card.Body>
                <Card.Title>Assigned Customers</Card.Title>
                <Card.Text className="display-4 fw-bold text-info">
                  {recentCustomers.length}
                </Card.Text>
                <small className="text-muted">Total assigned</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Customers Table */}
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Card.Title>Recent Customers</Card.Title>
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.full_name}</td>
                    <td>{customer.email_id}</td>
                    <td>{customer.phone || 'N/A'}</td>
                    <td>
                      <span className={`badge bg-${customer.status === 'approved' ? 'success' : 'warning'}`}>
                        {customer.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => navigate(`/customer/${customer.id}`)} // Update this path
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* Quick Actions */}
        <Row>
          <Col md={3} className="mb-2">
            <Button 
              variant="outline-primary" 
              className="w-100"
              onClick={() => navigate('/customers')}
            >
              Manage Customers
            </Button>
          </Col>
          <Col md={3} className="mb-2">
            <Button 
              variant="outline-success" 
              className="w-100"
              onClick={() => navigate('/sales-report')} // Update this path
            >
              Sales Report
            </Button>
          </Col>
          <Col md={3} className="mb-2">
            <Button 
              variant="outline-info" 
              className="w-100"
              onClick={() => navigate('/profile')} // Update this path
            >
              My Profile
            </Button>
          </Col>
          <Col md={3} className="mb-2">
            <Button 
              variant="outline-secondary" 
              className="w-100"
              onClick={() => {
                localStorage.removeItem('user');
                navigate('/login');
              }}
            >
              Logout
            </Button>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default SalesPersonDashboard;