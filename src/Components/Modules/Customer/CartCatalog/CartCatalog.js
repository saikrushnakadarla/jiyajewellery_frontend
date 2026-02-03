import React, { useState, useEffect } from 'react';
import CustomerNavbar from "../../../Pages/Navbar/CustomerNavbar";
import './CartCatalog.css';
import { FaChevronLeft, FaChevronRight, FaTimes, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CartCatalog = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalCurrentIndex, setModalCurrentIndex] = useState(0);
  
  // Removal state
  const [isRemovingFromCart, setIsRemovingFromCart] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        setError('Please login to view cart');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userString);
      
      const response = await fetch(`http://localhost:5000/api/cart/user/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cart items');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Log the full cart item structure so you can see exactly what fields are returned
        console.log('Full cart_items response:', JSON.stringify(data.cart_items, null, 2));

        // Initialize current image index for each product with images
        const initialIndexes = {};
        data.cart_items.forEach(item => {
          if (item.product.images && item.product.images.length > 0) {
            initialIndexes[item.product_id] = 0;
          }
        });
        
        setCurrentImageIndexes(initialIndexes);
        setCartItems(data.cart_items);
      } else {
        throw new Error(data.message || 'Failed to load cart');
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
    return `http://localhost:5000/uploads/products/${imageFilename}`;
  };

  // Remove from cart function
  const handleRemoveFromCart = async (cartId, productId) => {
    setIsRemovingFromCart(prev => ({ ...prev, [cartId]: true }));

    try {
      const response = await fetch(`http://localhost:5000/api/cart/remove/${cartId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        // Remove item from local state
        setCartItems(prev => prev.filter(item => item.cart_id !== cartId));
        
        // Update cart count in localStorage to trigger navbar update
        updateCartCountInLocalStorage(-1);
        
        alert('Product removed from cart successfully!');
      } else {
        alert(data.message || 'Failed to remove from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Error removing product from cart. Please try again.');
    } finally {
      setIsRemovingFromCart(prev => ({ ...prev, [cartId]: false }));
    }
  };

  const updateCartCountInLocalStorage = (change) => {
    const currentCount = parseInt(localStorage.getItem('cartCount') || '0');
    const newCount = Math.max(0, currentCount + change);
    localStorage.setItem('cartCount', newCount.toString());
    // Dispatch custom event to notify navbar
    window.dispatchEvent(new Event('cartCountChanged'));
  };

  // ---------------------------------------------------------------
  // FIX: handleOrderNow now reads from item.product correctly and
  // also fetches the full product from the /get/products endpoint
  // as a fallback so that fields like rate, stone_wt, metal_type,
  // design, purity are always included — matching ProductCatalog.
  // ---------------------------------------------------------------
 


  // Fixed handleOrderNow function in CartCatalog.js
const handleOrderNow = async (cartItem) => {
  const userString = localStorage.getItem('user');
  if (!userString) {
    alert('Please login to place an order');
    return;
  }
  
  const user = JSON.parse(userString);
  
  if (user.role !== 'Customer') {
    alert('Only customers can place orders');
    return;
  }

  try {
    // cartItem here is the full cart row
    const product = cartItem.product;

    // Fallback: fetch the full product details
    let fullProduct = product;
    try {
      const res = await fetch(`http://localhost:5000/get/products`);
      if (res.ok) {
        const allProducts = await res.json();
        const found = allProducts.find(p => p.product_id === cartItem.product_id);
        if (found) {
          fullProduct = found;
        }
      }
    } catch (err) {
      console.warn('Could not fetch full product details, using cart data:', err);
    }

    // Store product data in localStorage for the estimate form
    const productData = {
      product_id: fullProduct.product_id,
      product_name: fullProduct.product_name,
      barcode: fullProduct.barcode || '',
      metal_type: fullProduct.metal_type || 'Gold',
      design: fullProduct.design || '',
      design_name: fullProduct.design || fullProduct.design_name || '', // Add design_name
      purity: fullProduct.purity || '22K',
      gross_weight: parseFloat(fullProduct.gross_wt) || 0, // Changed from gross_wt to gross_weight
      net_wt: parseFloat(fullProduct.net_wt) || 0,
      stone_weight: parseFloat(fullProduct.stone_wt) || 0, // Changed from stone_wt to stone_weight
      stone_price: parseFloat(fullProduct.stone_price) || 0,
      making_charges: parseFloat(fullProduct.making_charges) || 0,
      tax_percent: parseFloat(fullProduct.tax_percent) || 0,
      tax_amt: parseFloat(fullProduct.tax_amt) || 0,
      rate: parseFloat(fullProduct.rate) || 0,
      total_price: parseFloat(fullProduct.total_price) || 0,
      images: fullProduct.images || [],
      customer_id: user.id,
      customer_name: user.name,
      quantity: cartItem.quantity || 1,
      
      // CRITICAL: Add these fields for order number generation
      estimate_status: 'Ordered',
      source_by: 'customer',
      date: new Date().toISOString().split('T')[0], // Today's date
      
      // Add other required fields for estimate creation
      pcode: fullProduct.pcode || '',
      category: fullProduct.category || '',
      sub_category: fullProduct.sub_category || '',
      salesperson_id: '', // Empty for customer orders
      weight_bw: 0,
      va_on: '',
      va_percent: 0,
      wastage_weight: 0,
      msp_va_percent: 0,
      msp_wastage_weight: 0,
      total_weight_av: 0,
      mc_on: '',
      mc_per_gram: 0,
      rate_amt: parseFloat(fullProduct.total_price) || 0,
      pricing: 'standard',
      pieace_cost: parseFloat(fullProduct.total_price) || 0,
      disscount_percentage: 0,
      disscount: 0,
      hm_charges: 0,
      total_amount: parseFloat(fullProduct.total_price) * (cartItem.quantity || 1),
      taxable_amount: 0,
      tax_amount: 0,
      net_amount: parseFloat(fullProduct.total_price) * (cartItem.quantity || 1),
      original_total_price: parseFloat(fullProduct.total_price) || 0,
      opentag_id: 0,
      qty: cartItem.quantity || 1
    };

    console.log('Storing cart product data for estimate form:', productData);

    // Store in localStorage
    localStorage.setItem('quickOrderProduct', JSON.stringify(productData));
    
    // Optionally remove item from cart after selecting for order
    const removeResponse = await fetch(`http://localhost:5000/api/cart/remove/${cartItem.cart_id}`, {
      method: 'DELETE'
    });
    
    if (removeResponse.ok) {
      // Update cart items list
      setCartItems(prev => prev.filter(item => item.cart_id !== cartItem.cart_id));
      updateCartCountInLocalStorage(-1);
    }
    
    // Show message and navigate
    alert('Product selected for ordering! Item removed from cart. Redirecting to estimate form...');
    
    // Navigate to customer estimates page
    navigate('/customer-estimates');
  } catch (error) {
    console.error('Error processing order from cart:', error);
    alert('Error processing order. Please try again.');
  }
};



  const nextImage = (productId, e) => {
    e?.stopPropagation();
    const item = cartItems.find(item => item.product_id === productId);
    if (!item || !item.product.images) return;
    
    setCurrentImageIndexes(prev => ({
      ...prev,
      [productId]: (prev[productId] + 1) % item.product.images.length
    }));
  };

  const prevImage = (productId, e) => {
    e?.stopPropagation();
    const item = cartItems.find(item => item.product_id === productId);
    if (!item || !item.product.images) return;
    
    setCurrentImageIndexes(prev => ({
      ...prev,
      [productId]: (prev[productId] - 1 + item.product.images.length) % item.product.images.length
    }));
  };

  // Modal functions
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

  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
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
        <div className="product-catalog-loading-container">
          <div className="product-catalog-loading-spinner"></div>
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <CustomerNavbar />
        <div className="product-catalog-error-container">
          <p>Error: {error}</p>
          <button onClick={fetchCartItems}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-catalog-page">
      <CustomerNavbar />

      {/* Cart Header */}
      <div className="product-catalog-container">
        <h2 className="product-catalog-title">Your Shopping Cart</h2>
        
        {cartItems.length === 0 ? (
          <div className="cart-empty-message">
            <p>Your cart is empty</p>
            <button 
              className="product-catalog-buy-now-btn"
              onClick={() => navigate('/product-catalog')}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-summary">
              <div className="cart-summary-item">
                <span>Total Items:</span>
                <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="cart-summary-item">
                <span>Subtotal:</span>
                <span className="cart-total-price">{formatPrice(calculateTotal())}</span>
              </div>
              <button 
                className="product-catalog-buy-now-btn"
                onClick={() => alert('Proceed to checkout functionality to be implemented')}
              >
                Proceed to Checkout
              </button>
            </div>

            
            <div className="product-catalog-grid">
              {cartItems.map((item) => {
                const hasImages = item.product.images && item.product.images.length > 0;
                const currentIndex = currentImageIndexes[item.product_id] || 0;
                const isRemoving = isRemovingFromCart[item.cart_id] || false;
                
                return (
                  <div key={item.cart_id} className="product-catalog-card">
                    {/* Product Image Carousel */}
                    <div className="product-catalog-image-container">
                      {hasImages ? (
                        <div className="product-catalog-image-carousel">
                          <img 
                            src={getImageUrl(item.product.images[currentIndex])}
                            alt={`${item.product.product_name} - ${currentIndex + 1}`}
                            className="product-catalog-image"
                            onClick={() => openModal(item)}
                          />
                          
                          {/* Navigation Arrows */}
                          {item.product.images.length > 1 && (
                            <>
                              <button 
                                className="product-catalog-nav-arrow product-catalog-nav-arrow-left"
                                onClick={(e) => prevImage(item.product_id, e)}
                                aria-label="Previous image"
                              >
                                <FaChevronLeft />
                              </button>
                              <button 
                                className="product-catalog-nav-arrow product-catalog-nav-arrow-right"
                                onClick={(e) => nextImage(item.product_id, e)}
                                aria-label="Next image"
                              >
                                <FaChevronRight />
                              </button>
                            </>
                          )}
                          
                          {/* Image Counter */}
                          {item.product.images.length > 1 && (
                            <div className="product-catalog-image-counter">
                              {currentIndex + 1} / {item.product.images.length}
                            </div>
                          )}
                          
                          {/* Image Dots Indicator */}
                          {item.product.images.length > 1 && (
                            <div className="product-catalog-image-dots">
                              {item.product.images.map((_, index) => (
                                <button
                                  key={index}
                                  className={`product-catalog-dot ${index === currentIndex ? 'product-catalog-dot-active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndexes(prev => ({
                                      ...prev,
                                      [item.product_id]: index
                                    }));
                                  }}
                                  aria-label={`Go to image ${index + 1}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="product-catalog-no-image">
                          <span>No Image Available</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="product-catalog-details">
                      <h3 className="product-catalog-name">{item.product.product_name}</h3>
                      <p className="product-catalog-barcode">Barcode: {item.product.barcode}</p>
                      
                      <div className="product-cart-quantity">
                        <span>Quantity: {item.quantity}</span>
                      </div>

                      <div className="product-catalog-spec-row">
                        <span className="product-catalog-spec-label">Weight:</span>
                        <span className="product-catalog-spec-value">
                          Gross: {item.product.gross_wt}g | Net: {item.product.net_wt}g
                        </span>
                      </div>

                      {/* Pricing Details */}
                      <div className="product-catalog-pricing-section">
                        {item.product.making_charges > 0 && (
                          <div className="product-catalog-price-row">
                            <span>Making Charges:</span>
                            <span>{formatPrice(parseFloat(item.product.making_charges))}</span>
                          </div>
                        )}
                        
                        {item.product.stone_price > 0 && (
                          <div className="product-catalog-price-row">
                            <span>Stone Price:</span>
                            <span>{formatPrice(parseFloat(item.product.stone_price))}</span>
                          </div>
                        )}
                        
                        {item.product.tax_amt > 0 && (
                          <div className="product-catalog-price-row">
                            <span>Tax ({item.product.tax_percent}):</span>
                            <span>{formatPrice(parseFloat(item.product.tax_amt))}</span>
                          </div>
                        )}
                        
                        <div className="product-catalog-price-row product-catalog-total-price">
                          <span>Unit Price:</span>
                          <span className="product-catalog-price-amount">
                            {formatPrice(parseFloat(item.product.total_price))}
                          </span>
                        </div>
                        
                        <div className="product-catalog-price-row product-cart-total">
                          <span>Total ({item.quantity} × {formatPrice(parseFloat(item.product.total_price))}):</span>
                          <span className="product-cart-total-amount">
                            {formatPrice(parseFloat(item.product.total_price) * item.quantity)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="product-catalog-actions">
                        <button 
                          className="product-catalog-remove-from-cart-btn"
                          onClick={() => handleRemoveFromCart(item.cart_id, item.product_id)}
                          disabled={isRemoving}
                        >
                          {isRemoving ? (
                            'Removing...'
                          ) : (
                            <>
                              <FaTrash /> Remove from Cart
                            </>
                          )}
                        </button>
                        <button 
                          className="product-catalog-buy-now-btn"
                          onClick={() => handleOrderNow(item)}
                        >
                          Order Now
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
        <div className="product-catalog-modal-overlay" onClick={closeModal}>
          <div className="product-catalog-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="product-catalog-modal-close-btn" onClick={closeModal}>
              <FaTimes />
            </button>
            
            <div className="product-catalog-modal-carousel">
              <img 
                src={getImageUrl(modalProduct.product.images[modalCurrentIndex])}
                alt={`${modalProduct.product.product_name} - ${modalCurrentIndex + 1}`}
                className="product-catalog-modal-image"
              />
              
              {/* Modal Navigation Arrows */}
              {modalProduct.product.images.length > 1 && (
                <>
                  <button 
                    className="product-catalog-modal-nav-arrow product-catalog-modal-nav-arrow-left"
                    onClick={prevModalImage}
                    aria-label="Previous image"
                  >
                    <FaChevronLeft />
                  </button>
                  <button 
                    className="product-catalog-modal-nav-arrow product-catalog-modal-nav-arrow-right"
                    onClick={nextModalImage}
                    aria-label="Next image"
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
              
              {/* Modal Image Counter */}
              {modalProduct.product.images.length > 1 && (
                <div className="product-catalog-modal-image-counter">
                  {modalCurrentIndex + 1} / {modalProduct.product.images.length}
                </div>
              )}
              
              {/* Modal Image Dots */}
              {modalProduct.product.images.length > 1 && (
                <div className="product-catalog-modal-image-dots">
                  {modalProduct.product.images.map((_, index) => (
                    <button
                      key={index}
                      className={`product-catalog-modal-dot ${index === modalCurrentIndex ? 'product-catalog-modal-dot-active' : ''}`}
                      onClick={() => goToModalImage(index)}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Info in Modal */}
            <div className="product-catalog-modal-product-info">
              <h3 className="product-catalog-modal-product-name">{modalProduct.product.product_name}</h3>
              <p className="product-catalog-modal-product-barcode">Barcode: {modalProduct.product.barcode}</p>
              <div className="product-catalog-modal-spec-row">
                <span>Quantity:</span>
                <span>{modalProduct.quantity}</span>
              </div>
              <div className="product-catalog-modal-spec-row">
                <span>Weight:</span>
                <span>Gross: {modalProduct.product.gross_wt}g | Net: {modalProduct.product.net_wt}g</span>
              </div>
              <div className="product-catalog-modal-price">
                Total Price: {formatPrice(parseFloat(modalProduct.product.total_price) * modalProduct.quantity)}
              </div>
              <div className="product-catalog-modal-actions">
                <button 
                  className="product-catalog-modal-remove-from-cart"
                  onClick={() => {
                    handleRemoveFromCart(modalProduct.cart_id, modalProduct.product_id);
                    closeModal();
                  }}
                  disabled={isRemovingFromCart[modalProduct.cart_id]}
                >
                  {isRemovingFromCart[modalProduct.cart_id] ? 'Removing...' : (
                    <><FaTrash /> Remove from Cart</>
                  )}
                </button>
                <button 
                  className="product-catalog-modal-order-now"
                  onClick={() => {
                    handleOrderNow(modalProduct);
                    closeModal();
                  }}
                >
                  Order Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartCatalog;