import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Homepage from './webpages/homepage';
import Candidates from './webpages/candidates';
import LiveVotes from './webpages/live-votes';
import Admin from './webpages/admin';
import Login from './webpages/login';
import PrivateRoute from './utils/private-route';

import Voting from './attached_websites/voting/voting';
import Registration from './attached_websites/registration/registration';

import Navbar from './components/navbar';

function NavBar() {
    const location = useLocation(); // Get the current route
    const hideNavbarOn = ['/', '/voting', '/registration']; // Define routes where Navbar should not appear

    return (
        <>
            {!hideNavbarOn.includes(location.pathname) && <Navbar />}
        </>
    );
}

function App() {
    return (
        <Router>
            <NavBar />
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/candidates" element={<Candidates />} />
                <Route path="/live-votes" element={<LiveVotes />} />
                <Route path="/admin" element={
                    <PrivateRoute>
                        <Admin />
                    </PrivateRoute>
                } />
                <Route path="/login" element={<Login />} />

                <Route path="/voting" element={<Voting />} />
                <Route path="/registration/*" element={<Registration />} />
            </Routes>
        </Router>
    );
}

export default App;
