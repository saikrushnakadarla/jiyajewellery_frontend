import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { Button, Row, Col, Modal, Table } from 'react-bootstrap';
import baseURL from "../../ApiUrl/NodeBaseURL";
import SalesPersonNavbar from '../../../Pages/Navbar/SalesNavbar';
import './LeaveManagement.css';

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
        placeholder="mm/dd/yyyy"
      />
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="form-control"
        style={{ maxWidth: '150px' }}
        placeholder="mm/dd/yyyy"
      />
      <button onClick={applyDateFilter} className="btn btn-primary">
        OK
      </button>
    </div>
  );
}

const LeaveManagement = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salespersonId, setSalespersonId] = useState(null);
  const [salespersonName, setSalespersonName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get current logged-in salesperson from localStorage
  useEffect(() => {
    const getCurrentSalesperson = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const salespersonId = parsedUser.id || parsedUser._id || parsedUser.userId;
          const salespersonName = parsedUser.full_name || parsedUser.name || parsedUser.username;
          
          setSalespersonId(salespersonId);
          setSalespersonName(salespersonName);
          return salespersonId;
        }
        return null;
      } catch (error) {
        console.error('Error getting salesperson data:', error);
        return null;
      }
    };

    getCurrentSalesperson();
  }, []);

  const fetchLeaveData = useCallback(async (showLoading = true) => {
    if (!salespersonId) return;
    
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const response = await axios.get(`${baseURL}/api/leave-requests/${salespersonId}`);
      
      if (response.data && Array.isArray(response.data)) {
        setData(response.data);
        setFilteredData(response.data);
      } else {
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      // Only show error if it's the initial load
      if (showLoading) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch leave requests. Please try again.'
        });
      }
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [salespersonId]);

  useEffect(() => {
    if (salespersonId) {
      fetchLeaveData();
    }
  }, [salespersonId, fetchLeaveData]);

  // Auto-refresh data every 30 seconds to check for status updates
  useEffect(() => {
    if (!salespersonId) return;
    
    const intervalId = setInterval(() => {
      fetchLeaveData(false); // Silent refresh
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId);
  }, [salespersonId, fetchLeaveData]);

  // Handle date filter
  const handleDateFilter = useCallback((fromDate, toDate) => {
    if (fromDate || toDate) {
      const filtered = data.filter((item) => {
        if (!item.start_date) return false;
        
        const itemDate = new Date(item.start_date).setHours(0, 0, 0, 0);
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

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Pending': { backgroundColor: '#ffc107', color: '#212529' },
      'Approved': { backgroundColor: '#28a745', color: 'white' },
      'Rejected': { backgroundColor: '#dc3545', color: 'white' }
    };
    
    const style = statusStyles[status] || { backgroundColor: '#6c757d', color: 'white' };
    
    return (
      <span style={{
        ...style,
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '600',
        display: 'inline-block',
        minWidth: '90px',
        textAlign: 'center'
      }}>
        {status}
      </span>
    );
  };

  const handleView = (leave) => {
    setSelectedLeave(leave);
    setShowModal(true);
  };

  const handleEdit = (leave) => {
    navigate('/add-leave-request', { state: { leaveData: leave, isEditing: true } });
  };

  const handleDelete = async (leaveId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this leave request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${baseURL}/api/leave-request/${leaveId}`);
        Swal.fire('Deleted!', 'Leave request has been deleted.', 'success');
        fetchLeaveData();
      } catch (error) {
        console.error('Error deleting leave request:', error);
        Swal.fire('Error!', error.response?.data?.message || 'Failed to delete leave request.', 'error');
      }
    }
  };

  const handleCreate = () => {
    navigate('/add-leave-request');
  };

  const handleRefresh = () => {
    fetchLeaveData(false);
  };

  const columns = useMemo(() => [
    {
      Header: 'SR. NO.',
      Cell: ({ row }) => row.index + 1,
      width: 80,
      disableSortBy: true,
    },
    {
      Header: 'START DATE',
      accessor: 'start_date',
      Cell: ({ value }) => formatDate(value),
    },
    {
      Header: 'END DATE',
      accessor: 'end_date',
      Cell: ({ value }) => formatDate(value),
    },
    {
      Header: 'DURATION',
      accessor: 'duration',
      Cell: ({ row }) => {
        const start = new Date(row.original.start_date);
        const end = new Date(row.original.end_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
      },
    },
    {
      Header: 'LEAVE TYPE',
      accessor: 'leave_type',
      Cell: ({ value }) => value === 'full_day' ? 'Full Day' : 'Half Day',
    },
    {
      Header: 'STATUS',
      accessor: 'status',
      Cell: ({ value, row }) => {
        const status = value || 'Pending';
        const remarks = row.original.remarks;
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {getStatusBadge(status)}
            {remarks && status !== 'Pending' && (
              <small style={{ 
                fontSize: '11px', 
                color: '#6c757d', 
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={remarks}>
                {remarks.length > 20 ? remarks.substring(0, 20) + '...' : remarks}
              </small>
            )}
          </div>
        );
      },
    },
    {
      Header: 'DESCRIPTION',
      accessor: 'description',
      Cell: ({ value }) => value ? (value.length > 30 ? value.substring(0, 30) + '...' : value) : '-',
    },
    {
      Header: 'ACTIONS',
      id: 'actions',
      Cell: ({ row }) => {
        const canEdit = row.original.status === 'Pending';
        
        return (
          <div style={{ display: 'flex', gap: '10px' }}>
            <FaEye
              style={{ cursor: 'pointer', color: '#17a2b8' }}
              onClick={() => handleView(row.original)}
              title="View Details"
            />
            {canEdit && (
              <>
                <FaEdit
                  style={{ cursor: 'pointer', color: '#007bff' }}
                  onClick={() => handleEdit(row.original)}
                  title="Edit"
                />
                <FaTrash
                  style={{ cursor: 'pointer', color: '#dc3545' }}
                  onClick={() => handleDelete(row.original.id)}
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
  ], [formatDate]);

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
        <SalesPersonNavbar />
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading leave requests...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SalesPersonNavbar />
      <div className="main-container">
        <div className="leave-management-container">
          <Row className="mb-3">
            <Col className="d-flex justify-content-between align-items-center">
              <h3 style={{ marginTop: "20px" }}>
                Leave Management
                {refreshing && (
                  <span style={{ 
                    marginLeft: '15px', 
                    fontSize: '12px', 
                    color: '#6c757d'
                  }}>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Refreshing...
                  </span>
                )}
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  className="create_but"
                  onClick={handleCreate}
                  style={{ backgroundColor: '#a36e29', borderColor: '#a36e29' }}
                >
                  + Add Leave Request
                </Button>
              </div>
            </Col>
          </Row>

          <GlobalFilter 
            globalFilter={globalFilter} 
            setGlobalFilter={setGlobalFilter} 
            handleDateFilter={handleDateFilter} 
          />

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
                  {page.length > 0 ? (
                    page.map((row) => {
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
                    })
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-4">
                        No leave requests found. Click "Add Leave Request" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {tableData.length > 0 && (
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
            )}
          </div>
        </div>

        {/* View Details Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Leave Request Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedLeave && (
              <Table bordered>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold', width: '40%' }}>Start Date</td>
                    <td>{formatDate(selectedLeave.start_date)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>End Date</td>
                    <td>{formatDate(selectedLeave.end_date)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Duration</td>
                    <td>
                      {(() => {
                        const start = new Date(selectedLeave.start_date);
                        const end = new Date(selectedLeave.end_date);
                        const diffTime = Math.abs(end - start);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Leave Type</td>
                    <td>{selectedLeave.leave_type === 'full_day' ? 'Full Day' : 'Half Day'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Status</td>
                    <td>{getStatusBadge(selectedLeave.status || 'Pending')}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Description</td>
                    <td>{selectedLeave.description || '-'}</td>
                  </tr>
                  {selectedLeave.remarks && (
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Admin Remarks</td>
                      <td style={{ color: selectedLeave.status === 'Rejected' ? '#dc3545' : '#28a745' }}>
                        {selectedLeave.remarks}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Submitted On</td>
                    <td>{selectedLeave.created_at ? new Date(selectedLeave.created_at).toLocaleString() : '-'}</td>
                  </tr>
                  {selectedLeave.attachment && (
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Attachment</td>
                      <td>
                        <a 
                          href={`${baseURL}/uploads/leaves/${selectedLeave.attachment}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          View Attachment
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default LeaveManagement;