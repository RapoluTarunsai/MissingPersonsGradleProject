import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from '../styles/discussionuserprofile.module.css';
import { FaMapMarkerAlt, FaEnvelope, FaSearch, FaCheckCircle } from 'react-icons/fa';

function DiscussionUserProfile() {
    const location = useLocation();
    const userProfile = location.state;

    const profileImageSrc = userProfile?.profilePicture
        ? `data:image/jpeg;base64,${userProfile.profilePicture}`
        : '/default-profile.png';


    return (
        <motion.div
            className={styles.profileContainer}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                    <motion.img
                        src={profileImageSrc}
                        alt="Profile"
                        className={styles.profileImage}
                        whileHover={{ scale: 1.1 }}
                    />
                    <h2 className={styles.userName}>{userProfile?.name}</h2>
                </div>

                <div className={styles.profileDetails}>
                    <motion.div
                        className={styles.detailItem}
                        whileHover={{ x: 10 }}
                    >
                        <FaEnvelope className={styles.icon} />
                        <span>{userProfile?.email}</span>
                    </motion.div>
                    <motion.div
                        className={styles.detailItem}
                        whileHover={{ x: 10 }}
                    >
                        <FaMapMarkerAlt className={styles.icon} />
                        <span>{userProfile?.location}</span>
                    </motion.div>
                    <div className={styles.statsContainer}>
                        <motion.div
                            className={styles.statItem}
                            whileHover={{ scale: 1.05 }}
                        >
                            <FaSearch className={styles.statIcon} />
                            <span className={styles.statNumber}>{userProfile?.reportedPersonsCount}</span>
                            <span className={styles.statLabel}>Reported Persons</span>
                        </motion.div>
                        <motion.div
                            className={styles.statItem}
                            whileHover={{ scale: 1.05 }}
                        >
                            <FaCheckCircle className={styles.statIcon} />
                            <span className={styles.statNumber}>{userProfile?.foundPersonsCount}</span>
                            <span className={styles.statLabel}>Found Persons</span>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default DiscussionUserProfile;
