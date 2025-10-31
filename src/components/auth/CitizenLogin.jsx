// src/components/auth/CitizenLogin.jsx
import React, { useState } from 'react';
import { signInWithRole, signUpWithRole, USER_ROLES } from '../../utils/roleBasedAuth';
import { useNavigate } from 'react-router-dom';
import '../../styles/auth.css';

const CitizenLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithRole(email, password, USER_ROLES.CITIZEN);
        alert('Account created successfully!');
      } else {
        await signInWithRole(email, password, USER_ROLES.CITIZEN);
      }
      navigate('/citizen/dashboard');
    } catch (error) {
      alert(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card citizen-card">
        <h2>🏠 Citizen Portal</h2>
        <p>Access waste collection schedules and report issues</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
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
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </form>
        
        <p className="toggle-auth">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="link-btn"
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
        
        <div className="other-portals">
          <button onClick={() => navigate('/admin/login')} className="btn-secondary">
            Admin Portal
          </button>
          <button onClick={() => navigate('/driver/login')} className="btn-secondary">
            Driver Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitizenLogin;
