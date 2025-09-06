import React, { useState } from 'react';
import axios from 'axios';

function CompareImage() {
    const [image, setImage] = useState(null);
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('image', image);

        try {
            const response = await axios.post('/api/missing-personsss/compare', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setResult(response.data);
        } catch (error) {
            console.error('Error comparing image:', error);
            setResult('Error occurred while comparing the image');
        }
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    return (
        <div>
            <h2>Compare Image</h2>
            <form onSubmit={handleSubmit}>
                <input type="file" onChange={handleImageChange} required />
                <button type="submit">Compare</button>
            </form>
            {result && (
                <div>
                    <h3>Result:</h3>
                    {typeof result === 'string' ? (
                        <p>{result}</p>
                    ) : (
                        <div>
                            <p>Potential match found:</p>
                            <p>Name: {result.name}</p>
                            <img src={`data:image/jpeg;base64,${result.imageData}`} alt={result.name} style={{width: '200px', height: '200px'}} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default CompareImage;

