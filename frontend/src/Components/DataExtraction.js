import React, { useState } from 'react';
import { REACT_APP_API_URL } from "../consts";
const DataExtraction = () => {
    const [files, setFiles] = useState([]);
    const [response, setResponse] = useState(null);

    const handleFileChange = (event) => {
        setFiles(event.target.files);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();

        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

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
        <div>
            <h1>File Upload</h1>
            <form onSubmit={handleSubmit}>
                <input type="file" multiple onChange={handleFileChange} />
                <button type="submit">Upload</button>
            </form>
            {response && (
                <div>
                    <h2>Response</h2>
                    <pre>{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default DataExtraction;
