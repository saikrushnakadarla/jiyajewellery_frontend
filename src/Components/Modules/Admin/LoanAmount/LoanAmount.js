import React, { useState, useEffect } from "react";
import Navbar from "../../../Pages/Navbar/Navbar";
import "./LoanAmount.css";
import {
  FaRupeeSign,
  FaBalanceScale,
  FaExclamationTriangle,
  FaEye
} from "react-icons/fa";
import { IoTrendingUp } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import baseURL from "../../ApiUrl/NodeBaseURL";

const LoanAmount = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActiveAmount: 0,
    totalGoldHeld: 0,
    totalMonthlyInterest: 0,
    overdueCount: 0,
    activeCount: 0
  });

  // Fetch loans on component mount
  useEffect(() => {
    fetchLoans();
  }, []);

  // Apply filters whenever loans, activeTab, or searchTerm changes
  useEffect(() => {
    if (loans.length > 0 || loans.length === 0) {
      filterLoans();
    }
  }, [loans, activeTab, searchTerm]);

  const fetchLoans = async () => {
    try {
      console.log("Fetching loans...");
      const response = await fetch(`${baseURL}/api/loan-amounts`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Loans data received:", data);
      const loansData = Array.isArray(data) ? data : [];
      setLoans(loansData);
      calculateStats(loansData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching loans:", error);
      setLoans([]);
      setLoading(false);
    }
  };

  const calculateStats = (loansData) => {
    if (!Array.isArray(loansData)) {
      console.error("calculateStats: loansData is not an array", loansData);
      return;
    }
    
    const activeLoans = loansData.filter(loan => loan && loan.status === "active");
    const overdueLoans = loansData.filter(loan => loan && loan.status === "overdue");
    
    const totalActiveAmount = activeLoans.reduce((sum, loan) => sum + parseFloat(loan.loan_amount || 0), 0);
    const totalGoldHeld = activeLoans.reduce((sum, loan) => sum + parseFloat(loan.gold_weight || 0), 0);
    const totalMonthlyInterest = activeLoans.reduce((sum, loan) => {
      const monthlyInterest = (parseFloat(loan.loan_amount || 0) * parseFloat(loan.interest_rate || 0)) / 100;
      return sum + monthlyInterest;
    }, 0);
    
    setStats({
      totalActiveAmount: totalActiveAmount,
      totalGoldHeld: totalGoldHeld,
      totalMonthlyInterest: totalMonthlyInterest,
      overdueCount: overdueLoans.length,
      activeCount: activeLoans.length
    });
  };

  const filterLoans = () => {
    if (!Array.isArray(loans)) {
      setFilteredLoans([]);
      return;
    }
    
    let filtered = [...loans];
    
    if (activeTab !== "All") {
      filtered = filtered.filter(loan => 
        loan && loan.status && loan.status.toLowerCase() === activeTab.toLowerCase()
      );
    }
    
    if (searchTerm) {
      filtered = filtered.filter(loan =>
        loan && (
          (loan.loan_id && loan.loan_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (loan.full_name && loan.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
    
    setFilteredLoans(filtered);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loan-dashboard-container">
          <div style={{ textAlign: "center", padding: "50px" }}>Loading loans...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="loan-dashboard-container">
        <div className="loan-dashboard-header">
          <div className="loan-dashboard-title">
            <div className="loan-dashboard-icon">💎</div>
            <div>
              <h2>Gold Loans</h2>
              <p>Jewellery Loan Management</p>
            </div>
          </div>

          <button
            className="loan-dashboard-new-btn"
            onClick={() => navigate("/add-loan-amount")}
          >
            + New Loan
          </button>
        </div>

        <div className="loan-dashboard-cards">
          <div className="loan-card loan-card-highlight">
            <div>
              <p>Total Active Loans</p>
              <h3>{formatCurrency(stats.totalActiveAmount)}</h3>
              <span>{stats.activeCount} active loans</span>
            </div>
            <FaRupeeSign />
          </div>

          <div className="loan-card">
            <div>
              <p>Gold Held</p>
              <h3>{stats.totalGoldHeld.toFixed(1)}g</h3>
              <span>As collateral</span>
            </div>
            <FaBalanceScale />
          </div>

          <div className="loan-card">
            <div>
              <p>Monthly Interest</p>
              <h3>{formatCurrency(stats.totalMonthlyInterest)}</h3>
              <span>Expected income</span>
            </div>
            <IoTrendingUp />
          </div>

          <div className="loan-card">
            <div>
              <p>Overdue Loans</p>
              <h3>{stats.overdueCount}</h3>
              <span>Require attention</span>
            </div>
            <FaExclamationTriangle />
          </div>
        </div>

        <div className="loan-dashboard-filters">
          <div className="loan-tabs">
            <button 
              className={`loan-tab ${activeTab === "All" ? "active" : ""}`}
              onClick={() => setActiveTab("All")}
            >
              All
            </button>
            <button 
              className={`loan-tab ${activeTab === "Active" ? "active" : ""}`}
              onClick={() => setActiveTab("Active")}
            >
              Active
            </button>
            <button 
              className={`loan-tab ${activeTab === "Overdue" ? "active" : ""}`}
              onClick={() => setActiveTab("Overdue")}
            >
              Overdue
            </button>
            <button 
              className={`loan-tab ${activeTab === "Closed" ? "active" : ""}`}
              onClick={() => setActiveTab("Closed")}
            >
              Closed
            </button>
          </div>

          <input
            type="text"
            placeholder="Search by name or ID..."
            className="loan-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="loan-table-wrapper">
          <table className="loan-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Gold (g)</th>
                <th>Purity</th>
                <th>Loan ₹</th>
                <th>Rate %</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                    No loans found
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.loan_id}</td>
                    <td>
                      {loan.full_name} <br />
                      <span style={{ fontSize: "12px", color: "#666" }}>{loan.phone || "No phone"}</span>
                    </td>
                    <td>{loan.gold_weight}g</td>
                    <td>{loan.purity}</td>
                    <td>{formatCurrency(loan.loan_amount)}</td>
                    <td>{loan.interest_rate}%</td>
                    <td>{formatDate(loan.due_date)}</td>
                    <td>
                      <span className={`status ${loan.status}`}>
                        {loan.status ? loan.status.charAt(0).toUpperCase() + loan.status.slice(1) : "N/A"}
                      </span>
                    </td>
                    <td>
                      <FaEye
                        className="loan-view-icon"
                        onClick={() => navigate(`/loan-details/${loan.id}`)}
                        title="View Details"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default LoanAmount;