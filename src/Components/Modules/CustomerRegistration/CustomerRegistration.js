import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../../Pages/TableLayout/InputField";
import "./CustomerRegistration.css";
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash, FaMapMarkerAlt, FaSpinner, FaCamera, FaUpload, FaTrash } from "react-icons/fa";
import baseURL2 from "../ApiUrl/NodeBaseURL2";
import baseURL from "../ApiUrl/NodeBaseURL";

// Static data for Indian states, districts, and cities
const indiaStateDistrictCityData = {
  "Andhra Pradesh": {
    districts: {
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
    districts: {
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
    districts: {
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
    districts: {
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
    districts: {
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
    districts: {
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
    districts: {
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
    districts: {
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
    districts: {
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
    districts: {
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
    districts: {
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
    districts: {
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
    districts: {
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
    districts: {
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
    districts: {
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
  
  // Image upload states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // New state for cascading dropdowns
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

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
    district: "",
    city: "",
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

  // Update districts when state changes
  useEffect(() => {
    if (formData.state && indiaStateDistrictCityData[formData.state]) {
      const districts = Object.keys(indiaStateDistrictCityData[formData.state].districts);
      setAvailableDistricts(districts);
      setFormData(prev => ({ ...prev, district: "", city: "" }));
      setAvailableCities([]);
    } else {
      setAvailableDistricts([]);
      setAvailableCities([]);
    }
  }, [formData.state]);

  // Update cities when district changes
  useEffect(() => {
    if (formData.state && formData.district && 
        indiaStateDistrictCityData[formData.state]?.districts[formData.district]) {
      const cities = indiaStateDistrictCityData[formData.state].districts[formData.district];
      setAvailableCities(cities);
      setFormData(prev => ({ ...prev, city: "" }));
    } else {
      setAvailableCities([]);
    }
  }, [formData.district, formData.state]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-capitalize first letter of each word for full_name and company_name
    if (name === 'full_name' || name === 'company_name') {
      setFormData((prev) => ({ ...prev, [name]: capitalizeWords(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please select an image under 5MB.',
          confirmButtonColor: '#3085d6',
        });
        return;
      }
      
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please select a valid image file (JPEG, PNG, GIF, WebP).',
          confirmButtonColor: '#3085d6',
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Start camera capture
  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCapturing(false);
      Swal.fire({
        icon: 'error',
        title: 'Camera Error',
        text: 'Unable to access camera. Please check permissions.',
        confirmButtonColor: '#3085d6',
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `captured-image-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(blob));
        stopCamera();
      }, 'image/jpeg', 0.9);
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

    // Prepare FormData for API
    const formDataToSend = new FormData();
    formDataToSend.append('full_name', formData.full_name);
    formDataToSend.append('email_id', formData.email);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('date_of_birth', formData.dob);
    formDataToSend.append('gender', formData.gender);
    formDataToSend.append('designation', formData.designation);
    formDataToSend.append('date_of_anniversary', formData.anniversary);
    formDataToSend.append('country', formData.country);
    formDataToSend.append('state', formData.state);
    formDataToSend.append('district', formData.district);
    formDataToSend.append('city', formData.city);
    formDataToSend.append('password', formData.password);
    formDataToSend.append('confirm_password', formData.confirmPassword);
    formDataToSend.append('company_name', formData.company_name);
    formDataToSend.append('role', formData.role);
    formDataToSend.append('pincode', formData.pincode);
    formDataToSend.append('latitude', formData.latitude || '');
    formDataToSend.append('longitude', formData.longitude || '');
    formDataToSend.append('status', 'pending');
    
    // Only append image if selected
    if (selectedImage) {
      formDataToSend.append('face_photo', selectedImage);
    }

    try {
      // First API call - Store in user database
      const response = await fetch(`${baseURL}/api/users`, {
        method: "POST",
        body: formDataToSend, // Don't set Content-Type header, browser will set it with boundary
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
  const allStates = Object.keys(indiaStateDistrictCityData);

  return (
    <div className="customerregistration-main-container">
      <div className="customerregistration-form-container">
        <h2>Customer Registration</h2>
        {errorMessage && <div className="customerregistration-error">{errorMessage}</div>}

        <form className="customerregistration-form" onSubmit={handleSubmit} encType="multipart/form-data">
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

          {/* District - Now appears before City */}
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

          {/* City - Now appears after District, and cities load based on selected district */}
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

          {/* Image Upload Section - Optional */}
          <div className="customerregistration-image-section">
            <label className="input-label">Profile Photo <span style={{ color: '#666', fontWeight: 'normal' }}>(Optional)</span></label>
            <div className="customerregistration-image-container">
              {/* Hidden canvas for camera capture */}
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              
              {/* Camera View */}
              {isCapturing && (
                <div className="customerregistration-camera-container">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    className="customerregistration-camera-video"
                  ></video>
                  <div className="customerregistration-camera-controls">
                    <button
                      type="button"
                      className="customerregistration-capture-btn"
                      onClick={capturePhoto}
                    >
                      <FaCamera /> Capture Photo
                    </button>
                    <button
                      type="button"
                      className="customerregistration-cancel-camera-btn"
                      onClick={stopCamera}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && !isCapturing && (
                <div className="customerregistration-image-preview">
                  <img src={imagePreview} alt="Preview" className="customerregistration-preview-img" />
                  <button
                    type="button"
                    className="customerregistration-remove-image-btn"
                    onClick={handleRemoveImage}
                    title="Remove Image"
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              )}

              {/* Upload and Capture Buttons */}
              {!isCapturing && (
                <div className="customerregistration-image-buttons">
                  <button
                    type="button"
                    className="customerregistration-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FaUpload /> Upload Photo
                  </button>
                  <button
                    type="button"
                    className="customerregistration-capture-btn"
                    onClick={startCamera}
                  >
                    <FaCamera /> Take Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
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