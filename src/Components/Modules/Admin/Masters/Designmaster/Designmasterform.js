import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InputField from "../../../../Pages/TableLayout/InputField";
import Swal from 'sweetalert2';
import Navbar from "../../../../Pages/Navbar/Navbar";
import "./Designmasterform.css";

function Designmasterform() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [metalTypes, setMetalTypes] = useState([]); // State for metal types
  const [loadingMetals, setLoadingMetals] = useState(true); // Loading state for metals
  
  // Get editing record if exists
  const editingRecord = location.state?.editingRecord || null;

  const [formData, setFormData] = useState({
    metal: "",
    design_name: "",
  });

  // Fetch metal types from API
  useEffect(() => {
    const fetchMetalTypes = async () => {
      try {
        const response = await fetch("http://localhost:5000/metaltype");
        if (response.ok) {
          const data = await response.json();
          setMetalTypes(data);
        } else {
          console.error("Failed to fetch metal types");
          Swal.fire({
            icon: 'warning',
            title: 'Unable to Load Metals',
            text: 'Could not load metal types. Using default options.',
            confirmButtonColor: '#3085d6',
          });
        }
      } catch (error) {
        console.error("Error fetching metal types:", error);
        Swal.fire({
          icon: 'error',
          title: 'Network Error',
          text: 'Failed to load metal types. Please check your connection.',
          confirmButtonColor: '#3085d6',
        });
      } finally {
        setLoadingMetals(false);
      }
    };

    fetchMetalTypes();
  }, []);

  // Initialize form with editing data if available
  useEffect(() => {
    if (editingRecord) {
      setFormData({
        metal: editingRecord.metal || "",
        design_name: editingRecord.design_name || "",
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
    if (!formData.metal || !formData.design_name) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'All fields are required!',
        confirmButtonColor: '#3085d6',
      });
      setIsSubmitting(false);
      return;
    }

    // Prepare data for API
    const apiData = {
      metal: formData.metal,
      design_name: formData.design_name,
    };

    try {
      let url = "http://localhost:5000/designmaster";
      let method = "POST";
      
      // If editing, update the record
      if (editingRecord) {
        url = `http://localhost:5000/designmaster/${editingRecord.id}`;
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
          title: editingRecord ? 'Design Updated Successfully!' : 'Design Added Successfully!',
          text: editingRecord 
            ? 'Design details have been updated successfully.'
            : 'Design details have been saved successfully.',
          confirmButtonColor: '#3085d6',
        }).then((result) => {
          if (result.isConfirmed) {
            // Reset form
            setFormData({
              metal: "",
              design_name: "",
            });
            // Navigate back to design master list
            navigate("/designmaster");
          }
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: errorData.message || 'Failed to save design details. Please try again.',
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

  // Prepare metal options for dropdown
  const getMetalOptions = () => {
    const baseOptions = [
      { value: "", label: loadingMetals ? "Loading metal types..." : "Select metal type", disabled: true }
    ];
    
    // If metals are loaded, use them
    if (metalTypes.length > 0) {
      const metalOptions = metalTypes.map(metal => ({
        value: metal.metal_name,
        label: metal.metal_name
      }));
      return [...baseOptions, ...metalOptions];
    }
    
    // If no metals loaded, show default options
    if (!loadingMetals && metalTypes.length === 0) {
      const defaultOptions = [
        { value: "Gold", label: "Gold" },
        { value: "Silver", label: "Silver" },
        { value: "Platinum", label: "Platinum" },
        { value: "Diamond", label: "Diamond" },
        { value: "Other", label: "Other" },
      ];
      return [...baseOptions, ...defaultOptions];
    }
    
    return baseOptions;
  };

  return (
    <>
      <Navbar />
      <div className="designmaster-container">
        <div className="designmaster-card">
          <h2 className="designmaster-title">
            {editingRecord ? 'Edit Design Master' : 'Add Design Master'}
          </h2>
          
          {errorMessage && <div className="designmaster-error">{errorMessage}</div>}
          
          <form className="designmaster-form" onSubmit={handleSubmit}>
            <div className="row">
              {/* First Column - Metal Type */}
              <div className="col-md-6 col-sm-6 mb-3">
                <InputField
                  label="Metal Type"
                  type="select"
                  placeholder="Select metal type"
                  name="metal"
                  value={formData.metal}
                  onChange={handleChange}
                  required
                  disabled={loadingMetals}
                  options={getMetalOptions()}
                />
              </div>

              {/* Second Column - Design Name */}
              <div className="col-md-6 col-sm-6 mb-3">
                <InputField
                  label="Design Name"
                  placeholder="Enter design name"
                  name="design_name"
                  value={formData.design_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="designmaster-button-container">
              <button
                type="button"
                className="designmaster-back-btn"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="designmaster-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : editingRecord ? "Update Design" : "Save Design"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default Designmasterform;