import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./CompanyInfo.css";
import Navbar from "../../../Pages/Navbar/Navbar";

const CompanyInfo = () => {
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const response = await fetch('http://localhost:5000/get/companies');
      if (!response.ok) {
        throw new Error('Failed to fetch company data');
      }
      const data = await response.json();
      setCompanyData(data[0] || null);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error('Error fetching company data:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        const response = await fetch(`http://localhost:5000/delete/companies/${companyData.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete company');
        }
        
        setCompanyData(null);
      } catch (err) {
        setError(err.message);
        console.error('Error deleting company:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="company-info-wrapper container-fluid text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="company-info-wrapper container-fluid">
        <div className="alert alert-danger" role="alert">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="company-info-wrapper container-fluid">
        <div className="alert alert-info" role="alert">
          No company data found. Please add company information.
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/company-info/edit")}
        >
          Add Company
        </button>
      </div>
    );
  }

  return (
    <>
    <Navbar/>
    <div className="company-info-wrapper container-fluid">
      <h4 className="company-info-page-title text-center">
        Company Info
      </h4>

      <div className="company-info-card">
        <div className="company-info-content row">
          {/* COLUMN 1 */}
          <div className="col-md-4 company-info-col">
            <p><strong>Company Name:</strong> {companyData.company_name || 'N/A'}</p>
            <p><strong>City:</strong> {companyData.city || 'N/A'}</p>
            <p><strong>State Code:</strong> {companyData.state_code || 'N/A'}</p>
            <p><strong>Mobile:</strong> {companyData.mobile || 'N/A'}</p>
            <p><strong>GST No:</strong> {companyData.gst_no || 'N/A'}</p>
            <p><strong>Branch:</strong> {companyData.branch || 'N/A'}</p>
            <p><strong>IFSC Code:</strong> {companyData.ifsc_code || 'N/A'}</p>
          </div>

          {/* COLUMN 2 */}
          <div className="col-md-4 company-info-col">
            <p><strong>Address:</strong> {companyData.address || 'N/A'}</p>
            <p><strong>Pincode:</strong> {companyData.pincode || 'N/A'}</p>
            <p><strong>Country:</strong> {companyData.country || 'N/A'}</p>
            <p><strong>Phone:</strong> {companyData.phone || 'N/A'}</p>
            <p><strong>PAN No:</strong> {companyData.pan_no || 'N/A'}</p>
            <p><strong>Bank URL:</strong> {companyData.bank_url || 'N/A'}</p>
            <p><strong>Latitude:</strong> {companyData.latitude || 'N/A'}</p>
          </div>

          {/* COLUMN 3 */}
          <div className="col-md-4 company-info-col">
            <p><strong>Address 2:</strong> {companyData.address2 || 'N/A'}</p>
            <p><strong>State:</strong> {companyData.state || 'N/A'}</p>
            <p><strong>Email:</strong> {companyData.email || 'N/A'}</p>
            <p><strong>Website:</strong> {companyData.website || 'N/A'}</p>
            <p><strong>Bank Name:</strong> {companyData.bank_name || 'N/A'}</p>
            <p><strong>Account No:</strong> {companyData.bank_account_no || 'N/A'}</p>
            <p><strong>Longitude:</strong> {companyData.longitude || 'N/A'}</p>
          </div>
        </div>

        <div className="company-info-actions">
          <button
            className="btn btn-primary company-info-edit"
            onClick={() => navigate("/company-info/edit", { state: { companyData } })}
          >
            Edit
          </button>
          <button 
            className="btn btn-danger company-info-delete"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default CompanyInfo;