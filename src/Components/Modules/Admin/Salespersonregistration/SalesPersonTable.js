import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../Pages/TableLayout/TableLayout'; // Import the reusable DataTable component
import { Button } from 'react-bootstrap';
import Navbar from '../../../Pages/Navbar/Navbar';

const SalesPersonTable = () => {
  const navigate = useNavigate();
  const [salesPersonsData, setSalesPersonsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch salespersons data from API
  useEffect(() => {
    const fetchSalesPersons = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filter only users with role "salesman"
        const salesmen = data.filter(user => user.role === 'salesman');
        
        // Format data for table display
        const formattedData = salesmen.map(salesman => ({
          id: salesman.id,
          name: salesman.full_name,
          mobile: salesman.phone || salesman.mobile || 'N/A',
          email: salesman.email_id,
          address: `${salesman.address1 || ''} ${salesman.address2 || ''}, ${salesman.city || ''}, ${salesman.state || ''} - ${salesman.pincode || ''}`
        }));
        
        setSalesPersonsData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching salespersons:', error);
        setError('Failed to load salespersons data');
        setLoading(false);
      }
    };

    fetchSalesPersons();
  }, []);

  // Table columns configuration
  const columns = React.useMemo(
    () => [
      {
        Header: 'Customer Name',
        accessor: 'name',
      },
      {
        Header: 'Mobile Number',
        accessor: 'mobile',
      },
      {
        Header: 'Email',
        accessor: 'email',
      },
      {
        Header: 'Address',
        accessor: 'address',
      },
    ],
    []
  );

  const handleAddSalesPerson = () => {
    navigate('/salepersonregister');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="main-container" style={{ marginTop: '90px' }}>
          <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="main-container" style={{ marginTop: '90px' }}>
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            variant="primary"
          >
            Retry
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="main-container">
        <div className="sales-persons-table-container" style={{ marginTop: '90px' }}>
          <div className="d-flex justify-content-between align-items-center mb-4" style={{width:'93%',marginLeft:'55px'}}>
            <h3>Sales Persons</h3>
            <Button
              className="create_but"
              onClick={handleAddSalesPerson}
              style={{ backgroundColor: '#a36e29', borderColor: '#a36e29' }}
            >
              + Add Sales Person
            </Button>
          </div>
          
          <DataTable 
            columns={columns} 
            data={salesPersonsData} 
            initialSearchValue=""
          />
        </div>
      </div>
    </>
  );
};

export default SalesPersonTable;