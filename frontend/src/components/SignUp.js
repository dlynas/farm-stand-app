// src/components/SignUp.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../Auth.css';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate(); // Hook for navigation

  // Handle Sign Up with Email
  const handleSignUpWithEmail = async (e) => {
    e.preventDefault();

    // Check if passwords match
    if (password !== confirmPassword) {
      alert('Passwords do not match. Please try again.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);
      alert('Verification email sent. Please check your inbox.');

      // Log the user out to prevent unauthorized access
      await auth.signOut();

      // Redirect to the sign-in page after successful sign-up and logout
      navigate('/signin');
    } catch (error) {
      console.error('Error signing up: ', error);
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Vendor Sign Up</h2>
      <form onSubmit={handleSignUpWithEmail}>
        <input
          type="text"
          className="auth-input"
          placeholder="Vendor Name"
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
          required
        />
        <input
          type="email"
          className="auth-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="auth-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="auth-input"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" className="auth-button">Sign Up</button>
      </form>
    </div>
  );
}

export default SignUp;
