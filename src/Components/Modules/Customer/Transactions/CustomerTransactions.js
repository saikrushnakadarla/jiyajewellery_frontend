import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '../../../Pages/Navbar/CustomerNavbar';
import EstimateTable from './EstimateTable';
import ProductCatalog from '../ProductCatalog/ProductCatalog';
import Purchase from '../Purchase/Purchase';
import './CustomerTransactions.css';

const CustomerTransactions = () => {
  const [activeTab, setActiveTab] = useState('estimation');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <>
      <CustomerNavbar />
      <div className="customer-transactions-main-container">
        {/* <div className="customer-transactions-header">
          <h2 className="customer-transactions-title">MY TRANSACTIONS</h2>
          <p className="customer-transactions-subtitle">View and manage your transactions</p>
        </div> */}

        {/* Tab Navigation */}
        <div className="customer-transactions-tabs-container">
          <div className="customer-transactions-tabs">
            <button
              className={`customer-transactions-tab ${activeTab === 'estimation' ? 'active' : ''}`}
              onClick={() => handleTabChange('estimation')}
            >
              Selections
            </button>
            <button
              className={`customer-transactions-tab ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => handleTabChange('catalog')}
            >
              Product Catalog
            </button>
            <button
              className={`customer-transactions-tab ${activeTab === 'purchase' ? 'active' : ''}`}
              onClick={() => handleTabChange('purchase')}
            >
              Purchase History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="customer-transactions-content">
          {activeTab === 'estimation' && <EstimateTable />}
          {activeTab === 'catalog' && <ProductCatalog />}
          {activeTab === 'purchase' && <Purchase />}
        </div>
      </div>
    </>
  );
};

export default CustomerTransactions;