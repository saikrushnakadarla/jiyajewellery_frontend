import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SalesPersonNavbar from '../../../Pages/Navbar/SalesNavbar';
import EstimateTable from './EstimateTable';
import VisitLogs from '../VisitLogs/VisitLogs';
import './SalesPersonTransaction.css';

const SalespersonTransactions = () => {
  const [activeTab, setActiveTab] = useState('estimation');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <>
      <SalesPersonNavbar />
      <div className="salesperson-transactions-main-container">
        {/* <div className="salesperson-transactions-header">
          <h2 className="salesperson-transactions-title">MY TRANSACTIONS</h2>
          <p className="salesperson-transactions-subtitle">View and manage your transactions</p>
        </div> */}

        {/* Tab Navigation */}
        <div className="salesperson-transactions-tabs-container">
          <div className="salesperson-transactions-tabs">
            <button
              className={`salesperson-transactions-tab ${activeTab === 'estimation' ? 'active' : ''}`}
              onClick={() => handleTabChange('estimation')}
            >
              Selections
            </button>
            <button
              className={`salesperson-transactions-tab ${activeTab === 'visit-logs' ? 'active' : ''}`}
              onClick={() => handleTabChange('visit-logs')}
            >
              Visit Logs
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="salesperson-transactions-content">
          {activeTab === 'estimation' && <EstimateTable />}
          {activeTab === 'visit-logs' && <VisitLogs />}
        </div>
      </div>
    </>
  );
};

export default SalespersonTransactions;