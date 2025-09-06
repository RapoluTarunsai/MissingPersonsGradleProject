import React from 'react';
import styles from '../styles/developerinfo.module.css';
import { FaLinkedin, FaGithub, FaInstagram, FaEnvelope } from 'react-icons/fa';

function DeveloperInfo() {
    const developers = [
        {
            name: "Rapolu Tarun Sai",
            role: "Full Stack Developer",
            linkedin: "https://www.linkedin.com/in/tarun-sai-511a841b5/",
            github: "https://github.com/RapoluTarunsai",
            instagram: "https://www.instagram.com/tarunsai_rebel18/",
            email: "rapolutarunsai18@gmail.com",
            bio: "Passionate developer dedicated to creating impactful solutions .You can reach me out for any projects and collaborations.",
            technologies: ["Java", "Spring Boot", "React", "Oracle", "MySQL","GoLang","AWS","SpringMVC"],
        }
    ];

    return (
        <div className={styles.developerContainer}>
            <h1>Meet the Developers</h1>
            <div className={styles.developerGrid}>
                {developers.map((dev, index) => (
                    <div key={index} className={styles.developerCard}>
                        <div className={styles.developerHeader}>
                            <h2>{dev.name}</h2>
                            <p>{dev.role}</p>
                        </div>
                        <div className={styles.developerBio}>
                            <p>{dev.bio}</p>
                        </div>
                        <div className={styles.techStack}>
                            <h3>Technologies</h3>
                            <div className={styles.techList}>
                                {dev.technologies.map((tech, techIndex) => (
                                    <span key={techIndex} className={styles.techBadge}>
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className={styles.socialLinks}>
                            <a href={dev.linkedin} target="_blank" rel="noopener noreferrer">
                                <FaLinkedin />
                            </a>
                            <a href={dev.github} target="_blank" rel="noopener noreferrer">
                                <FaGithub />
                            </a>
                            <a href={dev.instagram} target="_blank" rel="noopener noreferrer">
                                <FaInstagram />
                            </a>
                            <a href={`mailto:${dev.email}`}>
                                <FaEnvelope />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DeveloperInfo;
