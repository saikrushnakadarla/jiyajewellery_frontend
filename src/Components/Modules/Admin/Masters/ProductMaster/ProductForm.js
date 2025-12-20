import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InputField from "../../../../Pages/TableLayout/InputField";
import Swal from 'sweetalert2';
import Navbar from "../../../../Pages/Navbar/Navbar";
import "./ProductForm.css";

function ProductForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [metalTypes, setMetalTypes] = useState([]);
  const [purities, setPurities] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [loading, setLoading] = useState({
    metals: true,
    purities: true,
    designs: true,
    productNames: true,
    barcode: true
  });

  // Get editing record if exists
  const editingRecord = location.state?.editingRecord || null;

  const [formData, setFormData] = useState({
    product_name: "",
    category_id: "",
    barcode: "",
    metal_type_id: "",
    metal_type: "",
    purity_id: "",
    purity: "",
    design_id: "",
    design: "",
    gross_wt: "0.000",
    stone_wt: "0.000",
    net_wt: "0.000",
  });

  // Fetch all dropdown data
  useEffect(() => {
    fetchAllData();
  }, []);

  // Initialize form with editing data if available
  useEffect(() => {
    if (editingRecord) {
      setFormData({
        product_name: editingRecord.product_name || "",
        category_id: editingRecord.category_id || "",
        barcode: editingRecord.barcode || "",
        metal_type_id: editingRecord.metal_type_id || "",
        metal_type: editingRecord.metal_type || "",
        purity_id: editingRecord.purity_id || "",
        purity: editingRecord.purity || "",
        design_id: editingRecord.design_id || "",
        design: editingRecord.design || "",
        gross_wt: editingRecord.gross_wt || "0.000",
        stone_wt: editingRecord.stone_wt || "0.000",
        net_wt: editingRecord.net_wt || "0.000",
      });
    } else {
      setFormData({
        product_name: "",
        category_id: "",
        barcode: "",
        metal_type_id: "",
        metal_type: "",
        purity_id: "",
        purity: "",
        design_id: "",
        design: "",
        gross_wt: "0.000",
        stone_wt: "0.000",
        net_wt: "0.000",
      });
    }
  }, [editingRecord]);

  const fetchAllData = async () => {
    try {
      // Fetch metal types
      const metalResponse = await fetch('http://localhost:5000/metaltype');
      if (metalResponse.ok) {
        const metalData = await metalResponse.json();
        setMetalTypes(Array.isArray(metalData) ? metalData : []);
      }
      setLoading(prev => ({ ...prev, metals: false }));

      // Fetch purities
      const purityResponse = await fetch('http://localhost:5000/purity');
      if (purityResponse.ok) {
        const purityData = await purityResponse.json();
        setPurities(Array.isArray(purityData) ? purityData : []);
      }
      setLoading(prev => ({ ...prev, purities: false }));

      // Fetch designs
      const designResponse = await fetch('http://localhost:5000/designmaster');
      if (designResponse.ok) {
        const designData = await designResponse.json();
        setDesigns(Array.isArray(designData) ? designData : []);
      }
      setLoading(prev => ({ ...prev, designs: false }));

      // Fetch product names (categories)
      const productNameResponse = await fetch('http://localhost:5000/get/category');
      if (productNameResponse.ok) {
        const productNameData = await productNameResponse.json();
        setProductNames(Array.isArray(productNameData) ? productNameData : []);
      }
      setLoading(prev => ({ ...prev, productNames: false }));

      // Don't fetch barcode initially - it will be fetched when product name is selected
      setLoading(prev => ({ ...prev, barcode: false }));

    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Data Loading Error',
        text: 'Failed to load dropdown data. Please refresh the page.',
        confirmButtonColor: '#3085d6',
      });

      // Set all loading to false on error
      setLoading({
        metals: false,
        purities: false,
        designs: false,
        productNames: false,
        barcode: false
      });
    }
  };

  // Fetch next barcode when product name is selected
  const fetchNextBarcode = async (categoryId, productName) => {
    setLoading(prev => ({ ...prev, barcode: true }));
    
    try {
      // First get the category details to get the prefix
      const categoryResponse = await fetch(`http://localhost:5000/get/category-by-name/${encodeURIComponent(productName)}`);
      
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        const prefix = categoryData.prefix;
        
        if (prefix) {
          // Now get the next barcode using the prefix
          const barcodeResponse = await fetch(`http://localhost:5000/getNextBarcodeByPrefix?prefix=${prefix}`);
          
          if (barcodeResponse.ok) {
            const barcodeData = await barcodeResponse.json();
            
            if (barcodeData.nextBarcode) {
              setFormData(prev => ({
                ...prev,
                barcode: barcodeData.nextBarcode
              }));
            } else {
              // If no existing barcode, create first one
              setFormData(prev => ({
                ...prev,
                barcode: `${prefix}001`
              }));
            }
          } else {
            // Fallback: create first barcode with prefix
            setFormData(prev => ({
              ...prev,
              barcode: `${prefix}001`
            }));
          }
        } else {
          // If no prefix in category, use old method
          fetchOldBarcode();
        }
      } else {
        // If category not found, use old method
        fetchOldBarcode();
      }
    } catch (error) {
      console.error('Error fetching barcode:', error);
      fetchOldBarcode();
    } finally {
      setLoading(prev => ({ ...prev, barcode: false }));
    }
  };

  // Old method for backward compatibility
  const fetchOldBarcode = async () => {
    try {
      const barcodeResponse = await fetch('http://localhost:5000/last-rbarcode');
      if (barcodeResponse.ok) {
        const barcodeData = await barcodeResponse.json();
        if (barcodeData.lastrbNumbers) {
          setFormData(prev => ({
            ...prev,
            barcode: barcodeData.lastrbNumbers
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching old barcode:', error);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    // Handle weight fields to keep 3 decimal places
    if (['gross_wt', 'stone_wt', 'net_wt'].includes(name)) {
      // Allow empty value or numeric value with up to 3 decimals
      if (value === '' || /^\d*\.?\d{0,3}$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // When product name is selected, extract category_id and fetch barcode
    if (name === 'product_name') {
      const selectedProduct = productNames.find(p => p.category_name === value);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          category_id: selectedProduct.category_id,
          product_name: value
        }));
        
        // Fetch next barcode for this category
        if (!editingRecord) { // Only fetch new barcode for new records
          await fetchNextBarcode(selectedProduct.category_id, value);
        }
      }
    }

    // Auto-update related fields
    if (name === 'metal_type_id') {
      const selectedMetal = metalTypes.find(mt => mt.id.toString() === value);
      if (selectedMetal) {
        setFormData(prev => ({
          ...prev,
          metal_type: selectedMetal.metal_name,
        }));
      }
    }

    if (name === 'purity_id') {
      const selectedPurity = purities.find(p => p.id.toString() === value);
      if (selectedPurity) {
        setFormData(prev => ({
          ...prev,
          purity: selectedPurity.name,
        }));
      }
    }

    if (name === 'design_id') {
      const selectedDesign = designs.find(d => d.id.toString() === value);
      if (selectedDesign) {
        setFormData(prev => ({
          ...prev,
          design: selectedDesign.design_name,
        }));
      }
    }

    // Auto-calculate net weight if gross_wt or stone_wt changes
    if (name === 'gross_wt' || name === 'stone_wt') {
      const gross = name === 'gross_wt' ? parseFloat(value) || 0 : parseFloat(formData.gross_wt) || 0;
      const stone = name === 'stone_wt' ? parseFloat(value) || 0 : parseFloat(formData.stone_wt) || 0;
      const net = gross - stone;
      setFormData(prev => ({
        ...prev,
        net_wt: net < 0 ? "0.000" : net.toFixed(3),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    // Validation
    if (!formData.product_name || !formData.barcode || !formData.category_id ||
      !formData.metal_type_id || !formData.purity_id || !formData.design_id) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'All required fields must be filled!',
        confirmButtonColor: '#3085d6',
      });
      setIsSubmitting(false);
      return;
    }

    // Validate barcode format (should be prefix + 3 digits)
    if (!/^[A-Z]{2,}\d{3}$/.test(formData.barcode)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Barcode Format',
        text: 'Barcode should be in format: Prefix + 3 digits (e.g., GC001)',
        confirmButtonColor: '#3085d6',
      });
      setIsSubmitting(false);
      return;
    }

    // Prepare data for API
    const apiData = {
      product_name: formData.product_name,
      category_id: formData.category_id,
      barcode: formData.barcode,
      metal_type_id: formData.metal_type_id,
      metal_type: formData.metal_type,
      purity_id: formData.purity_id,
      purity: formData.purity,
      design_id: formData.design_id,
      design: formData.design,
      gross_wt: formData.gross_wt || "0.000",
      stone_wt: formData.stone_wt || "0.000",
      net_wt: formData.net_wt || "0.000",
    };

    try {
      let url = "http://localhost:5000/post/product";
      let method = "POST";

      // If editing, update the record
      if (editingRecord) {
        url = `http://localhost:5000/update/product/${editingRecord.product_id}`;
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
          title: editingRecord ? 'Product Updated Successfully!' : 'Product Added Successfully!',
          text: editingRecord
            ? 'Product details have been updated successfully.'
            : `Product added with barcode: ${formData.barcode}`,
          confirmButtonColor: '#3085d6',
        }).then((result) => {
          if (result.isConfirmed) {
            // Navigate back to product master list
            navigate("/productmaster");
          }
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: errorData.message || 'Failed to save product details. Please try again.',
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
    navigate(-1);
  };

  // Product Name options (from categories)
  const productNameOptions = [
    { value: "", label: loading.productNames ? "Loading product names..." : "Select product name", disabled: true },
    ...productNames.map(product => ({
      value: product.category_name,
      label: `${product.category_name} (${product.prefix || 'No Prefix'})`
    }))
  ];

  // Metal type options
  const metalTypeOptions = [
    { value: "", label: loading.metals ? "Loading metal types..." : "Select metal type", disabled: true },
    ...metalTypes.map(metal => ({
      value: metal.id.toString(),
      label: metal.metal_name
    }))
  ];

  // Purity options
  const purityOptions = [
    { value: "", label: loading.purities ? "Loading purities..." : "Select purity", disabled: true },
    ...purities.map(purity => ({
      value: purity.id.toString(),
      label: `${purity.name} (${purity.metal})`
    }))
  ];

  // Design options
  const designOptions = [
    { value: "", label: loading.designs ? "Loading designs..." : "Select design", disabled: true },
    ...designs.map(design => ({
      value: design.id.toString(),
      label: `${design.design_name} (${design.metal})`
    }))
  ];

  return (
    <>
      <Navbar />
      <div className="product-form-container">
        <div className="product-form-card">
          <h2 className="product-form-title">
            {editingRecord ? 'Edit Product' : 'Add Product'}
          </h2>

          {errorMessage && <div className="product-form-error">{errorMessage}</div>}

          <form className="product-form" onSubmit={handleSubmit}>
            <div className="row">
              {/* First Row - Product Name and Barcode */}
              <div className="col-md-4 col-sm-6 mb-3">
                <InputField
                  label="Product Name *"
                  type="select"
                  placeholder="Select product name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  required
                  disabled={loading.productNames}
                  options={productNameOptions}
                />
              </div>

              <div className="col-md-4 col-sm-6 mb-3">
                <InputField
                  label="Barcode *"
                  placeholder={loading.barcode ? "Generating barcode..." : "Barcode will auto-generate"}
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  required
                  disabled={loading.barcode || editingRecord}
                  readOnly={!editingRecord}
                />
                <small className="text-muted">
                  {formData.barcode ? `Format: ${formData.barcode.substring(0, formData.barcode.length-3)} + ${formData.barcode.substring(formData.barcode.length-3)}` : 'Select a product name to generate barcode'}
                </small>
              </div>
              
              <div className="col-md-4 col-sm-6 mb-3">
                <InputField
                  label="Metal Type *"
                  type="select"
                  placeholder="Select metal type"
                  name="metal_type_id"
                  value={formData.metal_type_id}
                  onChange={handleChange}
                  required
                  disabled={loading.metals}
                  options={metalTypeOptions}
                />
              </div>
            </div>

            <div className="row">
              {/* Second Row */}
              <div className="col-md-4 col-sm-6 mb-3">
                <InputField
                  label="Purity *"
                  type="select"
                  placeholder="Select purity"
                  name="purity_id"
                  value={formData.purity_id}
                  onChange={handleChange}
                  required
                  disabled={loading.purities}
                  options={purityOptions}
                />
              </div>
              
              <div className="col-md-4 col-sm-6 mb-3">
                <InputField
                  label="Design *"
                  type="select"
                  placeholder="Select design"
                  name="design_id"
                  value={formData.design_id}
                  onChange={handleChange}
                  required
                  disabled={loading.designs}
                  options={designOptions}
                />
              </div>
              
              <div className="col-md-4 mb-3">
                <InputField
                  label="Gross Weight (g)"
                  type="text"
                  name="gross_wt"
                  value={formData.gross_wt}
                  onChange={handleChange}
                  placeholder="0.000"
                  pattern="^\d*\.?\d{0,3}$"
                  title="Enter weight with up to 3 decimal places"
                />
              </div>
            </div>

            <div className="row">
              {/* Weight Row */}
              <div className="col-md-4 mb-3">
                <InputField
                  label="Stone Weight (g)"
                  type="text"
                  name="stone_wt"
                  value={formData.stone_wt}
                  onChange={handleChange}
                  placeholder="0.000"
                  pattern="^\d*\.?\d{0,3}$"
                  title="Enter weight with up to 3 decimal places"
                />
              </div>

              <div className="col-md-4 mb-3">
                <InputField
                  label="Net Weight (g)"
                  type="text"
                  name="net_wt"
                  value={formData.net_wt}
                  readOnly={true}
                  placeholder="0.000"
                />
              </div>
            </div>

            {/* Hidden field for category_id */}
            <input
              type="hidden"
              name="category_id"
              value={formData.category_id}
            />

            {/* Buttons */}
            <div className="product-form-button-container">
              <button
                type="button"
                className="product-form-back-btn"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="product-form-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : editingRecord ? "Update Product" : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ProductForm;