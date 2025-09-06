import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { Country, State, City } from 'country-state-city';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import styles from "../styles/addmissingperson.module.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AddMissingPerson() {
    const [missingPerson, setMissingPerson] = useState({
        name: '',
        image: null,
        lastSeen: new Date(),
        age: '',
        location: '',
        country: '' ,
        state: '',
        city: '',
        description: '',});
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const navigate = useNavigate();
    const [similarProfiles, setSimilarProfiles] = useState([]);

    useEffect(() => {
        setCountries(Country.getAllCountries());
    }, []);

    useEffect(() => {
        if (missingPerson.country) {
            setStates(State.getStatesOfCountry(missingPerson.country));
        } else {
            setStates([]);
        }
        setMissingPerson(prev => ({ ...prev, state: '', city: '' }));
    }, [missingPerson.country]);

    useEffect(() => {
        if (missingPerson.state) {
            setCities(City.getCitiesOfState(missingPerson.country, missingPerson.state));
        } else {
            setCities([]);
        }
        setMissingPerson(prev => ({ ...prev, city: '' }));
    }, [missingPerson.state, missingPerson.country]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('name', missingPerson.name);
        formData.append('image', missingPerson.image);
        formData.append('lastSeen', format(missingPerson.lastSeen, "yyyy-MM-dd'T'HH:mm:ss"));
        formData.append('age', missingPerson.age);
        formData.append('location', missingPerson.location);
        formData.append('country', Country.getCountryByCode(missingPerson.country).name);
        formData.append('state', State.getStateByCodeAndCountry(missingPerson.state, missingPerson.country).name);
        formData.append('city', missingPerson.city);
        formData.append('description', missingPerson.description);


        try {
            const response = await axios.post('/api/missing-persons/add', formData);
            console.log(response.data);
            toast.success('🎉 Missing person report added successfully!', {
              position: "top-center",
              autoClose: 3000
                });
                setTimeout(() => {
                navigate('/missing-persons');
            }, 3000);
        } catch (error) {
            console.error('Error adding missing person:', error);
            if (error.response && error.response.data) {
                toast.error(typeof error.response.data === 'string'
                    ? error.response.data
                    : error.response.data.error || 'Failed to add missing person. Please try again.');
            } else {
                toast.error('Failed to add missing person. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMissingPerson({ ...missingPerson, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleNameChange = async (e) => {
        const newName = e.target.value;
        setMissingPerson({...missingPerson, name: newName});

        if (newName.length >= 3) {
            try {
                const response = await axios.get('/api/missing-persons/quick-search', {
                    params: { name: newName }
                });
                setSimilarProfiles(response.data);
            } catch (error) {
                console.error('Error fetching similar profiles:', error);
            }
        } else {
            setSimilarProfiles([]);
        }
    };

    return (
        <div className={styles.container}>
            <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
            <div className={styles["add-missing-person"]}>
                <h2>Report a Missing Person</h2>
                {error && <div className={styles["error-message"]}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className={styles["form-group"]}>
                        <label htmlFor="name">Name:</label>
                        <input
                            type="text"
                            id="name"
                            placeholder="Enter the missing person's name"
                            value={missingPerson.name}
                            onChange={handleNameChange}
                            required
                        />
                        {similarProfiles.length > 0 && (
                            <div className={styles["similar-profiles"]}>
                                <h4>Similar Profiles Found:</h4>
                                <div className={styles["profiles-container"]}>
                                    {similarProfiles.map(profile => (
                                        <div key={profile.id} className={styles["similar-profile-card"]}>
                                            <img
                                                src={`data:image/jpeg;base64,${profile.imageData}`}
                                                alt={profile.name}
                                                className={styles["profile-image"]}
                                            />
                                            <div className={styles["profile-info"]}>
                                                <p className={styles["profile-name"]}>{profile.name}</p>
                                                <button
                                                    onClick={() => navigate(`/missing-persons/${profile.id}`)}
                                                    className={styles["view-button"]}
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={styles["form-group"]}>
                        <label htmlFor="image">Photo:</label>
                        <input
                            type="file"
                            id="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            required
                        />
                        {imagePreview && (
                            <div className={styles["image-preview-container"]}>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className={styles["image-preview"]}
                                    style={{width: '250px', height: '250px'}}
                                />
                            </div>
                        )}
                    </div>
                    <div className={styles["form-group"]}>
                        <label htmlFor="lastSeen">Last Seen:</label>
                        <DatePicker
                            id="lastSeen"
                            selected={missingPerson.lastSeen}
                            onChange={(date) => setMissingPerson({...missingPerson, lastSeen: date})}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            timeCaption="time"
                            dateFormat="yyyy-MM-dd'T'HH:mm:ss"
                            className={styles["date-picker"]}
                        />
                    </div>
                    <div className={styles["form-group"]}>
                        <label htmlFor="age">Age:</label>
                        <input
                            type="number"
                            id="age"
                            min="0"
                            max="120"
                            placeholder="Enter the missing person's age"
                            value={missingPerson.age}
                            onChange={(e) => setMissingPerson({...missingPerson, age: e.target.value})}
                            className={styles["select-input"]}
                            required
                        />
                    </div>
                    <div className={styles["form-group"]}>
                        <label htmlFor="location">Specific Location/Address:</label>
                        <input
                            type="text"
                            id="location"
                            placeholder="Enter specific location or address where the person was last seen"
                            value={missingPerson.location}
                            onChange={(e) => setMissingPerson({...missingPerson, location: e.target.value})}
                            required
                        />
                    </div>
                    <div className={styles["form-group"]}>
                        <label htmlFor="country">Country:</label>
                        <select
                            id="country"
                            value={missingPerson.country}
                            onChange={(e) => setMissingPerson({...missingPerson, country: e.target.value})}
                            className={styles["select-input"]}
                            required
                        >
                            <option value="">Select Country</option>
                            {countries.map((country) => (
                                <option key={country.isoCode} value={country.isoCode}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles["form-group"]}>
                        <label htmlFor="state">State:</label>
                        <select
                            id="state"
                            placeholder="Select state or province where the person was last seen"
                            value={missingPerson.state}
                            onChange={(e) => setMissingPerson({...missingPerson, state: e.target.value})}
                            className={styles["select-input"]}
                            required
                            disabled={!missingPerson.country}
                        >
                            <option value="">Select State</option>
                            {states.map((state) => (
                                <option key={state.isoCode} value={state.isoCode}>
                                    {state.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles["form-group"]}>
                        <label htmlFor="city">City:</label>
                        <select
                            id="city"
                            placeholder="Select city name where the person was last seen"
                            value={missingPerson.city}
                            onChange={(e) => setMissingPerson({...missingPerson, city: e.target.value})}
                            className={styles["select-input"]}
                            required
                            disabled={!missingPerson.state}
                        >
                            <option value="">Select City</option>
                            {cities.map((city) => (
                                <option key={city.name} value={city.name}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles["form-group"]}>
                        <label htmlFor="description">Description:</label>
                        <textarea
                            id="description"
                            value={missingPerson.description}
                            onChange={(e) => setMissingPerson({...missingPerson, description: e.target.value})}
                            rows="4"
                            placeholder="Enter any additional details that might help identify the person"

                        />
                    </div>
                    <button type="submit" className={styles.submit} disabled={isLoading}>
                        {isLoading ? 'Submitting...' : 'Add Missing Person'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AddMissingPerson;

