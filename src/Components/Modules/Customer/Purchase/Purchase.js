import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEye } from 'react-icons/fa';
import { Button, Row, Col, Modal, Table, Form } from 'react-bootstrap';
import baseURL from "../../ApiUrl/NodeBaseURL";
import CustomerNavbar from '../../../Pages/Navbar/CustomerNavbar';
import './Purchase.css';

// Global Search Filter Component
function GlobalFilter({ globalFilter, setGlobalFilter, handleDateFilter }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const applyDateFilter = () => {
    handleDateFilter(fromDate, toDate);
  };

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
      <button onClick={applyDateFilter} className="btn btn-primary">
        OK
      </button>
    </div>
  );
}

const Purchase = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [allEstimates, setAllEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [customerId, setCustomerId] = useState(null);

  // Get current logged-in user's customer_id
  useEffect(() => {
    const getCurrentUser = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const customerId = parsedUser.customer_id || parsedUser.id || parsedUser.userId || parsedUser.customerId;
          
          if (customerId) {
            setCustomerId(customerId);
            return customerId;
          } else {
            console.error('Customer ID not found in user data:', parsedUser);
            return null;
          }
        }
        
        console.warn('No user data found in localStorage.');
        return null;
      } catch (error) {
        console.error('Error getting user data:', error);
        return null;
      }
    };

    const userId = getCurrentUser();
    if (!userId) {
      Swal.fire({
        icon: 'warning',
        title: 'Authentication Required',
        text: 'Please login to view your purchases',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate('/login');
      });
    }
  }, [navigate]);

  // Filter estimates by customer ID and status = Ordered
  const filterPurchasesByCustomerId = useCallback((estimates, customerId) => {
    if (!customerId || !estimates || !Array.isArray(estimates)) {
      return [];
    }
    
    // Filter estimates where:
    // 1. customer_id matches the logged-in user's ID
    // 2. estimate_status is "Ordered"
    const filtered = estimates.filter((estimate) => {
      const estimateCustomerId = estimate.customer_id;
      
      if (estimateCustomerId === undefined || estimateCustomerId === null) {
        return false;
      }
      
      // Check if customer ID matches
      const customerMatches = String(estimateCustomerId) === String(customerId);
      
      // Check if status is Ordered
      let status = estimate.estimate_status || estimate.status;
      
      // Apply the same status logic as in EstimateTable
      if (!status) {
        if (estimate.source_by === "customer") {
          status = "Ordered";
        } else {
          status = "Pending";
        }
      }
      
      if (status === "Accepted") {
        status = "Ordered";
      }
      
      if (status === "Pending" && estimate.source_by === "customer") {
        status = "Ordered";
      }
      
      const statusMatches = status === "Ordered";
      
      return customerMatches && statusMatches;
    });
    
    return filtered;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/get-unique-estimates`);
      
      const allEstimatesData = response.data || [];
      
      // Process estimates with proper status
      const estimatesWithStatus = allEstimatesData.map(estimate => {
        let status = estimate.estimate_status || estimate.status;
        
        if (!status) {
          if (estimate.source_by === "customer") {
            status = "Ordered";
          } else {
            status = "Pending";
          }
        }
        
        if (status === "Accepted") {
          status = "Ordered";
        }
        
        if (status === "Pending" && estimate.source_by === "customer") {
          status = "Ordered";
        }
        
        return {
          ...estimate,
          estimate_status: status
        };
      });
      
      setAllEstimates(estimatesWithStatus);
      
      if (customerId) {
        const customerPurchases = filterPurchasesByCustomerId(estimatesWithStatus, customerId);
        setData(customerPurchases);
        setFilteredData(customerPurchases);
        
        if (customerPurchases.length === 0) {
          console.log(`No purchases found for customer ID: ${customerId}`);
        }
      } else {
        setData([]);
        setFilteredData([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching purchase details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load purchases',
      });
      setLoading(false);
    }
  }, [customerId, filterPurchasesByCustomerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-filter data when customerId changes
  useEffect(() => {
    if (customerId && allEstimates.length > 0) {
      const customerPurchases = filterPurchasesByCustomerId(allEstimates, customerId);
      setData(customerPurchases);
      setFilteredData(customerPurchases);
    }
  }, [customerId, allEstimates, filterPurchasesByCustomerId]);

  // Handle date filter
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

  const handleViewDetails = useCallback(async (estimate_number) => {
    try {
      const response = await axios.get(`${baseURL}/get-estimates/${estimate_number}`);
      const details = response.data;
      
      // Fetch the latest estimate status
      const estimateResponse = await axios.get(`${baseURL}/get-unique-estimates`);
      const allEstimates = estimateResponse.data || [];
      
      const currentEstimate = allEstimates.find(
        est => est.estimate_number === estimate_number
      );
      
      if (currentEstimate) {
        let status = currentEstimate.estimate_status || currentEstimate.status;
        
        if (!status) {
          if (currentEstimate.source_by === "customer") {
            status = "Ordered";
          } else {
            status = "Pending";
          }
        }
        
        if (status === "Accepted") {
          status = "Ordered";
        }
        
        if (status === "Pending" && currentEstimate.source_by === "customer") {
          status = "Ordered";
        }
        
        if (details.uniqueData) {
          details.uniqueData.estimate_status = status;
          details.uniqueData.order_number = currentEstimate.order_number || details.uniqueData?.order_number;
          details.uniqueData.order_date = currentEstimate.order_date || details.uniqueData?.order_date;
        }
      }
      
      setPurchaseDetails(details);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching purchase details:', error);
      Swal.fire('Error', 'Unable to fetch purchase details.', 'error');
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setPurchaseDetails(null);
  }, []);

  // Define columns for purchases
  const columns = useMemo(() => [
    {
      Header: 'Sr. No.',
      Cell: ({ row }) => row.index + 1,
      width: 80,
      disableSortBy: true,
    },
    {
      Header: 'Date',
      accessor: 'date',
      Cell: ({ value }) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      },
    },
    {
      Header: 'Estimate Number',
      accessor: 'estimate_number',
    },
    {
      Header: 'Order Number',
      accessor: 'order_number',
      Cell: ({ value }) => {
        return value ? (
          <strong style={{ color: '#17a2b8' }}>{value}</strong>
        ) : (
          <span className="text-muted" style={{ fontStyle: 'italic' }}>
            N/A
          </span>
        );
      },
    },
    {
      Header: 'Order Date',
      accessor: 'order_date',
      Cell: ({ value }) => {
        if (!value) return <span className="text-muted" style={{ fontStyle: 'italic' }}>N/A</span>;
        const date = new Date(value);
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      },
    },
    {
      Header: 'Total Amount',
      accessor: 'net_amount',
      Cell: ({ value }) => `₹${parseFloat(value || 0).toFixed(2)}`,
    },
    {
      Header: 'Status',
      accessor: 'estimate_status',
      Cell: ({ value }) => {
        return (
          <span 
            className="badge px-3 py-2"
            style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              fontSize: '0.9em',
              fontWeight: 'bold'
            }}
          >
            {value || 'Ordered'}
          </span>
        );
      },
      width: 100,
    },
    {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }) => {
        return (
          <div style={{ display: 'flex', gap: '10px' }}>
            <FaEye
              style={{ cursor: 'pointer', color: '#17a2b8' }}
              onClick={() => handleViewDetails(row.original.estimate_number)}
              title="View Purchase Details"
              size={18}
            />
          </div>
        );
      },
      width: 80,
      disableSortBy: true,
    },
  ], [handleViewDetails]);

  // Memoize table data
  const tableData = useMemo(() => [...filteredData].reverse(), [filteredData]);

  // React Table instance
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
    {
      columns,
      data: tableData,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  // Show loading state
  if (loading) {
    return (
      <>
        <CustomerNavbar />
        <div className="purchase-container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading your purchases...</p>
          </div>
        </div>
      </>
    );
  }

  // Show message if user is not logged in
  if (!customerId) {
    return (
      <>
        <CustomerNavbar />
        <div className="purchase-container">
          <div className="text-center py-5">
            <div className="alert alert-warning">
              Please login to view your purchases
            </div>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Calculate summary statistics
  const totalPurchaseAmount = tableData.reduce((sum, item) => {
    return sum + parseFloat(item.net_amount || 0);
  }, 0);

  return (
    <>
      <CustomerNavbar />
      <div className="purchase-container">
        <div className="purchase-table-container">
          {/* Header with Title */}
          <Row className="mb-3">
            <Col className="d-flex justify-content-between align-items-center">
              <h3>Your Purchases</h3>
            </Col>
          </Row>

          {/* Only show content if not loading and customerId exists */}
          {!loading && customerId ? (
            <>
              {/* Summary Cards */}
              {tableData.length > 0 && (
                <div className="purchase-summary mb-4">
                  <Row>
                    <Col md={4}>
                      <div className="summary-card">
                        <div className="summary-icon">
                          <FaEye />
                        </div>
                        <div className="summary-details">
                          <span className="summary-label">Total Purchases</span>
                          <span className="summary-value">{tableData.length}</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="summary-card">
                        <div className="summary-icon" style={{ backgroundColor: '#17a2b820', color: '#17a2b8' }}>
                          ₹
                        </div>
                        <div className="summary-details">
                          <span className="summary-label">Total Amount</span>
                          <span className="summary-value">₹{totalPurchaseAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="summary-card">
                        <div className="summary-icon" style={{ backgroundColor: '#28a74520', color: '#28a745' }}>
                          ✓
                        </div>
                        <div className="summary-details">
                          <span className="summary-label">Completed</span>
                          <span className="summary-value">{tableData.length}</span>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Show message if no data */}
              {tableData.length === 0 ? (
                <div className="text-center py-5">
                  <div className="alert alert-info">
                    No purchases found for your account.
                  </div>
                </div>
              ) : (
                <>
                  {/* Global Search Filter */}
                  <GlobalFilter 
                    globalFilter={globalFilter} 
                    setGlobalFilter={setGlobalFilter} 
                    handleDateFilter={handleDateFilter} 
                  />

                  {/* Table */}
                  <div className="dataTable_wrapper container-fluid">
                    <div className="table-responsive">
                      <table {...getTableProps()} className="table table-striped table-hover">
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
                                {row.cells.map((cell) => {
                                  return (
                                    <td {...cell.getCellProps()} className="dataTable_cell">
                                      {cell.render('Cell')}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="d-flex align-items-center justify-content-between mt-3">
                      <div className="dataTable_pageInfo">
                        Page{' '}
                        <strong>
                          {pageIndex + 1} of {pageOptions.length}
                        </strong>
                        {' '}(Showing {tableData.length} total records)
                      </div>
                      <div className="pagebuttons">
                        <button
                          className="btn btn-primary me-2 btn1"
                          onClick={() => previousPage()}
                          disabled={!canPreviousPage}
                        >
                          Prev
                        </button>
                        <button
                          className="btn btn-primary btn1"
                          onClick={() => nextPage()}
                          disabled={!canNextPage}
                        >
                          Next
                        </button>
                      </div>
                      <div>
                        <select
                          className="form-select form-select-sm"
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                        >
                          {[5, 10, 20, 50].map((size) => (
                            <option key={size} value={size}>
                              Show {size}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading your purchases...</p>
            </div>
          )}
        </div>

        {/* Modal for View Details */}
        <Modal show={showModal} onHide={handleCloseModal} size="xl" className="m-auto">
          <Modal.Header closeButton>
            <Modal.Title>Purchase Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {purchaseDetails && (
              <>
                <Table bordered className="purchase-details-table">
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Date</td>
                      <td>{formatDate(purchaseDetails.uniqueData?.date)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Estimate Number</td>
                      <td>{purchaseDetails.uniqueData?.estimate_number}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Order Number</td>
                      <td>
                        {purchaseDetails.uniqueData?.order_number ? (
                          <strong style={{ color: '#17a2b8' }}>{purchaseDetails.uniqueData.order_number}</strong>
                        ) : (
                          <span className="text-muted" style={{ fontStyle: 'italic' }}>
                            N/A
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Order Date</td>
                      <td>
                        {purchaseDetails.uniqueData?.order_date ? (
                          formatDate(purchaseDetails.uniqueData.order_date)
                        ) : (
                          <span className="text-muted" style={{ fontStyle: 'italic' }}>
                            N/A
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Status</td>
                      <td>
                        <span 
                          className="badge px-3 py-2"
                          style={{
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            fontSize: '0.9em'
                          }}
                        >
                          {purchaseDetails.uniqueData?.estimate_status ?? 'Ordered'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>Total Amount</td>
                      <td>₹{parseFloat(purchaseDetails.uniqueData?.total_amount || purchaseDetails.uniqueData?.net_amount || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </Table>

                <h5 className="mt-4 mb-3">Products Purchased</h5>

                <div className="table-responsive">
                  <Table bordered className="purchase-products-table">
                    <thead style={{ whiteSpace: 'nowrap', backgroundColor: '#f8f9fa' }}>
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
                      {purchaseDetails.repeatedData?.map((product, index) => (
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
                          <td>₹{parseFloat(product.tax_amt || 0).toFixed(2)}</td>
                          <td>₹{parseFloat(product.total_price || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: "bold", backgroundColor: '#e9ecef' }}>
                        <td colSpan="11" className="text-end">
                          Total Amount
                        </td>
                        <td>₹{parseFloat(purchaseDetails.uniqueData?.total_amount || purchaseDetails.uniqueData?.net_amount || 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default Purchase;