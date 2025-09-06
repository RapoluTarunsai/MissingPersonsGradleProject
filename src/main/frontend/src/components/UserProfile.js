import React, { useState, useEffect } from 'react';
import styles from '../styles/userprofile.module.css';
import { FaUser, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import {toast} from "react-toastify";

function UserProfile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [profilePicture, setProfilePicture] = useState(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/users/view', { withCredentials: true });
            setUser(response.data.user);
            setError(null);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setError('Failed to load user profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    const getUpdatedLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    //Get the Api key from the Geocode "https://geocode.maps.co/docs/"
                    const response = await axios.get(
                        `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=`
                    );
                    console.log('Location Response', response.data);
                    const state = response.data.address.state;
                    setUser({...user, location: state});
                    toast.success('Location detected successfully!', {
                        position: "top-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        theme: "colored"
                    });
                } catch (error) {
                    toast.warning('Could not fetch location automatically. Please enter manually.', {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        theme: "colored"
                    });
                }
            }, () => {
                toast.info('Please enable location access or enter your state manually.', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "colored"
                });
            });
        }
    };
    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/api/users/upload-profile-pic', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });

            toast.success('Profile picture uploaded successfully!');

            // Refresh user data to get updated profile picture
            fetchUserProfile();
        } catch (error) {
            toast.error('Failed to upload profile picture');
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await axios.put('/api/users/update', {
                name: user.name,
                email: user.email,
                location: user.location,
            });
            setUser(response.data);
            toast.success('Profile updated successfully!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            navigate('/missing-persons')
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile. Please try again.', {
                position: "top-right",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <div className={styles.loader}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!user) return <div className={styles.noData}>No user data available</div>;

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileCard}>
                <div className={styles.userInfo}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatar}>
                            {user.profilePicture ? (
                                <img
                                    src={`data:image/png;base64,${user.profilePicture}`}
                                    alt="Profile"
                                    className={styles.avatarImage}
                                />
                            ) : (
                                <FaUser className={styles.avatarIcon} />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                className={styles.fileInput}
                            />
                        </div>
                    </div>
                    <div className={styles.userDetails}>
                        <h2>{user.name}</h2>
                        <form onSubmit={handleSubmit} className={styles.updateForm}>
                            <div className={styles.formGroup}>
                                <FaUser className={styles.inputIcon}/>
                                <input
                                    type="text"
                                    value={user.name}
                                    onChange={(e) => setUser({...user, name: e.target.value})}
                                    className={styles.input}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <FaEnvelope className={styles.inputIcon}/>
                                <input
                                    type="email"
                                    value={user.email}
                                    onChange={(e) => setUser({...user, email: e.target.value})}
                                    className={styles.input}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <FaMapMarkerAlt className={styles.inputIcon}/>
                                    <input
                                        type="text"
                                        value={user.location}
                                        onChange={(e) => setUser({...user, location: e.target.value})}
                                        className={styles.input}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className={styles.locationButton}
                                        onClick={getUpdatedLocation}
                                    >
                                        📍
                                    </button>
                            </div>
                            <button type="submit" className={styles.submitButton} disabled={loading}>
                                {loading ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserProfile;
