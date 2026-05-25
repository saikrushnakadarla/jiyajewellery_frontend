import React, { useState, useEffect } from 'react'
import CustomerNavbar from "../../../Pages/Navbar/CustomerNavbar"
import './ProductCatalog.css'
import { FaChevronLeft, FaChevronRight, FaTimes, FaShoppingCart, FaCheck, FaSpinner } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import baseURL from '../../ApiUrl/NodeBaseURL'

const ProductCatalog = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndexes, setCurrentImageIndexes] = useState({})
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalProduct, setModalProduct] = useState(null)
  const [modalCurrentIndex, setModalCurrentIndex] = useState(0)
  
  // Cart state
  const [isAddingToCart, setIsAddingToCart] = useState({})
  const [isAddingToOrderCart, setIsAddingToOrderCart] = useState({})
  const [isOrdering, setIsOrdering] = useState({})
  const [inCartProducts, setInCartProducts] = useState({})
  const [inOrderCartProducts, setInOrderCartProducts] = useState({})
  const [userData, setUserData] = useState(null)
  const [checkingCartStatus, setCheckingCartStatus] = useState(false)
  
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
    loadUserData()
  }, [])

  // Load user data and check cart status
  const loadUserData = async () => {
    try {
      const userString = localStorage.getItem('user')
      if (userString) {
        const user = JSON.parse(userString)
        setUserData(user)
        
        // After setting user data, check cart status
        await checkCartStatus(user.id)
        await checkOrderCartStatus(user.id)
      } else {
        console.warn('No user data found in localStorage')
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  // Check regular cart status for all products
  const checkCartStatus = async (userId) => {
    if (!userId) return
    
    setCheckingCartStatus(true)
    try {
      const response = await fetch(`${baseURL}/api/cart/user/${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const inCartMap = {}
          data.cart_items.forEach(item => {
            inCartMap[item.product_id] = true
          })
          setInCartProducts(inCartMap)
        }
      }
    } catch (error) {
      console.error('Error checking cart status:', error)
    } finally {
      setCheckingCartStatus(false)
    }
  }

  // Check order cart status for all products
  const checkOrderCartStatus = async (userId) => {
    if (!userId) return
    
    try {
      const response = await fetch(`${baseURL}/api/order-cart/user/${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const inOrderCartMap = {}
          data.order_cart_items.forEach(item => {
            inOrderCartMap[item.product_id] = true
          })
          setInOrderCartProducts(inOrderCartMap)
        }
      }
    } catch (error) {
      console.error('Error checking order cart status:', error)
    }
  }

  const fetchCartCount = async () => {
    try {
      const userString = localStorage.getItem('user')
      if (userString) {
        const user = JSON.parse(userString)
        const response = await fetch(`${baseURL}/api/cart/summary/${user.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            localStorage.setItem('cartCount', data.summary.total_quantity.toString())
            window.dispatchEvent(new Event('cartCountChanged'))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching cart count:', error)
    }
  }

  const fetchOrderCartCount = async () => {
    try {
      const userString = localStorage.getItem('user')
      if (userString) {
        const user = JSON.parse(userString)
        const response = await fetch(`${baseURL}/api/order-cart/summary/${user.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            localStorage.setItem('orderCartCount', data.summary.total_quantity.toString())
            window.dispatchEvent(new Event('orderCartCountChanged'))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching order cart count:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${baseURL}/get/products`)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      console.log('Products data:', data)
      
      const initialIndexes = {}
      data.forEach(product => {
        if (product.images && product.images.length > 0) {
          initialIndexes[product.product_id] = 0
        }
      })
      setCurrentImageIndexes(initialIndexes)
      setProducts(data)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(price)
  }

  const getImageUrl = (imageFilename) => {
    return `${baseURL}/uploads/products/${imageFilename}`
  }

  // Get Add to Cart button text based on status
  const getAddToCartButtonText = (product) => {
    if (isAddingToCart[product.product_id]) {
      return <>
        <FaSpinner className="product-catalog-spinner" /> Adding...
      </>
    }
    if (inCartProducts[product.product_id]) {
      return <>
        <FaCheck /> In Cart
      </>
    }
    
    if (product.status === "Available") {
      return <>
        <FaShoppingCart /> Add to Cart
      </>
    } else if (product.status === "Selected" || product.status === "Ordered") {
      return <>
        <FaShoppingCart /> Order Cart
      </>
    }
    
    return <>
      <FaShoppingCart /> Add to Cart
    </>
  }

  // Get Order Cart button text (for Selected/Ordered products)
  const getOrderCartButtonText = (product) => {
    if (isAddingToOrderCart[product.product_id]) {
      return <>
        <FaSpinner className="product-catalog-spinner" /> Adding...
      </>
    }
    if (inOrderCartProducts[product.product_id]) {
      return <>
        <FaCheck /> In Order Cart
      </>
    }
    return <>
      <FaShoppingCart /> Order Cart
    </>
  }

  // Get Order Now button text based on status
  const getOrderNowButtonText = (product) => {
    if (product.status === "Available") {
      return "Buy Now"
    } else if (product.status === "Selected" || product.status === "Ordered") {
      return "Order Now"
    }
    return "Buy Now"
  }

  // Check if buttons should be shown based on status
  const shouldShowButtons = (product) => {
    return product.status === "Available" || 
           product.status === "Selected" || 
           product.status === "Ordered"
  }

  // Add to regular cart - Navigates to /cart-catalog
  const handleAddToCart = async (productId) => {
    if (!userData) {
      alert('Please login to add items to cart')
      return
    }

    if (inCartProducts[productId]) {
      alert('This product is already in your cart')
      navigate('/cart-catalog')
      return
    }

    setIsAddingToCart(prev => ({ ...prev, [productId]: true }))

    try {
      const response = await fetch(`${baseURL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.id,
          product_id: productId,
          quantity: 1
        })
      })

      const data = await response.json()

      if (data.success) {
        setInCartProducts(prev => ({
          ...prev,
          [productId]: true
        }))
        
        await fetchCartCount()
        alert('Product added to cart successfully!')
        navigate('/cart-catalog')
      } else {
        alert(data.message || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Error adding product to cart. Please try again.')
    } finally {
      setIsAddingToCart(prev => ({ ...prev, [productId]: false }))
    }
  }

  // Add to order cart - Navigates to /customer-order-cart (NOT /customer-orders)
  const handleAddToOrderCart = async (productId) => {
    if (!userData) {
      alert('Please login to add items to order cart')
      return
    }

    if (inOrderCartProducts[productId]) {
      alert('This product is already in your order cart')
      navigate('/customer-order-cart')
      return
    }

    setIsAddingToOrderCart(prev => ({ ...prev, [productId]: true }))

    try {
      const response = await fetch(`${baseURL}/api/order-cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.id,
          product_id: productId,
          quantity: 1
        })
      })

      const data = await response.json()

      if (data.success) {
        setInOrderCartProducts(prev => ({
          ...prev,
          [productId]: true
        }))
        
        await fetchOrderCartCount()
        alert('Product added to order cart successfully!')
        // Navigate to order cart page (not orders history)
        navigate('/customer-order-cart')
      } else {
        alert(data.message || 'Failed to add to order cart')
      }
    } catch (error) {
      console.error('Error adding to order cart:', error)
      alert('Error adding product to order cart. Please try again.')
    } finally {
      setIsAddingToOrderCart(prev => ({ ...prev, [productId]: false }))
    }
  }

  // Handle Order Cart button click (for Selected/Ordered products) - Adds to order cart
  const handleOrderCartClick = async (product) => {
    await handleAddToOrderCart(product.product_id)
  }

  // Handle Buy Now button click (for Available products) - Creates order directly
  const handleBuyNow = async (product) => {
    if (!userData) {
      alert('Please login to place an order');
      return;
    }
    
    if (userData.role !== 'Customer') {
      alert('Only customers can place orders');
      return;
    }

    setIsOrdering(prev => ({ ...prev, [product.product_id]: true }));

    try {
      const productData = {
        product_id: product.product_id,
        product_name: product.product_name,
        barcode: product.barcode || '',
        metal_type: product.metal_type || 'Gold',
        design: product.design || '',
        design_name: product.design || product.design_name || '',
        purity: product.purity || '22K',
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
        customer_id: userData.id,
        customer_name: userData.name,
        quantity: 1,
        estimate_status: 'Ordered',
        source_by: 'customer',
        date: new Date().toISOString().split('T')[0],
        order_date: new Date().toISOString().split('T')[0],
        pcode: product.pcode || '',
        category: product.category || '',
        sub_category: product.sub_category || '',
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
        total_amount: parseFloat(product.total_price) || 0,
        taxable_amount: parseFloat(product.total_price) || 0,
        tax_amount: 0,
        net_amount: parseFloat(product.total_price) || 0,
        original_total_price: parseFloat(product.total_price) || 0,
        opentag_id: 0,
        qty: 1
      };

      const response = await fetch(`${baseURL}/create-estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueData: {
            customer_id: userData.id,
            customer_name: userData.name,
            order_date: new Date().toISOString().split('T')[0],
            estimate_status: 'Ordered',
            source_by: 'customer',
            total_amount: productData.total_amount,
            taxable_amount: productData.taxable_amount,
            tax_amount: productData.tax_amount,
            net_amount: productData.net_amount,
            disscount: 0,
            disscount_percentage: 0,
            hm_charges: 0
          },
          repeatedData: [productData]
        })
      });

      const data = await response.json();

      if (data.success) {
        const currentCount = parseInt(localStorage.getItem('orderCount') || '0');
        localStorage.setItem('orderCount', (currentCount + 1).toString());
        window.dispatchEvent(new Event('orderCountChanged'));
        localStorage.setItem('lastEstimateNumber', data.estimate_number);
        alert('Order created successfully! Redirecting to estimates page...');
        navigate('/customer-estimates');
      } else {
        alert(data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    } finally {
      setIsOrdering(prev => ({ ...prev, [product.product_id]: false }));
    }
  };

  // Handle Order Now click (for Selected/Ordered products) - Creates order directly
  const handleOrderNow = async (product) => {
    if (!userData) {
      alert('Please login to place an order');
      return;
    }
    
    if (userData.role !== 'Customer') {
      alert('Only customers can place orders');
      return;
    }

    setIsOrdering(prev => ({ ...prev, [product.product_id]: true }));

    try {
      const productData = {
        product_id: product.product_id,
        product_name: product.product_name,
        barcode: product.barcode || '',
        metal_type: product.metal_type || 'Gold',
        design: product.design || '',
        design_name: product.design || product.design_name || '',
        purity: product.purity || '22K',
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
        customer_id: userData.id,
        customer_name: userData.name,
        quantity: 1,
        estimate_status: 'Ordered',
        source_by: 'customer',
        date: new Date().toISOString().split('T')[0],
        order_date: new Date().toISOString().split('T')[0],
        pcode: product.pcode || '',
        category: product.category || '',
        sub_category: product.sub_category || '',
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
        total_amount: parseFloat(product.total_price) || 0,
        taxable_amount: parseFloat(product.total_price) || 0,
        tax_amount: 0,
        net_amount: parseFloat(product.total_price) || 0,
        original_total_price: parseFloat(product.total_price) || 0,
        opentag_id: 0,
        qty: 1
      };

      const response = await fetch(`${baseURL}/create-estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uniqueData: {
            customer_id: userData.id,
            customer_name: userData.name,
            order_date: new Date().toISOString().split('T')[0],
            estimate_status: 'Ordered',
            source_by: 'customer',
            total_amount: productData.total_amount,
            taxable_amount: productData.taxable_amount,
            tax_amount: productData.tax_amount,
            net_amount: productData.net_amount,
            disscount: 0,
            disscount_percentage: 0,
            hm_charges: 0
          },
          repeatedData: [productData]
        })
      });

      const data = await response.json();

      if (data.success) {
        const currentCount = parseInt(localStorage.getItem('orderCount') || '0');
        localStorage.setItem('orderCount', (currentCount + 1).toString());
        window.dispatchEvent(new Event('orderCountChanged'));
        localStorage.setItem('lastEstimateNumber', data.estimate_number);
        alert('Order created successfully! Redirecting to estimates page...');
        navigate('/customer-estimates');
      } else {
        alert(data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    } finally {
      setIsOrdering(prev => ({ ...prev, [product.product_id]: false }));
    }
  };

  // Navigation handlers
  const handleOrderNowClick = (product) => {
    if (product.status === "Available") {
      handleBuyNow(product);
    } else if (product.status === "Selected" || product.status === "Ordered") {
      handleOrderNow(product);
    }
  };

  // Handler for the second button (Add to Cart / Order Cart)
  const handleSecondaryButtonClick = (product) => {
    if (product.status === "Available") {
      handleAddToCart(product.product_id);
    } else if (product.status === "Selected" || product.status === "Ordered") {
      handleAddToOrderCart(product.product_id);
    }
  };

  const nextImage = (productId, e) => {
    e?.stopPropagation()
    const product = products.find(p => p.product_id === productId)
    if (!product || !product.images) return
    
    setCurrentImageIndexes(prev => ({
      ...prev,
      [productId]: (prev[productId] + 1) % product.images.length
    }))
  }

  const prevImage = (productId, e) => {
    e?.stopPropagation()
    const product = products.find(p => p.product_id === productId)
    if (!product || !product.images) return
    
    setCurrentImageIndexes(prev => ({
      ...prev,
      [productId]: (prev[productId] - 1 + product.images.length) % product.images.length
    }))
  }

  const openModal = (product) => {
    if (product.images && product.images.length > 0) {
      setModalProduct(product)
      setModalCurrentIndex(currentImageIndexes[product.product_id] || 0)
      setIsModalOpen(true)
      document.body.style.overflow = 'hidden'
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalProduct(null)
    document.body.style.overflow = 'auto'
  }

  const nextModalImage = () => {
    if (!modalProduct || !modalProduct.images) return
    setModalCurrentIndex((prevIndex) => 
      (prevIndex + 1) % modalProduct.images.length
    )
  }

  const prevModalImage = () => {
    if (!modalProduct || !modalProduct.images) return
    setModalCurrentIndex((prevIndex) => 
      (prevIndex - 1 + modalProduct.images.length) % modalProduct.images.length
    )
  }

  const goToModalImage = (index) => {
    if (!modalProduct || !modalProduct.images) return
    setModalCurrentIndex(index)
  }

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleEscKey)
    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isModalOpen])

  if (loading || checkingCartStatus) {
    return (
      <div>
        <CustomerNavbar />
        <div className="product-catalog-loading-container">
          <div className="product-catalog-loading-spinner"></div>
          <p>{checkingCartStatus ? 'Checking cart status...' : 'Loading products...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <CustomerNavbar />
        <div className="product-catalog-error-container">
          <p>Error: {error}</p>
          <button onClick={fetchProducts}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="product-catalog-page">
      <CustomerNavbar />

      {/* Products Grid */}
      <div className="product-catalog-container">
        <h2 className="product-catalog-title">Available Products</h2>
        
        <div className="product-catalog-grid">
          {products.map((product) => {
            const hasImages = product.images && product.images.length > 0
            const currentIndex = currentImageIndexes[product.product_id] || 0
            const isAdding = isAddingToCart[product.product_id] || false
            const isAddingOrder = isAddingToOrderCart[product.product_id] || false
            const isOrderingProduct = isOrdering[product.product_id] || false
            const isInCart = inCartProducts[product.product_id] || false
            const isInOrderCart = inOrderCartProducts[product.product_id] || false
            const showButtons = shouldShowButtons(product)
            
            return (
              <div key={product.product_id} className="product-catalog-card">
                {/* Product Image Carousel */}
                <div className="product-catalog-image-container">
                  {hasImages ? (
                    <div className="product-catalog-image-carousel">
                      <img 
                        src={getImageUrl(product.images[currentIndex])}
                        alt={`${product.product_name} - ${currentIndex + 1}`}
                        className="product-catalog-image"
                        onClick={() => openModal(product)}
                      />
                      
                      {product.images.length > 1 && (
                        <>
                          <button 
                            className="product-catalog-nav-arrow product-catalog-nav-arrow-left"
                            onClick={(e) => prevImage(product.product_id, e)}
                            aria-label="Previous image"
                          >
                            <FaChevronLeft />
                          </button>
                          <button 
                            className="product-catalog-nav-arrow product-catalog-nav-arrow-right"
                            onClick={(e) => nextImage(product.product_id, e)}
                            aria-label="Next image"
                          >
                            <FaChevronRight />
                          </button>
                        </>
                      )}
                      
                      {product.images.length > 1 && (
                        <div className="product-catalog-image-counter">
                          {currentIndex + 1} / {product.images.length}
                        </div>
                      )}
                      
                      {product.images.length > 1 && (
                        <div className="product-catalog-image-dots">
                          {product.images.map((_, index) => (
                            <button
                              key={index}
                              className={`product-catalog-dot ${index === currentIndex ? 'product-catalog-dot-active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setCurrentImageIndexes(prev => ({
                                  ...prev,
                                  [product.product_id]: index
                                }))
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
                  <h3 className="product-catalog-name">{product.product_name}</h3>
                  <p className="product-catalog-barcode">Barcode: {product.barcode}</p>
                  
                  <div className={`product-catalog-status-badge product-catalog-status-${product.status?.toLowerCase()}`}>
                    Status: {product.status}
                  </div>

                  <div className="product-catalog-spec-row">
                    <span className="product-catalog-spec-label">Weight:</span>
                    <span className="product-catalog-spec-value">
                      Gross: {product.gross_wt}g | Net: {product.net_wt}g
                    </span>
                  </div>

                  <div className="product-catalog-pricing-section">
                    {product.making_charges > 0 && (
                      <div className="product-catalog-price-row">
                        <span>Making Charges:</span>
                        <span>{formatPrice(parseFloat(product.making_charges))}</span>
                      </div>
                    )}
                    
                    {product.stone_price > 0 && (
                      <div className="product-catalog-price-row">
                        <span>Stone Price:</span>
                        <span>{formatPrice(parseFloat(product.stone_price))}</span>
                      </div>
                    )}
                    
                    {product.tax_amt > 0 && (
                      <div className="product-catalog-price-row">
                        <span>Tax ({product.tax_percent}):</span>
                        <span>{formatPrice(parseFloat(product.tax_amt))}</span>
                      </div>
                    )}
                    
                    <div className="product-catalog-price-row product-catalog-total-price">
                      <span>Total Price:</span>
                      <span className="product-catalog-price-amount">
                        {formatPrice(parseFloat(product.total_price))}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {showButtons && (
                    <div className="product-catalog-actions">
                      <button 
                        className="product-catalog-buy-now-btn"
                        onClick={() => handleOrderNowClick(product)}
                        disabled={isOrderingProduct}
                      >
                        {isOrderingProduct ? (
                          <>
                            <FaSpinner className="product-catalog-spinner" /> Processing...
                          </>
                        ) : (
                          getOrderNowButtonText(product)
                        )}
                      </button>
                      <button 
                        className={`product-catalog-add-to-cart-btn ${
                          product.status === "Available" 
                            ? (isInCart ? 'product-catalog-in-cart' : '')
                            : (isInOrderCart ? 'product-catalog-in-cart' : '')
                        }`}
                        onClick={() => handleSecondaryButtonClick(product)}
                        disabled={
                          (product.status === "Available" && (isAdding || isInCart || isOrderingProduct)) ||
                          ((product.status === "Selected" || product.status === "Ordered") && (isAddingOrder || isInOrderCart || isOrderingProduct))
                        }
                      >
                        {product.status === "Available" 
                          ? getAddToCartButtonText(product)
                          : getOrderCartButtonText(product)
                        }
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
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
                src={getImageUrl(modalProduct.images[modalCurrentIndex])}
                alt={`${modalProduct.product_name} - ${modalCurrentIndex + 1}`}
                className="product-catalog-modal-image"
              />
              
              {modalProduct.images.length > 1 && (
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
              
              {modalProduct.images.length > 1 && (
                <div className="product-catalog-modal-image-counter">
                  {modalCurrentIndex + 1} / {modalProduct.images.length}
                </div>
              )}
              
              {modalProduct.images.length > 1 && (
                <div className="product-catalog-modal-image-dots">
                  {modalProduct.images.map((_, index) => (
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
            
            <div className="product-catalog-modal-product-info">
              <h3 className="product-catalog-modal-product-name">{modalProduct.product_name}</h3>
              <p className="product-catalog-modal-product-barcode">Barcode: {modalProduct.barcode}</p>
              <div className={`product-catalog-modal-status-badge product-catalog-modal-status-${modalProduct.status?.toLowerCase()}`}>
                Status: {modalProduct.status}
              </div>
              <div className="product-catalog-modal-spec-row">
                <span>Weight:</span>
                <span>Gross: {modalProduct.gross_wt}g | Net: {modalProduct.net_wt}g</span>
              </div>
              <div className="product-catalog-modal-price">
                Total Price: {formatPrice(parseFloat(modalProduct.total_price))}
              </div>
              
              {shouldShowButtons(modalProduct) && (
                <div className="product-catalog-modal-actions">
                  <button 
                    className="product-catalog-modal-order-now"
                    onClick={() => {
                      handleOrderNowClick(modalProduct)
                      closeModal()
                    }}
                    disabled={isOrdering[modalProduct.product_id]}
                  >
                    {isOrdering[modalProduct.product_id] ? (
                      <>
                        <FaSpinner className="product-catalog-modal-spinner" /> Processing...
                      </>
                    ) : (
                      getOrderNowButtonText(modalProduct)
                    )}
                  </button>
                  <button 
                    className={`product-catalog-modal-add-to-cart ${
                      modalProduct.status === "Available"
                        ? (inCartProducts[modalProduct.product_id] ? 'product-catalog-modal-in-cart' : '')
                        : (inOrderCartProducts[modalProduct.product_id] ? 'product-catalog-modal-in-cart' : '')
                    }`}
                    onClick={() => {
                      handleSecondaryButtonClick(modalProduct)
                      closeModal()
                    }}
                    disabled={
                      (modalProduct.status === "Available" && (isAddingToCart[modalProduct.product_id] || inCartProducts[modalProduct.product_id] || isOrdering[modalProduct.product_id])) ||
                      ((modalProduct.status === "Selected" || modalProduct.status === "Ordered") && (isAddingToOrderCart[modalProduct.product_id] || inOrderCartProducts[modalProduct.product_id] || isOrdering[modalProduct.product_id]))
                    }
                  >
                    {modalProduct.status === "Available"
                      ? (isAddingToCart[modalProduct.product_id] ? (
                          <>
                            <FaSpinner className="product-catalog-modal-spinner" /> Adding...
                          </>
                        ) : inCartProducts[modalProduct.product_id] ? (
                          'Already in Cart'
                        ) : (
                          'Add to Cart'
                        ))
                      : (isAddingToOrderCart[modalProduct.product_id] ? (
                          <>
                            <FaSpinner className="product-catalog-modal-spinner" /> Adding...
                          </>
                        ) : inOrderCartProducts[modalProduct.product_id] ? (
                          'Already in Order Cart'
                        ) : (
                          'Order Cart'
                        ))
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductCatalog