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

  // ✅ FIX: Refs to hold latest packet values for use inside stale scanner callbacks
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

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${baseURL}/get/products`);
        if (response.ok) {
          const result = await response.json();
          setAllProducts(result);
          allProductsRef.current = result;
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

  // Initialize packet scanner when modal opens
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

        // Update state AND refs
        setPacketDetails(packet);
        setSharedPacketBarcode(packet.qr_code);
        setSharedPacketWt(packet.packet_wt || null);
        setIsPacketScanned(true);

        sharedPacketBarcodeRef.current = packet.qr_code;
        sharedPacketWtRef.current = packet.packet_wt || null;
        isPacketScannedRef.current = true;

        // ✅ KEY FIX: If products were already saved, update them all now
        const estimateNum = currentEstimateNumberRef.current || formDataRef.current.estimate_number;
        if (estimateNum) {
          try {
            await axios.put(`${baseURL}/update/estimate-packet/${estimateNum}`, {
              packet_barcode: packet.qr_code,
              packet_wt: packet.packet_wt || null
            });
            console.log("✅ Updated existing estimate rows with packet barcode:", packet.qr_code);
          } catch (updateErr) {
            console.error("Failed to update existing rows with packet barcode:", updateErr);
          }
        }

        Swal.fire({
          icon: 'success',
          title: 'Packet Attached!',
          html: `<div style="text-align:left">
            <p><strong>QR Code:</strong> ${packet.qr_code}</p>
            <p><strong>Weight:</strong> ${packet.packet_wt || 'N/A'} g</p>
            <p><strong>Date:</strong> ${new Date(packet.packet_date).toLocaleDateString()}</p>
          </div><p class="mt-2 text-success">This packet has been applied to ALL products in this estimate</p>`,
          timer: 3000,
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

      if (barcode) {
        const product = await handleBarcodeAndAddEntry(barcode);
        if (product) {
          setScannedProducts(prev => [...prev, product]);
          setTotalQuantity(prev => prev + 1);
          
          // Set success message
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
        }
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Not Found',
          text: 'Could not find product for this QR code'
        });
      }
    } catch (error) {
      Swal.close();
      console.error('Error processing QR code:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error processing QR code. Please try again.' });
    }
  };

  const extractBarcodeFromQR = (qrData) => {
    try {
      const parsedData = JSON.parse(qrData);
      return parsedData.barcode || parsedData.PCode || parsedData.code || parsedData.BarCode || parsedData.prefix;
    } catch {
      const barcodeMatch = qrData.match(/(barcode|Barcode|PCode|code|prefix)[:\s]*([^\s,]+)/i);
      return barcodeMatch ? barcodeMatch[2] : qrData;
    }
  };

  // ✅ FIX: Read from refs instead of state to avoid stale closure
  const handleBarcodeAndAddEntry = async (barcode) => {
    try {
      if (!barcode) {
        alert("Invalid barcode");
        return null;
      }

      // ✅ Read formData from ref (always fresh)
      const currentFormData = formDataRef.current;

      if (!currentFormData.customer_name || !currentFormData.customer_id) {
        alert("Please select a customer first");
        return null;
      }

      // ✅ Read allProducts from ref (always fresh)
      const selectedProduct = allProductsRef.current.find(p => p.barcode === barcode);

      if (!selectedProduct) {
        alert("Product not found with this barcode");
        return null;
      }

      const response = await fetch(`${baseURL}/get/product/${selectedProduct.product_id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }

      const productDetails = await response.json();
      const productRate = productDetails.rate || "";

      const productInfo = {
        product_id: productDetails.product_id,
        product_name: productDetails.product_name,
        barcode: productDetails.barcode,
        metal_type: productDetails.metal_type,
        purity: productDetails.purity,
        gross_weight: productDetails.gross_wt,
        stone_weight: productDetails.stone_wt,
        stone_price: productDetails.stone_price,
        rate: productRate,
        rate_amt: productDetails.rate_amt,
        qty: 1
      };

      // ✅ FIX: Read from REFS not state — always gets the latest value
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
        ...productInfo,
        customer_id: currentFormData.customer_id,
        customer_name: currentFormData.customer_name,
        date: currentFormData.date,
        estimate_number: estimateNum,
        salesperson_id: salespersonId,
        source_by: sourceBy,
        packet_barcode: finalPacketBarcode,
        packet_wt: finalPacketWt,
        qty: 1,
        force_insert: true
      };

      console.log("=== SENDING TO BACKEND ===");
      console.log("packet_barcode:", entryData.packet_barcode);
      console.log("estimate_number:", entryData.estimate_number);

      const saveResponse = await axios.post(`${baseURL}/add/estimate`, entryData);

      console.log("Backend response:", saveResponse.data);
      console.log("Stored packet_barcode:", saveResponse.data.packet_barcode);

      if (saveResponse.data.estimate_number) {
        setSavedEstimateNumber(saveResponse.data.estimate_number);
        setIsEstimateSaved(true);
        if (!currentEstimateNumberRef.current) {
          currentEstimateNumberRef.current = saveResponse.data.estimate_number;
          setCurrentEstimateNumber(saveResponse.data.estimate_number);
        }
      }

      return productInfo;
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

      const totalAmount = scannedProducts.reduce((sum, item) => {
        const stonePrice = parseFloat(item.stone_price) || 0;
        const rateAmt = parseFloat(item.rate_amt) || 0;
        return sum + stonePrice + rateAmt;
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

  // ✅ FIX: Reset both state AND refs
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
    setLastAddedProduct("");

    // ✅ Reset refs too
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

        // Reset products and packet when customer changes
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
        setLastAddedProduct("");

        // ✅ Reset refs too
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

            {/* Date and Estimate Number Row */}
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

            {/* Customer Name, Action Buttons, and Total Qty */}
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

            {/* Success Message Below Total Quantity */}
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
                      {lastAddedProduct && (
                        <span style={{ fontWeight: '600', color: '#0b5e2e' }}> - {lastAddedProduct}</span>
                      )}
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

            {/* REMOVED: Display Selected Customer badge */}

            {/* REMOVED: Packet Details Section */}

            {/* Packet Images Preview Section */}
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

            {/* REMOVED: Scanned Products Summary section */}

            {/* Action Buttons */}
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
          {/* REMOVED: Packet status messages */}
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