// src/lib/errorMessages.ts
// Centralized error messages for consistent user communication

export const AUTH_ERRORS = {
  // Authentication errors
  SESSION_ERROR: 'Failed to get session',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
  
  // Authorization/Access errors
  NO_PROFILE: "Please contact an administrator to create your credentials or reset them.",
  PENDING_APPROVAL: "Your account is awaiting admin approval. Please contact the administrator.",
  INSUFFICIENT_PERMISSIONS: "Your account does not have sufficient permissions to access this page. Please contact the administrator.",
  LOGIN_REQUIRED: "Please log in to continue.",
}; 