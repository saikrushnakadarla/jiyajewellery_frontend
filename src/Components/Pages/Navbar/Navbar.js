import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FaSignOutAlt } from "react-icons/fa";
import logo from '../images/jiya_logo.png';
import './Navbar.css';
import Swal from 'sweetalert2';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mastersDropdownOpen, setMastersDropdownOpen] = useState(false);
  const [transactionsDropdownOpen, setTransactionsDropdownOpen] = useState(false);
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleDropdown = () => {
    setMastersDropdownOpen(!mastersDropdownOpen);
  };

  const toggletransactionDropdown = () => {
    setTransactionsDropdownOpen(!transactionsDropdownOpen);
  };

  const togglereportsDropdown = () => {
    setReportsDropdownOpen(!reportsDropdownOpen);
  };

  const handleItemClick = () => {
    setMastersDropdownOpen(false);
    setTransactionsDropdownOpen(false);
    setReportsDropdownOpen(false);
    setIsOpen(false);
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to log out?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, log out!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('user');
        navigate('/');
      }
    });
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="navbar-header">
      <div className="navbar-brand">
        <img src={logo} alt="Logo" className="navbar-logo" />
      </div>

      <div
        className={`navbar-hamburger ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
      >
        <div className="navbar-bar"></div>
        <div className="navbar-bar"></div>
        <div className="navbar-bar"></div>
      </div>

      <nav className={`navbar-links ${isOpen ? 'open' : ''}`}>
        <div>
          <span>
            <Link
              to="/dashboard"
              onClick={handleItemClick}
              className={isActive('/dashboard')}
              style={{
                color: window.location.pathname === '/dashboard' ? '#a36e29' : 'black',
                backgroundColor: 'transparent',
                textDecoration: 'none',
              }}
            >
              DASHBOARD
            </Link>
          </span>
        </div>

        <div
          className="navbar-dropdown"
          onMouseEnter={toggleDropdown}
          onMouseLeave={toggleDropdown}
        >
          <span className="navbar-dropdown-title">
            MASTERS{' '}
            <FontAwesomeIcon
              icon={mastersDropdownOpen ? faChevronUp : faChevronDown}
              className="dropdown-arrow-icon"
            />
          </span>
          {mastersDropdownOpen && (
            <div className="navbar-dropdown-content">
              <Link to="/customers" onClick={handleItemClick} className={isActive('/customers')}>
                Customer 
              </Link>
              <Link to="/salespersontable" onClick={handleItemClick} className={isActive('/salespersontable')}>
                Salesperson 
              </Link>
              <Link to="/salesperson-attendance" onClick={handleItemClick} className={isActive('/salesperson-attendance')}>
                Salesperson Attendance 
              </Link>
              {/* NEW - Leaves Approval added above Purity */}
              <Link to="/leaves-approval" onClick={handleItemClick} className={isActive('/leaves-approval')}>
                Leaves Approval
              </Link>
              <Link to="/purity" onClick={handleItemClick} className={isActive('/purity')}>
                Purity 
              </Link>
              <Link to="/rates" onClick={handleItemClick} className={isActive('/ratesmaster')}>
                Rates 
              </Link>
              <Link to="/designmaster" onClick={handleItemClick} className={isActive('/designmaster')}>
                Design Master
              </Link>
              <Link to="/metaltype" onClick={handleItemClick} className={isActive('/metaltype')}>
                Metaltype 
              </Link>
              <Link to="/c-products" onClick={handleItemClick} className={isActive('/c-products')}>
                Category 
              </Link>
              <Link to="/qr-code-printing" onClick={handleItemClick} className={isActive('/qr-code-printing')}>
                QR Code Printing
              </Link>
              <Link to="/productmaster" onClick={handleItemClick} className={isActive('/productmaster')}>
                Products 
              </Link>
              <Link to="/company-info" onClick={handleItemClick} className={isActive('/company-info')}>
                Company Info
              </Link>
              <Link to="/loan-amount" onClick={handleItemClick} className={isActive('/loan-amount')}>
                Loan Amount
              </Link>
              <Link to="/visit-logs-schedule" onClick={handleItemClick} className={isActive('/visit-logs-schedule')}>
                Visit Logs Schedule
              </Link>
            </div>
          )}
        </div>

        <div>
          <span>
            <Link
              to="/transactions"
              onClick={handleItemClick}
              className={isActive('/transactions')}
              style={{
                color: window.location.pathname === '/transactions' ? '#a36e29' : 'black',
                backgroundColor: 'transparent',
                textDecoration: 'none',
              }}
            >
              TRANSACTIONS
            </Link>
          </span>
        </div>

        <div>
          <span>
            <Link
              to="/reports"
              onClick={handleItemClick}
              className={isActive('/reports')}
              style={{
                color: window.location.pathname === '/reports' ? '#a36e29' : 'black',
                backgroundColor: 'transparent',
                textDecoration: 'none',
              }}
            >
              REPORTS
            </Link>
          </span>
        </div>
      </nav>

      <div className="navbar-logout">
        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt size={18} /> Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;