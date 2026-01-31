import React, { useState, useEffect } from "react";
import "./EstimateForm.css";
import InputField from "../../../Pages/TableLayout/InputField";
import { Container, Row, Col, Button, Table, Modal, Image } from "react-bootstrap";
import axios from "axios";
import baseURL from "../../../Modules/ApiUrl/NodeBaseURL";
import { FaEdit, FaTrash, FaImage } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import PDFContent from "./EstimateReceipt";
import { useLocation } from "react-router-dom";
import Navbar from "../../../Pages/Navbar/SalesNavbar";

const EstimateForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().split("T")[0];

  const initialFormData = {
    date: today,
    estimate_number: "",
    product_id: "",
    product_name: "",
    customer_name: "",
    customer_id: "",
    barcode: "",
    metal_type: "",
    design_name: "",
    purity: "",
    gross_weight: "",
    stone_weight: "",
    stone_price: "",
    weight_bw: "",
    va_on: "Gross Weight",
    va_percent: "",
    wastage_weight: "",
    total_weight_av: "",
    mc_on: "MC %",
    mc_per_gram: "",
    making_charges: "",
    disscount_percentage: "",
    disscount: "",
    rate: "",
    rate_amt: "",
    tax_percent: "03% GST",
    tax_amt: "",
    hm_charges: "60.00",
    total_price: "",
    total_amount: "0.00",
    pricing: "By Weight",
    opentag_id: "",
    images: [] // Added images field
  };

  const [formData, setFormData] = useState(initialFormData);
  const [entries, setEntries] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [tagsData, setTagsData] = useState([]);
  const [isQtyEditable, setIsQtyEditable] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [rates, setRates] = useState({
    rate_24crt: "",
    rate_22crt: "",
    rate_18crt: "",
    rate_16crt: "",
    silver_rate: ""
  });

  const [productOptions, setProductOptions] = useState([]);
  const [barcodeOptions, setBarcodeOptions] = useState([]);
  const [metalTypeOptions, setMetalTypeOptions] = useState([]);
  const [designOptions, setDesignOptions] = useState([]);
  const [purityOptions, setPurityOptions] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [currentProductImages, setCurrentProductImages] = useState([]);

  // Function to get full image URL
  const getImageUrl = (imageName) => {
    if (!imageName) return "";
    // Construct full URL for the image
    return `${baseURL}/uploads/products/${imageName}`;
  };

  // Fetch all products for dropdowns
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${baseURL}/get/products`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const result = await response.json();
        setAllProducts(result);

        // Create product name options
        const productOpts = result.map(product => ({
          value: product.product_name,
          label: product.product_name
        }));
        setProductOptions(productOpts);

        // Create barcode options
        const barcodeOpts = result.map(product => ({
          value: product.barcode,
          label: product.barcode
        }));
        setBarcodeOptions(barcodeOpts);

      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${baseURL}/api/users`);
        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }
        const data = await response.json();

        // Filter customers with role "Customer" and status "approved"
        const filteredCustomers = data.filter(user =>
          user.role === 'Customer' && user.status === 'approved'
        );

        setCustomers(filteredCustomers);

        // Create options for dropdown with customer name as value
        const customerOpts = filteredCustomers.map(customer => ({
          value: customer.full_name,
          label: customer.full_name,
          customerId: customer.id || customer._id || customer.user_id
        }));

        setCustomerOptions(customerOpts);

      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch tags data
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(`${baseURL}/get/opening-tags-entry`);
        if (!response.ok) {
          throw new Error("Failed to fetch tags");
        }
        const result = await response.json();
        setTagsData(result.result || []);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, []);

  // Fetch current rates
  useEffect(() => {
    const fetchCurrentRates = async () => {
      try {
        const response = await axios.get(`${baseURL}/get/current-rates`);
        setRates({
          rate_24crt: response.data.rate_24crt || "",
          rate_22crt: response.data.rate_22crt || "",
          rate_18crt: response.data.rate_18crt || "",
          rate_16crt: response.data.rate_16crt || "",
          silver_rate: response.data.silver_rate || ""
        });
      } catch (error) {
        console.error('Error fetching current rates:', error);
      }
    };

    fetchCurrentRates();
  }, []);

  // Fetch metal types, designs, and purities
  useEffect(() => {
    const fetchMetalTypes = async () => {
      try {
        const response = await fetch(`${baseURL}/metaltype`);
        const data = await response.json();
        const options = data.map(item => ({
          value: item.metal_name,
          label: item.metal_name
        }));
        setMetalTypeOptions(options);
      } catch (error) {
        console.error('Error fetching metal types:', error);
      }
    };

    const fetchDesigns = async () => {
      try {
        const response = await fetch(`${baseURL}/designmaster`);
        const data = await response.json();
        const options = data.map(item => ({
          value: item.design_name,
          label: item.design_name
        }));
        setDesignOptions(options);
      } catch (error) {
        console.error('Error fetching designs:', error);
      }
    };

    const fetchPurities = async () => {
      try {
        const response = await fetch(`${baseURL}/purity`);
        const data = await response.json();
        const options = data.map(item => ({
          value: item.name,
          label: `${item.name} (${item.metal})`
        }));
        setPurityOptions(options);
      } catch (error) {
        console.error('Error fetching purities:', error);
      }
    };

    fetchMetalTypes();
    fetchDesigns();
    fetchPurities();
  }, []);

  // Handle product name selection - UPDATED to fetch images
  const handleProductNameChange = async (productName) => {
    try {
      if (!productName) {
        resetFormData();
        return;
      }

      // Find product in allProducts array
      const selectedProduct = allProducts.find(p => p.product_name === productName);

      if (selectedProduct) {
        // Fetch full product details by ID
        const response = await fetch(`${baseURL}/get/product/${selectedProduct.product_id}`);
        if (response.ok) {
          const productDetails = await response.json();

          // Use the rate from productDetails instead of calculating from current rates
          const productRate = productDetails.rate || "";

          // Get images array from product details
          const productImages = productDetails.images || [];

          // Update form with product details including images
          setFormData(prev => ({
            ...prev,
            product_id: productDetails.product_id,
            category_id: productDetails.category_id,
            product_name: productDetails.product_name,
            barcode: productDetails.barcode,
            metal_type_id: productDetails.metal_type_id,
            metal_type: productDetails.metal_type,
            purity_id: productDetails.purity_id,
            purity: productDetails.purity,
            design_id: productDetails.design_id,
            design_name: productDetails.design,
            gross_weight: productDetails.gross_wt,
            stone_weight: productDetails.stone_wt,
            net_weight: productDetails.net_wt,
            stone_price: productDetails.stone_price,
            weight_bw: (parseFloat(productDetails.gross_wt) - parseFloat(productDetails.stone_wt)).toFixed(3),
            pricing: productDetails.pricing || "By Weight",
            va_on: productDetails.va_on || "Gross Weight",
            va_percent: productDetails.va_percent || "",
            wastage_weight: productDetails.wastage_weight || "",
            total_weight_av: productDetails.total_weight_av || "",
            mc_on: productDetails.mc_on || "MC %",
            mc_per_gram: productDetails.mc_per_gram || "",
            making_charges: productDetails.making_charges || "",
            rate: productRate,
            rate_amt: productDetails.rate_amt || "",
            hm_charges: productDetails.hm_charges || "60.00",
            tax_percent: productDetails.tax_percent || "03% GST",
            tax_amt: productDetails.tax_amt || "",
            total_price: productDetails.total_price || "",
            pieace_cost: productDetails.pieace_cost || "",
            disscount_percentage: productDetails.disscount_percentage || "",
            disscount: productDetails.disscount || "",
            qty: productDetails.qty || 1,
            images: productImages // Set images
          }));

          // Set current images for modal
          setCurrentProductImages(productImages);
        }
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

  // Handle barcode selection - UPDATED to fetch images
  const handleBarcodeChange = async (barcode) => {
    try {
      if (!barcode) {
        resetFormData();
        return;
      }

      // First check in products
      const selectedProduct = allProducts.find(p => p.barcode === barcode);

      if (selectedProduct) {
        // Fetch full product details by ID
        const response = await fetch(`${baseURL}/get/product/${selectedProduct.product_id}`);
        if (response.ok) {
          const productDetails = await response.json();

          // Use the rate from productDetails
          const productRate = productDetails.rate || "";

          // Get images array from product details
          const productImages = productDetails.images || [];

          setFormData(prev => ({
            ...prev,
            product_id: productDetails.product_id,
            category_id: productDetails.category_id,
            product_name: productDetails.product_name,
            barcode: productDetails.barcode,
            metal_type_id: productDetails.metal_type_id,
            metal_type: productDetails.metal_type,
            purity_id: productDetails.purity_id,
            purity: productDetails.purity,
            design_id: productDetails.design_id,
            design_name: productDetails.design,
            gross_weight: productDetails.gross_wt,
            stone_weight: productDetails.stone_wt,
            net_weight: productDetails.net_wt,
            stone_price: productDetails.stone_price,
            weight_bw: (parseFloat(productDetails.gross_wt) - parseFloat(productDetails.stone_wt)).toFixed(3),
            pricing: productDetails.pricing || "By Weight",
            va_on: productDetails.va_on || "Gross Weight",
            va_percent: productDetails.va_percent || "",
            wastage_weight: productDetails.wastage_weight || "",
            total_weight_av: productDetails.total_weight_av || "",
            mc_on: productDetails.mc_on || "MC %",
            mc_per_gram: productDetails.mc_per_gram || "",
            making_charges: productDetails.making_charges || "",
            rate: productRate,
            rate_amt: productDetails.rate_amt || "",
            hm_charges: productDetails.hm_charges || "60.00",
            tax_percent: productDetails.tax_percent || "03% GST",
            tax_amt: productDetails.tax_amt || "",
            total_price: productDetails.total_price || "",
            pieace_cost: productDetails.pieace_cost || "",
            disscount_percentage: productDetails.disscount_percentage || "",
            disscount: productDetails.disscount || "",
            qty: productDetails.qty || 1,
            images: productImages // Set images
          }));
          setIsQtyEditable(true);

          // Set current images for modal
          setCurrentProductImages(productImages);
        }
      } else {
        // Check in tags data
        const selectedTag = tagsData.find(t => t.PCode_BarCode === barcode);

        if (selectedTag) {
          // Get rate from tag data or calculate from current rates based on purity
          let tagRate = selectedTag.rate || "";

          // If no rate in tag, calculate from current rates based on purity
          if (!tagRate && selectedTag.Purity && selectedTag.metal_type) {
            if (selectedTag.metal_type?.toLowerCase() === "gold" && selectedTag.Purity) {
              if (selectedTag.Purity.includes("24")) {
                tagRate = rates.rate_24crt;
              } else if (selectedTag.Purity.includes("22")) {
                tagRate = rates.rate_22crt;
              } else if (selectedTag.Purity.includes("18")) {
                tagRate = rates.rate_18crt;
              } else if (selectedTag.Purity.includes("16")) {
                tagRate = rates.rate_16crt;
              } else {
                tagRate = rates.rate_22crt;
              }
            } else if (selectedTag.metal_type?.toLowerCase() === "silver" && selectedTag.Purity) {
              tagRate = rates.silver_rate;
            }
          }

          setFormData(prev => ({
            ...prev,
            product_id: selectedTag.product_id || "",
            category_id: selectedTag.category_id || "",
            product_name: selectedTag.sub_category || "",
            barcode: selectedTag.PCode_BarCode,
            metal_type_id: selectedTag.metal_type_id || "",
            metal_type: selectedTag.metal_type || "",
            purity_id: selectedTag.purity_id || "",
            purity: selectedTag.Purity || "",
            design_id: selectedTag.design_id || "",
            design_name: selectedTag.design_master || "",
            gross_weight: selectedTag.Gross_Weight || "",
            stone_weight: selectedTag.Stones_Weight || "",
            net_weight: selectedTag.Net_Weight || "",
            stone_price: selectedTag.Stones_Price || "",
            weight_bw: selectedTag.Weight_BW || "",
            va_on: selectedTag.Wastage_On || "Gross Weight",
            va_percent: selectedTag.Wastage_Percentage || "",
            wastage_weight: selectedTag.WastageWeight || "",
            total_weight_av: selectedTag.TotalWeight_AW || "",
            mc_on: selectedTag.Making_Charges_On || "MC %",
            mc_per_gram: selectedTag.MC_Per_Gram || "",
            making_charges: selectedTag.Making_Charges || "",
            rate: tagRate,
            rate_amt: selectedTag.rate_amt || "",
            hm_charges: selectedTag.hm_charges || "60.00",
            tax_percent: selectedTag.tax_percent || "03% GST",
            tax_amt: selectedTag.tax_amt || "",
            total_price: selectedTag.total_price || "",
            pieace_cost: selectedTag.pieace_cost || "",
            disscount_percentage: selectedTag.disscount_percentage || "",
            disscount: selectedTag.disscount || "",
            qty: selectedTag.qty || 1,
            opentag_id: selectedTag.opentag_id || "",
            pricing: selectedTag.Pricing || "By Weight",
            images: [] // Tags don't have images
          }));
          setIsQtyEditable(false);
          setCurrentProductImages([]);
        }
      }
    } catch (error) {
      console.error('Error handling barcode change:', error);
    }
  };

  const resetFormData = () => {
    setFormData(initialFormData);
    setIsQtyEditable(true);
    setCurrentProductImages([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      let updatedData = {
        ...prevData,
        [name]: value,
      };

      // Handle customer name change
      if (name === "customer_name") {
        const selectedCustomerOption = customerOptions.find(opt => opt.value === value);
        if (selectedCustomerOption) {
          updatedData.customer_name = selectedCustomerOption.value;
          updatedData.customer_id = selectedCustomerOption.customerId;
        } else {
          updatedData.customer_name = "";
          updatedData.customer_id = "";
        }
      }

      // Handle product name change
      if (name === "product_name" && value !== prevData.product_name) {
        handleProductNameChange(value);
      }

      // Handle barcode change
      if (name === "barcode" && value !== prevData.barcode) {
        handleBarcodeChange(value);
      }

      // Handle manual metal type change - calculate rate if not from product/tag
      if ((name === "metal_type" || name === "purity") &&
        !prevData.product_id && !prevData.opentag_id &&
        value && updatedData.metal_type && updatedData.purity) {

        let currentRate = "";
        if (updatedData.metal_type?.toLowerCase() === "gold" && updatedData.purity) {
          if (updatedData.purity.includes("24")) {
            currentRate = rates.rate_24crt;
          } else if (updatedData.purity.includes("22")) {
            currentRate = rates.rate_22crt;
          } else if (updatedData.purity.includes("18")) {
            currentRate = rates.rate_18crt;
          } else if (updatedData.purity.includes("16")) {
            currentRate = rates.rate_16crt;
          } else {
            currentRate = rates.rate_22crt;
          }
        } else if (updatedData.metal_type?.toLowerCase() === "silver" && updatedData.purity) {
          currentRate = rates.silver_rate;
        }

        if (currentRate) {
          updatedData.rate = currentRate;
        }
      }

      if (name === "disscount_percentage") {
        const discountPercentage = parseFloat(value) || 0;
        const makingCharges = parseFloat(prevData.making_charges) || 0;
        const discountAmount = (discountPercentage / 100) * makingCharges;

        updatedData.disscount = discountAmount.toFixed(2);
      }

      if (name === "mc_on") {
        updatedData.mc_per_gram = "";
        updatedData.making_charges = "";
      }

      return updatedData;
    });
  };

  // Calculate net weight when gross or stone weight changes
  useEffect(() => {
    const grossWeight = parseFloat(formData.gross_weight) || 0;
    const stonesWeight = parseFloat(formData.stone_weight) || 0;
    const weightBW = grossWeight - stonesWeight;

    setFormData((prev) => ({
      ...prev,
      weight_bw: weightBW >= 0 ? weightBW.toFixed(3) : "0.000",
    }));
  }, [formData.gross_weight, formData.stone_weight]);

  // Calculate wastage weight and total weight
  useEffect(() => {
    const wastagePercentage = parseFloat(formData.va_percent) || 0;
    const grossWeight = parseFloat(formData.gross_weight) || 0;
    const weightBW = parseFloat(formData.weight_bw) || 0;

    let wastageWeight = 0;
    let totalWeight = 0;

    if (formData.va_on === "Gross Weight") {
      wastageWeight = (grossWeight * wastagePercentage) / 100;
      totalWeight = weightBW + wastageWeight;
    } else if (formData.va_on === "Weight BW") {
      wastageWeight = (weightBW * wastagePercentage) / 100;
      totalWeight = weightBW + wastageWeight;
    }

    setFormData((prev) => ({
      ...prev,
      wastage_weight: wastageWeight.toFixed(3),
      total_weight_av: totalWeight.toFixed(3),
    }));
  }, [formData.va_on, formData.va_percent, formData.gross_weight, formData.weight_bw]);

  // Calculate making charges
  useEffect(() => {
    const totalWeight = parseFloat(formData.total_weight_av) || 0;
    const mcPerGram = parseFloat(formData.mc_per_gram) || 0;
    const makingCharges = parseFloat(formData.making_charges) || 0;
    const rateAmount = parseFloat(formData.rate_amt) || 0;

    if (formData.mc_on === "MC / Gram") {
      const calculatedMakingCharges = mcPerGram * totalWeight;
      setFormData((prev) => ({
        ...prev,
        making_charges: calculatedMakingCharges.toFixed(2),
      }));
    } else if (formData.mc_on === "MC %") {
      const calculatedMakingCharges = (mcPerGram * rateAmount) / 100;
      setFormData((prev) => ({
        ...prev,
        making_charges: calculatedMakingCharges.toFixed(2),
      }));
    } else if (formData.mc_on === "MC / Piece") {
      if (makingCharges && totalWeight > 0) {
        const calculatedMcPerGram = makingCharges / totalWeight;
        setFormData((prev) => ({
          ...prev,
          mc_per_gram: calculatedMcPerGram.toFixed(2),
        }));
      }
    }
  }, [formData.mc_on, formData.mc_per_gram, formData.making_charges, formData.total_weight_av, formData.rate_amt]);

  // Calculate rate amount
  useEffect(() => {
    const rate = parseFloat(formData.rate) || 0;
    const totalWeight = parseFloat(formData.total_weight_av) || 0;
    let rateAmt = 0;

    if (formData.pricing === "By Weight") {
      rateAmt = rate * totalWeight;
    }

    setFormData((prev) => ({
      ...prev,
      rate_amt: rateAmt.toFixed(2),
    }));
  }, [formData.rate, formData.total_weight_av, formData.pricing]);

  // Calculate tax and total price
  useEffect(() => {
    const taxPercentStr = formData.tax_percent || "3% GST";
    const taxPercent = parseFloat(taxPercentStr.replace('% GST', '').trim()) || 3;
    const rateAmt = parseFloat(formData.rate_amt) || 0;
    const stonesPrice = parseFloat(formData.stone_price) || 0;
    const totalMC = parseFloat(formData.making_charges) || 0;
    const discountAmt = parseFloat(formData.disscount) || 0;
    const hmCharges = parseFloat(formData.hm_charges) || 0;

    const totalAmount = rateAmt + stonesPrice + totalMC + hmCharges;
    const taxableAmount = rateAmt + stonesPrice + totalMC + hmCharges - discountAmt;
    const taxAmt = (taxableAmount * taxPercent) / 100;
    const totalPrice = taxableAmount + taxAmt;

    setFormData((prev) => ({
      ...prev,
      tax_amt: taxAmt.toFixed(2),
      total_price: totalPrice.toFixed(2),
    }));
  }, [formData.tax_percent, formData.rate_amt, formData.stone_price, formData.making_charges, formData.disscount, formData.hm_charges]);

  // Fetch last estimate number
  useEffect(() => {
    const fetchLastEstimateNumber = async () => {
      try {
        const response = await axios.get(`${baseURL}/lastEstimateNumber`);
        setFormData((prev) => ({
          ...prev,
          estimate_number: response.data.lastEstimateNumber,
        }));
      } catch (error) {
        console.error("Error fetching estimate number:", error);
      }
    };

    fetchLastEstimateNumber();
  }, []);

  // Handle add/update entry
  const handleAdd = () => {
    if (!formData.product_name || !formData.barcode) {
      alert("Please select a product first");
      return;
    }

    if (!formData.customer_name || !formData.customer_id) {
      alert("Please select a customer");
      return;
    }

    let updatedEntries;
    if (isEditing) {
      updatedEntries = entries.map((entry, index) =>
        index === editIndex ? formData : entry
      );
      setIsEditing(false);
      setEditIndex(null);
    } else {
      updatedEntries = [...entries, formData];
    }

    setEntries(updatedEntries);
    localStorage.setItem("estimateDetails", JSON.stringify(updatedEntries));

    // Reset form but keep estimate number and customer
    setFormData(prev => ({
      ...initialFormData,
      estimate_number: prev.estimate_number,
      customer_name: prev.customer_name,
      customer_id: prev.customer_id,
      date: today,
      images: [] // Reset images
    }));
    setCurrentProductImages([]);
  };

  // Load entries from localStorage
  useEffect(() => {
    const storedEntries = JSON.parse(localStorage.getItem("estimateDetails")) || [];
    setEntries(storedEntries);

    const storedDiscount = parseFloat(localStorage.getItem("estimateDiscount")) || 0;
    setDiscount(storedDiscount);
  }, []);

  const handleEdit = (index) => {
    setFormData(entries[index]);
    setIsEditing(true);
    setEditIndex(index);
    // Set current images for the product being edited
    setCurrentProductImages(entries[index].images || []);
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      const updatedEntries = entries.filter((_, i) => i !== index);
      setEntries(updatedEntries);
      localStorage.setItem("estimateDetails", JSON.stringify(updatedEntries));
      alert("Entry deleted successfully!");
    }
  };

  // Handle discount change
  const handleDiscountChange = (e) => {
    const discountValue = parseFloat(e.target.value) || 0;

    if (discountValue > 15) {
      alert("Discount cannot be greater than 15%");
      return;
    }

    setDiscount(discountValue);
    localStorage.setItem("estimateDiscount", discountValue);

    const updatedEstimateDetails = entries.map((item) => {
      const makingCharges = parseFloat(item.making_charges) || 0;
      const calculatedDiscount = (makingCharges * discountValue) / 100;
      const originalTotalPrice = parseFloat(item.total_price) || 0;
      const updatedTotalPrice = originalTotalPrice - calculatedDiscount;

      return {
        ...item,
        disscount: calculatedDiscount.toFixed(2),
        disscount_percentage: discountValue,
        total_price: updatedTotalPrice.toFixed(2),
      };
    });

    setEntries(updatedEstimateDetails);
    localStorage.setItem("estimateDetails", JSON.stringify(updatedEstimateDetails));
  };

  // Handle print/save
  const handlePrint = async () => {
    try {
      if (entries.length === 0) {
        alert("Please add at least one item before printing");
        return;
      }

      if (!entries[0].customer_id) {
        alert("Customer information is missing. Please select a customer.");
        return;
      }

      const totalAmount = entries.reduce((sum, item) => {
        const stonePrice = parseFloat(item.stone_price) || 0;
        const makingCharges = parseFloat(item.making_charges) || 0;
        const rateAmt = parseFloat(item.rate_amt) || 0;
        const hmCharges = parseFloat(item.hm_charges) || 0;
        return sum + stonePrice + makingCharges + rateAmt + hmCharges;
      }, 0);

      const discountAmt = entries.reduce((sum, item) => sum + (parseFloat(item.disscount) || 0), 0);
      const taxableAmount = totalAmount - discountAmt;
      const taxAmount = entries.reduce((sum, item) => sum + (parseFloat(item.tax_amt) || 0), 0);
      const netAmount = taxableAmount + taxAmount;

      // Save to database - each entry will have customer_id
      await Promise.all(
        entries.map((entry) => {
          const requestData = {
            ...entry,
            customer_id: entry.customer_id,
            customer_name: entry.customer_name,
            total_amount: totalAmount.toFixed(2),
            taxable_amount: taxableAmount.toFixed(2),
            tax_amount: taxAmount.toFixed(2),
            net_amount: netAmount.toFixed(2),
          };
          return axios.post(`${baseURL}/add/estimate`, requestData);
        })
      );

      // Generate PDF
      const pdfDoc = pdf(
        <PDFContent
          entries={entries}
          totalAmount={totalAmount.toFixed(2)}
          taxableAmount={taxableAmount.toFixed(2)}
          taxAmount={taxAmount.toFixed(2)}
          netAmount={netAmount.toFixed(2)}
          date={today}
          estimateNumber={formData.estimate_number}
          sellerName="Sadashri Jewels"
          customerName={entries[0]?.customer_name || ""}
        />
      );

      const blob = await pdfDoc.toBlob();
      saveAs(blob, `estimate_${formData.estimate_number}.pdf`);

      alert("Estimates saved successfully!");

      // Clear localStorage and reset state
      localStorage.removeItem("estimateDetails");
      localStorage.removeItem("estimateDiscount");
      setEntries([]);
      setDiscount(0);
      setFormData(initialFormData);
      setCurrentProductImages([]);

      navigate("/estimation");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save or generate PDF. Please try again.");
    }
  };

  const handleBack = () => {
    navigate("/estimation");
  };

  const handleClose = () => {
    navigate(-1);
  };

  // Function to show images modal
  const showProductImages = (productImages) => {
    setCurrentProductImages(productImages || []);
    setShowImagesModal(true);
  };

  const isByFixed = formData.pricing === "By fixed";

  // Calculate totals
  const totalAmount = entries.reduce((sum, item) => {
    const stonePrice = parseFloat(item.stone_price) || 0;
    const makingCharges = parseFloat(item.making_charges) || 0;
    const rateAmt = parseFloat(item.rate_amt) || 0;
    const hmCharges = parseFloat(item.hm_charges) || 0;
    return sum + stonePrice + makingCharges + rateAmt + hmCharges;
  }, 0);

  const discountAmt = entries.reduce((sum, item) => sum + (parseFloat(item.disscount) || 0), 0);
  const taxableAmount = totalAmount - discountAmt;
  const taxAmount = entries.reduce((sum, item) => sum + parseFloat(item.tax_amt || 0), 0);
  const netAmount = taxableAmount + taxAmount;

  return (
    <>
      <Navbar />
      <div className="main-container" style={{ marginTop: '60px' }}>
        <Container className="estimate-form-container">
          <Row className="estimate-form-section">
            <h2>Estimate</h2>
            <Row className="d-flex justify-content-end align-items-center mb-3" style={{ marginLeft: '9px', marginTop: '-60px' }}>
              <Col xs={12} md={2}>
                <InputField
                  label="Date:"
                  name="date"
                  value={formData.date}
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  onChange={handleInputChange}
                />
              </Col>
              <Col xs={12} md={2}>
                <InputField
                  label="Estimate Number:"
                  name="estimate_number"
                  value={formData.estimate_number}
                  onChange={handleInputChange}
                  readOnly
                />
              </Col>
            </Row>

            <Col xs={12} md={3}>
              <InputField
                label="Customer Name"
                name="customer_name"
                value={formData.customer_name || ""}
                type="select"
                onChange={handleInputChange}
                options={[
                  { value: "", label: "Select Customer Name", disabled: true },
                  ...customerOptions
                ]}
              />
            </Col>

            <Col xs={12} md={3}>
              <InputField
                label="Product Name"
                name="product_name"
                value={formData.product_name || ""}
                type="select"
                onChange={handleInputChange}
                options={[
                  { value: "", label: "Select Product Name", disabled: true },
                  ...productOptions
                ]}
              />
            </Col>

            <Col xs={12} md={3}>
              <InputField
                label="Barcode"
                name="barcode"
                value={formData.barcode || ""}
                type="select"
                onChange={handleInputChange}
                options={[
                  { value: "", label: "Select Barcode", disabled: true },
                  ...barcodeOptions,
                  ...tagsData.map(tag => ({
                    value: tag.PCode_BarCode,
                    label: tag.PCode_BarCode
                  }))
                ]}
              />
            </Col>

            <Col xs={12} md={2}>
              <InputField
                label="Metal Type"
                name="metal_type"
                value={formData.metal_type || ""}
                onChange={handleInputChange}
                type="select"
                options={[
                  { value: "", label: "Select Metal Type", disabled: true },
                  ...metalTypeOptions
                ]}
              />
            </Col>

            <Col xs={12} md={2}>
              <InputField
                label="Product Design Name"
                name="design_name"
                value={formData.design_name || ""}
                onChange={handleInputChange}
                type="select"
                options={[
                  { value: "", label: "Select Design", disabled: true },
                  ...designOptions
                ]}
              />
            </Col>

            <Col xs={12} md={2}>
              <InputField
                label="Purity"
                name="purity"
                value={formData.purity || ""}
                onChange={handleInputChange}
                type="select"
                options={[
                  { value: "", label: "Select Purity", disabled: true },
                  ...purityOptions
                ]}
              />
            </Col>

            <Col xs={12} md={2}>
              <InputField
                label="Pricing"
                name="pricing"
                type="select"
                value={formData.pricing || "By Weight"}
                onChange={handleInputChange}
                options={[
                  { value: "By Weight", label: "By Weight" },
                  { value: "By fixed", label: "By fixed" }
                ]}
              />
            </Col>

            {isByFixed ? (
              <>
                <Col xs={12} md={1}>
                  <InputField
                    label="Piece Cost"
                    name="pieace_cost"
                    value={formData.pieace_cost || ""}
                    onChange={handleInputChange}
                  />
                </Col>
                <Col xs={12} md={1}>
                  <InputField
                    label="Amount"
                    name="rate_amt"
                    value={formData.rate_amt || "0.00"}
                    onChange={handleInputChange}
                    readOnly={false}
                  />
                </Col>
                <Col xs={12} md={1}>
                  <InputField
                    label="Qty"
                    name="qty"
                    value={formData.qty || ""}
                    onChange={handleInputChange}
                    readOnly={!isQtyEditable}
                  />
                </Col>
                <Col xs={12} md={1}>
                  <InputField label="Tax %" name="tax_percent" value={formData.tax_percent} onChange={handleInputChange} />
                </Col>
                <Col xs={12} md={1}>
                  <InputField label="Tax Amt" name="tax_amt" value={formData.tax_amt || "0.00"} onChange={handleInputChange} />
                </Col>
                <Col xs={12} md={2}>
                  <InputField label="Total Price" name="total_price" value={formData.total_price || "0.00"} onChange={handleInputChange} />
                </Col>
              </>
            ) : (
              <>
                <Col xs={12} md={1}>
                  <InputField label="Gross Wt" name="gross_weight" value={formData.gross_weight || ""} onChange={handleInputChange} />
                </Col>
                <Col xs={12} md={1}>
                  <InputField label="Stones Wt" name="stone_weight" value={formData.stone_weight || ""} onChange={handleInputChange} />
                </Col>
                <Col xs={12} md={1}>
                  <InputField label="St Price" name="stone_price" value={formData.stone_price || ""} onChange={handleInputChange} />
                </Col>
                <Col xs={12} md={1}>
                  <InputField label="Wt BW" name="weight_bw" value={formData.weight_bw || "0.000"} onChange={handleInputChange} />
                </Col>
                <Col xs={12} md={2}>
                  <InputField
                    label="Wastage On"
                    name="va_on"
                    type="select"
                    value={formData.va_on || "Gross Weight"}
                    onChange={handleInputChange}
                    options={[
                      { value: "Gross Weight", label: "Gross Weight" },
                      { value: "Weight BW", label: "Weight BW" }
                    ]}
                  />
                </Col>
                <Col xs={12} md={1}>
                  <InputField label="Wastage %" name="va_percent" value={formData.va_percent || ""} onChange={handleInputChange} />
                </Col>
                <Col xs={12} md={1}>
                  <InputField label="W.Wt" name="wastage_weight" value={formData.wastage_weight || "0.000"} onChange={handleInputChange} />
                </Col>
                <Col xs={12} md={2}>
                  <InputField label="Total Weight AW" name="total_weight_av" value={formData.total_weight_av || "0.000"} onChange={handleInputChange} />
                </Col>
                <Col xs={12} md={1}>
                  <InputField label="Rate" name="rate" value={formData.rate || ""} onChange={handleInputChange} />
                </Col>
                <Col xs={12} md={1}>
                  <InputField
                    label="Amount"
                    name="rate_amt"
                    value={formData.rate_amt || "0.00"}
                    onChange={handleInputChange}
                  />
                </Col>
                <Col xs={12} md={2}>
                  <InputField
                    label="MC On"
                    name="mc_on"
                    type="select"
                    value={formData.mc_on || "MC %"}
                    onChange={handleInputChange}
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
                    name="mc_per_gram"
                    value={formData.mc_per_gram || ""}
                    onChange={handleInputChange}
                  />
                </Col>
                <Col xs={12} md={1}>
                  <InputField
                    label="Total MC"
                    name="making_charges"
                    value={formData.making_charges || "0.00"}
                    onChange={handleInputChange}
                  />
                </Col>
                <Col xs={12} md={1}>
                  <InputField
                    label="HMCharge"
                    name="hm_charges"
                    value={formData.hm_charges || "60.00"}
                    onChange={handleInputChange}
                  />
                </Col>
                <Col xs={12} md={1}>
                  <InputField label="Tax %" name="tax_percent" value={formData.tax_percent || "03% GST"} onChange={handleInputChange} />
                </Col>
                <Col xs={12} md={1}>
                  <InputField label="Tax Amt" name="tax_amt" value={formData.tax_amt || "0.00"} onChange={handleInputChange} />
                </Col>
                <Col xs={12} md={2}>
                  <InputField label="Total Price" name="total_price" value={formData.total_price || "0.00"} onChange={handleInputChange} />
                </Col>
              </>
            )}

            {/* Image Preview Section - Moved before the Add button */}
            <Col xs={12} className="mt-2 mb-2">
              <Row className="align-items-center">
                <Col xs={12} md={2}>
                  <div className="d-flex align-items-center">
                    <span className="me-2" style={{ fontSize: "14px", fontWeight: "bold" }}>
                      Product Images:
                    </span>

                     {/* Small image preview thumbnails if you want to show them inline */}
                {formData.images && formData.images.length > 0 && (
                  <Col xs={12} md={8}>
                    <div className="d-flex flex-wrap" style={{ gap: "5px" }}>
                      {formData.images.slice(0, 3).map((image, index) => (
                        <div key={index} style={{ width: "60px", height: "60px", overflow: "hidden", border: "1px solid #ddd", borderRadius: "4px" }}>
                          <Image
                            src={getImageUrl(image)}
                            alt={`Preview ${index + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/60x60?text=Image';
                            }}
                          />
                        </div>
                      ))}
                      {formData.images.length > 3 && (
                        <div style={{ 
                          width: "60px", 
                          height: "60px", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          border: "1px solid #ddd", 
                          borderRadius: "4px",
                          backgroundColor: "#f8f9fa"
                        }}>
                          <span style={{ fontSize: "12px" }}>+{formData.images.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </Col>
                )}

                  </div>
                </Col>
                  {/* Add/Update Button - Now comes after the image preview */}
                    <Col xs={12} md={6} className="mt-2">
                      <Button
                        style={{
                          backgroundColor: "#a36e29",
                          borderColor: "#a36e29",
                          fontSize: "14px",
                          padding: "6px 20px"
                        }}
                        onClick={handleAdd}
                      >
                        {isEditing ? "Update Entry" : "Add Entry"}
                      </Button>
                    </Col>
              </Row>
            </Col>

          </Row>

          <Row className="estimate-form-section2">
            <Table bordered hover responsive>
              <thead>
                <tr style={{ fontSize: "14px" }}>
                  <th>S No</th>
                  <th>Product Name</th>
                  <th>Customer Name</th>
                  <th>Barcode</th>
                  <th>Metal Type</th>
                  <th>Gross Weight</th>
                  <th>Stones Weight</th>
                  <th>Total Weight</th>
                  <th>Rate</th>
                  <th>Total Price</th>
                  {/* <th>Images</th> */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length > 0 ? (
                  entries.map((entry, index) => (
                    <tr key={index} style={{ fontSize: "14px" }}>
                      <td>{index + 1}</td>
                      <td>{entry.product_name}</td>
                      <td>{entry.customer_name}</td>
                      <td>{entry.barcode}</td>
                      <td>{entry.metal_type}</td>
                      <td>{entry.gross_weight}</td>
                      <td>{entry.stone_weight}</td>
                      <td>{entry.total_weight_av}</td>
                      <td>{entry.rate}</td>
                      <td>{entry.total_price}</td>
                      {/* <td>
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => showProductImages(entry.images)}
                          disabled={!entry.images || entry.images.length === 0}
                          style={{ padding: "2px 6px", fontSize: "11px" }}
                          title="View Images"
                        >
                          <FaImage /> ({entry.images?.length || 0})
                        </Button>
                      </td> */}
                      <td>
                        <div className="d-flex align-items-center">
                          <FaEdit
                            style={{ cursor: 'pointer', marginLeft: '10px', color: 'blue' }}
                            onClick={() => handleEdit(index)}
                          />
                          <FaTrash
                            style={{ cursor: 'pointer', marginLeft: '10px', color: 'red' }}
                            onClick={() => handleDelete(index)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center">
                      No entries added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Row>

          <Row className="estimate-form-section2">
            <Table bordered hover responsive>
              <tbody>
                <tr style={{ fontSize: "14px" }}>
                  <td colSpan="20" className="text-right">
                    Total Amount
                  </td>
                  <td colSpan="4">{totalAmount.toFixed(2)}</td>
                </tr>

                <tr style={{ fontSize: "14px" }}>
                  <td colSpan="16" className="text-right">Discount Amount</td>
                  <td colSpan="4">
                    @
                    <input
                      type="number"
                      value={discount}
                      onChange={handleDiscountChange}
                      style={{ width: '80px', padding: '1px', marginLeft: '5px' }}
                    />
                  </td>
                  <td colSpan="4">
                    {discountAmt.toFixed(2)}
                  </td>
                </tr>
                <tr style={{ fontSize: "14px" }}>
                  <td colSpan="20" className="text-right">
                    Taxable Amount
                  </td>
                  <td colSpan="4">{taxableAmount.toFixed(2)}</td>
                </tr>
                <tr style={{ fontSize: "14px" }}>
                  <td colSpan="20" className="text-right">
                    Tax Amount
                  </td>
                  <td colSpan="4">{taxAmount.toFixed(2)}</td>
                </tr>
                <tr style={{ fontSize: "14px" }}>
                  <td colSpan="20" className="text-right">
                    Net Amount
                  </td>
                  <td colSpan="4">{netAmount.toFixed(2)}</td>
                </tr>
                <tr style={{ fontSize: "14px" }}>
                  <td colSpan="20" className="text-right">
                    Net Payable Amount
                  </td>
                  <td colSpan="4">{Math.round(netAmount).toFixed(2)}</td>
                </tr>
              </tbody>
            </Table>

            <Col xs={12} md={12} className="d-flex justify-content-end" style={{ marginTop: "-10px" }}>
              <Button
                onClick={handleClose}
                style={{
                  width: "60px",
                  backgroundColor: "gray",
                  borderColor: "gray",
                  marginLeft: "5px",
                  fontSize: "14px",
                  marginTop: "1px",
                  padding: "1px 8px",
                  height: "33px"
                }}
              >
                Close
              </Button>
              <Button
                className="cus-back-btn"
                variant="secondary"
                onClick={handleBack}
                style={{
                  width: "60px",
                  marginLeft: '15px',
                  fontSize: "14px",
                  marginTop: "1px",
                  padding: "1px 8px",
                  height: "33px"
                }}
              >
                Cancel
              </Button>
              <Button
                style={{
                  backgroundColor: "#a36e29",
                  borderColor: "#a36e29",
                  marginLeft: '15px',
                  fontSize: "14px",
                  marginTop: "1px",
                  padding: "1px 8px",
                  height: "33px"
                }}
                onClick={handlePrint}
              >
                Print
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Images Modal */}
      <Modal
        show={showImagesModal}
        onHide={() => setShowImagesModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Product Images</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentProductImages.length > 0 ? (
            <Row>
              {currentProductImages.map((image, index) => (
                <Col xs={6} md={4} key={index} className="mb-3">
                  <div className="text-center">
                    <Image
                      src={getImageUrl(image)}
                      alt={`Product Image ${index + 1}`}
                      fluid
                      style={{ maxHeight: '200px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                      }}
                    />
                    <small className="text-muted d-block mt-1">
                      {image}
                    </small>
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-4">
              <p>No images available for this product</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImagesModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EstimateForm;