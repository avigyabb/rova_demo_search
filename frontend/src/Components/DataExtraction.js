import React, { useState } from 'react';
import { REACT_APP_API_URL } from "../consts";
import '../Styles/DataExtraction.css';

const DataExtraction = () => {
    const [files, setFiles] = useState([]);
    const [instruction, setInstruction] = useState('');
    const [response, setResponse] = useState(null);

    const handleFileChange = (event) => {
        setFiles(event.target.files);
    };

    const handleInstructionChange = (event) => {
        setInstruction(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();

        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        formData.append('instruction', instruction);

        try {
            const res = await fetch(REACT_APP_API_URL + 'data-extraction/', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await res.json();
            setResponse(data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="container">
            <h1 className='heading-properties'>Jetty -- Your Personal Data Extraction Assistant</h1>
            <form onSubmit={handleSubmit} className="form-container">
                <div className="form-group">
                    <label className='label-box' htmlFor="instruction">Enter Data Extraction Instructions (what to extract) below:</label>
                    <textarea
                        id="instruction"
                        value={instruction}
                        onChange={handleInstructionChange}
                        className="instruction-box"
                    />
                </div>
                <div className="form-group upload-group">
                    <label htmlFor="files">Upload files:</label>
                    <input type="file" multiple id="files" onChange={handleFileChange} />
                    <button type="submit" className="upload-button">Submit Files</button>
                </div>
            </form>
            {response && (
                <div className="response-container">
                    <div className="response-content">
                        {response.content.map((item, index) => (
                            <div key={index} className="card">
                                <h3>{item.file_name}</h3>
                                <p>Data: {item.data.data}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataExtraction;
