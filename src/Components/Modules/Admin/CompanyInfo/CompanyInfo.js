import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./CompanyInfo.css";

const CompanyInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="company-info-wrapper container-fluid">
      <h4 className="company-info-page-title text-center">
        Company Info
      </h4>

      <div className="company-info-card">
        <div className="company-info-content row">

          <div className="col-md-4 company-info-col">
            <p><strong>Company Name:</strong> Shree Mahaganapathi Jewellery</p>
            <p><strong>City:</strong> Rajanna Sircilla</p>
            <p><strong>State Code:</strong> 36</p>
            <p><strong>Mobile:</strong></p>
            <p><strong>GST No:</strong></p>
            <p><strong>Branch:</strong></p>
            <p><strong>IFSC Code:</strong></p>
          </div>

          <div className="col-md-4 company-info-col">
            <p><strong>Address:</strong> h-no 5-47/2/d Chandrampet sircilla</p>
            <p><strong>Pincode:</strong> 505301</p>
            <p><strong>Country:</strong> India</p>
            <p><strong>Phone:</strong></p>
            <p><strong>PAN No:</strong></p>
            <p><strong>Bank URL:</strong></p>
          </div>

          <div className="col-md-4 company-info-col">
            <p><strong>Address 2:</strong></p>
            <p><strong>State:</strong> Telangana</p>
            <p><strong>Email:</strong> pavaninyana2000@gmail.com</p>
            <p><strong>Website:</strong></p>
            <p><strong>Bank Name:</strong></p>
            <p><strong>Account No:</strong></p>
          </div>
        </div>

        <div className="company-info-actions">
          <button
            className="btn btn-primary company-info-edit"
            onClick={() => navigate("/company-info/edit")}
          >
            Edit
          </button>
          <button className="btn btn-danger company-info-delete">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfo;
