import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EstimateTable from './EstimateTable';
import AdminVisitLogs from '../VisitLogs/VisitLogs';
import Navbar from '../../../Pages/Navbar/Navbar';
import './Transactions.css';

const Transactions = () => {
  const [activeTab, setActiveTab] = useState('estimation');
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <>
    <div>
      <Navbar />
      <div className="transactions-main-container">
        {/* <div className="transactions-header">
          <h2 className="transactions-title">TRANSACTIONS</h2>
          <p className="transactions-subtitle">View and manage your transactions</p>
        </div> */}

        {/* Tab Navigation */}
        <div className="transactions-tabs-container">
          <div className="transactions-tabs">
            <button
              className={`transactions-tab ${activeTab === 'estimation' ? 'active' : ''}`}
              onClick={() => handleTabChange('estimation')}
            >
              Estimation
            </button>
            <button
              className={`transactions-tab ${activeTab === 'visit-logs' ? 'active' : ''}`}
              onClick={() => handleTabChange('visit-logs')}
            >
              Admin Visit Logs
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transactions-content">
          {activeTab === 'estimation' && <EstimateTable />}
          {activeTab === 'visit-logs' && <AdminVisitLogs />}
        </div>
      </div>
      </div>
    </>
  );
};

export default Transactions;