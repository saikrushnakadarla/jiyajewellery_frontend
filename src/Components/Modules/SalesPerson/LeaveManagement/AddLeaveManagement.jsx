import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import Swal from 'sweetalert2';
import baseURL from "../../ApiUrl/NodeBaseURL";
import SalesPersonNavbar from '../../../Pages/Navbar/SalesNavbar';
import './AddLeaveManagement.css';

// ---------------------------------------------------------------------------
// Date validation helper
// ---------------------------------------------------------------------------
// Native <input type="date"> always reports "YYYY-MM-DD", but some browsers
// still let a user type more than 4 digits into the year segment, or leave
// the value malformed. We validate strictly before ever using the value
// (on submit), and constrain the native picker with min/max as a first
// line of defense. Crucially, we never validate on every keystroke/onChange
// — a native date input reports an *intermediate* value while you're still
// typing (e.g. typing "2026" one digit at a time briefly reports something
// like "0002-01-01"), so validating there would incorrectly flag normal
// in-progress typing as invalid.
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const MIN_DATE_ATTR = `${MIN_YEAR}-01-01`;
const MAX_DATE_ATTR = `${MAX_YEAR}-12-31`;

const isValidDateString = (value) => {
  if (!value) return true; // empty is handled separately by required-field checks

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < MIN_YEAR || year > MAX_YEAR) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }

  return true;
};

const AddLeaveRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.leaveData;
  const isEditing = location.state?.isEditing || false;

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    start_date: today,
    end_date: today,
    leave_type: 'full_day',
    description: '',
    attachment: null
  });

  const [dateErrors, setDateErrors] = useState({
    start_date: '',
    end_date: ''
  });

  const [salespersonId, setSalespersonId] = useState(null);
  const [salespersonName, setSalespersonName] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [useDummyData, setUseDummyData] = useState(false);

  // Get current logged-in salesperson
  useEffect(() => {
    const getCurrentSalesperson = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const salespersonId = parsedUser.id || parsedUser._id || parsedUser.userId || 'SP001';
          const salespersonName = parsedUser.full_name || parsedUser.name || parsedUser.username || 'John Doe';

          setSalespersonId(salespersonId);
          setSalespersonName(salespersonName);
        } else {
          // Set default if no user data
          setSalespersonId('SP001');
          setSalespersonName('John Doe');
          setUseDummyData(true);
        }
      } catch (error) {
        console.error('Error getting salesperson data:', error);
        setSalespersonId('SP001');
        setSalespersonName('John Doe');
        setUseDummyData(true);
      }
    };

    getCurrentSalesperson();
  }, []);

  // Load edit data if available
  useEffect(() => {
    if (isEditing && editData) {
      setFormData({
        start_date: editData.start_date?.split('T')[0] || today,
        end_date: editData.end_date?.split('T')[0] || today,
        leave_type: editData.leave_type || 'full_day',
        description: editData.description || '',
        attachment: null
      });
      if (editData.attachment) {
        setFileName(editData.attachment);
      }
    }
  }, [isEditing, editData, today]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // For the two date fields: update freely as the user types/picks, with
    // no validation and no alert here — see the comment on isValidDateString
    // above for why. Any inline error is just cleared as soon as they edit.
    if (name === 'start_date' || name === 'end_date') {
      if (dateErrors[name]) {
        setDateErrors((prev) => ({ ...prev, [name]: '' }));
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If start date is changed and end date is before start date, update end date
    if (name === 'start_date' && formData.end_date < value) {
      setFormData(prev => ({
        ...prev,
        end_date: value
      }));
    }
  };

  // Only check once the field loses focus, i.e. the user is likely done
  // typing that date. This is a silent inline hint, never a popup.
  const handleDateBlur = (e) => {
    const { name, value } = e.target;
    setDateErrors((prev) => ({
      ...prev,
      [name]: value && !isValidDateString(value) ? 'Enter a valid date.' : ''
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        attachment: file
      }));
      setFileName(file.name);
    }
  };

  const validateForm = () => {
    if (!formData.start_date) {
      Swal.fire('Error', 'Please select start date', 'error');
      return false;
    }
    if (!isValidDateString(formData.start_date)) {
      Swal.fire('Error', 'Start date is not a valid date. Please re-select it.', 'error');
      return false;
    }
    if (!formData.end_date) {
      Swal.fire('Error', 'Please select end date', 'error');
      return false;
    }
    if (!isValidDateString(formData.end_date)) {
      Swal.fire('Error', 'End date is not a valid date. Please re-select it.', 'error');
      return false;
    }
    if (formData.end_date < formData.start_date) {
      Swal.fire('Error', 'End date cannot be before start date', 'error');
      return false;
    }
    if (!formData.description || formData.description.trim() === '') {
      Swal.fire('Error', 'Please enter description', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Handle demo mode
    if (useDummyData) {
      Swal.fire({
        icon: 'success',
        title: isEditing ? 'Updated! (Demo)' : 'Submitted! (Demo)',
        text: isEditing ? 'Leave request updated successfully in demo mode.' : 'Leave request submitted successfully in demo mode.',
      }).then(() => {
        navigate('/leave-management');
      });
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('salesperson_id', salespersonId);
      formDataToSend.append('salesperson_name', salespersonName);
      formDataToSend.append('start_date', formData.start_date);
      formDataToSend.append('end_date', formData.end_date);
      formDataToSend.append('leave_type', formData.leave_type);
      formDataToSend.append('description', formData.description);

      if (formData.attachment) {
        formDataToSend.append('attachment', formData.attachment);
      }

      let response;
      if (isEditing && editData?.id) {
        response = await axios.put(`${baseURL}/api/leave-request/${editData.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post(`${baseURL}/api/leave-request`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: isEditing ? 'Updated!' : 'Submitted!',
          text: response.data.message || (isEditing ? 'Leave request updated successfully' : 'Leave request submitted successfully'),
        }).then(() => {
          navigate('/leave-management');
        });
      } else {
        Swal.fire('Error', response.data.message || 'Failed to submit leave request', 'error');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);

      // If API fails, treat as demo mode
      if (!useDummyData) {
        Swal.fire({
          icon: 'success',
          title: isEditing ? 'Updated! (Demo)' : 'Submitted! (Demo)',
          text: 'Leave request saved in demo mode.',
        }).then(() => {
          navigate('/leave-management');
        });
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to submit leave request. Please try again.';
        Swal.fire('Error', errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/leave-management');
  };

  return (
    <>
      <SalesPersonNavbar />
      <div className="main-container">
        <Container fluid className="leave-request-container">
          <div className="leave-request-form-section">
            <h2 className="form-title">
              {isEditing ? 'Edit Leave Request' : 'Create Leave Request'}
              {useDummyData && (
                <span style={{
                  marginLeft: '15px',
                  fontSize: '14px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px'
                }}>
                  Demo Mode
                </span>
              )}
            </h2>

            <Form onSubmit={handleSubmit}>
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Start Date <span className="required-star">*</span>
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      onBlur={handleDateBlur}
                      min={MIN_DATE_ATTR}
                      max={MAX_DATE_ATTR}
                      isInvalid={!!dateErrors.start_date}
                      required
                    />
                    {dateErrors.start_date && (
                      <Form.Text style={{ color: '#dc3545' }}>{dateErrors.start_date}</Form.Text>
                    )}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      End Date <span className="required-star">*</span>
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      onBlur={handleDateBlur}
                      min={MIN_DATE_ATTR}
                      max={MAX_DATE_ATTR}
                      isInvalid={!!dateErrors.end_date}
                      required
                    />
                    {dateErrors.end_date && (
                      <Form.Text style={{ color: '#dc3545' }}>{dateErrors.end_date}</Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Leave Type</Form.Label>
                    <div className="leave-type-options">
                      <Form.Check
                        type="radio"
                        id="full_day"
                        name="leave_type"
                        value="full_day"
                        label="Full Day"
                        checked={formData.leave_type === 'full_day'}
                        onChange={handleInputChange}
                        inline
                      />
                      <Form.Check
                        type="radio"
                        id="half_day"
                        name="leave_type"
                        value="half_day"
                        label="Half Day"
                        checked={formData.leave_type === 'half_day'}
                        onChange={handleInputChange}
                        inline
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Attachment (Optional)</Form.Label>
                    <div className="file-upload-wrapper">
                      <Form.Control
                        type="file"
                        name="attachment"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      {fileName && (
                        <div className="file-name-display">
                          Selected file: {fileName}
                        </div>
                      )}
                    </div>
                    <Form.Text className="text-muted">
                      Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 5MB)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Description <span className="required-star">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Enter reason for leave..."
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-4">
                <Col xs={12} className="d-flex justify-content-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                    className="cancel-btn"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="save-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {isEditing ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      isEditing ? 'Update' : 'Save'
                    )}
                  </Button>
                </Col>
              </Row>
            </Form>
          </div>
        </Container>
      </div>
    </>
  );
};

export default AddLeaveRequest;