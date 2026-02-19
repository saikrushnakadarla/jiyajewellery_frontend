import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./CompanyInfoEditForm.css";

const CompanyInfoEditForm = () => {
  const navigate = useNavigate();

  return (
    <div className="company-info-wrapper container-fluid">
      <h4 className="company-info-page-title text-center">
        Company Registration
      </h4>

      <div className="company-edit-card">
        <form className="company-edit-form">
          <div className="row">
            {/* COLUMN 1 */}
            <div className="col-md-4">
              <div className="form-group">
                <label>Company Name *</label>
                <input type="text" defaultValue="Shree Mahaganapathi Jewellery" />
              </div>

              <div className="form-group">
                <label>City *</label>
                <input type="text" defaultValue="Rajanna Sircilla" />
              </div>

              <div className="form-group">
                <label>State Code *</label>
                <input type="text" defaultValue="36" />
              </div>

              <div className="form-group">
                <label>Mobile</label>
                <input type="text" />
              </div>

              <div className="form-group">
                <label>GST No</label>
                <input type="text" />
              </div>

              <div className="form-group">
                <label>Branch</label>
                <input type="text" />
              </div>

              <div className="form-group">
                <label>IFSC Code</label>
                <input type="text" />
              </div>
            </div>

            {/* COLUMN 2 */}
            <div className="col-md-4">
              <div className="form-group">
                <label>Address *</label>
                <input type="text" defaultValue="h-no 5-47/2/d Chandrampet sircilla" />
              </div>

              <div className="form-group">
                <label>Pincode *</label>
                <input type="text" defaultValue="505301" />
              </div>

              <div className="form-group">
                <label>Country *</label>
                <input type="text" defaultValue="India" />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input type="text" />
              </div>

              <div className="form-group">
                <label>PAN No</label>
                <input type="text" />
              </div>

              <div className="form-group">
                <label>Bank URL</label>
                <input type="text" />
              </div>
            </div>

            {/* COLUMN 3 */}
            <div className="col-md-4">
              <div className="form-group">
                <label>Address 2</label>
                <input type="text" />
              </div>

              <div className="form-group">
                <label>State *</label>
                <input type="text" defaultValue="Telangana" />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input type="email" defaultValue="pavaninyana2000@gmail.com" />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input type="text" />
              </div>

              <div className="form-group">
                <label>Bank Name</label>
                <input type="text" />
              </div>

              <div className="form-group">
                <label>Account No</label>
                <input type="text" />
              </div>
            </div>
          </div>

          <div className="company-edit-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/company-info")}
            >
              Cancel
            </button>
            <button className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyInfoEditForm;