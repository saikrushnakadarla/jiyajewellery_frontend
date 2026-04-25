// Admin/src/components/Admin/Transactions/EstimateTable.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaEye, FaBarcode, FaImage, FaFilePdf } from 'react-icons/fa';
import { Button, Row, Col, Modal, Table, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import baseURL from "../../ApiUrl/NodeBaseURL";
import Navbar from '../../../Pages/Navbar/Navbar';
import InvoicePreviewModal from './InvoicePDFPreview';
import './EstimateTable.css';

// ============================================================
// Global Search Filter Component
// ============================================================
function GlobalFilter({ globalFilter, setGlobalFilter, handleDateFilter }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const applyDateFilter = () => handleDateFilter(fromDate, toDate);

  return (
    <div className="dataTable_search mb-3 d-flex align-items-center gap-2">
      <input
        value={globalFilter || ''}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="form-control"
        placeholder="Search..."
        style={{ maxWidth: '200px' }}
      />
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="form-control"
        style={{ maxWidth: '150px' }}
      />
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="form-control"
        style={{ maxWidth: '150px' }}
      />
      <button onClick={applyDateFilter} className="btn btn-primary">OK</button>
    </div>
  );
}

// ============================================================
// Main EstimateTable Component
// ============================================================
const EstimateTable = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [repairDetails, setRepairDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // ---------- Invoice Modal State ----------
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedEstimateNumber, setSelectedEstimateNumber] = useState(null);

  // ============================================================
  // FIX: Use sessionStorage so it resets every browser session.
  // Admin must click "Generate PDF" each session to see "View".
  // This prevents stale localStorage from auto-showing "View".
  // ============================================================
  const [generatedEstimates, setGeneratedEstimates] = useState(() => {
    try {
      const saved = sessionStorage.getItem('generatedInvoices');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync generatedEstimates → sessionStorage on every change
  useEffect(() => {
    sessionStorage.setItem('generatedInvoices', JSON.stringify(generatedEstimates));
  }, [generatedEstimates]);

  // ============================================================
  // Fetch Data
  // ============================================================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/get-unique-estimates`);
      const allEstimatesData = response.data || [];

      const estimatesWithStatus = allEstimatesData.map(estimate => ({
        ...estimate,
        estimate_status: estimate.estimate_status || estimate.status || 'Pending',
      }));

      setData(estimatesWithStatus);
      setFilteredData(estimatesWithStatus);
    } catch (error) {
      console.error('Error fetching estimate details:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load estimates' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // Date Filter Handler
  // ============================================================
  const handleDateFilter = useCallback((fromDate, toDate) => {
    if (fromDate || toDate) {
      const filtered = data.filter((item) => {
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

  // ============================================================
  // Parse Pack Images Safely
  // ============================================================
  const parsePackImages = useCallback((packImages) => {
    if (!packImages) return [];
    try {
      if (typeof packImages === 'string') return JSON.parse(packImages);
      return Array.isArray(packImages) ? packImages : [];
    } catch (error) {
      console.error('Error parsing pack images:', error);
      return [];
    }
  }, []);

  // ============================================================
  // Handle Edit
  // ============================================================
  const handleEdit = useCallback(async (estimate_number, mobile) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to edit this record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, go ahead!',
      cancelButtonText: 'No, cancel',
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.get(`${baseURL}/get-estimates/${estimate_number}`);
        const details = response.data;

        if (!details || !details.repeatedData) {
          Swal.fire('Error', 'No estimate details found for the provided estimate number.', 'error');
          return;
        }

        const existingDetails = JSON.parse(localStorage.getItem('estimateDetails')) || [];
        const today = new Date().toISOString().split('T')[0];

        const formattedDetails = details.repeatedData.map((item) => ({
          ...item,
          date: today,
          estimate_number,
        }));

        const updatedDetails = [...existingDetails, ...formattedDetails];
        localStorage.setItem('estimateDetails', JSON.stringify(updatedDetails));

        if (updatedDetails.length > 0 && updatedDetails[0].disscount_percentage) {
          localStorage.setItem('estimateDiscount', updatedDetails[0].disscount_percentage);
        }

        navigate('/estimates', {
          state: { estimate_number, mobile, entries: details },
        });
      } catch (error) {
        console.error('Error fetching estimate details:', error);
        Swal.fire('Error', 'Unable to fetch estimate details. Please try again.', 'error');
      }
    }
  }, [navigate]);

  // ============================================================
  // Handle Delete
  // ============================================================
  const handleDelete = useCallback(async (estimateNumber) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to delete estimate ${estimateNumber}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${baseURL}/delete/estimate/${estimateNumber}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete estimate');

        const refreshResponse = await axios.get(`${baseURL}/get-unique-estimates`);
        const refreshedData = refreshResponse.data || [];
        setData(refreshedData);
        setFilteredData(refreshedData);

        // Also remove from session tracking
        setGeneratedEstimates(prev => {
          const updated = { ...prev };
          delete updated[estimateNumber];
          return updated;
        });

        Swal.fire('Deleted!', 'The estimate has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting estimate:', error.message);
        Swal.fire('Error!', 'Failed to delete the estimate.', 'error');
      }
    }
  }, []);

  // ============================================================
  // Handle View Details
  // ============================================================
  const handleViewDetails = useCallback(async (estimate_number) => {
    try {
      const response = await axios.get(`${baseURL}/get-estimates/${estimate_number}`);
      const details = response.data;

      const estimateResponse = await axios.get(`${baseURL}/get-unique-estimates`);
      const allEstimates = estimateResponse.data || [];
      const currentEstimate = allEstimates.find(est => est.estimate_number === estimate_number);

      if (currentEstimate && details.uniqueData) {
        details.uniqueData.estimate_status = currentEstimate.estimate_status || currentEstimate.status || 'Pending';
        details.uniqueData.order_number   = currentEstimate.order_number   ?? details.uniqueData.order_number;
        details.uniqueData.order_date     = currentEstimate.order_date     ?? details.uniqueData.order_date;
        details.uniqueData.packet_barcode = currentEstimate.packet_barcode ?? details.uniqueData.packet_barcode;
        details.uniqueData.packet_wt      = currentEstimate.packet_wt      ?? details.uniqueData.packet_wt;
        details.uniqueData.pack_images    = currentEstimate.pack_images    ?? details.uniqueData.pack_images;
      }

      setRepairDetails(details);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching estimate details:', error);
      Swal.fire('Error', 'Unable to fetch estimate details.', 'error');
    }
  }, []);

  const handleCloseModal      = useCallback(() => { setShowModal(false); setRepairDetails(null); }, []);
  const handleImageClick      = useCallback((imageUrl) => { setSelectedImage(imageUrl); setShowImageModal(true); }, []);
  const handleCloseImageModal = useCallback(() => { setShowImageModal(false); setSelectedImage(null); }, []);
  const handleCreate          = useCallback(() => { navigate('/estimates'); }, [navigate]);

  // ============================================================
  // Handle Generate PDF
  // FIX: Only after admin clicks this button does "View" appear.
  // Uses sessionStorage so it resets on new browser session.
  // ============================================================
  const handleGeneratePDF = useCallback(async (estimate_number) => {
    try {
      await axios.post(`${baseURL}/generate-order-number/${estimate_number}`);
      await fetchData(); // Refresh to get updated order_number and pdf_generated from DB
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      // Mark as generated in this session regardless of API result
      setGeneratedEstimates(prev => ({ ...prev, [estimate_number]: true }));
      Swal.fire({
        icon: 'success',
        title: 'PDF Generated',
        text: 'Invoice has been generated. Click "View" to preview.',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  }, [fetchData]);

  // ============================================================
  // Handle View PDF — Opens InvoicePreviewModal
  // ============================================================
  const handleViewPDF = useCallback((estimate_number) => {
    setSelectedEstimateNumber(estimate_number);
    setShowInvoiceModal(true);
  }, []);

  // ============================================================
  // Columns Definition
  // ============================================================
  const columns = useMemo(() => [
    {
      Header: 'Sr. No.',
      id: 'srNo',
      Cell: ({ row }) => row.index + 1,
      width: 60,
      disableSortBy: true,
    },
    {
      Header: 'Date',
      accessor: 'date',
      width: 100,
      Cell: ({ value }) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
        });
      },
    },
    {
      Header: 'Estimate No',
      accessor: 'estimate_number',
      width: 110,
    },
    {
      Header: 'Packet Barcode',
      accessor: 'packet_barcode',
      width: 140,
      Cell: ({ value }) =>
        value ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FaBarcode style={{ color: '#a36e29' }} />
            <span style={{ fontWeight: '500' }}>{value}</span>
          </div>
        ) : (
          <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>
        ),
    },
    {
      Header: 'Order No',
      accessor: 'order_number',
      width: 110,
      Cell: ({ value, row }) => {
        const status = row.original.estimate_status;
        const isOrderedStatus = status === 'Accepted' || status === 'Ordered';
        return isOrderedStatus && value ? (
          <strong style={{ color: '#17a2b8' }}>{value}</strong>
        ) : (
          <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>
        );
      },
    },
    {
      Header: 'Customer Name',
      accessor: 'customer_name',
      width: 150,
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
      width: 120,
      disableSortBy: true,
      Cell: ({ value }) => {
        const status = value || 'Pending';
        const styleMap = {
          Pending:  { backgroundColor: '#ffc107', color: '#212529' },
          Accepted: { backgroundColor: '#28a745', color: 'white' },
          Ordered:  { backgroundColor: '#28a745', color: 'white' },
          Rejected: { backgroundColor: '#dc3545', color: 'white' },
        };
        const style = styleMap[status] || { backgroundColor: '#6c757d', color: 'white' };
        return (
          <span style={{
            ...style,
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'inline-block',
            minWidth: '90px',
            textAlign: 'center',
          }}>
            {status}
          </span>
        );
      },
    },
    // ============================================================
    // Invoice Column
    // FIX: "View" only shows if admin clicked "Generate PDF"
    //      in THIS browser session (sessionStorage).
    //      order_number from DB is intentionally NOT used here.
    // ============================================================
    {
      Header: 'Invoice',
      id: 'invoice',
      width: 140,
      disableSortBy: true,
      Cell: ({ row }) => {
        const estimateNumber = row.original.estimate_number;
        const status = row.original.estimate_status;

        // Step 1: Only show for Accepted / Ordered estimates
        const isOrderedStatus = status === 'Accepted' || status === 'Ordered';
        if (!isOrderedStatus) {
          return (
            <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '12px' }}>
              Not Available
            </span>
          );
        }

        // Step 2: Check sessionStorage ONLY — never auto-detect from order_number
        const isGenerated = !!generatedEstimates[estimateNumber];

        // Step 3: Show "View" only if admin clicked Generate PDF this session
        if (isGenerated) {
          return (
            <Button
              size="sm"
              variant="outline-success"
              onClick={() => handleViewPDF(estimateNumber)}
              title="View Invoice PDF"
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <FaEye /> View
            </Button>
          );
        }

        // Step 4: Default — show "Generate PDF" button
        return (
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => handleGeneratePDF(estimateNumber)}
            title="Generate PDF Invoice"
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
            }}
          >
            <FaFilePdf /> Generate PDF
          </Button>
        );
      },
    },
    {
      Header: 'Actions',
      id: 'actions',
      width: 120,
      disableSortBy: true,
      Cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <FaEye
            style={{ cursor: 'pointer', color: 'green', fontSize: '16px' }}
            onClick={() => handleViewDetails(row.original.estimate_number)}
            title="View Details"
          />
          <FaEdit
            style={{ cursor: 'pointer', color: 'blue', fontSize: '16px' }}
            onClick={() => handleEdit(row.original.estimate_number, row.original.mobile)}
            title="Edit"
          />
          <FaTrash
            style={{ cursor: 'pointer', color: 'red', fontSize: '16px' }}
            onClick={() => handleDelete(row.original.estimate_number)}
            title="Delete"
          />
        </div>
      ),
    },
  ], [handleEdit, handleDelete, handleViewDetails, handleGeneratePDF, handleViewPDF, generatedEstimates]);

  // ============================================================
  // Table Data & React-Table Instance
  // ============================================================
  const tableData = useMemo(() => [...filteredData].reverse(), [filteredData]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    nextPage,
    previousPage,
    setPageSize,
    setGlobalFilter,
    state: { pageIndex, pageSize, globalFilter },
  } = useTable(
    { columns, data: tableData, initialState: { pageIndex: 0, pageSize: 10 } },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  // ============================================================
  // Loading State
  // ============================================================
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <div className="watermark-container">
        <Navbar />
        <div className="main-container">
          <div className="estimates-table-container">

            {/* Header */}
            <Row className="mb-3">
              <Col className="d-flex justify-content-between align-items-center">
                <h3>Estimates</h3>
                <Button
                  className="create_but"
                  onClick={handleCreate}
                  style={{ backgroundColor: '#a36e29', borderColor: '#a36e29' }}
                >
                  + Create
                </Button>
              </Col>
            </Row>

            {/* Search / Date Filter */}
            <GlobalFilter
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
              handleDateFilter={handleDateFilter}
            />

            {/* Table */}
            <div className="dataTable_wrapper container-fluid">
              <div className="table-responsive">
                <table {...getTableProps()} className="table table-striped">
                  <thead>
                    {headerGroups.map((headerGroup) => (
                      <tr {...headerGroup.getHeaderGroupProps()} className="dataTable_headerRow">
                        {headerGroup.headers.map((column) => (
                          <th
                            {...column.getHeaderProps(column.getSortByToggleProps())}
                            className="dataTable_headerCell"
                          >
                            {column.render('Header')}
                            <span>
                              {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                            </span>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody {...getTableBodyProps()} className="dataTable_body">
                    {page.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()} className="dataTable_row">
                          {row.cells.map((cell) => (
                            <td {...cell.getCellProps()} className="dataTable_cell">
                              {cell.render('Cell')}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="d-flex align-items-center justify-content-between mt-3">
                <div className="dataTable_pageInfo">
                  Page <strong>{pageIndex + 1} of {pageOptions.length}</strong>
                </div>
                <div className="pagebuttons">
                  <button
                    className="btn btn-primary me-2 btn1"
                    onClick={previousPage}
                    disabled={!canPreviousPage}
                  >
                    Prev
                  </button>
                  <button
                    className="btn btn-primary btn1"
                    onClick={nextPage}
                    disabled={!canNextPage}
                  >
                    Next
                  </button>
                </div>
                <select
                  className="form-select form-select-sm"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ width: 'auto' }}
                >
                  {[5, 10, 20].map((size) => (
                    <option key={size} value={size}>Show {size}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── View Details Modal ── */}
          <Modal show={showModal} onHide={handleCloseModal} size="xl" className="m-auto">
            <Modal.Header closeButton>
              <Modal.Title>Estimate Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {repairDetails && (
                <>
                  <Table bordered>
                    <tbody>
                      <tr><td>Date</td><td>{formatDate(repairDetails.uniqueData?.date)}</td></tr>
                      <tr><td>Estimate Number</td><td>{repairDetails.uniqueData?.estimate_number}</td></tr>
                      <tr>
                        <td>Packet Barcode</td>
                        <td>
                          {repairDetails.uniqueData?.packet_barcode ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <FaBarcode style={{ color: '#a36e29' }} />
                              <strong>{repairDetails.uniqueData.packet_barcode}</strong>
                              {repairDetails.uniqueData?.packet_wt && (
                                <Badge bg="info" style={{ marginLeft: '10px' }}>
                                  Weight: {repairDetails.uniqueData.packet_wt}g
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>Packet Images</td>
                        <td>
                          {repairDetails.uniqueData?.pack_images ? (
                            <div className="packet-images-container">
                              {parsePackImages(repairDetails.uniqueData.pack_images).map((image, index) => (
                                <OverlayTrigger
                                  key={index}
                                  placement="top"
                                  overlay={<Tooltip id={`tooltip-${index}`}>Click to view full image</Tooltip>}
                                >
                                  <div
                                    className="packet-image-thumbnail"
                                    onClick={() => handleImageClick(image)}
                                    style={{
                                      display: 'inline-block', margin: '5px', cursor: 'pointer',
                                      border: '2px solid #ddd', borderRadius: '5px', padding: '3px',
                                    }}
                                  >
                                    <img
                                      src={`${baseURL}/pack-images/${image}`}
                                      alt={`Packet ${index + 1}`}
                                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '3px' }}
                                      loading="lazy"
                                      onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                                    />
                                    <div style={{ fontSize: '11px', textAlign: 'center', marginTop: '3px' }}>
                                      <FaImage /> Image {index + 1}
                                    </div>
                                  </div>
                                </OverlayTrigger>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted" style={{ fontStyle: 'italic' }}>No images available</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>Order Number</td>
                        <td>
                          {repairDetails.uniqueData?.order_number
                            ? <strong>{repairDetails.uniqueData.order_number}</strong>
                            : <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>}
                        </td>
                      </tr>
                      <tr>
                        <td>Order Date</td>
                        <td>
                          {repairDetails.uniqueData?.order_date
                            ? formatDate(repairDetails.uniqueData.order_date)
                            : <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>}
                        </td>
                      </tr>
                      <tr>
                        <td>Status</td>
                        <td>
                          <span
                            className="badge px-3 py-2"
                            style={{
                              backgroundColor:
                                ['Accepted', 'Ordered'].includes(repairDetails.uniqueData?.estimate_status)
                                  ? '#28a745'
                                  : repairDetails.uniqueData?.estimate_status === 'Rejected'
                                  ? '#dc3545'
                                  : '#ffc107',
                              color: repairDetails.uniqueData?.estimate_status === 'Pending' ? '#212529' : 'white',
                              fontSize: '0.9em',
                            }}
                          >
                            {repairDetails.uniqueData?.estimate_status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>Total Amount</td>
                        <td>{repairDetails.uniqueData?.total_amount || repairDetails.uniqueData?.net_amount}</td>
                      </tr>
                    </tbody>
                  </Table>

                  <h5 className="mt-4 mb-3">Products</h5>
                  <div className="table-responsive">
                    <Table bordered>
                      <thead style={{ whiteSpace: 'nowrap' }}>
                        <tr>
                          <th>BarCode</th>
                          <th>Product Name</th>
                          <th>Metal Type</th>
                          <th>Purity</th>
                          <th>Gross Wt</th>
                          <th>Stone Wt</th>
                          <th>W.Wt</th>
                          <th>Total Wt</th>
                          <th>MC</th>
                          <th>Rate</th>
                          <th>Tax Amt</th>
                          <th>Total Price</th>
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
                        <tr style={{ fontWeight: 'bold' }}>
                          <td colSpan="11" className="text-end">Total Amount</td>
                          <td>{repairDetails.uniqueData?.total_amount || repairDetails.uniqueData?.net_amount}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
            </Modal.Footer>
          </Modal>

          {/* ── Image Preview Modal ── */}
          <Modal show={showImageModal} onHide={handleCloseImageModal} size="lg" centered className="image-preview-modal">
            <Modal.Header closeButton>
              <Modal.Title>Packet Image Preview</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center" style={{ padding: '20px' }}>
              {selectedImage && (
                <img
                  src={`${baseURL}/pack-images/${selectedImage}`}
                  alt="Packet"
                  style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                  onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                />
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseImageModal}>Close</Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>

      {/* ── Invoice Preview Modal ── */}
      <InvoicePreviewModal
        show={showInvoiceModal}
        onHide={() => setShowInvoiceModal(false)}
        estimateNumber={selectedEstimateNumber}
        isAdmin={true}
      />
    </>
  );
};

export default EstimateTable;