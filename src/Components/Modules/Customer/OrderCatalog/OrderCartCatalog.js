// OrderCartCatalog.js - Fixed API endpoint
import React, { useState, useEffect } from 'react';
import CustomerNavbar from "../../../Pages/Navbar/CustomerNavbar";
import './OrderCartCatalog.css';
import { FaChevronLeft, FaChevronRight, FaTimes, FaTrash, FaShoppingCart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import baseURL from '../../ApiUrl/NodeBaseURL';

const OrderCartCatalog = () => {
  const [orderCartItems, setOrderCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isRemovingFromCart, setIsRemovingFromCart] = useState({});
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalCurrentIndex, setModalCurrentIndex] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrderCartItems();
  }, []);

  const fetchOrderCartItems = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        setError('Please login to view order cart');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userString);
      
      const response = await fetch(`${baseURL}/api/order-cart/user/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order cart items');
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Order cart items:', data.order_cart_items);

        const initialIndexes = {};
        data.order_cart_items.forEach(item => {
          if (item.product.images && item.product.images.length > 0) {
            initialIndexes[item.product_id] = 0;
          }
        });
        
        setCurrentImageIndexes(initialIndexes);
        setOrderCartItems(data.order_cart_items);
      } else {
        throw new Error(data.message || 'Failed to load order cart');
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(price);
  };

  const getImageUrl = (imageFilename) => {
    return `${baseURL}/uploads/products/${imageFilename}`;
  };

  // Remove item from order cart
  const handleRemoveFromCart = async (orderCartId, productId) => {
    setIsRemovingFromCart(prev => ({ ...prev, [orderCartId]: true }));

    try {
      const response = await fetch(`${baseURL}/api/order-cart/remove/${orderCartId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setOrderCartItems(prev => prev.filter(item => item.order_cart_id !== orderCartId));
        updateOrderCartCountInLocalStorage(-1);
        alert('Product removed from order cart successfully!');
      } else {
        alert(data.message || 'Failed to remove from order cart');
      }
    } catch (error) {
      console.error('Error removing from order cart:', error);
      alert('Error removing product from order cart. Please try again.');
    } finally {
      setIsRemovingFromCart(prev => ({ ...prev, [orderCartId]: false }));
    }
  };

  const updateOrderCartCountInLocalStorage = (change) => {
    const currentCount = parseInt(localStorage.getItem('orderCartCount') || '0');
    const newCount = Math.max(0, currentCount + change);
    localStorage.setItem('orderCartCount', newCount.toString());
    window.dispatchEvent(new Event('orderCartCountChanged'));
  };

  // Helper function to generate estimate number
  const generateEstimateNumber = async () => {
    try {
      const response = await fetch(`${baseURL}/lastEstimateNumber`);
      if (response.ok) {
        const data = await response.json();
        return data.lastEstimateNumber;
      }
    } catch (error) {
      console.warn('Could not fetch last estimate number, using fallback:', error);
    }
    const timestamp = Date.now().toString().slice(-6);
    return `EST${timestamp}`;
  };

  // Create order from all items in order cart - FIXED API ENDPOINT
  const handleCreateOrder = async () => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      alert('Please login to place order');
      return;
    }
    
    const user = JSON.parse(userString);
    
    if (user.role !== 'Customer') {
      alert('Only customers can place orders');
      return;
    }

    if (orderCartItems.length === 0) {
      alert('Your order cart is empty');
      return;
    }

    setIsCreatingOrder(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const estimateNumber = await generateEstimateNumber();
      
      // Calculate totals
      let totalAmount = 0;
      
      // Create repeatedData array for all products
      const repeatedData = orderCartItems.map(item => {
        const product = item.product;
        const itemTotal = parseFloat(product.total_price) * (item.quantity || 1);
        totalAmount += itemTotal;
        
        return {
          product_id: product.product_id,
          product_name: product.product_name,
          barcode: product.barcode || '',
          metal_type: product.metal_type || 'Gold',
          design_name: product.design || product.design_name || '',
          purity: product.purity || '22K',
          category: product.category || '',
          sub_category: product.sub_category || '',
          gross_weight: parseFloat(product.gross_wt) || 0,
          net_wt: parseFloat(product.net_wt) || 0,
          stone_weight: parseFloat(product.stone_wt) || 0,
          stone_price: parseFloat(product.stone_price) || 0,
          making_charges: parseFloat(product.making_charges) || 0,
          tax_percent: parseFloat(product.tax_percent) || 0,
          tax_amt: parseFloat(product.tax_amt) || 0,
          rate: parseFloat(product.rate) || 0,
          total_price: parseFloat(product.total_price) || 0,
          images: product.images || [],
          quantity: item.quantity || 1,
          qty: item.quantity || 1,
          pcode: product.pcode || '',
          salesperson_id: '',
          weight_bw: 0,
          va_on: '',
          va_percent: 0,
          wastage_weight: 0,
          msp_va_percent: 0,
          msp_wastage_weight: 0,
          total_weight_av: parseFloat(product.gross_wt) || 0,
          mc_on: '',
          mc_per_gram: 0,
          rate_amt: parseFloat(product.total_price) || 0,
          pricing: 'standard',
          pieace_cost: parseFloat(product.total_price) || 0,
          disscount_percentage: 0,
          disscount: 0,
          hm_charges: 0,
          total_amount: itemTotal,
          taxable_amount: itemTotal,
          tax_amount: 0,
          net_amount: itemTotal,
          original_total_price: parseFloat(product.total_price) || 0,
          opentag_id: 0,
          code: product.barcode || '',
          // Required for estimate
          date: today,
          estimate_number: estimateNumber,
          estimate_status: 'Ordered',
          source_by: 'customer',
          customer_id: user.id,
          customer_name: user.name
        };
      });

      // Send to correct endpoint: /add/estimate with force_insert flag
      const response = await fetch(`${baseURL}/add/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          force_insert: true, // This will force insert without checking for duplicates
          estimate_number: estimateNumber,
          date: today,
          source_by: 'customer',
          customer_id: user.id,
          customer_name: user.name,
          total_amount: totalAmount,
          net_amount: totalAmount,
          taxable_amount: totalAmount,
          tax_amount: 0,
          disscount: 0,
          disscount_percentage: 0,
          hm_charges: 0,
          repeatedData: repeatedData
        })
      });

      const data = await response.json();

      if (data.success) {
        // Clear order cart items from backend
        for (const item of orderCartItems) {
          try {
            await fetch(`${baseURL}/api/order-cart/remove/${item.order_cart_id}`, {
              method: 'DELETE'
            });
          } catch (removeError) {
            console.warn('Error removing from order cart:', removeError);
          }
        }
        
        // Clear local state
        setOrderCartItems([]);
        
        // Update counts
        const currentCount = parseInt(localStorage.getItem('orderCount') || '0');
        localStorage.setItem('orderCount', (currentCount + orderCartItems.length).toString());
        localStorage.setItem('orderCartCount', '0');
        window.dispatchEvent(new Event('orderCountChanged'));
        window.dispatchEvent(new Event('orderCartCountChanged'));
        
        // Store the estimate number for reference
        localStorage.setItem('lastEstimateNumber', data.estimate_number || estimateNumber);
        
        alert(`Order created successfully! Order Number: ${data.estimate_number || estimateNumber}`);
        
        // Navigate to customer estimates page
        navigate('/customer-estimates');
      } else {
        alert(data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again. Details: ' + (error.message || 'Unknown error'));
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Place order for single item - FIXED API ENDPOINT
  const handlePlaceSingleOrder = async (item) => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      alert('Please login to place order');
      return;
    }
    
    const user = JSON.parse(userString);
    
    if (user.role !== 'Customer') {
      alert('Only customers can place orders');
      return;
    }

    setIsCreatingOrder(true);

    try {
      const product = item.product;
      const today = new Date().toISOString().split('T')[0];
      const estimateNumber = await generateEstimateNumber();
      const itemTotal = parseFloat(product.total_price) * (item.quantity || 1);

      const productData = {
        product_id: product.product_id,
        product_name: product.product_name,
        barcode: product.barcode || '',
        metal_type: product.metal_type || 'Gold',
        design_name: product.design || product.design_name || '',
        purity: product.purity || '22K',
        category: product.category || '',
        sub_category: product.sub_category || '',
        gross_weight: parseFloat(product.gross_wt) || 0,
        net_wt: parseFloat(product.net_wt) || 0,
        stone_weight: parseFloat(product.stone_wt) || 0,
        stone_price: parseFloat(product.stone_price) || 0,
        making_charges: parseFloat(product.making_charges) || 0,
        tax_percent: parseFloat(product.tax_percent) || 0,
        tax_amt: parseFloat(product.tax_amt) || 0,
        rate: parseFloat(product.rate) || 0,
        total_price: parseFloat(product.total_price) || 0,
        images: product.images || [],
        quantity: item.quantity || 1,
        qty: item.quantity || 1,
        pcode: product.pcode || '',
        salesperson_id: '',
        weight_bw: 0,
        va_on: '',
        va_percent: 0,
        wastage_weight: 0,
        msp_va_percent: 0,
        msp_wastage_weight: 0,
        total_weight_av: parseFloat(product.gross_wt) || 0,
        mc_on: '',
        mc_per_gram: 0,
        rate_amt: parseFloat(product.total_price) || 0,
        pricing: 'standard',
        pieace_cost: parseFloat(product.total_price) || 0,
        disscount_percentage: 0,
        disscount: 0,
        hm_charges: 0,
        total_amount: itemTotal,
        taxable_amount: itemTotal,
        tax_amount: 0,
        net_amount: itemTotal,
        original_total_price: parseFloat(product.total_price) || 0,
        opentag_id: 0,
        code: product.barcode || '',
        date: today,
        estimate_number: estimateNumber,
        estimate_status: 'Ordered',
        source_by: 'customer',
        customer_id: user.id,
        customer_name: user.name
      };

      // Send to correct endpoint: /add/estimate with force_insert flag
      const response = await fetch(`${baseURL}/add/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          force_insert: true,
          estimate_number: estimateNumber,
          date: today,
          source_by: 'customer',
          customer_id: user.id,
          customer_name: user.name,
          total_amount: itemTotal,
          net_amount: itemTotal,
          taxable_amount: itemTotal,
          tax_amount: 0,
          disscount: 0,
          disscount_percentage: 0,
          hm_charges: 0,
          repeatedData: [productData]
        })
      });

      const data = await response.json();

      if (data.success) {
        // Remove the item from order cart
        try {
          await fetch(`${baseURL}/api/order-cart/remove/${item.order_cart_id}`, {
            method: 'DELETE'
          });
        } catch (removeError) {
          console.warn('Error removing from order cart:', removeError);
        }
        
        // Update local state
        setOrderCartItems(prev => prev.filter(i => i.order_cart_id !== item.order_cart_id));
        
        // Update counts
        const currentOrderCount = parseInt(localStorage.getItem('orderCount') || '0');
        localStorage.setItem('orderCount', (currentOrderCount + 1).toString());
        window.dispatchEvent(new Event('orderCountChanged'));
        
        const currentOrderCartCount = parseInt(localStorage.getItem('orderCartCount') || '0');
        localStorage.setItem('orderCartCount', Math.max(0, currentOrderCartCount - 1).toString());
        window.dispatchEvent(new Event('orderCartCountChanged'));
        
        localStorage.setItem('lastEstimateNumber', data.estimate_number || estimateNumber);
        
        alert('Order placed successfully!');
        
        // Navigate to customer estimates page
        navigate('/customer-estimates');
      } else {
        alert(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again. Details: ' + (error.message || 'Unknown error'));
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const nextImage = (productId, e) => {
    e?.stopPropagation();
    const item = orderCartItems.find(item => item.product_id === productId);
    if (!item || !item.product.images) return;
    
    setCurrentImageIndexes(prev => ({
      ...prev,
      [productId]: (prev[productId] + 1) % item.product.images.length
    }));
  };

  const prevImage = (productId, e) => {
    e?.stopPropagation();
    const item = orderCartItems.find(item => item.product_id === productId);
    if (!item || !item.product.images) return;
    
    setCurrentImageIndexes(prev => ({
      ...prev,
      [productId]: (prev[productId] - 1 + item.product.images.length) % item.product.images.length
    }));
  };

  const openModal = (item) => {
    if (item.product.images && item.product.images.length > 0) {
      setModalProduct(item);
      setModalCurrentIndex(currentImageIndexes[item.product_id] || 0);
      setIsModalOpen(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalProduct(null);
    document.body.style.overflow = 'auto';
  };

  const nextModalImage = () => {
    if (!modalProduct || !modalProduct.product.images) return;
    setModalCurrentIndex((prevIndex) => 
      (prevIndex + 1) % modalProduct.product.images.length
    );
  };

  const prevModalImage = () => {
    if (!modalProduct || !modalProduct.product.images) return;
    setModalCurrentIndex((prevIndex) => 
      (prevIndex - 1 + modalProduct.product.images.length) % modalProduct.product.images.length
    );
  };

  const goToModalImage = (index) => {
    if (!modalProduct || !modalProduct.product.images) return;
    setModalCurrentIndex(index);
  };

  const calculateTotal = () => {
    return orderCartItems.reduce((total, item) => {
      return total + (item.product.total_price * item.quantity);
    }, 0);
  };

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isModalOpen]);

  if (loading) {
    return (
      <div>
        <CustomerNavbar />
        <div className="order-cart-loading-container">
          <div className="order-cart-loading-spinner"></div>
          <p>Loading order cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <CustomerNavbar />
        <div className="order-cart-error-container">
          <p>Error: {error}</p>
          <button onClick={fetchOrderCartItems}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-cart-page">
      <CustomerNavbar />

      <div className="order-cart-container">
        <h2 className="order-cart-title">Your Order Cart</h2>
        
        {orderCartItems.length === 0 ? (
          <div className="order-cart-empty-message">
            <p>Your order cart is empty</p>
            <button 
              className="order-cart-shop-btn"
              onClick={() => navigate('/product-catalog')}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="order-cart-summary">
              <div className="order-cart-summary-item">
                <span>Total Items:</span>
                <span>{orderCartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="order-cart-summary-item">
                <span>Subtotal:</span>
                <span className="order-cart-total-price">{formatPrice(calculateTotal())}</span>
              </div>
              <button 
                className="order-cart-checkout-btn"
                onClick={handleCreateOrder}
                disabled={isCreatingOrder}
              >
                {isCreatingOrder ? 'Processing...' : 'Place All Orders'}
              </button>
            </div>

            <div className="order-cart-grid">
              {orderCartItems.map((item) => {
                const hasImages = item.product.images && item.product.images.length > 0;
                const currentIndex = currentImageIndexes[item.product_id] || 0;
                const isRemoving = isRemovingFromCart[item.order_cart_id] || false;
                
                return (
                  <div key={item.order_cart_id} className="order-cart-card">
                    <div className="order-cart-image-container">
                      {hasImages ? (
                        <div className="order-cart-image-carousel">
                          <img 
                            src={getImageUrl(item.product.images[currentIndex])}
                            alt={`${item.product.product_name} - ${currentIndex + 1}`}
                            className="order-cart-image"
                            onClick={() => openModal(item)}
                          />
                          
                          {item.product.images.length > 1 && (
                            <>
                              <button 
                                className="order-cart-nav-arrow order-cart-nav-arrow-left"
                                onClick={(e) => nextImage(item.product_id, e)}
                              >
                                <FaChevronLeft />
                              </button>
                              <button 
                                className="order-cart-nav-arrow order-cart-nav-arrow-right"
                                onClick={(e) => nextImage(item.product_id, e)}
                              >
                                <FaChevronRight />
                              </button>
                            </>
                          )}
                          
                          {item.product.images.length > 1 && (
                            <div className="order-cart-image-counter">
                              {currentIndex + 1} / {item.product.images.length}
                            </div>
                          )}
                          
                          {item.product.images.length > 1 && (
                            <div className="order-cart-image-dots">
                              {item.product.images.map((_, index) => (
                                <button
                                  key={index}
                                  className={`order-cart-dot ${index === currentIndex ? 'order-cart-dot-active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndexes(prev => ({
                                      ...prev,
                                      [item.product_id]: index
                                    }));
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="order-cart-no-image">
                          <span>No Image Available</span>
                        </div>
                      )}
                    </div>

                    <div className="order-cart-details">
                      <h3 className="order-cart-name">{item.product.product_name}</h3>
                      <p className="order-cart-barcode">Barcode: {item.product.barcode}</p>
                      
                      <div className="order-cart-status-badge">
                        Status: {item.product.status}
                      </div>

                      <div className="order-cart-quantity">
                        <span>Quantity: {item.quantity}</span>
                      </div>

                      <div className="order-cart-spec-row">
                        <span className="order-cart-spec-label">Weight:</span>
                        <span className="order-cart-spec-value">
                          Gross: {item.product.gross_wt}g | Net: {item.product.net_wt}g
                        </span>
                      </div>

                      <div className="order-cart-pricing-section">
                        {item.product.making_charges > 0 && (
                          <div className="order-cart-price-row">
                            <span>Making Charges:</span>
                            <span>{formatPrice(parseFloat(item.product.making_charges))}</span>
                          </div>
                        )}
                        
                        {item.product.stone_price > 0 && (
                          <div className="order-cart-price-row">
                            <span>Stone Price:</span>
                            <span>{formatPrice(parseFloat(item.product.stone_price))}</span>
                          </div>
                        )}
                        
                        {item.product.tax_amt > 0 && (
                          <div className="order-cart-price-row">
                            <span>Tax ({item.product.tax_percent}%):</span>
                            <span>{formatPrice(parseFloat(item.product.tax_amt))}</span>
                          </div>
                        )}
                        
                        <div className="order-cart-price-row order-cart-unit-price">
                          <span>Unit Price:</span>
                          <span className="order-cart-price-amount">
                            {formatPrice(parseFloat(item.product.total_price))}
                          </span>
                        </div>
                        
                        <div className="order-cart-price-row order-cart-total">
                          <span>Total ({item.quantity} × {formatPrice(parseFloat(item.product.total_price))}):</span>
                          <span className="order-cart-total-amount">
                            {formatPrice(parseFloat(item.product.total_price) * item.quantity)}
                          </span>
                        </div>
                      </div>

                      <div className="order-cart-actions">
                        <button 
                          className="order-cart-remove-btn"
                          onClick={() => handleRemoveFromCart(item.order_cart_id, item.product_id)}
                          disabled={isRemoving}
                        >
                          {isRemoving ? (
                            'Removing...'
                          ) : (
                            <>
                              <FaTrash /> Remove
                            </>
                          )}
                        </button>
                        <button 
                          className="order-cart-order-now-btn"
                          onClick={() => handlePlaceSingleOrder(item)}
                          disabled={isCreatingOrder}
                        >
                          {isCreatingOrder ? 'Processing...' : 'Order Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal Popup for Image Carousel */}
      {isModalOpen && modalProduct && (
        <div className="order-cart-modal-overlay" onClick={closeModal}>
          <div className="order-cart-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="order-cart-modal-close-btn" onClick={closeModal}>
              <FaTimes />
            </button>
            
            <div className="order-cart-modal-carousel">
              <img 
                src={getImageUrl(modalProduct.product.images[modalCurrentIndex])}
                alt={modalProduct.product.product_name}
                className="order-cart-modal-image"
              />
              
              {modalProduct.product.images.length > 1 && (
                <>
                  <button 
                    className="order-cart-modal-nav-arrow order-cart-modal-nav-arrow-left"
                    onClick={prevModalImage}
                  >
                    <FaChevronLeft />
                  </button>
                  <button 
                    className="order-cart-modal-nav-arrow order-cart-modal-nav-arrow-right"
                    onClick={nextModalImage}
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
              
              {modalProduct.product.images.length > 1 && (
                <div className="order-cart-modal-image-counter">
                  {modalCurrentIndex + 1} / {modalProduct.product.images.length}
                </div>
              )}
              
              {modalProduct.product.images.length > 1 && (
                <div className="order-cart-modal-image-dots">
                  {modalProduct.product.images.map((_, index) => (
                    <button
                      key={index}
                      className={`order-cart-modal-dot ${index === modalCurrentIndex ? 'order-cart-modal-dot-active' : ''}`}
                      onClick={() => goToModalImage(index)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="order-cart-modal-product-info">
              <h3 className="order-cart-modal-product-name">{modalProduct.product.product_name}</h3>
              <p className="order-cart-modal-product-barcode">Barcode: {modalProduct.product.barcode}</p>
              <div className="order-cart-modal-spec-row">
                <span>Quantity:</span>
                <span>{modalProduct.quantity}</span>
              </div>
              <div className="order-cart-modal-spec-row">
                <span>Weight:</span>
                <span>Gross: {modalProduct.product.gross_wt}g | Net: {modalProduct.product.net_wt}g</span>
              </div>
              <div className="order-cart-modal-price">
                Total Price: {formatPrice(parseFloat(modalProduct.product.total_price) * modalProduct.quantity)}
              </div>
              <div className="order-cart-modal-actions">
                <button 
                  className="order-cart-modal-remove"
                  onClick={() => {
                    handleRemoveFromCart(modalProduct.order_cart_id, modalProduct.product_id);
                    closeModal();
                  }}
                  disabled={isRemovingFromCart[modalProduct.order_cart_id]}
                >
                  {isRemovingFromCart[modalProduct.order_cart_id] ? 'Removing...' : (
                    <><FaTrash /> Remove</>
                  )}
                </button>
                <button 
                  className="order-cart-modal-order-now"
                  onClick={() => {
                    handlePlaceSingleOrder(modalProduct);
                    closeModal();
                  }}
                  disabled={isCreatingOrder}
                >
                  {isCreatingOrder ? 'Processing...' : 'Order Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCartCatalog;