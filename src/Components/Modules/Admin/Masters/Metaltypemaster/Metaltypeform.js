import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InputField from "../../../../Pages/TableLayout/InputField";
import Swal from 'sweetalert2';
import Navbar from "../../../../Pages/Navbar/Navbar";
import "./Metaltypeform.css";

function Metaltypeform() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Get editing record if exists
  const editingRecord = location.state?.editingRecord || null;

  const [formData, setFormData] = useState({
    metal_name: "",
    default_purity: "",
  });

  // Initialize form with editing data if available
  useEffect(() => {
    if (editingRecord) {
      setFormData({
        metal_name: editingRecord.metal_name || "",
        default_purity: editingRecord.default_purity || "",
      });
    }
  }, [editingRecord]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    // Validation
    if (!formData.metal_name || !formData.default_purity) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'All fields are required!',
        confirmButtonColor: '#3085d6',
      });
      setIsSubmitting(false);
      return;
    }

    // Validate purity percentage
    const purity = parseFloat(formData.default_purity);
    if (isNaN(purity) || purity < 0 || purity > 100) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Purity',
        text: 'Default purity must be a number between 0 and 100',
        confirmButtonColor: '#3085d6',
      });
      setIsSubmitting(false);
      return;
    }

    // Prepare data for API
    const apiData = {
      metal_name: formData.metal_name,
      default_purity: formData.default_purity,
    };

    try {
      let url = "http://localhost:5000/metaltype";
      let method = "POST";
      
      // If editing, update the record
      if (editingRecord) {
        url = `http://localhost:5000/metaltype/${editingRecord.id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Success:", result);
        
        // Show success alert
        Swal.fire({
          icon: 'success',
          title: editingRecord ? 'Metal Type Updated Successfully!' : 'Metal Type Added Successfully!',
          text: editingRecord 
            ? 'Metal type details have been updated successfully.'
            : 'Metal type details have been saved successfully.',
          confirmButtonColor: '#3085d6',
        }).then((result) => {
          if (result.isConfirmed) {
            // Reset form
            setFormData({
              metal_name: "",
              default_purity: "",
            });
            // Navigate back to metal type list
            navigate("/metaltype");
          }
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: errorData.message || 'Failed to save metal type details. Please try again.',
          confirmButtonColor: '#3085d6',
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Please check your connection and try again.',
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <>
      <Navbar />
      <div className="metaltype-container">
        <div className="metaltype-card">
          <h2 className="metaltype-title">
            {editingRecord ? 'Edit Metal Type' : 'Add Metal Type'}
          </h2>
          
          {errorMessage && <div className="metaltype-error">{errorMessage}</div>}
          
          <form className="metaltype-form" onSubmit={handleSubmit}>
            <div className="row">
              {/* First Column - Metal Name */}
              <div className="col-md-6 col-sm-6 mb-3">
                <InputField
                  label="Metal Name"
                  placeholder="Enter metal name (e.g., Gold, Silver)"
                  name="metal_name"
                  value={formData.metal_name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Second Column - Default Purity */}
              <div className="col-md-6 col-sm-6 mb-3">
                <InputField
                  label="Default Purity"
                  placeholder="Enter default purity percentage (e.g., 91.6)"
                  name="default_purity"
                  value={formData.default_purity}
                  onChange={handleChange}
                  required
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="metaltype-button-container">
              <button
                type="button"
                className="metaltype-back-btn"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="metaltype-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : editingRecord ? "Update Metal Type" : "Save Metal Type"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default Metaltypeform;