import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Button, Table, Modal, Form } from "react-bootstrap";
import axios from "axios";
import baseURL from "../../../Modules/ApiUrl/NodeBaseURL";
import Navbar from "../../../Pages/Navbar/Navbar";
import { FaEdit, FaTrash, FaQrcode, FaPrint, FaPlus, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import "./QRCodePrinting.css";

const QRCodePrinting = () => {
  const [packetRecords, setPacketRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    prefix: "",
    qr_number: "",
    qr_code: "",
    packet_date: new Date().toISOString().split('T')[0],
    packet_wt: "",
    status: "Active"
  });
  
  // QR Code preview
  const [qrPreview, setQrPreview] = useState(null);
  const qrCanvasRef = useRef(null);

  // Fetch all packet records
  const fetchPacketRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/api/qr-packets`);
      if (response.data.success) {
        setPacketRecords(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching packet records:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch packet records'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacketRecords();
  }, []);

  // Get next QR number for a prefix
  const getNextQRNumber = async (prefix) => {
    if (!prefix) return "0001";
    
    try {
      const response = await axios.get(`${baseURL}/api/qr-packets/next-number/${prefix}`);
      if (response.data.success) {
        return response.data.next_number;
      }
      return "0001";
    } catch (error) {
      console.error("Error getting next QR number:", error);
      return "0001";
    }
  };

  // Generate QR Code
  const generateQRCode = async (prefix, qrNumber, packetDate, packetWt) => {
    try {
      // Create unique QR code data with combined prefix and number
      const fullQRString = `${prefix}${qrNumber}`;
      const qrData = {
        qr_code: fullQRString,
        prefix: prefix,
        qr_number: qrNumber,
        packet_date: packetDate,
        packet_wt: packetWt,
        timestamp: Date.now()
      };
      
      const qrString = JSON.stringify(qrData);
      
      // Generate QR code image
      const qrImageDataUrl = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      setQrPreview(qrImageDataUrl);
      
      // Set the QR code value in form
      setFormData(prev => ({
        ...prev,
        qr_code: qrString
      }));
      
      return qrString;
    } catch (error) {
      console.error("Error generating QR code:", error);
      return null;
    }
  };

  // Handle prefix change - auto-generate QR number
  const handlePrefixChange = async (e) => {
    const { value } = e.target;
    
    if (value) {
      // Get next available QR number for this prefix
      const nextNumber = await getNextQRNumber(value);
      
      setFormData(prev => ({
        ...prev,
        prefix: value,
        qr_number: nextNumber
      }));
      
      // Regenerate QR code with new prefix and number
      await generateQRCode(
        value, 
        nextNumber, 
        formData.packet_date, 
        formData.packet_wt
      );
    } else {
      setFormData(prev => ({
        ...prev,
        prefix: value,
        qr_number: ""
      }));
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-generate QR code when prefix, number, date, or weight changes
    if (name === 'prefix' || name === 'qr_number' || name === 'packet_date' || name === 'packet_wt') {
      const updatedData = {
        ...formData,
        [name]: value
      };
      generateQRCode(
        updatedData.prefix,
        updatedData.qr_number,
        updatedData.packet_date,
        updatedData.packet_wt
      );
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.prefix || !formData.packet_date) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Prefix and Date are required fields'
      });
      return;
    }

    if (!formData.qr_number) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'QR Number is required'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Generate QR code if not already generated
      if (!formData.qr_code) {
        await generateQRCode(formData.prefix, formData.qr_number, formData.packet_date, formData.packet_wt);
      }
      
      let response;
      
      if (isEditing) {
        response = await axios.put(`${baseURL}/api/qr-packets/${editId}`, {
          ...formData,
          qr_code: formData.qr_code || await generateQRCode(formData.prefix, formData.qr_number, formData.packet_date, formData.packet_wt)
        });
      } else {
        response = await axios.post(`${baseURL}/api/qr-packets`, {
          ...formData,
          qr_code: formData.qr_code || await generateQRCode(formData.prefix, formData.qr_number, formData.packet_date, formData.packet_wt)
        });
      }
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: isEditing ? 'Updated!' : 'Added!',
          text: isEditing ? 'Packet record updated successfully' : `Packet record added successfully with QR Number: ${formData.qr_number}`,
          timer: 2000,
          showConfirmButton: false
        });
        
        resetForm();
        fetchPacketRecords();
      }
    } catch (error) {
      console.error("Error saving packet record:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save packet record'
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      prefix: "",
      qr_number: "",
      qr_code: "",
      packet_date: new Date().toISOString().split('T')[0],
      packet_wt: "",
      status: "Active"
    });
    setQrPreview(null);
    setIsEditing(false);
    setEditId(null);
    setShowForm(false);
  };

  // Handle edit
  const handleEdit = (record) => {
    setFormData({
      prefix: record.prefix || "",
      qr_number: record.qr_number || "",
      qr_code: record.qr_code || "",
      packet_date: record.packet_date ? record.packet_date.split('T')[0] : new Date().toISOString().split('T')[0],
      packet_wt: record.packet_wt || "",
      status: record.status || "Active"
    });
    
    // Generate QR preview for editing
    if (record.qr_code) {
      QRCode.toDataURL(record.qr_code, {
        width: 300,
        margin: 2
      }).then(dataUrl => {
        setQrPreview(dataUrl);
      });
    }
    
    setIsEditing(true);
    setEditId(record.id);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`${baseURL}/api/qr-packets/${id}`);
        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Packet record deleted successfully',
            timer: 1500,
            showConfirmButton: false
          });
          fetchPacketRecords();
        }
      } catch (error) {
        console.error("Error deleting packet record:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete packet record'
        });
      }
    }
  };

  // Handle print QR Code
  const handlePrintQR = async (record) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [75, 25]
      });

      // Generate QR code for printing
      const qrImageData = await QRCode.toDataURL(record.qr_code || JSON.stringify({
        qr_code: `${record.prefix}${record.qr_number}`,
        prefix: record.prefix,
        qr_number: record.qr_number,
        packet_date: record.packet_date,
        packet_wt: record.packet_wt
      }), {
        width: 400,
        margin: 0
      });

      // Set background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 25, 75, "F");

      // Add QR Code
      const leftMargin = 2;
      const qrSize = 21;
      const qrHeight = 13;
      const qrStartY = 1;
      doc.addImage(qrImageData, "PNG", leftMargin, qrStartY, qrSize, qrHeight);

      // Add Text Details
      let textY = 16;
      const textX = 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(4);
      doc.setTextColor(0, 0, 0);

      doc.text(`QR: ${record.prefix}${record.qr_number}`, textX, textY);
      textY += 2;
      doc.text(`Date: ${record.packet_date}`, textX, textY);
      textY += 2;
      
      if (record.packet_wt) {
        doc.text(`Weight: ${record.packet_wt}g`, textX, textY);
      }

      // Save PDF
      doc.save(`QR_${record.prefix}${record.qr_number}_${record.packet_date}.pdf`);
      
      // Upload PDF to server
      const pdfBlob = doc.output("blob");
      const formData = new FormData();
      formData.append("invoice", pdfBlob, `QR_${record.prefix}${record.qr_number}.pdf`);
      
      await axios.post(`${baseURL}/upload-invoice`, formData);
      
      Swal.fire({
        icon: 'success',
        title: 'Printed!',
        text: 'QR Code PDF generated successfully',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Error printing QR code:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to generate QR Code PDF'
      });
    }
  };

  // Filter records based on search
  const filteredRecords = packetRecords.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (record.prefix?.toLowerCase().includes(searchLower)) ||
      (record.qr_number?.toLowerCase().includes(searchLower)) ||
      (`${record.prefix}${record.qr_number}`?.toLowerCase().includes(searchLower)) ||
      (record.packet_date?.includes(searchTerm)) ||
      (record.packet_wt?.toString().includes(searchTerm))
    );
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Navbar />
      <div className="qr-code-main-container">
        <Container className="qr-code-container">
          {/* Header */}
          <Row className="qr-code-header-row mb-4">
            <Col md={12}>
              <div className="qr-code-header-card">
                <div className="qr-code-header-content">
                  <div className="qr-code-header-icon-wrapper">
                    <FaQrcode className="qr-code-header-icon" />
                  </div>
                  <div className="qr-code-header-text">
                    <h1 className="qr-code-header-title">QR Code Printing Module</h1>
                    <p className="qr-code-header-subtitle">Generate and manage QR codes for packet tracking</p>
                  </div>
                </div>
                <Button 
                  className="qr-code-add-btn"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  <FaPlus /> Add New Packet
                </Button>
              </div>
            </Col>
          </Row>

          {/* Search Bar */}
          <Row className="qr-code-search-row mb-4">
            <Col md={6}>
              <div className="qr-code-search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by prefix, QR number, or weight..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="qr-code-search-input"
                />
              </div>
            </Col>
            <Col md={6} className="text-end">
              <span className="record-count">
                Total Records: {filteredRecords.length}
              </span>
            </Col>
          </Row>

          {/* Form Section */}
          {showForm && (
            <Row className="qr-code-form-section mb-4">
              <Col md={12}>
                <div className="qr-code-form-card">
                  <h4 className="form-title">
                    {isEditing ? 'Edit Packet Record' : 'Add New Packet Record'}
                  </h4>
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Prefix <span className="required">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="prefix"
                            value={formData.prefix}
                            onChange={handlePrefixChange}
                            placeholder="Enter prefix (e.g., PKT, PGT)"
                            required
                          />
                          <Form.Text className="text-muted">
                            QR Number will auto-increment based on prefix
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>QR Number <span className="required">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="qr_number"
                            value={formData.qr_number}
                            onChange={handleInputChange}
                            placeholder="Auto-generated"
                            readOnly={!isEditing}
                            className={!isEditing ? "bg-light" : ""}
                          />
                          <Form.Text className="text-muted">
                            Format: {formData.prefix}{formData.qr_number}
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Date <span className="required">*</span></Form.Label>
                          <Form.Control
                            type="date"
                            name="packet_date"
                            value={formData.packet_date}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Packet Weight (grams)</Form.Label>
                          <Form.Control
                            type="number"
                            name="packet_wt"
                            value={formData.packet_wt}
                            onChange={handleInputChange}
                            placeholder="Enter packet weight"
                            step="0.001"
                            min="0"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full QR Code Value</Form.Label>
                          <Form.Control
                            type="text"
                            value={`${formData.prefix}${formData.qr_number}`}
                            readOnly
                            className="bg-light"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>QR Code Data (JSON)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            name="qr_code"
                            value={formData.qr_code}
                            readOnly
                            className="qr-code-data-textarea"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* QR Code Preview */}
                    {qrPreview && (
                      <Row className="mb-3">
                        <Col md={12} className="text-center">
                          <div className="qr-preview-container">
                            <h5>QR Code Preview</h5>
                            <img 
                              src={qrPreview} 
                              alt="QR Code Preview" 
                              className="qr-preview-image"
                            />
                            <p className="mt-2">
                              <strong>{formData.prefix}{formData.qr_number}</strong>
                            </p>
                            <canvas ref={qrCanvasRef} style={{ display: 'none' }} />
                          </div>
                        </Col>
                      </Row>
                    )}

                    <Row>
                      <Col md={12} className="d-flex gap-2 justify-content-end">
                        <Button 
                          variant="secondary" 
                          onClick={resetForm}
                          className="cancel-btn"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="save-btn"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </div>
              </Col>
            </Row>
          )}

          {/* Records Table */}
          <Row className="qr-code-table-section">
            <Col md={12}>
              <div className="qr-code-table-card">
                <h4 className="table-title">
                  <FaQrcode className="table-icon" /> Packet Records
                </h4>
                <div className="table-responsive">
                  <Table bordered hover className="qr-code-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>QR Code</th>
                        <th>Prefix</th>
                        <th>QR Number</th>
                        <th>Date</th>
                        <th>Packet Weight</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="text-center">Loading...</td>
                        </tr>
                      ) : filteredRecords.length > 0 ? (
                        filteredRecords.map((record, index) => (
                          <tr key={record.id}>
                            <td>{index + 1}</td>
                            <td>
                              <span className="qr-code-badge">
                                {record.prefix}{record.qr_number}
                              </span>
                            </td>
                            <td>
                              <span className="prefix-badge">{record.prefix}</span>
                            </td>
                            <td>
                              <span className="qr-number-badge">{record.qr_number}</span>
                            </td>
                            <td>{formatDate(record.packet_date)}</td>
                            <td>{record.packet_wt ? `${record.packet_wt} g` : '-'}</td>
                            <td>{formatDate(record.created_at)}</td>
                            <td>
                              <div className="action-buttons">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handlePrintQR(record)}
                                  title="Print QR Code"
                                  className="action-btn"
                                >
                                  <FaPrint />
                                </Button>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleEdit(record)}
                                  title="Edit"
                                  className="action-btn"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(record.id)}
                                  title="Delete"
                                  className="action-btn"
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center no-records">
                            No packet records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default QRCodePrinting;