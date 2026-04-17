import React, { useState, useEffect, useRef } from "react";
import "./EstimateForm.css";
import InputField from "../../../Pages/TableLayout/InputField";
import { Container, Row, Col, Button, Table, Modal, Image } from "react-bootstrap";
import axios from "axios";
import baseURL from "../../../Modules/ApiUrl/NodeBaseURL";
import { FaEdit, FaTrash, FaQrcode, FaCamera, FaUpload, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import PDFContent from "./EstimateReceipt";
import { useLocation } from "react-router-dom";
import Navbar from "../../../Pages/Navbar/SalesNavbar";
import { Html5QrcodeScanner } from 'html5-qrcode';

const EstimateForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().split("T")[0];

  // Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [isScannerInitialized, setIsScannerInitialized] = useState(false);
  const scannerRef = useRef(null);
  
  // Camera capture states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Packet images state
  const [packetImages, setPacketImages] = useState([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  // Packet level state (shared across all entries for this customer)
  const [packetBarcode, setPacketBarcode] = useState("");
  const [packetWt, setPacketWt] = useState("");

  // Store the saved estimate number for updates
  const [savedEstimateNumber, setSavedEstimateNumber] = useState("");
  const [isEstimateSaved, setIsEstimateSaved] = useState(false);

  // Total quantity state
  const [totalQuantity, setTotalQuantity] = useState(0);

  // Initialize scanner when modal opens
  useEffect(() => {
    if (showScanner && !isScannerInitialized) {
      const timer = setTimeout(() => {
        initializeScanner();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [showScanner, isScannerInitialized]);

  const initializeScanner = () => {
    const element = document.getElementById('qr-reader');
    if (!element) {
      console.error('QR reader element not found');
      return;
    }

    try {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          qrbox: {
            width: 250,
            height: 250,
          },
          fps: 5,
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          handleQRScanSuccess(decodedText);
        },
        (error) => {
          if (error !== "NotFoundException: No MultiFormat Readers were able to detect the code") {
            console.log('Scan error:', error);
          }
        }
      );

      setIsScannerInitialized(true);
    } catch (error) {
      console.error('Scanner initialization failed:', error);
      alert('Failed to initialize camera. Please check permissions.');
      setShowScanner(false);
    }
  };

  const handleQRScanSuccess = (decodedText) => {
    try {
      stopScanner();

      const barcode = extractBarcodeFromQR(decodedText);

      if (barcode) {
        setFormData(prev => ({
          ...prev,
          barcode: barcode
        }));

        handleBarcodeChange(barcode);
        
        alert(`Scanned: ${barcode}`);
      } else {
        alert('Could not extract barcode from QR code');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      alert('Error processing QR code');
    }
  };

  const extractBarcodeFromQR = (qrData) => {
    try {
      const parsedData = JSON.parse(qrData);
      return parsedData.barcode || parsedData.PCode || parsedData.code || parsedData.BarCode;
    } catch {
      const barcodeMatch = qrData.match(/(barcode|Barcode|PCode|code)[:\s]*([^\s,]+)/i);
      return barcodeMatch ? barcodeMatch[2] : qrData;
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (error) {
        console.log('Error clearing scanner:', error);
      }
      scannerRef.current = null;
    }
    setIsScannerInitialized(false);
    setShowScanner(false);
  };

  const startScanner = () => {
    setShowScanner(true);
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleImageUpload(file);
      }, 'image/jpeg');
      
      stopCamera();
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => handleImageUpload(file));
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPacketImages(prev => [...prev, {
        file,
        preview: reader.result,
        name: file.name,
        size: file.size
      }]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index) => {
    setPacketImages(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedData = JSON.parse(userData);
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  };

  const user = getUserData();
  const salespersonId = user?.id ? String(user.id) : "";
  const sourceBy = user?.role || "";

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
    salesperson_id: salespersonId,
    source_by: sourceBy,
    images: [],
    qty: 1
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
  const [usedBarcodes, setUsedBarcodes] = useState(new Set());

  // Function to get full image URL
  const getImageUrl = (imageName) => {
    if (!imageName) return "";
    return `${baseURL}/uploads/products/${imageName}`;
  };

  // Generate packet barcode
  const generatePacketBarcode = async () => {
    try {
      const response = await axios.get(`${baseURL}/next-packet-barcode`);
      if (response.data.success && response.data.packet_barcode) {
        return response.data.packet_barcode;
      }
    } catch (error) {
      console.error('Error fetching packet barcode:', error);
    }
    // Fallback to local generation if API fails
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PKT${timestamp}${random}`;
  };

  // Calculate total quantity from entries
  const calculateTotalQuantity = (entriesList) => {
    return entriesList.reduce((sum, entry) => sum + (entry.qty || 1), 0);
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

        const productOpts = result.map(product => ({
          value: product.product_name,
          label: product.product_name
        }));
        setProductOptions(productOpts);

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

        const filteredCustomers = data.filter(user =>
          user.role === 'Customer' && user.status === 'approved'
        );

        setCustomers(filteredCustomers);

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

  // Handle product name selection
  const handleProductNameChange = async (productName) => {
    try {
      if (!productName) {
        resetFormData();
        return;
      }

      const selectedProduct = allProducts.find(p => p.product_name === productName);

      if (selectedProduct) {
        const response = await fetch(`${baseURL}/get/product/${selectedProduct.product_id}`);
        if (response.ok) {
          const productDetails = await response.json();

          const productRate = productDetails.rate || "";
          const productImages = productDetails.images || [];

          const updatedFormData = {
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
            qty: 1,
            salesperson_id: salespersonId,
            source_by: sourceBy,
            images: productImages
          };

          setFormData(prev => ({
            ...prev,
            ...updatedFormData
          }));

          setCurrentProductImages(productImages);
        }
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

  // Handle barcode selection
  const handleBarcodeChange = async (barcode) => {
    try {
      if (!barcode) {
        resetFormData();
        return;
      }

      if (usedBarcodes.has(`${formData.customer_id}_${barcode}`)) {
        alert('This product has already been added for this customer!');
        return;
      }

      const selectedProduct = allProducts.find(p => p.barcode === barcode);

      if (selectedProduct) {
        const response = await fetch(`${baseURL}/get/product/${selectedProduct.product_id}`);
        if (response.ok) {
          const productDetails = await response.json();

          const productRate = productDetails.rate || "";
          const productImages = productDetails.images || [];

          const updatedFormData = {
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
            qty: 1,
            salesperson_id: salespersonId,
            source_by: sourceBy,
            images: productImages
          };

          setFormData(prev => ({
            ...prev,
            ...updatedFormData
          }));
          setIsQtyEditable(true);

          setCurrentProductImages(productImages);
        }
      } else {
        const selectedTag = tagsData.find(t => t.PCode_BarCode === barcode);

        if (selectedTag) {
          let tagRate = selectedTag.rate || "";

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

          const updatedFormData = {
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
            qty: 1,
            opentag_id: selectedTag.opentag_id || "",
            pricing: selectedTag.Pricing || "By Weight",
            salesperson_id: salespersonId,
            source_by: sourceBy,
            images: []
          };

          setFormData(prev => ({
            ...prev,
            ...updatedFormData
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
    const resetData = {
      ...initialFormData,
      estimate_number: formData.estimate_number, // Keep estimate number
      salesperson_id: salespersonId,
      source_by: sourceBy
    };
    setFormData(resetData);
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

      if (name === "customer_name") {
        const selectedCustomerOption = customerOptions.find(opt => opt.value === value);
        if (selectedCustomerOption) {
          updatedData.customer_name = selectedCustomerOption.value;
          updatedData.customer_id = selectedCustomerOption.customerId;
        } else {
          updatedData.customer_name = "";
          updatedData.customer_id = "";
        }
        setUsedBarcodes(new Set());
        // Reset saved state when customer changes
        setIsEstimateSaved(false);
        setSavedEstimateNumber("");
      }

      if (name === "product_name" && value !== prevData.product_name) {
        handleProductNameChange(value);
      }

      if (name === "barcode" && value !== prevData.barcode) {
        handleBarcodeChange(value);
      }

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

  // Calculation useEffect hooks
  useEffect(() => {
    const grossWeight = parseFloat(formData.gross_weight) || 0;
    const stonesWeight = parseFloat(formData.stone_weight) || 0;
    const weightBW = grossWeight - stonesWeight;

    setFormData((prev) => ({
      ...prev,
      weight_bw: weightBW >= 0 ? weightBW.toFixed(3) : "0.000",
    }));
  }, [formData.gross_weight, formData.stone_weight]);

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
    }
  }, [formData.mc_on, formData.mc_per_gram, formData.total_weight_av, formData.rate_amt]);

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

  useEffect(() => {
    const taxPercentStr = formData.tax_percent || "3% GST";
    const taxPercent = parseFloat(taxPercentStr.replace('% GST', '').trim()) || 3;
    const rateAmt = parseFloat(formData.rate_amt) || 0;
    const stonesPrice = parseFloat(formData.stone_price) || 0;
    const totalMC = parseFloat(formData.making_charges) || 0;
    const discountAmt = parseFloat(formData.disscount) || 0;
    const hmCharges = parseFloat(formData.hm_charges) || 0;

    const taxableAmount = rateAmt + stonesPrice + totalMC + hmCharges - discountAmt;
    const taxAmt = (taxableAmount * taxPercent) / 100;
    const totalPrice = taxableAmount + taxAmt;

    setFormData((prev) => ({
      ...prev,
      tax_amt: taxAmt.toFixed(2),
      total_price: totalPrice.toFixed(2),
    }));
  }, [formData.tax_percent, formData.rate_amt, formData.stone_price, formData.making_charges, formData.disscount, formData.hm_charges]);

  useEffect(() => {
    const fetchLastEstimateNumber = async () => {
      try {
        const response = await axios.get(`${baseURL}/lastEstimateNumber`);
        setFormData((prev) => ({
          ...prev,
          estimate_number: response.data.lastEstimateNumber,
          salesperson_id: salespersonId,
          source_by: sourceBy
        }));
      } catch (error) {
        console.error("Error fetching estimate number:", error);
      }
    };

    fetchLastEstimateNumber();
  }, [salespersonId, sourceBy]);

  // Fetch packet barcode initially
  useEffect(() => {
    const fetchInitialPacketBarcode = async () => {
      try {
        const response = await axios.get(`${baseURL}/next-packet-barcode`);
        if (response.data.success && response.data.packet_barcode) {
          setPacketBarcode(response.data.packet_barcode);
        }
      } catch (error) {
        console.error('Error fetching packet barcode:', error);
      }
    };
    
    fetchInitialPacketBarcode();
  }, []);

  // Handle Add Entry - Only store in estimates table, no PDF download
  // Handle Add Entry - Only store in estimates table, no PDF download
const handleAddEntry = async () => {
  if (!formData.barcode) {
    alert("Please select a product via barcode first");
    return;
  }

  if (!formData.customer_name || !formData.customer_id) {
    alert("Please select a customer");
    return;
  }

  const barcodeKey = `${formData.customer_id}_${formData.barcode}`;
  if (!isEditing && usedBarcodes.has(barcodeKey)) {
    alert("This product has already been added for this customer!");
    return;
  }

  const entryToAdd = {
    ...formData,
    qty: isEditing ? formData.qty : 1,
    salesperson_id: formData.salesperson_id || salespersonId,
    source_by: formData.source_by || sourceBy
  };

  let updatedEntries;
  if (isEditing) {
    updatedEntries = entries.map((entry, index) =>
      index === editIndex ? entryToAdd : entry
    );
    setIsEditing(false);
    setEditIndex(null);
  } else {
    updatedEntries = [...entries, entryToAdd];
    setUsedBarcodes(prev => new Set(prev).add(barcodeKey));
  }

  setEntries(updatedEntries);
  setTotalQuantity(calculateTotalQuantity(updatedEntries));

  // Calculate totals for all entries
  const totalAmount = updatedEntries.reduce((sum, item) => {
    const stonePrice = parseFloat(item.stone_price) || 0;
    const makingCharges = parseFloat(item.making_charges) || 0;
    const rateAmt = parseFloat(item.rate_amt) || 0;
    const hmCharges = parseFloat(item.hm_charges) || 0;
    return sum + stonePrice + makingCharges + rateAmt + hmCharges;
  }, 0);

  const discountAmt = updatedEntries.reduce((sum, item) => sum + (parseFloat(item.disscount) || 0), 0);
  const taxableAmount = totalAmount - discountAmt;
  const taxAmount = updatedEntries.reduce((sum, item) => sum + (parseFloat(item.tax_amt) || 0), 0);
  const netAmount = taxableAmount + taxAmount;

  // Ensure packet barcode is set
  let currentPacketBarcode = packetBarcode;
  if (!currentPacketBarcode || currentPacketBarcode.trim() === '') {
    currentPacketBarcode = await generatePacketBarcode();
    setPacketBarcode(currentPacketBarcode);
  }

  try {
    // Save the CURRENT entry ONLY (not all entries)
    // The backend will handle INSERT for each new entry
    const requestData = {
      ...entryToAdd,
      customer_id: entryToAdd.customer_id,
      customer_name: entryToAdd.customer_name,
      salesperson_id: entryToAdd.salesperson_id || salespersonId,
      source_by: entryToAdd.source_by || sourceBy,
      total_amount: totalAmount.toFixed(2),
      taxable_amount: taxableAmount.toFixed(2),
      tax_amount: taxAmount.toFixed(2),
      net_amount: netAmount.toFixed(2),
      packet_barcode: currentPacketBarcode,
      packet_wt: packetWt || null,
      pack_images: [], // Images will be uploaded on print
      force_insert: true // Flag to force INSERT instead of UPDATE
    };

    const response = await axios.post(`${baseURL}/add/estimate`, requestData);
    
    // Store the estimate number for future updates
    if (response.data.estimate_number) {
      setSavedEstimateNumber(response.data.estimate_number);
      setIsEstimateSaved(true);
    }

    alert(`Entry saved successfully!\nEstimate Number: ${formData.estimate_number}\nPacket Barcode: ${currentPacketBarcode}`);

    // Reset form for next entry
    setFormData(prev => ({
      ...initialFormData,
      estimate_number: prev.estimate_number,
      customer_name: prev.customer_name,
      customer_id: prev.customer_id,
      date: today,
      salesperson_id: salespersonId,
      source_by: sourceBy,
      images: [],
      qty: 1
    }));
    setCurrentProductImages([]);
    
  } catch (error) {
    console.error("Error saving entry:", error);
    alert("Failed to save entry. Please try again.");
  }
};

  // Handle Print - Update existing estimate and download PDF
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

      // Ensure packet barcode is set
      let finalPacketBarcode = packetBarcode;
      if (!finalPacketBarcode || finalPacketBarcode.trim() === '') {
        finalPacketBarcode = await generatePacketBarcode();
        setPacketBarcode(finalPacketBarcode);
      }
      
      const entriesWithPacketDetails = entries.map(entry => ({
        ...entry,
        packet_barcode: finalPacketBarcode,
        packet_wt: packetWt || null
      }));

      // Calculate totals
      const totalAmount = entriesWithPacketDetails.reduce((sum, item) => {
        const stonePrice = parseFloat(item.stone_price) || 0;
        const makingCharges = parseFloat(item.making_charges) || 0;
        const rateAmt = parseFloat(item.rate_amt) || 0;
        const hmCharges = parseFloat(item.hm_charges) || 0;
        return sum + stonePrice + makingCharges + rateAmt + hmCharges;
      }, 0);

      const discountAmt = entriesWithPacketDetails.reduce((sum, item) => sum + (parseFloat(item.disscount) || 0), 0);
      const taxableAmount = totalAmount - discountAmt;
      const taxAmount = entriesWithPacketDetails.reduce((sum, item) => sum + (parseFloat(item.tax_amt) || 0), 0);
      const netAmount = taxableAmount + taxAmount;

      // Upload packet images
      let uploadedFilenames = [];
      
      const imageFiles = packetImages.filter(img => img.file).map(img => img.file);
      if (imageFiles.length > 0) {
        const formDataObj = new FormData();
        imageFiles.forEach((file) => {
          formDataObj.append('images', file);
        });
        
        try {
          const uploadResponse = await axios.post(`${baseURL}/upload/pack-images`, formDataObj, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          uploadedFilenames = uploadResponse.data.filenames || [];
          console.log('Uploaded images:', uploadedFilenames);
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
        }
      }

      // Update existing estimates with packet details and images
      const updatePromises = entriesWithPacketDetails.map(async (entry) => {
        const requestData = {
          ...entry,
          customer_id: entry.customer_id,
          customer_name: entry.customer_name,
          salesperson_id: entry.salesperson_id || salespersonId,
          source_by: entry.source_by || sourceBy,
          total_amount: totalAmount.toFixed(2),
          taxable_amount: taxableAmount.toFixed(2),
          tax_amount: taxAmount.toFixed(2),
          net_amount: netAmount.toFixed(2),
          packet_barcode: finalPacketBarcode,
          packet_wt: packetWt || null,
          pack_images: uploadedFilenames
        };

        // Use update endpoint
        return axios.post(`${baseURL}/update/estimate-with-packet`, requestData);
      });

      await Promise.all(updatePromises);

      // Generate and download PDF
      const pdfDoc = pdf(
        <PDFContent
          entries={entriesWithPacketDetails}
          totalAmount={totalAmount.toFixed(2)}
          taxableAmount={taxableAmount.toFixed(2)}
          taxAmount={taxAmount.toFixed(2)}
          netAmount={netAmount.toFixed(2)}
          date={today}
          estimateNumber={formData.estimate_number}
          sellerName="Sadashri Jewels"
          customerName={entries[0]?.customer_name || ""}
          packetBarcode={finalPacketBarcode}
          packetImages={uploadedFilenames}
        />
      );

      const blob = await pdfDoc.toBlob();
      saveAs(blob, `estimate_${formData.estimate_number}.pdf`);

      alert(`Estimate printed successfully!\nPacket Barcode: ${finalPacketBarcode}`);

      // Reset all states
      setEntries([]);
      setTotalQuantity(0);
      setDiscount(0);
      setUsedBarcodes(new Set());
      setPacketBarcode("");
      setPacketWt("");
      setPacketImages([]);
      setIsEstimateSaved(false);
      setSavedEstimateNumber("");
      
      // Fetch new estimate number
      const response = await axios.get(`${baseURL}/lastEstimateNumber`);
      setFormData({
        ...initialFormData,
        estimate_number: response.data.lastEstimateNumber,
        salesperson_id: salespersonId,
        source_by: sourceBy
      });
      setCurrentProductImages([]);

      navigate("/salesperson-estimation");
    } catch (error) {
      console.error("Error in handlePrint:", error);
      alert("Failed to update or generate PDF. Please try again.");
    }
  };

  const handleBack = () => {
    navigate("/estimation");
  };

  const handleClose = () => {
    navigate(-1);
  };

  const getFilteredBarcodeOptions = () => {
    if (!formData.customer_id) return barcodeOptions;
    
    return barcodeOptions.filter(opt => {
      return !usedBarcodes.has(`${formData.customer_id}_${opt.value}`);
    });
  };

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

            {/* Customer Name, Barcode, Add Entry, and Total Quantity in same row */}
            <Row className="align-items-end">
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
                  required
                />
              </Col>

              <Col xs={12} md={4}>
                <div className="barcode-field-wrapper">
                  <InputField
                    label="Barcode"
                    name="barcode"
                    value={formData.barcode || ""}
                    type="select"
                    onChange={handleInputChange}
                    options={[
                      { value: "", label: "Select Barcode", disabled: true },
                      ...getFilteredBarcodeOptions(),
                      ...tagsData.map(tag => ({
                        value: tag.PCode_BarCode,
                        label: tag.PCode_BarCode
                      }))
                    ]}
                  />
                  
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={startScanner}
                    className="scanner-btn"
                    title="Scan Barcode/QR Code"
                  >
                    <FaQrcode /> Scan
                  </Button>
                </div>
              </Col>

              <Col xs={12} md={2} className="mb-3">
                <Button
                  className="add-entry-btn"
                  onClick={handleAddEntry}
                  style={{ width: 'auto', padding: '8px 20px' }}
                >
                  {isEditing ? "Update Entry" : "Add Entry"}
                </Button>
              </Col>
              
              <Col xs={12} md={3} className="mb-3 d-flex align-items-center">
                <div className="total-qty-container">
                  <span className="total-qty-label">Total Qty:</span>
                  <span className="total-qty-value">{totalQuantity}</span>
                </div>
                {isEstimateSaved && (
                  <span className="saved-badge" style={{ marginLeft: '10px', color: 'green', fontSize: '12px' }}>
                    ✓ Saved: {savedEstimateNumber}
                  </span>
                )}
              </Col>
            </Row>
          </Row>

          {/* Packet Details Section - Always Visible */}
          <Row className="estimate-form-section2 mt-3">
            <Col xs={12}>
              <div className="packet-section">
                <h5 style={{ color: '#a36e29', marginBottom: '15px', fontWeight: '600' }}>Packet Details</h5>
                <Row>
                  <Col xs={12} md={4}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '5px', display: 'block' }}>
                        Packet Barcode <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '14px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          backgroundColor: 'white'
                        }}
                        value={packetBarcode}
                        onChange={(e) => setPacketBarcode(e.target.value)}
                        placeholder="Enter or auto-generated"
                      />
                    </div>
                  </Col>
                  
                  <Col xs={12} md={3}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '5px', display: 'block' }}>
                        Packet Weight (Optional)
                      </label>
                      <input
                        type="number"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '14px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          backgroundColor: 'white'
                        }}
                        value={packetWt}
                        onChange={(e) => setPacketWt(e.target.value)}
                        step="0.001"
                        placeholder="Enter weight"
                      />
                    </div>
                  </Col>
                  
                  <Col xs={12} md={5}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '5px', display: 'block' }}>
                      Packet Images
                    </label>
                    <div className="packet-images-container">
                      <div className="image-upload-buttons">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={triggerFileUpload}
                          className="me-2"
                        >
                          <FaUpload /> Upload
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={startCamera}
                        >
                          <FaCamera /> Capture
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                        />
                      </div>
                      
                      {packetImages.length > 0 && (
                        <div className="image-preview-container">
                          {packetImages.map((img, index) => (
                            <div key={index} className="image-preview-item">
                              <img 
                                src={img.preview} 
                                alt={`Packet ${index + 1}`}
                                onClick={() => {
                                  setPreviewImage(img.preview);
                                  setShowImagePreview(true);
                                }}
                              />
                              <button 
                                className="remove-image-btn"
                                onClick={() => removeImage(index)}
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          {/* Action Buttons */}
          <Row className="mt-3">
            <Col xs={12} className="d-flex justify-content-end action-buttons-container">
              <Button
                className="close-btn"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button
                className="cancel-btn"
                onClick={handleBack}
              >
                Cancel
              </Button>
              <Button
                className="print-btn"
                onClick={handlePrint}
              >
                Print
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      {/* QR/Barcode Scanner Modal */}
      <Modal show={showScanner} onHide={stopScanner} centered>
        <Modal.Header closeButton>
          <Modal.Title>Scan Barcode/QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: 'center', padding: '20px' }}>
          <div id="qr-reader" style={{ width: '100%', minHeight: '300px' }}></div>
          <p className="mt-3" style={{ fontSize: '14px', color: '#666' }}>
            Point your camera at the barcode or QR code to scan automatically
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={stopScanner}>
            Cancel Scan
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Camera Capture Modal */}
      <Modal show={showCamera} onHide={stopCamera} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Capture Packet Image</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: 'center' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={stopCamera}>
            Cancel
          </Button>
          <Button variant="primary" onClick={captureImage}>
            Capture
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Image Preview Modal */}
      <Modal show={showImagePreview} onHide={() => setShowImagePreview(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: 'center' }}>
          {previewImage && (
            <img 
              src={previewImage} 
              alt="Preview" 
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Product Images Modal */}
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