import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/home.module.css';

function Home() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.title}>TraceBack</h1>
                <p className={styles.description}>Help us find missing people and reunite families.</p>
                <div className={styles.buttons}>
                    <Link to="/signup" className={styles.button}>Sign Up</Link>
                    <Link to="/login" className={styles.button}>Login</Link>
                </div>
            </div>
        </div>
    );
}

export default Home;