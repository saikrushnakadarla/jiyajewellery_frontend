import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "../../../Pages/Navbar/Navbar";

function Dashboard() {
  const [customersCount, setCustomersCount] = useState(0);
  const [salespersonsCount, setSalespersonsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        
        // Count users by role with case-insensitive matching
        const customers = users.filter(user => 
          user.role && user.role.toLowerCase() === "customer"
        ).length;
        
        const salespersons = users.filter(user => 
          user.role && user.role.toLowerCase() === "salesman"
        ).length;
        
        setCustomersCount(customers);
        setSalespersonsCount(salespersons);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          Error loading data: {error}
        </div>
      </div>
    );
  }

  return (
    <>
    <Navbar/>
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Dashboard</h2>
      <div className="row">
        {/* Customers Card */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm text-center p-4">
            <h4 className="card-title">Customers</h4>
            <p className="display-4 fw-bold text-primary">{customersCount}</p>
          </div>
        </div>

        {/* Salespersons Card */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm text-center p-4">
            <h4 className="card-title">Salespersons</h4>
            <p className="display-4 fw-bold text-success">{salespersonsCount}</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default Dashboard;