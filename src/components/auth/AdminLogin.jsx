// src/components/auth/AdminLogin.jsx
import React, { useState } from 'react';
import { signInWithRole, signUpWithRole, USER_ROLES } from '../../utils/roleBasedAuth';
import { useNavigate } from 'react-router-dom';
import '../../styles/auth.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ADMIN_ACCESS_CODE = 'BBMP2024'; // In production, use environment variables

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (adminCode !== ADMIN_ACCESS_CODE) {
          throw new Error('Invalid admin access code');
        }
        await signUpWithRole(email, password, USER_ROLES.ADMIN, {
          department: 'BBMP',
          accessLevel: 'high'
        });
        alert('Admin account created successfully!');
      } else {
        await signInWithRole(email, password, USER_ROLES.ADMIN);
      }
      navigate('/admin/dashboard');
    } catch (error) {
      alert(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card admin-card">
        <h2>🛡️ Admin Portal</h2>
        <p>BBMP Officials Access - Secure Login Required</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Official Email"
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
                placeholder="Admin Access Code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                required
              />
            </div>
          )}
          
          <button type="submit" disabled={loading} className="btn-admin">
            {loading ? 'Authenticating...' : (isSignUp ? 'Create Admin Account' : 'Secure Login')}
          </button>
        </form>
        
        <p className="toggle-auth">
          {isSignUp ? 'Already have admin access?' : 'Need admin access?'}{' '}
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
          <button onClick={() => navigate('/driver/login')} className="btn-secondary">
            Driver Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
