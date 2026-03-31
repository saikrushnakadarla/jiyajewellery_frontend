import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../Pages/Navbar/Navbar";
import { FaArrowLeft } from "react-icons/fa";
import "./AddLoanAmountForm.css";

const AddLoanAmountForm = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCustomers, setFetchingCustomers] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    user_id: "",
    full_name: "",
    phone: "",
    address: "",
    gold_weight: "",
    purity: "22K",
    appraised_value: "",
    item_description: "",
    loan_amount: "",
    interest_rate: "12",
    duration_months: "12"
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setFetchingCustomers(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:5000/api/users");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const filteredCustomers = data.filter(user => {
        const isCustomer = user.role && user.role.toLowerCase() === "customer";
        const isApproved = user.status && user.status.toLowerCase() === "approved";
        return isCustomer && isApproved;
      });
      
      setCustomers(filteredCustomers);
      
      if (filteredCustomers.length === 0) {
        setError("No approved customers found. Please add customers first.");
      }
      
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Failed to fetch customers. Please check your connection.");
    } finally {
      setFetchingCustomers(false);
    }
  };

  const handleCustomerChange = (e) => {
    const userId = e.target.value;
    
    if (userId) {
      const selectedCustomer = customers.find(customer => customer.id === parseInt(userId));
      
      if (selectedCustomer) {
        const addressParts = [];
        if (selectedCustomer.city && selectedCustomer.city !== "NULL") 
          addressParts.push(selectedCustomer.city);
        if (selectedCustomer.state && selectedCustomer.state !== "NULL") 
          addressParts.push(selectedCustomer.state);
        if (selectedCustomer.pincode && selectedCustomer.pincode !== "NULL") 
          addressParts.push(selectedCustomer.pincode);
        
        const formattedAddress = addressParts.length > 0 ? addressParts.join(", ") : "Address not available";
        
        setFormData({
          ...formData,
          user_id: userId,
          full_name: selectedCustomer.full_name,
          phone: selectedCustomer.phone || "",
          address: formattedAddress
        });
      }
    } else {
      setFormData({
        ...formData,
        user_id: "",
        full_name: "",
        phone: "",
        address: ""
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.user_id) {
      alert("Please select a customer");
      return;
    }
    
    if (!formData.gold_weight || parseFloat(formData.gold_weight) <= 0) {
      alert("Please enter valid gold weight");
      return;
    }
    
    if (!formData.loan_amount || parseFloat(formData.loan_amount) <= 0) {
      alert("Please enter valid loan amount");
      return;
    }
    
    setLoading(true);
    
    try {
      const loanData = {
        user_id: parseInt(formData.user_id),
        gold_weight: parseFloat(formData.gold_weight),
        purity: formData.purity,
        appraised_value: formData.appraised_value ? parseFloat(formData.appraised_value) : null,
        item_description: formData.item_description,
        loan_amount: parseFloat(formData.loan_amount),
        interest_rate: parseFloat(formData.interest_rate),
        duration_months: parseInt(formData.duration_months)
      };
      
      const response = await fetch("http://localhost:5000/api/loan-amounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loanData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert("Loan created successfully!");
        navigate("/loan-amount");
      } else {
        alert(data.error || "Failed to create loan");
      }
    } catch (error) {
      console.error("Error creating loan:", error);
      alert("Error creating loan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/loan-amount");
  };

  return (
    <>
      <Navbar />

      <div className="add-loan-page">
        <div className="add-loan-container">
          <div className="add-loan-header">
            <h2>Create New Gold Loan</h2>
            <button className="back-button" onClick={() => navigate("/loan-amount")}>
              <FaArrowLeft /> Back to Loans
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-content">
              <h4 className="section-title">CUSTOMER DETAILS</h4>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Select Customer *</label>
                  <select 
                    name="user_id" 
                    value={formData.user_id} 
                    onChange={handleCustomerChange}
                    required
                    disabled={fetchingCustomers}
                  >
                    <option value="">
                      {fetchingCustomers ? "Loading customers..." : "Select a customer"}
                    </option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.full_name} 
                        {customer.phone ? ` - ${customer.phone}` : ""}
                        {customer.city ? ` (${customer.city})` : ""}
                      </option>
                    ))}
                  </select>
                  {customers.length === 0 && !fetchingCustomers && !error && (
                    <div className="info-text">
                      No customers available. Please add customers first.
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    readOnly
                    placeholder={formData.user_id ? "Auto-filled from customer" : "Select a customer first"}
                  />
                </div>
              </div>

              <div className="form-group full">
                <label>Address</label>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address}
                  readOnly
                  placeholder={formData.user_id ? "Auto-filled from customer" : "Select a customer first"}
                />
              </div>

              <h4 className="section-title">GOLD DETAILS</h4>

              <div className="form-row">
                <div className="form-group">
                  <label>Weight (grams) *</label>
                  <input 
                    type="number" 
                    name="gold_weight"
                    value={formData.gold_weight}
                    onChange={handleInputChange}
                    placeholder="0.0" 
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Purity *</label>
                  <select 
                    name="purity"
                    value={formData.purity}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="22K">22K</option>
                    <option value="24K">24K</option>
                    <option value="18K">18K</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Appraised Value ₹</label>
                  <input 
                    type="number" 
                    name="appraised_value"
                    value={formData.appraised_value}
                    onChange={handleInputChange}
                    placeholder="0" 
                  />
                </div>
              </div>

              <div className="form-group full">
                <label>Item Description</label>
                <textarea 
                  name="item_description"
                  value={formData.item_description}
                  onChange={handleInputChange}
                  placeholder="Describe the gold items..."
                ></textarea>
              </div>

              <h4 className="section-title">LOAN TERMS</h4>

              <div className="form-row">
                <div className="form-group">
                  <label>Loan Amount ₹ *</label>
                  <input 
                    type="number" 
                    name="loan_amount"
                    value={formData.loan_amount}
                    onChange={handleInputChange}
                    placeholder="0" 
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Interest Rate (%) *</label>
                  <input 
                    type="number" 
                    name="interest_rate"
                    value={formData.interest_rate}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duration (months) *</label>
                  <input 
                    type="number" 
                    name="duration_months"
                    value={formData.duration_months}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading || fetchingCustomers}>
                  {loading ? "Creating..." : "Create Loan"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddLoanAmountForm;