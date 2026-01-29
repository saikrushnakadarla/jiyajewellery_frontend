import React, { useState, useEffect } from 'react'
import CustomerNavbar from "../../../Pages/Navbar/CustomerNavbar"
import './ProductCatalog.css'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const ProductCatalog = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndexes, setCurrentImageIndexes] = useState({})

  useEffect(() => {
    fetchProducts()
  }, [])

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

  const nextImage = (productId, e) => {
    e.stopPropagation()
    const product = products.find(p => p.product_id === productId)
    if (!product || !product.images) return
    
    setCurrentImageIndexes(prev => ({
      ...prev,
      [productId]: (prev[productId] + 1) % product.images.length
    }))
  }

  const prevImage = (productId, e) => {
    e.stopPropagation()
    const product = products.find(p => p.product_id === productId)
    if (!product || !product.images) return
    
    setCurrentImageIndexes(prev => ({
      ...prev,
      [productId]: (prev[productId] - 1 + product.images.length) % product.images.length
    }))
  }

  if (loading) {
    return (
      <div>
        <CustomerNavbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <CustomerNavbar />
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={fetchProducts}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <CustomerNavbar />

      {/* Products Grid */}
      <div className="products-container">
        <h2 className="products-title">Available Products</h2>
        
        <div className="products-grid">
          {products.map((product) => {
            const hasImages = product.images && product.images.length > 0
            const currentIndex = currentImageIndexes[product.product_id] || 0
            
            return (
              <div key={product.product_id} className="product-card">
                {/* Product Image Carousel */}
                <div className="product-image-container">
                  {hasImages ? (
                    <div className="image-carousel">
                      <img 
                        src={getImageUrl(product.images[currentIndex])}
                        alt={`${product.product_name} - ${currentIndex + 1}`}
                        className="product-image"
                      />
                      
                      {/* Navigation Arrows */}
                      {product.images.length > 1 && (
                        <>
                          <button 
                            className="nav-arrow nav-arrow-left"
                            onClick={(e) => prevImage(product.product_id, e)}
                            aria-label="Previous image"
                          >
                            <FaChevronLeft />
                          </button>
                          <button 
                            className="nav-arrow nav-arrow-right"
                            onClick={(e) => nextImage(product.product_id, e)}
                            aria-label="Next image"
                          >
                            <FaChevronRight />
                          </button>
                        </>
                      )}
                      
                      {/* Image Counter */}
                      {product.images.length > 1 && (
                        <div className="image-counter">
                          {currentIndex + 1} / {product.images.length}
                        </div>
                      )}
                      
                      {/* Image Dots Indicator */}
                      {product.images.length > 1 && (
                        <div className="image-dots">
                          {product.images.map((_, index) => (
                            <button
                              key={index}
                              className={`dot ${index === currentIndex ? 'active' : ''}`}
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
                    <div className="no-image-placeholder">
                      <span>No Image Available</span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="product-details">
                  <h3 className="product-name">{product.product_name}</h3>
                  <p className="product-barcode">Barcode: {product.barcode}</p>
                  
                  <div className="product-specs">
                    <div className="spec-row">
                      <span className="spec-label">Metal:</span>
                      <span className="spec-value">{product.metal_type} {product.purity}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Design:</span>
                      <span className="spec-value">{product.design}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Weight:</span>
                      <span className="spec-value">
                        Gross: {product.gross_wt}g | Net: {product.net_wt}g
                      </span>
                    </div>
                    {product.stone_wt > 0 && (
                      <div className="spec-row">
                        <span className="spec-label">Stone Weight:</span>
                        <span className="spec-value">{product.stone_wt}g</span>
                      </div>
                    )}
                    <div className="spec-row">
                      <span className="spec-label">Pricing:</span>
                      <span className="spec-value">{product.pricing}</span>
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div className="pricing-section">
                    {product.making_charges > 0 && (
                      <div className="price-row">
                        <span>Making Charges:</span>
                        <span>{formatPrice(parseFloat(product.making_charges))}</span>
                      </div>
                    )}
                    
                    {product.stone_price > 0 && (
                      <div className="price-row">
                        <span>Stone Price:</span>
                        <span>{formatPrice(parseFloat(product.stone_price))}</span>
                      </div>
                    )}
                    
                    {product.tax_amt > 0 && (
                      <div className="price-row">
                        <span>Tax ({product.tax_percent}):</span>
                        <span>{formatPrice(parseFloat(product.tax_amt))}</span>
                      </div>
                    )}
                    
                    <div className="price-row total-price">
                      <span>Total Price:</span>
                      <span className="price-amount">
                        {formatPrice(parseFloat(product.total_price))}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="product-actions">
                    <button className="add-to-cart-btn">
                      Add to Cart
                    </button>
                    <button className="buy-now-btn">
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ProductCatalog