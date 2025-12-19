import React, { useState, useEffect, useMemo } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';
import './Purity.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { Button, Row, Col } from 'react-bootstrap';
import Navbar from '../../../../Pages/Navbar/Navbar';

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

function Purity() {
  const navigate = useNavigate();
  const location = useLocation();
  const [purityData, setPurityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);

  // Check for success message from form submission
  useEffect(() => {
    if (location.state?.successMessage) {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: location.state.successMessage,
        confirmButtonColor: '#3085d6',
      });
      // Clear the state to prevent showing the message again
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Table columns definition
  const columns = useMemo(() => [
    {
      Header: 'Sr. No.',
      Cell: ({ row }) => row.index + 1,
      width: 80,
    },
    {
      Header: 'Name',
      accessor: 'name',
    },
    {
      Header: 'Metal',
      accessor: 'metal',
      Cell: ({ value }) => (
        <span className="text-capitalize">{value}</span>
      ),
    },
    {
      Header: 'Purity (%)',
      accessor: 'purity_percentage',
      Cell: ({ value }) => (
        <span>{value ? `${value}%` : 'N/A'}</span>
      ),
    },
    {
      Header: 'Actions',
      Cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <FaEdit
            style={{ cursor: 'pointer', color: 'blue' }}
            onClick={() => handleEditClick(row.original)}
            title="Edit"
          />
          <FaTrash
            style={{ cursor: 'pointer', color: 'red' }}
            onClick={() => handleDelete(row.original.id)}
            title="Delete"
          />
        </div>
      ),
      width: 100,
    },
  ], []);

  // Fetch data from API
  const fetchPurityData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/purity');
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      setPurityData(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Error fetching purity data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load purity records',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle date filter
  const handleDateFilter = (fromDate, toDate) => {
    if (fromDate || toDate) {
      const filtered = purityData.filter((item) => {
        const itemDate = new Date(item.created_at).setHours(0, 0, 0, 0);
        const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
        const to = toDate ? new Date(toDate).setHours(0, 0, 0, 0) : null;

        return (!from || itemDate >= from) && (!to || itemDate <= to);
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(purityData);
    }
  };

  // Delete record
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:5000/purity/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          Swal.fire({
            title: 'Deleted!',
            text: 'Purity record has been deleted.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
          });
          // Refresh the data
          fetchPurityData();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete record');
        }
      } catch (error) {
        console.error('Error deleting record:', error);
        Swal.fire({
          title: 'Error!',
          text: error.message || 'Failed to delete record.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
        });
      }
    }
  };

  const handleAddClick = () => {
    navigate('/purityform');
  };

  const handleEditClick = (record) => {
    navigate('/purityform', { state: { editingRecord: record } });
  };

  useEffect(() => {
    fetchPurityData();
  }, []);

  useEffect(() => {
    setFilteredData(purityData);
  }, [purityData]);

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
      data: filteredData,
      initialState: { pageIndex: 0 },
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
        <div className="purity-table-container">
          {/* Header with Title and Add Button */}
          <Row className="mb-3">
            <Col className="d-flex justify-content-between align-items-center">
              <h3>Purity Records</h3>
              <Button
                className="create_but"
                onClick={handleAddClick}
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
                  {page.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-4">
                        No purity records found
                      </td>
                    </tr>
                  ) : (
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
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="d-flex align-items-center justify-content-between mt-3">
              <div className="dataTable_pageInfo">
                Page{' '}
                <strong>
                  {pageIndex + 1} of {pageOptions.length}
                </strong>{' '}
                | Showing {filteredData.length} records
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
        </div>
      </div>
    </>
  );
}

export default Purity;