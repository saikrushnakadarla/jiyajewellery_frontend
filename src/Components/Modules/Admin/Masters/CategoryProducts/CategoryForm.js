import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InputField from "../../../../Pages/TableLayout/InputField";
import Swal from 'sweetalert2';
import Navbar from "../../../../Pages/Navbar/Navbar";
import "./CategoryForm.css";

function CategoryForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [metalTypes, setMetalTypes] = useState([]); // State for metal types
  const [loadingMetals, setLoadingMetals] = useState(true); // Loading state for metals
  const [loadingBarcode, setLoadingBarcode] = useState(true);

  // Get editing record if exists
  const editingRecord = location.state?.editingRecord || null;

  const [formData, setFormData] = useState({
    category_name: "",
    rbarcode: "",
    prefix: "",
    metal_type_id: "",
    metal_type: "",
    tax_slab_id: "",
    tax_slab: "",
    hsn_code: "",
    opening_qty: 0,
    // Removed sale_qty and balance_qty
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

  useEffect(() => {
    const fetchBarcode = async () => {
      if (!editingRecord) {
        try {
          const response = await fetch("http://localhost:5000/last-rbarcode");
          if (response.ok) {
            const data = await response.json();
            // Use the lastrbNumbers from the response
            if (data.lastrbNumbers) {
              setFormData(prev => ({
                ...prev,
                rbarcode: data.lastrbNumbers
              }));
            }
          } else {
            console.error("Failed to fetch barcode");
          }
        } catch (error) {
          console.error("Error fetching barcode:", error);
        } finally {
          setLoadingBarcode(false);
        }
      } else {
        setLoadingBarcode(false);
      }
    };

    fetchBarcode();
  }, [editingRecord]);

  // Initialize form with editing data if available
  useEffect(() => {
    if (editingRecord) {
      setFormData({
        category_name: editingRecord.category_name || "",
        rbarcode: editingRecord.rbarcode || "",
        prefix: editingRecord.prefix || "",
        metal_type_id: editingRecord.metal_type_id || "",
        metal_type: editingRecord.metal_type || "",
        tax_slab_id: editingRecord.tax_slab_id || "",
        tax_slab: editingRecord.tax_slab || "",
        hsn_code: editingRecord.hsn_code || "",
        opening_qty: editingRecord.opening_qty || 0,
      });
    } else {
      setFormData({
        category_name: "",
        rbarcode: "",
        prefix: "",
        metal_type_id: "",
        metal_type: "",
        tax_slab_id: "",
        tax_slab: "",
        hsn_code: "",
        opening_qty: 0,
      });
    }
  }, [editingRecord]);

  // Prepare metal options for dropdown
  const getMetalOptions = () => {
    const baseOptions = [
      { value: "", label: loadingMetals ? "Loading metal types..." : "Select metal type", disabled: true }
    ];

    // If metals are loaded, use them
    if (metalTypes.length > 0) {
      const metalOptions = metalTypes.map(metal => ({
        value: metal.id.toString(), // Use id as value
        label: metal.metal_name
      }));
      return [...baseOptions, ...metalOptions];
    }

    // If no metals loaded, show default options
    if (!loadingMetals && metalTypes.length === 0) {
      const defaultOptions = [
        { value: "1", label: "Gold" },
        { value: "2", label: "Silver" },
        { value: "3", label: "Platinum" },
        { value: "4", label: "Diamond" },
      ];
      return [...baseOptions, ...defaultOptions];
    }

    return baseOptions;
  };

  const taxSlabOptions = [
    { value: "", label: "Select tax slab", disabled: true },
    { value: "1", label: "1%" },
    { value: "2", label: "3%" },
    { value: "3", label: "5%" },
    { value: "4", label: "12%" },
    { value: "5", label: "18%" },
    { value: "6", label: "28%" },
  ];

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Handle number inputs
    const processedValue = (name.includes('_qty') || type === 'number')
      ? (value === '' ? 0 : parseFloat(value) || 0)
      : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));

    // Auto-update related fields
    if (name === 'metal_type_id') {
      const selectedMetal = metalTypes.find(mt => mt.id.toString() === value);
      if (selectedMetal) {
        setFormData(prev => ({
          ...prev,
          metal_type: selectedMetal.metal_name,
        }));
      } else {
        // Fallback for default options
        const defaultMetals = [
          { id: 1, metal_name: "Gold" },
          { id: 2, metal_name: "Silver" },
          { id: 3, metal_name: "Platinum" },
          { id: 4, metal_name: "Diamond" },
        ];
        const fallbackMetal = defaultMetals.find(mt => mt.id.toString() === value);
        if (fallbackMetal) {
          setFormData(prev => ({
            ...prev,
            metal_type: fallbackMetal.metal_name,
          }));
        }
      }
    }

    if (name === 'tax_slab_id') {
      const selectedTaxSlab = taxSlabOptions.find(ts => ts.value === value);
      if (selectedTaxSlab) {
        setFormData(prev => ({
          ...prev,
          tax_slab: selectedTaxSlab.label,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    // Validation
    if (!formData.category_name || !formData.rbarcode || !formData.prefix ||
      !formData.metal_type_id || !formData.tax_slab_id || !formData.hsn_code) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'All required fields must be filled!',
        confirmButtonColor: '#3085d6',
      });
      setIsSubmitting(false);
      return;
    }

    // Validate opening quantity is not negative
    if (formData.opening_qty < 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Opening quantity cannot be negative!',
        confirmButtonColor: '#3085d6',
      });
      setIsSubmitting(false);
      return;
    }

    // Prepare data for API
    const apiData = {
      category_name: formData.category_name,
      rbarcode: formData.rbarcode,
      prefix: formData.prefix,
      metal_type_id: formData.metal_type_id,
      metal_type: formData.metal_type,
      tax_slab_id: formData.tax_slab_id,
      tax_slab: formData.tax_slab,
      hsn_code: formData.hsn_code,
      opening_qty: formData.opening_qty,
    };

    try {
      let url = "http://localhost:5000/post/category";
      let method = "POST";

      // If editing, update the record
      if (editingRecord) {
        url = `http://localhost:5000/put/category/${editingRecord.category_id}`;
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
          title: editingRecord ? 'Category Updated Successfully!' : 'Category Added Successfully!',
          text: editingRecord
            ? 'Category details have been updated successfully.'
            : 'Category details have been saved successfully.',
          confirmButtonColor: '#3085d6',
        }).then((result) => {
          if (result.isConfirmed) {
            // Navigate back to category products list
            navigate("/c-products");
          }
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: errorData.message || 'Failed to save category details. Please try again.',
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
      <div className="category-form-container">
        <div className="category-form-card">
          <h2 className="category-form-title">
            {editingRecord ? 'Edit Category' : 'Add Category'}
          </h2>

          {errorMessage && <div className="category-form-error">{errorMessage}</div>}

          <form className="category-form" onSubmit={handleSubmit}>
            <div className="row">
              {/* First Row */}
              <div className="col-md-4 col-sm-6 mb-3">
                <InputField
                  label="Category Name *"
                  placeholder="Enter category name"
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4 col-sm-6 mb-3">
                <InputField
                  label="Barcode *"
                  placeholder={loadingBarcode ? "Loading barcode..." : "Enter barcode"}
                  name="rbarcode"
                  value={formData.rbarcode}
                  onChange={handleChange}
                  required
                  disabled={loadingBarcode}
                />
              </div>
              <div className="col-md-4 col-sm-6 mb-3">
                <InputField
                  label="Prefix *"
                  placeholder="Enter prefix"
                  name="prefix"
                  value={formData.prefix}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="row">
              {/* Second Row */}
              <div className="col-md-3 col-sm-6 mb-3">
                <InputField
                  label="Metal Type *"
                  type="select"
                  placeholder="Select metal type"
                  name="metal_type_id"
                  value={formData.metal_type_id}
                  onChange={handleChange}
                  required
                  disabled={loadingMetals}
                  options={getMetalOptions()}
                />
              </div>
              <div className="col-md-3 col-sm-6 mb-3">
                <InputField
                  label="Tax Slab *"
                  type="select"
                  placeholder="Select tax slab"
                  name="tax_slab_id"
                  value={formData.tax_slab_id}
                  onChange={handleChange}
                  required
                  options={taxSlabOptions}
                />
              </div>
              <div className="col-md-3 col-sm-6 mb-3">
                <InputField
                  label="HSN Code *"
                  placeholder="Enter HSN code"
                  name="hsn_code"
                  value={formData.hsn_code}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-3 mb-3">
                <InputField
                  label="Opening Quantity"
                  type="number"
                  name="opening_qty"
                  value={formData.opening_qty}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="Enter opening quantity"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="category-form-button-container">
              <button
                type="button"
                className="category-form-back-btn"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="category-form-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : editingRecord ? "Update Category" : "Save Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CategoryForm;