import React, { useState, useEffect } from 'react';
import { useTable, usePagination, useGlobalFilter, useSortBy } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';

// Global Search Filter Component
function GlobalFilter({ 
  globalFilter, 
  setGlobalFilter, 
  handleDateFilter, 
  showLocationFilters = false,
  locationFilters = {},
  setLocationFilters = () => {},
  locationOptions = { states: [], districts: [], cities: [] }
}) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const applyDateFilter = () => {
    handleDateFilter(fromDate, toDate);
  };

  const handleLocationChange = (type, value) => {
    setLocationFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  return (
    <div className="dataTable_search mb-3">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <input
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="form-control"
          placeholder="Search..."
          style={{ width: '180px' }}
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="form-control"
          placeholder="mm/dd/yyyy"
          style={{ width: '140px' }}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="form-control"
          placeholder="mm/dd/yyyy"
          style={{ width: '140px' }}
        />
        
        {showLocationFilters && (
          <>
            <select
              value={locationFilters.state || ''}
              onChange={(e) => handleLocationChange('state', e.target.value)}
              className="form-select"
              style={{ width: '140px' }}
            >
              <option value="">All States</option>
              {locationOptions.states.map((state, index) => (
                <option key={index} value={state}>{state}</option>
              ))}
            </select>

            <select
              value={locationFilters.district || ''}
              onChange={(e) => handleLocationChange('district', e.target.value)}
              className="form-select"
              style={{ width: '140px' }}
            >
              <option value="">All Districts</option>
              {locationOptions.districts.map((district, index) => (
                <option key={index} value={district}>{district}</option>
              ))}
            </select>
            
            <select
              value={locationFilters.city || ''}
              onChange={(e) => handleLocationChange('city', e.target.value)}
              className="form-select"
              style={{ width: '140px' }}
            >
              <option value="">All Cities</option>
              {locationOptions.cities.map((city, index) => (
                <option key={index} value={city}>{city}</option>
              ))}
            </select>
          </>
        )}
        
        <button onClick={applyDateFilter} className="btn btn-primary" style={{ width: '80px' }}>
          OK
        </button>
      </div>
    </div>
  );
}

// Reusable DataTable Component
export default function DataTable({ 
  columns, 
  data, 
  showLocationFilters = false,
  locationFilterFields = { state: 'state', district: 'district', city: 'city' }
}) {
  const [filteredData, setFilteredData] = useState(data);
  const [locationFilters, setLocationFilters] = useState({
    state: '',
    district: '',
    city: ''
  });

  // Extract unique location options from data
  const locationOptions = React.useMemo(() => {
    if (!showLocationFilters) return { states: [], districts: [], cities: [] };
    
    const states = [...new Set(data.map(item => item[locationFilterFields.state]).filter(Boolean))];
    const districts = [...new Set(data.map(item => item[locationFilterFields.district]).filter(Boolean))];
    const cities = [...new Set(data.map(item => item[locationFilterFields.city]).filter(Boolean))];
    
    return { states, districts, cities };
  }, [data, showLocationFilters, locationFilterFields]);

  // Apply all filters (global search, date, location)
  useEffect(() => {
    applyAllFilters();
  }, [data, locationFilters]);

  const applyAllFilters = (dateFilteredData = null) => {
    let filtered = dateFilteredData || data;
    
    // Apply location filters
    if (showLocationFilters) {
      filtered = filtered.filter(item => {
        const stateMatch = !locationFilters.state || 
          item[locationFilterFields.state] === locationFilters.state;
        const districtMatch = !locationFilters.district || 
          item[locationFilterFields.district] === locationFilters.district;
        const cityMatch = !locationFilters.city || 
          item[locationFilterFields.city] === locationFilters.city;
        
        return stateMatch && districtMatch && cityMatch;
      });
    }
    
    setFilteredData(filtered);
  };

  const handleDateFilter = (fromDate, toDate) => {
    let filtered = data;
    
    if (fromDate || toDate) {
      filtered = data.filter((item) => {
        const itemDate = new Date(item.date).setHours(0, 0, 0, 0);
        const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
        const to = toDate ? new Date(toDate).setHours(0, 0, 0, 0) : null;

        return (!from || itemDate >= from) && (!to || itemDate <= to);
      });
    }
    
    applyAllFilters(filtered);
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
      data: filteredData,
      initialState: { pageIndex: 0 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  return (
    <div className="dataTable_wrapper container-fluid">
      <GlobalFilter 
        globalFilter={globalFilter} 
        setGlobalFilter={setGlobalFilter} 
        handleDateFilter={handleDateFilter}
        showLocationFilters={showLocationFilters}
        locationFilters={locationFilters}
        setLocationFilters={setLocationFilters}
        locationOptions={locationOptions}
      />

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
            {[5, 10, 20, 25, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}