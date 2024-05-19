import React, { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import "../Styles/FileUpload.css"

const FileUploadComponent = () => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('http://localhost:8000/files/');
        const result = await response.json();
        setFiles(result);
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();
  }, []);

  const handleDelete = async (fileId) => {
    try {
      const response = await fetch(`http://localhost:8000/delete/${fileId}/`, {
        method: 'DELETE',
      });
      if (response.status === 204) {
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      } else {
        console.error('Error deleting file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleUpload = async (event, isGrantApp) => {
    const newFiles = Array.from(event.target.files);

    for (const file of newFiles) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`http://localhost:8000/upload/${isGrantApp}/`, {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        console.log(result);

        // Add the uploaded file data to the state
        if(!isGrantApp) {
            setFiles((prevFiles) => [...prevFiles, result]);
        }
        
      } catch (error) {
        console.error('Error uploading files:', error);
      }
    }
  };
  

  return (
      <div style={{ 
        width: '300px', 
        backgroundColor: '#f0f0f0', 
        padding: '20px', 
        borderRight: '1px solid black', 
        overflowY: 'auto' 
      }}>
        <label className="custom-file-input">
        Upload Research
        <input
          type="file"
          multiple
          onChange={(event) => handleUpload(event, 0)}
          style={{ display: 'none' }}
        />
      </label>

        <div style={{ marginTop: '20px' }}>
          <h3>Uploaded Files</h3>
          {files.length === 0 ? (
            <p>No files uploaded yet.</p>
          ) : (
            <ul style={{ paddingLeft: '20px' }}>
              {files.map((file) => (
                <li key={file.filename} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.filename}</span>
                  <FaTrash 
                    style={{ cursor: 'pointer', color: 'red', flexShrink: 0 }} 
                    onClick={() => handleDelete(file.id)} 
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <label className="custom-file-input">
        Upload Templates
        <input
          type="file"
          multiple
          onChange={(event) => handleUpload(event, 1)}
          style={{ display: 'none' }}
        />
      </label>
      </div>
  );
};

export default FileUploadComponent;
