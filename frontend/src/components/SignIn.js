// src/components/SignIn.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../Auth.css';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Handle Sign In with Email
  const handleSignInWithEmail = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Signed in successfully with email!');
      navigate('/dashboard'); // Redirect to dashboard on successful sign-in
    } catch (error) {
      console.error('Error signing in with email: ', error);
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Vendor Sign In</h2>
      <form onSubmit={handleSignInWithEmail}>
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
        <button type="submit" className="auth-button">Sign In</button>
      </form>
    </div>
  );
}

export default SignIn;
