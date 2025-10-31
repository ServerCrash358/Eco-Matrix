// src/components/auth/DriverLogin.jsx
import React, { useState } from 'react';
import { signInWithRole, signUpWithRole, USER_ROLES } from '../../utils/roleBasedAuth';
import { useNavigate } from 'react-router-dom';
import '../../styles/auth.css';

const DriverLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [driverId, setDriverId] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithRole(email, password, USER_ROLES.DRIVER, {
          driverId: driverId,
          vehicleAssigned: false,
          routeAssigned: false
        });
        alert('Driver account created successfully!');
      } else {
        await signInWithRole(email, password, USER_ROLES.DRIVER);
      }
      navigate('/driver/dashboard');
    } catch (error) {
      alert(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card driver-card">
        <h2>🚛 Driver Portal</h2>
        <p>Collection crew access - Route management & tracking</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Driver Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {isSignUp && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Driver ID (e.g., DR001)"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                required
              />
            </div>
          )}
          
          <button type="submit" disabled={loading} className="btn-driver">
            {loading ? 'Logging in...' : (isSignUp ? 'Register Driver' : 'Start Shift')}
          </button>
        </form>
        
        <p className="toggle-auth">
          {isSignUp ? 'Already registered?' : 'New driver?'}{' '}
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="link-btn"
          >
            {isSignUp ? 'Login' : 'Register'}
          </button>
        </p>
        
        <div className="other-portals">
          <button onClick={() => navigate('/citizen/login')} className="btn-secondary">
            Citizen Portal
          </button>
          <button onClick={() => navigate('/admin/login')} className="btn-secondary">
            Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverLogin;
