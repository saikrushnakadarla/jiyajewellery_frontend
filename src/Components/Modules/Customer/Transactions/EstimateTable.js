import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { Button, Row, Col, Modal, Table, Form } from 'react-bootstrap';
import baseURL from "../../ApiUrl/NodeBaseURL";
import CustomerNavbar from '../../../Pages/Navbar/CustomerNavbar';
import './EstimateTable.css';

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

const EstimateTable = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [allEstimates, setAllEstimates] = useState([]); // Store all fetched estimates
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [repairDetails, setRepairDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({}); // Track status updates



      // Status options
const statusOptions = [
  { value: 'Pending', label: 'Pending', color: '#ffc107' },
  { value: 'Accepted', label: 'Accepted', color: '#28a745' },
  { value: 'Rejected', label: 'Rejected', color: '#dc3545' }
];

  // Get current logged-in user's customer_id
  useEffect(() => {
    const getCurrentUser = () => {
      try {
        // Check if user data is stored in localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          // Try different possible field names for customer ID
          const customerId = parsedUser.customer_id || parsedUser.id || parsedUser.userId || parsedUser.customerId;
          
          if (customerId) {
            setCustomerId(customerId);
            return customerId;
          } else {
            console.error('Customer ID not found in user data:', parsedUser);
            return null;
          }
        }
        
        console.warn('No user data found in localStorage. Please check your authentication flow.');
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
        text: 'Please login to view your estimates',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate('/login'); // Redirect to login page
      });
    }
  }, [navigate]);

  // Filter estimates based on customer_id
  const filterEstimatesByCustomerId = useCallback((estimates, customerId) => {
    if (!customerId || !estimates || !Array.isArray(estimates)) {
      return [];
    }
    
    // Filter estimates where customer_id matches the logged-in user's ID
    const filtered = estimates.filter((estimate) => {
      const estimateCustomerId = estimate.customer_id;
      
      if (estimateCustomerId === undefined || estimateCustomerId === null) {
        return false;
      }
      
      return String(estimateCustomerId) === String(customerId);
    });
    
    return filtered;
  }, []);

  

  const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    // Fetch all estimates from the existing API
    const response = await axios.get(`${baseURL}/get-unique-estimates`);
    
    const allEstimatesData = response.data || [];
    
    // Log the structure of the data to understand field names
    if (allEstimatesData.length > 0) {
      console.log('=== ESTIMATE DATA STRUCTURE ===');
      console.log('First estimate data structure:', allEstimatesData[0]);
      console.log('Available fields:', Object.keys(allEstimatesData[0]));
      
      // Check what ID fields exist
      const firstEstimate = allEstimatesData[0];
      console.log('ID fields check:');
      console.log('estimate_id:', firstEstimate.estimate_id);
      console.log('id:', firstEstimate.id);
      console.log('estimate_number:', firstEstimate.estimate_number);
      console.log('_id:', firstEstimate._id);
      
      // Also log the type of estimate_id
      console.log('estimate_id type:', typeof firstEstimate.estimate_id);
      console.log('estimate_id value as string:', String(firstEstimate.estimate_id));
      console.log('=== END DATA STRUCTURE ===');
    }
    
    // Ensure all estimates have an estimate_status field, default to "Pending"
   // Ensure all estimates have an estimate_status field, default to "Pending"
const estimatesWithStatus = allEstimatesData.map(estimate => ({
  ...estimate,
  estimate_status: estimate.estimate_status || estimate.status || 'Pending'  // ← Fixed
}));
    
    setAllEstimates(estimatesWithStatus);
    
    // If we have a customerId, filter the data
    if (customerId) {
      const customerEstimates = filterEstimatesByCustomerId(estimatesWithStatus, customerId);
      console.log('Filtered customer estimates:', customerEstimates);
      setData(customerEstimates);
      setFilteredData(customerEstimates);
      
      if (customerEstimates.length === 0) {
        console.log(`No estimates found for customer ID: ${customerId}`);
      }
    } else {
      setData([]);
      setFilteredData([]);
    }
    
    setLoading(false);
  } catch (error) {
    console.error('Error fetching estimate details:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load estimates',
    });
    setLoading(false);
  }
}, [customerId, filterEstimatesByCustomerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-filter data when customerId changes
  useEffect(() => {
    if (customerId && allEstimates.length > 0) {
      const customerEstimates = filterEstimatesByCustomerId(allEstimates, customerId);
      setData(customerEstimates);
      setFilteredData(customerEstimates);
    }
  }, [customerId, allEstimates, filterEstimatesByCustomerId]);

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

  // Handle status change - FIXED VERSION
// Replace your existing handleStatusChange function with this updated version
const handleStatusChange = async (rowData, newStatus) => {
  try {
    console.log('handleStatusChange called with row data:', rowData);
    console.log('New status:', newStatus);
    
    // Extract identifier from rowData
    const identifier = rowData.estimate_id || rowData.id || rowData.estimate_number;
    
    if (!identifier) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Could not identify the estimate.',
      });
      return;
    }

    console.log('Using identifier:', identifier);
    
    // Show loading state
    setUpdatingStatus(prev => ({ ...prev, [identifier]: true }));

    // Call the status update endpoint
    const response = await axios.put(
      `${baseURL}/update-estimate-status/${identifier}`, 
      { estimate_status: newStatus },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Update response:', response.data);

    if (response.data && response.data.success) {
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Estimate status updated to "${newStatus}" successfully!`,
        timer: 2000,
        showConfirmButton: false
      });
      
      // REFRESH DATA FROM SERVER - This is the key fix
      setTimeout(() => {
        fetchData(); // Call your existing fetchData function to refresh from server
      }, 500);
      
    } else {
      throw new Error('Failed to update status');
    }
  } catch (error) {
    console.error('Error updating estimate status:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      text: error.response?.data?.message || 'Failed to update estimate status. Please try again.',
    });
  } finally {
    // Remove loading state after a delay
    setTimeout(() => {
      const identifier = rowData.estimate_id || rowData.id || rowData.estimate_number;
      if (identifier) {
        setUpdatingStatus(prev => ({ ...prev, [identifier]: false }));
      }
    }, 500);
  }
};



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
          state: {
            estimate_number,
            mobile,
            entries: details,
          },
        });
      } catch (error) {
        console.error('Error fetching estimate details:', error);
        Swal.fire('Error', 'Unable to fetch estimate details. Please try again.', 'error');
      }
    }
  }, [navigate]);

  const handleDelete = useCallback(async (estimateNumber) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to delete estimate ${estimateNumber}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${baseURL}/delete/estimate/${estimateNumber}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete estimate');
        }
        
        // Refresh data after delete
        const refreshResponse = await axios.get(`${baseURL}/get-unique-estimates`);
        const allEstimatesData = refreshResponse.data || [];
        const estimatesWithStatus = allEstimatesData.map(estimate => ({
          ...estimate,
          estimate_status: estimate.estimate_status ?? estimate.status ?? null

        }));
        
        setAllEstimates(estimatesWithStatus);
        
        // Re-filter for current customer
        if (customerId) {
          const customerEstimates = filterEstimatesByCustomerId(estimatesWithStatus, customerId);
          setData(customerEstimates);
          setFilteredData(customerEstimates);
        }
        
        Swal.fire('Deleted!', 'The estimate has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting estimate:', error.message);
        Swal.fire('Error!', 'Failed to delete the estimate.', 'error');
      }
    }
  }, [customerId, filterEstimatesByCustomerId]);

  const handleViewDetails = useCallback(async (estimate_number) => {
    try {
      const response = await axios.get(`${baseURL}/get-estimates/${estimate_number}`);
      setRepairDetails(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching estimate details:', error);
      Swal.fire('Error', 'Unable to fetch estimate details.', 'error');
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setRepairDetails(null);
  }, []);

  const handleCreate = useCallback(() => {
    navigate('/customer-estimates');
  }, [navigate]);


  // Define columns separately to avoid dependency issues
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
      Header: 'Product Name',
      accessor: 'product_name', 
    },
    {
      Header: 'Total Amount',
      accessor: 'net_amount',
      Cell: ({ value }) => parseFloat(value || 0).toFixed(2),
    },

{
  Header: 'Status',
  accessor: 'estimate_status',
  Cell: ({ row, value }) => {
    const estimate = row.original;
    
    // Create a unique key for loading state
    const loadingKey = estimate.estimate_number || `row-${row.index}`;
    const isUpdating = updatingStatus[loadingKey];
    
    const getStatusColor = (status) => {
      switch(status) {
        case 'Pending': return '#ffc107';
        case 'Accepted': return '#28a745';
        case 'Rejected': return '#dc3545';
        default: return '#6c757d';
      }
    };
    
    // Get current status with fallback
    const currentStatus = value || 'Pending';

    return (
      <div style={{ minWidth: '120px' }}>
        {isUpdating ? (
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>Updating...</span>
          </div>
        ) : (
          <Form.Select
            value={currentStatus}
            onChange={(e) => handleStatusChange(estimate, e.target.value)}
            style={{
              backgroundColor: getStatusColor(currentStatus),
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              minWidth: '120px'
            }}
            disabled={isUpdating}
          >
            {statusOptions.map(option => (
              <option 
                key={option.value} 
                value={option.value}
                style={{ backgroundColor: option.color, color: 'white' }}
              >
                {option.label}
              </option>
            ))}
          </Form.Select>
        )}
      </div>
    );
  },
  width: 150,
  disableSortBy: true,
},
   
    {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }) => {
        const estimateStatus = row.original.estimate_status;
        const estimate = row.original;
        const estimateId = estimate.id || estimate.estimate_id || estimate._id;
        
        return (
          <div style={{ display: 'flex', gap: '10px' }}>
            <FaEye
              style={{ cursor: 'pointer', color: 'green' }}
              onClick={() => handleViewDetails(row.original.estimate_number)}
              title="View Details"
            />
            {estimateStatus === 'Pending' && (
              <>
                <FaEdit
                  style={{ cursor: 'pointer', color: 'blue' }}
                  onClick={() => handleEdit(row.original.estimate_number, row.original.mobile)}
                  title="Edit"
                />
                <FaTrash
                  style={{ cursor: 'pointer', color: 'red' }}
                  onClick={() => handleDelete(row.original.estimate_number)}
                  title="Delete"
                />
              </>
            )}
          </div>
        );
      },
      width: 120,
      disableSortBy: true,
    },
  ], [handleEdit, handleDelete, handleViewDetails, updatingStatus]);

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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading your estimates...</p>
      </div>
    </>
  );
}


  // Show message if user is not logged in
  if (!customerId) {
    return (
      <>
        <CustomerNavbar />
        <div className="text-center py-5">
          <div className="alert alert-warning">
            Please login to view your estimates
          </div>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </>
    );
  }

 

  // Calculate status counts
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
        {/* Header with Title and Create Button */}
        <Row className="mb-3">
          <Col className="d-flex justify-content-between align-items-center">
            <h3>Your Estimates</h3>
          </Col>
        </Row>

        {/* Only show content if not loading and customerId exists */}
        {!loading && customerId ? (
          <>
            {/* Only show status summary if there's data */}
            {!loading && tableData.length > 0 && (
              <div className="status-summary mb-3">
                <Row>
                  <Col md={12}>
                    <div className="d-flex flex-wrap gap-2">
                      {statusOptions.map(option => (
                        <div 
                          key={option.value} 
                          className="d-flex align-items-center px-3 py-2 rounded"
                          style={{ 
                            backgroundColor: option.color + '20',
                            borderLeft: `4px solid ${option.color}`
                          }}
                        >
                          <span className="fw-bold me-2" style={{ color: option.color }}>
                            {statusCounts[option.value] || 0}
                          </span>
                          <span style={{ color: '#495057' }}>{option.label}</span>
                        </div>
                      ))}
                      <div 
                        className="d-flex align-items-center px-3 py-2 rounded"
                        style={{ 
                          backgroundColor: '#6c757d20',
                          borderLeft: '4px solid #6c757d'
                        }}
                      >
                        <span className="fw-bold me-2" style={{ color: '#6c757d' }}>
                          {tableData.length}
                        </span>
                        <span style={{ color: '#495057' }}>Total</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {/* Show message if no data after loading */}
            {!loading && tableData.length === 0 ? (
              <div className="text-center py-5">
                <div className="alert alert-info">
                  No estimates found for your account. Please contact sales for estimates.
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
                          const estimateStatus = row.original.estimate_status;
                          
                          return (
                            <tr {...row.getRowProps()} className="dataTable_row">
                              {row.cells.map((cell) => {
                                // Add background color based on status
                                const cellProps = cell.getCellProps();
                                if (cell.column.id === 'estimate_status') {
                                  let bgColor = '';
                                  switch(estimateStatus) {
                                    case 'Pending': bgColor = '#fff3cd'; break;
                                    case 'Accepted': bgColor = '#d4edda'; break;
                                    case 'Rejected': bgColor = '#f8d7da'; break;
                                    default: bgColor = '';
                                  }
                                  
                                  return (
                                    <td 
                                      {...cellProps} 
                                      className="dataTable_cell"
                                      style={{ backgroundColor: bgColor }}
                                    >
                                      {cell.render('Cell')}
                                    </td>
                                  );
                                }
                                
                                return (
                                  <td {...cellProps} className="dataTable_cell">
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
          // Show loading inside the container (for cases where customerId exists but still loading)
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading your estimates...</p>
          </div>
        )}
      </div>

      {/* Modal for View Details */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl" className="m-auto">
        <Modal.Header closeButton>
          <Modal.Title>Estimate Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {repairDetails && (
            <>
              <Table bordered>
                <tbody>
                  <tr>
                    <td>Date</td>
                    <td>{formatDate(repairDetails.uniqueData?.date)}</td>
                  </tr>
                  <tr>
                    <td>Estimate Number</td>
                    <td>{repairDetails.uniqueData?.estimate_number}</td>
                  </tr>
                  <tr>
                    <td>Customer ID</td>
                    <td>{repairDetails.uniqueData?.customer_id || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Status</td>
                    <td>
                      <span 
                        className="badge px-3 py-2"
                        style={{
                          backgroundColor: 
                            repairDetails.uniqueData?.estimate_status === 'Accepted' ? '#28a745' :
                            repairDetails.uniqueData?.estimate_status === 'Rejected' ? '#dc3545' : '#ffc107',
                          color: 'white',
                          fontSize: '0.9em'
                        }}
                      >
                        {repairDetails.uniqueData?.estimate_status ?? 'Pending'}
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
                    <tr style={{ fontWeight: "bold" }}>
                      <td colSpan="11" className="text-end">
                        Total Amount
                      </td>
                      <td>{repairDetails.uniqueData?.total_amount || repairDetails.uniqueData?.net_amount}</td>
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

export default EstimateTable;