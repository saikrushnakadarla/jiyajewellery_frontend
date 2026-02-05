import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InputField from "../../../../Pages/TableLayout/InputField";
import Swal from 'sweetalert2';
import { Container, Row, Col, Button, Table } from "react-bootstrap";
import Navbar from "../../../../Pages/Navbar/Navbar";
import { FaEdit, FaTrash, FaCloudUploadAlt, FaQrcode } from "react-icons/fa";
import "./ProductForm.css";

// Import jsPDF and QRCode
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

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
  
  // QR Code state
  const [isGenerateQRCode, setIsGenerateQRCode] = useState(true);

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

  // State for product images
  const [productImages, setProductImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [editingImageIndex, setEditingImageIndex] = useState(null);

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
      
      // Set product images if editing
      if (editingRecord.images) {
        const imagesArray = Array.isArray(editingRecord.images) ? editingRecord.images : [];
        setProductImages(imagesArray);
      }
      
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
      setProductImages([]);
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

  // Function to generate and download QR Code PDF
  const generateAndDownloadPDF = async (productData) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [75, 25] // height: 75mm (with tail), width: 25mm
      });

      // Generate QR Code content based on pricing type
      let qrContent = "";
      if (productData.pricing === "By Weight") {
        qrContent = `Barcode: ${productData.barcode}, Product: ${productData.product_name}, Gross Wt: ${productData.gross_wt || '0'}, Net Wt: ${productData.net_wt || '0'}, Total Price: ${productData.total_price || '0'}`;
      } else if (productData.pricing === "By fixed") {
        qrContent = `Barcode: ${productData.barcode}, Product: ${productData.product_name}, Piece Cost: ${productData.pieace_cost || '0'}, Total Price: ${productData.total_price || '0'}`;
      } else {
        qrContent = `Barcode: ${productData.barcode}, Product: ${productData.product_name}`;
      }

      // Generate QR code image
      const qrImageData = await QRCode.toDataURL(qrContent, {
        width: 400,
        margin: 0
      });

      // Background white
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 25, 75, "F");

      // ---------------------------------------------------
      // TOP TAG AREA = 30mm
      // ---------------------------------------------------

      // QR BLOCK 0–15mm
      const leftMargin = 2;
      const qrSize = 21;
      const qrHeight = 13;
      const qrStartY = 1;

      // Add QR Code
      doc.addImage(qrImageData, "PNG", leftMargin, qrStartY, qrSize, qrHeight);

      // PRODUCT DETAILS BLOCK 15–30mm
      let textY = 16;
      const textX = 2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(4);
      doc.setTextColor(0, 0, 0);

      // Barcode
      doc.text(`Barcode: ${productData.barcode}`, textX, textY);
      textY += 2;

      // Product Name
      doc.text(`Product: ${productData.product_name || "Product"}`, textX, textY);
      textY += 2;

      // Gross weight (if exists)
      if (productData.gross_wt) {
        doc.text(`Gross Wt: ${productData.gross_wt}g`, textX, textY);
        textY += 2;
      }

      // Net weight (if exists)
      if (productData.net_wt) {
        doc.text(`Net Wt: ${productData.net_wt}g`, textX, textY);
        textY += 2;
      }

      // Price
      if (productData.total_price) {
        doc.text(`Price: ₹${productData.total_price}`, textX, textY);
      }

      // Generate PDF blob
      const pdfBlob = doc.output("blob");
      
      // Save PDF to server
      await handleSavePDFToServer(pdfBlob, productData.barcode);

      // Download PDF to client
      doc.save(`QR_${productData.barcode}.pdf`);
      
      return true;
    } catch (error) {
      console.error("Error generating QR Code PDF:", error);
      return false;
    }
  };

  // Function to save PDF to server
  const handleSavePDFToServer = async (pdfBlob, barcode) => {
    const formData = new FormData();
    formData.append("invoice", pdfBlob, `${barcode}.pdf`);

    try {
      const response = await fetch(`http://localhost:5000/upload-invoice`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload invoice");
      }

      console.log(`QR PDF ${barcode} saved on server`);
      return true;
    } catch (error) {
      console.error("Error uploading QR PDF:", error);
      return false;
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

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Only JPG, PNG, GIF, and WebP images are allowed.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Maximum file size is 5MB per image.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    
    // Create preview URLs and add to uploaded images
    const newImages = files.map(file => ({
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      isNew: true,
      isEditing: false
    }));
    
    setUploadedImages(prev => [...prev, ...newImages]);
    e.target.value = null; // Reset file input
  };

  // Handle edit image (replace existing image)
  const handleEditImage = (index, imageName) => {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Only JPG, PNG, GIF, and WebP images are allowed.',
          confirmButtonColor: '#3085d6',
        });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Maximum file size is 5MB per image.',
          confirmButtonColor: '#3085d6',
        });
        return;
      }
      
      // Mark existing image for deletion
      if (editingRecord) {
        setImagesToDelete(prev => [...prev, imageName]);
      }
      
      // Remove the old image
      const updatedImages = [...productImages];
      updatedImages.splice(index, 1);
      setProductImages(updatedImages);
      
      // Add new image to uploaded images
      const newImage = {
        file: file,
        preview: URL.createObjectURL(file),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
        isNew: true,
        isEditing: false
      };
      
      setUploadedImages(prev => [...prev, newImage]);
      setEditingImageIndex(null);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  // Handle delete uploaded image (new images not yet saved)
  const handleDeleteUploadedImage = (index) => {
    Swal.fire({
      title: 'Delete Image?',
      text: 'Are you sure you want to delete this image?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setUploadedImages(prev => {
          const newImages = [...prev];
          URL.revokeObjectURL(newImages[index].preview); // Clean up memory
          newImages.splice(index, 1);
          return newImages;
        });
      }
    });
  };

  // Handle delete existing image (for editing mode)
  const handleDeleteExistingImage = (imageName) => {
    Swal.fire({
      title: 'Delete Image?',
      text: 'Are you sure you want to delete this image?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        if (editingRecord) {
          setImagesToDelete(prev => [...prev, imageName]);
        }
        setProductImages(prev => prev.filter(img => img !== imageName));
      }
    });
  };

  // Get image URL for display
  const getImageUrl = (imageName) => {
    if (imageName.startsWith('blob:')) {
      return imageName;
    }
    return `http://localhost:5000/uploads/products/${imageName}`;
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
        // Find the matching metal type from metalTypes array
        const selectedMetal = metalTypes.find(mt => 
          mt.metal_name === selectedProduct.metal_type || 
          mt.id.toString() === selectedProduct.metal_type_id?.toString()
        );
        
        const updatedData = {
          category_id: selectedProduct.category_id,
          product_name: value,
          // Auto-fill metal type from category
          metal_type_id: selectedMetal ? selectedMetal.id.toString() : "",
          metal_type: selectedProduct.metal_type || ""
        };
        
        setFormData(prev => ({
          ...prev,
          ...updatedData
        }));

        if (!editingRecord) {
          await fetchNextBarcode(selectedProduct.category_id, value);
        }
      }
    }

    // Auto-update related fields when metal type is manually selected
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

  // Prepare FormData for file upload
  const formDataToSend = new FormData();
  
  // Add all form fields to FormData
  Object.keys(formData).forEach(key => {
    formDataToSend.append(key, formData[key] || "");
  });

  // Add existing images to delete (for edit mode)
  if (editingRecord && imagesToDelete.length > 0) {
    formDataToSend.append('images_to_delete', JSON.stringify(imagesToDelete));
  }

  // Add new image files
  uploadedImages.forEach((imageObj, index) => {
    if (imageObj.file) {
      formDataToSend.append('images', imageObj.file);
    }
  });

  console.log("Submitting data...");

  try {
    let url = "http://localhost:5000/post/product";
    let method = "POST";

    if (editingRecord) {
      url = `http://localhost:5000/update/product/${editingRecord.product_id}`;
      method = "PUT";
    }

    const response = await fetch(url, {
      method: method,
      body: formDataToSend,
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Success:", result);

      // Clean up preview URLs
      uploadedImages.forEach(img => {
        if (img.preview && img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });

      // Generate QR Code PDF if checkbox is checked
      if (isGenerateQRCode && !editingRecord) {
        try {
          const qrGenerated = await generateAndDownloadPDF(formData);
          if (qrGenerated) {
            console.log("QR Code PDF generated successfully");
            
            // Update product with QR status
            try {
              const qrResponse = await fetch(`http://localhost:5000/update-product-qr/${result.product_id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ qr_generated: true })
              });
              
              if (qrResponse.ok) {
                console.log('QR status updated in database');
              }
            } catch (qrUpdateError) {
              console.error('Error updating QR status:', qrUpdateError);
              // Continue even if QR status update fails
            }
          }
        } catch (qrError) {
          console.error("Error generating QR Code:", qrError);
          // Don't show error to user if QR generation fails
        }
      }

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

          <form className="product-form" onSubmit={handleSubmit} encType="multipart/form-data">
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


                {/* QR Code Checkbox */}
            {!editingRecord && (
              <div className="qr-code-checkbox mt-3 mb-3">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isGenerateQRCode}
                    onChange={(e) => setIsGenerateQRCode(e.target.checked)}
                  />
                  <FaQrcode className="qr-icon" />
                  Generate QR Code for Barcode
                </label>
              </div>
            )}

              {/* Product Images Section */}
              <Col xs={12} className="mt-4">
                <div className="image-upload-section">
                  <h5>Product Images</h5>
                  <div className="image-upload-container">
                    {/* File upload input */}
                    <div className="file-upload-box">
                      <input
                        type="file"
                        id="product-images"
                        name="images"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="file-input"
                      />
                      <label htmlFor="product-images" className="file-upload-label">
                        <FaCloudUploadAlt className="upload-icon" />
                        <span>Click to upload images</span>
                        <small>Max 10 images, 5MB each (JPG, PNG, GIF, WebP)</small>
                      </label>
                    </div>

                    {/* Image previews */}
                    <div className="image-previews">
                      {/* Existing images */}
                      {productImages.map((image, index) => (
                        <div key={`existing-${index}`} className="image-preview-item">
                          <div className="image-controls">
                            <div className="image-badge">#{index + 1}</div>
                            <div className="image-action-buttons">
                              <button
                                type="button"
                                className="edit-image-btn"
                                onClick={() => handleEditImage(index, image)}
                                title="Edit image"
                              >
                                <FaEdit className="edit-icon" />
                              </button>
                              <button
                                type="button"
                                className="delete-image-btn"
                                onClick={() => handleDeleteExistingImage(image)}
                                title="Delete image"
                              >
                                <FaTrash className="delete-icon" />
                              </button>
                            </div>
                          </div>
                          <img 
                            src={getImageUrl(image)} 
                            alt={`Product ${index + 1}`}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                            }}
                          />
                        </div>
                      ))}

                      {/* Newly uploaded images */}
                      {uploadedImages.map((image, index) => (
                        <div key={`new-${index}`} className="image-preview-item">
                          <div className="image-controls">
                            <div className="image-badge new-badge">New #{index + 1}</div>
                            <div className="image-action-buttons">
                              <button
                                type="button"
                                className="delete-image-btn"
                                onClick={() => handleDeleteUploadedImage(index)}
                                title="Delete image"
                              >
                                <FaTrash className="delete-icon" />
                              </button>
                            </div>
                          </div>
                          <img src={image.preview} alt={`New upload ${index + 1}`} />
                          <div className="image-info-overlay">
                            <span className="image-info">{image.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Image count info */}
                    <div className="image-count-info">
                      <small>
                        Total images: {productImages.length + uploadedImages.length} / 10
                        {editingRecord && imagesToDelete.length > 0 && (
                          <span className="text-danger ml-2">
                            ({imagesToDelete.length} marked for deletion)
                          </span>
                        )}
                      </small>
                    </div>
                  </div>
                </div>
              </Col>

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