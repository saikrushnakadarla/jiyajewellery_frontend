import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const ProtectedSalesRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);
  const location = useLocation();

  useEffect(() => {
    checkDailyAttendance();
  }, []);

  const checkDailyAttendance = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setRedirectTo('/login');
        setIsLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      
      // Only apply this check for salesperson role
      if (user.role?.toLowerCase() !== 'salesman') {
        setCanAccess(true);
        setIsLoading(false);
        return;
      }

      // First check session storage for today's check-in
      const today = new Date().toDateString();
      const lastCheckInDate = sessionStorage.getItem('lastCheckInDate');
      const attendanceChecked = sessionStorage.getItem('attendanceChecked') === 'true';
      
      // If already checked in today in this session, allow access
      if (attendanceChecked && lastCheckInDate === today) {
        setCanAccess(true);
        setIsLoading(false);
        return;
      }

      // Check with backend if already checked in today
      try {
        const response = await axios.get(`http://localhost:5000/api/attendance/status/${user.id}`);
        
        if (response.data.success) {
          const attendance = response.data.data;
          
          // Check if already checked in today
          if (attendance.checked_in) {
            // Store in session storage
            sessionStorage.setItem('attendanceChecked', 'true');
            sessionStorage.setItem('lastCheckInDate', today);
            setCanAccess(true);
          } else {
            // Not checked in today - redirect to attendance
            setRedirectTo('/attendance');
            
            // Show gentle reminder
            Swal.fire({
              icon: 'info',
              title: 'Daily Check-in Required',
              text: 'Please complete your attendance check-in for today',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } else {
          // If API fails, allow access (fallback)
          setCanAccess(true);
        }
      } catch (error) {
        console.error('Error checking attendance:', error);
        // On error, allow access (fallback)
        setCanAccess(true);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setRedirectTo('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ color: '#666', fontSize: '14px' }}>Verifying today's attendance...</p>
      </div>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return canAccess ? children : <Navigate to="/attendance" state={{ from: location }} replace />;
};

export default ProtectedSalesRoute;