import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../Pages/TableLayout/TableLayout';
import { Button, Spinner, Alert, Badge } from 'react-bootstrap';
import Navbar from '../../../Pages/Navbar/Navbar';
import { FaCheck, FaTimes, FaChevronRight, FaChevronDown, FaMapMarkerAlt, FaCity, FaBuilding } from 'react-icons/fa';
import baseURL from '../../ApiUrl/NodeBaseURL';
import './Customers.css';

const Customers = () => {
  const navigate = useNavigate();
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  
  // State for expanded sections
  const [expandedStates, setExpandedStates] = useState({});
  const [expandedDistricts, setExpandedDistricts] = useState({});
  const [expandedCities, setExpandedCities] = useState({});
  
  // State for view mode (hierarchical or flat)
  const [viewMode, setViewMode] = useState('hierarchical'); // 'hierarchical' or 'flat'

  // Fetch customers data from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${baseURL}/api/users`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Filter role = "customer" (case-insensitive)
        const customers = data.filter(user => 
          user.role && user.role.toLowerCase() === "customer"
        );

        setCustomersData(customers);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch customer by ID
  const fetchCustomerById = async (customerId) => {
    try {
      const response = await fetch(`${baseURL}/api/users/${customerId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching customer:', err);
      throw err;
    }
  };

  // Update customer status
  const updateCustomerStatus = async (customerId, status) => {
    try {
      setUpdating(prev => ({ ...prev, [customerId]: true }));

      const customer = await fetchCustomerById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const updatedCustomer = {
        ...customer,
        status: status
      };

      const response = await fetch(`${baseURL}/api/users/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCustomer),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setCustomersData(prevData => 
        prevData.map(customer => 
          customer.id === customerId 
            ? { ...customer, status: status }
            : customer
        )
      );

      alert(`Customer ${status} successfully. ${status === 'approved' ? 'An email with credentials has been sent.' : 'A rejection email has been sent.'}`);

    } catch (err) {
      console.error('Error updating customer status:', err);
      alert(`Failed to update customer status: ${err.message}`);
    } finally {
      setUpdating(prev => ({ ...prev, [customerId]: false }));
    }
  };

  // Handle accept action
  const handleAccept = (customerId) => {
    if (window.confirm('Are you sure you want to approve this customer? An email with credentials will be sent.')) {
      updateCustomerStatus(customerId, 'approved');
    }
  };

  // Handle reject action
  const handleReject = (customerId) => {
    if (window.confirm('Are you sure you want to reject this customer? A rejection email will be sent.')) {
      updateCustomerStatus(customerId, 'rejected');
    }
  };

  // Toggle expand/collapse for states
  const toggleState = (state) => {
    setExpandedStates(prev => ({
      ...prev,
      [state]: !prev[state]
    }));
  };

  // Toggle expand/collapse for districts
  const toggleDistrict = (state, district) => {
    const key = `${state}-${district}`;
    setExpandedDistricts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle expand/collapse for cities
  const toggleCity = (state, district, city) => {
    const key = `${state}-${district}-${city}`;
    setExpandedCities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Build hierarchical data structure
  const hierarchicalData = useMemo(() => {
    const grouped = {};

    customersData.forEach(customer => {
      const state = customer.state || 'Unknown State';
      const district = customer.district || 'Unknown District';
      const city = customer.city || 'Unknown City';

      if (!grouped[state]) {
        grouped[state] = {
          customers: [],
          totalCustomers: 0,
          districts: {}
        };
      }

      if (!grouped[state].districts[district]) {
        grouped[state].districts[district] = {
          customers: [],
          totalCustomers: 0,
          cities: {}
        };
      }

      if (!grouped[state].districts[district].cities[city]) {
        grouped[state].districts[district].cities[city] = [];
      }

      grouped[state].districts[district].cities[city].push(customer);
      grouped[state].districts[district].totalCustomers++;
      grouped[state].totalCustomers++;
    });

    return grouped;
  }, [customersData]);

  // Format the data to match the table structure with location fields (for flat view)
  const formattedCustomersData = useMemo(() => {
    return customersData.map(customer => ({
      id: customer.id,
      name: customer.full_name,
      phone: customer.phone || 'N/A',
      email: customer.email_id,
      address: `${customer.city || ''}, ${customer.district || ''}, ${customer.state || ''}, ${customer.country || ''}`,
      status: customer.status,
      state: customer.state || 'N/A',
      district: customer.district || 'N/A',
      city: customer.city || 'N/A',
      date: customer.created_at || new Date().toISOString()
    }));
  }, [customersData]);

  // Get status badge component
  const getStatusBadge = (status) => {
    if (!status || status === 'pending') return <Badge bg="warning">Pending</Badge>;
    if (status === 'approved') return <Badge bg="success">Approved</Badge>;
    if (status === 'rejected') return <Badge bg="danger">Rejected</Badge>;
    return <Badge bg="secondary">{status}</Badge>;
  };

  // Table columns configuration (for flat view)
  const columns = useMemo(
    () => [
      {
        Header: 'Customer Name',
        accessor: 'name',
      },
      {
        Header: 'Mobile Number',
        accessor: 'phone',
      },
      {
        Header: 'Email',
        accessor: 'email',
      },
      {
        Header: 'City',
        accessor: 'city',
      },
      {
        Header: 'District',
        accessor: 'district',
      },
      {
        Header: 'State',
        accessor: 'state',
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => {
          if (!value || value === 'pending') return <Badge bg="warning">Pending</Badge>;
          
          let variant = 'secondary';
          if (value === 'approved') variant = 'success';
          if (value === 'rejected') variant = 'danger';
          
          return <Badge bg={variant}>{value.toUpperCase()}</Badge>;
        },
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => {
          const customerId = row.original.id;
          const isUpdating = updating[customerId];
          const currentStatus = row.original.status;
          
          const isDisabled = currentStatus === 'approved' || currentStatus === 'rejected';
          
          return (
            <div>
              <Button
                variant="success"
                size="sm"
                className="me-2"
                onClick={() => handleAccept(customerId)}
                disabled={isDisabled || isUpdating}
              >
                {isUpdating ? (
                  <Spinner animation="border" size="sm" className="me-1" />
                ) : (
                  <FaCheck className="me-1" />
                )}
                Accept
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleReject(customerId)}
                disabled={isDisabled || isUpdating}
              >
                {isUpdating ? (
                  <Spinner animation="border" size="sm" className="me-1" />
                ) : (
                  <FaTimes className="me-1" />
                )}
                Reject
              </Button>
            </div>
          );
        },
      },
    ],
    [updating]
  );

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="main-container" style={{ marginTop: '70px' }}>
          <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="main-container" style={{ marginTop: '70px' }}>
          <Alert variant="danger">
            Error loading customers: {error}
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar/>
      <div className="main-container">
        <div className="customers-table-container" style={{marginTop:'90px'}}>
          <div className="d-flex justify-content-between align-items-center mb-4" style={{marginLeft:'50px'}}>
            <h3>Customers</h3>
            <div className="d-flex align-items-center">
              {/* View Mode Toggle */}
              <div className="btn-group me-3">
                <Button
                  variant={viewMode === 'hierarchical' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('hierarchical')}
                >
                  📊 Grouped View
                </Button>
                <Button
                  variant={viewMode === 'flat' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('flat')}
                >
                  📋 Flat View
                </Button>
              </div>
              <Badge bg="info" className="ms-2">
                Total Customers: {customersData.length}
              </Badge>
            </div>
          </div>
          
          {/* Hierarchical View */}
          {viewMode === 'hierarchical' ? (
            <div className="hierarchical-view" style={{marginLeft:'50px', marginRight:'50px'}}>
              <table className="table table-striped table-bordered table-hover">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}></th>
                    <th>Location / Customer Name</th>
                    <th>Mobile Number</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(hierarchicalData).sort(([a], [b]) => a.localeCompare(b)).map(([state, stateData]) => (
                    <React.Fragment key={state}>
                      {/* State Row */}
                      <tr className="state-row">
                        <td className="text-center">
                          <button
                            className="expand-btn"
                            onClick={() => toggleState(state)}
                          >
                            {expandedStates[state] ? 
                              <FaChevronDown className="expand-icon-svg" /> : 
                              <FaChevronRight className="expand-icon-svg" />
                            }
                          </button>
                        </td>
                        <td colSpan="4">
                          <div className="d-flex align-items-center">
                            <FaMapMarkerAlt className="location-icon state-icon me-2" />
                            <strong>{state}</strong>
                            <Badge bg="primary" className="ms-2">
                              {stateData.totalCustomers} customer(s)
                            </Badge>
                          </div>
                        </td>
                        <td></td>
                      </tr>

                      {/* Districts for this state */}
                      {expandedStates[state] && Object.entries(stateData.districts).sort(([a], [b]) => a.localeCompare(b)).map(([district, districtData]) => (
                        <React.Fragment key={`${state}-${district}`}>
                          {/* District Row */}
                          <tr className="district-row">
                            <td className="text-center">
                              <button
                                className="expand-btn ms-3"
                                onClick={() => toggleDistrict(state, district)}
                              >
                                {expandedDistricts[`${state}-${district}`] ? 
                                  <FaChevronDown className="expand-icon-svg" /> : 
                                  <FaChevronRight className="expand-icon-svg" />
                                }
                              </button>
                            </td>
                            <td colSpan="4">
                              <div className="d-flex align-items-center">
                                <FaBuilding className="location-icon district-icon me-2" />
                                <strong>{district}</strong>
                                <Badge bg="success" className="ms-2">
                                  {districtData.totalCustomers} customer(s)
                                </Badge>
                              </div>
                            </td>
                            <td></td>
                          </tr>

                          {/* Cities for this district */}
                          {expandedDistricts[`${state}-${district}`] && Object.entries(districtData.cities).sort(([a], [b]) => a.localeCompare(b)).map(([city, cityCustomers]) => (
                            <React.Fragment key={`${state}-${district}-${city}`}>
                              {/* City Row */}
                              <tr className="city-row">
                                <td className="text-center">
                                  <button
                                    className="expand-btn ms-5"
                                    onClick={() => toggleCity(state, district, city)}
                                  >
                                    {expandedCities[`${state}-${district}-${city}`] ? 
                                      <FaChevronDown className="expand-icon-svg" /> : 
                                      <FaChevronRight className="expand-icon-svg" />
                                    }
                                  </button>
                                </td>
                                <td colSpan="4">
                                  <div className="d-flex align-items-center">
                                    <FaCity className="location-icon city-icon me-2" />
                                    <strong>{city}</strong>
                                    <Badge bg="warning" text="dark" className="ms-2">
                                      {cityCustomers.length} customer(s)
                                    </Badge>
                                  </div>
                                </td>
                                <td></td>
                              </tr>

                              {/* Individual Customer Rows */}
                              {expandedCities[`${state}-${district}-${city}`] && cityCustomers.map(customer => (
                                <tr key={customer.id} className="customer-row">
                                  <td></td>
                                  <td className="ps-6">{customer.full_name}</td>
                                  <td>{customer.phone || 'N/A'}</td>
                                  <td>{customer.email_id}</td>
                                  <td>{getStatusBadge(customer.status)}</td>
                                  <td>
                                    <Button
                                      variant="success"
                                      size="sm"
                                      className="me-2 action-btn"
                                      onClick={() => handleAccept(customer.id)}
                                      disabled={customer.status === 'approved' || customer.status === 'rejected' || updating[customer.id]}
                                    >
                                      {updating[customer.id] ? (
                                        <Spinner animation="border" size="sm" className="me-1" />
                                      ) : (
                                        <FaCheck className="me-1" />
                                      )}
                                      Accept
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      className="action-btn"
                                      onClick={() => handleReject(customer.id)}
                                      disabled={customer.status === 'approved' || customer.status === 'rejected' || updating[customer.id]}
                                    >
                                      {updating[customer.id] ? (
                                        <Spinner animation="border" size="sm" className="me-1" />
                                      ) : (
                                        <FaTimes className="me-1" />
                                      )}
                                      Reject
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Flat View with DataTable and filters */
            <DataTable 
              columns={columns} 
              data={formattedCustomersData}
              showLocationFilters={true}
              locationFilterFields={{
                state: 'state',
                district: 'district',
                city: 'city'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Customers;