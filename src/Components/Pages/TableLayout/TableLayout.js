import React, { useEffect, useState } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import './TableLayout.css';

// Global Search Filter Component
function GlobalFilter({ globalFilter, setGlobalFilter }) {
  return (
    <div className="dataTable_search mb-3">
      <input
        value={globalFilter || ''}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="form-control"
        placeholder="Search..."
        style={{ maxWidth: '200px' }}
      />
    </div>
  );
}

// Reusable DataTable Component
export default function DataTable({ columns, data, initialSearchValue }) {
  const [tableData, setTableData] = useState(data);
  
  // Update table data when props change
  useEffect(() => {
    setTableData(data);
  }, [data]);

  const filterAllColumns = (rows, id, filterValue) => {
    if (!filterValue) return rows;
    const lowercasedFilter = filterValue.toLowerCase();
    
    return rows.filter((row) => {
      return Object.values(row.original).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(lowercasedFilter)
      );
    });
  };

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
      initialState: { pageIndex: 0, globalFilter: initialSearchValue },
      globalFilter: filterAllColumns,
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  // Set the global filter to the initial value when the component mounts
  useEffect(() => {
    if (initialSearchValue) {
      setGlobalFilter(initialSearchValue);
    }
  }, [initialSearchValue, setGlobalFilter]);

  return (
    <div className="container-fluid py-4">
      <div className="card shadow-sm table-card">
        <div className="card-body">
          <div className="card-title d-flex justify-content-between align-items-center mb-4">
            {/* <h5 className="m-0">Categories List</h5> */}
            <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table {...getTableProps()} className="table table-striped mb-0">
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
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top">
            <div className="dataTable_pageInfo">
              Page{' '}
              <strong>
                {pageIndex + 1} of {pageOptions.length || 1}
              </strong>
            </div>
            <div className="pagebuttons">
              <button
                className="btn btn-outline-primary me-2 btn-sm"
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                Prev
              </button>
              <button
                className="btn btn-outline-primary btn-sm"
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
                style={{ width: 'auto', display: 'inline-block' }}
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
  );
}