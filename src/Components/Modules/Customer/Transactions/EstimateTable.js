// Customer/src/components/Customer/Transactions/EstimateTable.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEye, FaDownload } from 'react-icons/fa';
import { Button, Row, Col, Modal, Table, Form } from 'react-bootstrap';
import baseURL from "../../ApiUrl/NodeBaseURL";
import CustomerNavbar from '../../../Pages/Navbar/CustomerNavbar';
import InvoicePDF from '../../Admin/Transactions/InvoicePDF';
import './EstimateTable.css';

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
        const custId = parsedUser.customer_id || parsedUser.id || parsedUser.userId || parsedUser.customerId;
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
      if (!identifier) { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not identify the estimate.' }); return; }
      setUpdatingStatus(prev => ({ ...prev, [identifier]: true }));
      const response = await axios.put(`${baseURL}/update-estimate-status/${identifier}`, { estimate_status: newStatus });
      if (response.data && response.data.success) {
        Swal.fire({ icon: 'success', title: 'Success', text: `Estimate status updated to "${newStatus}" successfully!`, timer: 3000, showConfirmButton: true });
        setTimeout(() => fetchData(), 1000);
      } else {
        throw new Error(response.data?.message || 'Failed to update status');
      }
    } catch (error) {
      let errorMessage = 'Failed to update estimate status. Please try again.';
      if (error.response?.data?.message) errorMessage = error.response.data.message;
      Swal.fire({ icon: 'error', title: 'Update Failed', text: errorMessage });
    } finally {
      setUpdatingStatus(prev => { const newState = { ...prev }; delete newState[rowData.estimate_number]; return newState; });
    }
  }, [data, fetchData]);

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

  // ============================================================
  // DOWNLOAD PDF - Client-side generation and download
  // ============================================================
  const handleDownloadInvoice = useCallback(async (estimate_number) => {
    try {
      // Set downloading state
      setDownloadingInvoices(prev => ({ ...prev, [estimate_number]: true }));

      // Fetch invoice data from backend
      const response = await axios.get(`${baseURL}/get-invoice/${estimate_number}`, {
        params: { customer_id: customerId } // Pass customer ID for authorization
      });
      
      const data = response.data;
      
      if (!data || !data.uniqueData) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Invoice data not found' });
        setDownloadingInvoices(prev => ({ ...prev, [estimate_number]: false }));
        return;
      }

      // Fetch customer name from localStorage if not in estimate data
      let customerName = data.uniqueData.customer_name;
      let customerMobile = data.uniqueData.mobile || '';
      
      if (!customerName) {
        try {
          const userDataStr = localStorage.getItem('user');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            customerName = userData.name || userData.customer_name || 'N/A';
            customerMobile = userData.mobile || '';
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      // Dynamically import react-pdf renderer
      const { pdf } = await import('@react-pdf/renderer');
      
      // Create the PDF blob
      const blob = await pdf(
        <InvoicePDF 
          estimateData={data.uniqueData}
          products={data.repeatedData}
          customerDetails={{
            customer_name: customerName,
            mobile: customerMobile,
          }}
        />
      ).toBlob();
      
      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${data.uniqueData.order_number || estimate_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Downloaded',
        text: 'Invoice downloaded successfully!',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error downloading invoice:', error);
      
      if (error.response?.status === 403) {
        Swal.fire({ 
          icon: 'error', 
          title: 'Access Denied', 
          text: 'You do not have permission to download this invoice.' 
        });
      } else if (error.response?.status === 404) {
        Swal.fire({ 
          icon: 'error', 
          title: 'Not Found', 
          text: 'Invoice data not found for this estimate.' 
        });
      } else {
        Swal.fire({ 
          icon: 'error', 
          title: 'Download Failed', 
          text: 'Failed to download invoice. Please try again.' 
        });
      }
    } finally {
      setDownloadingInvoices(prev => ({ ...prev, [estimate_number]: false }));
    }
  }, [customerId]);

  // ============================================================
  // Columns Definition
  // ============================================================
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
      width: 120,
      Cell: ({ row }) => {
        const estimateNumber = row.original.estimate_number;
        
        // ============================================================
        // KEY FIX: Check pdf_generated from database (0 or 1)
        // Only show download if pdf_generated === 1 AND status is Ordered
        // ============================================================
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
            ) : pdfGenerated && isOrdered ? (
              <FaDownload 
                style={{ cursor: 'pointer', color: '#a36e29', fontSize: '16px' }} 
                onClick={() => handleDownloadInvoice(estimateNumber)} 
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
                    <tr><td>Order Date</td><td>{repairDetails.uniqueData?.order_date ? formatDate(repairDetails.uniqueData.order_date) : <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>}</td></tr>
                    <tr><td>Status</td><td><span className="badge px-3 py-2" style={{ backgroundColor: repairDetails.uniqueData?.estimate_status === 'Ordered' ? '#17a2b8' : repairDetails.uniqueData?.estimate_status === 'Rejected' ? '#dc3545' : '#ffc107', color: 'white', fontSize: '0.9em' }}>{repairDetails.uniqueData?.estimate_status ?? 'Pending'}</span></td></tr>
                    <tr><td>Total Amount</td><td>{repairDetails.uniqueData?.total_amount || repairDetails.uniqueData?.net_amount}</td></tr>
                  </tbody>
                </Table>
                <h5 className="mt-4 mb-3">Products</h5>
                <div className="table-responsive">
                  <Table bordered>
                    <thead style={{ whiteSpace: 'nowrap' }}><tr><th>BarCode</th><th>Product Name</th><th>Metal Type</th><th>Purity</th><th>Gross Wt</th><th>Stone Wt</th><th>W.Wt</th><th>Total Wt</th><th>MC</th><th>Rate</th><th>Tax Amt</th><th>Total Price</th></tr></thead>
                    <tbody style={{ whiteSpace: 'nowrap' }}>
                      {repairDetails.repeatedData?.map((product, index) => (
                        <tr key={index}><td>{product.code}</td><td>{product.product_name}</td><td>{product.metal_type}</td><td>{product.purity}</td><td>{product.gross_weight}</td><td>{product.stone_weight}</td><td>{product.wastage_weight}</td><td>{product.total_weight_av}</td><td>{product.making_charges}</td><td>{product.rate}</td><td>{product.tax_amt}</td><td>{product.total_price}</td></tr>
                      ))}
                      <tr style={{ fontWeight: "bold" }}><td colSpan="11" className="text-end">Total Amount</td><td>{repairDetails.uniqueData?.total_amount || repairDetails.uniqueData?.net_amount}</td></tr>
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