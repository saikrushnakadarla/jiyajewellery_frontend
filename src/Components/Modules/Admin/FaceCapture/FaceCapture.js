import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import './FaceCapture.css';

const FaceCapture = ({ onFaceCaptured, onClose, mode = 'register' }) => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedFace, setDetectedFace] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        // Models path - you need to download these models and put in public/models folder
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setModelsLoaded(true);
        setLoading(false);
      } catch (err) {
        console.error('Error loading face models:', err);
        setError('Failed to load face detection models');
        setLoading(false);
      }
    };
    loadModels();
  }, []);

  const detectFace = async () => {
    if (!webcamRef.current || !modelsLoaded) return;

    const image = webcamRef.current.getScreenshot();
    if (!image) return;

    const img = new Image();
    img.src = image;
    img.onload = async () => {
      const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
      
      if (detections.length === 1) {
        setDetectedFace(true);
        const descriptor = Array.from(detections[0].descriptor);
        setFaceDescriptor(descriptor);
        setCapturedImage(image);
      } else if (detections.length === 0) {
        setDetectedFace(false);
        setError('No face detected. Please position your face in the center.');
        setTimeout(() => setError(null), 3000);
      } else {
        setDetectedFace(false);
        setError('Multiple faces detected. Please ensure only your face is visible.');
        setTimeout(() => setError(null), 3000);
      }
    };
  };

  const handleCapture = async () => {
    await detectFace();
  };

  const handleConfirm = () => {
    if (faceDescriptor && capturedImage) {
      onFaceCaptured({
        descriptor: faceDescriptor,
        image: capturedImage
      });
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setFaceDescriptor(null);
    setDetectedFace(false);
    setError(null);
  };

  return (
    <div className="face-capture-overlay">
      <div className="face-capture-modal">
        <div className="face-capture-header">
          <h3>{mode === 'register' ? 'Register Your Face' : 'Face Login'}</h3>
          {onClose && (
            <button className="face-capture-close" onClick={onClose}>×</button>
          )}
        </div>
        
        <div className="face-capture-content">
          {loading && !modelsLoaded && (
            <div className="face-loading">
              <div className="spinner"></div>
              <p>Loading face detection models...</p>
            </div>
          )}
          
          {error && <div className="face-error">{error}</div>}
          
          {!capturedImage ? (
            <>
              <div className="webcam-container">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: "user"
                  }}
                  className="face-webcam"
                />
                <div className="face-guide">
                  <p>Position your face in the center</p>
                  <div className="face-frame"></div>
                </div>
              </div>
              
              <div className="face-capture-actions">
                <button 
                  onClick={handleCapture} 
                  disabled={!modelsLoaded || loading}
                  className="btn-capture"
                >
                  Capture Face
                </button>
                {onClose && (
                  <button onClick={onClose} className="btn-cancel">
                    Cancel
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="captured-preview">
                <img src={capturedImage} alt="Captured face" />
                {detectedFace && (
                  <div className="captured-success">
                    <span>✓ Face detected successfully</span>
                  </div>
                )}
              </div>
              
              <div className="face-capture-actions">
                <button onClick={handleConfirm} className="btn-confirm">
                  {mode === 'register' ? 'Register Face' : 'Login with Face'}
                </button>
                <button onClick={handleRetake} className="btn-retake">
                  Retake
                </button>
                {onClose && mode !== 'register' && (
                  <button onClick={onClose} className="btn-cancel">
                    Cancel
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="face-capture-footer">
          <p className="face-info">
            {mode === 'register' 
              ? 'Your face will be stored securely for future logins' 
              : 'Look at the camera for face recognition'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaceCapture;