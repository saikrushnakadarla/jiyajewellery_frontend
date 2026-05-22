import React, { useState, useEffect, useRef } from "react";
import "./EstimateForm.css";
import InputField from "../../../Pages/TableLayout/InputField";
import { Container, Row, Col, Button, Modal, Image } from "react-bootstrap";
import axios from "axios";
import baseURL from "../../../Modules/ApiUrl/NodeBaseURL";
import { FaQrcode, FaCamera, FaUpload, FaTimes, FaBoxOpen, FaBarcode, FaSave } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import PDFContent from "./EstimateReceipt";
import Navbar from "../../../Pages/Navbar/SalesNavbar";
import { Html5QrcodeScanner } from 'html5-qrcode';
import Swal from 'sweetalert2';

const EstimateForm = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  // Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [isScannerInitialized, setIsScannerInitialized] = useState(false);
  const scannerRef = useRef(null);

  // Packet Barcode Scanner states
  const [showPacketScanner, setShowPacketScanner] = useState(false);
  const [isPacketScannerInitialized, setIsPacketScannerInitialized] = useState(false);
  const packetScannerRef = useRef(null);

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

  // Packet level state - SINGLE packet for ALL products
  const [packetDetails, setPacketDetails] = useState(null);
  const [isPacketScanned, setIsPacketScanned] = useState(false);
  const [sharedPacketBarcode, setSharedPacketBarcode] = useState(null);
  const [sharedPacketWt, setSharedPacketWt] = useState(null);

  // Refs for latest values
  const sharedPacketBarcodeRef = useRef(null);
  const sharedPacketWtRef = useRef(null);
  const isPacketScannedRef = useRef(false);

  // Store the saved estimate number for updates
  const [savedEstimateNumber, setSavedEstimateNumber] = useState("");
  const [isEstimateSaved, setIsEstimateSaved] = useState(false);

  // Total quantity state
  const [totalQuantity, setTotalQuantity] = useState(0);

  // Store scanned products for receipt
  const [scannedProducts, setScannedProducts] = useState([]);

  // Store the current estimate number for session
  const [currentEstimateNumber, setCurrentEstimateNumber] = useState("");
  const currentEstimateNumberRef = useRef("");

  // Success message state
  const [successMessage, setSuccessMessage] = useState("");
  const [packetSuccessMessage, setPacketSuccessMessage] = useState("");
  const [lastAddedProduct, setLastAddedProduct] = useState("");

  // Form data
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const user = getUserData();
  const salespersonId = user?.id ? String(user.id) : "";
  const sourceBy = user?.role || "";

  const initialFormData = {
    date: today,
    estimate_number: "",
    customer_name: "",
    customer_id: "",
    salesperson_id: salespersonId,
    source_by: sourceBy,
  };

  const [formData, setFormData] = useState(initialFormData);
  const formDataRef = useRef(initialFormData);

  const [allProducts, setAllProducts] = useState([]);
  const allProductsRef = useRef([]);

  const [customers, setCustomers] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);

  // Keep refs in sync with state
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    allProductsRef.current = allProducts;
  }, [allProducts]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setLastAddedProduct("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (packetSuccessMessage) {
      const timer = setTimeout(() => {
        setPacketSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [packetSuccessMessage]);

  // Fetch all products
 // Replace your existing fetchProducts useEffect with this:
useEffect(() => {
  const fetchProducts = async () => {
    try {
      // Change from /get/products to /get/products/available
      const response = await fetch(`${baseURL}/get/products/available`);
      if (response.ok) {
        const result = await response.json();
        setAllProducts(result);
        allProductsRef.current = result;
        console.log("Fetched available products:", result.length);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };
  fetchProducts();
}, []);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${baseURL}/api/users`);
        if (response.ok) {
          const data = await response.json();
          const filteredCustomers = data.filter(u => u.role === 'Customer' && u.status === 'approved');
          setCustomers(filteredCustomers);
          const customerOpts = filteredCustomers.map(customer => ({
            value: customer.full_name,
            label: customer.full_name,
            customerId: customer.id || customer._id || customer.user_id
          }));
          setCustomerOptions(customerOpts);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch last estimate number
  useEffect(() => {
    const fetchLastEstimateNumber = async () => {
      try {
        const response = await axios.get(`${baseURL}/lastEstimateNumber`);
        setFormData(prev => {
          const updated = {
            ...prev,
            estimate_number: response.data.lastEstimateNumber,
            salesperson_id: salespersonId,
            source_by: sourceBy
          };
          formDataRef.current = updated;
          return updated;
        });
      } catch (error) {
        console.error("Error fetching estimate number:", error);
      }
    };
    fetchLastEstimateNumber();
  }, [salespersonId, sourceBy]);

  // Initialize product scanner when modal opens
  useEffect(() => {
    if (showScanner && !isScannerInitialized) {
      const timer = setTimeout(() => {
        initializeScanner();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showScanner, isScannerInitialized]);

  useEffect(() => {
    if (showPacketScanner && !isPacketScannerInitialized) {
      const timer = setTimeout(() => {
        initializePacketScanner();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showPacketScanner, isPacketScannerInitialized]);

  const initializeScanner = () => {
    const element = document.getElementById('qr-reader');
    if (!element) {
      console.error('QR reader element not found');
      return;
    }

    try {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { qrbox: { width: 250, height: 250 }, fps: 5 },
        false
      );

      scannerRef.current = scanner;
      scanner.render(
        (decodedText) => handleQRScanSuccess(decodedText),
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

  const initializePacketScanner = () => {
    const element = document.getElementById('packet-qr-reader');
    if (!element) {
      console.error('Packet QR reader element not found');
      return;
    }

    try {
      const scanner = new Html5QrcodeScanner(
        "packet-qr-reader",
        { qrbox: { width: 250, height: 250 }, fps: 5 },
        false
      );

      packetScannerRef.current = scanner;
      scanner.render(
        async (decodedText) => await handlePacketQRScanSuccess(decodedText),
        (error) => {
          if (error !== "NotFoundException: No MultiFormat Readers were able to detect the code") {
            console.log('Packet scan error:', error);
          }
        }
      );

      setIsPacketScannerInitialized(true);
    } catch (error) {
      console.error('Packet scanner initialization failed:', error);
      alert('Failed to initialize camera for packet scanning.');
      setShowPacketScanner(false);
    }
  };

  // Handle Packet QR scan success
  const handlePacketQRScanSuccess = async (decodedText) => {
    try {
      stopPacketScanner();
      Swal.fire({ title: 'Scanning Packet...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const response = await axios.get(`${baseURL}/api/qr-packets/search/${encodeURIComponent(decodedText)}`);
      Swal.close();

      if (response.data.success && response.data.data) {
        const packet = response.data.data;

        setPacketDetails(packet);
        setSharedPacketBarcode(packet.qr_code);
        setSharedPacketWt(packet.packet_wt || null);
        setIsPacketScanned(true);

        sharedPacketBarcodeRef.current = packet.qr_code;
        sharedPacketWtRef.current = packet.packet_wt || null;
        isPacketScannedRef.current = true;

        const estimateNum = currentEstimateNumberRef.current || formDataRef.current.estimate_number;
        if (estimateNum) {
          try {
            await axios.put(`${baseURL}/update/estimate-packet/${estimateNum}`, {
              packet_barcode: packet.qr_code,
              packet_wt: packet.packet_wt || null
            });
            console.log("Updated existing estimate rows with packet barcode:", packet.qr_code);
          } catch (updateErr) {
            console.error("Failed to update existing rows with packet barcode:", updateErr);
          }
        }

        setPacketSuccessMessage(`✓ Packet Added Successfully! - Barcode: ${packet.qr_code}`);

        Swal.fire({
          icon: 'success',
          title: 'Packet Attached!',
          text: `Packet barcode ${packet.qr_code} has been applied to ALL products in this estimate`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({ icon: 'warning', title: 'Packet Not Found', text: `No packet found for: ${decodedText}` });
      }
    } catch (error) {
      Swal.close();
      console.error('Error processing packet QR:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch packet details.' });
    }
  };

  // FIXED: Function to calculate all product values
  const calculateProductTotals = (productDetails) => {
    // Parse numeric values
    const grossWeight = parseFloat(productDetails.gross_wt) || 0;
    const stoneWeight = parseFloat(productDetails.stone_wt) || 0;
    const stonePrice = parseFloat(productDetails.stone_price) || 0;
    const rate = parseFloat(productDetails.rate) || 0;
    const vaPercent = parseFloat(productDetails.va_percent) || 0;
    const vaOn = productDetails.va_on || "Gross Weight";
    const mcPerGram = parseFloat(productDetails.mc_per_gram) || 0;
    const mcOn = productDetails.mc_on || "MC %";
    const hmCharges = parseFloat(productDetails.hm_charges) || 60.00;
    const taxPercent = productDetails.tax_percent || "0.9% GST";
    const pricing = productDetails.pricing || "By Weight";
    const qty = parseFloat(productDetails.qty) || 1;

    // Calculate Net Weight
    const netWeight = grossWeight - stoneWeight;

    // Calculate Wastage and Total Weight
    let wastageWeight = 0;
    let totalWeight = netWeight;

    if (vaOn === "Gross Weight") {
      wastageWeight = (grossWeight * vaPercent) / 100;
      totalWeight = netWeight + wastageWeight;
    } else if (vaOn === "Weight BW") {
      wastageWeight = (netWeight * vaPercent) / 100;
      totalWeight = netWeight + wastageWeight;
    }

    // Calculate Rate Amount
    let rateAmount = 0;
    if (pricing === "By Weight") {
      rateAmount = rate * totalWeight;
    } else if (pricing === "By fixed") {
      rateAmount = rate * qty;
    }

    // Calculate Making Charges
    let makingCharges = 0;
    if (mcOn === "MC / Gram") {
      makingCharges = mcPerGram * totalWeight;
    } else if (mcOn === "MC %") {
      makingCharges = (mcPerGram * rateAmount) / 100;
    } else if (mcOn === "MC / Piece") {
      makingCharges = mcPerGram * qty;
    }

    // Parse tax percentage (remove % sign if present)
    let taxPercentNum = 0;
    if (taxPercent) {
      const taxMatch = taxPercent.match(/(\d+(?:\.\d+)?)/);
      if (taxMatch) {
        taxPercentNum = parseFloat(taxMatch[1]);
      }
    }

    // Calculate Tax and Total Price
    const totalBeforeTax = rateAmount + stonePrice + makingCharges + hmCharges;
    const taxAmount = (totalBeforeTax * taxPercentNum) / 100;
    const totalPrice = totalBeforeTax + taxAmount;

    // Calculate Weight BW (same as net weight)
    const weightBW = netWeight;

    return {
      gross_weight: grossWeight.toFixed(3),
      stone_weight: stoneWeight.toFixed(3),
      stone_price: stonePrice.toFixed(2),
      net_weight: netWeight.toFixed(3),
      weight_bw: weightBW.toFixed(3),
      wastage_weight: wastageWeight.toFixed(3),
      total_weight_av: totalWeight.toFixed(3),
      rate: rate.toFixed(2),
      rate_amt: rateAmount.toFixed(2),
      making_charges: makingCharges.toFixed(2),
      tax_percent: taxPercent,
      tax_amt: taxAmount.toFixed(2),
      total_price: totalPrice.toFixed(2),
      va_percent: vaPercent,
      va_on: vaOn,
      mc_per_gram: mcPerGram,
      mc_on: mcOn,
      hm_charges: hmCharges,
      qty: qty,
      pricing: pricing
    };
  };

  // Handle product QR scan success
  const handleQRScanSuccess = async (decodedText) => {
    try {
      stopScanner();

      Swal.fire({
        title: 'Scanning Product...',
        text: 'Please wait while we process the QR code',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const barcode = extractBarcodeFromQR(decodedText);

      console.log("Decoded QR text:", decodedText);
      console.log("Extracted barcode:", barcode);

      if (barcode) {
        const product = await handleBarcodeAndAddEntry(barcode);
        if (product) {
          setScannedProducts(prev => [...prev, product]);
          setTotalQuantity(prev => prev + 1);

          setSuccessMessage(`✓ Product Added Successfully!`);
          setLastAddedProduct(product.product_name);

          Swal.fire({
            icon: 'success',
            title: 'Product Added!',
            text: `Product with barcode ${barcode} has been added to estimate`,
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          Swal.close();
          Swal.fire({
            icon: 'warning',
            title: 'Product Not Found',
            text: `No product found with barcode: ${barcode}`,
            confirmButtonText: 'OK'
          });
        }
      } else {
        Swal.close();
        Swal.fire({
          icon: 'warning',
          title: 'Invalid QR Code',
          text: 'Could not extract barcode from QR code. Please try a different QR code.',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      Swal.close();
      console.error('Error processing QR code:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error processing QR code. Please try again.'
      });
    }
  };

  const extractBarcodeFromQR = (qrData) => {
    try {
      const parsedData = JSON.parse(qrData);
      return parsedData.barcode || parsedData.PCode_BarCode || parsedData.code || parsedData.BarCode;
    } catch {
      const barcodeMatch = qrData.match(/TAG:\s*([A-Z0-9]+)/i);
      if (barcodeMatch) {
        return barcodeMatch[1];
      }
      const altMatch = qrData.match(/(barcode|Barcode|PCode|code|prefix)[:\s]*([^\s,]+)/i);
      return altMatch ? altMatch[2] : qrData;
    }
  };

  // FIXED: Main function to handle barcode and add entry with all calculated fields
 // Update the handleBarcodeAndAddEntry function
const handleBarcodeAndAddEntry = async (barcode) => {
  try {
    if (!barcode) {
      alert("Invalid barcode");
      return null;
    }

    const currentFormData = formDataRef.current;

    if (!currentFormData.customer_name || !currentFormData.customer_id) {
      alert("Please select a customer first");
      return null;
    }

    const selectedProduct = allProductsRef.current.find(p => p.barcode === barcode);

    if (!selectedProduct) {
      alert("Product not found with this barcode");
      return null;
    }

    // *** ADD THIS CHECK - Prevent scanning already selected products ***
    if (selectedProduct.status !== 'Available') {
      Swal.fire({
        icon: 'warning',
        title: 'Product Already Selected',
        text: `Product "${selectedProduct.product_name}" has already been selected and cannot be scanned again.`,
        confirmButtonText: 'OK'
      });
      return null;
    }

    const response = await fetch(`${baseURL}/get/product/${selectedProduct.product_id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product details');
    }

    const productDetails = await response.json();
    
    // Calculate all totals properly
    const calculatedValues = calculateProductTotals(productDetails);

    // Get packet values from refs (always latest)
    let finalPacketBarcode = null;
    let finalPacketWt = null;

    console.log("=== PACKET REF VALUES ===");
    console.log("isPacketScannedRef.current:", isPacketScannedRef.current);
    console.log("sharedPacketBarcodeRef.current:", sharedPacketBarcodeRef.current);

    if (isPacketScannedRef.current && sharedPacketBarcodeRef.current) {
      finalPacketBarcode = sharedPacketBarcodeRef.current;
      finalPacketWt = sharedPacketWtRef.current ? parseFloat(sharedPacketWtRef.current) : null;
      console.log("✅ Using packet barcode from ref:", finalPacketBarcode);
    } else {
      console.log("ℹ️ No packet scanned - setting packet_barcode to NULL");
    }

    const estimateNum = currentEstimateNumberRef.current || currentFormData.estimate_number;

    const entryData = {
      // Basic info
      date: currentFormData.date,
      estimate_number: estimateNum,
      customer_id: currentFormData.customer_id,
      customer_name: currentFormData.customer_name,
      salesperson_id: salespersonId,
      source_by: sourceBy,
      
      // Product info
      product_id: productDetails.product_id,
      product_name: productDetails.product_name,
      barcode: productDetails.barcode,
      code: productDetails.barcode,
      metal_type: productDetails.metal_type,
      purity: productDetails.purity,
      design_name: productDetails.design,
      category: productDetails.category_id,
      sub_category: productDetails.product_name,
      
      // Weight fields
      gross_weight: calculatedValues.gross_weight,
      stone_weight: calculatedValues.stone_weight,
      stone_price: calculatedValues.stone_price,
      weight_bw: calculatedValues.weight_bw,
      
      // Wastage fields
      va_on: calculatedValues.va_on,
      va_percent: calculatedValues.va_percent,
      wastage_weight: calculatedValues.wastage_weight,
      total_weight_av: calculatedValues.total_weight_av,
      
      // Making charges fields
      mc_on: calculatedValues.mc_on,
      mc_per_gram: calculatedValues.mc_per_gram,
      making_charges: calculatedValues.making_charges,
      
      // Rate and amount fields
      rate: calculatedValues.rate,
      rate_amt: calculatedValues.rate_amt,
      
      // Tax and total
      tax_percent: calculatedValues.tax_percent,
      tax_amt: calculatedValues.tax_amt,
      total_price: calculatedValues.total_price,
      hm_charges: calculatedValues.hm_charges,
      
      // Summary fields for the estimate
      total_amount: calculatedValues.rate_amt,
      taxable_amount: (parseFloat(calculatedValues.rate_amt) + parseFloat(calculatedValues.stone_price) + parseFloat(calculatedValues.making_charges)).toFixed(2),
      tax_amount: calculatedValues.tax_amt,
      net_amount: calculatedValues.total_price,
      
      // Pricing and quantity
      pricing: calculatedValues.pricing,
      qty: calculatedValues.qty,
      
      // Packet info
      packet_barcode: finalPacketBarcode,
      packet_wt: finalPacketWt,
      
      // Other fields
      opentag_id: 0,
      pcode: null,
      original_total_price: calculatedValues.total_price,
      estimate_status: "Pending",
      
      // Force insert flag
      force_insert: true
    };

    console.log("=== SENDING TO BACKEND ===");
    console.log("packet_barcode:", entryData.packet_barcode);
    console.log("estimate_number:", entryData.estimate_number);
    console.log("total_price:", entryData.total_price);
    console.log("net_amount:", entryData.net_amount);

    // Save estimate
    const saveResponse = await axios.post(`${baseURL}/add/estimate`, entryData);

    console.log("Backend response:", saveResponse.data);

    // *** UPDATE: Change product status to "Selected" and remove from available list ***
    try {
      const statusResponse = await axios.post(`${baseURL}/update-product-status-on-estimate`, {
        product_id: productDetails.product_id,
        status: "Selected"
      });
      
      if (statusResponse.data.success) {
        console.log(`✅ Product ${productDetails.product_name} status updated to Selected`);
        
        // Remove the product from available products list completely
        setAllProducts(prevProducts => 
          prevProducts.filter(product => product.product_id !== productDetails.product_id)
        );
        
        // Also update the ref to keep it in sync
        allProductsRef.current = allProductsRef.current.filter(
          product => product.product_id !== productDetails.product_id
        );
      } else {
        console.warn(`⚠️ Failed to update product status:`, statusResponse.data.message);
      }
    } catch (statusError) {
      console.error("Error updating product status:", statusError);
      // Don't block estimate creation if status update fails
    }

    if (saveResponse.data.estimate_number) {
      setSavedEstimateNumber(saveResponse.data.estimate_number);
      setIsEstimateSaved(true);
      if (!currentEstimateNumberRef.current) {
        currentEstimateNumberRef.current = saveResponse.data.estimate_number;
        setCurrentEstimateNumber(saveResponse.data.estimate_number);
      }
    }

    // Return product info with calculated values for receipt
    return {
      ...productDetails,
      ...calculatedValues,
      product_name: productDetails.product_name,
      barcode: productDetails.barcode
    };
  } catch (error) {
    console.error('Error adding product:', error);
    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to add product. Please try again.' });
    return null;
  }
};

  const stopScanner = () => {
    if (scannerRef.current) {
      try { scannerRef.current.clear(); } catch (error) { console.log('Error clearing scanner:', error); }
      scannerRef.current = null;
    }
    setIsScannerInitialized(false);
    setShowScanner(false);
  };

  const stopPacketScanner = () => {
    if (packetScannerRef.current) {
      try { packetScannerRef.current.clear(); } catch (error) { console.log('Error clearing packet scanner:', error); }
      packetScannerRef.current = null;
    }
    setIsPacketScannerInitialized(false);
    setShowPacketScanner(false);
  };

  const startScanner = () => setShowScanner(true);
  const startPacketScanner = () => setShowPacketScanner(true);

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
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
      setPacketImages(prev => [...prev, { file, preview: reader.result, name: file.name, size: file.size }]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index) => setPacketImages(prev => prev.filter((_, i) => i !== index));
  const triggerFileUpload = () => fileInputRef.current?.click();

  // Handle Save & Print
  const handleSaveAndPrint = async () => {
    try {
      if (scannedProducts.length === 0 && totalQuantity === 0) {
        alert("Please scan at least one product before saving");
        return;
      }

      if (!formData.customer_name || !formData.customer_id) {
        alert("Please select a customer first");
        return;
      }

      Swal.fire({
        title: 'Generating Receipt...',
        text: 'Please wait while we generate your receipt',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

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
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
        }
      }

      const resolvedEstimateNumber = currentEstimateNumberRef.current || currentEstimateNumber || formData.estimate_number;

      if (uploadedFilenames.length > 0 && resolvedEstimateNumber) {
        try {
          await axios.post(`${baseURL}/update/estimate-images`, {
            estimate_number: resolvedEstimateNumber,
            pack_images: uploadedFilenames
          });
        } catch (err) {
          console.error('Error updating images:', err);
        }
      }

      // Calculate total amount from scanned products
      const totalAmount = scannedProducts.reduce((sum, item) => {
        const totalPrice = parseFloat(item.total_price) || 0;
        return sum + totalPrice;
      }, 0);

      const pdfDoc = pdf(
        <PDFContent
          entries={scannedProducts}
          totalAmount={totalAmount.toFixed(2)}
          taxableAmount={totalAmount.toFixed(2)}
          taxAmount="0.00"
          netAmount={totalAmount.toFixed(2)}
          date={today}
          estimateNumber={resolvedEstimateNumber}
          sellerName="JYAA JEWELERS"
          customerName={formData.customer_name}
          packetImages={uploadedFilenames}
          packetBarcode={sharedPacketBarcodeRef.current}
        />
      );

      const blob = await pdfDoc.toBlob();
      saveAs(blob, `estimate_${resolvedEstimateNumber}.pdf`);

      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'Receipt Saved!',
        text: `Estimate #${resolvedEstimateNumber} has been saved successfully`,
        timer: 2000,
        showConfirmButton: false
      });

      resetForm();

      setTimeout(() => {
        navigate("/salesperson-transactions");
      }, 2000);

    } catch (error) {
      Swal.close();
      console.error("Error in handleSaveAndPrint:", error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to generate receipt. Please try again.' });
    }
  };

  const resetForm = () => {
    setScannedProducts([]);
    setTotalQuantity(0);
    setPacketImages([]);
    setIsPacketScanned(false);
    setPacketDetails(null);
    setSharedPacketBarcode(null);
    setSharedPacketWt(null);
    setCurrentEstimateNumber("");
    setIsEstimateSaved(false);
    setSavedEstimateNumber("");
    setSuccessMessage("");
    setPacketSuccessMessage("");
    setLastAddedProduct("");

    sharedPacketBarcodeRef.current = null;
    sharedPacketWtRef.current = null;
    isPacketScannedRef.current = false;
    currentEstimateNumberRef.current = "";

    axios.get(`${baseURL}/lastEstimateNumber`).then(response => {
      setFormData(prev => {
        const updated = { ...prev, estimate_number: response.data.lastEstimateNumber };
        formDataRef.current = updated;
        return updated;
      });
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "customer_name") {
      const selectedCustomerOption = customerOptions.find(opt => opt.value === value);
      if (selectedCustomerOption) {
        setFormData(prev => {
          const updated = {
            ...prev,
            customer_name: selectedCustomerOption.value,
            customer_id: selectedCustomerOption.customerId
          };
          formDataRef.current = updated;
          return updated;
        });

        setScannedProducts([]);
        setTotalQuantity(0);
        setIsPacketScanned(false);
        setPacketDetails(null);
        setSharedPacketBarcode(null);
        setSharedPacketWt(null);
        setCurrentEstimateNumber("");
        setIsEstimateSaved(false);
        setSavedEstimateNumber("");
        setSuccessMessage("");
        setPacketSuccessMessage("");
        setLastAddedProduct("");

        sharedPacketBarcodeRef.current = null;
        sharedPacketWtRef.current = null;
        isPacketScannedRef.current = false;
        currentEstimateNumberRef.current = "";
      }
    } else {
      setFormData(prev => {
        const updated = { ...prev, [name]: value };
        formDataRef.current = updated;
        return updated;
      });
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "All unsaved data will be lost!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel!'
    }).then((result) => {
      if (result.isConfirmed) {
        resetForm();
        navigate("/salesperson-transactions");
      }
    });
  };

  return (
    <>
      <Navbar />
      <div className="main-container" style={{ marginTop: '120px' }}>
        <Container className="estimate-form-container">
          <Row className="estimate-form-section">
            <h2>Selections</h2>

            <Row className="d-flex justify-content-end align-items-center mb-3">
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

            <Row className="align-items-center mb-4">
              <Col xs={12} md={3}>
                <InputField
                  label="Customer Name *"
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

              <Col xs={12} md={7}>
                <div className="action-buttons-row">
                  <Button onClick={startScanner} className="action-btn scan-product-btn">
                    <FaQrcode /> Scan Product
                  </Button>

                  <Button onClick={startPacketScanner} className="action-btn scan-packet-btn">
                    <FaBarcode /> Scan Packet
                  </Button>

                  <Button onClick={startCamera} className="action-btn capture-btn">
                    <FaCamera /> Capture Image
                  </Button>

                  <Button onClick={triggerFileUpload} className="action-btn upload-btn">
                    <FaUpload /> Upload Image
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
              </Col>

              <Col xs={12} md={2} className="d-flex justify-content-end">
                <div className="total-qty-container">
                  <span className="total-qty-label">Total Qty:</span>
                  <span className="total-qty-value">{totalQuantity}</span>
                </div>
              </Col>
            </Row>

            {packetSuccessMessage && (
              <Row className="mb-3">
                <Col xs={12} className="d-flex justify-content-end">
                  <div className="success-message-container">
                    <div className="alert alert-success alert-dismissible fade show mb-0" role="alert" style={{
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      border: '1px solid #c3e6cb',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      animation: 'slideIn 0.3s ease-out'
                    }}>
                      <span style={{ fontSize: '18px' }}>✓</span>
                      <span>{packetSuccessMessage}</span>
                      <button
                        type="button"
                        className="btn-close"
                        style={{ fontSize: '10px', marginLeft: '15px' }}
                        onClick={() => setPacketSuccessMessage("")}
                        aria-label="Close"
                      ></button>
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            {successMessage && (
              <Row className="mb-3">
                <Col xs={12} className="d-flex justify-content-end">
                  <div className="success-message-container">
                    <div className="alert alert-success alert-dismissible fade show mb-0" role="alert" style={{
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      border: '1px solid #c3e6cb',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      animation: 'slideIn 0.3s ease-out'
                    }}>
                      <span style={{ fontSize: '18px' }}>✓</span>
                      <span>{successMessage}</span>
                      <button
                        type="button"
                        className="btn-close"
                        style={{ fontSize: '10px', marginLeft: '15px' }}
                        onClick={() => setSuccessMessage("")}
                        aria-label="Close"
                      ></button>
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            {packetImages.length > 0 && (
              <Row className="mt-2 mb-3">
                <Col xs={12}>
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
                        <button className="remove-image-btn" onClick={() => removeImage(index)}>
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            )}

            <Row className="mt-3">
              <Col xs={12} className="d-flex justify-content-end">
                <Button className="cancel-btn me-2" onClick={handleCancel}>Cancel</Button>
                <Button className="save-btn" onClick={handleSaveAndPrint} disabled={scannedProducts.length === 0}>
                  <FaSave /> Save
                </Button>
              </Col>
            </Row>
          </Row>
        </Container>
      </div>

      {/* Product Scanner Modal */}
      <Modal show={showScanner} onHide={stopScanner} centered>
        <Modal.Header closeButton><Modal.Title>Scan Product Barcode</Modal.Title></Modal.Header>
        <Modal.Body style={{ textAlign: 'center', padding: '20px' }}>
          <div id="qr-reader" style={{ width: '100%', minHeight: '300px' }}></div>
          <p className="mt-3">Point your camera at the product barcode to scan and automatically add to estimate</p>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={stopScanner}>Cancel Scan</Button></Modal.Footer>
      </Modal>

      {/* Packet Scanner Modal */}
      <Modal show={showPacketScanner} onHide={stopPacketScanner} centered>
        <Modal.Header closeButton><Modal.Title>Scan Packet QR Code</Modal.Title></Modal.Header>
        <Modal.Body style={{ textAlign: 'center', padding: '20px' }}>
          <div id="packet-qr-reader" style={{ width: '100%', minHeight: '300px' }}></div>
          <p className="mt-3">Point your camera at the packet QR code to scan and attach to ALL products in this estimate</p>
          <p className="text-info mt-2">⚠️ Once scanned, this packet will be applied to every product you add to this estimate</p>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={stopPacketScanner}>Cancel Scan</Button></Modal.Footer>
      </Modal>

      {/* Camera Capture Modal */}
      <Modal show={showCamera} onHide={stopCamera} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Capture Packet Image</Modal.Title></Modal.Header>
        <Modal.Body style={{ textAlign: 'center' }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={stopCamera}>Cancel</Button>
          <Button variant="primary" onClick={captureImage}>Capture</Button>
        </Modal.Footer>
      </Modal>

      {/* Image Preview Modal */}
      <Modal show={showImagePreview} onHide={() => setShowImagePreview(false)} centered>
        <Modal.Header closeButton><Modal.Title>Image Preview</Modal.Title></Modal.Header>
        <Modal.Body style={{ textAlign: 'center' }}>
          {previewImage && <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '70vh' }} />}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default EstimateForm;