import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../../../../Pages/TableLayout/InputField";
import Swal from 'sweetalert2';
import Navbar from "../../../../Pages/Navbar/Navbar";
import "./PurityForm.css";

function PurityForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [metalTypes, setMetalTypes] = useState([]); // Add state for metal types
  const [loadingMetals, setLoadingMetals] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    metal: "",
    purity_percentage: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchMetalTypes = async () => {
      try {
        const response = await fetch("http://localhost:5000/metaltype");
        if (response.ok) {
          const data = await response.json();
          setMetalTypes(data);
        } else {
          console.error("Failed to fetch metal types");
        }
      } catch (error) {
        console.error("Error fetching metal types:", error);
      } finally {
        setLoadingMetals(false);
      }
    };

    fetchMetalTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    // Validation
    if (!formData.name || !formData.metal || !formData.purity_percentage) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'All fields are required!',
        confirmButtonColor: '#3085d6',
      });
      setIsSubmitting(false);
      return;
    }

    // Validate percentage
    const percentage = parseFloat(formData.purity_percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Percentage',
        text: 'Purity percentage must be between 0 and 100',
        confirmButtonColor: '#3085d6',
      });
      setIsSubmitting(false);
      return;
    }

    // Prepare data for API
    const apiData = {
      name: formData.name,
      metal: formData.metal,
      purity_percentage: formData.purity_percentage.toString(),
    };

    try {
      const response = await fetch("http://localhost:5000/purity", {
        method: "POST",
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
          title: 'Purity Added Successfully!',
          text: 'Purity details have been saved successfully.',
          confirmButtonColor: '#3085d6',
        }).then((result) => {
          if (result.isConfirmed) {
            // Reset form
            setFormData({
              name: "",
              metal: "",
              purity_percentage: "",
            });
            // Optionally navigate to another page
            // navigate("/purity-list");
          }
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: errorData.message || 'Failed to save purity details. Please try again.',
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
      <div className="purity-container">
        <div className="purity-card">
          <h2 className="purity-title">Add Purity</h2>

          {errorMessage && <div className="purity-error">{errorMessage}</div>}

          <form className="purity-form" onSubmit={handleSubmit}>
            <div className="row">
              {/* First Column */}
              <div className="col-md-4 col-sm-6">
                {/* Purity Name */}
                <InputField
                  label="Purity Name"
                  placeholder="Enter purity name (e.g., 22K, 24K)"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Second Column */}
              <div className="col-md-4 col-sm-6">
                <InputField
                  label="Metal Type"
                  type="select"
                  placeholder="Select metal type"
                  name="metal"
                  value={formData.metal}
                  onChange={handleChange}
                  required
                  disabled={loadingMetals}
                  options={[
                    { value: "", label: loadingMetals ? "Loading..." : "Select metal type", disabled: true },
                    ...metalTypes.map(metal => ({
                      value: metal.metal_name,
                      label: metal.metal_name
                    }))
                  ]}
                />
              </div>

              {/* Third Column */}
              <div className="col-md-4 col-sm-6">
                {/* Purity Percentage */}
                <InputField
                  label="Purity Percentage"
                  placeholder="Enter purity percentage (e.g., 91.6)"
                  name="purity_percentage"
                  value={formData.purity_percentage}
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
            <div className="purity-button-container">
              <button
                type="button"
                className="purity-back-btn"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="purity-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Purity"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default PurityForm;