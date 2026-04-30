import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../../Pages/TableLayout/InputField";
import "./CustomerRegistration.css";
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash, FaMapMarkerAlt, FaSpinner } from "react-icons/fa";
import baseURL2 from "../ApiUrl/NodeBaseURL2";
import baseURL from "../ApiUrl/NodeBaseURL";

// Static data for Indian states, cities, and districts
const indiaStateCityDistrictData = {
  "Andhra Pradesh": {
    cities: {
      "Visakhapatnam": ["Visakhapatnam", "Anakapalli", "Bheemunipatnam"],
      "Vijayawada": ["Vijayawada", "Nuzvid", "Jaggayyapeta"],
      "Guntur": ["Guntur", "Tenali", "Bapatla"],
      "Nellore": ["Nellore", "Kavali", "Gudur"],
      "Kurnool": ["Kurnool", "Nandyal", "Adoni"],
      "Tirupati": ["Tirupati", "Srikalahasti", "Madanapalle"],
      "Rajahmundry": ["Rajahmundry", "Kakinada", "Amalapuram"],
      "Anantapur": ["Anantapur", "Dharmavaram", "Tadipatri"]
    }
  },
  "Telangana": {
    cities: {
      "Hyderabad": ["Hyderabad", "Secunderabad", "Charminar"],
      "Warangal": ["Warangal", "Hanamkonda", "Jangaon"],
      "Karimnagar": ["Karimnagar", "Jagtial", "Siricilla"],
      "Nizamabad": ["Nizamabad", "Bodhan", "Armoor"],
      "Khammam": ["Khammam", "Kothagudem", "Palwancha"],
      "Nalgonda": ["Nalgonda", "Miryalaguda", "Suryapet"],
      "Mahabubnagar": ["Mahabubnagar", "Wanaparthy", "Nagarkurnool"],
      "Adilabad": ["Adilabad", "Mancherial", "Nirmal"],
      "Medak": ["Medak", "Siddipet", "Sangareddy"],
      "Rajanna Sircilla": ["Rajanna Sircilla", "Vemulawada", "Yellareddypet"]
    }
  },
  "Karnataka": {
    cities: {
      "Bangalore": ["Bangalore Urban", "Bangalore Rural", "Ramanagara"],
      "Mysore": ["Mysore", "Nanjangud", "Tirumakudal Narsipur"],
      "Mangalore": ["Mangalore", "Bantwal", "Puttur"],
      "Hubli": ["Hubli", "Dharwad", "Kalghatgi"],
      "Belgaum": ["Belgaum", "Chikodi", "Bailhongal"],
      "Gulbarga": ["Gulbarga", "Sedam", "Chincholi"],
      "Davanagere": ["Davanagere", "Harihar", "Jagalur"],
      "Bellary": ["Bellary", "Hospet", "Sandur"],
      "Shimoga": ["Shimoga", "Bhadravati", "Sagar"],
      "Tumkur": ["Tumkur", "Tiptur", "Madhugiri"]
    }
  },
  "Tamil Nadu": {
    cities: {
      "Chennai": ["Chennai", "Tambaram", "Avadi"],
      "Coimbatore": ["Coimbatore", "Pollachi", "Valparai"],
      "Madurai": ["Madurai", "Usilampatti", "Vadipatti"],
      "Tiruchirappalli": ["Tiruchirappalli", "Lalgudi", "Manapparai"],
      "Salem": ["Salem", "Mettur", "Omalur"],
      "Tirunelveli": ["Tirunelveli", "Palayamkottai", "Tenkasi"],
      "Vellore": ["Vellore", "Ranipet", "Tirupattur"],
      "Thoothukudi": ["Thoothukudi", "Tiruchendur", "Kovilpatti"]
    }
  },
  "Maharashtra": {
    cities: {
      "Mumbai": ["Mumbai City", "Mumbai Suburban", "Thane"],
      "Pune": ["Pune", "Pimpri-Chinchwad", "Baramati"],
      "Nagpur": ["Nagpur", "Umred", "Ramtek"],
      "Nashik": ["Nashik", "Malegaon", "Manmad"],
      "Aurangabad": ["Aurangabad", "Jalna", "Paithan"],
      "Solapur": ["Solapur", "Pandharpur", "Akkalkot"],
      "Kolhapur": ["Kolhapur", "Ichalkaranji", "Jaysingpur"],
      "Amravati": ["Amravati", "Achalpur", "Warud"]
    }
  },
  "Gujarat": {
    cities: {
      "Ahmedabad": ["Ahmedabad", "Gandhinagar", "Sanand"],
      "Surat": ["Surat", "Navsari", "Bardoli"],
      "Vadodara": ["Vadodara", "Anand", "Padra"],
      "Rajkot": ["Rajkot", "Morbi", "Gondal"],
      "Bhavnagar": ["Bhavnagar", "Palitana", "Mahuva"],
      "Jamnagar": ["Jamnagar", "Dwarka", "Khambhalia"],
      "Junagadh": ["Junagadh", "Veraval", "Keshod"],
      "Gandhinagar": ["Gandhinagar", "Mansa", "Dehgam"]
    }
  },
  "Rajasthan": {
    cities: {
      "Jaipur": ["Jaipur", "Amber", "Bassi"],
      "Jodhpur": ["Jodhpur", "Osian", "Bilara"],
      "Udaipur": ["Udaipur", "Nathdwara", "Salumbar"],
      "Kota": ["Kota", "Bundi", "Baran"],
      "Bikaner": ["Bikaner", "Nokha", "Lunkaransar"],
      "Ajmer": ["Ajmer", "Kishangarh", "Beawar"],
      "Bhilwara": ["Bhilwara", "Asind", "Mandal"],
      "Alwar": ["Alwar", "Tijara", "Rajgarh"]
    }
  },
  "Kerala": {
    cities: {
      "Thiruvananthapuram": ["Thiruvananthapuram", "Neyyattinkara", "Varkala"],
      "Kochi": ["Ernakulam", "Aluva", "Paravur"],
      "Kozhikode": ["Kozhikode", "Vadakara", "Koyilandy"],
      "Thrissur": ["Thrissur", "Chalakudy", "Kodungallur"],
      "Kollam": ["Kollam", "Karunagappally", "Punalur"],
      "Palakkad": ["Palakkad", "Ottappalam", "Mannarkkad"],
      "Alappuzha": ["Alappuzha", "Cherthala", "Kayamkulam"],
      "Kannur": ["Kannur", "Thalassery", "Payyannur"]
    }
  },
  "West Bengal": {
    cities: {
      "Kolkata": ["Kolkata", "Bidhannagar", "Howrah"],
      "Darjeeling": ["Darjeeling", "Siliguri", "Kurseong"],
      "Durgapur": ["Durgapur", "Asansol", "Raniganj"],
      "Haldia": ["Haldia", "Tamluk", "Contai"],
      "Malda": ["Malda", "English Bazar", "Kaliachak"],
      "Baharampur": ["Baharampur", "Jangipur", "Lalbag"],
      "Bardhaman": ["Bardhaman", "Kalna", "Katwa"],
      "Balurghat": ["Balurghat", "Gangarampur", "Buniadpur"]
    }
  },
  "Punjab": {
    cities: {
      "Amritsar": ["Amritsar", "Ajnala", "Baba Bakala"],
      "Ludhiana": ["Ludhiana", "Jagraon", "Khanna"],
      "Jalandhar": ["Jalandhar", "Phagwara", "Nakodar"],
      "Patiala": ["Patiala", "Rajpura", "Nabha"],
      "Bathinda": ["Bathinda", "Mansa", "Talwandi Sabo"],
      "Mohali": ["Mohali", "Kharar", "Dera Bassi"],
      "Pathankot": ["Pathankot", "Gurdaspur", "Batala"],
      "Hoshiarpur": ["Hoshiarpur", "Dasuya", "Mukerian"]
    }
  },
  "Haryana": {
    cities: {
      "Gurugram": ["Gurugram", "Manesar", "Sohna"],
      "Faridabad": ["Faridabad", "Ballabgarh", "Palwal"],
      "Chandigarh": ["Chandigarh", "Panchkula", "Mohali"],
      "Ambala": ["Ambala", "Jagadhri", "Naraingarh"],
      "Panipat": ["Panipat", "Samalkha", "Israna"],
      "Karnal": ["Karnal", "Assandh", "Indri"],
      "Hisar": ["Hisar", "Hansi", "Narnaund"],
      "Rohtak": ["Rohtak", "Meham", "Kalanaur"]
    }
  },
  "Uttar Pradesh": {
    cities: {
      "Lucknow": ["Lucknow", "Bakshi Ka Talab", "Malihabad"],
      "Kanpur": ["Kanpur", "Bithoor", "Ghatampur"],
      "Agra": ["Agra", "Fatehpur Sikri", "Kiraoli"],
      "Varanasi": ["Varanasi", "Ramnagar", "Mughalsarai"],
      "Prayagraj": ["Prayagraj", "Naini", "Soraon"],
      "Meerut": ["Meerut", "Mawana", "Sardhana"],
      "Bareilly": ["Bareilly", "Aonla", "Baheri"],
      "Gorakhpur": ["Gorakhpur", "Bansgaon", "Chauri Chaura"]
    }
  },
  "Madhya Pradesh": {
    cities: {
      "Bhopal": ["Bhopal", "Berasia", "Huzur"],
      "Indore": ["Indore", "Mhow", "Depalpur"],
      "Jabalpur": ["Jabalpur", "Sihora", "Patan"],
      "Gwalior": ["Gwalior", "Bhitarwar", "Dabra"],
      "Ujjain": ["Ujjain", "Nagda", "Tarana"],
      "Sagar": ["Sagar", "Banda", "Khurai"],
      "Rewa": ["Rewa", "Mauganj", "Teonthar"],
      "Satna": ["Satna", "Maihar", "Nagod"]
    }
  },
  "Bihar": {
    cities: {
      "Patna": ["Patna", "Danapur", "Patna Rural"],
      "Gaya": ["Gaya", "Bodh Gaya", "Sherghati"],
      "Bhagalpur": ["Bhagalpur", "Nathnagar", "Sultanganj"],
      "Muzaffarpur": ["Muzaffarpur", "Kanti", "Motipur"],
      "Purnia": ["Purnia", "Banmankhi", "Baisi"],
      "Darbhanga": ["Darbhanga", "Benipur", "Biraul"],
      "Chapra": ["Chapra", "Sonepur", "Dighwara"],
      "Hajipur": ["Hajipur", "Mahnar", "Bidupur"]
    }
  },
  "Odisha": {
    cities: {
      "Bhubaneswar": ["Khordha", "Balianta", "Balipatna"],
      "Cuttack": ["Cuttack", "Banki", "Athagad"],
      "Rourkela": ["Rourkela", "Rajgangpur", "Birmitrapur"],
      "Berhampur": ["Berhampur", "Gopalpur", "Chhatrapur"],
      "Sambalpur": ["Sambalpur", "Burla", "Hirakud"],
      "Puri": ["Puri", "Konark", "Brahmagiri"],
      "Balasore": ["Balasore", "Jaleswar", "Soro"],
      "Bhadrak": ["Bhadrak", "Chandbali", "Dhamnagar"]
    }
  }
};

// Helper function to capitalize first letter of each word
const capitalizeWords = (str) => {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function CustomerRegistration() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  // New state for cascading dropdowns
  const [availableCities, setAvailableCities] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);

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
    district: "",
    password: "",
    confirmPassword: "",
    company_name: "",
    role: "customer",
    pincode: "",
    latitude: "",
    longitude: ""
  });

  // Function to get current location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));
        setIsGettingLocation(false);
        
        Swal.fire({
          icon: 'success',
          title: 'Location Captured!',
          text: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`,
          timer: 2000,
          showConfirmButton: true,
          confirmButtonColor: '#3085d6',
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Unable to retrieve your location. ";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "The request to get your location timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
        }
        
        setLocationError(errorMessage);
        
        Swal.fire({
          icon: 'warning',
          title: 'Location Access',
          text: errorMessage + " You can still register without location.",
          confirmButtonColor: '#3085d6',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Auto-get location when component mounts
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Update cities when state changes
  useEffect(() => {
    if (formData.state && indiaStateCityDistrictData[formData.state]) {
      const cities = Object.keys(indiaStateCityDistrictData[formData.state].cities);
      setAvailableCities(cities);
      setFormData(prev => ({ ...prev, city: "", district: "" }));
      setAvailableDistricts([]);
    } else {
      setAvailableCities([]);
      setAvailableDistricts([]);
    }
  }, [formData.state]);

  // Update districts when city changes
  useEffect(() => {
    if (formData.state && formData.city && 
        indiaStateCityDistrictData[formData.state]?.cities[formData.city]) {
      const districts = indiaStateCityDistrictData[formData.state].cities[formData.city];
      setAvailableDistricts(districts);
      setFormData(prev => ({ ...prev, district: "" }));
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.city, formData.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-capitalize first letter of each word for full_name and company_name
    if (name === 'full_name' || name === 'company_name') {
      setFormData((prev) => ({ ...prev, [name]: capitalizeWords(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Function to store customer in accounts database
  const storeInAccountsDB = async (customerData) => {
    try {
      const accountsData = {
        account_name: customerData.full_name,
        print_name: customerData.full_name,
        account_group: "CUSTOMERS",
        op_bal: null,
        metal_balance: null,
        dr_cr: null,
        address1: "",
        address2: "",
        city: customerData.city || "",
        district: customerData.district || "",
        pincode: customerData.pincode || "",
        state: customerData.state || "",
        state_code: "",
        phone: customerData.phone,
        mobile: customerData.phone,
        contact_person: null,
        email: customerData.email,
        birthday: customerData.dob || null,
        anniversary: customerData.anniversary || null,
        bank_account_no: "",
        bank_name: "",
        ifsc_code: "",
        branch: "",
        gst_in: "",
        aadhar_card: "",
        pan_card: "",
        religion: "",
        images: null,
        latitude: customerData.latitude || null,
        longitude: customerData.longitude || null
      };

      console.log("Sending to accounts API:", accountsData);

      const response = await fetch(`${baseURL2}/account-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountsData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Account stored successfully:", result);
        return true;
      } else {
        const errorData = await response.json();
        console.error("Failed to store account:", errorData);
        return false;
      }
    } catch (error) {
      console.error("Error storing in accounts DB:", error);
      return false;
    }
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

    // Prepare data for API
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
      district: formData.district,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      company_name: formData.company_name,
      role: formData.role,
      pincode: formData.pincode,
      latitude: formData.latitude || null,
      longitude: formData.longitude || null,
      status: 'pending'
    };

    try {
      // First API call - Store in user database
      const response = await fetch(`${baseURL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("User registration success:", result);

        // Second API call - Store in accounts database
        const customerDataForAccounts = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          district: formData.district,
          pincode: formData.pincode,
          state: formData.state,
          dob: formData.dob,
          anniversary: formData.anniversary,
          latitude: formData.latitude,
          longitude: formData.longitude
        };

        await storeInAccountsDB(customerDataForAccounts);

        // Show success alert
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'Your account has been created successfully and is pending admin approval.',
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
    navigate("/");
  };

  // Get all states for dropdown
  const allStates = Object.keys(indiaStateCityDistrictData);

  return (
    <div className="customerregistration-main-container">
      <div className="customerregistration-form-container">
        <h2>Customer Registration</h2>
        {errorMessage && <div className="customerregistration-error">{errorMessage}</div>}

        <form className="customerregistration-form" onSubmit={handleSubmit}>
          {/* Full Name - Auto-capitalized */}
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
          />

          {/* Gender */}
          <div className="customerregistration-gender-field">
            <label className="input-label">Gender <span className="required-star" style={{ color: 'red', marginLeft: '4px' }}>*</span></label>
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
            options={allStates.map(state => ({
              value: state,
              label: state
            }))}
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
            options={availableCities.map(city => ({
              value: city,
              label: city
            }))}
          />

          {/* District */}
          <InputField
            label="District"
            type="select"
            placeholder="Select district"
            name="district"
            value={formData.district}
            onChange={handleChange}
            required
            options={availableDistricts.map(district => ({
              value: district,
              label: district
            }))}
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

          {/* Company Name - Auto-capitalized */}
          <InputField
            label="Company Name"
            name="company_name"
            placeholder="Enter Company Name"
            value={formData.company_name}
            onChange={handleChange}
            required
          />

          {/* Location Section */}
          <div className="customerregistration-location-section">
            <label className="input-label">Current Location</label>
            <div className="customerregistration-location-container">
              <button
                type="button"
                className="customerregistration-location-btn"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <>
                    <FaSpinner className="fa-spin" /> Getting Location...
                  </>
                ) : (
                  <>
                    <FaMapMarkerAlt /> Capture Current Location
                  </>
                )}
              </button>
              {locationError && (
                <div className="customerregistration-location-error">
                  {locationError}
                </div>
              )}
              {(formData.latitude && formData.longitude) && (
                <div className="customerregistration-location-display">
                  <div className="location-coordinates">
                    <span><strong>Latitude:</strong> {Number(formData.latitude).toFixed(6)}</span>
                    <span><strong>Longitude:</strong> {Number(formData.longitude).toFixed(6)}</span>
                  </div>
                  <div className="location-success">
                    ✓ Location captured successfully
                  </div>
                </div>
              )}
            </div>
          </div>

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
  );
}

export default CustomerRegistration;