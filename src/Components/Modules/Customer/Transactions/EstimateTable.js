// Customer/src/components/Customer/Transactions/EstimateTable.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEye, FaDownload } from 'react-icons/fa';
import { Button, Row, Col, Modal, Table, Form } from 'react-bootstrap';
import { pdf } from "@react-pdf/renderer";
import baseURL from "../../ApiUrl/NodeBaseURL";
import CustomerNavbar from '../../../Pages/Navbar/CustomerNavbar';
import InvoicePDF from '../../Admin/Transactions/InvoicePDF';
import TaxInvoiceA4 from './TaxInvoiceA4PDF';
import './EstimateTable.css';
import baseURL2 from '../../ApiUrl/NodeBaseURL2';

function GlobalFilter({ globalFilter, setGlobalFilter, handleDateFilter }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const applyDateFilter = () => handleDateFilter(fromDate, toDate);
  return (
    <div className="dataTable_search mb-3 d-flex align-items-center gap-2">
      <input value={globalFilter || ''} onChange={(e) => setGlobalFilter(e.target.value)} className="form-control" placeholder="Search..." style={{ maxWidth: '200px' }} />
      <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="form-control" style={{ maxWidth: '150px' }} />
      <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="form-control" style={{ maxWidth: '150px' }} />
      <button onClick={applyDateFilter} className="btn btn-primary">OK</button>
    </div>
  );
}

const EstimateTable = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [allEstimates, setAllEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [repairDetails, setRepairDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [downloadingInvoices, setDownloadingInvoices] = useState({});
  const [companyData, setCompanyData] = useState(null);
  const [productsData, setProductsData] = useState([]);

  const statusOptions = useMemo(() => [
    { value: 'Pending', label: 'Pending', color: '#ffc107' },
    { value: 'Ordered', label: 'Ordered', color: '#17a2b8' },
    { value: 'Rejected', label: 'Rejected', color: '#dc3545' }
  ], []);

  // Get customer_id from localStorage
  useEffect(() => {
    const getCurrentUser = () => {
      try {
        const userDataStr = localStorage.getItem('user');
        if (!userDataStr) {
          Swal.fire({ icon: 'warning', title: 'Authentication Required', text: 'Please login to view your estimates', timer: 2000, showConfirmButton: false }).then(() => navigate('/login'));
          return null;
        }
        const parsedUser = JSON.parse(userDataStr);
        const custId = parsedUser.id || parsedUser.userId || parsedUser.customerId;
        if (custId) {
          setCustomerId(custId);
          return custId;
        } else {
          Swal.fire({ icon: 'warning', title: 'Authentication Required', text: 'Please login to view your estimates', timer: 2000, showConfirmButton: false }).then(() => navigate('/login'));
          return null;
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to retrieve user data. Please login again.' }).then(() => navigate('/login'));
        return null;
      }
    };
    getCurrentUser();
  }, [navigate]);

  // Fetch company details
  const fetchCompanyDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL2}/get/companies`);
      const company = response.data?.[0] || null;
      setCompanyData(company);
      return company;
    } catch (error) {
      console.error("Error fetching company details:", error);
      return null;
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL2}/get/products`);
      setProductsData(response.data || []);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }, []);

  // Load company and products on mount
  useEffect(() => {
    fetchCompanyDetails();
    fetchProducts();
  }, [fetchCompanyDetails, fetchProducts]);

  const filterEstimatesByCustomerId = useCallback((estimates, custId) => {
    if (!custId || !estimates || !Array.isArray(estimates)) return [];
    return estimates.filter((estimate) => {
      const estimateCustomerId = estimate.customer_id;
      if (estimateCustomerId === undefined || estimateCustomerId === null) return false;
      return String(estimateCustomerId) === String(custId);
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/get-unique-estimates`);
      const allEstimatesData = response.data || [];
      const estimatesWithStatus = allEstimatesData.map(estimate => {
        let status = estimate.estimate_status || estimate.status;
        if (!status) {
          status = estimate.source_by === "customer" ? "Ordered" : "Pending";
        }
        if (status === "Accepted") status = "Ordered";
        if (status === "Pending" && estimate.source_by === "customer") status = "Ordered";
        return { ...estimate, estimate_status: status };
      });
      setAllEstimates(estimatesWithStatus);
      const customerEstimates = filterEstimatesByCustomerId(estimatesWithStatus, customerId);
      setData(customerEstimates);
      setFilteredData(customerEstimates);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching estimate details:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load estimates. Please try again.' });
      setLoading(false);
      setData([]);
      setFilteredData([]);
    }
  }, [customerId, filterEstimatesByCustomerId]);

  useEffect(() => { if (customerId) fetchData(); }, [customerId, fetchData]);

  useEffect(() => {
    if (customerId && allEstimates.length > 0) {
      const customerEstimates = filterEstimatesByCustomerId(allEstimates, customerId);
      setData(customerEstimates);
      setFilteredData(customerEstimates);
    }
  }, [customerId, allEstimates, filterEstimatesByCustomerId]);

  const handleDateFilter = useCallback((fromDate, toDate) => {
    if (fromDate || toDate) {
      const filtered = data.filter((item) => {
        if (!item.date) return false;
        const itemDate = new Date(item.date).setHours(0, 0, 0, 0);
        const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
        const to = toDate ? new Date(toDate).setHours(0, 0, 0, 0) : null;
        return (!from || itemDate >= from) && (!to || itemDate <= to);
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [data]);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // Generate and save Tax Invoice PDF
  const generateAndSaveTaxInvoicePDF = useCallback(async (invoiceNumber, salesData) => {
    try {
      const company = companyData;
      const product = productsData;

      const pdfDoc = (
        <TaxInvoiceA4
          formData={{
            invoice_number: invoiceNumber,
            account_name: salesData.repairDetails[0]?.account_name || '',
            mobile: salesData.repairDetails[0]?.mobile || '',
            customer_id: salesData.repairDetails[0]?.customer_id || '',
            address1: salesData.repairDetails[0]?.address1 || '',
            address2: salesData.repairDetails[0]?.address2 || '',
            city: salesData.repairDetails[0]?.city || '',
            pincode: salesData.repairDetails[0]?.pincode || '',
            state: salesData.repairDetails[0]?.state || '',
            gst_in: salesData.repairDetails[0]?.gst_in || '',
            pan_card: salesData.repairDetails[0]?.pan_card || '',
            aadhar_card: salesData.repairDetails[0]?.aadhar_card || '',
            date: salesData.date || new Date().toISOString().split('T')[0],
          }}
          repairDetails={salesData.repairDetails}
          cash_amount={0}
          card_amt={0}
          chq_amt={0}
          online_amt={0}
          taxableAmount={parseFloat(salesData.taxableAmount) || 0}
          taxAmount={parseFloat(salesData.taxAmount) || 0}
          discountAmt={parseFloat(salesData.discountAmt) || 0}
          festivalDiscountAmt={parseFloat(salesData.festivalDiscountAmt) || 0}
          oldItemsAmount={parseFloat(salesData.oldItemsAmount) || 0}
          schemeAmount={parseFloat(salesData.schemeAmount) || 0}
          salesNetAmount={0}
          salesTaxableAmount={parseFloat(salesData.salesTaxableAmount) || 0}
          selectedAdvanceReceiptAmount={parseFloat(salesData.selectedAdvanceReceiptAmount) || 0}
          netAmount={parseFloat(salesData.netAmount) || 0}
          netPayableAmount={parseFloat(salesData.netAmount) || 0}
          product={product}
          company={company}
        />
      );

      const pdfBlob = await pdf(pdfDoc).toBlob();

      const formData = new FormData();
      formData.append("invoice", pdfBlob, `${invoiceNumber}.pdf`);

      const uploadResponse = await fetch(`${baseURL2}/upload-invoice`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload invoice");
      }

      console.log(`Tax Invoice PDF ${invoiceNumber} saved on server`);

      await axios.put(`${baseURL}/update-estimate-pdf-status/${invoiceNumber}`, {
        pdf_generated: 1,
        invoice_number: invoiceNumber
      });

      return true;
    } catch (error) {
      console.error("Error generating/saving Tax Invoice PDF:", error);
      return false;
    }
  }, [companyData, productsData]);

  // Create sales entries from estimate when status changes to Ordered
  const createSalesFromEstimate = useCallback(async (estimateNumber) => {
    try {
      // Fetch estimate details with products
      const estimateResponse = await axios.get(`${baseURL}/get-estimates/${estimateNumber}`);
      const estimateData = estimateResponse.data;

      if (!estimateData || !estimateData.repeatedData || estimateData.repeatedData.length === 0) {
        throw new Error('No products found in this estimate');
      }

      // Get current logged-in customer details from localStorage
      const userDataStr = localStorage.getItem('user');
      let currentCustomer = null;
      if (userDataStr) {
        currentCustomer = JSON.parse(userDataStr);
      }

      // Get latest invoice number
      const invoiceResponse = await axios.get(`${baseURL2}/lastInvoiceNumber`);
      const latestInvoiceNumber = invoiceResponse.data.lastInvoiceNumber;

      // Today's date in YYYY-MM-DD format
      const todayDate = new Date().toISOString().split('T')[0];

      // Resolve customer details - prefer estimate data, fallback to localStorage
      const uniqueData = estimateData.uniqueData || {};

      const resolvedCustomerId =
        uniqueData.customer_id ||
        currentCustomer?.id ||
        currentCustomer?.userId ||
        currentCustomer?.customerId ||
        '';

      const resolvedMobile =
        uniqueData.mobile ||
        currentCustomer?.mobile ||
        currentCustomer?.phone ||
        '';

      const resolvedName =
        uniqueData.customer_name ||
        currentCustomer?.name ||
        currentCustomer?.full_name ||
        currentCustomer?.account_name ||
        '';

      const resolvedEmail =
        uniqueData.email || currentCustomer?.email || '';

      const resolvedAddress1 =
        uniqueData.address1 || currentCustomer?.address1 || '';

      const resolvedAddress2 =
        uniqueData.address2 || currentCustomer?.address2 || '';

      const resolvedCity =
        uniqueData.city || currentCustomer?.city || '';

      const resolvedPincode =
        uniqueData.pincode || currentCustomer?.pincode || '';

      const resolvedState =
        uniqueData.state || currentCustomer?.state || '';

      const resolvedStateCode =
        uniqueData.state_code || currentCustomer?.state_code || '';

      const resolvedAadhar =
        uniqueData.aadhar_card || currentCustomer?.aadhar_card || '';

      const resolvedGstIn =
        uniqueData.gst_in || currentCustomer?.gst_in || '';

      const resolvedPanCard =
        uniqueData.pan_card || currentCustomer?.pan_card || '';

      const resolvedTerms =
        uniqueData.terms || currentCustomer?.terms || '';

      // Build repairDetails array
      // Each item: sale_return_amt = 0, bal_amt = net_amount (total_price)
      const repairDetailsList = estimateData.repeatedData.map(product => {
        const totalPrice = parseFloat(product.total_price) || 0;
        const taxAmt = parseFloat(product.tax_amt) || 0;
        const taxableAmt = parseFloat(product.taxable_amount) || (totalPrice - taxAmt);

        return {
          customer_id: resolvedCustomerId,
          account_id: resolvedCustomerId,
          mobile: resolvedMobile,
          account_name: resolvedName,
          email: resolvedEmail,
          address1: resolvedAddress1,
          address2: resolvedAddress2,
          city: resolvedCity,
          pincode: resolvedPincode,
          state: resolvedState,
          state_code: resolvedStateCode,
          aadhar_card: resolvedAadhar,
          gst_in: resolvedGstIn,
          pan_card: resolvedPanCard,
          terms: resolvedTerms,
          invoice_number: latestInvoiceNumber,
          date: todayDate,
          product_id: product.product_id || '',
          code: product.code || product.barcode || '',
          product_name: product.product_name || '',
          opentag_id: product.opentag_id || null,
          metal: product.metal_type || '',
          metal_type: product.metal_type || '',
          design_name: product.design_name || '',
          purity: product.purity || '',
          selling_purity: product.selling_purity || product.purity || '',
          printing_purity: product.printing_purity || product.purity || '',
          custom_purity: product.custom_purity || null,
          pricing: product.pricing || '',
          category: product.category || '',
          sub_category: product.sub_category || '',
          gross_weight: parseFloat(product.gross_weight) || 0,
          stone_weight: parseFloat(product.stone_weight) || 0,
          weight_bw: parseFloat(product.total_weight_av) || parseFloat(product.net_wt) || 0,
          stone_price: parseFloat(product.stone_price) || 0,
          va_on: product.va_on || '',
          va_percent: parseFloat(product.va_percent) || 0,
          wastage_weight: parseFloat(product.wastage_weight) || 0,
          total_weight_av: parseFloat(product.total_weight_av) || 0,
          mc_on: product.mc_on || '',
          mc_per_gram: parseFloat(product.mc_per_gram) || 0,
          making_charges: parseFloat(product.making_charges) || 0,
          disscount_percentage: parseFloat(product.disscount_percentage) || 0,
          disscount: parseFloat(product.disscount) || 0,
          rate: parseFloat(product.rate) || 0,
          rate_24k: parseFloat(product.rate_24k) || 0,
          rate_amt: parseFloat(product.rate_amt) || 0,
          tax_percent: product.tax_percent || '3.00',
          tax_amt: taxAmt,
          taxable_amount: taxableAmt,
          tax_amount: taxAmt,
          total_price: totalPrice,
          net_amount: totalPrice,
          net_bill_amount: totalPrice,
          paid_amt: 0,
          // ✅ FIX: sale_return_amt must always be 0
          sale_return_amt: 0,
          // ✅ FIX: bal_amt must equal net_amount (total_price) since nothing is paid
          bal_amt: totalPrice,
          old_exchange_amt: 0,
          scheme_amt: 0,
          advance_receipt_amt: 0,
          receipts_amt: null,
          bal_after_receipts: null,
          cash_amount: 0,
          card_amount: 0,
          card_amt: 0,
          chq: 0,
          chq_amt: 0,
          online: 0,
          online_amt: 0,
          qty: parseInt(product.qty) || 1,
          transaction_status: 'Sales',
          sale_status: 'active',
          assigning: 'pending',
          status: null,
          order_status: null,
          order_number: null,
          invoice: null,
          product_image: null,
          imagePreview: null,
          worker_name: null,
          delivery_date: null,
          original_total_price: null,
          pieace_cost: null,
          mrp_price: null,
          hm_charges: parseFloat(product.hm_charges) || null,
          remarks: product.remarks || null,
          original_piece_taxable_amt: 0,
          piece_taxable_amt: 0,
          festival_discount: null,
          advance_amt: null,
          customerImage: null,
          size: null,
          finalReceiptsAmt: null,
          finalBalAfterReceipts: null,
        };
      });

      // Calculate totals
      let totalNetWt = 0;
      let totalGrossWt = 0;
      let totalAmount = 0;
      let totalTaxAmt = 0;

      repairDetailsList.forEach(item => {
        totalNetWt += parseFloat(item.weight_bw) || 0;
        totalGrossWt += parseFloat(item.gross_weight) || 0;
        totalAmount += parseFloat(item.total_price) || 0;
        totalTaxAmt += parseFloat(item.tax_amt) || 0;
      });

      // ✅ FIX: salesNetAmount must be "0.00" so the model does NOT
      //    write a non-zero value into the sale_return_amt column.
      //    In the model insert order:
      //      parsedNetAmount       → net_amount
      //      totalOldAmount        → old_exchange_amt   (0, no old items)
      //      schemesTotalAmount    → scheme_amt         (0, no schemes)
      //      parsedSalesNetAmount  → sale_return_amt    ← must be 0
      //      parsedSelectedAdvanceReceiptAmount → advance_receipt_amt (0)
      //
      //    bal_amt is computed in model as:
      //      netBillAmount = parsedNetAmount - (schemesTotalAmount + parsedSalesNetAmount + parsedSelectedAdvanceReceiptAmount)
      //                    = totalAmount - (0 + 0 + 0) = totalAmount  ✅
      //      balAmt = netBillAmount - paidAmt = totalAmount - 0 = totalAmount ✅

      const dataToSave = {
        repairDetails: repairDetailsList,
        totalAmount: totalAmount.toFixed(2),
        discountAmt: "0.00",
        festivalDiscountAmt: "0.00",
        taxableAmount: (totalAmount - totalTaxAmt).toFixed(2),
        taxAmount: totalTaxAmt.toFixed(2),
        netAmount: totalAmount.toFixed(2),
        net_bill_amount: totalAmount.toFixed(2),
        paid_amt: "0.00",
        bal_amt: totalAmount.toFixed(2),
        old_exchange_amt: "0.00",
        scheme_amt: "0.00",
        // ✅ FIX: pass 0 so model saves 0 into sale_return_amt column
        sale_return_amt: "0.00",
        advance_receipt_amt: "0.00",
        // ✅ FIX: salesNetAmount = "0.00" (not totalAmount)
        //    This maps to parsedSalesNetAmount in model → sale_return_amt column
        salesNetAmount: "0.00",
        salesTaxableAmount: (totalAmount - totalTaxAmt).toFixed(2),
        selectedAdvanceReceiptAmount: "0.00",
        total_net_wt: totalNetWt.toFixed(3),
        total_gross_wt: totalGrossWt.toFixed(3),
        customer_id: resolvedCustomerId,
        mobile: resolvedMobile,
        account_name: resolvedName,
        date: todayDate,
        invoice_number: latestInvoiceNumber,
      };

      // Save to backend
      const saveResponse = await axios.post(`${baseURL2}/save-repair-details`, dataToSave);

      if (saveResponse.status === 200 || saveResponse.status === 201) {
        console.log('Sales saved successfully with invoice:', latestInvoiceNumber);

        // Ledger entry
        if (resolvedCustomerId) {
          try {
            await axios.post(`${baseURL2}/ledger`, {
              transaction_date: todayDate,
              transaction_type: "SALE",
              invoice_number: latestInvoiceNumber,
              credit: 0,
              debit: parseFloat(totalAmount.toFixed(2)),
              balance: parseFloat(totalAmount.toFixed(2)),
              net_wt: parseFloat(totalNetWt.toFixed(3)),
              gross_wt: parseFloat(totalGrossWt.toFixed(3)),
              amount: parseFloat(totalAmount.toFixed(2)),
              account_id: Number(resolvedCustomerId),
            });
            console.log("Ledger entry created successfully");
          } catch (ledgerError) {
            console.error("Error posting to ledger:", ledgerError);
          }
        }

        // Generate and save Tax Invoice PDF
        try {
          await generateAndSaveTaxInvoicePDF(latestInvoiceNumber, dataToSave);
          console.log(`Tax Invoice PDF generated for invoice ${latestInvoiceNumber}`);
        } catch (pdfError) {
          console.error("Error generating Tax Invoice PDF:", pdfError);
        }

        console.log(`Sales created for estimate ${estimateNumber} with invoice: ${latestInvoiceNumber}`);
        return { success: true, invoiceNumber: latestInvoiceNumber };
      } else {
        throw new Error('Failed to save sales data');
      }
    } catch (error) {
      console.error('Error creating sales from estimate:', error);
      throw error;
    }
  }, [generateAndSaveTaxInvoicePDF]);

 // Add this function before handleStatusChange
const updateERPProductStatus = useCallback(async (estimateNumber) => {
  try {
    // First, fetch the estimate details to get the products
    const estimateResponse = await axios.get(`${baseURL}/get-estimates/${estimateNumber}`);
    const estimateData = estimateResponse.data;
    
    if (!estimateData || !estimateData.repeatedData || estimateData.repeatedData.length === 0) {
      console.log('No products found in estimate');
      return { success: false, message: 'No products found' };
    }
    
    // Extract all unique opentag_ids from the products
    const opentagIds = estimateData.repeatedData
      .map(product => product.opentag_id)
      .filter(id => id && id !== null && id !== '');
    
    if (opentagIds.length === 0) {
      console.log('No opentag_ids found in products');
      return { success: false, message: 'No opentag_ids found' };
    }
    
    console.log(`Updating ${opentagIds.length} products in ERP with status "Sold"`);
    
    // Update each product's status in opening_tags_entry table via ERP API
    const updatePromises = opentagIds.map(async (opentagId) => {
      try {
        // First, get the current product data to preserve other fields
        const getProductResponse = await axios.get(`${baseURL2}/get/opening-tags-entry`);
        const allProducts = getProductResponse.data.result || [];
        const productToUpdate = allProducts.find(p => p.opentag_id == opentagId);
        
        if (!productToUpdate) {
          console.log(`Product with opentag_id ${opentagId} not found in ERP`);
          return null;
        }
        
        // Update only the status field to "Sold"
        const updateResponse = await axios.put(`${baseURL2}/update/opening-tags-entry/${opentagId}`, {
          ...productToUpdate,
          Status: "Sold"
        });
        
        return updateResponse.data;
      } catch (error) {
        console.error(`Error updating product ${opentagId} in ERP:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(r => r !== null);
    
    console.log(`Successfully updated ${successfulUpdates.length} products in ERP`);
    
    return { 
      success: successfulUpdates.length > 0, 
      updatedCount: successfulUpdates.length,
      totalCount: opentagIds.length
    };
  } catch (error) {
    console.error('Error updating ERP product status:', error);
    return { success: false, message: error.message };
  }
}, []);

// Then modify your handleStatusChange function
const handleStatusChange = useCallback(async (rowData, newStatus) => {
  try {
    const sourceBy = rowData.source_by;
    const currentOrderNumber = rowData.order_number;

    if (currentOrderNumber && currentOrderNumber.trim() !== '') {
      Swal.fire({ icon: 'error', title: 'Cannot Change Status', text: 'Cannot change status once order number is generated' });
      return;
    }

    if (sourceBy === "customer") {
      Swal.fire({ icon: 'error', title: 'Not Allowed', text: 'Customer-created estimates cannot be modified from here' });
      return;
    }

    const identifier = rowData.estimate_number;
    if (!identifier) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not identify the estimate.' });
      return;
    }

    setUpdatingStatus(prev => ({ ...prev, [identifier]: true }));

    // If status is changing to "Ordered", create sales entries first and update ERP
    if (newStatus === 'Ordered') {
      try {
        // Step 1: Create sales entries (Jiya Jewellery application)
        const result = await createSalesFromEstimate(identifier);
        if (!result.success) {
          throw new Error('Failed to create sales entries');
        }
        
        // Step 2: Update product status in ERP application (opening_tags_entry table)
        const erpUpdateResult = await updateERPProductStatus(identifier);
        
        if (!erpUpdateResult.success) {
          console.warn('ERP update warning:', erpUpdateResult.message);
          // Don't throw error here, continue with status update
          Swal.fire({
            icon: 'warning',
            title: 'Partial Success',
            text: `Sales created successfully, but ERP product status update had issues: ${erpUpdateResult.message || 'Unknown error'}`,
            timer: 3000,
            showConfirmButton: true
          });
        } else {
          console.log(`✅ Updated ${erpUpdateResult.updatedCount} products status to "Sold" in ERP`);
        }
        
        // Step 3: Update product status in Jiya Jewellery's estimate products (from Selected to Ordered)
        try {
          const productStatusResponse = await axios.post(`${baseURL}/update-products-status-to-ordered/${identifier}`);
          if (productStatusResponse.data.success) {
            console.log(`✅ Updated ${productStatusResponse.data.updated_count} products status to Ordered in Jiya Jewellery`);
          } else {
            console.warn('Failed to update product status in Jiya Jewellery:', productStatusResponse.data.message);
          }
        } catch (productStatusError) {
          console.error('Error updating product status in Jiya Jewellery:', productStatusError);
          // Don't block the flow if product status update fails
        }
        
      } catch (salesError) {
        console.error('Error creating sales:', salesError);
        Swal.fire({
          icon: 'error',
          title: 'Sales Creation Failed',
          text: 'Failed to create sales entries. Status not updated.'
        });
        setUpdatingStatus(prev => {
          const newState = { ...prev };
          delete newState[identifier];
          return newState;
        });
        return;
      }
    }

    // Update estimate status in Jiya Jewellery application
    const response = await axios.put(`${baseURL}/update-estimate-status/${identifier}`, {
      estimate_status: newStatus
    });

    if (response.data && response.data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: newStatus === 'Ordered'
          ? `Estimate converted to Order successfully! Status updated to "${newStatus}"`
          : `Estimate status updated to "${newStatus}" successfully!`,
        timer: 3000,
        showConfirmButton: true
      });
      setTimeout(() => fetchData(), 1000);
    } else {
      throw new Error(response.data?.message || 'Failed to update status');
    }
  } catch (error) {
    let errorMessage = 'Failed to update estimate status. Please try again.';
    if (error.response?.data?.message) errorMessage = error.response.data.message;
    Swal.fire({ icon: 'error', title: 'Update Failed', text: errorMessage });
  } finally {
    setUpdatingStatus(prev => {
      const newState = { ...prev };
      delete newState[rowData.estimate_number];
      return newState;
    });
  }
}, [createSalesFromEstimate, updateERPProductStatus, fetchData]);

  const handleViewDetails = useCallback(async (estimate_number) => {
    try {
      const response = await axios.get(`${baseURL}/get-estimates/${estimate_number}`);
      const details = response.data;
      const estimateResponse = await axios.get(`${baseURL}/get-unique-estimates`);
      const allEstimatesData = estimateResponse.data || [];
      const currentEstimate = allEstimatesData.find(est => est.estimate_number === estimate_number);
      if (currentEstimate && details.uniqueData) {
        let status = currentEstimate.estimate_status || currentEstimate.status;
        if (!status) status = currentEstimate.source_by === "customer" ? "Ordered" : "Pending";
        if (status === "Accepted") status = "Ordered";
        if (status === "Pending" && currentEstimate.source_by === "customer") status = "Ordered";
        details.uniqueData.estimate_status = status;
        details.uniqueData.order_number = currentEstimate.order_number || details.uniqueData?.order_number;
        details.uniqueData.order_date = currentEstimate.order_date || details.uniqueData?.order_date;
      }
      setRepairDetails(details);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching estimate details:', error);
      Swal.fire('Error', 'Unable to fetch estimate details.', 'error');
    }
  }, []);

  const handleCloseModal = useCallback(() => { setShowModal(false); setRepairDetails(null); }, []);
  const handleCreate = useCallback(() => navigate('/customer-estimates'), [navigate]);

  // Download PDF from server
  const handleDownloadInvoice = useCallback(async (estimate_number, invoiceNumber) => {
    try {
      setDownloadingInvoices(prev => ({ ...prev, [estimate_number]: true }));

      const pdfUrl = `${baseURL2}/invoices/${invoiceNumber}.pdf`;

      const response = await fetch(pdfUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice_${invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Swal.fire({
          icon: 'success',
          title: 'Downloaded',
          text: 'Invoice downloaded successfully!',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error('PDF not found on server');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Failed to download invoice. Please try again later.'
      });
    } finally {
      setDownloadingInvoices(prev => ({ ...prev, [estimate_number]: false }));
    }
  }, []);

  // Columns Definition
  const columns = useMemo(() => [
    {
      Header: 'Sr. No.',
      Cell: ({ row }) => row.index + 1,
      width: 60,
      disableSortBy: true,
    },
    {
      Header: 'Date',
      accessor: 'date',
      width: 100,
      Cell: ({ value }) => value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
    },
    {
      Header: 'Estimate No',
      accessor: 'estimate_number',
      width: 110,
    },
    {
      Header: 'Order No',
      accessor: 'order_number',
      width: 110,
      Cell: ({ value, row }) => {
        const estimateStatus = row.original.estimate_status;
        if (estimateStatus === 'Ordered') {
          return value ? <strong style={{ color: '#17a2b8' }}>{value}</strong> : <span className="text-muted" style={{ fontStyle: 'italic' }}>Generating...</span>;
        }
        return <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>;
      },
    },
    {
      Header: 'Invoice No',
      accessor: 'invoice_number',
      width: 110,
      Cell: ({ value, row }) => {
        const estimateStatus = row.original.estimate_status;
        if (estimateStatus === 'Ordered' && value) {
          return <strong style={{ color: '#28a745' }}>{value}</strong>;
        }
        return <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>;
      },
    },
    {
      Header: 'Total Amount',
      accessor: 'net_amount',
      width: 120,
      Cell: ({ value }) => `₹ ${parseFloat(value || 0).toFixed(2)}`,
    },
    {
      Header: 'Status',
      accessor: 'estimate_status',
      width: 140,
      Cell: ({ row, value }) => {
        const estimate = row.original;
        const sourceBy = estimate.source_by;
        const currentStatus = value || 'Pending';
        const currentOrderNumber = estimate.order_number;
        const hasOrderNumber = currentOrderNumber && currentOrderNumber.trim() !== '';
        const loadingKey = estimate.estimate_number;
        const isUpdating = updatingStatus[loadingKey];
        const getStatusColor = (status) => {
          switch (status) { case 'Pending': return '#ffc107'; case 'Ordered': return '#17a2b8'; case 'Rejected': return '#dc3545'; default: return '#6c757d'; }
        };
        const isEditable = () => { if (hasOrderNumber) return false; if (sourceBy === "customer") return false; return true; };
        const editable = isEditable();
        return (
          <div style={{ minWidth: '120px' }}>
            {isUpdating ? (
              <div className="d-flex align-items-center"><div className="spinner-border spinner-border-sm text-primary me-2" role="status"><span className="visually-hidden">Loading...</span></div><span>Updating...</span></div>
            ) : editable ? (
              <Form.Select value={currentStatus} onChange={(e) => handleStatusChange(estimate, e.target.value)} style={{ backgroundColor: getStatusColor(currentStatus), color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', minWidth: '120px' }} disabled={isUpdating}>
                {statusOptions.map(option => <option key={option.value} value={option.value} style={{ backgroundColor: option.color, color: 'white' }}>{option.label}</option>)}
              </Form.Select>
            ) : (
              <div style={{ backgroundColor: getStatusColor(currentStatus), color: 'white', border: 'none', fontWeight: 'bold', minWidth: '120px', padding: '6px 12px', borderRadius: '4px', textAlign: 'center' }}>{currentStatus}</div>
            )}
          </div>
        );
      },
      disableSortBy: true,
    },
    {
      Header: 'Actions',
      id: 'actions',
      width: 140,
      Cell: ({ row }) => {
        const estimateNumber = row.original.estimate_number;
        const invoiceNumber = row.original.invoice_number;
        const pdfGenerated = row.original.pdf_generated === 1 || row.original.pdf_generated === true;
        const isOrdered = row.original.estimate_status === 'Ordered';
        const isDownloading = downloadingInvoices[estimateNumber];

        return (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <FaEye
              style={{ cursor: 'pointer', color: 'green', fontSize: '16px' }}
              onClick={() => handleViewDetails(estimateNumber)}
              title="View Details"
            />

            {isDownloading ? (
              <div className="spinner-border spinner-border-sm text-primary" role="status" title="Downloading...">
                <span className="visually-hidden">Downloading...</span>
              </div>
            ) : pdfGenerated && isOrdered && invoiceNumber ? (
              <FaDownload
                style={{ cursor: 'pointer', color: '#a36e29', fontSize: '16px' }}
                onClick={() => handleDownloadInvoice(estimateNumber, invoiceNumber)}
                title="Download Invoice PDF"
              />
            ) : isOrdered && !pdfGenerated ? (
              <span
                style={{ fontSize: '11px', color: '#6c757d', fontStyle: 'italic', cursor: 'help' }}
                title="PDF not yet generated by store"
              >
                Awaiting PDF
              </span>
            ) : null}
          </div>
        );
      },
      disableSortBy: true,
    },
  ], [handleViewDetails, handleDownloadInvoice, handleStatusChange, updatingStatus, statusOptions, downloadingInvoices]);

  const tableData = useMemo(() => [...filteredData].reverse(), [filteredData]);

  const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow, canPreviousPage, canNextPage, pageOptions, nextPage, previousPage, setPageSize, setGlobalFilter, state: { pageIndex, pageSize, globalFilter } } = useTable(
    { columns, data: tableData, initialState: { pageIndex: 0, pageSize: 10 } },
    useGlobalFilter, useSortBy, usePagination
  );

  if (loading) {
    return (
      <>
        <CustomerNavbar />
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div><p className="mt-2">Loading your estimates...</p></div>
      </>
    );
  }

  if (!customerId) {
    return (
      <>
        <CustomerNavbar />
        <div className="text-center py-5"><div className="alert alert-warning">Please login to view your estimates</div><Button variant="primary" onClick={() => navigate('/login')}>Go to Login</Button></div>
      </>
    );
  }

  const statusCounts = tableData.reduce((counts, item) => {
    const status = item.estimate_status || 'Pending';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});

  return (
    <>
      <CustomerNavbar />
      <div className="main-container">
        <div className="estimates-table-container">
          <Row className="mb-3">
            <Col className="d-flex justify-content-between align-items-center">
              <h3 style={{ marginTop: "10px" }}>Selections</h3>
            </Col>
          </Row>
          {tableData.length > 0 && (
            <div className="status-summary mb-3">
              <Row>
                <Col md={12}>
                  <div className="d-flex flex-wrap gap-2">
                    {statusOptions.map(option => (
                      <div key={option.value} className="d-flex align-items-center px-3 py-2 rounded" style={{ backgroundColor: option.color + '20', borderLeft: `4px solid ${option.color}` }}>
                        <span className="fw-bold me-2" style={{ color: option.color }}>{statusCounts[option.value] || 0}</span>
                        <span style={{ color: '#495057' }}>{option.label}</span>
                      </div>
                    ))}
                    <div className="d-flex align-items-center px-3 py-2 rounded" style={{ backgroundColor: '#6c757d20', borderLeft: '4px solid #6c757d' }}>
                      <span className="fw-bold me-2" style={{ color: '#6c757d' }}>{tableData.length}</span>
                      <span style={{ color: '#495057' }}>Total</span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
          {tableData.length === 0 ? (
            <div className="text-center py-5"><div className="alert alert-info">No estimates found for your account.<div className="mt-2"><Button className="create_but" onClick={handleCreate} style={{ backgroundColor: '#a36e29', borderColor: '#a36e29' }}>+ Create New Estimate</Button></div></div></div>
          ) : (
            <>
              <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} handleDateFilter={handleDateFilter} />
              <div className="dataTable_wrapper container-fluid">
                <div className="table-responsive">
                  <table {...getTableProps()} className="table table-striped">
                    <thead>
                      {headerGroups.map((headerGroup, headerGroupIndex) => (
                        <tr {...headerGroup.getHeaderGroupProps()} key={headerGroupIndex} className="dataTable_headerRow">
                          {headerGroup.headers.map((column) => (
                            <th {...column.getHeaderProps(column.getSortByToggleProps())} key={column.id} className="dataTable_headerCell">
                              {column.render('Header')}<span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody {...getTableBodyProps()} className="dataTable_body">
                      {page.map((row) => {
                        prepareRow(row);
                        const estimateStatus = row.original.estimate_status;
                        return (
                          <tr {...row.getRowProps()} key={row.id} className="dataTable_row">
                            {row.cells.map((cell) => {
                              const cellProps = cell.getCellProps();
                              if (cell.column.id === 'estimate_status') {
                                let bgColor = '';
                                switch (estimateStatus) { case 'Pending': bgColor = '#fff3cd'; break; case 'Ordered': bgColor = '#d1ecf1'; break; case 'Rejected': bgColor = '#f8d7da'; break; default: bgColor = ''; }
                                return <td {...cellProps} key={cell.column.id} className="dataTable_cell" style={{ backgroundColor: bgColor }}>{cell.render('Cell')}</td>;
                              }
                              return <td {...cellProps} key={cell.column.id} className="dataTable_cell">{cell.render('Cell')}</td>;
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex align-items-center justify-content-between mt-3">
                  <div className="dataTable_pageInfo">Page <strong>{pageIndex + 1} of {pageOptions.length}</strong> (Showing {tableData.length} total records)</div>
                  <div className="pagebuttons">
                    <button className="btn btn-primary me-2 btn1" onClick={() => previousPage()} disabled={!canPreviousPage}>Prev</button>
                    <button className="btn btn-primary btn1" onClick={() => nextPage()} disabled={!canNextPage}>Next</button>
                  </div>
                  <div>
                    <select className="form-select form-select-sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                      {[5, 10, 20, 50].map((size) => <option key={size} value={size}>Show {size}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <Modal show={showModal} onHide={handleCloseModal} size="xl" className="m-auto">
          <Modal.Header closeButton><Modal.Title>Estimate Details</Modal.Title></Modal.Header>
          <Modal.Body>
            {repairDetails && (
              <>
                <Table bordered>
                  <tbody>
                    <tr><td>Date</td><td>{formatDate(repairDetails.uniqueData?.date)}</td></tr>
                    <tr><td>Estimate Number</td><td>{repairDetails.uniqueData?.estimate_number}</td></tr>
                    <tr><td>Order Number</td><td>{repairDetails.uniqueData?.order_number ? <strong>{repairDetails.uniqueData.order_number}</strong> : <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>}</td></tr>
                    <tr><td>Invoice Number</td><td>{repairDetails.uniqueData?.invoice_number ? <strong style={{ color: '#28a745' }}>{repairDetails.uniqueData.invoice_number}</strong> : <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>}</td></tr>
                    <tr><td>Order Date</td><td>{repairDetails.uniqueData?.order_date ? formatDate(repairDetails.uniqueData.order_date) : <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>}</td></tr>
                    <tr><td>Status</td><td><span className="badge px-3 py-2" style={{ backgroundColor: repairDetails.uniqueData?.estimate_status === 'Ordered' ? '#17a2b8' : repairDetails.uniqueData?.estimate_status === 'Rejected' ? '#dc3545' : '#ffc107', color: 'white', fontSize: '0.9em' }}>{repairDetails.uniqueData?.estimate_status ?? 'Pending'}</span></td></tr>
                    <tr><td>Total Amount</td><td>{repairDetails.uniqueData?.total_amount || repairDetails.uniqueData?.net_amount}</td></tr>
                  </tbody>
                </Table>
                <h5 className="mt-4 mb-3">Products</h5>
                <div className="table-responsive">
                  <Table bordered>
                    <thead style={{ whiteSpace: 'nowrap' }}>
                      <tr>
                        <th>BarCode</th><th>Product Name</th><th>Metal Type</th><th>Purity</th>
                        <th>Gross Wt</th><th>Stone Wt</th><th>W.Wt</th><th>Total Wt</th>
                        <th>MC</th><th>Rate</th><th>Tax Amt</th><th>Total Price</th>
                      </tr>
                    </thead>
                    <tbody style={{ whiteSpace: 'nowrap' }}>
                      {repairDetails.repeatedData?.map((product, index) => (
                        <tr key={index}>
                          <td>{product.code}</td>
                          <td>{product.product_name}</td>
                          <td>{product.metal_type}</td>
                          <td>{product.purity}</td>
                          <td>{product.gross_weight}</td>
                          <td>{product.stone_weight}</td>
                          <td>{product.wastage_weight}</td>
                          <td>{product.total_weight_av}</td>
                          <td>{product.making_charges}</td>
                          <td>{product.rate}</td>
                          <td>{product.tax_amt}</td>
                          <td>{product.total_price}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: "bold" }}>
                        <td colSpan="11" className="text-end">Total Amount</td>
                        <td>{repairDetails.uniqueData?.total_amount || repairDetails.uniqueData?.net_amount}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={handleCloseModal}>Close</Button></Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default EstimateTable;