import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../../../Pages/TableLayout/InputField";
// import "./CustomerRegistration.css";
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Navbar from "../../../Pages/Navbar/Navbar";

function SalespersonRegister() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    designation: "",
    anniversary: "",
    country: "",
    state: "",
    city: "",
    password: "",
    confirmPassword: "",
    company_name: "",
    role: "salesman",
    pincode: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'Passwords do not match. Please try again.',
        confirmButtonColor: '#3085d6',
      });
      setIsSubmitting(false);
      return;
    }

    // Prepare data for API in the required format
    const apiData = {
      full_name: formData.full_name,
      email_id: formData.email,
      phone: formData.phone,
      date_of_birth: formData.dob,
      gender: formData.gender,
      designation: formData.designation,
      date_of_anniversary: formData.anniversary,
      country: formData.country,
      state: formData.state,
      city: formData.city,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      company_name: formData.company_name,
      role: formData.role,
      pincode: formData.pincode
    };

    try {
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Success:", result);
        
        // Show success alert
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'Your account has been created successfully.',
          confirmButtonColor: '#3085d6',
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/login"); // Redirect to login page after successful registration
          }
        });
      } else {
        const errorData = await response.json();
        
        // Show error alert
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: errorData.message || 'Registration failed. Please try again.',
          confirmButtonColor: '#3085d6',
        });
      }
    } catch (error) {
      console.error("Error:", error);
      
      // Show network error alert
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Please check your connection and try again.',
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleBack = () => {
    navigate("/salespersontable");
  };

  return (
    <>
    <Navbar/>
    <div className="customerregistration-main-container">
      <div className="customerregistration-form-container" style={{marginTop:"90px"}}>
        <h2>Salesman Registration</h2>
        {errorMessage && <div className="customerregistration-error">{errorMessage}</div>}
        <form className="customerregistration-form" onSubmit={handleSubmit}>
          {/* Full Name */}
          <InputField
            label="Full Name"
            placeholder="Enter full name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />

          {/* Email */}
          <InputField
            label="Email Id"
            placeholder="Enter your email id"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* Phone Number */}
          <InputField
            label="Phone Number"
            placeholder="Enter your phone number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          {/* Date of Birth */}
          <InputField
            label="Date of Birth"
            placeholder="Select birthdate"
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
          />

          {/* Gender */}
          <div className="customerregistration-gender-field">
            <label className="input-label">Gender</label>
            <div className="customerregistration-gender-options">
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  onChange={handleChange}
                  required
                />
                Male
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  onChange={handleChange}
                />
                Female
              </label>
            </div>
          </div>

          {/* Designation */}
          <InputField
            label="Designation"
            type="select"
            placeholder="Select Designation"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            required
            options={[
              { value: "Director", label: "Director" },
              { value: "Managing Director", label: "Managing Director" },
              { value: "CEO", label: "CEO" },
              { value: "General Manager", label: "General Manager" },
              { value: "Proprietor", label: "Proprietor" },
              { value: "Partner", label: "Partner" },
              { value: "CFO", label: "CFO" },
              { value: "Purchase Manager", label: "Purchase Manager" },
              { value: "Purchase Head", label: "Purchase Head" },
              { value: "Salesman", label: "Salesman" },
              { value: "Other", label: "Other" },
            ]}
          />

          {/* Anniversary */}
          <InputField
            label="Date of Anniversary"
            type="date"
            name="anniversary"
            value={formData.anniversary}
            onChange={handleChange}
          />

          {/* Country */}
          <div className="customerregistration-country-container">
            <InputField
              label="Country"
              type="select"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              options={[
                { value: "India", label: "India" },
                { value: "Albania", label: "Albania" },
                { value: "Algeria", label: "Algeria" },
                { value: "American Samoa", label: "American Samoa" },
                { value: "Andorra", label: "Andorra" },
              ]}
            />
          </div>

          {/* State */}
          <InputField
            label="State"
            placeholder="Select state"
            type="select"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            options={[
              { value: "Telangana", label: "Telangana" },
              { value: "Andhra Pradesh", label: "Andhra Pradesh" },
            ]}
          />

          {/* City */}
          <InputField
            label="City"
            type="select"
            placeholder="Select city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            options={[
              { value: "Rajanna Sircilla", label: "Rajanna Sircilla" },
              { value: "Karimnagar", label: "Karimnagar" },
            ]}
          />

          {/* Password */}
          <div className="customerregistration-password-container">
            <InputField
              label="Password"
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span
              className="customerregistration-eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="customerregistration-password-container">
            <InputField
              label="Confirm Password"
              placeholder="Enter your confirm password"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <span
              className="customerregistration-eye-icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Company Name */}
          <InputField
            label="Company Name"
            name="company_name"
            placeholder="Enter Company Name"
            value={formData.company_name}
            onChange={handleChange}
            required
          />

          {/* Pincode */}
          <InputField
            label="Pincode"
            placeholder="Enter Pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            required
          />

          {/* Buttons */}
          <div className="customerregistration-button-container">
            <button
              type="button"
              className="customerregistration-back-btn"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Close
            </button>
            <button 
              type="submit" 
              className="customerregistration-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

export default SalespersonRegister;