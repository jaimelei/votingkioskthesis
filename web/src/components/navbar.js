import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConfirmCard from "../components/confirm-card";
import '../styles/navbar.css';

function Navbar() {
    const location = useLocation();
    const [showConfirmCard, setShowConfirmCard] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false); // State for mobile menu

    const isAdminPage = location.pathname.startsWith('/admin');

    const handleLogoutClick = () => {
        setShowConfirmCard(true);
    };

    const handleCloseCard = () => {
        setShowConfirmCard(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        window.location.href = '/'; 
    };

    // Toggle the mobile menu
    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="logo-placeholder">LOGO</div>

                {/* Hamburger Menu Button for Mobile */}
                <div className="hamburger" onClick={toggleMenu}>
                    <div className={`bar ${menuOpen ? "open" : ""}`}></div>
                    <div className={`bar ${menuOpen ? "open" : ""}`}></div>
                    <div className={`bar ${menuOpen ? "open" : ""}`}></div>
                </div>
            </div>

            {/* Navbar Links */}
            <div className={`nav-links ${menuOpen ? "show" : ""}`}>
                <Link to="/candidates" className="nav-link" onClick={toggleMenu}>Candidates</Link>
                <Link to="/live-votes" className="nav-link" onClick={toggleMenu}>Live Votes</Link>

                {/* Admin Section (Only Show in Mobile) */}
                <div className="mobile-admin">
                    <span className="admin-text">Are you an admin?</span>
                    {isAdminPage ? (
                        <>
                            <button className="nav-link logout-button" onClick={handleLogoutClick}>Logout</button>
                            {showConfirmCard && (
                                <ConfirmCard
                                    heading="Confirmation"
                                    body="You will be logged out, do you wish to proceed?"
                                    onClose={handleCloseCard}
                                    onConfirm={handleLogout}
                                />
                            )}
                        </>
                    ) : (
                        <Link to="/admin" className="nav-link" onClick={toggleMenu}>Sign In</Link>
                    )}
                </div>
            </div>

            {/* Desktop Admin Section (Hidden in Mobile) */}
            <div className="navbar-right desktop-only">
                <span className="admin-text">Are you an admin?</span>
                {isAdminPage ? (
                    <>
                        <button className="nav-link logout-button" onClick={handleLogoutClick}>Logout</button>
                        {showConfirmCard && (
                            <ConfirmCard
                                heading="Confirmation"
                                body="You will be logged out, do you wish to proceed?"
                                onClose={handleCloseCard}
                                onConfirm={handleLogout}
                            />
                        )}
                    </>
                ) : (
                    <Link to="/admin" className="nav-link">Sign In</Link>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
