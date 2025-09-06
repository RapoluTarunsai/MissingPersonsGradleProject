import React, { useState } from 'react';
import {BrowserRouter as Router, Route, Routes, Navigate, useLocation} from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Signup from './components/Signup';
import Login from './components/Login';
import MissingPersons from './components/MissingPersons';
import MissingPersonDetails from './components/MissingPersonDetails';
import UserProfile from "./components/UserProfile";
import ReportedPersons from "./components/ReportedPersons";
import UpdateMissingPerson from "./components/UpdateMissingPerson";
import MatchApproval from "./components/MatchedApproval";
import MatchedPersons from "./components/MatchedPersons";
import AddMissingPersonNew from "./components/AddMissingPersonNew";
import DashboardCharts from "./components/DashboardCharts";
import SuccessStories from "./components/SuccessStories";
import DeveloperInfo from "./components/DeveloperInfo";
import DiscussionUserProfile from "./components/DiscussionUserProfile";
function AppContent() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('isAuthenticated') === 'true';
    });
    const [refreshKey, setRefreshKey] = useState(0);
    const location = useLocation();
    const publicRoutes = ['/', '/login', '/signup'];
    const showNavbar = isAuthenticated && !publicRoutes.includes(location.pathname);
    const [showDeveloperInfo, setShowDeveloperInfo] = useState(false);

    const handleAuthentication = (status) => {
        setIsAuthenticated(status);
        localStorage.setItem('isAuthenticated', status);
    };

    const triggerRefresh = () => {
        setRefreshKey(prevKey => prevKey + 1);
    };
    const toggleDeveloperInfo = () => {
        setShowDeveloperInfo(!showDeveloperInfo);
    };
    return (
        <div className="App">
            {showNavbar && (
                <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={handleAuthentication}  onShowDevelopers={toggleDeveloperInfo}/>
            )}
            {showDeveloperInfo && (
                <div className="developer-modal">
                    <div className="modal-content">
                        <span
                            className="close-button"
                            onClick={toggleDeveloperInfo}
                        >
                            &times;
                        </span>
                        <DeveloperInfo />
                    </div>
                </div>
            )}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login setIsAuthenticated={handleAuthentication} />} />
                <Route path="/missing-persons/:id" element={<MissingPersonDetails />} />
                <Route path="/missing-persons" element={<PrivateRoute isAuthenticated={isAuthenticated}><MissingPersons /></PrivateRoute>} />
                <Route path="/missing-persons/reported-persons" element={<PrivateRoute isAuthenticated={isAuthenticated}><ReportedPersons refreshKey={refreshKey}/></PrivateRoute>} />
                <Route path="/missing-persons/reported-persons/:id" element={<PrivateRoute isAuthenticated={isAuthenticated}><UpdateMissingPerson /></PrivateRoute>} />
                <Route path="/missing-persons/add" element={<PrivateRoute isAuthenticated={isAuthenticated}><AddMissingPersonNew /></PrivateRoute>} />
                <Route path="/missing-persons/:id" element={<PrivateRoute isAuthenticated={isAuthenticated}><MissingPersonDetails /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute isAuthenticated={isAuthenticated}><UserProfile /></PrivateRoute>} />
                <Route path="/user-profile/:userId" element={<PrivateRoute isAuthenticated={isAuthenticated}><DiscussionUserProfile /></PrivateRoute>} />

                <Route
                    path="/reported-persons/matched/:id"
                    element={
                        <PrivateRoute isAuthenticated={isAuthenticated}>
                            <MatchApproval triggerRefresh={triggerRefresh} />
                        </PrivateRoute>
                    }
                />
                <Route path="/matched" element={<PrivateRoute isAuthenticated={isAuthenticated}><MatchedPersons /></PrivateRoute>} />
                <Route path="/success-stories" element={
                    <PrivateRoute isAuthenticated={isAuthenticated}>
                        <SuccessStories />
                    </PrivateRoute>
                } />
                <Route path="/dashboard" element={<PrivateRoute isAuthenticated={isAuthenticated}><DashboardCharts /></PrivateRoute>} />
                </Routes>
        </div>
    );
}

const PrivateRoute = ({ children, isAuthenticated }) => {
    const location = useLocation();
    const checkAuth = () => {
        const sessionAuth = sessionStorage.getItem('isAuthenticated');
        return  isAuthenticated || sessionAuth === 'true';
    };

    return checkAuth() ?
        children :
        <Navigate to="/" state={{ from: location }} replace />;
};
const modalStyles = `
.developer-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 20px;
    border-radius: 10px;
    width: 80%;
    max-width: 600px;
    max-height: 80%;
    overflow-y: auto;
    position: relative;
}

.close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 24px;
    cursor: pointer;
}
`;

const styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = modalStyles
document.head.appendChild(styleSheet)
function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
