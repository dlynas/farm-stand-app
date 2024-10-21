// src/components/ChangePassword.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import '../ChangePassword.css';

function ChangePassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
  
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent successfully. Please check your inbox.');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      setError(`Failed to send password reset email. Error: ${error.message}`);
    }
  };
  

  return (
    <div className="change-password-container">
      <h2>Change Password</h2>
      <form onSubmit={handlePasswordReset} className="change-password-form">
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="change-password-input"
          required
        />
        <button type="submit" className="change-password-button">
          Send Password Reset Email
        </button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default ChangePassword;
