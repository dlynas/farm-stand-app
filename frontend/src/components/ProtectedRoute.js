import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ user, children }) {
  // Fetch user from localStorage if not in props
  const storedUser = localStorage.getItem('user');
  const authenticatedUser = user || (storedUser ? JSON.parse(storedUser) : null);

  if (!authenticatedUser) {
    // If user is not authenticated, redirect to the sign-in page
    return <Navigate to="/signin" />;
  }

  // If user is authenticated, render the children components
  return children;
}

export default ProtectedRoute;
