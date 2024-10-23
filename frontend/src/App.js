// src/App.js
import React, { useEffect, useState } from 'react';
import { useLoadScript } from '@react-google-maps/api'; // Import useLoadScript for Google Maps API
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { onAuthStateChanged, signOut, RecaptchaVerifier } from 'firebase/auth';
import { auth } from './firebase';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import GenerateQrCode from './components/GenerateQrCode';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import Map from './components/Map';
import VendorDashboard from './components/VendorDashboard';
import ChangePassword from './components/ChangePassword';
import ProtectedRoute from './components/ProtectedRoute';
import AdjustStock from './components/AdjustStock';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [vendors, setVendors] = useState([]);
  const db = getFirestore();

  // Centralized Google Maps API loading
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'], // Include the 'places' library for autocomplete
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendorsCollection = collection(db, 'vendors');
        const vendorsSnapshot = await getDocs(vendorsCollection);
        const vendorsList = vendorsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setVendors(vendorsList);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };
    fetchVendors();
  }, [db]);

  // Initialize reCAPTCHA globally on App load
  useEffect(() => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          'recaptcha-container',
          {
            size: 'invisible',
            callback: (response) => {
              console.log('Global reCAPTCHA verification successful');
            },
            'expired-callback': () => {
              console.warn('Global reCAPTCHA expired, please try again.');
            },
          },
          auth
        );
        // Ensure appVerificationDisabledForTesting is available before setting it
        if (typeof window.recaptchaVerifier.appVerificationDisabledForTesting !== 'undefined') {
          window.recaptchaVerifier.appVerificationDisabledForTesting = true;
        }
      }
    } catch (error) {
      console.error('Error initializing global reCAPTCHA: ', error);
    }
  }, []);

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        alert('You have successfully signed out.');
      })
      .catch((error) => {
        console.error('Error signing out: ', error);
        alert('Error signing out.');
      });
  };

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading Google Maps...</div>;

  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            {user ? (
              <>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><button className="sign-out-button" onClick={handleSignOut}>Sign Out</button></li>
              </>
            ) : (
              <>
                <li><Link to="/signup">Sign Up</Link></li>
                <li><Link to="/signin">Sign In</Link></li>
              </>
            )}
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<Map key={Date.now()} vendors={vendors} isLoaded={isLoaded} />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <VendorDashboard user={user} isLoaded={isLoaded} />
              </ProtectedRoute>
            }
          />
          <Route path="/adjuststock/:vendorId" element={<AdjustStock />} />
          <Route path="/changepassword" element={<ChangePassword />} />
          <Route path="/generate-qrcode/:vendorId" element={<GenerateQrCode />} />
        </Routes>
        <div id="recaptcha-container"></div> {/* Ensure this div is globally accessible */}
      </div>
    </Router>
  );
}

export default App;
