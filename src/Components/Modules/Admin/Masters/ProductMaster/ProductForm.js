import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InputField from "../../../../Pages/TableLayout/InputField";
import Swal from 'sweetalert2';
import { Container, Row, Col, Button, Table } from "react-bootstrap";
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
    barcode: true,
    rate: false
  });

  // Get editing record if exists
  const editingRecord = location.state?.editingRecord || null;

  // Initialize form data with empty values instead of "0.000"
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
    gross_wt: "",
    stone_wt: "",
    net_wt: "",
    stone_price: "",
    pricing: "By Weight",
    va_on: "Gross Weight",
    va_percent: "",
    wastage_weight: "",
    total_weight_av: "",
    mc_on: "MC %",
    mc_per_gram: "",
    making_charges: "",
    rate: "",
    rate_amt: "",
    hm_charges: "60.00",
    tax_percent: "0.9% GST",
    tax_amt: "",
    total_price: "",
    pieace_cost: "",
    disscount_percentage: "",
    disscount: "",
    qty: "1"
  });

  // State for current rate info
  const [currentRateInfo, setCurrentRateInfo] = useState({
    rate: 0,
    rate_date: "",
    rate_time: "",
    isLoading: false
  });

  // Fetch all dropdown data
  useEffect(() => {
    fetchAllData();
  }, []);

  // Initialize form with editing data if available
  useEffect(() => {
    if (editingRecord) {
      console.log("Editing record:", editingRecord);
      
      // Format the editing record data properly
      const formattedData = {
        product_name: editingRecord.product_name || "",
        category_id: editingRecord.category_id || "",
        barcode: editingRecord.barcode || "",
        metal_type_id: editingRecord.metal_type_id?.toString() || "",
        metal_type: editingRecord.metal_type || "",
        purity_id: editingRecord.purity_id?.toString() || "",
        purity: editingRecord.purity || "",
        design_id: editingRecord.design_id?.toString() || "",
        design: editingRecord.design || "",
        gross_wt: editingRecord.gross_wt || "",
        stone_wt: editingRecord.stone_wt || "",
        net_wt: editingRecord.net_wt || "",
        stone_price: editingRecord.stone_price || "",
        pricing: editingRecord.pricing || "By Weight",
        va_on: editingRecord.va_on || "Gross Weight",
        va_percent: editingRecord.va_percent || "",
        wastage_weight: editingRecord.wastage_weight || "",
        total_weight_av: editingRecord.total_weight_av || "",
        mc_on: editingRecord.mc_on || "MC %",
        mc_per_gram: editingRecord.mc_per_gram || "",
        making_charges: editingRecord.making_charges || "",
        rate: editingRecord.rate || "",
        rate_amt: editingRecord.rate_amt || "",
        hm_charges: editingRecord.hm_charges || "60.00",
        tax_percent: editingRecord.tax_percent || "0.9% GST",
        tax_amt: editingRecord.tax_amt || "",
        total_price: editingRecord.total_price || "",
        pieace_cost: editingRecord.pieace_cost || "",
        disscount_percentage: editingRecord.disscount_percentage || "",
        disscount: editingRecord.disscount || "",
        qty: editingRecord.qty?.toString() || "1"
      };
      
      console.log("Formatted data:", formattedData);
      setFormData(formattedData);
      
      // Fetch rate for the purity in editing mode
      if (editingRecord.purity) {
        fetchRateByPurity(editingRecord.purity);
      }
    } else {
      // For new records, set empty values
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
        gross_wt: "",
        stone_wt: "",
        net_wt: "",
        stone_price: "",
        pricing: "By Weight",
        va_on: "Gross Weight",
        va_percent: "",
        wastage_weight: "",
        total_weight_av: "",
        mc_on: "MC %",
        mc_per_gram: "",
        making_charges: "",
        rate: "",
        rate_amt: "",
        hm_charges: "60.00",
        tax_percent: "0.9% GST",
        tax_amt: "",
        total_price: "",
        pieace_cost: "",
        disscount_percentage: "",
        disscount: "",
        qty: "1"
      });
    }
  }, [editingRecord]);

  // Function to extract purity value from purity string (e.g., "16K" -> "16crt", "Silver" -> "silver")
  const extractPurityValue = (purityString) => {
    if (!purityString) return null;
    
    // Remove spaces and convert to lowercase
    const cleanString = purityString.toLowerCase().replace(/\s+/g, '');
    
    // Check for silver - handle different silver names
    if (cleanString.includes('silver') || cleanString === 'silver') {
      return 'silver';
    }
    
    // Extract numeric value for gold (16K, 18K, 22K, 24K)
    const match = cleanString.match(/(\d+)/);
    if (match) {
      const numericValue = match[1];
      return `${numericValue}crt`;
    }
    
    return null;
  };

  // Function to fetch rate by purity
  const fetchRateByPurity = async (purityString) => {
    if (!purityString) {
      setFormData(prev => ({
        ...prev,
        rate: ""
      }));
      return;
    }

    const purityValue = extractPurityValue(purityString);
    
    console.log("Purity string:", purityString);
    console.log("Extracted purity value:", purityValue);
    
    if (!purityValue) {
      setFormData(prev => ({
        ...prev,
        rate: ""
      }));
      return;
    }

    setLoading(prev => ({ ...prev, rate: true }));
    setCurrentRateInfo(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`http://localhost:5000/rates/by-purity/${purityValue}`);
      
      if (response.ok) {
        const rateData = await response.json();
        console.log("Rate data received:", rateData);
        
        setFormData(prev => ({
          ...prev,
          rate: rateData.rate ? rateData.rate.toString() : ""
        }));
        
        setCurrentRateInfo({
          rate: rateData.rate || 0,
          rate_date: rateData.rate_date || "",
          rate_time: rateData.rate_time || "",
          isLoading: false
        });
      } else {
        // If API fails, keep the current rate or set to empty
        setFormData(prev => ({
          ...prev,
          rate: prev.rate || ""
        }));
        setCurrentRateInfo(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error fetching rate:', error);
      setFormData(prev => ({
        ...prev,
        rate: ""
      }));
      setCurrentRateInfo(prev => ({ ...prev, isLoading: false }));
    } finally {
      setLoading(prev => ({ ...prev, rate: false }));
    }
  };

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

      // Don't fetch barcode initially
      setLoading(prev => ({ ...prev, barcode: false }));

    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Data Loading Error',
        text: 'Failed to load dropdown data. Please refresh the page.',
        confirmButtonColor: '#3085d6',
      });

      setLoading({
        metals: false,
        purities: false,
        designs: false,
        productNames: false,
        barcode: false,
        rate: false
      });
    }
  };

  const fetchNextBarcode = async (categoryId, productName) => {
    setLoading(prev => ({ ...prev, barcode: true }));

    try {
      const categoryResponse = await fetch(`http://localhost:5000/get/category-by-name/${encodeURIComponent(productName)}`);

      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        const prefix = categoryData.prefix;

        if (prefix) {
          const barcodeResponse = await fetch(`http://localhost:5000/getNextBarcodeByPrefix?prefix=${prefix}`);

          if (barcodeResponse.ok) {
            const barcodeData = await barcodeResponse.json();

            if (barcodeData.nextBarcode) {
              setFormData(prev => ({
                ...prev,
                barcode: barcodeData.nextBarcode
              }));
            } else {
              setFormData(prev => ({
                ...prev,
                barcode: `${prefix}001`
              }));
            }
          } else {
            setFormData(prev => ({
              ...prev,
              barcode: `${prefix}001`
            }));
          }
        } else {
          fetchOldBarcode();
        }
      } else {
        fetchOldBarcode();
      }
    } catch (error) {
      console.error('Error fetching barcode:', error);
      fetchOldBarcode();
    } finally {
      setLoading(prev => ({ ...prev, barcode: false }));
    }
  };

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

  // Calculate wastage weight and total weight
  const calculateWastageAndTotalWeight = (grossWt, stoneWt, vaPercent, vaOn) => {
    const gross = parseFloat(grossWt) || 0;
    const stone = parseFloat(stoneWt) || 0;
    const net = gross - stone;
    const wastagePercent = parseFloat(vaPercent) || 0;

    let wastageWeight = 0;
    let totalWeight = net;

    if (vaOn === "Gross Weight") {
      wastageWeight = (gross * wastagePercent) / 100;
      totalWeight = net + wastageWeight;
    } else if (vaOn === "Weight BW") {
      wastageWeight = (net * wastagePercent) / 100;
      totalWeight = net + wastageWeight;
    }

    return {
      wastageWeight: wastageWeight.toFixed(3),
      totalWeight: totalWeight.toFixed(3)
    };
  };

  // Calculate making charges
  const calculateMakingCharges = (totalWeight, mcPerGram, mcOn, rateAmt) => {
    const total = parseFloat(totalWeight) || 0;
    const mcGram = parseFloat(mcPerGram) || 0;
    const rateAmount = parseFloat(rateAmt) || 0;

    let makingCharges = 0;

    if (mcOn === "MC / Gram") {
      makingCharges = mcGram * total;
    } else if (mcOn === "MC %") {
      makingCharges = (mcGram * rateAmount) / 100;
    }

    return makingCharges.toFixed(2);
  };

  // Calculate rate amount
  const calculateRateAmount = (rate, totalWeight, pricing, qty) => {
    const rateValue = parseFloat(rate) || 0;
    const total = parseFloat(totalWeight) || 0;
    const quantity = parseFloat(qty) || 1;

    let rateAmount = 0;

    if (pricing === "By Weight") {
      rateAmount = rateValue * total;
    } else if (pricing === "By fixed") {
      rateAmount = rateValue * quantity;
    }

    return rateAmount.toFixed(2);
  };

  // Calculate tax and total price
  const calculateTaxAndTotal = (rateAmt, stonePrice, makingCharges, hmCharges, taxPercent, discount) => {
    const rateAmount = parseFloat(rateAmt) || 0;
    const stone = parseFloat(stonePrice) || 0;
    const mc = parseFloat(makingCharges) || 0;
    const hm = parseFloat(hmCharges) || 0;
    const discountAmt = parseFloat(discount) || 0;

    // Extract numeric tax percentage
    const taxPercentNum = parseFloat(taxPercent) || 0;

    const totalBeforeTax = rateAmount + stone + mc + hm - discountAmt;
    const taxAmt = (totalBeforeTax * taxPercentNum) / 100;
    const totalPrice = totalBeforeTax + taxAmt;

    return {
      taxAmt: taxAmt.toFixed(2),
      totalPrice: totalPrice.toFixed(2)
    };
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    // Handle numeric fields - allow empty string
    const numericFields = [
      'gross_wt', 'stone_wt', 'net_wt', 'stone_price', 'va_percent',
      'wastage_weight', 'total_weight_av', 'mc_per_gram', 'making_charges',
      'rate', 'rate_amt', 'hm_charges', 'tax_amt', 'total_price',
      'pieace_cost', 'disscount_percentage', 'disscount', 'qty'
    ];

    if (numericFields.includes(name)) {
      // Allow empty string or valid numbers
      if (value === '' || /^\d*\.?\d{0,3}$/.test(value) || name === 'qty' && /^\d*$/.test(value)) {
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

    // When product name is selected
    if (name === 'product_name') {
      const selectedProduct = productNames.find(p => p.category_name === value);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          category_id: selectedProduct.category_id,
          product_name: value
        }));

        if (!editingRecord) {
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
          metal_type_id: value
        }));
      }
    }

    if (name === 'purity_id') {
      const selectedPurity = purities.find(p => p.id.toString() === value);
      if (selectedPurity) {
        setFormData(prev => ({
          ...prev,
          purity: selectedPurity.name,
          purity_id: value
        }));

        // Fetch rate based on purity
        fetchRateByPurity(selectedPurity.name);
      }
    }

    if (name === 'design_id') {
      const selectedDesign = designs.find(d => d.id.toString() === value);
      if (selectedDesign) {
        setFormData(prev => ({
          ...prev,
          design: selectedDesign.design_name,
          design_id: value
        }));
      }
    }
  };

  // Auto-calculate when dependent fields change
  useEffect(() => {
    // Calculate net weight
    const gross = parseFloat(formData.gross_wt) || 0;
    const stone = parseFloat(formData.stone_wt) || 0;
    const net = gross - stone;

    const currentNetWt = parseFloat(formData.net_wt) || 0;
    if (net !== currentNetWt) {
      setFormData(prev => ({
        ...prev,
        net_wt: net < 0 ? "" : net.toFixed(3),
      }));
    }
  }, [formData.gross_wt, formData.stone_wt]);

  // Calculate wastage and total weight when relevant fields change
  useEffect(() => {
    const { wastageWeight, totalWeight } = calculateWastageAndTotalWeight(
      formData.gross_wt || "0",
      formData.stone_wt || "0",
      formData.va_percent || "0",
      formData.va_on
    );

    const currentWastage = parseFloat(formData.wastage_weight) || 0;
    const currentTotal = parseFloat(formData.total_weight_av) || 0;

    if (parseFloat(wastageWeight) !== currentWastage) {
      setFormData(prev => ({
        ...prev,
        wastage_weight: wastageWeight === "0.000" ? "" : wastageWeight,
      }));
    }

    if (parseFloat(totalWeight) !== currentTotal) {
      setFormData(prev => ({
        ...prev,
        total_weight_av: totalWeight === "0.000" ? "" : totalWeight,
      }));
    }
  }, [formData.gross_wt, formData.stone_wt, formData.va_percent, formData.va_on]);

  // Calculate rate amount
  useEffect(() => {
    const rateAmount = calculateRateAmount(
      formData.rate || "0",
      formData.total_weight_av || "0",
      formData.pricing,
      formData.qty || "1"
    );

    const currentRateAmt = parseFloat(formData.rate_amt) || 0;
    if (parseFloat(rateAmount) !== currentRateAmt) {
      setFormData(prev => ({
        ...prev,
        rate_amt: rateAmount === "0.00" ? "" : rateAmount,
      }));
    }
  }, [formData.rate, formData.total_weight_av, formData.pricing, formData.qty]);

  // Calculate making charges
  useEffect(() => {
    const makingCharges = calculateMakingCharges(
      formData.total_weight_av || "0",
      formData.mc_per_gram || "0",
      formData.mc_on,
      formData.rate_amt || "0"
    );

    const currentMakingCharges = parseFloat(formData.making_charges) || 0;
    if (parseFloat(makingCharges) !== currentMakingCharges) {
      setFormData(prev => ({
        ...prev,
        making_charges: makingCharges === "0.00" ? "" : makingCharges,
      }));
    }
  }, [formData.total_weight_av, formData.mc_per_gram, formData.mc_on, formData.rate_amt]);

  // Calculate tax and total price
  useEffect(() => {
    const { taxAmt, totalPrice } = calculateTaxAndTotal(
      formData.rate_amt || "0",
      formData.stone_price || "0",
      formData.making_charges || "0",
      formData.hm_charges || "0",
      formData.tax_percent,
      formData.disscount || "0"
    );

    const currentTaxAmt = parseFloat(formData.tax_amt) || 0;
    const currentTotalPrice = parseFloat(formData.total_price) || 0;

    if (parseFloat(taxAmt) !== currentTaxAmt) {
      setFormData(prev => ({
        ...prev,
        tax_amt: taxAmt === "0.00" ? "" : taxAmt,
      }));
    }

    if (parseFloat(totalPrice) !== currentTotalPrice) {
      setFormData(prev => ({
        ...prev,
        total_price: totalPrice === "0.00" ? "" : totalPrice,
      }));
    }
  }, [formData.rate_amt, formData.stone_price, formData.making_charges,
  formData.hm_charges, formData.tax_percent, formData.disscount]);

  // Calculate discount when discount percentage changes
  useEffect(() => {
    const makingCharges = parseFloat(formData.making_charges) || 0;
    const discountPercent = parseFloat(formData.disscount_percentage) || 0;
    const discountAmount = (makingCharges * discountPercent) / 100;

    const currentDiscount = parseFloat(formData.disscount) || 0;
    if (discountAmount !== currentDiscount) {
      setFormData(prev => ({
        ...prev,
        disscount: discountAmount === 0 ? "" : discountAmount.toFixed(2),
      }));
    }
  }, [formData.disscount_percentage, formData.making_charges]);

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

    // Validate barcode format
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

    // Prepare data for API - convert empty strings to "0.00" or "0.000"
    const apiData = {
      ...formData,
      gross_wt: formData.gross_wt || "0.000",
      stone_wt: formData.stone_wt || "0.000",
      net_wt: formData.net_wt || "0.000",
      stone_price: formData.stone_price || "0.00",
      pricing: formData.pricing || "By Weight",
      va_on: formData.va_on || "Gross Weight",
      va_percent: formData.va_percent || "0.00",
      wastage_weight: formData.wastage_weight || "0.000",
      total_weight_av: formData.total_weight_av || "0.000",
      mc_on: formData.mc_on || "MC %",
      mc_per_gram: formData.mc_per_gram || "0.00",
      making_charges: formData.making_charges || "0.00",
      rate: formData.rate || "0.00",
      rate_amt: formData.rate_amt || "0.00",
      hm_charges: formData.hm_charges || "60.00",
      tax_percent: formData.tax_percent || "0.9% GST",
      tax_amt: formData.tax_amt || "0.00",
      total_price: formData.total_price || "0.00",
      pieace_cost: formData.pieace_cost || "0.00",
      disscount_percentage: formData.disscount_percentage || "0.00",
      disscount: formData.disscount || "0.00",
      qty: formData.qty || "1"
    };

    console.log("Submitting data:", apiData);

    try {
      let url = "http://localhost:5000/post/product";
      let method = "POST";

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

        Swal.fire({
          icon: 'success',
          title: editingRecord ? 'Product Updated Successfully!' : 'Product Added Successfully!',
          text: editingRecord
            ? 'Product details have been updated successfully.'
            : `Product added with barcode: ${formData.barcode}`,
          confirmButtonColor: '#3085d6',
        }).then((result) => {
          if (result.isConfirmed) {
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

  const productNameOptions = [
    { value: "", label: "Select Product Name", disabled: true },
    ...productNames.map(product => ({
      value: product.category_name,
      label: `${product.category_name} (${product.prefix || 'No Prefix'})`
    }))
  ];

  const metalTypeOptions = [
    { value: "", label: "Select Metal Type", disabled: true },
    ...metalTypes.map(metal => ({
      value: metal.id.toString(),
      label: metal.metal_name
    }))
  ];

  const purityOptions = [
    { value: "", label: "Select Purity", disabled: true },
    ...purities.map(purity => ({
      value: purity.id.toString(),
      label: `${purity.name} (${purity.metal})`
    }))
  ];

  const designOptions = [
    { value: "", label: "Select Design", disabled: true },
    ...designs.map(design => ({
      value: design.id.toString(),
      label: `${design.design_name} (${design.metal})`
    }))
  ];

  const pricingOptions = [
    { value: "By Weight", label: "By Weight" },
    { value: "By fixed", label: "By fixed" }
  ];

  const vaOnOptions = [
    { value: "Gross Weight", label: "Gross Weight" },
    { value: "Weight BW", label: "Weight BW" }
  ];

  const mcOnOptions = [
    { value: "MC / Gram", label: "MC / Gram" },
    { value: "MC / Piece", label: "MC / Piece" },
    { value: "MC %", label: "MC %" }
  ];

  const taxPercentOptions = [
    { value: "0.9% GST", label: "0.9% GST" },
    { value: "3% GST", label: "3% GST" },
    { value: "5% GST", label: "5% GST" },
    { value: "12% GST", label: "12% GST" },
    { value: "18% GST", label: "18% GST" },
    { value: "28% GST", label: "28% GST" }
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
            <Row className="product-form-section">
              {/* Product Name, Barcode, Metal Type, Design, Purity */}
              <Col xs={12} md={3}>
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
              </Col>

              <Col xs={12} md={3}>
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
              </Col>

              <Col xs={12} md={2}>
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
              </Col>

              <Col xs={12} md={2}>
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
              </Col>

              <Col xs={12} md={2}>
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
              </Col>

              {/* Pricing dropdown */}
              <Col xs={12} md={2}>
                <InputField
                  label="Pricing"
                  type="select"
                  name="pricing"
                  value={formData.pricing || "By Weight"}
                  onChange={handleChange}
                  options={[
                    { value: "By Weight", label: "By Weight" },
                    { value: "By fixed", label: "By fixed" }
                  ]}
                />
              </Col>

              {/* Condition based on Pricing selection */}
              {formData.pricing === "By fixed" ? (
                <>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Piece Cost"
                      type="text"
                      name="pieace_cost"
                      value={formData.pieace_cost}
                      onChange={handleChange}
                      placeholder="0.00"
                      pattern="^\d*\.?\d{0,2}$"
                      title="Enter piece cost with up to 2 decimal places"
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Amount"
                      type="text"
                      name="rate_amt"
                      value={formData.rate_amt}
                      readOnly={false}
                      placeholder="0.00"
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Qty"
                      type="number"
                      name="qty"
                      value={formData.qty}
                      onChange={handleChange}
                      placeholder="1"
                      min="1"
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Tax %"
                      type="select"
                      name="tax_percent"
                      value={formData.tax_percent}
                      onChange={handleChange}
                      options={taxPercentOptions}
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Tax Amt"
                      type="text"
                      name="tax_amt"
                      value={formData.tax_amt}
                      readOnly={true}
                      placeholder="0.00"
                    />
                  </Col>
                  <Col xs={12} md={2}>
                    <InputField
                      label="Total Price"
                      type="text"
                      name="total_price"
                      value={formData.total_price}
                      readOnly={true}
                      placeholder="0.00"
                    />
                  </Col>
                </>
              ) : (
                <>
                  {/* Weight-based pricing fields */}
                  <Col xs={12} md={1}>
                    <InputField
                      label="Gross Wt"
                      type="text"
                      name="gross_wt"
                      value={formData.gross_wt}
                      onChange={handleChange}
                      placeholder="0.000"
                      pattern="^\d*\.?\d{0,3}$"
                      title="Enter weight with up to 3 decimal places"
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Stones Wt"
                      type="text"
                      name="stone_wt"
                      value={formData.stone_wt}
                      onChange={handleChange}
                      placeholder="0.000"
                      pattern="^\d*\.?\d{0,3}$"
                      title="Enter weight with up to 3 decimal places"
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="St Price"
                      type="text"
                      name="stone_price"
                      value={formData.stone_price}
                      onChange={handleChange}
                      placeholder="0.00"
                      pattern="^\d*\.?\d{0,2}$"
                      title="Enter price with up to 2 decimal places"
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Wt BW"
                      type="text"
                      name="net_wt"
                      value={formData.net_wt}
                      readOnly={true}
                      placeholder="0.000"
                    />
                  </Col>
                  <Col xs={12} md={2}>
                    <InputField
                      label="Wastage On"
                      type="select"
                      name="va_on"
                      value={formData.va_on || "Gross Weight"}
                      onChange={handleChange}
                      options={[
                        { value: "Gross Weight", label: "Gross Weight" },
                        { value: "Weight BW", label: "Weight BW" }
                      ]}
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Wastage %"
                      type="text"
                      name="va_percent"
                      value={formData.va_percent}
                      onChange={handleChange}
                      placeholder="0.00"
                      pattern="^\d*\.?\d{0,2}$"
                      title="Enter percentage with up to 2 decimal places"
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="W.Wt"
                      type="text"
                      name="wastage_weight"
                      value={formData.wastage_weight}
                      readOnly={true}
                      placeholder="0.000"
                    />
                  </Col>
                  <Col xs={12} md={2}>
                    <InputField
                      label="Total Weight AW"
                      type="text"
                      name="total_weight_av"
                      value={formData.total_weight_av}
                      readOnly={true}
                      placeholder="0.000"
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Rate"
                      type="text"
                      name="rate"
                      value={formData.rate}
                      onChange={handleChange}
                      placeholder="0.00"
                      pattern="^\d*\.?\d{0,2}$"
                      title="Enter rate with up to 2 decimal places"
                      readOnly={loading.rate}
                      disabled={loading.rate}
                      className={loading.rate ? "rate-loading-field" : ""}
                    />
                    {loading.rate && <small>Fetching rate...</small>}
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Amount"
                      type="text"
                      name="rate_amt"
                      value={formData.rate_amt}
                      readOnly={true}
                      placeholder="0.00"
                    />
                  </Col>
                  <Col xs={12} md={2}>
                    <InputField
                      label="MC On"
                      type="select"
                      name="mc_on"
                      value={formData.mc_on || "MC %"}
                      onChange={handleChange}
                      options={[
                        { value: "MC / Gram", label: "MC / Gram" },
                        { value: "MC / Piece", label: "MC / Piece" },
                        { value: "MC %", label: "MC %" }
                      ]}
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label={formData.mc_on === "MC %" ? "MC %" : "MC/Gm"}
                      type="text"
                      name="mc_per_gram"
                      value={formData.mc_per_gram}
                      onChange={handleChange}
                      placeholder="0.00"
                      pattern="^\d*\.?\d{0,2}$"
                      title="Enter value with up to 2 decimal places"
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Total MC"
                      type="text"
                      name="making_charges"
                      value={formData.making_charges}
                      readOnly={true}
                      placeholder="0.00"
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="HMCharge"
                      type="text"
                      name="hm_charges"
                      value={formData.hm_charges}
                      onChange={handleChange}
                      placeholder="60.00"
                      pattern="^\d*\.?\d{0,2}$"
                      title="Enter HM charges with up to 2 decimal places"
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Tax %"
                      type="select"
                      name="tax_percent"
                      value={formData.tax_percent}
                      onChange={handleChange}
                      options={taxPercentOptions}
                    />
                  </Col>
                  <Col xs={12} md={1}>
                    <InputField
                      label="Tax Amt"
                      type="text"
                      name="tax_amt"
                      value={formData.tax_amt}
                      readOnly={true}
                      placeholder="0.00"
                    />
                  </Col>
                  <Col xs={12} md={2}>
                    <InputField
                      label="Total Price"
                      type="text"
                      name="total_price"
                      value={formData.total_price}
                      readOnly={true}
                      placeholder="0.00"
                    />
                  </Col>
                </>
              )}

              {/* Qty field only for By Weight pricing */}
              {formData.pricing !== "By fixed" && (
                <Col xs={12} md={1}>
                  <InputField
                    label="Qty"
                    type="number"
                    name="qty"
                    value={formData.qty}
                    onChange={handleChange}
                    placeholder="1"
                    min="1"
                  />
                </Col>
              )}

              {/* Hidden field for category_id */}
              <input
                type="hidden"
                name="category_id"
                value={formData.category_id}
              />
            </Row>

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
                disabled={isSubmitting || loading.rate}
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