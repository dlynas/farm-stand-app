import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ user, children }) {
  // If user is not authenticated, redirect to the sign-in page
  if (!user) {
    return <Navigate to="/signin" />;
  }

  // If user is authenticated, render the children components
  return children;
}

export default ProtectedRoute;
