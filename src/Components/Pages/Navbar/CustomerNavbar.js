import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaChevronDown, FaChevronUp, FaSignOutAlt } from 'react-icons/fa';
import logo from '../images/jiya_logo.png';
import './CustomerNavbar.css';
import Swal from 'sweetalert2';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [transactionsDropdownOpen, setTransactionsDropdownOpen] = useState(false);
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const count = parseInt(localStorage.getItem('cartCount') || '0');
    setCartCount(count);

    const handleCartCountChange = () => {
      const newCount = parseInt(localStorage.getItem('cartCount') || '0');
      setCartCount(newCount);
    };

    window.addEventListener('cartCountChanged', handleCartCountChange);
    return () => window.removeEventListener('cartCountChanged', handleCartCountChange);
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, log out!',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('cartCount');
        navigate('/');
      }
    });
  };

  return (
    <header className="navbar-header">
      {/* Logo */}
      <div className="navbar-brand">
        <img src={logo} alt="Logo" className="navbar-logo" />
      </div>

      {/* Center Menu */}
      <nav className={`navbar-links ${isOpen ? 'open' : ''}`}>
        <Link
          to="/customer-dashboard"
          className={location.pathname === '/customer-dashboard' ? 'active' : ''}
        >
          DASHBOARD
        </Link>

        <div
          className="navbar-dropdown"
          onMouseEnter={() => setTransactionsDropdownOpen(true)}
          onMouseLeave={() => setTransactionsDropdownOpen(false)}
        >
          <span className="navbar-dropdown-title">
            TRANSACTIONS
            {transactionsDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
          </span>

          {transactionsDropdownOpen && (
            <div className="navbar-dropdown-content">
              <Link to="/customer-estimation">Estimation</Link>
              <Link to="/product-catalog">Product Catalog</Link>
            </div>
          )}
        </div>

        <div
          className="navbar-dropdown"
          onMouseEnter={() => setReportsDropdownOpen(true)}
          onMouseLeave={() => setReportsDropdownOpen(false)}
        >
          <span className="navbar-dropdown-title">
            REPORTS
            {reportsDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
          </span>
        </div>
      </nav>

      {/* Right Section */}
      <div className="navbar-right-section">
        {/* CART */}
        <div
          className="navbar-cart-container"
          onClick={() => navigate('/cart-catalog')}
        >
          <FaShoppingCart className="navbar-cart-icon" />
          {cartCount > 0 && (
            <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </div>

        {/* LOGOUT */}
        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt size={16} /> Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
