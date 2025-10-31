import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Notifications from './Notifications';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <h2>🎉 EventHub</h2>
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/events" className="nav-link">Events</Link>
          </li>
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'organizer') && (
                <>
                  <li className="nav-item">
                    <Link to="/my-events" className="nav-link">My Events</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/create-event" className="nav-link">Create Event</Link>
                  </li>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <li className="nav-item">
                    <Link to="/user-management" className="nav-link">Manage Users</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/analytics" className="nav-link">Analytics</Link>
                  </li>
                </>
              )}
              {user.role !== 'admin' && (
                <li className="nav-item">
                  <Link to="/bookings" className="nav-link">My Bookings</Link>
                </li>
              )}
              <li className="nav-item">
                <Link to="/profile" className="nav-link">Profile</Link>
              </li>
              <li className="nav-item">
                <Notifications />
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-logout">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link">Login</Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link nav-register">Sign Up</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

