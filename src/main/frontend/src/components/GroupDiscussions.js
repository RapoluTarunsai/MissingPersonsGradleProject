import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import styles from '../styles/groupdiscussions.module.css';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function GroupDiscussions({ missingPersonId }) {
    const [discussions, setDiscussions] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const navigate = useNavigate();
    const recognitionRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        // Check browser support



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
                setNewMessage(prevMessage => prevMessage + ' ' + transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                toast.error('Voice recognition failed');
            };
        } else {
            toast.warn('Speech recognition not supported in this browser');
        }
    }, []);

    useEffect(() => {
        const getDiscussions = async () => {
            try {
                const response = await axios.get(`/api/missing-persons/${missingPersonId}/discussions`);
                setDiscussions(response.data);
            } catch (err) {
                setError('Failed to load discussions');
                console.log('Error fetching discussions:', err);
            }
        };

        getDiscussions();
    }, [missingPersonId]);

    const handleVoiceInput = () => {
        if (recognitionRef.current) {
            if (isListening) {
                recognitionRef.current.stop();
                setIsListening(false);
            } else {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                    toast.info('Listening... Speak now');
                } catch (error) {
                    console.error('Voice input error', error);
                    toast.error('Could not start voice input');
                }
            }
        } else {
            toast.warn('Voice input not supported');
        }
    };
    const handleUserClick = async (userId) => {
        try {
            const response = await axios.get(`/api/missing-persons/user-profile/${userId}`);
            navigate(`/user-profile/${userId}`, { state: response.data });
        } catch (error) {
            toast.error('Failed to fetch user profile');
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) {
            localStorage.setItem('redirectUrl', window.location.pathname);
            navigate('/');
            return;
        }

        // Trim whitespace and check message length
        const trimmedMessage = newMessage.trim();
        if (!trimmedMessage) {
            toast.error('Message cannot be empty');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post(`/api/missing-persons/${missingPersonId}/discussions`, null, {
                params: { message: trimmedMessage }
            });
            setDiscussions([response.data, ...discussions]);
            setNewMessage('');
        } catch (err) {
            if (err.response?.status === 401) {
                sessionStorage.setItem('redirectUrl', window.location.pathname);
                navigate('/');
                return;
            }
            setError('Failed to post message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className={styles.discussionsContainer}>
            <h3 className={styles.title}>Community Group Discussions</h3>
            {error && <div className={styles.errorMessage}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.messageForm}>
                <div className={styles.inputContainer}>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Share your thoughts or updates..."
                        className={styles.messageInput}
                        required
                    />
                    <button
                        type="button"
                        onClick={handleVoiceInput}
                        className={`${styles.voiceButton} ${isListening ? styles.listening : ''}`}
                        aria-label="Voice Input"
                        style={{ fontSize: '24px' }}
                    >
                        {isListening ? "🛑" : "🎤"}
                    </button>
                </div>
                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                    {isSubmitting ? 'Posting...' : 'Post Message'}
                </button>
            </form>

            <div className={styles.discussionsWrapper}>
                {discussions.map((discussion) => (
                    <div key={discussion.id} className={styles.discussionCard}>
                        <div className={styles.messageHeader}>
                            <span
                                className={styles.userName}
                                onClick={() => handleUserClick(discussion.userId)}
                                style={{cursor: 'pointer', textDecoration: 'underline'}}
                            >
                           {discussion.userName}
                            </span>
                            <span className={styles.timestamp}>
                                {format(new Date(discussion.timestamp), 'PPpp')}
                            </span>
                        </div>
                        <p className={styles.messageContent}>{discussion.message}</p>

                    </div>
                ))}
                {discussions.length === 0 && (
                    <div className={styles.noDiscussions}>
                    No discussions yet. Be the first to share your thoughts!
                    </div>
                )}
            </div>
        </div>
    );
}

export default GroupDiscussions;

