import React, { useState, useEffect, useRef } from "react";
import "./EstimateForm.css";
import InputField from "../../../Pages/TableLayout/InputField";
import { Container, Row, Col, Button, Modal, Image } from "react-bootstrap";
import axios from "axios";
import baseURL from "../../../Modules/ApiUrl/NodeBaseURL";
import baseURL2 from "../../../Modules/ApiUrl/NodeBaseURL2";
import { FaQrcode, FaCamera, FaUpload, FaTimes, FaBoxOpen, FaBarcode, FaSave, FaWeightHanging } from 'react-icons/fa';
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

  const [packetStatus, setPacketStatus] = useState(null);
  const [isPacketUsed, setIsPacketUsed] = useState(false);
  const packetIdRef = useRef(null);

  // Camera capture states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Weight Machine states - GEMINI API INTEGRATION
  const [showWeightCamera, setShowWeightCamera] = useState(false);
  const [weightCameraStream, setWeightCameraStream] = useState(null);
  const weightVideoRef = useRef(null);
  const weightCanvasRef = useRef(null);
  const weightFileInputRef = useRef(null);
  const [extractedWeight, setExtractedWeight] = useState(null);
  const [isProcessingWeight, setIsProcessingWeight] = useState(false);
  const [weightCaptureError, setWeightCaptureError] = useState(null);
  
  // Fields for Gemini extraction
  const [extractedGrams, setExtractedGrams] = useState(null);
  const [extractedMilligrams, setExtractedMilligrams] = useState(null);
  const [extractedTotalGrams, setExtractedTotalGrams] = useState(null);
  const [extractedRawText, setExtractedRawText] = useState(null);
  const [extractedConfidence, setExtractedConfidence] = useState(null);

  // Packet images state
  const [packetImages, setPacketImages] = useState([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Packet level state
  const [packetDetails, setPacketDetails] = useState(null);
  const [isPacketScanned, setIsPacketScanned] = useState(false);
  const [sharedPacketBarcode, setSharedPacketBarcode] = useState(null);
  const [sharedPacketWt, setSharedPacketWt] = useState(null);

  const sharedPacketBarcodeRef = useRef(null);
  const sharedPacketWtRef = useRef(null);
  const isPacketScannedRef = useRef(false);

  const [savedEstimateNumber, setSavedEstimateNumber] = useState("");
  const [isEstimateSaved, setIsEstimateSaved] = useState(false);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [scannedProducts, setScannedProducts] = useState([]);
  const [currentEstimateNumber, setCurrentEstimateNumber] = useState("");
  const currentEstimateNumberRef = useRef("");
  const [successMessage, setSuccessMessage] = useState("");
  const [packetSuccessMessage, setPacketSuccessMessage] = useState("");
  const [lastAddedProduct, setLastAddedProduct] = useState("");

  const [assignedProducts, setAssignedProducts] = useState([]);
  const [assignedProductsMap, setAssignedProductsMap] = useState(new Map());
  const assignedProductsRef = useRef(new Map());

  // NEW: Track mandatory actions completion status
  const [mandatoryActions, setMandatoryActions] = useState({
    scanProduct: false,
    scanPacket: false,
    captureImage: false,
    uploadWeight: false
  });

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

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    allProductsRef.current = allProducts;
  }, [allProducts]);

  useEffect(() => {
    assignedProductsRef.current = assignedProductsMap;
  }, [assignedProductsMap]);

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

  // Fetch assigned products
  useEffect(() => {
    const fetchAssignedProducts = async () => {
      if (!salespersonId) return;

      try {
        Swal.fire({
          title: 'Loading Assigned Products...',
          text: 'Please wait while we fetch your assigned products',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const response = await axios.get(`${baseURL2}/api/assigned-salesman/get-assigned-transfers`);
        
        if (response.data && Array.isArray(response.data)) {
          const salesmanTransfers = response.data.filter(
            transfer => transfer.to_salesman_id === parseInt(salespersonId) && transfer.status === 'completed'
          );

          if (salesmanTransfers.length === 0) {
            Swal.close();
            Swal.fire({
              icon: 'info',
              title: 'No Assigned Products',
              text: 'No products have been assigned to you yet. Please contact your administrator.',
              confirmButtonText: 'OK'
            });
            return;
          }

          const allAssignedProducts = [];
          const productMap = new Map();

          for (const transfer of salesmanTransfers) {
            const detailResponse = await axios.get(
              `${baseURL2}/api/assigned-salesman/get-assigned-transfer/${transfer.assigned_id}`
            );

            if (detailResponse.data && detailResponse.data.transfer_items) {
              detailResponse.data.transfer_items.forEach(item => {
                allAssignedProducts.push(item);
                productMap.set(item.PCode_BarCode, item);
              });
            }
          }

          setAssignedProducts(allAssignedProducts);
          setAssignedProductsMap(productMap);
          
          Swal.close();
          console.log(`Loaded ${allAssignedProducts.length} assigned products for salesman ${salespersonId}`);
        } else {
          Swal.close();
          console.error('Unexpected response format:', response.data);
        }
      } catch (error) {
        Swal.close();
        console.error('Error fetching assigned products:', error);
        Swal.fire({
          icon: 'warning',
          title: 'Warning',
          text: 'Could not fetch assigned products. Please ensure the ERP service is running.',
          confirmButtonText: 'OK'
        });
      }
    };

    fetchAssignedProducts();
  }, [salespersonId]);

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
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
            customerId: customer.id || customer._id || customer.user_id,
            custId: customer.customer_id 
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

  // Initialize product scanner
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

  // ============================================
  // GEMINI API WEIGHT EXTRACTION
  // ============================================

  // Process weight machine image using Gemini API backend
  const processWeightImage = async (imageFile) => {
    setIsProcessingWeight(true);
    setExtractedWeight(null);
    setExtractedGrams(null);
    setExtractedMilligrams(null);
    setExtractedTotalGrams(null);
    setExtractedRawText(null);
    setExtractedConfidence(null);
    setWeightCaptureError(null);

    try {
      Swal.fire({
        title: 'Processing Image with AI...',
        text: 'Gemini AI is analyzing the weight machine display...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('estimate_number', currentEstimateNumberRef.current || formDataRef.current.estimate_number);

      const response = await axios.post(`${baseURL}/api/extract-weight-gemini`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      Swal.close();

      if (response.data.success && response.data.record) {
        const record = response.data.record;
        
        setExtractedRawText(record.raw_text);
        setExtractedGrams(record.grams);
        setExtractedMilligrams(record.milligrams);
        setExtractedTotalGrams(record.total_grams);
        setExtractedConfidence(record.confidence);
        
        setExtractedWeight({
          grossWeight: record.total_grams,
          secondaryWeight: null,
          secondaryLabel: 'wastage_weight',
          rawText: record.raw_text,
          manualEntryNeeded: false,
          value: record.total_grams,
          unit: 'g',
          grams: record.grams,
          milligrams: record.milligrams,
          total_grams: record.total_grams,
          confidence: record.confidence
        });

        // Mark Upload Weight as completed
        setMandatoryActions(prev => ({ ...prev, uploadWeight: true }));

        Swal.fire({
          icon: 'success',
          title: '✅ Weight Extracted Successfully!',
          html: `
            <div style="font-size: 24px; padding: 20px 0;">
              <div><strong>Total Weight:</strong> <span style="color: #0d47a1; font-size: 32px;">${record.total_grams.toFixed(3)}</span> g</div>
              <div style="margin-top: 10px;"><strong>Grams:</strong> ${record.grams} g | <strong>Milligrams:</strong> ${record.milligrams} mg</div>
              <div style="margin-top: 5px; font-size: 14px; color: #666;">Confidence: ${record.confidence}%</div>
              <div style="margin-top: 5px; font-size: 12px; color: #888;">Raw: ${record.raw_text}</div>
            </div>
          `,
          timer: 3000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Could Not Detect Weight',
          text: response.data.message || 'Gemini AI could not extract weight from the image.',
          confirmButtonText: 'OK'
        });
        setWeightCaptureError('Could not read weight from image. Please try a clearer photo.');
      }
    } catch (error) {
      Swal.close();
      console.error('Gemini API Error:', error);
      
      let errorMessage = 'Error processing image with Gemini AI.';
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setWeightCaptureError(errorMessage);
      
      Swal.fire({
        icon: 'error',
        title: 'Extraction Failed',
        text: errorMessage,
        confirmButtonText: 'OK'
      });
    } finally {
      setIsProcessingWeight(false);
    }
  };

  // Handle weight file upload
  const handleWeightFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      processWeightImage(file);
    }
    event.target.value = '';
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
        
        if (packet.status === 'Used') {
          Swal.fire({
            icon: 'warning',
            title: 'Packet Already Used!',
            text: `This packet ${packet.qr_code} has already been used in another estimate and cannot be used again.`,
            confirmButtonText: 'OK'
          });
          return;
        }

        setPacketDetails(packet);
        setSharedPacketBarcode(packet.qr_code);
        setSharedPacketWt(packet.packet_wt || null);
        setIsPacketScanned(true);
        setIsPacketUsed(false);
        packetIdRef.current = packet.id;

        sharedPacketBarcodeRef.current = packet.qr_code;
        sharedPacketWtRef.current = packet.packet_wt || null;
        isPacketScannedRef.current = true;

        // Mark Scan Packet as completed
        setMandatoryActions(prev => ({ ...prev, scanPacket: true }));

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
        Swal.fire({ 
          icon: 'warning', 
          title: 'Packet Not Available', 
          text: response.data.message || `No available packet found for: ${decodedText}` 
        });
      }
    } catch (error) {
      Swal.close();
      console.error('Error processing packet QR:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch packet details.' });
    }
  };

  // Calculate product totals
  const calculateProductTotals = (productDetails) => {
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

    const coverWt = parseFloat(productDetails.Cover_Wt) || 0;
    const cardWt = parseFloat(productDetails.Card_Wt) || 0;
    const packingWt = parseFloat(productDetails.Packing_Wt) || 0;

    const netWeight = grossWeight - stoneWeight;

    let wastageWeight = 0;
    let totalWeight = netWeight;

    if (vaOn === "Gross Weight") {
      wastageWeight = (grossWeight * vaPercent) / 100;
      totalWeight = netWeight + wastageWeight;
    } else if (vaOn === "Weight BW") {
      wastageWeight = (netWeight * vaPercent) / 100;
      totalWeight = netWeight + wastageWeight;
    }

    let rateAmount = 0;
    if (pricing === "By Weight") {
      rateAmount = rate * totalWeight;
    } else if (pricing === "By fixed") {
      rateAmount = rate * qty;
    }

    let makingCharges = 0;
    if (mcOn === "MC / Gram") {
      makingCharges = mcPerGram * totalWeight;
    } else if (mcOn === "MC %") {
      makingCharges = (mcPerGram * rateAmount) / 100;
    } else if (mcOn === "MC / Piece") {
      makingCharges = mcPerGram * qty;
    }

    let taxPercentNum = 0;
    if (taxPercent) {
      const taxMatch = taxPercent.match(/(\d+(?:\.\d+)?)/);
      if (taxMatch) {
        taxPercentNum = parseFloat(taxMatch[1]);
      }
    }

    const totalBeforeTax = rateAmount + stonePrice + makingCharges + hmCharges;
    const taxAmount = (totalBeforeTax * taxPercentNum) / 100;
    const totalPrice = totalBeforeTax + taxAmount;

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
      pricing: pricing,
      cover_wt: coverWt.toFixed(3),
      card_wt: cardWt.toFixed(3),
      packing_wt: packingWt.toFixed(3)
    };
  };

  // Handle QR scan success
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
        const assignedProduct = assignedProductsRef.current.get(barcode);
        
        if (!assignedProduct) {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Product Not Assigned',
            text: `Product with barcode ${barcode} has not been assigned to you. Only assigned products can be scanned.`,
            confirmButtonText: 'OK'
          });
          return;
        }

        const product = await handleBarcodeAndAddEntry(barcode, assignedProduct);
        if (product) {
          setScannedProducts(prev => [...prev, product]);
          setTotalQuantity(prev => prev + 1);

          // Mark Scan Product as completed
          setMandatoryActions(prev => ({ ...prev, scanProduct: true }));

          setSuccessMessage(`✓ Product Added Successfully!`);
          setLastAddedProduct(product.product_name);

          Swal.fire({
            icon: 'success',
            title: 'Product Added!',
            text: `Product "${product.product_name}" has been added to estimate`,
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          Swal.close();
          Swal.fire({
            icon: 'warning',
            title: 'Product Not Found',
            text: `Product details could not be retrieved for barcode: ${barcode}`,
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

  const handleBarcodeAndAddEntry = async (barcode, assignedProduct) => {
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
      
      const calculatedValues = calculateProductTotals(productDetails);

      let finalPacketBarcode = null;
      let finalPacketWt = null;

      if (isPacketScannedRef.current && sharedPacketBarcodeRef.current) {
        finalPacketBarcode = sharedPacketBarcodeRef.current;
        finalPacketWt = sharedPacketWtRef.current ? parseFloat(sharedPacketWtRef.current) : null;
      }

      const estimateNum = currentEstimateNumberRef.current || currentFormData.estimate_number;

      const entryData = {
        date: currentFormData.date,
        estimate_number: estimateNum,
        customer_id: currentFormData.customer_id,
        cust_id: currentFormData.cust_id || currentFormData.customer_id,
        customer_name: currentFormData.customer_name,
        salesperson_id: salespersonId,
        source_by: sourceBy,
        
        product_id: productDetails.product_id,
        product_name: productDetails.product_name,
        barcode: productDetails.barcode,
        code: productDetails.barcode,
        metal_type: productDetails.metal_type,
        purity: productDetails.purity,
        design_name: productDetails.design,
        category: productDetails.category_id,
        sub_category: productDetails.product_name,
        
        gross_weight: calculatedValues.gross_weight,
        stone_weight: calculatedValues.stone_weight,
        stone_price: calculatedValues.stone_price,
        weight_bw: calculatedValues.weight_bw,
        
        va_on: calculatedValues.va_on,
        va_percent: calculatedValues.va_percent,
        wastage_weight: calculatedValues.wastage_weight,
        total_weight_av: calculatedValues.total_weight_av,
        
        mc_on: calculatedValues.mc_on,
        mc_per_gram: calculatedValues.mc_per_gram,
        making_charges: calculatedValues.making_charges,
        
        rate: calculatedValues.rate,
        rate_amt: calculatedValues.rate_amt,
        
        tax_percent: calculatedValues.tax_percent,
        tax_amt: calculatedValues.tax_amt,
        total_price: calculatedValues.total_price,
        hm_charges: calculatedValues.hm_charges,
        
        total_amount: calculatedValues.rate_amt,
        taxable_amount: (parseFloat(calculatedValues.rate_amt) + parseFloat(calculatedValues.stone_price) + parseFloat(calculatedValues.making_charges)).toFixed(2),
        tax_amount: calculatedValues.tax_amt,
        net_amount: calculatedValues.total_price,
        
        pricing: calculatedValues.pricing,
        qty: calculatedValues.qty,
        
        packet_barcode: finalPacketBarcode,
        packet_wt: finalPacketWt,
        
        opentag_id: 0,
        pcode: null,
        original_total_price: calculatedValues.total_price,
        estimate_status: "Pending",
        
        force_insert: true,
        
        assigned_number: assignedProduct?.assigned_number || null,
        assigned_item_id: assignedProduct?.item_id || null,
        
        cover_wt: calculatedValues.cover_wt,
        card_wt: calculatedValues.card_wt,
        packing_wt: calculatedValues.packing_wt
      };

      const saveResponse = await axios.post(`${baseURL}/add/estimate`, entryData);

      try {
        const statusResponse = await axios.post(`${baseURL}/update-product-status-on-estimate`, {
          product_id: productDetails.product_id,
          status: "Selected"
        });
        
        if (statusResponse.data.success) {
          setAllProducts(prevProducts => 
            prevProducts.filter(product => product.product_id !== productDetails.product_id)
          );
          allProductsRef.current = allProductsRef.current.filter(
            product => product.product_id !== productDetails.product_id
          );
        }
      } catch (statusError) {
        console.error("Error updating product status:", statusError);
      }

      if (saveResponse.data.estimate_number) {
        setSavedEstimateNumber(saveResponse.data.estimate_number);
        setIsEstimateSaved(true);
        if (!currentEstimateNumberRef.current) {
          currentEstimateNumberRef.current = saveResponse.data.estimate_number;
          setCurrentEstimateNumber(saveResponse.data.estimate_number);
        }
      }

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
        // Mark Capture Image as completed
        setMandatoryActions(prev => ({ ...prev, captureImage: true }));
      }, 'image/jpeg');

      stopCamera();
    }
  };

  // Weight Camera functions
  const startWeightCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setWeightCameraStream(stream);
      setShowWeightCamera(true);
      setTimeout(() => { if (weightVideoRef.current) weightVideoRef.current.srcObject = stream; }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  const stopWeightCamera = () => {
    if (weightCameraStream) {
      weightCameraStream.getTracks().forEach(track => track.stop());
      setWeightCameraStream(null);
    }
    setShowWeightCamera(false);
    setWeightCaptureError(null);
  };

  const captureWeightImage = () => {
    if (weightVideoRef.current && weightCanvasRef.current) {
      const video = weightVideoRef.current;
      const canvas = weightCanvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], `weight_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        processWeightImage(file);
      }, 'image/jpeg');
    }
  };

  // Trigger weight file upload
  const triggerWeightFileUpload = () => {
    weightFileInputRef.current?.click();
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

  // Check if all mandatory actions are completed
  const areAllMandatoryActionsCompleted = () => {
    return mandatoryActions.scanProduct && 
           mandatoryActions.scanPacket && 
           mandatoryActions.captureImage && 
           mandatoryActions.uploadWeight;
  };

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

      // Check if all mandatory actions are completed
      if (!areAllMandatoryActionsCompleted()) {
        alert("Please complete all mandatory actions: Scan Product, Scan Packet, Capture Image, and Upload Weight before saving.");
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

      if (isPacketScannedRef.current && packetIdRef.current && !isPacketUsed) {
        try {
          await axios.put(`${baseURL}/api/qr-packets/update-status/${packetIdRef.current}`, {
            status: 'Used'
          });
          console.log(`✅ Packet ${sharedPacketBarcodeRef.current} marked as USED`);
          setIsPacketUsed(true);
        } catch (packetError) {
          console.error('Error marking packet as used:', packetError);
        }
      }

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
    setPacketStatus(null);
    setIsPacketUsed(false);
    packetIdRef.current = null;
    setExtractedWeight(null);
    setExtractedGrams(null);
    setExtractedMilligrams(null);
    setExtractedTotalGrams(null);
    setExtractedRawText(null);
    setExtractedConfidence(null);
    setWeightCaptureError(null);

    // Reset mandatory actions
    setMandatoryActions({
      scanProduct: false,
      scanPacket: false,
      captureImage: false,
      uploadWeight: false
    });

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
            customer_id: selectedCustomerOption.customerId,
            cust_id: selectedCustomerOption.custId || selectedCustomerOption.customerId,
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
        setPacketStatus(null);
        setIsPacketUsed(false);
        packetIdRef.current = null;
        setExtractedWeight(null);
        setExtractedGrams(null);
        setExtractedMilligrams(null);
        setExtractedTotalGrams(null);
        setExtractedRawText(null);
        setExtractedConfidence(null);
        setWeightCaptureError(null);

        // Reset mandatory actions when customer changes
        setMandatoryActions({
          scanProduct: false,
          scanPacket: false,
          captureImage: false,
          uploadWeight: false
        });

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

  // Check if all mandatory actions are completed for button disable logic
  const isSaveDisabled = () => {
    return scannedProducts.length === 0 || !areAllMandatoryActionsCompleted();
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
                  <Button 
                    onClick={startScanner} 
                    className={`action-btn scan-product-btn ${mandatoryActions.scanProduct ? 'btn-success' : ''}`}
                    style={mandatoryActions.scanProduct ? { backgroundColor: '#28a745', borderColor: '#28a745' } : {}}
                  >
                    <FaQrcode /> {mandatoryActions.scanProduct ? '✓' : ''} Scan Product
                  </Button>

                  <Button 
                    onClick={startPacketScanner} 
                    className={`action-btn scan-packet-btn ${mandatoryActions.scanPacket ? 'btn-success' : ''}`}
                    style={mandatoryActions.scanPacket ? { backgroundColor: '#28a745', borderColor: '#28a745' } : {}}
                  >
                    <FaBarcode /> {mandatoryActions.scanPacket ? '✓' : ''} Scan Packet
                  </Button>

                  <Button 
                    onClick={startCamera} 
                    className={`action-btn capture-btn ${mandatoryActions.captureImage ? 'btn-success' : ''}`}
                    style={mandatoryActions.captureImage ? { backgroundColor: '#28a745', borderColor: '#28a745' } : {}}
                  >
                    <FaCamera /> {mandatoryActions.captureImage ? '✓' : ''} Capture Image
                  </Button>

                  <Button 
                    onClick={triggerWeightFileUpload} 
                    className={`action-btn upload-weight-btn ${mandatoryActions.uploadWeight ? 'btn-success' : ''}`}
                    style={mandatoryActions.uploadWeight ? { backgroundColor: '#28a745', borderColor: '#28a745' } : {}}
                  >
                    <FaUpload /> {mandatoryActions.uploadWeight ? '✓' : ''} Upload Weight
                  </Button>

                  <input
                    ref={weightFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleWeightFileUpload}
                    style={{ display: 'none' }}
                  />

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

            {/* Mandatory Actions Status Bar */}
            <Row className="mb-3">
              <Col xs={12}>
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  flexWrap: 'wrap',
                  padding: '10px 15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#495057' }}>
                    Required Actions:
                  </span>
                  <span style={{ 
                    color: mandatoryActions.scanProduct ? '#28a745' : '#dc3545',
                    fontWeight: mandatoryActions.scanProduct ? 'bold' : 'normal',
                    fontSize: '13px'
                  }}>
                    {mandatoryActions.scanProduct ? '✅' : '⬜'} Scan Product
                  </span>
                  <span style={{ 
                    color: mandatoryActions.scanPacket ? '#28a745' : '#dc3545',
                    fontWeight: mandatoryActions.scanPacket ? 'bold' : 'normal',
                    fontSize: '13px'
                  }}>
                    {mandatoryActions.scanPacket ? '✅' : '⬜'} Scan Packet
                  </span>
                  <span style={{ 
                    color: mandatoryActions.captureImage ? '#28a745' : '#dc3545',
                    fontWeight: mandatoryActions.captureImage ? 'bold' : 'normal',
                    fontSize: '13px'
                  }}>
                    {mandatoryActions.captureImage ? '✅' : '⬜'} Capture Image
                  </span>
                  <span style={{ 
                    color: mandatoryActions.uploadWeight ? '#28a745' : '#dc3545',
                    fontWeight: mandatoryActions.uploadWeight ? 'bold' : 'normal',
                    fontSize: '13px'
                  }}>
                    {mandatoryActions.uploadWeight ? '✅' : '⬜'} Upload Weight
                  </span>
                  {!areAllMandatoryActionsCompleted() && (
                    <span style={{ 
                      color: '#dc3545', 
                      fontSize: '12px',
                      marginLeft: 'auto',
                      backgroundColor: '#f8d7da',
                      padding: '2px 10px',
                      borderRadius: '12px'
                    }}>
                      ⚠️ Complete all actions to enable Save
                    </span>
                  )}
                  {areAllMandatoryActionsCompleted() && (
                    <span style={{ 
                      color: '#28a745', 
                      fontSize: '12px',
                      marginLeft: 'auto',
                      backgroundColor: '#d4edda',
                      padding: '2px 10px',
                      borderRadius: '12px'
                    }}>
                      ✅ All actions completed
                    </span>
                  )}
                </div>
              </Col>
            </Row>

            {/* GEMINI API WEIGHT DISPLAY */}
            {extractedWeight && (
              <Row className="mb-3">
                <Col xs={12} className="d-flex justify-content-end">
                  <div style={{ 
                    background: '#e8f4fd', 
                    border: '1px solid #90caf9', 
                    borderRadius: 8, 
                    padding: 16, 
                    minWidth: 350,
                    animation: 'slideIn 0.3s ease-out'
                  }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>⚖️ Weight Machine Reading (Gemini AI)</strong>
                      <span className="badge bg-success">AI Extracted</span>
                    </div>

                    <div className="d-flex gap-4 mt-2 flex-wrap">
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#666' }}>Total Weight</label>
                        <div style={{ 
                          fontSize: 24, 
                          fontWeight: 'bold', 
                          color: '#0d47a1',
                          padding: '8px 0',
                          borderBottom: '2px solid #90caf9'
                        }}>
                          {extractedTotalGrams !== null ? `${extractedTotalGrams.toFixed(3)} g` : '—'}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#666' }}>Grams</label>
                        <div style={{ 
                          fontSize: 20, 
                          fontWeight: 'bold', 
                          color: '#0d47a1',
                          padding: '8px 0',
                          borderBottom: '2px solid #90caf9'
                        }}>
                          {extractedGrams !== null ? `${extractedGrams} g` : '—'}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#666' }}>Milligrams</label>
                        <div style={{ 
                          fontSize: 20, 
                          fontWeight: 'bold', 
                          color: '#0d47a1',
                          padding: '8px 0',
                          borderBottom: '2px solid #90caf9'
                        }}>
                          {extractedMilligrams !== null ? `${extractedMilligrams} mg` : '—'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 d-flex gap-3 flex-wrap" style={{ fontSize: 13, color: '#666' }}>
                      <div><strong>Confidence:</strong> {extractedConfidence || 100}%</div>
                      <div><strong>Raw:</strong> {extractedRawText || 'N/A'}</div>
                    </div>

                    <div className="mt-2 d-flex gap-2">
                      <Button 
                        size="sm" 
                        variant="success" 
                        disabled
                        style={{ opacity: 0.7 }}
                      >
                        <FaSave /> ✓ Auto-Saved
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => {
                          setExtractedWeight(null);
                          setExtractedGrams(null);
                          setExtractedMilligrams(null);
                          setExtractedTotalGrams(null);
                          setExtractedRawText(null);
                          setExtractedConfidence(null);
                          setWeightCaptureError(null);
                        }}
                      >
                        <FaTimes /> Close
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            {weightCaptureError && (
              <Row className="mb-3">
                <Col xs={12} className="d-flex justify-content-end">
                  <div className="error-message-container">
                    <div className="alert alert-danger alert-dismissible fade show mb-0" role="alert" style={{
                      backgroundColor: '#f8d7da',
                      color: '#721c24',
                      border: '1px solid #f5c6cb',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      animation: 'slideIn 0.3s ease-out'
                    }}>
                      <span style={{ fontSize: '18px' }}>⚠️</span>
                      <span>{weightCaptureError}</span>
                      <button
                        type="button"
                        className="btn-close"
                        style={{ fontSize: '10px', marginLeft: '15px' }}
                        onClick={() => setWeightCaptureError(null)}
                        aria-label="Close"
                      ></button>
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            {isProcessingWeight && (
              <Row className="mb-3">
                <Col xs={12} className="d-flex justify-content-end">
                  <div className="processing-container" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 20px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px',
                    border: '1px solid #90caf9',
                  }}>
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Processing...</span>
                    </div>
                    <span style={{ color: '#0d47a1', fontSize: '14px', fontWeight: '500' }}>
                      Processing weight machine image with Gemini AI...
                    </span>
                  </div>
                </Col>
              </Row>
            )}

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
                <Button className="cancel-btn me-2" onClick={handleCancel} style={{marginBottom:"2px"}}>Cancel</Button>
                <Button 
                  className="save-btn" 
                  onClick={handleSaveAndPrint} 
                  disabled={isSaveDisabled()}
                  style={{ opacity: isSaveDisabled() ? 0.6 : 1 }}
                >
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
          <p className="text-info mt-2">⚠️ Only products assigned to you can be scanned</p>
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

      {/* Weight Machine Camera Modal */}
      <Modal show={showWeightCamera} onHide={stopWeightCamera} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Capture Weight Machine Display</Modal.Title></Modal.Header>
        <Modal.Body style={{ textAlign: 'center' }}>
          <video ref={weightVideoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
          <canvas ref={weightCanvasRef} style={{ display: 'none' }} />
          <p className="mt-2 text-muted">Point the camera at the weight machine display to capture and extract the weight using Gemini AI</p>
          <p className="text-muted" style={{ fontSize: '12px' }}>Or use the "Upload Weight" button on the main page to select an image from your device</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={stopWeightCamera}>Cancel</Button>
          <Button variant="primary" onClick={captureWeightImage} disabled={isProcessingWeight}>
            {isProcessingWeight ? 'Processing...' : 'Capture & Extract Weight'}
          </Button>
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