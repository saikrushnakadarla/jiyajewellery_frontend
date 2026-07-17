import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaSignOutAlt, FaClipboardList } from 'react-icons/fa';
import logo from '../images/jiya_logo.png';
import './CustomerNavbar.css';
import Swal from 'sweetalert2';
import baseURL from '../../Modules/ApiUrl/NodeBaseURL';

function CustomerNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [orderCartCount, setOrderCartCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch regular cart count
  const fetchCartCount = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        const response = await fetch(`${baseURL}/api/cart/summary/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const count = data.summary.total_quantity || 0;
            localStorage.setItem('cartCount', count.toString());
            setCartCount(count);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  // Fetch order cart count (for Selected/Ordered products)
  const fetchOrderCartCount = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        const response = await fetch(`${baseURL}/api/order-cart/summary/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const count = data.summary.total_quantity || 0;
            localStorage.setItem('orderCartCount', count.toString());
            setOrderCartCount(count);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching order cart count:', error);
    }
  };

  // Fetch completed orders count
  const fetchOrderCount = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        const response = await fetch(`${baseURL}/get/customer-orders-count/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const count = data.count || 0;
            localStorage.setItem('orderCount', count.toString());
            setOrderCount(count);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching order count:', error);
    }
  };


  const toggleMenu = () => {
  setIsOpen(!isOpen);
};

const handleItemClick = () => {
  setIsOpen(false);
};

  useEffect(() => {
    // Initial fetch
    fetchCartCount();
    fetchOrderCartCount();
    fetchOrderCount();
    
    // Event handlers for cart count changes
    const handleCartCountChange = () => {
      const newCount = parseInt(localStorage.getItem('cartCount') || '0');
      setCartCount(newCount);
    };

    const handleOrderCartCountChange = () => {
      const newCount = parseInt(localStorage.getItem('orderCartCount') || '0');
      setOrderCartCount(newCount);
    };

    const handleOrderCountChange = () => {
      const newCount = parseInt(localStorage.getItem('orderCount') || '0');
      setOrderCount(newCount);
    };

    const handleOrderPlaced = () => {
      fetchOrderCount(); // Refresh order count when a new order is placed
      fetchOrderCartCount(); // Also refresh order cart count
    };

    // Add event listeners
    window.addEventListener('cartCountChanged', handleCartCountChange);
    window.addEventListener('orderCartCountChanged', handleOrderCartCountChange);
    window.addEventListener('orderCountChanged', handleOrderCountChange);
    window.addEventListener('orderPlaced', handleOrderPlaced);
    
    // Refresh counts when user is logged in
    const userString = localStorage.getItem('user');
    if (userString) {
      fetchCartCount();
      fetchOrderCartCount();
      fetchOrderCount();
    }
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('cartCountChanged', handleCartCountChange);
      window.removeEventListener('orderCartCountChanged', handleOrderCartCountChange);
      window.removeEventListener('orderCountChanged', handleOrderCountChange);
      window.removeEventListener('orderPlaced', handleOrderPlaced);
    };
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
        localStorage.removeItem('orderCartCount');
        localStorage.removeItem('orderCount');
        localStorage.removeItem('user');
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

      <div
        className={`navbar-hamburger ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
      >
        <div className="navbar-bar"></div>
        <div className="navbar-bar"></div>
        <div className="navbar-bar"></div>
      </div>

      {/* Center Menu */}
      <nav className={`navbar-links ${isOpen ? 'open' : ''}`}>
        <Link
          to="/customer-dashboard"
          className={location.pathname === '/customer-dashboard' ? 'active' : ''}
        >
          DASHBOARD
        </Link>

        <Link
          to="/customer-estimation"
          className={location.pathname === '/customer-estimation' ? 'active' : ''}
        >
          SELECTIONS
        </Link>

        <Link
          to="/product-catalog"
          className={location.pathname === '/product-catalog' ? 'active' : ''}
        >
          PRODUCT CATALOG
        </Link>

        <Link
          to="/purchase"
          className={location.pathname === '/purchase' ? 'active' : ''}
        >
          PURCHASE
        </Link>

        <Link
          to="/customerreports"
          className={location.pathname === '/customerreports' ? 'active' : ''}
        >
          REPORTS
        </Link>
      </nav>

      {/* Right Section */}
      <div className="navbar-right-section">
        {/* ORDER CART (Selected/Ordered products) */}
        <div
          className="navbar-order-cart-container"
          onClick={() => navigate('/customer-order-cart')}
          title={`${orderCartCount} ${orderCartCount === 1 ? 'item' : 'items'} in order cart`}
        >
          <FaClipboardList className="navbar-order-cart-icon" />
          {orderCartCount > 0 && (
            <span className="order-cart-badge">{orderCartCount > 99 ? '99+' : orderCartCount}</span>
          )}
        </div>

        {/* REGULAR CART */}
        <div
          className="navbar-cart-container"
          onClick={() => navigate('/cart-catalog')}
          title={`${cartCount} ${cartCount === 1 ? 'item' : 'items'} in cart`}
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

export default CustomerNavbar;