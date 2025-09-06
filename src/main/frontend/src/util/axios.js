import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json',
    },
// Replace with your base API URL
});

// Add a request interceptor
// apiClient.interceptors.request.use(
//     (config) => {
//         const token = localStorage.getItem('token'); // Or use sessionStorage
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => Promise.reject(error)
// );

export default apiClient;
