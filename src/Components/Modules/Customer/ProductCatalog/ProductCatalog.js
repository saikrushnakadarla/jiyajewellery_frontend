import React, { useState, useEffect } from 'react'
import CustomerNavbar from "../../../Pages/Navbar/CustomerNavbar"
import './ProductCatalog.css'
import { FaChevronLeft, FaChevronRight, FaTimes, FaShoppingCart, FaCheck } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

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
  const [addedToCart, setAddedToCart] = useState({})
  const [userData, setUserData] = useState(null)
  
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
    loadUserData()
  }, [])

  const loadUserData = () => {
    try {
      const userString = localStorage.getItem('user')
      if (userString) {
        const user = JSON.parse(userString)
        setUserData(user)
      } else {
        console.warn('No user data found in localStorage')
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/get/products')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      console.log('Products data:', data)
      
      // Initialize current image index for each product with images
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
    return `http://localhost:5000/uploads/products/${imageFilename}`
  }

  // Add to cart function
  const handleAddToCart = async (productId) => {
    if (!userData) {
      alert('Please login to add items to cart')
      return
    }

    setIsAddingToCart(prev => ({ ...prev, [productId]: true }))

    try {
      const response = await fetch('http://localhost:5000/api/cart/add', {
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
        // Show success feedback
        setAddedToCart(prev => ({ ...prev, [productId]: true }))
        
        // Reset success indicator after 2 seconds
        setTimeout(() => {
          setAddedToCart(prev => ({ ...prev, [productId]: false }))
        }, 2000)
        
        // Optional: Show notification
        alert('Product added to cart successfully!')
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

  // NEW: Handle Order Now button click
 // NEW: Handle Order Now button click
const handleOrderNow = (product) => {
  if (!userData) {
    alert('Please login to place an order')
    return
  }
  
  // Check if user is a customer
  if (userData.role !== 'Customer') {
    alert('Only customers can place orders')
    return
  }
  
  // Store the selected product in localStorage to pass to estimate form
  const orderData = {
    product_id: product.product_id,
    product_name: product.product_name,
    barcode: product.barcode,
    metal_type: product.metal_type,
    design_name: product.design,
    purity: product.purity,
    gross_weight: product.gross_wt,
    stone_weight: product.stone_wt,
    stone_price: product.stone_price,
    making_charges: product.making_charges,
    tax_percent: product.tax_percent,
    tax_amt: product.tax_amt,
    total_price: product.total_price,
    images: product.images || []
  }
  
  localStorage.setItem('quickOrderProduct', JSON.stringify(orderData))
  
  // Navigate to customer estimates page - FIXED PATH
  navigate('/customer-estimates')
}

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

  // Modal functions
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

  // Close modal on ESC key
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

  if (loading) {
    return (
      <div>
        <CustomerNavbar />
        <div className="product-catalog-loading-container">
          <div className="product-catalog-loading-spinner"></div>
          <p>Loading products...</p>
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
            const isAdded = addedToCart[product.product_id] || false
            
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
                      
                      {/* Navigation Arrows */}
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
                      
                      {/* Image Counter */}
                      {product.images.length > 1 && (
                        <div className="product-catalog-image-counter">
                          {currentIndex + 1} / {product.images.length}
                        </div>
                      )}
                      
                      {/* Image Dots Indicator */}
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

                  <div className="product-catalog-spec-row">
                    <span className="product-catalog-spec-label">Weight:</span>
                    <span className="product-catalog-spec-value">
                      Gross: {product.gross_wt}g | Net: {product.net_wt}g
                    </span>
                  </div>

                  {/* Pricing Details */}
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
                  <div className="product-catalog-actions">
                    <button 
                      className={`product-catalog-add-to-cart-btn ${isAdded ? 'added-to-cart' : ''}`}
                      onClick={() => handleAddToCart(product.product_id)}
                      disabled={isAdding || isAdded}
                    >
                      {isAdding ? (
                        'Adding...'
                      ) : isAdded ? (
                        <>
                          <FaCheck /> Added
                        </>
                      ) : (
                        <>
                          <FaShoppingCart /> Add to Cart
                        </>
                      )}
                    </button>
                    <button 
                      className="product-catalog-buy-now-btn"
                      onClick={() => handleOrderNow(product)}
                    >
                      Order Now
                    </button>
                  </div>
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
              
              {/* Modal Navigation Arrows */}
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
              
              {/* Modal Image Counter */}
              {modalProduct.images.length > 1 && (
                <div className="product-catalog-modal-image-counter">
                  {modalCurrentIndex + 1} / {modalProduct.images.length}
                </div>
              )}
              
              {/* Modal Image Dots */}
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
            
            {/* Product Info in Modal */}
            <div className="product-catalog-modal-product-info">
              <h3 className="product-catalog-modal-product-name">{modalProduct.product_name}</h3>
              <p className="product-catalog-modal-product-barcode">Barcode: {modalProduct.barcode}</p>
              <div className="product-catalog-modal-spec-row">
                <span>Weight:</span>
                <span>Gross: {modalProduct.gross_wt}g | Net: {modalProduct.net_wt}g</span>
              </div>
              <div className="product-catalog-modal-price">
                Total Price: {formatPrice(parseFloat(modalProduct.total_price))}
              </div>
              <div className="product-catalog-modal-actions">
                <button 
                  className="product-catalog-modal-add-to-cart"
                  onClick={() => {
                    handleAddToCart(modalProduct.product_id)
                    closeModal()
                  }}
                  disabled={isAddingToCart[modalProduct.product_id] || addedToCart[modalProduct.product_id]}
                >
                  {isAddingToCart[modalProduct.product_id] ? 'Adding...' : 'Add to Cart'}
                </button>
                <button 
                  className="product-catalog-modal-order-now"
                  onClick={() => {
                    handleOrderNow(modalProduct)
                    closeModal()
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
  )
}

export default ProductCatalog