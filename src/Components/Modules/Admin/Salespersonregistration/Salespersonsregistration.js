import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../../../Pages/TableLayout/InputField";
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Navbar from "../../../Pages/Navbar/Navbar";
import FaceCapture from "../FaceCapture/FaceCapture";

function SalespersonRegister() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [faceData, setFaceData] = useState(null);

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

  const handleFaceCaptured = (data) => {
    setFaceData(data);
    setShowFaceCapture(false);
    Swal.fire({
      icon: 'success',
      title: 'Face Captured!',
      text: 'Your face has been successfully registered.',
      timer: 1500,
      showConfirmButton: false
    });
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

    // Validate face capture
    if (!faceData) {
      Swal.fire({
        icon: 'warning',
        title: 'Face Registration Required',
        text: 'Please capture your face for face login feature.',
        confirmButtonColor: '#3085d6',
      });
      setShowFaceCapture(true);
      setIsSubmitting(false);
      return;
    }

    // Prepare data for API
    const apiData = new FormData();
    apiData.append('full_name', formData.full_name);
    apiData.append('email_id', formData.email);
    apiData.append('phone', formData.phone);
    apiData.append('date_of_birth', formData.dob);
    apiData.append('gender', formData.gender);
    apiData.append('designation', formData.designation);
    apiData.append('date_of_anniversary', formData.anniversary);
    apiData.append('country', formData.country);
    apiData.append('state', formData.state);
    apiData.append('city', formData.city);
    apiData.append('password', formData.password);
    apiData.append('confirm_password', formData.confirmPassword);
    apiData.append('company_name', formData.company_name);
    apiData.append('role', formData.role);
    apiData.append('pincode', formData.pincode);
    apiData.append('face_descriptor', JSON.stringify(faceData.descriptor));
    
    // Convert base64 image to file
    const base64Image = faceData.image;
    const byteString = atob(base64Image.split(',')[1]);
    const mimeString = base64Image.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], `face-${Date.now()}.jpg`, { type: mimeString });
    apiData.append('face_photo', file);

    try {
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        body: apiData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Success:", result);
        
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'Your account has been created successfully.',
          confirmButtonColor: '#3085d6',
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/");
          }
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: errorData.message || 'Registration failed. Please try again.',
          confirmButtonColor: '#3085d6',
        });
      }
    } catch (error) {
      console.error("Error:", error);
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
          
          <button
            type="button"
            onClick={() => setShowFaceCapture(true)}
            className="face-register-btn"
            style={{
              marginBottom: '20px',
              padding: '10px 20px',
              background: faceData ? '#10b981' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            {faceData ? '✓ Face Registered' : '📸 Register Face for Login'}
          </button>
          
          <form className="customerregistration-form" onSubmit={handleSubmit}>
            {/* All existing form fields remain the same */}
            <InputField
              label="Full Name"
              placeholder="Enter full name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />

            <InputField
              label="Email Id"
              placeholder="Enter your email id"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <InputField
              label="Phone Number"
              placeholder="Enter your phone number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            <InputField
              label="Date of Birth"
              placeholder="Select birthdate"
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              // required
            />

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

            <InputField
              label="Date of Anniversary"
              type="date"
              name="anniversary"
              value={formData.anniversary}
              onChange={handleChange}
            />

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

            <InputField
              label="Company Name"
              name="company_name"
              placeholder="Enter Company Name"
              value={formData.company_name}
              onChange={handleChange}
              required
            />

            <InputField
              label="Pincode"
              placeholder="Enter Pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              required
            />

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
      
      {showFaceCapture && (
        <FaceCapture
          onFaceCaptured={handleFaceCaptured}
          onClose={() => setShowFaceCapture(false)}
          mode="register"
        />
      )}
    </>
  );
}

export default SalespersonRegister;