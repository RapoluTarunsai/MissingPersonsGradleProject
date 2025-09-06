import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/signup.module.css';
import {toast, ToastContainer} from "react-toastify";

function Signup() {
    const [user, setUser] = useState({ name: '', email: '', location: '', password: '' });
    const navigate = useNavigate();
    const [stateSuggestions, setStateSuggestions] = useState([]);
    const [showPassword, setShowPassword] = useState(false);

    const validatePassword = (password) => {
        const minLength = 8;
        const maxLength = 12;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength || password.length > maxLength) {
            toast.error('Password must be between 8-12 characters long');
            return false;
        }
        if (!hasUpperCase) {
            toast.error('Password must contain at least one uppercase letter');
            return false;
        }
        if (!hasLowerCase) {
            toast.error('Password must contain at least one lowercase letter');
            return false;
        }
        if (!hasNumbers) {
            toast.error('Password must contain at least one number');
            return false;
        }
        if (!hasSpecialChar) {
            toast.error('Password must contain at least one special character');
            return false;
        }
        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validatePassword(user.password)) {
            return;
        }
        try {
            const response = await axios.post('/api/auth/signup', user);
            console.log('Server Response', response.data);
            if (response.data.success) {
                toast.success('Signup successful! Redirecting to login...', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                });
                setTimeout(() => navigate('/login'), 3000);
            }
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || 'Signup failed. Please try again.';
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });
        }
    };
    const getLocation = () => {
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
                        autoClose: 3000,
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
    const handleStateSearch = async (searchTerm) => {
        if (searchTerm.length > 4) {
            try {
                //Get the Api key from the Geocode "https://geocode.maps.co/docs/"
                const response = await axios.get(
                    `https://geocode.maps.co/search?q=${searchTerm}&api_key=`
                );
                console.log('Search Response:', response.data); // Add this to debug
                const states = response.data
                    .filter(item => item.class === "boundary" && item.type === "administrative")
                    .map(item => item.display_name.split(',')[0].trim())
                    .filter((state, index, self) => self.indexOf(state) === index)
                    .slice(0, 5);
                console.log('Filtered States:', states);
                setStateSuggestions(states);
            } catch (error) {
                console.error('Error fetching cities:', error);
            }
        } else {
            setStateSuggestions([]);
        }
    };

    const selectState = (state, e) => {
        e.preventDefault(); // Prevent form submission
        e.stopPropagation(); // Stop event bubbling
        setUser({...user, location: state});
        setStateSuggestions([]);
    };

    return (
        <div className={styles.container}>
            <ToastContainer theme="colored" />
            <h2 className={styles.title}>Sign Up</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    className={styles.input}
                    type="text"
                    placeholder="Name"
                    onChange={(e) => setUser({...user, name: e.target.value})}
                    required
                />
                <input
                    className={styles.input}
                    type="email"
                    placeholder="Email"
                    onChange={(e) => setUser({...user, email: e.target.value})}
                    required
                />
                <div className={styles.locationWrapper}>
                    <div className={styles.locationContainer}>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Enter the state name or please give location access"
                            value={user.location}
                            onChange={async (e) => {
                                setUser({...user, location: e.target.value});
                                await handleStateSearch(e.target.value);
                            }}
                            required
                        />
                        <button
                            type="button"
                            className={styles.locationButton}
                            onClick={getLocation}
                            title="Click to access your location"
                        >
                            📍
                        </button>
                    </div>
                    {stateSuggestions.length > 0 && (
                        <ul className={styles.suggestions}>
                            {stateSuggestions.map((state, index) => (
                                <li
                                    key={index}
                                    onClick={(e) => selectState(state, e)}
                                    className={styles.suggestionItem}
                                >
                                    {state}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <input
                    className={styles.input}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    onChange={(e) => setUser({...user, password: e.target.value})}
                    required
                />
                <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
                <p className={styles.passwordText}>Password should be 8-12 characters with uppercase, lowercase, number
                    & special char</p>

                <button className={styles.button} type="submit">Sign Up</button>
            </form>
        </div>
    );
}

export default Signup;