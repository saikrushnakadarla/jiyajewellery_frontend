import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../../../Pages/TableLayout/InputField";
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash, FaCamera, FaUpload, FaTrash } from "react-icons/fa";
import Navbar from "../../../Pages/Navbar/Navbar";
import FaceCapture from "../FaceCapture/FaceCapture";
import baseURL from "../../ApiUrl/NodeBaseURL";

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

function SalespersonRegister() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [faceData, setFaceData] = useState(null);
  
  // Image upload states - Mandatory for salesman
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // State for cascading dropdowns - now districts first, then cities
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
    role: "salesman",
    pincode: "",
  });

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

  const handleFaceCaptured = (data) => {
    setFaceData(data);
    setShowFaceCapture(false);
    Swal.fire({
      icon: 'success',
      title: 'Face Captured!',
      text: 'Your face has been successfully registered for face login.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  // Handle file selection for mandatory image upload
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

  // Capture photo from camera for mandatory image
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `captured-profile-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(blob));
        stopCamera();
        
        Swal.fire({
          icon: 'success',
          title: 'Photo Captured!',
          text: 'Your profile photo has been captured successfully.',
          timer: 1500,
          showConfirmButton: false
        });
      }, 'image/jpeg', 0.9);
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

    // Validate mandatory image upload/capture
    if (!selectedImage) {
      Swal.fire({
        icon: 'warning',
        title: 'Profile Photo Required',
        text: 'Please upload or capture a profile photo. This is mandatory for salesman registration.',
        confirmButtonColor: '#3085d6',
      });
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
    apiData.append('district', formData.district);
    apiData.append('city', formData.city);
    apiData.append('password', formData.password);
    apiData.append('confirm_password', formData.confirmPassword);
    apiData.append('company_name', formData.company_name);
    apiData.append('role', formData.role);
    apiData.append('pincode', formData.pincode);
    apiData.append('face_descriptor', JSON.stringify(faceData.descriptor));
    
    // Append face photo from face capture (base64 to file)
    const base64Image = faceData.image;
    const byteString = atob(base64Image.split(',')[1]);
    const mimeString = base64Image.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const faceFile = new File([blob], `face-${Date.now()}.jpg`, { type: mimeString });
    apiData.append('face_photo', faceFile);
    
    // Append mandatory profile photo
    apiData.append('profile_photo', selectedImage);

    try {
      const response = await fetch(`${baseURL}/api/users`, {
        method: "POST",
        body: apiData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Success:", result);
        
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'Your salesman account has been created successfully.',
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

  // Get all states for dropdown
  const allStates = Object.keys(indiaStateDistrictCityData);

  return (
    <>
      <Navbar/>
      <div className="customerregistration-main-container">
        <div className="customerregistration-form-container" style={{marginTop:"90px"}}>
          <h2>Salesman Registration</h2>
          {errorMessage && <div className="customerregistration-error">{errorMessage}</div>}
          
          {/* Face Registration for Face Login */}
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
            {faceData ? '✓ Face Registered for Login' : '📸 Register Face for Login'}
          </button>
          
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

            {/* Mandatory Profile Photo Upload/Capture Section */}
            <div className="customerregistration-image-section">
              <label className="input-label">
                Profile Photo <span className="required-star" style={{ color: 'red', marginLeft: '4px' }}>*</span>
                <span style={{ color: '#666', fontWeight: 'normal', fontSize: '12px' }}> (Mandatory)</span>
              </label>
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
                
                {!selectedImage && !isCapturing && (
                  <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '5px' }}>
                    * Please upload or capture a profile photo
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