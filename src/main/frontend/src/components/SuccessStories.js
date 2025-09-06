import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from '../styles/successStories.module.css';
import { FaShare, FaHeart, FaUsers } from 'react-icons/fa';

const SuccessStories = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSuccessStories();
    }, []);

    const fetchSuccessStories = async () => {
        try {
            const response = await axios.get('/api/missing-persons/success-stories');
            console.log('Success Stories Data:', response.data);
            if (response.data && response.data.length > 0) {
                setStories(response.data.map(item => ({
                    ...item.story,
                    communitySupport: item.communitySupport
                })));
            } else {
                toast.info('No success stories available yet');
            }
            setLoading(false);
        } catch (error) {
            toast.error('Unable to load success stories');
            setLoading(false);
        }
    };

    const calculateTimeToFind = (matchedAt, reportedTime) => {
        const start = new Date(reportedTime);
        const end = new Date(matchedAt);
        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
        return days;
    };

    const shareStory = (story) => {
        const text = `Amazing news! ${story.missingPerson.name} has been found and reunited with their family after ${calculateTimeToFind(story.matchedAt, story.missingPerson.reportedTime)} days.`;
        const url = window.location.href;

        if (navigator.share) {
            navigator.share({
                title: 'Success Story - Missing Person Found',
                text: text,
                url: url
            });
        } else {
            toast.info('Use the social sharing buttons below');
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Reunited Families</h1>

            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <h3>Total Reunions</h3>
                    <p>{stories.length}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Community Impact</h3>
                    <p><FaUsers /> Active Helpers</p>
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading success stories...</div>
            ) : (
                <div className={styles.storiesGrid}>
                    {stories.map(story => (
                        <div key={story.id} className={styles.storyCard}>
                            <div className={styles.imageContainer}>
                                <img
                                    src={`data:image/jpeg;base64,${story.missingPerson.imageData}`}
                                    alt="Missing Person"
                                    className={styles.personImage}
                                />
                                <img
                                    src={`data:image/jpeg;base64,${story.matchedImageData}`}
                                    alt="Found Person"
                                    className={styles.matchedImage}
                                />
                            </div>
                            <div className={styles.storyContent}>
                                <h3>{story.missingPerson.name}</h3>
                                <p className={styles.timeline}>
                                    Found after: {calculateTimeToFind(story.matchedAt, story.missingPerson.reportedTime)} days
                                </p>
                                <div className={styles.location}>
                                    <span>Found in: {story.missingPerson.city}, {story.missingPerson.state}</span>
                                </div>
                                <div className={styles.impactMetrics}>
                                    <span><FaUsers/> {story.communitySupport} Supporters</span>
                                    <span>{story.successMessage}</span>
                                    <span><FaHeart/> Reunited</span>
                                    <button
                                        onClick={() => shareStory(story)}
                                        className={styles.shareButton}
                                    >
                                        <FaShare/> Share Story
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuccessStories;
