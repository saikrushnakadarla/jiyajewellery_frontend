import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../Pages/TableLayout/TableLayout';
import { Button, Spinner, Alert, Badge } from 'react-bootstrap';
import Navbar from '../../../Pages/Navbar/Navbar';
import { FaCheck, FaTimes } from 'react-icons/fa';

const Customers = () => {
  const navigate = useNavigate();
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({}); // Track which customers are being updated

  // Fetch customers data from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users');
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
      const response = await fetch(`http://localhost:5000/api/users/${customerId}`);
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
      // Set updating state for this customer
      setUpdating(prev => ({ ...prev, [customerId]: true }));

      // First, fetch the latest customer data by ID
      const customer = await fetchCustomerById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Prepare the updated data with the new status
      const updatedCustomer = {
        ...customer,
        status: status
      };

      const response = await fetch(`http://localhost:5000/api/users/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCustomer),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update the local state to reflect the change
      setCustomersData(prevData => 
        prevData.map(customer => 
          customer.id === customerId 
            ? { ...customer, status: status }
            : customer
        )
      );

      // Show success message
      alert(`Customer ${status} successfully. ${status === 'approved' ? 'An email with credentials has been sent.' : 'A rejection email has been sent.'}`);

    } catch (err) {
      console.error('Error updating customer status:', err);
      alert(`Failed to update customer status: ${err.message}`);
    } finally {
      // Remove updating state for this customer
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

  // Format the data to match the table structure
  const formattedCustomersData = useMemo(() => {
    return customersData.map(customer => ({
      id: customer.id,
      name: customer.full_name,
      phone: customer.phone || 'N/A',
      email: customer.email_id,
      address: `${customer.city}, ${customer.state}, ${customer.country}`,
      status: customer.status // Include status in the formatted data
    }));
  }, [customersData]);

  // Table columns configuration
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
        Header: 'Address',
        accessor: 'address',
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => {
          if (!value) return <Badge bg="warning">Pending</Badge>;
          
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
          const hasStatus = row.original.status;
          
          return (
            <div>
              <Button
                variant="success"
                size="sm"
                className="me-2"
                onClick={() => handleAccept(customerId)}
                disabled={hasStatus || isUpdating}
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
                disabled={hasStatus || isUpdating}
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

  const handleAddCustomer = () => {
    navigate('/customerregister');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="main-container" style={{ marginTop: '70px' }}>
          <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="main-container" style={{ marginTop: '70px' }}>
          <Alert variant="danger">
            Error loading customers: {error}
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar/>
      <div className="main-container">
        <div className="customers-table-container" style={{marginTop:'90px'}}>
          <div className="d-flex justify-content-between align-items-center mb-4" style={{marginLeft:'50px'}}>
            <h3>Customers</h3>
            {/* <Button variant="primary" onClick={handleAddCustomer}>
              Add Customer
            </Button> */}
          </div>
          
          <DataTable 
            columns={columns} 
            data={formattedCustomersData} 
            initialSearchValue=""
          />
        </div>
      </div>
    </>
  );
};

export default Customers;