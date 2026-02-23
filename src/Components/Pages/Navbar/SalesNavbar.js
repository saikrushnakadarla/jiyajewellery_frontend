import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FaSignOutAlt } from "react-icons/fa";
import logo from '../images/jiya_logo.png';
import './SalesNavbar.css';
import Swal from 'sweetalert2';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [transactionsDropdownOpen, setTransactionsDropdownOpen] = useState(false);
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.full_name || user.name || 'User');
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserName('User');
      }
    }
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggletransactionDropdown = () => {
    setTransactionsDropdownOpen(!transactionsDropdownOpen);
  };

  const togglereportsDropdown = () => {
    setReportsDropdownOpen(!reportsDropdownOpen);
  };

  const handleItemClick = () => {
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
      {/* Logo on the left side */}
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

      {/* Centered nav links */}
      <nav className={`navbar-links ${isOpen ? 'open' : ''}`}>
        <div>
          <Link
            to="/salesperson-dashboard"
            onClick={handleItemClick}
            className={isActive('/dashboard')}
          >
            DASHBOARD
          </Link>
        </div>

        {/* New Attendance Link */}
        <div>
          <Link
            to="/attendance"
            onClick={handleItemClick}
            className={isActive('/attendance')}
          >
            ATTENDANCE
          </Link>
        </div>

        <div
          className="navbar-dropdown"
          onMouseEnter={toggletransactionDropdown}
          onMouseLeave={toggletransactionDropdown}
        >
          <span className="navbar-dropdown-title">
            TRANSACTIONS{' '}
            <FontAwesomeIcon
              icon={transactionsDropdownOpen ? faChevronUp : faChevronDown}
              className="dropdown-arrow-icon"
            />
          </span>
          {transactionsDropdownOpen && (
            <div className="navbar-dropdown-content">
              <Link to="/salesperson-estimation" onClick={handleItemClick} className={isActive('/salesperson-estimation')}>
                Estimation
              </Link>
              {/* New Visit Logs Link */}
              <Link to="/visit-logs" onClick={handleItemClick} className={isActive('/visit-logs')}>
                Visit Logs
              </Link>
            </div>
          )}
        </div>

        <div
          className="navbar-dropdown"
          onMouseEnter={togglereportsDropdown}
          onMouseLeave={togglereportsDropdown}
        >
          <span className="navbar-dropdown-title">
            REPORTS{' '}
            <FontAwesomeIcon
              icon={reportsDropdownOpen ? faChevronUp : faChevronDown}
              className="dropdown-arrow-icon"
            />
          </span>
        </div>
      </nav>

      {/* User name and logout section */}
      <div className="navbar-right-section">
        <div className="user-logout-wrapper">
          <span className="navbar-username">
            {userName}
          </span>

          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt size={16} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;