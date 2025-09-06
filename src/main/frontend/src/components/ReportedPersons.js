import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from "../styles/reportedpersons.module.css";


function ReportedPersons(refreshKey) {
    console.log('Component mounted with props:', { refreshKey});

    const [reportedPersons, setReportedPersons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pendingMatches, setPendingMatches] = useState([]);
    const [approvedMatches, setApprovedMatches] = useState([]);


    useEffect(() => {
        console.log('useEffect triggered with refreshKey:', refreshKey);
        fetchReportedPersons();
        fetchPendingMatches();
        fetchApprovedMatches();
    }, [refreshKey]);
    useEffect(() => {
        if (error) {
            // Show an error message or perform any necessary actions
            console.error(error);
        }
    }, [error]);
    const fetchReportedPersons = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/missing-persons/reported-persons');
            setReportedPersons(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching reported persons:', err);
            setError('Failed to load reported persons. Please try again.');
            setLoading(false);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchPendingMatches = async () => {
        try {
            const response = await axios.get('/api/missing-persons/reported-persons/matched/pending');
            console.log('Pending matches response:', response.data);
            setPendingMatches(response.data);
        } catch (err) {
            console.error('Error fetching pending matches:', err);
        }
    };
    const fetchApprovedMatches = async () => {
        try {
            const response = await axios.get('/api/missing-persons/reported-persons/approved-matches');
            setApprovedMatches(response.data);
        } catch (err) {
            console.error('Error fetching approved matches:', err);
        }
    };
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this missing person report?')) {
            try {
                await axios.delete(`/api/missing-persons/${id}`);
                setReportedPersons(reportedPersons.filter(person => person.id !== id));
            } catch (err) {
                console.error('Error deleting reported person:', err);
                setError('Failed to delete the report. Please try again.');
            }
        }
    };
    const triggerRefresh = () => {
        fetchReportedPersons();
        fetchPendingMatches();
        fetchApprovedMatches();
    };
    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles["reported-persons"]}>
            <h1>Reported Persons</h1>
            <div className={styles["reported-persons-grid"]}>
                {reportedPersons.map((person) => (
                    <div key={person.id} className={styles["reported-person-card"]}>
                        <img src={`data:image/jpeg;base64,${person.imageData}`} alt={person.name}
                             style={{width: '250px', height: '250px'}}/>
                        <h3>{person.name}</h3>
                        <Link to={`/missing-persons/reported-persons/${person.id}`} className={styles["edit-details-btn"]}>Edit Details</Link>
                        <button onClick={() => handleDelete(person.id)} className={styles["delete-btn"]}>Delete Report
                        </button>
                    </div>
                ))}
            </div>
            {reportedPersons.length === 0 && <p className={styles["no-results"]}>No reported persons found.</p>}
            {pendingMatches.length > 0 && (
                <div className={styles["pending-section"]}>
                    <h2 className={styles["pending-title"]}>Pending Match Approvals</h2>
                    <div className={styles["pending-grid"]}>
                        {pendingMatches.map((match) => (
                            <div key={match.id} className={styles["pending-card"]}>
                                <img
                                    src={`data:image/jpeg;base64,${match.missingPerson.imageData}`}
                                    alt={match.missingPerson.name}
                                    style={{width: '250px', height: '250px'}}
                                />
                                <h3>{match.missingPerson.name}</h3>
                                <p className={styles["match-date"]}>
                                    Matched on: {new Date(match.matchedAt).toLocaleDateString()}
                                </p>
                                <Link
                                    to={`/reported-persons/matched/${match.id}`}
                                    className={styles["review-btn"]}
                                >
                                    Review Match
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {approvedMatches.length > 0 && (
                <div className={styles["approved-matches"]}>
                    <h2 className={styles["approved-title"]}>Approved Matches</h2>
                    <div className={styles["approved-matches-grid"]}>
                        {approvedMatches.map((match) => (
                            <div key={match.id} className={styles["approved-match-card"]}>
                                <div className={styles["image-comparison"]}>
                                    <img src={`data:image/jpeg;base64,${match.missingPerson.imageData}`}
                                         alt={match.missingPerson.name}
                                         className={styles["original-image"]} />
                                    <img src={`data:image/jpeg;base64,${match.matchedImageData}`}
                                         alt="Matched person"
                                         className={styles["matched-image"]} />
                                </div>
                                <h3 className={styles["match-name"]}>{match.missingPerson.name}</h3>
                                <p className={styles["match-date"]}>Matched on: {new Date(match.matchedAt).toLocaleDateString()}</p>
                                <p className={styles["match-reporter"]}>Found by: {match.foundBy.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


export default ReportedPersons;

