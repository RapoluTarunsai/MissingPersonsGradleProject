import React, { useState, useEffect } from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import styles from "../styles/matchapproval.module.css";
function MatchApproval({triggerRefresh}) {
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchMatchDetails();
    }, [id]);

    const fetchMatchDetails = async () => {
        try {
            const response = await axios.get(`/api/missing-persons/reported-persons/matched/${id}`);
            setMatch(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching match details:', err);
            setError('Failed to load match details. Please try again.');
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            const formData = new URLSearchParams();
            formData.append('successMessage', successMessage);

            await axios.post(
                `/api/missing-persons/reported-persons/matched/${id}/approve`,
                formData
            );
            alert('Match approved successfully. The missing person entry has been removed.');
            triggerRefresh();
            navigate('/missing-persons/reported-persons');
        } catch (err) {
            console.error('Error approving match:', err);
            if (err.response && err.response.data) {
                setError(typeof err.response.data === 'string'
                    ? err.response.data
                    : err.response.data.error || 'Failed to Approve the match. Please try again.');
            } else {
                setError('Failed to Approve the match. Please try again');
            }
        }
    };

    const handleReject = async () => {
        try {
            await axios.delete(`/api/missing-persons/reported-persons/matched/${id}/reject`);
            alert('Match rejected successfully.');
            triggerRefresh();
            navigate('/missing-persons/reported-persons');
        } catch (err) {
            console.error('Error rejecting match:', err);
            setError('Failed to reject match. Please try again.');
        }
    };
    if (loading) return <div className={styles["loading"]}>Loading...</div>;
    if (error) return <div className={styles["error"]}>{error}</div>;
    if (!match) return <div className={styles["not-found"]}>Match not found.</div>;

    return (
        <div className={styles["match-approval"]}>
            <h1 className={styles["title"]}>Review Potential Match</h1>
            <div className={styles["match-comparison"]}>
                <div className={styles["original-person"]}>
                    <h2 className={styles["section-title"]}>Original Report</h2>
                    <img
                        className={styles["person-image"]}
                        src={`data:image/jpeg;base64,${match.missingPerson.imageData}`}
                        alt={match.missingPerson.name}
                    />
                    <h3 className={styles["person-name"]}>{match.missingPerson.name}</h3>
                    <p className={styles["date-info"]}>
                        Last seen: {new Date(match.missingPerson.lastSeen).toLocaleDateString()}
                    </p>
                </div>
                <div className={styles["matched-person"]}>
                    <h2 className={styles["section-title"]}>Potential Match</h2>
                    <img
                        className={styles["person-image"]}
                        src={`data:image/jpeg;base64,${match.matchedImageData}`}
                        alt="Potential match"
                    />
                    <p className={styles["date-info"]}>
                        Found on: {new Date(match.matchedAt).toLocaleDateString()}
                    </p>
                    <p className={styles["reporter-info"]}>
                        Reported by: {match.foundBy.name}
                    </p>
                </div>
            </div>
            <div className={styles["success-message-section"]}>
                <h3>Share Your Story</h3>
                <textarea
                    className={styles["success-message-input"]}
                    value={successMessage}
                    onChange={(e) => setSuccessMessage(e.target.value)}
                    placeholder="Share the story of finding your loved one to inspire hope in others..."
                    rows={4}
                />
            </div>
            <div className={styles["approval-actions"]}>
                <button onClick={handleApprove} className={styles["approve-btn"]}>
                    Approve Match
                </button>
                <button onClick={handleReject} className={styles["reject-btn"]}>
                    Reject Match
                </button>
            </div>
        </div>
    );
}

export default MatchApproval;

