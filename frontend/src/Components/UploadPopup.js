import React, { useEffect, useRef, useState } from 'react';
import { REACT_APP_API_URL } from "../consts";

const UploadPopup = ({ onClose, popupFileInputRef, handleUpload }) => {
  const popupRef = useRef();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleUrlSubmit = async () => {
    try {
      const response = await fetch(REACT_APP_API_URL + 'upload-url/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          selectedFileIds: JSON.parse(sessionStorage.getItem('selectedFileIds')),
        }),
      });

      if (response.status === 201) {
        const result = await response.json();
        console.log(result);
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Error uploading URL:', errorData.error);
      }
    } catch (error) {
      console.error('Error uploading URL:', error);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: showUrlInput ? '150px' : '200px',
        backgroundColor: 'white',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
      ref={popupRef}
    >
      {showUrlInput ? (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '20px' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL"
            style={{
              padding: '10px',
              marginBottom: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              width: '100%',
            }}
          />
          <button
            style={{
              padding: '10px',
              backgroundColor: '#cfe7dc',
              color: 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
            onClick={handleUrlSubmit}
          >
            Submit URL
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center', padding: '20px' }}>
          <button
            style={{
              marginBottom: '10px',
              padding: '10px 20px',
              backgroundColor: '#a1d3e2',
              color: 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              width: '100%',
            }}
            onClick={() => {
              onClose();
              if (popupFileInputRef.current) {
                popupFileInputRef.current.click();
              }
            }}
          >
            Upload Files
          </button>
          <button
            style={{
              marginBottom: '10px',
              padding: '10px 20px',
              backgroundColor: '#cfe7dc',
              color: 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              width: '100%',
            }}
            onClick={() => setShowUrlInput(true)}
          >
            Upload URL
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadPopup;
