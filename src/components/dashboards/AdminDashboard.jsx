// src/components/dashboards/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import '../../styles/dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [bins, setBins] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time data fetching
  useEffect(() => {
    const unsubscribes = [];

    // Listen to bins collection
    const binsQuery = collection(db, 'bins');
    unsubscribes.push(
      onSnapshot(binsQuery, (snapshot) => {
        const binsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBins(binsData);
        setLoading(false);
      })
    );

    // Listen to complaints
    const complaintsQuery = query(
      collection(db, 'complaints'), 
      orderBy('createdAt', 'desc')
    );
    unsubscribes.push(
      onSnapshot(complaintsQuery, (snapshot) => {
        const complaintsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComplaints(complaintsData);
      })
    );

    // Listen to users (drivers and citizens)
    const usersQuery = collection(db, 'users');
    unsubscribes.push(
      onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const driversData = usersData.filter(user => user.role === 'driver');
        const citizensData = usersData.filter(user => user.role === 'citizen');
        
        setDrivers(driversData);
        setCitizens(citizensData);
      })
    );

    // Listen to routes
    const routesQuery = collection(db, 'routes');
    unsubscribes.push(
      onSnapshot(routesQuery, (snapshot) => {
        const routesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRoutes(routesData);
      })
    );

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const generateReport = async (type) => {
    const reportData = {
      type,
      generatedAt: new Date(),
      generatedBy: user.email,
      data: {}
    };

    switch (type) {
      case 'weekly':
        reportData.data = {
          totalBins: bins.length,
          overflowingBins: bins.filter(bin => bin.fillLevel > 80).length,
          completedPickups: routes.filter(route => route.status === 'completed').length,
          pendingComplaints: complaints.filter(c => c.status === 'pending').length
        };
        break;
      case 'monthly':
        reportData.data = {
          wasteCollected: bins.reduce((sum, bin) => sum + (bin.lastPickupWeight || 0), 0),
          recyclingRate: calculateRecyclingRate(),
          driverEfficiency: calculateDriverEfficiency(),
          citizenEngagement: citizens.length
        };
        break;
    }

    await addDoc(collection(db, 'reports'), reportData);
    alert(`${type} report generated successfully!`);
  };

  const calculateRecyclingRate = () => {
    const totalWaste = bins.reduce((sum, bin) => sum + (bin.totalWaste || 0), 0);
    const recyclableWaste = bins.reduce((sum, bin) => sum + (bin.recyclableWaste || 0), 0);
    return totalWaste > 0 ? ((recyclableWaste / totalWaste) * 100).toFixed(1) : 0;
  };

  const calculateDriverEfficiency = () => {
    const completedRoutes = routes.filter(route => route.status === 'completed');
    const totalRoutes = routes.length;
    return totalRoutes > 0 ? ((completedRoutes.length / totalRoutes) * 100).toFixed(1) : 0;
  };

  const updateBinStatus = async (binId, newStatus) => {
    await updateDoc(doc(db, 'bins', binId), { status: newStatus });
  };

  const assignDriverToRoute = async (routeId, driverId) => {
    await updateDoc(doc(db, 'routes', routeId), { 
      assignedDriver: driverId,
      assignedAt: new Date(),
      status: 'assigned'
    });
  };

  const resolveComplaint = async (complaintId) => {
    await updateDoc(doc(db, 'complaints', complaintId), { 
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy: user.email
    });
  };

  const createServiceZone = async (zoneData) => {
    await addDoc(collection(db, 'serviceZones'), {
      ...zoneData,
      createdAt: new Date(),
      createdBy: user.email
    });
  };

  if (loading) {
    return <div className="loading">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header admin-header">
        <div className="header-left">
          <h1>🛡️ BBMP Admin Dashboard</h1>
          <p>Welcome, {user.email}</p>
        </div>
        <div className="header-right">
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="dashboard-tabs">
        {['overview', 'bins', 'routes', 'drivers', 'complaints', 'reports', 'zones'].map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card critical">
                <h3>Overflowing Bins</h3>
                <div className="stat-number">
                  {bins.filter(bin => bin.fillLevel > 80).length}
                </div>
                <p>Require immediate attention</p>
              </div>
              
              <div className="stat-card warning">
                <h3>Pending Complaints</h3>
                <div className="stat-number">
                  {complaints.filter(c => c.status === 'pending').length}
                </div>
                <p>Citizens waiting for response</p>
              </div>
              
              <div className="stat-card success">
                <h3>Active Drivers</h3>
                <div className="stat-number">
                  {drivers.filter(d => d.status === 'active').length}
                </div>
                <p>Currently on routes</p>
              </div>
              
              <div className="stat-card info">
                <h3>Total Bins</h3>
                <div className="stat-number">{bins.length}</div>
                <p>Monitored smart bins</p>
              </div>
            </div>

            <div className="live-map-section">
              <h3>🗺️ Live GIS Map</h3>
              <div className="map-container">
                <div className="map-placeholder">
                  <p>Interactive GIS Map showing:</p>
                  <ul>
                    <li>🔴 Critical bins (80%+ full)</li>
                    <li>🟡 Medium bins (50-79% full)</li>
                    <li>🟢 Low bins (&lt;50% full)</li>
                    <li>🚛 Active collection trucks</li>
                  </ul>
                  <button className="btn-primary">View Full Map</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bins' && (
          <div className="bins-section">
            <div className="section-header">
              <h2>Smart Bin Management</h2>
              <button className="btn-primary" onClick={() => window.location.reload()}>
                Refresh Data
              </button>
            </div>
            
            <div className="bins-grid">
              {bins.map(bin => (
                <div key={bin.id} className={`bin-card ${bin.fillLevel > 80 ? 'critical' : bin.fillLevel > 50 ? 'warning' : 'normal'}`}>
                  <div className="bin-header">
                    <h4>Bin #{bin.id}</h4>
                    <span className={`status-badge ${bin.status || 'active'}`}>
                      {bin.status || 'Active'}
                    </span>
                  </div>
                  
                  <div className="bin-details">
                    <div className="fill-level">
                      <label>Fill Level: {bin.fillLevel}%</label>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{width: `${bin.fillLevel}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="bin-info">
                      <p><strong>Location:</strong> {bin.location || 'Not set'}</p>
                      <p><strong>Type:</strong> {bin.type || 'Mixed'}</p>
                      <p><strong>Last Update:</strong> {bin.lastUpdate ? new Date(bin.lastUpdate.seconds * 1000).toLocaleString() : 'Never'}</p>
                    </div>
                  </div>
                  
                  <div className="bin-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => updateBinStatus(bin.id, 'maintenance')}
                    >
                      Maintenance
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => updateBinStatus(bin.id, 'active')}
                    >
                      Activate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="drivers-section">
            <h2>Driver Management</h2>
            
            <div className="drivers-list">
              {drivers.map(driver => (
                <div key={driver.id} className="driver-card">
                  <div className="driver-info">
                    <h4>{driver.email}</h4>
                    <p>Driver ID: {driver.driverId}</p>
                    <p>Status: <span className={`status ${driver.status || 'inactive'}`}>{driver.status || 'Inactive'}</span></p>
                    <p>Current Route: {driver.currentRoute || 'None assigned'}</p>
                  </div>
                  
                  <div className="driver-actions">
                    <select onChange={(e) => assignDriverToRoute(e.target.value, driver.id)}>
                      <option value="">Assign Route</option>
                      {routes.filter(r => !r.assignedDriver).map(route => (
                        <option key={route.id} value={route.id}>
                          Route #{route.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="complaints-section">
            <h2>Citizen Complaints</h2>
            
            <div className="complaints-list">
              {complaints.map(complaint => (
                <div key={complaint.id} className={`complaint-card ${complaint.status}`}>
                  <div className="complaint-header">
                    <h4>Complaint #{complaint.id.slice(-6)}</h4>
                    <span className={`status-badge ${complaint.status}`}>
                      {complaint.status}
                    </span>
                  </div>
                  
                  <div className="complaint-details">
                    <p><strong>Type:</strong> {complaint.type}</p>
                    <p><strong>Location:</strong> {complaint.location}</p>
                    <p><strong>Description:</strong> {complaint.description}</p>
                    <p><strong>Reported:</strong> {new Date(complaint.createdAt.seconds * 1000).toLocaleString()}</p>
                  </div>
                  
                  {complaint.status === 'pending' && (
                    <div className="complaint-actions">
                      <button 
                        className="btn-primary"
                        onClick={() => resolveComplaint(complaint.id)}
                      >
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <h2>Analytics & Reports</h2>
            
            <div className="report-actions">
              <button 
                className="btn-primary"
                onClick={() => generateReport('weekly')}
              >
                Generate Weekly Report
              </button>
              <button 
                className="btn-primary"
                onClick={() => generateReport('monthly')}
              >
                Generate Monthly Report
              </button>
            </div>
            
            <div className="analytics-cards">
              <div className="analytics-card">
                <h3>Recycling Rate</h3>
                <div className="metric">{calculateRecyclingRate()}%</div>
              </div>
              
              <div className="analytics-card">
                <h3>Driver Efficiency</h3>
                <div className="metric">{calculateDriverEfficiency()}%</div>
              </div>
              
              <div className="analytics-card">
                <h3>Total Citizens</h3>
                <div className="metric">{citizens.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
