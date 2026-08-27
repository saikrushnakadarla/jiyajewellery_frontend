// Admin/src/components/Admin/Transactions/OrdersTable.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaEye, FaBarcode, FaImage, FaFilePdf, FaCalendarAlt } from 'react-icons/fa';
import { Button, Row, Col, Modal, Table, Badge, OverlayTrigger, Tooltip, Form } from 'react-bootstrap';
import baseURL from "../../ApiUrl/NodeBaseURL"; 
import baseURL2 from "../../ApiUrl/NodeBaseURL2";
import Navbar from '../../../Pages/Navbar/Navbar';
import InvoicePreviewModal from './InvoicePDFPreview'; 
import './EstimateTable.css';

// Global Search Filter Component
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

const OrdersTable = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [repairDetails, setRepairDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedEstimateNumber, setSelectedEstimateNumber] = useState(null);
  
  // State for karigar list and assignments
  const [karigarList, setKarigarList] = useState([]);
  const [karigarAssignments, setKarigarAssignments] = useState({});
  const [updatingKarigar, setUpdatingKarigar] = useState(false);

  // State for delivery dates
  const [deliveryDates, setDeliveryDates] = useState({});
  const [updatingDeliveryDate, setUpdatingDeliveryDate] = useState(false);

  // Session storage for generated invoices
  const [generatedEstimates, setGeneratedEstimates] = useState(() => {
    try {
      const saved = sessionStorage.getItem('generatedInvoices');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    sessionStorage.setItem('generatedInvoices', JSON.stringify(generatedEstimates));
  }, [generatedEstimates]);

  // Fetch karigar list from account-details
  const fetchKarigarList = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL2}/get/account-details`);
      const accounts = response.data || [];
      
      // Filter accounts with account_group "Employee Compensation"
      const employees = accounts.filter(
        account => account.account_group === "Employee Compensation"
      );
      
      setKarigarList(employees);
      
      // Load saved assignments from session storage
      const savedAssignments = sessionStorage.getItem('karigarAssignments');
      if (savedAssignments) {
        setKarigarAssignments(JSON.parse(savedAssignments));
      }
    } catch (error) {
      console.error('Error fetching karigar list:', error);
    }
  }, []);

  // Fetch only estimates with customer_order_status = 'Ordered'
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/get-unique-estimates`);
      const allEstimatesData = response.data || [];

      // 🔥 FIX: Filter only estimates with customer_order_status = 'Ordered'
      const orderedEstimates = allEstimatesData.filter(estimate => 
        estimate.customer_order_status === 'Ordered'
      );

      const estimatesWithStatus = orderedEstimates.map(estimate => ({
        ...estimate,
        estimate_status: estimate.estimate_status || estimate.status || 'Ordered',
        // Preserve existing karigar assignments from database
        assign_karigar: estimate.assign_karigar || null,
        assign_karigar_id: estimate.assign_karigar_id || null,
        // Preserve delivery date from database
        delivery_date: estimate.delivery_date || null,
      }));

      setData(estimatesWithStatus);
      setFilteredData(estimatesWithStatus);

      // Load karigar assignments from the fetched data
      const assignments = {};
      const deliveryDatesMap = {};
      
      estimatesWithStatus.forEach(estimate => {
        // Karigar assignments
        if (estimate.assign_karigar_id) {
          assignments[estimate.estimate_number] = {
            id: estimate.assign_karigar_id,
            name: estimate.assign_karigar
          };
        }
        
        // Delivery dates
        if (estimate.delivery_date) {
          deliveryDatesMap[estimate.estimate_number] = estimate.delivery_date;
        }
      });
      
      // Merge karigar assignments with session storage (session storage takes priority)
      const savedAssignments = sessionStorage.getItem('karigarAssignments');
      if (savedAssignments) {
        const parsed = JSON.parse(savedAssignments);
        Object.keys(parsed).forEach(key => {
          assignments[key] = parsed[key];
        });
      }
      
      // Load delivery dates from session storage
      const savedDeliveryDates = sessionStorage.getItem('deliveryDates');
      if (savedDeliveryDates) {
        const parsed = JSON.parse(savedDeliveryDates);
        Object.keys(parsed).forEach(key => {
          deliveryDatesMap[key] = parsed[key];
        });
      }
      
      setKarigarAssignments(assignments);
      setDeliveryDates(deliveryDatesMap);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load orders' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchKarigarList();
  }, [fetchData, fetchKarigarList]);

  // Date Filter Handler
  const handleDateFilter = useCallback((fromDate, toDate) => {
    if (fromDate || toDate) {
      const filtered = data.filter((item) => {
        const itemDate = new Date(item.order_date || item.date).setHours(0, 0, 0, 0);
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

  // Parse Pack Images Safely
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

  // Handle karigar assignment change with API call
  const handleKarigarChange = useCallback(async (estimateNumber, karigarId, karigarName) => {
    setUpdatingKarigar(true);
    try {
      const finalKarigarId = karigarId || null;
      const finalKarigarName = karigarName || null;

      const response = await axios.put(`${baseURL}/update-assign-karigar`, {
        estimate_number: estimateNumber,
        assign_karigar_id: finalKarigarId,
        assign_karigar: finalKarigarName
      });

      if (response.data.success) {
        setKarigarAssignments(prev => ({
          ...prev,
          [estimateNumber]: {
            id: finalKarigarId,
            name: finalKarigarName
          }
        }));
        
        sessionStorage.setItem('karigarAssignments', JSON.stringify({
          ...karigarAssignments,
          [estimateNumber]: {
            id: finalKarigarId,
            name: finalKarigarName
          }
        }));

        Swal.fire({
          icon: 'success',
          title: finalKarigarName ? 'Karigar Assigned' : 'Karigar Unassigned',
          text: finalKarigarName 
            ? `Assigned to ${finalKarigarName}` 
            : 'Karigar assignment removed',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(response.data.message || 'Failed to assign karigar');
      }
    } catch (error) {
      console.error('Error assigning karigar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to assign karigar. Please try again.'
      });
      
      const previousAssignment = karigarAssignments[estimateNumber];
      if (previousAssignment) {
        setKarigarAssignments(prev => ({
          ...prev,
          [estimateNumber]: previousAssignment
        }));
      }
    } finally {
      setUpdatingKarigar(false);
    }
  }, [karigarAssignments]);

  // Handle delivery date change with API call
  const handleDeliveryDateChange = useCallback(async (estimateNumber, deliveryDate) => {
    setUpdatingDeliveryDate(true);
    try {
      const finalDeliveryDate = deliveryDate || null;

      // Call the backend API to update the database
      const response = await axios.put(`${baseURL}/update-delivery-date`, {
        estimate_number: estimateNumber,
        delivery_date: finalDeliveryDate
      });

      if (response.data.success) {
        // Update local state
        setDeliveryDates(prev => ({
          ...prev,
          [estimateNumber]: finalDeliveryDate
        }));
        
        // Save to session storage
        sessionStorage.setItem('deliveryDates', JSON.stringify({
          ...deliveryDates,
          [estimateNumber]: finalDeliveryDate
        }));

        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Delivery Date Updated',
          text: finalDeliveryDate 
            ? `Delivery date set to ${new Date(finalDeliveryDate).toLocaleDateString()}` 
            : 'Delivery date cleared',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(response.data.message || 'Failed to update delivery date');
      }
    } catch (error) {
      console.error('Error updating delivery date:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update delivery date. Please try again.'
      });
      
      // Revert to previous value
      const previousDate = deliveryDates[estimateNumber];
      if (previousDate) {
        setDeliveryDates(prev => ({
          ...prev,
          [estimateNumber]: previousDate
        }));
      }
    } finally {
      setUpdatingDeliveryDate(false);
    }
  }, [deliveryDates]);

  // Handle View Details
  const handleViewDetails = useCallback(async (estimate_number) => {
    try {
      const response = await axios.get(`${baseURL}/get-estimates/${estimate_number}`);
      const details = response.data;

      const estimateResponse = await axios.get(`${baseURL}/get-unique-estimates`);
      const allEstimates = estimateResponse.data || [];
      const currentEstimate = allEstimates.find(est => est.estimate_number === estimate_number);

      if (currentEstimate && details.uniqueData) {
        details.uniqueData.estimate_status = currentEstimate.estimate_status || currentEstimate.status || 'Ordered';
        details.uniqueData.order_number   = currentEstimate.order_number   ?? details.uniqueData.order_number;
        details.uniqueData.order_date     = currentEstimate.order_date     ?? details.uniqueData.order_date;
        details.uniqueData.packet_barcode = currentEstimate.packet_barcode ?? details.uniqueData.packet_barcode;
        details.uniqueData.packet_wt      = currentEstimate.packet_wt      ?? details.uniqueData.packet_wt;
        details.uniqueData.pack_images    = currentEstimate.pack_images    ?? details.uniqueData.pack_images;
        details.uniqueData.assign_karigar = currentEstimate.assign_karigar ?? details.uniqueData.assign_karigar;
        details.uniqueData.assign_karigar_id = currentEstimate.assign_karigar_id ?? details.uniqueData.assign_karigar_id;
        details.uniqueData.delivery_date = currentEstimate.delivery_date ?? details.uniqueData.delivery_date;
        details.uniqueData.customer_order_status = currentEstimate.customer_order_status ?? details.uniqueData.customer_order_status;
      }

      setRepairDetails(details);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Swal.fire('Error', 'Unable to fetch order details.', 'error');
    }
  }, []);

  const handleCloseModal = useCallback(() => { setShowModal(false); setRepairDetails(null); }, []);
  const handleImageClick = useCallback((imageUrl) => { setSelectedImage(imageUrl); setShowImageModal(true); }, []);
  const handleCloseImageModal = useCallback(() => { setShowImageModal(false); setSelectedImage(null); }, []);

  // Handle Generate PDF
  const handleGeneratePDF = useCallback(async (estimate_number) => {
    try {
      await axios.post(`${baseURL}/generate-order-number/${estimate_number}`);
      await fetchData();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
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

  // Handle View PDF
  const handleViewPDF = useCallback((estimate_number) => {
    setSelectedEstimateNumber(estimate_number);
    setShowInvoiceModal(true);
  }, []);

  // Get karigar name by ID
  const getKarigarName = useCallback((karigarId) => {
    const karigar = karigarList.find(k => k.account_id === karigarId);
    return karigar ? karigar.account_name : null;
  }, [karigarList]);

  // Columns Definition
  const columns = useMemo(() => [
    {
      Header: 'Sr. No.',
      id: 'srNo',
      Cell: ({ row }) => row.index + 1,
      width: 60,
      disableSortBy: true,
    },
    {
      Header: 'Order Date',
      accessor: 'order_date',
      width: 110,
      Cell: ({ value, row }) => {
        const dateToShow = value || row.original.date;
        if (!dateToShow) return 'N/A';
        return new Date(dateToShow).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
        });
      },
    },
    {
      Header: 'Order No',
      accessor: 'order_number',
      width: 110,
      Cell: ({ value }) => (
        value ? (
          <strong style={{ color: '#17a2b8' }}>{value}</strong>
        ) : (
          <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>
        )
      ),
    },
    {
      Header: 'Customer Name',
      accessor: 'customer_name',
      width: 150,
      Cell: ({ value }) => value || 'N/A',
    },
    {
      Header: 'Status',
      accessor: 'estimate_status',
      width: 120,
      disableSortBy: true,
      Cell: ({ value }) => {
        const status = value || 'Ordered';
        return (
          <span style={{
            backgroundColor: '#28a745',
            color: 'white',
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
    {
      Header: 'Customer Order Status',
      accessor: 'customer_order_status',
      width: 160,
      disableSortBy: true,
      Cell: ({ value }) => {
        const status = value || 'N/A';
        const isOrdered = status === 'Ordered';
        return (
          <span style={{
            backgroundColor: isOrdered ? '#28a745' : '#6c757d',
            color: 'white',
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
    {
      Header: 'Assign Karigar',
      id: 'assignKarigar',
      width: 200,
      disableSortBy: true,
      Cell: ({ row }) => {
        const estimateNumber = row.original.estimate_number;
        const assignment = karigarAssignments[estimateNumber] || {};
        const currentKarigarId = assignment.id || row.original.assign_karigar_id || '';
        const isUpdating = updatingKarigar;

        return (
          <Form.Select
            size="sm"
            value={currentKarigarId || ''}
            onChange={(e) => {
              const selectedId = e.target.value ? parseInt(e.target.value) : null;
              const selectedKarigar = karigarList.find(k => k.account_id === selectedId);
              const selectedName = selectedKarigar ? selectedKarigar.account_name : null;
              handleKarigarChange(estimateNumber, selectedId, selectedName);
            }}
            disabled={isUpdating}
            style={{
              minWidth: '160px',
              fontSize: '0.85rem',
              borderColor: currentKarigarId ? '#28a745' : '#ced4da',
              backgroundColor: currentKarigarId ? '#f8fff8' : 'white'
            }}
          >
            <option value="">Select Karigar</option>
            {karigarList.map((karigar) => (
              <option key={karigar.account_id} value={karigar.account_id}>
                {karigar.account_name}
              </option>
            ))}
          </Form.Select>
        );
      },
    },
    {
      Header: 'Delivery Date',
      id: 'deliveryDate',
      width: 180,
      disableSortBy: true,
      Cell: ({ row }) => {
        const estimateNumber = row.original.estimate_number;
        const currentDeliveryDate = deliveryDates[estimateNumber] || row.original.delivery_date || '';
        const isUpdating = updatingDeliveryDate;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Form.Control
              type="date"
              size="sm"
              value={currentDeliveryDate || ''}
              onChange={(e) => {
                const date = e.target.value || null;
                handleDeliveryDateChange(estimateNumber, date);
              }}
              disabled={isUpdating}
              style={{
                minWidth: '140px',
                fontSize: '0.85rem',
                borderColor: currentDeliveryDate ? '#28a745' : '#ced4da',
                backgroundColor: currentDeliveryDate ? '#f8fff8' : 'white'
              }}
            />
            {currentDeliveryDate && (
              <FaCalendarAlt 
                style={{ 
                  color: '#28a745', 
                  fontSize: '16px',
                  cursor: 'default'
                }} 
                title="Delivery date set"
              />
            )}
          </div>
        );
      },
    },
    {
      Header: 'Invoice',
      id: 'invoice',
      width: 140,
      disableSortBy: true,
      Cell: ({ row }) => {
        const estimateNumber = row.original.estimate_number;
        const isGenerated = !!generatedEstimates[estimateNumber];

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
        </div>
      ),
    },
  ], [handleViewDetails, handleGeneratePDF, handleViewPDF, generatedEstimates, karigarList, karigarAssignments, handleKarigarChange, updatingKarigar, getKarigarName, deliveryDates, handleDeliveryDateChange, updatingDeliveryDate]);

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

  return (
    <>
      <div>
        <Navbar />
        <div className="main-container">
          <div className="estimates-table-container">
            {/* Header */}
            <Row className="mb-3">
              <Col className="d-flex justify-content-between align-items-center">
                <h3>Orders</h3>
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

          {/* View Details Modal */}
          <Modal show={showModal} onHide={handleCloseModal} size="xl" className="m-auto">
            <Modal.Header closeButton>
              <Modal.Title>Order Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {repairDetails && (
                <>
                  <Table bordered>
                    <tbody>
                      <tr><td>Order Date</td><td>{formatDate(repairDetails.uniqueData?.order_date || repairDetails.uniqueData?.date)}</td></tr>
                      <tr><td>Order Number</td><td><strong>{repairDetails.uniqueData?.order_number || 'N/A'}</strong></td></tr>
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
                        <td>Status</td>
                        <td>
                          <span
                            className="badge px-3 py-2"
                            style={{
                              backgroundColor: '#28a745',
                              color: 'white',
                              fontSize: '0.9em',
                            }}
                          >
                            {repairDetails.uniqueData?.estimate_status || 'Ordered'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>Customer Order Status</td>
                        <td>
                          <span
                            className="badge px-3 py-2"
                            style={{
                              backgroundColor: repairDetails.uniqueData?.customer_order_status === 'Ordered' ? '#28a745' : '#6c757d',
                              color: 'white',
                              fontSize: '0.9em',
                            }}
                          >
                            {repairDetails.uniqueData?.customer_order_status || 'N/A'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>Assigned Karigar</td>
                        <td>
                          {repairDetails.uniqueData?.assign_karigar ? (
                            <span style={{
                              backgroundColor: '#e8f5e9',
                              color: '#2e7d32',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontWeight: '500'
                            }}>
                              {repairDetails.uniqueData.assign_karigar}
                            </span>
                          ) : (
                            <span className="text-muted" style={{ fontStyle: 'italic' }}>Not assigned</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>Delivery Date</td>
                        <td>
                          {repairDetails.uniqueData?.delivery_date ? (
                            <span style={{
                              backgroundColor: '#e3f2fd',
                              color: '#0d47a1',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontWeight: '500'
                            }}>
                              {new Date(repairDetails.uniqueData.delivery_date).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-muted" style={{ fontStyle: 'italic' }}>Not set</span>
                          )}
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

          {/* Image Preview Modal */}
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

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        show={showInvoiceModal}
        onHide={() => setShowInvoiceModal(false)}
        estimateNumber={selectedEstimateNumber}
        isAdmin={true}
      />
    </>
  );
};

export default OrdersTable;