import React from 'react';
import '../styles/homepage.css';

function Homepage() {
    return (
        <div className="homepage-style"> {/* had to add, idk but css is cascading to login */}
            <div className="grid-container">
                <div className="col-1">
                    <h1>Welcome!</h1>
                    <hr />
                    <h2>Everything you</h2>
                    <h2>need for the</h2>
                    <h2>LSC elections</h2>
                    <p>ACADEMIC YEAR 2025-2026</p>
                </div>
                <div className="col-2">
                    <a href="/candidates" className="button">CANDIDATES</a>
                    <a href="/live-votes" className="button">LIVE VOTES</a>
                    <p className="admin-text">ARE YOU AN ADMIN? CLICK BELOW.</p>
                    <a href="/login" className="button">SIGN IN</a>
                </div>
            </div>
        </div>
    );
}

export default Homepage;
