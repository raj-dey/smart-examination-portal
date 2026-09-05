import toast from 'react-hot-toast';

/**
 * Translates Firebase Auth, Firestore, API, and general errors into 
 * human-readable, clear, and actionable messages.
 */
export const getCleanErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  let code = '';
  let message = '';

  if (typeof error === 'string') {
    message = error;
    // Extract Firebase error code if in format "Firebase: Error (auth/invalid-credential)."
    const codeMatch = error.match(/\((auth\/[a-z0-9-]+)\)/i) || error.match(/\((firestore\/[a-z0-9-]+)\)/i);
    if (codeMatch) {
      code = codeMatch[1];
    } else {
      code = error;
    }
  } else if (typeof error === 'object') {
    code = error.code || '';
    message = error.message || '';
  }

  // Firebase auth & other known error code mappings
  const errorMap = {
    // Auth errors
    'auth/invalid-credential': 'Incorrect email or password. Please check your credentials and try again.',
    'auth/user-not-found': 'No account exists with this email address. Please register a new account.',
    'auth/wrong-password': 'Incorrect password. If you forgot your password, please click "Forgot Password" to reset it.',
    'auth/email-already-in-use': 'An account with this email address already exists. Please login instead.',
    'auth/weak-password': 'Your password is too weak. It must be at least 6 characters long.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/network-request-failed': 'Network connection issue. Please check your internet connection and try again.',
    'auth/too-many-requests': 'Too many failed login attempts. Access to this account has been temporarily disabled. Please try again later or reset your password.',
    'auth/user-disabled': 'This account has been disabled by an administrator. Please contact support.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled before completion. Please try again.',
    'auth/popup-blocked': 'Sign-in popup was blocked by your browser. Please allow popups for this site.',
    'auth/operation-not-allowed': 'This sign-in option is currently disabled.',
    'auth/requires-recent-login': 'For security, please sign out and log back in before doing this action.',
    'auth/unauthorized-domain': 'This website domain is not authorized in Firebase Console! Go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add your domain.',
        
    // Firestore errors
    'permission-denied': 'Access Denied: You do not have permission to perform this action.',
    'unavailable': 'Database is temporarily offline. Please check your network connection.',
    'deadline-exceeded': 'The request timed out. Please try again.',
  };

  if (errorMap[code]) {
    return errorMap[code];
  }

  // Substring checks for fallback
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('invalid-credential') || lowerMsg.includes('auth/invalid-credential')) {
    return 'Incorrect email or password. Please verify your details and try again.';
  }
  if (lowerMsg.includes('user-not-found') || lowerMsg.includes('auth/user-not-found')) {
    return 'No account exists with this email address.';
  }
  if (lowerMsg.includes('wrong-password') || lowerMsg.includes('auth/wrong-password')) {
    return 'Incorrect password. If you forgot it, click "Forgot Password".';
  }
  if (lowerMsg.includes('email-already-in-use') || lowerMsg.includes('auth/email-already-in-use')) {
    return 'An account with this email address already exists. Please login instead.';
  }
  if (lowerMsg.includes('weak-password') || lowerMsg.includes('auth/weak-password')) {
    return 'Password is too weak. It must be at least 6 characters.';
  }
  if (lowerMsg.includes('network-request-failed') || lowerMsg.includes('network error') || lowerMsg.includes('failed to fetch')) {
    return 'Network connection issue. Please check your internet connection.';
  }
  if (lowerMsg.includes('permission-denied') || lowerMsg.includes('permission_denied') || lowerMsg.includes('insufficient permissions')) {
    return 'Access Denied: You do not have permission to perform this action.';
  }
  if (lowerMsg.includes('quota-exceeded')) {
    return 'Database request quota exceeded. Please try again later.';
  }
  if (lowerMsg.includes('missing-gemini-api-key')) {
    return 'Gemini API Key is missing. Please configure VITE_GEMINI_API_KEY in your env settings.';
  }

  // Cleanup Firebase prefix
  return message.replace(/^Firebase:\s*/, '');
};

// Callable main function object to match import toast from 'react-hot-toast'
const customToast = (message, options) => {
  return toast(message, options);
};

// Map all key react-hot-toast methods onto customToast
customToast.error = (error, options = {}) => {
  const cleanMessage = getCleanErrorMessage(error);
  return toast.error(cleanMessage, options);
};

customToast.success = (message, options = {}) => {
  return toast.success(message, options);
};

customToast.loading = (message, options = {}) => {
  return toast.loading(message, options);
};

customToast.dismiss = (id) => {
  return toast.dismiss(id);
};

customToast.custom = (message, options) => {
  return toast.custom(message, options);
};

export default customToast;
