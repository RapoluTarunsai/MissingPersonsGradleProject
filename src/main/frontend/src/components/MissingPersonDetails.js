import React, {useState, useEffect, useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/missingpersondetails.module.css';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GroupDiscussions from "./GroupDiscussions";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import SocialShareButtons from "./SocialShareButtons";
import ReCAPTCHA from "react-google-recaptcha";
import { QRCodeSVG } from 'qrcode.react';
import { generateHTMLContent } from './QRCodeTemplate';
import {FaVideo, FaUpload, FaStop, FaThermometerHalf, FaEye, FaWind, FaTint, FaClock, FaGlobe} from 'react-icons/fa';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function MissingPersonDetails() {
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [compareImage, setCompareImage] = useState(null);
  const [compareImagePreview, setCompareImagePreview] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);
  const { id } = useParams();
  const [comparisonProgress, setComparisonProgress] = useState(0);
  const [mapPosition, setMapPosition] = useState([13.0836939, 80.270186]);
  const [captchaValue, setCaptchaValue] = useState(null);
  const [newsArticles, setNewsArticles] = useState([]);
  const [personVideo, setPersonVideo] = useState(null);
  const [isReportedPerson, setIsReportedPerson] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef(null);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const navigate = useNavigate();
  const [timeInfo, setTimeInfo] = useState(null);
  const [currentLocalTime, setCurrentLocalTime] = useState(null);
  const [timeLoading, setTimeLoading] = useState(false);
  useEffect(() => {
    fetchPerson();
  }, [id]);
  useEffect(() => {
    let timeInterval;
    if (timeInfo) {
      timeInterval = setInterval(() => {
        updateLocalTime();
      }, 1000);
    }
    return () => {
      if (timeInterval) {
        clearInterval(timeInterval);
      }
    };
  }, [timeInfo]);
  const fetchPerson = async () => {
    try {
      const response = await axios.get(`/api/missing-persons/${id}`);
      setPerson(response.data);

      // Check if video exists and set it for all users
      if (response.data.videoData) {
        setPersonVideo(`data:video/mp4;base64,${response.data.videoData}`);
      }

      // Check if current user is the reported person
      const currentUserEmail = localStorage.getItem('userEmail');
      console.log("Current User Email:", currentUserEmail);
      console.log("Reported By Email:", response.data.reportedByEmail);
      console.log("Is Reported Person:", response.data);
      const isReported = currentUserEmail &&
          response.data.reportedByEmail &&
          currentUserEmail.trim() === response.data.reportedByEmail.trim();

      setIsReportedPerson(isReported);
      console.log("Is Reported Person (Strict Check):", isReported);

      const geocodeResponse = await axios.get(`/api/missing-persons/geocode`, {
        params: {
          city: response.data.city,
          state: response.data.state,
          country: response.data.country
        }
      });

      if (geocodeResponse.data && geocodeResponse.data.length > 0) {
        const lat = parseFloat(geocodeResponse.data[0].lat);
        const lon = parseFloat(geocodeResponse.data[0].lon);

        const newPosition = [lat, lon];
        setMapPosition(newPosition);
        // Fetch weather and time using the coordinates
        await Promise.all([
          fetchWeatherInfo(response.data.city, response.data.state, response.data.country),
          fetchTimeInfo(lat, lon, response.data.city)
        ]);
      } else {
        // Fallback if geocoding fails
        await fetchWeatherInfo(response.data.city, response.data.state, response.data.country);
      }
      const newsResponse = await axios.get(`/api/missing-persons/news/${response.data.name}`);
      setNewsArticles(newsResponse.data.articles);
    } catch (err) {
      console.error('Fetch Person Error:', err.response || err); // Detailed error logging
      setError('Failed to load missing person details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherInfo = async (city) => {
    setWeatherLoading(true);
    try {
      const response = await axios.get('/api/missing-persons/weather', {
        params: { city }
      });
      setWeatherInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch weather information:', error);
      // Don't show error toast for weather, as it's supplementary information
    } finally {
      setWeatherLoading(false);
    }
  };
  const fetchTimeInfo = async (lat, lon, cityName) => {
    setTimeLoading(true);
    try {
      const response = await axios.get('/api/missing-persons/timezone', {
        params: { lat, lon }
      });
      setTimeInfo({...response.data, cityName});
      updateLocalTime(response.data);
    } catch (error) {
      console.error('Failed to fetch time information:', error);
      // Fallback to browser time
      setCurrentLocalTime(new Date().toLocaleString());
    } finally {
      setTimeLoading(false);
    }
  };
  const updateLocalTime = (timeData = timeInfo) => {
    if (timeData && timeData.timezone) {
      try {
        const now = new Date();
        const localTime = now.toLocaleString('en-US', {
          timeZone: timeData.timezone,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        setCurrentLocalTime(localTime);
      } catch (error) {
        console.error('Error updating local time:', error);
        // Fallback to the API provided formatted time
        if (timeData.localTime) {
          setCurrentLocalTime(new Date(timeData.localTime).toLocaleString());
        } else {
          setCurrentLocalTime(new Date().toLocaleString());
        }
      }
    }
  };
  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };


  const handleVideoUpload = (event) => {

    if (!isReportedPerson) {
      toast.error('Only the reported person can upload a video');
      return;
    }
    const file = event.target.files[0];
    if (file) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        // Validate video duration
        if (video.duration > 20) {
          toast.error('Video must be 20 seconds or less');
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {

          const formData = new FormData();
          formData.append('video', file);
          formData.append('missingPersonId', id);

          axios.post(`/api/missing-persons/${id}/upload-video`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then(response => {
            setPersonVideo(reader.result);
            toast.success(response.data.message || 'Video uploaded successfully');
          }).catch(error => {
            toast.error('Failed to upload video');
          });
        };
        reader.readAsDataURL(file);
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleVideoPlayPause = () => {
    if (videoRef.current) {
      if (videoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setVideoPlaying(!videoPlaying);
    }
  };

  const handleVideoProgress = (e) => {
    const progressPercent =
        (e.target.currentTime / e.target.duration) * 100;
    setVideoProgress(progressPercent);
  };

  const handleVideoSeek = (e) => {
    const seekTime = (e.target.value / 100) * videoRef.current.duration;
    videoRef.current.currentTime = seekTime;
    setVideoProgress(e.target.value);
  };


  const downloadPDF = async () => {
    try {
      const response = await axios.get(`/api/missing-persons/${id}/download-pdf`, {
        responseType: 'blob'
      });

      // Create a link element and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `missing_person_report_${person.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Optional: Show success toast
      toast.success('PDF Report Downloaded Successfully', {
        position: "bottom-right",
        autoClose: 3000
      });

    } catch (error) {
      console.error('PDF download failed', error);
      toast.error('Failed to download PDF report');
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCompareImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompareImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };



  const handleCompare = async () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('redirectUrl', window.location.pathname);
      navigate('/');
      return;
    }
    if (!compareImage) {
      setError('Please select an image to compare.');
      return;
    }
    if (!captchaValue) {
      toast.error('Please complete the CAPTCHA verification');
      return;
    }

    setComparing(true);
    setError(null);
    setComparisonResult(null);
    const progressInterval = setInterval(() => {
      setComparisonProgress(prev => prev >= 90 ? 90 : prev + 10);
    }, 200);
    const formData = new FormData();
    formData.append('image', compareImage);
    formData.append('id', id);
    formData.append('captcha', captchaValue);

    try {
      const response = await axios.post(`/api/missing-persons/compare`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      clearInterval(progressInterval);
      setComparisonProgress(100);
      setComparisonResult(response.data);
// Inside handleCompare function
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token && response.data.message) {
        const isResolved = response.data.message.includes("successfully found your reported person");
        toast.success(isResolved
            ? "Case resolved! You have successfully found your reported person."
            : `Match found! An email notification has been sent to ${person.reportedByName}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      }
    } catch (err) {
      clearInterval(progressInterval);
      setComparisonProgress(0);
      setError('Failed to compare images. Please try again.');
    } finally {
      setComparing(false);
      setCaptchaValue(null);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!person) return <div className="not-found">Missing person not found.</div>;

  const shareUrl = `${window.location.origin}/missing-persons/${id}`;
  const shareTitle = `Help find ${person.name}. Last seen in ${person.city}, ${person.state}.`;

  return (
      <div className={styles.container}>
        <div className={styles.detailsCard}>
          <h1 className={styles.title}>{person.name}</h1>
          <div className={styles.imageContainer}>
            <img
                src={`data:image/jpeg;base64,${person.imageData}`}
                alt={person.name}
                className={styles.personImage}
            />
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Reported by:</span>
              <span className={styles.value}>{person.reportedByName}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Contact:</span>
              <span className={styles.value}>{person.reportedByEmail}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Last seen:</span>
              <span className={styles.value}>{person.lastSeen}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Specified Location of Missing person</span>
              <span className={styles.value}>{person.location}</span>
            </div>
            <p><strong>Full Location:</strong> {`${person.city}, ${person.state}, ${person.country}`}</p>

            <div className={styles.infoItem}>
              <span className={styles.label}>Description:</span>
              <p className={styles.description}>{person.description || 'No description available'}</p>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.label}>Reported on:</span>
              <p className={styles.description}>{person.reportedTime || 'Reported time is not stored'}</p>
            </div>
          </div>

          {/* Local Time Section */}
          {timeLoading && (
              <div className={styles.timeLoading}>
                <p>Loading local time information...</p>
              </div>
          )}

          {(currentLocalTime || timeInfo) && (
              <div className={styles.timeSection}>
                <h3 className={styles.timeTitle}>
                  <FaClock /> Current Local Time in {person.city}
                </h3>
                <div className={styles.timeContainer}>
                  <div className={styles.timeDisplay}>
                    <div className={styles.currentTime}>
                      {currentLocalTime}
                    </div>
                    {timeInfo && (
                        <div className={styles.timezoneInfo}>
                          {timeInfo.timezone} ({timeInfo.abbreviation})
                        </div>
                    )}
                  </div>


                </div>
              </div>
          )}

          {weatherInfo && (
              <div className={styles.weatherSection}>
                <h3 className={styles.weatherTitle}>
                  <FaThermometerHalf /> Current Weather in {person.city}
                </h3>
                <div className={styles.weatherContainer}>
                  <div className={styles.weatherMain}>
                    <img
                        src={getWeatherIcon(weatherInfo.icon)}
                        alt={weatherInfo.description}
                        className={styles.weatherIcon}
                    />
                    <div className={styles.temperatureInfo}>
                      <span className={styles.temperature}>
                        {Math.round(weatherInfo.temperature)}°C
                      </span>
                      <span className={styles.weatherDescription}>
                        {weatherInfo.description}
                      </span>
                      <span className={styles.feelsLike}>
                        Feels like {Math.round(weatherInfo.feelsLike)}°C
                      </span>
                    </div>
                  </div>

                  <div className={styles.weatherDetails}>
                    <div className={styles.weatherItem}>
                      <FaTint className={styles.weatherItemIcon} />
                      <span>Humidity: {weatherInfo.humidity}%</span>
                    </div>
                    <div className={styles.weatherItem}>
                      <FaWind className={styles.weatherItemIcon} />
                      <span>Wind: {weatherInfo.windSpeed} m/s</span>
                    </div>
                    <div className={styles.weatherItem}>
                      <FaEye className={styles.weatherItemIcon} />
                      <span>Pressure: {weatherInfo.pressure} hPa</span>
                    </div>
                    {weatherInfo.visibility && (
                        <div className={styles.weatherItem}>
                          <FaEye className={styles.weatherItemIcon} />
                          <span>Visibility: {weatherInfo.visibility} km</span>
                        </div>
                    )}
                  </div>
                </div>
              </div>
          )}

          {weatherLoading && (
              <div className={styles.weatherLoading}>
                <p>Loading weather information...</p>
              </div>
          )}

          <div className={styles.qrCodeSection}>
            <h3>Share via QR Code</h3>
            <QRCodeSVG
                value={generateHTMLContent(person)}
                size={400}
                level="L"
                includeMargin={true}
            />
          </div>


          {!mapPosition || mapPosition[0] === 0 || mapPosition[1] === 0 ? (
              <p>Invalid position. Map cannot be rendered.</p>
          ) : (
              <MapContainer center={mapPosition} zoom={13} style={{height: '400px', width: '100%'}}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                <Marker position={mapPosition}>
                  <Popup>Last known location</Popup>
                </Marker>
              </MapContainer>
          )}
          <div>
            <p>Debug Info:</p>
            <p>Is Reported Person: {isReportedPerson ? 'TRUE' : 'FALSE'}</p>
            <p>Person Video Exists: {personVideo ? 'TRUE' : 'FALSE'}</p>
          </div>
          {(personVideo || isReportedPerson) && (
              <div className={styles.videoSection}>
                <h2>Emotional Message</h2>
                {personVideo && (
                    <div className={styles.videoContainer}>
                  <video
                      ref={videoRef}
                      src={personVideo}
                      className={styles.emotionalVideo}
                      onTimeUpdate={handleVideoProgress}
                      onEnded={() => setVideoPlaying(false)}
                  >
                    Your browser does not support the video tag.
                  </video>

                  <div className={styles.videoControls}>
                    <button
                        onClick={handleVideoPlayPause}
                        className={styles.playPauseButton}
                    >
                      {videoPlaying ? '❚❚ Pause' : '▶ Play'}
                    </button>

                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={videoProgress}
                        onChange={handleVideoSeek}
                        className={styles.videoProgressBar}
                    />
                  </div>
                </div>
                )}

                {/* Upload section only for reported person */}
                {isReportedPerson && (
                    <div className={styles.videoUploadContainer}>
                      <div className={styles.videoRecordingControls}>
                        <div className={styles.recordOptions}>
                          <input
                              type="file"
                              accept="video/mp4,video/x-m4v,video/*"
                              onChange={handleVideoUpload}
                              id="video-upload-input"
                              className={styles.fileInput}
                          />
                          <label
                              htmlFor="video-upload-input"
                              className={styles.uploadButton}
                          >
                            <FaUpload/> Upload Video
                          </label>
                        </div>
                      </div>
                      <p>
                        Upload a heartfelt 20-second video message to help others
                        understand your situation and increase chances of being found.
                      </p>
                    </div>
                )}
              </div>
          )}

          <div className={styles.compareSection}>
            <h2 className={styles.compareTitle}>Compare Image</h2>
            <div className={styles.uploadContainer}>
              <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  id="compare-image-input"
                  className={styles.fileInput}
              />
              <label htmlFor="compare-image-input" className={styles.uploadButton}>
                {compareImage ? 'Change Image' : 'Upload Image to Compare'}
              </label>
            </div>

            {compareImage && (
                <>
                  <div className={styles.previewContainer}>
                    <img
                        src={compareImagePreview}
                        alt="Selected for comparison"
                        className={styles.comparePreview}
                    />
                  </div>
                    //Get the Recaptcha Secret Key and Site Key from the Google Admin console " https://www.google.com/recaptcha/admin/"
                  <ReCAPTCHA
                      sitekey="YOUR_SITE_KEY_HERE"
                      onChange={(value) => setCaptchaValue(value)}
                      className={styles.captcha}
                  />
                  <button
                      onClick={handleCompare}
                      disabled={!captchaValue || comparing}
                      className={styles.compareButton}
                  >
                    {comparing ? 'Comparing...' : 'Compare Images'}
                  </button>
                </>
            )}
            {comparing && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{width: `${comparisonProgress}%`}}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {comparisonProgress}% Complete
                  </span>
                </div>
            )}

            {comparisonResult && (
                <div className={styles.resultContainer}>
                  <h3>Comparison Result:</h3>
                  {comparisonResult.error ? (
                      <p className={styles.error}>{comparisonResult.error}</p>
                  ) : (
                      <div className={styles.resultContent}>
                        <div className={styles.similarityMeter}>
                          <div
                              className={styles.similarityFill}
                              style={{
                                width: `${comparisonResult.similarity}%`,
                                transition: 'width 1.5s ease-in-out'
                              }}
                          ></div>
                        </div>
                        <div className={styles.resultDetails}>
                          <p className={styles.similarityText}>
                            Similarity:
                            <span className={styles.percentage}>
                        {comparisonResult.similarity.toFixed(2)}%
                      </span>
                          </p>
                          <div
                              className={`${styles.matchResult} ${comparisonResult.isMatch ? styles.matched : styles.notMatched}`}>
                            {comparisonResult.isMatch ? (
                                <div className={styles.matchFound}>
                                  <span className={styles.matchIcon}>✓</span>
                                  {comparisonResult.message === "You have successfully found your reported person. The case is now marked as resolved."
                                      ? "Case Resolved - You found your reported person"
                                      : "Match Found - Email Notification Sent"
                                  }
                                </div>
                            ) : (
                                <div className={styles.noMatch}>
                                  <span className={styles.noMatchIcon}>×</span>
                                  Not Matched
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                  )}
                </div>

            )}
          </div>


          <div className={styles.discussionsSection}>
            <GroupDiscussions missingPersonId={id}/>
          </div>
          <div className={styles.newsSection}>
            <h2>Related News</h2>
            <div className={styles.newsGrid}>
              {newsArticles.slice(0, 3).map((article, index) => (
                  <div key={index} className={styles.newsCard}>
                    <img src={article.urlToImage} alt={article.title}/>
                    <h3>{article.title}</h3>
                    <p>{article.description}</p>
                    <a href={article.url} target="_blank" rel="noopener noreferrer">Read More</a>
                  </div>
              ))}
            </div>
          </div>
          <div className={styles.downloadSection}>
            <button
                onClick={downloadPDF}
                className={styles.downloadButton}
            >
              <i className="fas fa-download"></i> Download Detailed Report
            </button>
          </div>
          <SocialShareButtons url={shareUrl} title={shareTitle}/>
        </div>
      </div>
  );
}

export default MissingPersonDetails;
