import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/navbar.module.css';
import {FaChartBar, FaCode} from "react-icons/fa";
import {toast} from "react-toastify";

function Navbar({ isAuthenticated, setIsAuthenticated,onShowDevelopers  }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                // Clear authentication state
                setIsAuthenticated(false);
                localStorage.removeItem('isAuthenticated');
                sessionStorage.removeItem('isAuthenticated');
                sessionStorage.removeItem('token');
                localStorage.removeItem('token');

                // Redirect to home or login page
                navigate('/');

                toast.success('Logged out successfully', {
                    position: "top-center",
                    autoClose: 2000
                });
            }
        } catch (error) {
            toast.error('Error logging out. Please try again.');
        }
    };

    return (
        <nav className={styles.navbar}>
            {isAuthenticated && (
                <>
                    <li><Link to="/missing-persons" className={styles.navLink}>Missing Persons</Link></li>
                    <li><Link to="/missing-persons/reported-persons" className={styles.navLink}>Reported Persons</Link>
                    </li>
                    <li><Link to="/missing-persons/add" className={styles.navLink}>Add Missing Person</Link></li>
                    <li><Link to="/matched">Matched Persons</Link></li>
                    <li><Link to="/success-stories">Success Stories</Link></li>
                    <li><Link to="/profile">Profile</Link></li>
                    <Link to="/dashboard" className="dashboard-link">
                        <FaChartBar/> Dashboard
                    </Link>
                    <button
                        onClick={onShowDevelopers}
                        className={styles.developerButton}
                    >
                        <FaCode/> About Developers
                    </button>
                    <button onClick={handleLogout} className={styles.navButton}>Logout</button>
                </>
            )}
        </nav>
    );
}

export default Navbar;