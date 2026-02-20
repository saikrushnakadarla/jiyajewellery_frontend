import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./CompanyInfoEditForm.css";

const CompanyInfoEditForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    company_name: "",
    address: "",
    address2: "",
    city: "",
    pincode: "",
    state: "",
    state_code: "",
    country: "",
    email: "",
    mobile: "",
    phone: "",
    website: "",
    gst_no: "",
    pan_no: "",
    bank_name: "",
    bank_account_no: "",
    ifsc_code: "",
    branch: "",
    bank_url: "",
    latitude: "",
    longitude: "",
    id: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Check if we're editing existing data
  useEffect(() => {
    if (location.state?.companyData) {
      setFormData(location.state.companyData);
      setIsEditing(true);
    } else {
      // Get current location for new company
      getCurrentLocation();
    }
  }, [location.state]);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Store latitude and longitude
            setFormData(prev => ({
              ...prev,
              latitude: latitude.toString(),
              longitude: longitude.toString()
            }));

            // Reverse geocoding to get address details
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            if (data && data.display_name) {
              setFormData(prev => ({
                ...prev,
                address: data.display_name,
                city: data.address?.city || data.address?.town || data.address?.village || prev.city,
                state: data.address?.state || prev.state,
                country: data.address?.country || prev.country,
                pincode: data.address?.postcode || prev.pincode
              }));
            }
          } catch (error) {
            console.error("Error getting location:", error);
            // setError("Failed to get location details");
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Please enable location access to auto-fill address");
          setLocationLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setLocationLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let url, method;
      
      if (isEditing && formData.id) {
        url = `http://localhost:5000/edit/companies/${formData.id}`;
        method = 'PUT';
      } else {
        url = 'http://localhost:5000/post/companies';
        method = 'POST';
      }

      // Remove id from the body when sending to backend
      const { id, ...dataToSend } = formData;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEditing ? dataToSend : formData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'save'} company data`);
      }

      const data = await response.json();
      console.log('Success:', data);
      navigate("/company-info");
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshLocation = () => {
    getCurrentLocation();
  };

  return (
    <div className="company-info-wrapper container-fluid">
      <h4 className="company-info-page-title text-center">
        {isEditing ? 'Edit Company' : 'Company Registration'}
      </h4>

      <div className="company-edit-card">
        {error && <div className="alert alert-danger">{error}</div>}
        {locationLoading && (
          <div className="alert alert-info">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            Getting your location...
          </div>
        )}
        
        <form className="company-edit-form" onSubmit={handleSubmit}>
          {/* Hidden fields for latitude and longitude */}
          <input type="hidden" name="latitude" value={formData.latitude || ''} />
          <input type="hidden" name="longitude" value={formData.longitude || ''} />

          <div className="row mb-3">
            <div className="col-12">
              <button 
                type="button" 
                className="btn btn-outline-primary btn-sm"
                onClick={refreshLocation}
                disabled={locationLoading}
              >
                <i className="bi bi-geo-alt-fill me-1"></i>
                {locationLoading ? 'Getting Location...' : 'Refresh Location'}
              </button>
              {formData.latitude && formData.longitude && (
                <small className="text-muted ms-3">
                  📍 {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                </small>
              )}
            </div>
          </div>

          <div className="row">
            {/* COLUMN 1 */}
            <div className="col-md-4">
              <div className="form-group">
                <label>Company Name *</label>
                <input 
                  type="text" 
                  name="company_name"
                  value={formData.company_name || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>City *</label>
                <input 
                  type="text" 
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>State Code *</label>
                <input 
                  type="text" 
                  name="state_code"
                  value={formData.state_code || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile</label>
                <input 
                  type="text" 
                  name="mobile"
                  value={formData.mobile || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>GST No</label>
                <input 
                  type="text" 
                  name="gst_no"
                  value={formData.gst_no || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Branch</label>
                <input 
                  type="text" 
                  name="branch"
                  value={formData.branch || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>IFSC Code</label>
                <input 
                  type="text" 
                  name="ifsc_code"
                  value={formData.ifsc_code || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* COLUMN 2 */}
            <div className="col-md-4">
              <div className="form-group">
                <label>Address *</label>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Pincode *</label>
                <input 
                  type="text" 
                  name="pincode"
                  value={formData.pincode || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Country *</label>
                <input 
                  type="text" 
                  name="country"
                  value={formData.country || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>PAN No</label>
                <input 
                  type="text" 
                  name="pan_no"
                  value={formData.pan_no || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Bank URL</label>
                <input 
                  type="text" 
                  name="bank_url"
                  value={formData.bank_url || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* COLUMN 3 */}
            <div className="col-md-4">
              <div className="form-group">
                <label>Address 2</label>
                <input 
                  type="text" 
                  name="address2"
                  value={formData.address2 || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>State *</label>
                <input 
                  type="text" 
                  name="state"
                  value={formData.state || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input 
                  type="text" 
                  name="website"
                  value={formData.website || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Bank Name</label>
                <input 
                  type="text" 
                  name="bank_name"
                  value={formData.bank_name || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Account No</label>
                <input 
                  type="text" 
                  name="bank_account_no"
                  value={formData.bank_account_no || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="company-edit-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/company-info")}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || locationLoading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyInfoEditForm;