import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { Button, Row, Col, Modal, Table } from 'react-bootstrap';
import baseURL from "../../ApiUrl/NodeBaseURL";
import SalesPersonNavbar from '../../../Pages/Navbar/SalesNavbar';
import './EstimateTable.css';

// ---------------------------------------------------------------------------
// Date validation helper (see LeaveManagement.js for the full rationale).
// Native <input type="date"> always reports "YYYY-MM-DD", but some browsers
// still allow a user to type more than 4 digits into the year segment or
// leave the value malformed. We validate strictly before ever using the
// value, and constrain the native picker with min/max as a first line of
// defense.
// ---------------------------------------------------------------------------
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
export const MIN_DATE_ATTR = `${MIN_YEAR}-01-01`;
export const MAX_DATE_ATTR = `${MAX_YEAR}-12-31`;

export const isValidDateString = (value) => {
  if (!value) return true; // empty/optional is fine

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < MIN_YEAR || year > MAX_YEAR) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }

  return true;
};

// Global Search Filter Component
function GlobalFilter({ globalFilter, setGlobalFilter, handleDateFilter }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromDateError, setFromDateError] = useState('');
  const [toDateError, setToDateError] = useState('');

  // Update freely as the user types/picks — a native date input reports an
  // intermediate value on every keystroke (e.g. while typing the year one
  // digit at a time), so we must NOT validate here or we'd flag perfectly
  // normal in-progress input as "invalid". Just store whatever the browser
  // gives us; validation only happens once the user is done (on blur / on
  // Apply), and it's silent — no popup, just a subtle inline hint.
  const handleFromDateChange = (e) => {
    setFromDate(e.target.value);
    if (fromDateError) setFromDateError('');
  };

  const handleToDateChange = (e) => {
    setToDate(e.target.value);
    if (toDateError) setToDateError('');
  };

  const handleFromDateBlur = () => {
    setFromDateError(fromDate && !isValidDateString(fromDate) ? 'Enter a valid date.' : '');
  };

  const handleToDateBlur = () => {
    setToDateError(toDate && !isValidDateString(toDate) ? 'Enter a valid date.' : '');
  };

  const applyDateFilter = () => {
    // Silently ignore any bound that isn't a complete, valid date rather
    // than blocking the user with a popup — treat it as "not set".
    const safeFrom = isValidDateString(fromDate) ? fromDate : '';
    const safeTo = isValidDateString(toDate) ? toDate : '';
    setFromDateError(fromDate && !safeFrom ? 'Enter a valid date.' : '');
    setToDateError(toDate && !safeTo ? 'Enter a valid date.' : '');

    if (safeFrom && safeTo && new Date(safeFrom) > new Date(safeTo)) {
      handleDateFilter(safeTo, safeFrom);
      return;
    }
    handleDateFilter(safeFrom, safeTo);
  };

  return (
    <div className="dataTable_search mb-3">
      <div className="dataTable_search_dates">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <input
            type="date"
            value={fromDate}
            min={MIN_DATE_ATTR}
            max={MAX_DATE_ATTR}
            onChange={handleFromDateChange}
            onBlur={handleFromDateBlur}
            className={`form-control${fromDateError ? ' is-invalid' : ''}`}
            style={{ maxWidth: '150px' }}
          />
          {fromDateError && (
            <small style={{ color: '#dc3545', fontSize: '11px' }}>{fromDateError}</small>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <input
            type="date"
            value={toDate}
            min={MIN_DATE_ATTR}
            max={MAX_DATE_ATTR}
            onChange={handleToDateChange}
            onBlur={handleToDateBlur}
            className={`form-control${toDateError ? ' is-invalid' : ''}`}
            style={{ maxWidth: '150px' }}
          />
          {toDateError && (
            <small style={{ color: '#dc3545', fontSize: '11px' }}>{toDateError}</small>
          )}
        </div>
      </div>
      <div className="dataTable_search_query">
        <input
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="form-control"
          placeholder="Search..."
          style={{ maxWidth: '200px' }}
        />
        <button onClick={applyDateFilter} className="btn btn-primary">
          OK
        </button>
      </div>
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
  const [salespersonId, setSalespersonId] = useState(null);
  const [salespersonName, setSalespersonName] = useState('');

  // Get current logged-in salesperson from localStorage
  useEffect(() => {
    const getCurrentSalesperson = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const salespersonId = parsedUser.id || parsedUser._id || parsedUser.userId;
          const salespersonName = parsedUser.full_name || parsedUser.name || parsedUser.username;
          const role = parsedUser.role;

          // Check if user is a salesperson
          if (role === 'salesman' || role === 'salesperson' || role === 'sales') {
            setSalespersonId(salespersonId);
            setSalespersonName(salespersonName);
            return { id: salespersonId, name: salespersonName };
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Access Denied',
              text: 'Only salespersons can view estimates',
            }).then(() => {
              navigate('/dashboard');
            });
            return null;
          }
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Authentication Required',
            text: 'Please login as a salesperson',
          }).then(() => {
            navigate('/login');
          });
          return null;
        }
      } catch (error) {
        console.error('Error getting salesperson data:', error);
        return null;
      }
    };

    const salesperson = getCurrentSalesperson();
    if (!salesperson) {
      setLoading(false);
    }
  }, [navigate]);

  // Filter estimates based on salesperson_id
  const filterEstimatesBySalespersonId = useCallback((estimates, salespersonId) => {
    if (!salespersonId || !estimates || !Array.isArray(estimates)) {
      return [];
    }

    // Filter estimates where salesperson_id matches the logged-in salesperson's ID
    const filtered = estimates.filter((estimate) => {
      const estimateSalespersonId = estimate.salesperson_id;

      // Handle different data types - convert both to string for comparison
      if (estimateSalespersonId === undefined || estimateSalespersonId === null) {
        return false;
      }

      return String(estimateSalespersonId) === String(salespersonId);
    });

    return filtered;
  }, []);

  const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    // Fetch all estimates from the existing API
    const response = await axios.get(`${baseURL}/get-unique-estimates`);

    const allEstimatesData = response.data || [];

    // Ensure all estimates have an estimate_status field
    const estimatesWithStatus = allEstimatesData.map(estimate => ({
      ...estimate,
      estimate_status: estimate.estimate_status || estimate.status || 'Pending'
    }));

    setAllEstimates(estimatesWithStatus);

    // If we have a salespersonId, filter the data
    if (salespersonId) {
      const salespersonEstimates = filterEstimatesBySalespersonId(estimatesWithStatus, salespersonId);
      setData(salespersonEstimates);
      setFilteredData(salespersonEstimates);

      // Optional: Show message if no estimates found for this salesperson
      if (salespersonEstimates.length === 0) {
        console.log(`No estimates found for salesperson ID: ${salespersonId}`);
      }
    } else {
      // If no salespersonId yet, set empty arrays
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
}, [salespersonId, filterEstimatesBySalespersonId]);


  useEffect(() => {
    if (salespersonId) {
      fetchData();
    }
  }, [salespersonId, fetchData]);

  // Re-filter data when salespersonId changes
  useEffect(() => {
    if (salespersonId && allEstimates.length > 0) {
      const salespersonEstimates = filterEstimatesBySalespersonId(allEstimates, salespersonId);
      setData(salespersonEstimates);
      setFilteredData(salespersonEstimates);
    }
  }, [salespersonId, allEstimates, filterEstimatesBySalespersonId]);

  // Handle date filter
  const handleDateFilter = useCallback((fromDate, toDate) => {
    // Silently treat an invalid bound as "not set" rather than alerting.
    fromDate = isValidDateString(fromDate) ? fromDate : '';
    toDate = isValidDateString(toDate) ? toDate : '';

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
    if (isNaN(d.getTime())) return '';
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
        // Check if the estimate belongs to the current salesperson
        const estimateToEdit = data.find(item => item.estimate_number === estimate_number);
        if (!estimateToEdit) {
          Swal.fire('Error', 'Estimate not found.', 'error');
          return;
        }

        // Verify ownership - only allow editing own estimates
        if (estimateToEdit.salesperson_id !== salespersonId) {
          Swal.fire('Error', 'You can only edit estimates created by you.', 'error');
          return;
        }

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
          salesperson_id: salespersonId,
          salesperson_name: salespersonName
        }));

        const updatedDetails = [...existingDetails, ...formattedDetails];
        localStorage.setItem('estimateDetails', JSON.stringify(updatedDetails));

        if (updatedDetails.length > 0 && updatedDetails[0].disscount_percentage) {
          localStorage.setItem('estimateDiscount', updatedDetails[0].disscount_percentage);
        }

        navigate('/salesperson-estimates', {
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
  }, [navigate, data, salespersonId, salespersonName]);

  const handleDelete = useCallback(async (estimateNumber) => {
    // Check if the estimate belongs to the current salesperson
    const estimateToDelete = data.find(item => item.estimate_number === estimateNumber);
    if (!estimateToDelete) {
      Swal.fire('Error', 'Estimate not found.', 'error');
      return;
    }

    // Verify ownership - only allow deleting own estimates
    if (estimateToDelete.salesperson_id !== salespersonId) {
      Swal.fire('Error', 'You can only delete estimates created by you.', 'error');
      return;
    }

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
        setAllEstimates(allEstimatesData);

        // Re-filter for current salesperson
        if (salespersonId) {
          const salespersonEstimates = filterEstimatesBySalespersonId(allEstimatesData, salespersonId);
          setData(salespersonEstimates);
          setFilteredData(salespersonEstimates);
        }

        Swal.fire('Deleted!', 'The estimate has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting estimate:', error.message);
        Swal.fire('Error!', 'Failed to delete the estimate.', 'error');
      }
    }
  }, [data, salespersonId, filterEstimatesBySalespersonId]);

  // Update the handleViewDetails function
  const handleViewDetails = useCallback(async (estimate_number) => {
    try {
      const response = await axios.get(`${baseURL}/get-estimates/${estimate_number}`);
      const details = response.data;

      // Fetch the latest estimate status from database
      const estimateResponse = await axios.get(`${baseURL}/get-unique-estimates`);
      const allEstimates = estimateResponse.data || [];

      // Find the specific estimate with this estimate_number
      const currentEstimate = allEstimates.find(
        est => est.estimate_number === estimate_number
      );

      // Update the repairDetails with the current status and order info
      if (currentEstimate) {
        if (details.uniqueData) {
          details.uniqueData.estimate_status = currentEstimate.estimate_status || currentEstimate.status || 'Pending';
          details.uniqueData.order_number = currentEstimate.order_number || details.uniqueData?.order_number;
          details.uniqueData.order_date = currentEstimate.order_date || details.uniqueData?.order_date;
        }
      }

      setRepairDetails(details);
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
    navigate('/salesperson-estimates');
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
        if (isNaN(date.getTime())) return 'N/A';
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
      Cell: ({ value, row }) => {
        const estimateStatus = row.original.estimate_status;

        if (estimateStatus === 'Accepted' || estimateStatus === 'Ordered') {
          return value ? (
            <strong style={{ color: '#17a2b8' }}>{value}</strong>
          ) : (
            <span className="text-muted" style={{ fontStyle: 'italic' }}>
              N/A
            </span>
          );
        }

        return (
          <span className="text-muted" style={{ fontStyle: 'italic' }}>
            N/A
          </span>
        );
      },
    },
    {
      Header: 'Customer Name',
      accessor: 'customer_name',
    },
    {
      Header: 'Status',
      accessor: 'estimate_status',
      Cell: ({ value }) => {
        // Get current status with fallback
        const currentStatus = value || 'Pending';

        // Define status colors and styles
        const getStatusStyle = (status) => {
          switch(status) {
            case 'Pending':
              return {
                backgroundColor: '#ffc107',
                color: '#212529',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'inline-block',
                minWidth: '90px',
                textAlign: 'center'
              };
            case 'Accepted':
            case 'Ordered':
              return {
                backgroundColor: '#28a745',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'inline-block',
                minWidth: '90px',
                textAlign: 'center'
              };
            case 'Rejected':
              return {
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'inline-block',
                minWidth: '90px',
                textAlign: 'center'
              };
            default:
              return {
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'inline-block',
                minWidth: '90px',
                textAlign: 'center'
              };
          }
        };

        return (
          <div style={{ minWidth: '120px' }}>
            <span style={getStatusStyle(currentStatus)}>
              {currentStatus}
            </span>
          </div>
        );
      },
      width: 150,
      disableSortBy: true,
    },
  ], [handleEdit, handleDelete, handleViewDetails, salespersonId]);

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
        <SalesPersonNavbar />
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your estimates...</p>
        </div>
      </>
    );
  }

  // Show message if user is not logged in as salesperson
  if (!salespersonId) {
    return (
      <>
        <SalesPersonNavbar />
        <div className="text-center py-5">
          <div className="alert alert-warning">
            Please login as a salesperson to view estimates
          </div>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </>
    );
  }

  // Show message if no estimates found for the salesperson
  if (tableData.length === 0) {
    return (
      <>
        <SalesPersonNavbar />
        <div className="main-container">
          <div className="estimates-table-container">
            <Row className="mb-3">
                <Col className="d-flex justify-content-between align-items-center selections-header-row">
                  <h3 style={{marginTop:"20px"}}>Your Selections</h3>
                  <Button
                    className="create_but"
                    onClick={handleCreate}
                    style={{ backgroundColor: '#a36e29', borderColor: '#a36e29', marginTop:"15px"}}
                  >
                    + Create
                  </Button>
                </Col>
              </Row>
            <div className="text-center py-5">
              <div className="alert alert-info">
                No estimates found for your account (Salesperson: {salespersonName}). Create your first estimate!
              </div>
              <Button
                className="create_but"
                onClick={handleCreate}
                style={{ backgroundColor: '#a36e29', borderColor: '#a36e29' }}
              >
                + Create New Estimate
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SalesPersonNavbar />
      <div className="main-container">
        <div className="estimates-table-container">
          {/* Header with Title and Create Button */}
          <Row className="mb-3">
            <Col className="d-flex justify-content-between align-items-center">
              <h3 style={{marginTop:"20px"}}>Your Selections</h3>
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
            <div className="pagination-row mt-3">
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
              <div className="page-size-wrapper">
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
                      <td>Order Number</td>
                      <td>
                        {repairDetails.uniqueData?.order_number ? (
                          <strong>{repairDetails.uniqueData.order_number}</strong>
                        ) : (
                          <span className="text-muted" style={{ fontStyle: 'italic' }}>
                            N/A
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Order Date</td>
                      <td>
                        {repairDetails.uniqueData?.order_date ? (
                          formatDate(repairDetails.uniqueData.order_date)
                        ) : (
                          <span className="text-muted" style={{ fontStyle: 'italic' }}>
                            N/A
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Status</td>
                      <td>
                        <span
                          className="badge px-3 py-2"
                          style={{
                            backgroundColor:
                              repairDetails.uniqueData?.estimate_status === 'Accepted' || repairDetails.uniqueData?.estimate_status === 'Ordered' ? '#28a745' :
                              repairDetails.uniqueData?.estimate_status === 'Rejected' ? '#dc3545' : '#ffc107',
                            color:
                              repairDetails.uniqueData?.estimate_status === 'Pending' ? '#212529' : 'white',
                            fontSize: '0.9em'
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