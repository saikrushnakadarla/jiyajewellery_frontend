import React, { useState, useEffect, useMemo } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { Button, Row, Col } from 'react-bootstrap';
import Navbar from '../../../../Pages/Navbar/Navbar';
import './ProductMaster.css';

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

function ProductMaster() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/get/products');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
      setFilteredData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load products',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    navigate('/productform');
  };

  const handleEditClick = (product) => {
    navigate('/productform', { state: { editingRecord: product } });
  };

  const handleDelete = async (productId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:5000/delete/product/${productId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          Swal.fire('Deleted!', 'Product has been deleted.', 'success');
          fetchProducts(); // Refresh the list
        } else {
          throw new Error('Failed to delete');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        Swal.fire('Error!', 'Failed to delete product.', 'error');
      }
    }
  };

  // Handle date filter
  const handleDateFilter = (fromDate, toDate) => {
    if (fromDate || toDate) {
      const filtered = products.filter((item) => {
        const itemDate = new Date(item.created_at).setHours(0, 0, 0, 0);
        const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
        const to = toDate ? new Date(toDate).setHours(0, 0, 0, 0) : null;

        return (!from || itemDate >= from) && (!to || itemDate <= to);
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(products);
    }
  };

  // Table columns definition
  const columns = useMemo(() => [
    {
      Header: 'Sr. No.',
      Cell: ({ row }) => row.index + 1,
      width: 80,
    },
    {
      Header: 'ID',
      accessor: 'product_id',
      width: 80,
    },
    {
      Header: 'Product Name',
      accessor: 'product_name',
    },
    {
      Header: 'Barcode',
      accessor: 'barcode',
    },
    {
      Header: 'Category ID',
      accessor: 'category_id',
      width: 100,
    },
    {
      Header: 'Metal Type',
      accessor: 'metal_type',
      Cell: ({ value }) => (
        <span className="text-capitalize">{value}</span>
      ),
    },
    {
      Header: 'Purity',
      accessor: 'purity',
      width: 80,
    },
    {
      Header: 'Design',
      accessor: 'design',
    },
    {
      Header: 'Gross Wt',
      accessor: 'gross_wt',
      width: 100,
      Cell: ({ value }) => parseFloat(value).toFixed(3),
    },
    {
      Header: 'Stone Wt',
      accessor: 'stone_wt',
      width: 100,
      Cell: ({ value }) => parseFloat(value).toFixed(3),
    },
    {
      Header: 'Net Wt',
      accessor: 'net_wt',
      width: 100,
      Cell: ({ value }) => parseFloat(value).toFixed(3),
    },
    {
      Header: 'Created Date',
      accessor: 'created_at',
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
      Header: 'Actions',
      Cell: ({ row }) => (
        <>
          <FaEdit
            style={{ cursor: 'pointer', color: 'blue', marginRight: '10px' }}
            onClick={() => handleEditClick(row.original)}
            title="Edit"
          />
          <FaTrash
            style={{ cursor: 'pointer', color: 'red' }}
            onClick={() => handleDelete(row.original.product_id)}
            title="Delete"
          />
        </>
      ),
      width: 100,
    },
  ], []);

  useEffect(() => {
    setFilteredData(products);
  }, [products]);

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
        <div className="product-master-table-container">
          {/* Header with Title and Add Button */}
          <Row className="mb-3">
            <Col className="d-flex justify-content-between align-items-center">
              <h3>Product Master</h3>
              <Button
                className="create_but"
                onClick={handleAddClick}
                style={{ backgroundColor: '#a36e29', borderColor: '#a36e29' }}
              >
                + Add Product
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
      </div>
    </>
  );
}

export default ProductMaster;