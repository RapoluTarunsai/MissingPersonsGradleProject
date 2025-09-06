import React, {useState, useEffect, useRef} from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import  styles from '../styles/missingpersonshome.module.css';
import ChatBot from './ChatBot';
import {FaSearch, FaUserPlus} from "react-icons/fa";
import {toast} from "react-toastify";

function MissingPersons() {
  const [missingPersons, setMissingPersons] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [nearbyPersons, setNearbyPersons] = useState([]);
  const [locationFilter, setLocationFilter] = useState({
    country: '',
    state: '',
    city: ''
  });
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);


  useEffect(() => {
    fetchMissingPersons();
    fetchUserDetails();
    fetchCountries();
    fetchNearbyPersons();
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
        // Automatically trigger search after voice input
        handleSearch(event);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
  }, [page]);


  const fetchMissingPersons = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/missing-persons?page=${page}&size=20`);
      setMissingPersons(prevPersons => [...prevPersons, ...response.data.content]);
      setTotalElements(response.data.totalElements);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching missing persons:', error);
      setError('Failed to load missing persons. Please try again.');
      setLoading(false);
    }
  };
  const fetchNearbyPersons = async () => {
    try {
      const response = await axios.get('/api/missing-persons/nearby');
      setNearbyPersons(response.data);
    } catch (error) {
      console.error('Error fetching nearby persons:', error);
    }
  };

  const fetchCountries = async () => {
    const response = await axios.get('/api/missing-persons/locations/countries');
    setCountries(response.data);
  };

  const fetchStates = async (country) => {
    if (country) {
      const response = await axios.get(`/api/missing-persons/locations/states?country=${country}`);
      setStates(response.data);
    } else {
      setStates([]);
    }
    setLocationFilter(prev => ({ ...prev, state: '', city: '' }));
  };

  const fetchCities = async (country, state) => {
    if (country && state) {
      const response = await axios.get(`/api/missing-persons/locations/cities?country=${country}&state=${state}`);
      setCities(response.data);
    } else {
      setCities([]);
    }
    setLocationFilter(prev => ({ ...prev, city: '' }));
  };
  const fetchFilteredPersons = async () => {
    setLoading(true);
    try {
      let url = `/api/missing-persons/filter?page=${page}&size=10`;
      if (sortBy) url += `&sortBy=${sortBy}`;
      if (locationFilter.country) url += `&country=${locationFilter.country}`;
      if (locationFilter.state) url += `&state=${locationFilter.state}`;
      if (locationFilter.city) url += `&city=${locationFilter.city}`;

      const response = await axios.get(url);
      setMissingPersons(response.data.content);
      setLoading(false);
    } catch (error) {
      setError('Failed to load filtered results');
      setLoading(false);
    }
  };
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.get(`/api/missing-persons/search?query=${searchQuery}`);
      setMissingPersons(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error searching missing persons:', err);
      setError('Failed to search missing persons. Please try again.');
      setLoading(false);
    }
  };
  const handleVoiceSearch = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (error) {
          console.error('Voice search error', error);
          toast.error('Voice search error', error);
        }
      }
    }
  };
  const fetchUserDetails = async () => {
    try {
      const response = await axios.get('/api/auth/user-details');
      setUserEmail(response.data.name);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  return (
      <div className={styles.homeContainer}>
        <div className={styles.heroSection}>
          <div className={styles.headerContent}>
            <h1 className={styles.mainTitle}>TraceBack</h1>
            {userEmail && <h2 className={styles.welcomeText}>Hi, {userEmail}! 👋</h2>}
          </div>
          <p className={styles.subtitle}>Help us reunite families and find missing individuals</p>
        </div>

        <div className={styles.searchSection}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchInputWrapper}>
              <FaSearch className={styles.searchIcon}/>
              <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or description..."
                  className={styles.searchInput}
              />
              <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={styles.voiceSearchButton}
                  aria-label="Voice Search"
                  style={{fontSize: '20px'}}
              >
                {isListening ? "🛑" : "🎤"}
              </button>
            </div>
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>
        </div>

        <div className={styles.filterSection}>
          <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
          >
            <option value="">Sort By Time</option>
            <option value="recentlyMissed">Recently Missing</option>
            <option value="recentlyReported">Recently Reported</option>
            <option value="oldest">Oldest Missed Cases</option>
          </select>
          <select
              value={locationFilter.country}
              onChange={(e) => {
                const country = e.target.value;
                setLocationFilter(prev => ({...prev, country}));
                fetchStates(country);
              }}
              className={styles.filterSelect}
          >
            <option value="">Select Country</option>
            {countries.map(country => (
                <option key={country} value={country}>{country}</option>
            ))}
          </select>

          <select
              value={locationFilter.state}
              onChange={(e) => {
                const state = e.target.value;
                setLocationFilter(prev => ({...prev, state}));
                fetchCities(locationFilter.country, state);
              }}
              className={styles.filterSelect}
              disabled={!locationFilter.country}
          >
            <option value="">Select State</option>
            {states.map(state => (
                <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <select
              value={locationFilter.city}
              onChange={(e) => setLocationFilter(prev => ({...prev, city: e.target.value}))}
              className={styles.filterSelect}
              disabled={!locationFilter.state}
          >
            <option value="">Select City</option>
            {cities.map(city => (
                <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <button onClick={fetchFilteredPersons} className={styles.filterButton}>
            Apply Filters
          </button>
        </div>

        <Link to="/missing-persons/add" className={styles.addButton}>
          <FaUserPlus/>
          <span>Report Missing Person</span>
        </Link>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {nearbyPersons.length > 0 && (
            <div className={styles.nearbySection}>
              <h2>Missing Persons Near You</h2>
              <div className={styles.gridContainer}>
                {nearbyPersons.map((person) => (
                    <div key={person.id} className={styles.personCard}>
                      <div className={styles.imageWrapper}>
                        <img
                            src={`data:image/jpeg;base64,${person.imageData}`}
                            alt={person.name}
                            className={styles.personImage}
                        />
                      </div>
                      <div className={styles.personInfo}>
                        <h3>{person.name}</h3>
                        <Link to={`/missing-persons/${person.id}`} className={styles.viewButton}>
                          View Details
                        </Link>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}
        <div className={styles.gridContainer}>
          {missingPersons.map((person) => (
              <div key={person.id} className={styles.personCard}>
                <div className={styles.imageWrapper}>
                  <img
                      src={`data:image/jpeg;base64,${person.imageData}`}
                      alt={person.name}
                      className={styles.personImage}
                  />
                </div>
                <div className={styles.personInfo}>
                  <h3>{person.name}</h3>
                  <Link to={`/missing-persons/${person.id}`} className={styles.viewButton}>
                    View Details
                  </Link>
                </div>
              </div>
          ))}
        </div>

        {missingPersons.length === 0 && !loading && (
            <div className={styles.noResults}>
              <div className={styles.noResultsIcon}>🔍</div>
              <p>No missing persons found.</p>
            </div>
        )}

        {!loading && missingPersons.length > 0 && totalElements > 20 && (
            <button onClick={loadMore} className={styles.loadMoreButton}>
              Load More
            </button>
        )}


        {loading && (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              <p>Loading...</p>
            </div>
        )}
        <ChatBot />
      </div>
  );
}

export default MissingPersons;

