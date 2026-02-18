import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaChevronDown, FaChevronUp, FaSignOutAlt } from 'react-icons/fa';
import logo from '../images/jiya_logo.png';
import './CustomerNavbar.css';
import Swal from 'sweetalert2';

function CustomerNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [transactionsDropdownOpen, setTransactionsDropdownOpen] = useState(false);
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchCartCount = async () => {
    try {
      const userString = localStorage.getItem('user')
      if (userString) {
        const user = JSON.parse(userString)
        const response = await fetch(`http://localhost:5000/api/cart/summary/${user.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const count = data.summary.total_quantity || 0
            localStorage.setItem('cartCount', count.toString())
            setCartCount(count)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching cart count:', error)
    }
  }

  useEffect(() => {
    // Fetch cart count on component mount
    fetchCartCount()
    
    // Listen for cart count changes
    const handleCartCountChange = () => {
      const newCount = parseInt(localStorage.getItem('cartCount') || '0')
      setCartCount(newCount)
    };

    window.addEventListener('cartCountChanged', handleCartCountChange)
    
    // Also fetch cart count when user data might be available
    const userString = localStorage.getItem('user')
    if (userString) {
      fetchCartCount()
    }
    
    return () => {
      window.removeEventListener('cartCountChanged', handleCartCountChange)
    }
  }, [])

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, log out!',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('cartCount')
        localStorage.removeItem('user')
        navigate('/')
      }
    })
  }

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
              <Link to="/purchase">Purchase</Link>
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
          
          {/* You can add report links here when needed */}
          {reportsDropdownOpen && (
            <div className="navbar-dropdown-content">
              {/* Add report links here in the future */}
            </div>
          )}
        </div>
      </nav>

      {/* Right Section */}
      <div className="navbar-right-section">
        {/* CART */}
        <div
          className="navbar-cart-container"
          onClick={() => navigate('/cart-catalog')}
          title={`${cartCount} items in cart`}
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
  )
}

export default CustomerNavbar