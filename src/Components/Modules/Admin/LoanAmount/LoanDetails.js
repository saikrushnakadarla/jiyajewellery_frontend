import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../Pages/Navbar/Navbar";
import { FaArrowLeft } from "react-icons/fa";
import "./LoanDetails.css";
import baseURL from "../../ApiUrl/NodeBaseURL";

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoanDetails();
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      const response = await fetch(`${baseURL}/api/loan-amounts/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLoan(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching loan details:", error);
      setLoading(false);
    }
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
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatAddress = (city, state, pincode) => {
    const parts = [];
    if (city && city !== "NULL") parts.push(city);
    if (state && state !== "NULL") parts.push(state);
    if (pincode && pincode !== "NULL") parts.push(pincode);
    return parts.length > 0 ? parts.join(", ") : "Address not available";
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loan-details-container">
          <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
            Loading loan details...
          </div>
        </div>
      </>
    );
  }

  if (!loan) {
    return (
      <>
        <Navbar />
        <div className="loan-details-container">
          <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
            Loan not found
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="loan-details-container">
        <div className="loan-details-card">
          <div className="loan-details-header">
            <h2>Loan Details</h2>
            <button className="back-btn" onClick={() => navigate("/loan-amount")}>
              <FaArrowLeft /> Back to Loans
            </button>
          </div>

          <div className="loan-details-section">
            <h3>Loan Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Loan ID</label>
                <span>{loan.loan_id}</span>
              </div>
              <div className="detail-item">
                <label>Status</label>
                <span className={`status ${loan.status}`}>
                  {loan.status ? loan.status.charAt(0).toUpperCase() + loan.status.slice(1) : "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <label>Loan Amount</label>
                <span>{formatCurrency(loan.loan_amount)}</span>
              </div>
              <div className="detail-item">
                <label>Interest Rate</label>
                <span>{loan.interest_rate}%</span>
              </div>
              <div className="detail-item">
                <label>Duration</label>
                <span>{loan.duration_months} months</span>
              </div>
              <div className="detail-item">
                <label>Due Date</label>
                <span>{formatDate(loan.due_date)}</span>
              </div>
            </div>
          </div>

          <div className="loan-details-section">
            <h3>Customer Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Full Name</label>
                <span>{loan.full_name}</span>
              </div>
              <div className="detail-item">
                <label>Phone Number</label>
                <span>{loan.phone || "N/A"}</span>
              </div>
              <div className="detail-item">
                <label>Email Address</label>
                <span>{loan.email_id || "N/A"}</span>
              </div>
              <div className="detail-item full-width">
                <label>Address</label>
                <span>{formatAddress(loan.city, loan.state, loan.pincode)}</span>
              </div>
            </div>
          </div>

          <div className="loan-details-section">
            <h3>Gold Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Weight</label>
                <span>{loan.gold_weight} grams</span>
              </div>
              <div className="detail-item">
                <label>Purity</label>
                <span>{loan.purity}</span>
              </div>
              <div className="detail-item">
                <label>Appraised Value</label>
                <span>{loan.appraised_value ? formatCurrency(loan.appraised_value) : "N/A"}</span>
              </div>
              <div className="detail-item full-width">
                <label>Item Description</label>
                <span>{loan.item_description || "No description provided"}</span>
              </div>
            </div>
          </div>

          <div className="loan-details-footer">
            <button className="btn-close" onClick={() => navigate("/loan-amount")}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoanDetails;