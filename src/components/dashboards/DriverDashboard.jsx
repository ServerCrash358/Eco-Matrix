// src/components/dashboards/DriverDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  addDoc, 
  onSnapshot 
} from 'firebase/firestore';
import '../../styles/dashboard.css';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const [driverProfile, setDriverProfile] = useState(null);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [emergencyBins, setEmergencyBins] = useState([]);
  const [routineBins, setRoutineBins] = useState([]);
  const [truckCapacity, setTruckCapacity] = useState({ current: 0, max: 100 });
  const [activeTab, setActiveTab] = useState('route');
  const [loading, setLoading] = useState(true);

  // Google Maps API key - Add this to your environment variables
  const GOOGLE_MAPS_API_KEY = 'AIzaSyB0aeomY18baeWs8plXyFczQE6BTl4C1uE';

  useEffect(() => {
    fetchDriverData();
    
    // Listen for emergency bin alerts
    const emergencyQuery = query(
      collection(db, 'bins'),
      where('fillLevel', '>', 85),
      where('status', '==', 'overflow')
    );
    
    const unsubscribe = onSnapshot(emergencyQuery, (snapshot) => {
      const emergencyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmergencyBins(emergencyData);
      
      if (emergencyData.length > 0) {
        generateEmergencyRoute(emergencyData);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const fetchDriverData = async () => {
    try {
      // Get driver profile
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', user.email)
      );
      const userSnapshot = await getDocs(usersQuery);
      
      if (!userSnapshot.empty) {
        const profile = userSnapshot.docs[0].data();
        setDriverProfile({ id: userSnapshot.docs[0].id, ...profile });
        
        // Get assigned route
        const routeQuery = query(
          collection(db, 'routes'),
          where('assignedDriver', '==', userSnapshot.docs[0].id),
          where('status', 'in', ['assigned', 'in-progress'])
        );
        const routeSnapshot = await getDocs(routeQuery);
        
        if (!routeSnapshot.empty) {
          setCurrentRoute({ id: routeSnapshot.docs[0].id, ...routeSnapshot.docs[0].data() });
        }
      }
      
      // Get routine bins for regular collection
      const routineBinsQuery = query(
        collection(db, 'bins'),
        where('nextScheduledPickup', '<=', new Date())
      );
      const routineBinsSnapshot = await getDocs(routineBinsQuery);
      const routineData = routineBinsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRoutineBins(routineData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching driver data:', error);
      setLoading(false);
    }
  };

  const generateEmergencyRoute = async (emergencyBins) => {
    const routeData = {
      type: 'emergency',
      assignedDriver: driverProfile?.id,
      bins: emergencyBins.map(bin => ({
        id: bin.id,
        location: bin.location,
        priority: 'critical',
        fillLevel: bin.fillLevel
      })),
      status: 'assigned',
      createdAt: new Date(),
      estimatedDuration: calculateRouteDuration(emergencyBins)
    };

    // Use routing algorithm to optimize bin collection order
    routeData.optimizedOrder = await optimizeRoute(emergencyBins);
    
    const routeRef = await addDoc(collection(db, 'routes'), routeData);
    setCurrentRoute({ id: routeRef.id, ...routeData });
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Emergency Route Assigned', {
        body: `${emergencyBins.length} overflowing bins require immediate attention`,
        icon: '/bin-icon.png'
      });
    }
  };

  const optimizeRoute = async (bins) => {
    // Simple optimization: sort by fill level (highest first) and proximity
    // In production, use Google Maps Directions API for optimal routing
    const sorted = bins.sort((a, b) => b.fillLevel - a.fillLevel);
    return sorted.map((bin, index) => ({
      order: index + 1,
      binId: bin.id,
      estimatedTime: index * 15, // 15 minutes per bin
      coordinates: bin.coordinates || { lat: 0, lng: 0 }
    }));
  };

  const calculateRouteDuration = (bins) => {
    // Estimate 15 minutes per bin + 10 minutes travel between bins
    return bins.length * 25; // in minutes
  };

  const startRoute = async () => {
    if (currentRoute) {
      await updateDoc(doc(db, 'routes', currentRoute.id), {
        status: 'in-progress',
        startedAt: new Date()
      });
      setCurrentRoute({ ...currentRoute, status: 'in-progress' });
    }
  };

  const completeBinPickup = async (binId) => {
    try {
      // Update bin status
      await updateDoc(doc(db, 'bins', binId), {
        fillLevel: 0,
        lastPickup: new Date(),
        status: 'collected'
      });
      
      // Update truck capacity
      const binWeight = 50; // Estimate 50kg per bin
      setTruckCapacity(prev => ({
        ...prev,
        current: Math.min(prev.current + binWeight, prev.max)
      }));
      
      // Record pickup in route
      if (currentRoute) {
        const updatedBins = currentRoute.bins.map(bin => 
          bin.id === binId ? { ...bin, status: 'collected', collectedAt: new Date() } : bin
        );
        
        await updateDoc(doc(db, 'routes', currentRoute.id), {
          bins: updatedBins
        });
        
        setCurrentRoute({ ...currentRoute, bins: updatedBins });
      }
      
      // Check if truck is near capacity (80%)
      if (truckCapacity.current + binWeight >= truckCapacity.max * 0.8) {
        alert('Truck capacity at 80%. Consider heading to disposal facility.');
      }
      
    } catch (error) {
      console.error('Error completing pickup:', error);
    }
  };

  const navigateToDisposal = () => {
    const disposalFacility = {
      name: 'Bangalore Waste Processing Center',
      address: 'Bellahalli, Bangalore',
      coordinates: { lat: 13.0358, lng: 77.6431 }
    };
    
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${disposalFacility.coordinates.lat},${disposalFacility.coordinates.lng}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  const unloadAtDisposal = async () => {
    // Reset truck capacity
    setTruckCapacity(prev => ({ ...prev, current: 0 }));
    
    // Log disposal activity
    await addDoc(collection(db, 'disposalLogs'), {
      driverId: driverProfile?.id,
      routeId: currentRoute?.id,
      weight: truckCapacity.current,
      timestamp: new Date(),
      facility: 'Bangalore Waste Processing Center'
    });
    
    alert('Waste successfully disposed. Truck capacity reset.');
  };

  const completeRoute = async () => {
    if (currentRoute) {
      await updateDoc(doc(db, 'routes', currentRoute.id), {
        status: 'completed',
        completedAt: new Date()
      });
      setCurrentRoute(null);
      alert('Route completed successfully!');
    }
  };

  const openGoogleMapsNavigation = (destination) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  if (loading) {
    return <div className="loading">Loading Driver Dashboard...</div>;
  }

  return (
    <div className="driver-dashboard">
      <header className="dashboard-header driver-header">
        <div className="header-left">
          <h1>🚛 Driver Dashboard</h1>
          <p>Driver: {driverProfile?.driverId} | {user.email}</p>
        </div>
        <div className="header-right">
          <div className="truck-status">
            <span>Capacity: {truckCapacity.current}/{truckCapacity.max}kg</span>
            <div className="capacity-bar">
              <div 
                className="capacity-fill" 
                style={{width: `${(truckCapacity.current/truckCapacity.max)*100}%`}}
              ></div>
            </div>
          </div>
          <button onClick={logout} className="btn-logout">End Shift</button>
        </div>
      </header>

      <div className="dashboard-tabs">
        {['route', 'emergency', 'routine', 'navigation'].map(tab => (
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
        {activeTab === 'route' && (
          <div className="route-section">
            <h2>Current Route</h2>
            
            {currentRoute ? (
              <div className="route-card">
                <div className="route-header">
                  <h3>Route #{currentRoute.id.slice(-6)}</h3>
                  <span className={`status-badge ${currentRoute.status}`}>
                    {currentRoute.status}
                  </span>
                </div>
                
                <div className="route-details">
                  <p><strong>Type:</strong> {currentRoute.type}</p>
                  <p><strong>Bins to collect:</strong> {currentRoute.bins?.length || 0}</p>
                  <p><strong>Estimated duration:</strong> {currentRoute.estimatedDuration} minutes</p>
                </div>
                
                <div className="route-actions">
                  {currentRoute.status === 'assigned' && (
                    <button className="btn-primary" onClick={startRoute}>
                      Start Route
                    </button>
                  )}
                  
                  {currentRoute.status === 'in-progress' && (
                    <>
                      <button 
                        className="btn-warning" 
                        onClick={navigateToDisposal}
                      >
                        🏭 Go to Disposal
                      </button>
                      <button 
                        className="btn-success" 
                        onClick={completeRoute}
                      >
                        Complete Route
                      </button>
                    </>
                  )}
                </div>
                
                <div className="bins-list">
                  <h4>Bins in Route:</h4>
                  {currentRoute.bins?.map(bin => (
                    <div key={bin.id} className={`bin-item ${bin.status}`}>
                      <div className="bin-info">
                        <span>Bin #{bin.id}</span>
                        <span>Fill: {bin.fillLevel}%</span>
                        <span>{bin.location}</span>
                      </div>
                      <div className="bin-actions">
                        <button 
                          className="btn-small"
                          onClick={() => openGoogleMapsNavigation(bin.coordinates)}
                        >
                          🧭 Navigate
                        </button>
                        {bin.status !== 'collected' && (
                          <button 
                            className="btn-small btn-success"
                            onClick={() => completeBinPickup(bin.id)}
                          >
                            ✅ Collected
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-route">
                <p>No active route assigned. Check emergency or routine collections.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="emergency-section">
            <h2>🚨 Emergency Collections</h2>
            <p>Critical bins requiring immediate attention</p>
            
            {emergencyBins.length > 0 ? (
              <div className="emergency-bins">
                {emergencyBins.map(bin => (
                  <div key={bin.id} className="emergency-bin-card">
                    <div className="bin-header">
                      <h4>🔴 Critical Bin #{bin.id}</h4>
                      <span className="fill-level">{bin.fillLevel}% Full</span>
                    </div>
                    <div className="bin-details">
                      <p><strong>Location:</strong> {bin.location}</p>
                      <p><strong>Type:</strong> Overflow Alert</p>
                      <p><strong>Priority:</strong> URGENT</p>
                    </div>
                    <div className="bin-actions">
                      <button 
                        className="btn-danger"
                        onClick={() => openGoogleMapsNavigation(bin.coordinates)}
                      >
                        🧭 Navigate Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-emergencies">
                <p>✅ No emergency collections at this time</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'routine' && (
          <div className="routine-section">
            <h2>📅 Scheduled Collections</h2>
            <p>Regular pickup route for today</p>
            
            <div className="routine-bins">
              {routineBins.map(bin => (
                <div key={bin.id} className="routine-bin-card">
                  <div className="bin-info">
                    <h4>Bin #{bin.id}</h4>
                    <p>Fill Level: {bin.fillLevel}%</p>
                    <p>Location: {bin.location}</p>
                    <p>Scheduled: {bin.nextScheduledPickup ? new Date(bin.nextScheduledPickup.seconds * 1000).toLocaleString() : 'Today'}</p>
                  </div>
                  <div className="bin-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => openGoogleMapsNavigation(bin.coordinates)}
                    >
                      🧭 Navigate
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => completeBinPickup(bin.id)}
                    >
                      ✅ Collect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'navigation' && (
          <div className="navigation-section">
            <h2>🗺️ Navigation & GPS</h2>
            
            <div className="navigation-tools">
              <div className="disposal-navigation">
                <h3>🏭 Waste Disposal Facilities</h3>
                <div className="disposal-card">
                  <h4>Bangalore Waste Processing Center</h4>
                  <p>📍 Bellahalli, Bangalore</p>
                  <p>⏰ Open 6:00 AM - 10:00 PM</p>
                  <div className="disposal-actions">
                    <button 
                      className="btn-primary"
                      onClick={navigateToDisposal}
                    >
                      🧭 Navigate to Disposal
                    </button>
                    <button 
                      className="btn-success"
                      onClick={unloadAtDisposal}
                    >
                      📦 Record Unload
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="capacity-management">
                <h3>🚛 Truck Management</h3>
                <div className="capacity-status">
                  <p>Current Load: {truckCapacity.current}kg / {truckCapacity.max}kg</p>
                  <div className="capacity-indicator">
                    <div 
                      className={`capacity-bar ${truckCapacity.current >= truckCapacity.max * 0.8 ? 'critical' : 'normal'}`}
                    >
                      <div 
                        className="capacity-fill"
                        style={{width: `${(truckCapacity.current/truckCapacity.max)*100}%`}}
                      ></div>
                    </div>
                  </div>
                  {truckCapacity.current >= truckCapacity.max * 0.8 && (
                    <p className="capacity-warning">⚠️ Approaching capacity limit</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
