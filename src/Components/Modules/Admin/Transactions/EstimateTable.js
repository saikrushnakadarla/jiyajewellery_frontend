import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { Button, Row, Col, Modal, Table, Form } from 'react-bootstrap';
import baseURL from "../../ApiUrl/NodeBaseURL";
import Navbar from '../../../Pages/Navbar/Navbar';
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
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [repairDetails, setRepairDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({}); // Track status updates

  // Status options
const statusOptions = [
  { value: 'Pending', label: 'Pending', color: '#ffc107' },
  { value: 'Accepted', label: 'Accepted', color: '#28a745' },
  { value: 'Rejected', label: 'Rejected', color: '#dc3545' }
];

const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    const response = await axios.get(`${baseURL}/get-unique-estimates`);
    
    const allEstimatesData = response.data || [];
    
    // Ensure all estimates have an estimate_status field
    const estimatesWithStatus = allEstimatesData.map(estimate => ({
      ...estimate,
      estimate_status: estimate.estimate_status || estimate.status || 'Pending'
    }));
    
    console.log('Fetched estimates with status:', estimatesWithStatus);
    
    setData(estimatesWithStatus);
    setFilteredData(estimatesWithStatus);
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
}, []);


  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // Handle status change
// Replace your existing handleStatusChange function with this updated version
const handleStatusChange = async (rowData, newStatus) => {
  try {
    console.log('handleStatusChange called with row data:', rowData);
    console.log('New status:', newStatus);
    
    // Extract identifier from rowData - use estimate_number as primary
    const identifier = rowData.estimate_number || rowData.estimate_id || rowData.id;
    
    if (!identifier) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Could not identify the estimate.',
      });
      return;
    }

    console.log('Using identifier:', identifier);
    
    // Show loading state using estimate_number as key
    const loadingKey = rowData.estimate_number || identifier;
    setUpdatingStatus(prev => ({ ...prev, [loadingKey]: true }));

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
      const loadingKey = rowData.estimate_number || rowData.estimate_id || rowData.id;
      if (loadingKey) {
        setUpdatingStatus(prev => ({ ...prev, [loadingKey]: false }));
      }
    }, 500);
  }
};


  // Handle date filter
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
        const refreshedData = refreshResponse.data || [];
        setData(refreshedData);
        setFilteredData(refreshedData);
        
        Swal.fire('Deleted!', 'The estimate has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting estimate:', error.message);
        Swal.fire('Error!', 'Failed to delete the estimate.', 'error');
      }
    }
  }, []);

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
    navigate('/estimates');
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
      Header: 'Customer Name',
      accessor: 'customer_name',
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
    
    // Create loading key - prefer estimate_number
    const loadingKey = estimate.estimate_number || estimate.id || estimate.estimate_id || estimate._id;
    const isUpdating = loadingKey ? updatingStatus[loadingKey] : false;
    
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
      <Navbar />
      <div className="main-container">
        <div className="estimates-table-container">
          {/* Header with Title and Create Button */}
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

            {/* Pagination Controls */}
            <div className="d-flex align-items-center justify-content-between mt-3">
              <div className="dataTable_pageInfo">
                Page{' '}
                <strong>
                  {pageIndex + 1} of {pageOptions.length}
                </strong>
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
                  {[5, 10, 20].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
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