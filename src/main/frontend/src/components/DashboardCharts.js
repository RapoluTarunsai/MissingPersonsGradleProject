import React, {useEffect, useState} from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import styles from '../styles/dashboard.module.css';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
} from 'chart.js';
import axios from "axios";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);
// Add this before the return statement
const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                font: {
                    size: 12
                }
            }
        },
        title: {
            display: true,
            font: {
                size: 16,
                weight: 'bold'
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.1)'
            }
        },
        x: {
            grid: {
                display: false
            }
        }
    }
};

const DashboardCharts = () => {
    const [missingPersons, setMissingPersons] = useState([]);
    const [matchedPersons, setMatchedPersons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [missingResponse, matchedResponse] = await Promise.all([
                    axios.get('/api/missing-persons?size=100'), // Set appropriate size
                    axios.get('/api/missing-persons/matched')
                ]);

                // Filter out any null or undefined entries
                const validMissingPersons = missingResponse.data.content.filter(person => person && person.id);
                setMissingPersons(validMissingPersons);
                setMatchedPersons(matchedResponse.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    if (loading) {
        return <div className={styles.loading}>Loading dashboard data...</div>;
    }


    // Cases by Location Chart
    const locationData = {
        labels: [...new Set((missingPersons || []).map(person => person.state))],
        datasets: [{
            label: 'Cases by Location',
            data: (missingPersons || []).reduce((acc, person) => {
                acc[person.state] = (acc[person.state] || 0) + 1;
                return acc;
            }, {}),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
        }]
    };

    // Match Success Rate Chart
    const matchRateData = {
        labels: ['Matched', 'Still Missing'],
        datasets: [{
            data: [
                matchedPersons.length,
                missingPersons.filter(person => !person.matched).length
            ],
            backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)']
        }]
    };

    // Timeline Chart
    const timelineData = {
        labels: (missingPersons || []).map(person => person.lastSeen).sort(),
        datasets: [{
            label: 'Cases Over Time',
            data: (missingPersons || []).length,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    return (
        <div className={styles.dashboardSection}>
            <div className={styles.chartContainer}>
                <div className={styles.chartBox}>
                    <h3 className={styles.chartTitle}>Cases by Location</h3>
                    <Bar data={locationData} options={options} />
                </div>

                <div className={styles.chartBox}>
                    <h3 className={styles.chartTitle}>Match Success Rate</h3>
                    <Pie data={matchRateData} options={options} />
                </div>

                <div className={styles.chartBox}>
                    <h3 className={styles.chartTitle}>Cases Timeline</h3>
                    <Line data={timelineData} options={options} />
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
