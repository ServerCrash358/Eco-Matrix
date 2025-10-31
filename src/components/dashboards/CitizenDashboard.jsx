// src/components/dashboards/CitizenDashboard.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CitizenDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🏠 Citizen Dashboard</h1>
        <div>
          <span>Welcome, {user.email}</span>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </header>
      
      <div className="dashboard-content">
        <div className="feature-grid">
          <div className="feature-card">
            <h3>📅 Collection Schedule</h3>
            <p>View your area's waste collection schedule</p>
            <button className="btn-primary">View Schedule</button>
          </div>
          
          <div className="feature-card">
            <h3>📋 Report Issue</h3>
            <p>Report missed pickups or overflowing bins</p>
            <button className="btn-primary">Report Issue</button>
          </div>
          
          <div className="feature-card">
            <h3>🔔 Notifications</h3>
            <p>Get alerts about collection changes</p>
            <button className="btn-primary">View Notifications</button>
          </div>
          
          <div className="feature-card">
            <h3>♻️ Recycling Info</h3>
            <p>Learn about proper waste segregation</p>
            <button className="btn-primary">Learn More</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
