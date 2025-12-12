import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FaSignOutAlt } from "react-icons/fa";
import logo from '../images/jiya_logo.png'; // Uncomment when you have the logo
import './Navbar.css';
import Swal from 'sweetalert2';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mastersDropdownOpen, setMastersDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleDropdown = () => {
    setMastersDropdownOpen(!mastersDropdownOpen);
  };

  const handleItemClick = () => {
    setMastersDropdownOpen(false);
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
        navigate('/login');
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
        {/* Uncomment the line below when you have the logo file */}
        <img src={logo} alt="Logo" className="navbar-logo" />
        {/* <div className="navbar-logo-placeholder">Company Logo</div> */}
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
                Customer Master
              </Link>
              <Link to="/salespersontable" onClick={handleItemClick} className={isActive('/salespersontable')}>
                Salesperson Master
              </Link>
            </div>
          )}
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