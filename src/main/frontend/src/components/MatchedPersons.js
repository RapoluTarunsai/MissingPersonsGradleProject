import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import styles from '../styles/matchedpersons.module.css';

function MatchedPersons() {
    const [matchedPersons, setMatchedPersons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMatchedPersons();
    }, []);

    const fetchMatchedPersons = async () => {
        try {
            const response = await axios.get('/api/missing-persons/matched');
            setMatchedPersons(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching matched persons:', err);
            setError('Failed to load matched persons. Please try again.');
            setLoading(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Matched Persons</h1>
            <div className={styles.matchedGrid}>
                {matchedPersons.map((match) => (
                    <div key={match.id} className={styles.matchCard}>
                        <div className={styles.imageComparison}>
                            <div className={styles.imageContainer}>
                                <h3 className={styles.imageLabel}>Original</h3>
                                <img
                                    src={`data:image/jpeg;base64,${match.missingPerson.imageData}`}
                                    alt={match.missingPerson.name}
                                    className={styles.personImage}
                                />
                            </div>
                            <div className={styles.imageContainer}>
                                <h3 className={styles.imageLabel}>Matched</h3>
                                <img
                                    src={`data:image/jpeg;base64,${match.matchedImageData}`}
                                    alt="Matched person"
                                    className={styles.personImage}
                                />
                            </div>
                        </div>
                        <div className={styles.matchInfo}>
                            <h3 className={styles.personName}>{match.missingPerson.name}</h3>
                            <div className={styles.details}>
                                <p className={styles.reportedBy}>Reported by: {match.reportedBy.name}</p>
                                <p className={styles.foundBy}>Found by: {match.foundBy.name}</p>
                                <p className={styles.matchDate}>
                                    Matched on: {format(new Date(match.matchedAt), 'PPP')}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {matchedPersons.length === 0 &&
                <p className={styles.noResults}>No matched persons found.</p>
            }
        </div>
    );
}

export default MatchedPersons;
