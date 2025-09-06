import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from "../styles/updatemissingperson.module.css";
import {format} from "date-fns";

function UpdateMissingPerson() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        image: null,
        lastSeen: new Date(),
        description: ''
    });
    const [error, setError] = useState('');
    const [currentImage, setCurrentImage] = useState('');
    const [newImagePreview, setNewImagePreview] = useState('');
    useEffect(() => {
        // Fetch existing details
        const fetchMissingPerson = async () => {
            try {
                const response = await axios.get(`/api/missing-persons/${id}`);
                const person = response.data;
                setFormData({
                    name: person.name,
                    lastSeen: new Date(person.lastSeen),
                    description: person.description
                });
                setCurrentImage(`data:image/jpeg;base64,${person.imageData}`);
            } catch (err) {
                setError('Failed to fetch missing person details');
            }
        };
        fetchMissingPerson();
    }, [id]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const updateData = new FormData();
        if (formData.name) updateData.append('name', formData.name);
        if (formData.image) updateData.append('image', formData.image);
        if (formData.lastSeen) updateData.append('lastSeen', format(formData.lastSeen, "yyyy-MM-dd'T'HH:mm:ss"));
        if (formData.description) updateData.append('description', formData.description);

        try {
            await axios.put(`/api/missing-persons/reported-persons/${id}`, updateData);
            navigate('/missing-persons/reported-persons');
        } catch (err) {
            setError(err.response?.data || 'Failed to update missing person');
        }
    };

    return (
        <div className={styles["update-missing-person"]}>
            <h2>Update Missing Person Report</h2>
            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className={styles["form-group"]}>
                    <label htmlFor="name">Name:</label>
                    <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div className={styles["form-group"]}>
                    <label>Current Photo:</label>
                    {currentImage && (
                        <img
                            src={currentImage}
                            alt="Current"
                            style={{width: '250px', height: '250px'}}
                            className={styles["image-preview"]}
                        />
                    )}
                    <label htmlFor="image">New Photo:</label>
                    <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    {newImagePreview && (
                        <img
                            src={newImagePreview}
                            alt="New Preview"
                            style={{width: '250px', height: '250px'}}
                            className={styles["image-preview"]}
                        />
                    )}
                </div>
                <div className={styles["form-group"]}>
                    <label htmlFor="lastSeen">Last Seen:</label>
                    <DatePicker
                        id="lastSeen"
                        selected={formData.lastSeen}
                        onChange={(date) => setFormData({...formData, lastSeen: date})}
                        showTimeSelect
                        dateFormat="yyyy-MM-dd HH:mm"
                        className={styles["date-picker"]}
                    />
                </div>
                <div className={styles["form-group"]}>
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows="4"
                    />
                </div>
                <div className={styles["button-group"]}>
                    <button type="submit" className={styles["submit-btn"]}>Update Report</button>
                    <button type="button" onClick={() => navigate('/missing-persons/reported-persons')} className={styles["cancel-btn"]}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default UpdateMissingPerson;
